import { Types } from "mongoose";
import { withTransaction } from "@/lib/db-core";
import { hotelToday, nightsBetween, parseDateString, toDateString, type DateString } from "@/lib/dates";
import { generateReferenceCode } from "@/lib/reference-code";
import { Booking, type BookingDoc } from "@/models/booking";
import { Room } from "@/models/room";
import { RoomType } from "@/models/room-type";
import {
  ACTIVE_BOOKING_STATUSES,
  type BookingDTO,
  type BookingStatus,
  type PaymentStatus,
} from "@/types/booking";
import { findFreeRooms } from "./availability.service";

/**
 * Booking Module (System Module 5).
 * Independent of Next.js so it can be tested directly, including under
 * concurrency. Callers must authorise the user and validate input with Zod.
 */

// ─── Errors ──────────────────────────────────────────────────────────

export type BookingFailureReason =
  | "room_type_unavailable" // not found or inactive
  | "too_many_guests"
  | "no_rooms_available";

const FAILURE_MESSAGES: Record<BookingFailureReason, string> = {
  room_type_unavailable: "This room type is no longer available for booking.",
  too_many_guests: "This room type cannot hold that many guests.",
  no_rooms_available:
    "Sorry, there are no rooms of this type left for these dates. Please try other dates or another room type.",
};

/** Thrown inside the transaction to abort it with a business reason. */
class BookingFailure extends Error {
  constructor(readonly reason: BookingFailureReason) {
    super(FAILURE_MESSAGES[reason]);
  }
}

// ─── Mapping ─────────────────────────────────────────────────────────

type PopulatedBooking = BookingDoc & {
  room: { roomNumber: string } | null;
  roomType: { _id: Types.ObjectId; name: string; slug: string; images?: string[] } | null;
};

const isActive = (status: string) =>
  (ACTIVE_BOOKING_STATUSES as readonly string[]).includes(status);

/** FR-BOOK-09: pending/confirmed bookings can be cancelled until the day before check-in. */
export function customerCanCancel(
  booking: { status: string; checkIn: Date },
  today: DateString = hotelToday(),
) {
  return isActive(booking.status) && toDateString(booking.checkIn) > today;
}

function toBookingDTO(doc: PopulatedBooking, today: DateString): BookingDTO {
  return {
    id: String(doc._id),
    referenceCode: doc.referenceCode,
    roomType: {
      id: String(doc.roomType?._id ?? ""),
      name: doc.roomType?.name ?? "Room",
      slug: doc.roomType?.slug ?? "",
      image: doc.roomType?.images?.[0],
    },
    roomNumber: doc.room?.roomNumber ?? "—",
    checkIn: toDateString(doc.checkIn),
    checkOut: toDateString(doc.checkOut),
    nights: doc.nights,
    guests: doc.guests,
    pricePerNight: doc.pricePerNight,
    totalPrice: doc.totalPrice,
    status: doc.status as BookingStatus,
    paymentStatus: doc.paymentStatus as PaymentStatus,
    specialRequest: doc.specialRequest ?? "",
    cancelledBy: (doc.cancelledBy as BookingDTO["cancelledBy"]) ?? null,
    createdAt: doc.createdAt.toISOString(),
    canCancel: customerCanCancel(doc, today),
  };
}

type BookingRefs = {
  room: PopulatedBooking["room"];
  roomType: PopulatedBooking["roomType"];
};

// ─── Create (FR-BOOK-01 … FR-BOOK-07, FR-BOOK-10) ────────────────────

export type CreateBookingParams = {
  userId: string;
  roomTypeSlug: string;
  checkIn: DateString;
  checkOut: DateString;
  guests: number;
  specialRequest: string;
};

export type CreateBookingResult =
  | { ok: true; booking: BookingDTO }
  | { ok: false; reason: BookingFailureReason; message: string };

/**
 * Creates a booking inside a MongoDB transaction with a room-level lock
 * (docs/PROJECT_PLAN.md §12.5, FR-BOOK-05):
 *
 *   1. Read the room type (must be active and large enough).
 *   2. Find the rooms of that type that are free for the dates.
 *   3. LOCK the first free room by incrementing its `lockVersion`
 *      (only if it is still "available").
 *   4. Insert the booking (pending, unpaid, price snapshot).
 *
 * If another transaction locked/booked the same room after our snapshot was
 * taken, step 3 fails with a WriteConflict. `withTransaction` then retries
 * the whole callback on a fresh snapshot, where the other booking is visible
 * and the room is skipped. Two bookings can therefore never commit for the
 * same room and overlapping dates.
 */
