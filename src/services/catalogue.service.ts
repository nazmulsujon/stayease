import { Types } from "mongoose";
import { Room, type RoomDoc } from "@/models/room";
import { RoomType, type RoomTypeDoc } from "@/models/room-type";
import { hotelToday, type DateString } from "@/lib/dates";
import { withTransaction } from "@/lib/db-core";
import { slugify } from "@/lib/slug";
import { Booking } from "@/models/booking";
import { futureActiveBookingFilter } from "./booking.service";
import type {
  RoomDTO,
  RoomStatus,
  RoomTypeAdminRow,
  RoomTypeDTO,
} from "@/types/catalogue";
import type { RoomInput, RoomTypeInput } from "@/validations/catalogue";

/**
 * Room catalogue business logic (Room Catalogue Module, §9).
 * Independent of Next.js so it can be unit-tested against a database.
 * Callers pass input that has already been validated with Zod and are
 * responsible for authorisation (admin-only functions are marked).
 */

// ─── Mapping ─────────────────────────────────────────────────────────

type LeanRoomType = Pick<
  RoomTypeDoc,
  | "_id"
  | "name"
  | "slug"
  | "description"
  | "pricePerNight"
  | "capacity"
  | "bedType"
  | "sizeSqft"
  | "amenities"
  | "images"
  | "isActive"
>;

export function toRoomTypeDTO(doc: LeanRoomType): RoomTypeDTO {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    pricePerNight: doc.pricePerNight,
    capacity: doc.capacity,
    bedType: doc.bedType,
    sizeSqft: doc.sizeSqft ?? null,
    amenities: [...(doc.amenities ?? [])],
    images: [...(doc.images ?? [])],
    isActive: doc.isActive,
  };
}

const isValidId = (id: string) => Types.ObjectId.isValid(id) && /^[a-f\d]{24}$/i.test(id);

function duplicateKeyField(error: unknown): string | null {
  if (typeof error === "object" && error !== null && (error as { code?: number }).code === 11000) {
    const keys = Object.keys((error as { keyPattern?: object }).keyPattern ?? {});
    return keys[0] ?? "unknown";
  }
  return null;
}

// ─── Public catalogue (FR-ROOM-01, FR-ROOM-02) ───────────────────────

export type RoomTypeFilters = {
  /** Show only types costing at most this per night (FR-ROOM-03). */
  maxPrice?: number;
  /** Show only types that hold at least this many guests (FR-ROOM-03). */
  guests?: number;
};

/** Active room types, cheapest first, optionally filtered (FR-ROOM-01, FR-ROOM-03). */
export async function listActiveRoomTypes(
  limit?: number,
  filters: RoomTypeFilters = {},
): Promise<RoomTypeDTO[]> {
  const filter: Record<string, unknown> = { isActive: true };
  if (filters.maxPrice && filters.maxPrice > 0) filter.pricePerNight = { $lte: filters.maxPrice };
  if (filters.guests && filters.guests > 0) filter.capacity = { $gte: filters.guests };
  const query = RoomType.find(filter).sort({ pricePerNight: 1, name: 1 });
  if (limit) query.limit(limit);
  const docs = await query.lean();
  return docs.map(toRoomTypeDTO);
}

/** An active room type by its URL slug, or null (inactive types are hidden from customers). */
export async function getActiveRoomTypeBySlug(slug: string): Promise<RoomTypeDTO | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const doc = await RoomType.findOne({ slug, isActive: true }).lean();
  return doc ? toRoomTypeDTO(doc) : null;
}

// ─── Admin: room types (FR-ADM-02) ───────────────────────────────────

/** All room types with room counts. Admin only. */
export async function listRoomTypesForAdmin(): Promise<RoomTypeAdminRow[]> {
  const [types, counts] = await Promise.all([
    RoomType.find().sort({ isActive: -1, pricePerNight: 1 }).lean(),
    Room.aggregate<{ _id: Types.ObjectId; total: number; available: number }>([
      {
        $group: {
          _id: "$roomType",
          total: { $sum: 1 },
          available: { $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] } },
        },
      },
    ]),
  ]);
  const byType = new Map(counts.map((c) => [c._id.toString(), c]));
  return types.map((t) => {
    const c = byType.get(t._id.toString());
    return { ...toRoomTypeDTO(t), totalRooms: c?.total ?? 0, availableRooms: c?.available ?? 0 };
  });
}

export async function getRoomTypeById(id: string): Promise<RoomTypeDTO | null> {
  if (!isValidId(id)) return null;
  const doc = await RoomType.findById(id).lean();
  return doc ? toRoomTypeDTO(doc) : null;
}

