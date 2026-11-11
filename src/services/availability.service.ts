import type { ClientSession, Types } from "mongoose";
import { Booking } from "@/models/booking";
import { Room } from "@/models/room";
import { RoomType } from "@/models/room-type";
import { nightsBetween, parseDateString, type DateString } from "@/lib/dates";
import { ACTIVE_BOOKING_STATUSES, type RoomTypeAvailability } from "@/types/booking";

/**
 * Availability Engine (System Module 4, §12.4).
 *
 * A physical room is FREE for [checkIn, checkOut) when:
 *   - the room's status is "available"                        (FR-AVAIL-06)
 *   - its room type is active
 *   - it has NO booking with status pending/confirmed where
 *       existing.checkIn < requested.checkOut AND
 *       existing.checkOut > requested.checkIn                 (FR-AVAIL-05)
 * Cancelled and completed bookings never block a room. The check-out day is
 * not a night, so back-to-back stays on the same room are allowed.
 */

export type StayRange = { checkIn: DateString; checkOut: DateString };

/** MongoDB filter for active bookings that overlap the requested stay. */
export function overlappingActiveBookingFilter(range: StayRange) {
  return {
    status: { $in: ACTIVE_BOOKING_STATUSES },
    checkIn: { $lt: parseDateString(range.checkOut) },
    checkOut: { $gt: parseDateString(range.checkIn) },
  };
}

/** Ids (as strings) of the given rooms that are booked during the range. */
export async function findBusyRoomIds(
  roomIds: Types.ObjectId[],
  range: StayRange,
  session?: ClientSession,
): Promise<Set<string>> {
  if (roomIds.length === 0) return new Set();
  const busy = await Booking.distinct(
    "room",
    { room: { $in: roomIds }, ...overlappingActiveBookingFilter(range) },
    { session },
  );
  return new Set(busy.map((id) => String(id)));
}

/**
 * Bookable rooms of one room type for the range, in natural room-number order.
 * Used by the booking transaction (pass its session so reads use its snapshot).
 */
export async function findFreeRooms(
  roomTypeId: Types.ObjectId | string,
  range: StayRange,
  session?: ClientSession,
) {
  const rooms = await Room.find({ roomType: roomTypeId, status: "available" })
    .select("_id roomNumber")
    .session(session ?? null)
    .lean();
  const busy = await findBusyRoomIds(rooms.map((r) => r._id), range, session);
  return rooms
    .filter((r) => !busy.has(String(r._id)))
    .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, "en", { numeric: true }));
}

/**
 * FR-AVAIL-01, FR-AVAIL-04: every active room type that can hold `guests`,
 * with the number of free rooms and the total price for the stay.
 * Sold-out types are included (availableRooms = 0) so the customer can see them.
 */
export async function searchAvailability(
  range: StayRange,
  guests: number,
): Promise<RoomTypeAvailability[]> {
  const nights = nightsBetween(range.checkIn, range.checkOut);
  const roomTypes = await RoomType.find({ isActive: true, capacity: { $gte: guests } })
    .sort({ pricePerNight: 1, name: 1 })
    .lean();
  if (roomTypes.length === 0) return [];

  const rooms = await Room.find({
    roomType: { $in: roomTypes.map((t) => t._id) },
    status: "available",
  })
    .select("_id roomType")
    .lean();
  const busy = await findBusyRoomIds(rooms.map((r) => r._id), range);

  const freeByType = new Map<string, number>();
  for (const room of rooms) {
    if (busy.has(String(room._id))) continue;
    const key = String(room.roomType);
    freeByType.set(key, (freeByType.get(key) ?? 0) + 1);
  }

  return roomTypes.map((t) => ({
    roomType: {
      id: String(t._id),
      name: t.name,
      slug: t.slug,
      description: t.description,
      capacity: t.capacity,
      bedType: t.bedType,
      sizeSqft: t.sizeSqft ?? null,
      image: t.images?.[0],
      pricePerNight: t.pricePerNight,
    },
    availableRooms: freeByType.get(String(t._id)) ?? 0,
    nights,
    totalPrice: nights * t.pricePerNight,
  }));
}

/** Availability of a single active room type by slug (booking page). */
export async function getRoomTypeAvailability(
  slug: string,
  range: StayRange,
): Promise<RoomTypeAvailability | null> {
  const roomType = await RoomType.findOne({ slug, isActive: true }).lean();
  if (!roomType) return null;
  const free = await findFreeRooms(roomType._id, range);
  const nights = nightsBetween(range.checkIn, range.checkOut);
  return {
    roomType: {
      id: String(roomType._id),
      name: roomType.name,
      slug: roomType.slug,
      description: roomType.description,
      capacity: roomType.capacity,
      bedType: roomType.bedType,
      sizeSqft: roomType.sizeSqft ?? null,
      image: roomType.images?.[0],
      pricePerNight: roomType.pricePerNight,
    },
    availableRooms: free.length,
    nights,
    totalPrice: nights * roomType.pricePerNight,
  };
}