export async function createBooking(params: CreateBookingParams): Promise<CreateBookingResult> {
  const range = { checkIn: params.checkIn, checkOut: params.checkOut };
  const nights = nightsBetween(params.checkIn, params.checkOut);

  // A reference-code collision is astronomically unlikely, but retry if it happens.
  for (let attempt = 1; ; attempt++) {
    try {
      const bookingId = await withTransaction(async (session) => {
        const roomType = await RoomType.findOne({ slug: params.roomTypeSlug, isActive: true })
          .session(session)
          .lean();
        if (!roomType) throw new BookingFailure("room_type_unavailable");
        if (params.guests > roomType.capacity) throw new BookingFailure("too_many_guests");

        const freeRooms = await findFreeRooms(roomType._id, range, session);

        for (const candidate of freeRooms) {
          // Room-level lock (§12.5). Matches only if the room is still available.
          const lock = await Room.updateOne(
            { _id: candidate._id, status: "available" },
            { $inc: { lockVersion: 1 } },
            { session },
          );
          if (lock.matchedCount === 0) continue;

          const [booking] = await Booking.create(
            [
              {
                referenceCode: generateReferenceCode(),
                user: params.userId,
                room: candidate._id,
                roomType: roomType._id,
                checkIn: parseDateString(params.checkIn),
                checkOut: parseDateString(params.checkOut),
                nights,
                guests: params.guests,
                pricePerNight: roomType.pricePerNight, // snapshot (FR-BOOK-07)
                totalPrice: nights * roomType.pricePerNight, // server-side (FR-BOOK-03)
                status: "pending",
                paymentStatus: "unpaid",
                specialRequest: params.specialRequest,
              },
            ],
            { session },
          );
          return booking._id;
        }

        throw new BookingFailure("no_rooms_available");
      });

      const booking = await getBookingForUser(params.userId, String(bookingId));
      return { ok: true, booking: booking! };
    } catch (error) {
      if (error instanceof BookingFailure) {
        return { ok: false, reason: error.reason, message: error.message };
      }
      const isCodeCollision =
        (error as { code?: number; keyPattern?: object }).code === 11000 &&
        "referenceCode" in ((error as { keyPattern?: object }).keyPattern ?? {});
      if (isCodeCollision && attempt < 3) continue;
      throw error;
    }
  }
}

// ─── Read (FR-BOOK-08) ───────────────────────────────────────────────

export type GroupedBookings = {
  upcoming: BookingDTO[];
  past: BookingDTO[];
  cancelled: BookingDTO[];
};

/**
 * A customer's bookings, grouped for "My bookings":
 *  - upcoming:  pending/confirmed whose check-out is after today (includes stays in progress)
 *  - past:      completed, or pending/confirmed whose check-out has passed
 *  - cancelled: cancelled
 */
export async function listBookingsForUser(
  userId: string,
  today: DateString = hotelToday(),
): Promise<GroupedBookings> {
  if (!Types.ObjectId.isValid(userId)) return { upcoming: [], past: [], cancelled: [] };
  const docs = (await Booking.find({ user: userId })
    .sort({ checkIn: -1, createdAt: -1 })
    .populate<BookingRefs>("room", "roomNumber")
    .populate<BookingRefs>("roomType", "name slug images")
    .lean()) as PopulatedBooking[];

  const groups: GroupedBookings = { upcoming: [], past: [], cancelled: [] };
  for (const doc of docs) {
    const dto = toBookingDTO(doc, today);
    if (dto.status === "cancelled") groups.cancelled.push(dto);
    else if (isActive(dto.status) && dto.checkOut > today) groups.upcoming.push(dto);
    else groups.past.push(dto);
  }
  groups.upcoming.reverse(); // soonest first
  return groups;
}

/** One booking, only if it belongs to the user (others' bookings are "not found"). */
export async function getBookingForUser(
  userId: string,
  bookingId: string,
  today: DateString = hotelToday(),
): Promise<BookingDTO | null> {
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookingId)) return null;
  const doc = (await Booking.findOne({ _id: bookingId, user: userId })
    .populate<BookingRefs>("room", "roomNumber")
    .populate<BookingRefs>("roomType", "name slug images")
    .lean()) as PopulatedBooking | null;
  return doc ? toBookingDTO(doc, today) : null;
}

// ─── Cancel (FR-BOOK-09) ─────────────────────────────────────────────

export type CancelResult =
  | { ok: true; booking: BookingDTO }
  | { ok: false; reason: "not_found" | "not_cancellable"; message: string };

/**
 * Customer cancellation. A single conditional update, so it is atomic:
 * it only succeeds while the booking is still pending/confirmed and
 * check-in is in the future. The room becomes available again immediately
 * because cancelled bookings do not block availability (FR-AVAIL-05).
 */
export async function cancelBookingByCustomer(
  userId: string,
  bookingId: string,
  today: DateString = hotelToday(),
): Promise<CancelResult> {
  const notFound = { ok: false, reason: "not_found", message: "Booking not found." } as const;
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(bookingId)) return notFound;

  const updated = await Booking.updateOne(
    {
      _id: bookingId,
      user: userId,
      status: { $in: ACTIVE_BOOKING_STATUSES },
      checkIn: { $gt: parseDateString(today) },
    },
    { $set: { status: "cancelled", cancelledBy: "customer", cancelledAt: new Date() } },
  );

  if (updated.modifiedCount === 0) {
    const exists = await Booking.exists({ _id: bookingId, user: userId });
    return exists
      ? {
          ok: false,
          reason: "not_cancellable",
          message:
            "This booking can no longer be cancelled online. Please contact the hotel for help.",
        }
      : notFound;
  }
  return { ok: true, booking: (await getBookingForUser(userId, bookingId, today))! };
}

// ─── Guards used by the admin catalogue (FR-ADM-04) ──────────────────

/** Active bookings whose stay has not ended yet (includes guests currently staying). */
export function futureActiveBookingFilter(today: DateString = hotelToday()) {
  return {
    status: { $in: ACTIVE_BOOKING_STATUSES },
    checkOut: { $gt: parseDateString(today) },
  };
}