export type MutationResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "conflict"; field: string; message: string }
  /** Refused by a business rule, e.g. future bookings exist (FR-ADM-04). */
  | { ok: false; reason: "blocked"; message: string };

const NAME_TAKEN = {
  ok: false,
  reason: "conflict",
  field: "name",
  message: "A room type with this name already exists.",
} as const;

/** Admin only. */
export async function createRoomType(input: RoomTypeInput): Promise<MutationResult<RoomTypeDTO>> {
  const slug = slugify(input.name);
  if (!slug) return { ...NAME_TAKEN, message: "Name must contain letters or numbers." };
  if (await RoomType.exists({ slug })) return NAME_TAKEN;
  try {
    const doc = await RoomType.create({ ...input, slug, isActive: true });
    return { ok: true, value: toRoomTypeDTO(doc) };
  } catch (error) {
    if (duplicateKeyField(error)) return NAME_TAKEN;
    throw error;
  }
}

/** Admin only. Renaming also updates the slug (the public URL). */
export async function updateRoomType(
  id: string,
  input: RoomTypeInput,
): Promise<MutationResult<RoomTypeDTO>> {
  if (!isValidId(id)) return { ok: false, reason: "not_found" };
  const slug = slugify(input.name);
  if (!slug) return { ...NAME_TAKEN, message: "Name must contain letters or numbers." };
  if (await RoomType.exists({ slug, _id: { $ne: id } })) return NAME_TAKEN;
  try {
    const doc = await RoomType.findByIdAndUpdate(
      id,
      { ...input, slug },
      { returnDocument: "after", runValidators: true },
    ).lean();
    return doc ? { ok: true, value: toRoomTypeDTO(doc) } : { ok: false, reason: "not_found" };
  } catch (error) {
    if (duplicateKeyField(error)) return NAME_TAKEN;
    throw error;
  }
}

/** Thrown inside a transaction to abort it with a business-rule message. */
class Blocked extends Error {}

function pluralBookings(count: number) {
  return count === 1 ? "1 upcoming booking" : `${count} upcoming bookings`;
}

/**
 * Admin only. Room types are deactivated instead of deleted (FR-ADM-04),
 * so past bookings keep a valid reference. An inactive type is hidden from
 * customers and none of its rooms can be booked.
 *
 * Deactivation is refused while the type has pending/confirmed bookings that
 * have not ended. It runs in a transaction that also bumps the lockVersion
 * of every room of the type, so it cannot interleave with a booking
 * transaction (both write the same Room documents → write conflict → retry).
 */
export async function setRoomTypeActive(
  id: string,
  isActive: boolean,
  today: DateString = hotelToday(),
): Promise<MutationResult<RoomTypeDTO>> {
  if (!isValidId(id)) return { ok: false, reason: "not_found" };
  try {
    const doc = await withTransaction(async (session) => {
      if (!isActive) {
        await Room.updateMany({ roomType: id }, { $inc: { lockVersion: 1 } }, { session });
        const count = await Booking.countDocuments(
          { roomType: id, ...futureActiveBookingFilter(today) },
          { session },
        );
        if (count > 0) {
          throw new Blocked(
            `This room type has ${pluralBookings(count)}. Cancel or complete them before deactivating it.`,
          );
        }
      }
      return RoomType.findByIdAndUpdate(id, { isActive }, { returnDocument: "after", session }).lean();
    });
    return doc ? { ok: true, value: toRoomTypeDTO(doc) } : { ok: false, reason: "not_found" };
  } catch (error) {
    if (error instanceof Blocked) return { ok: false, reason: "blocked", message: error.message };
    throw error;
  }
}

// ─── Admin: physical rooms (FR-ADM-03) ───────────────────────────────

type PopulatedRoom = Pick<RoomDoc, "_id" | "roomNumber" | "floor" | "status"> & {
  roomType: Pick<RoomTypeDoc, "_id" | "name" | "isActive"> | null;
};

function toRoomDTO(doc: PopulatedRoom): RoomDTO {
  return {
    id: doc._id.toString(),
    roomNumber: doc.roomNumber,
    floor: doc.floor,
    status: doc.status as RoomStatus,
    roomType: doc.roomType
      ? { id: doc.roomType._id.toString(), name: doc.roomType.name, isActive: doc.roomType.isActive }
      : { id: "", name: "(deleted type)", isActive: false },
  };
}

/** Admin only. Optionally filtered by room type. Sorted by floor then room number. */
export async function listRoomsForAdmin(roomTypeId?: string): Promise<RoomDTO[]> {
  const filter = roomTypeId && isValidId(roomTypeId) ? { roomType: roomTypeId } : {};
  const docs = await Room.find(filter)
    .populate<{ roomType: PopulatedRoom["roomType"] }>("roomType", "name isActive")
    .sort({ floor: 1, roomNumber: 1 })
    .lean();
  // Natural sort so that "102" comes before "1001" on the same floor.
  return docs
    .map((d) => toRoomDTO(d as PopulatedRoom))
    .sort(
      (a, b) =>
        a.floor - b.floor ||
        a.roomNumber.localeCompare(b.roomNumber, "en", { numeric: true }),
    );
}

export async function getRoomById(id: string): Promise<RoomDTO | null> {
  if (!isValidId(id)) return null;
  const doc = await Room.findById(id)
    .populate<{ roomType: PopulatedRoom["roomType"] }>("roomType", "name isActive")
    .lean();
  return doc ? toRoomDTO(doc as PopulatedRoom) : null;
}

const ROOM_NUMBER_TAKEN = {
  ok: false,
  reason: "conflict",
  field: "roomNumber",
  message: "This room number is already in use.",
} as const;

const UNKNOWN_TYPE = {
  ok: false,
  reason: "conflict",
  field: "roomTypeId",
  message: "The selected room type does not exist.",
} as const;

/** Admin only. */
export async function createRoom(input: RoomInput): Promise<MutationResult<RoomDTO>> {
  if (!(await RoomType.exists({ _id: input.roomTypeId }))) return UNKNOWN_TYPE;
  if (await Room.exists({ roomNumber: input.roomNumber })) return ROOM_NUMBER_TAKEN;
  try {
    const doc = await Room.create({
      roomNumber: input.roomNumber,
      floor: input.floor,
      roomType: input.roomTypeId,
      status: input.status,
    });
    return { ok: true, value: (await getRoomById(doc._id.toString()))! };
  } catch (error) {
    if (duplicateKeyField(error)) return ROOM_NUMBER_TAKEN;
    throw error;
  }
}

/**
 * Admin only. Changing `status` to maintenance/inactive removes the room
 * from availability (FR-AVAIL-06).
 *
 * FR-ADM-04: while the room has pending/confirmed bookings that have not
 * ended, it may not be taken out of service or moved to another room type
 * (the bookings were made for this room and type). The check and the update
 * run in one transaction that writes the Room document, so they cannot
 * interleave with a booking transaction that locks the same room (§12.5).
 */
export async function updateRoom(
  id: string,
  input: RoomInput,
  today: DateString = hotelToday(),
): Promise<MutationResult<RoomDTO>> {
  if (!isValidId(id)) return { ok: false, reason: "not_found" };
  if (!(await RoomType.exists({ _id: input.roomTypeId }))) return UNKNOWN_TYPE;
  if (await Room.exists({ roomNumber: input.roomNumber, _id: { $ne: id } })) {
    return ROOM_NUMBER_TAKEN;
  }
  try {
    const updated = await withTransaction(async (session) => {
      const current = await Room.findById(id).session(session).lean();
      if (!current) return null;

      const leavingService = current.status === "available" && input.status !== "available";
      const changingType = String(current.roomType) !== input.roomTypeId;
      if (leavingService || changingType) {
        const count = await Booking.countDocuments(
          { room: id, ...futureActiveBookingFilter(today) },
          { session },
        );
        if (count > 0) {
          throw new Blocked(
            `Room ${current.roomNumber} has ${pluralBookings(count)}. ` +
              (changingType
                ? "Its room type cannot be changed until they are cancelled or completed."
                : "It cannot be taken out of service until they are cancelled or completed."),
          );
        }
      }

      return Room.findByIdAndUpdate(
        id,
        {
          roomNumber: input.roomNumber,
          floor: input.floor,
          roomType: input.roomTypeId,
          status: input.status,
          $inc: { lockVersion: 1 }, // serialise with booking transactions on this room
        },
        { returnDocument: "after", runValidators: true, session },
      );
    });
    return updated ? { ok: true, value: (await getRoomById(id))! } : { ok: false, reason: "not_found" };
  } catch (error) {
    if (error instanceof Blocked) return { ok: false, reason: "blocked", message: error.message };
    if (duplicateKeyField(error)) return ROOM_NUMBER_TAKEN;
    throw error;
  }
}

/** Room type options for the room form (admin). */
export async function listRoomTypeOptions(): Promise<{ id: string; name: string; isActive: boolean }[]> {
  const docs = await RoomType.find().select("name isActive").sort({ name: 1 }).lean();
  return docs.map((d) => ({ id: d._id.toString(), name: d.name, isActive: d.isActive }));
}
