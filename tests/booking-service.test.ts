import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Booking } from "@/models/booking";
import { Room } from "@/models/room";
import { RoomType } from "@/models/room-type";
import { User } from "@/models/user";
import { hotelToday, addDays } from "@/lib/dates";
import { searchAvailability } from "@/services/availability.service";
import {
  cancelBookingByCustomer,
  createBooking,
  getBookingForUser,
  listBookingsForUser,
} from "@/services/booking.service";
import { setRoomTypeActive, updateRoom } from "@/services/catalogue.service";
import { roomSchema } from "@/validations/catalogue";
import { startTestDatabase } from "./helpers/mongo";

let db: Awaited<ReturnType<typeof startTestDatabase>>;

// Dates relative to the real hotel date, because createBooking validates nothing
// about "today" itself (the Zod schema does) but cancellation/grouping use it.
const TODAY = hotelToday();
const d = (offset: number) => addDays(TODAY, offset);

let alice: string;
let bob: string;
let deluxeId: string;

beforeAll(async () => {
  db = await startTestDatabase();
  await Promise.all([User.init(), RoomType.init(), Room.init(), Booking.init()]);
});
afterAll(async () => {
  await db?.stop();
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    RoomType.deleteMany({}),
    Room.deleteMany({}),
    Booking.deleteMany({}),
  ]);
  const users = await User.create([
    { name: "Alice", email: "alice@test.com", phone: "01711111111", passwordHash: "x" },
    { name: "Bob", email: "bob@test.com", phone: "01722222222", passwordHash: "x" },
  ]);
  alice = String(users[0]._id);
  bob = String(users[1]._id);

  const [deluxe, single, closed] = await RoomType.create([
    { name: "Deluxe", slug: "deluxe", description: "d".repeat(30), pricePerNight: 5000, capacity: 2, bedType: "King" },
    { name: "Single", slug: "single", description: "d".repeat(30), pricePerNight: 3000, capacity: 1, bedType: "Single" },
    { name: "Closed", slug: "closed", description: "d".repeat(30), pricePerNight: 1000, capacity: 4, bedType: "Twin", isActive: false },
  ]);
  deluxeId = String(deluxe._id);
  await Room.create([
    { roomNumber: "201", floor: 2, roomType: deluxe._id },
    { roomNumber: "202", floor: 2, roomType: deluxe._id },
    { roomNumber: "203", floor: 2, roomType: deluxe._id, status: "maintenance" },
    { roomNumber: "204", floor: 2, roomType: deluxe._id, status: "inactive" },
    { roomNumber: "101", floor: 1, roomType: single._id },
    { roomNumber: "301", floor: 3, roomType: closed._id },
  ]);
});

const book = (userId: string, checkIn: string, checkOut: string, overrides: object = {}) =>
  createBooking({
    userId,
    roomTypeSlug: "deluxe",
    checkIn,
    checkOut,
    guests: 2,
    specialRequest: "",
    ...overrides,
  });

async function bookOk(...args: Parameters<typeof book>) {
  const r = await book(...args);
  if (!r.ok) throw new Error(`booking failed: ${r.message}`);
  return r.booking;
}

describe("createBooking (FR-BOOK-03 … FR-BOOK-07)", () => {
  it("creates a pending, unpaid booking with a server-side price snapshot", async () => {
    const b = await bookOk(alice, d(10), d(13), { specialRequest: "Late arrival" });
    expect(b).toMatchObject({
      status: "pending",
      paymentStatus: "unpaid",
      nights: 3,
      pricePerNight: 5000,
      totalPrice: 15000,
      roomNumber: "201", // first free room in natural order
      specialRequest: "Late arrival",
      canCancel: true,
    });
    expect(b.referenceCode).toMatch(/^SE-/);
  });

  it("keeps the old price on existing bookings when the price changes (FR-BOOK-07)", async () => {
    const b = await bookOk(alice, d(10), d(12));
    await RoomType.updateOne({ slug: "deluxe" }, { pricePerNight: 9999 });
    expect((await getBookingForUser(alice, b.id))?.totalPrice).toBe(10000);
  });

  it("assigns the next free room and never a maintenance/inactive one (FR-BOOK-04, FR-AVAIL-06)", async () => {
    const first = await bookOk(alice, d(5), d(7));
    const second = await bookOk(bob, d(5), d(7));
    expect([first.roomNumber, second.roomNumber]).toEqual(["201", "202"]);
    const third = await book(alice, d(5), d(7));
    expect(third).toMatchObject({ ok: false, reason: "no_rooms_available" });
  });

  it("refuses inactive/unknown room types and too many guests", async () => {
    expect(await book(alice, d(5), d(6), { roomTypeSlug: "closed" })).toMatchObject({ ok: false, reason: "room_type_unavailable" });
    expect(await book(alice, d(5), d(6), { roomTypeSlug: "nope" })).toMatchObject({ ok: false, reason: "room_type_unavailable" });
    expect(await book(alice, d(5), d(6), { guests: 3 })).toMatchObject({ ok: false, reason: "too_many_guests" });
  });

  it("increments the room lock on every booking (§12.5)", async () => {
    await bookOk(alice, d(5), d(6));
    expect((await Room.findOne({ roomNumber: "201" }).lean())?.lockVersion).toBe(1);
  });
});

describe("availability rules (FR-AVAIL-04, FR-AVAIL-05)", () => {
  const free = async (checkIn: string, checkOut: string) =>
    (await searchAvailability({ checkIn, checkOut }, 1)).find((r) => r.roomType.slug === "deluxe")!.availableRooms;

  it("counts only available rooms of active types that fit the guests", async () => {
    const results = await searchAvailability({ checkIn: d(1), checkOut: d(3) }, 2);
    expect(results.map((r) => [r.roomType.slug, r.availableRooms, r.totalPrice])).toEqual([
      ["deluxe", 2, 10000], // 203 maintenance + 204 inactive excluded; Single too small; Closed inactive
    ]);
  });

  it("blocks overlapping dates but allows back-to-back stays", async () => {
    await bookOk(alice, d(10), d(13));
    await bookOk(bob, d(10), d(13));
    expect(await free(d(10), d(13))).toBe(0);
    expect(await free(d(12), d(14))).toBe(0); // overlaps last night
    expect(await free(d(8), d(11))).toBe(0); // overlaps first night
    expect(await free(d(13), d(15))).toBe(2); // check-in on their check-out day
    expect(await free(d(7), d(10))).toBe(2); // check-out on their check-in day
    expect(await bookOk(alice, d(13), d(14))).toMatchObject({ roomNumber: "201" });
  });

  it("cancelled and completed bookings do not block rooms", async () => {
    const b = await bookOk(alice, d(10), d(12));
    await bookOk(bob, d(10), d(12));
    expect(await free(d(10), d(12))).toBe(0);
    await Booking.updateOne({ _id: b.id }, { status: "cancelled" });
    expect(await free(d(10), d(12))).toBe(1);
    await Booking.updateMany({}, { status: "completed" });
    expect(await free(d(10), d(12))).toBe(2);
  });

  it("confirmed bookings block like pending ones", async () => {
    const b = await bookOk(alice, d(10), d(12));
    await Booking.updateOne({ _id: b.id }, { status: "confirmed" });
    await bookOk(bob, d(10), d(12));
    expect(await free(d(10), d(12))).toBe(0);
  });
});

describe("concurrency: no double booking (FR-BOOK-05, §12.5)", () => {
  it("12 simultaneous requests for 2 rooms → exactly 2 bookings, on different rooms", async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) => book(i % 2 ? alice : bob, d(20), d(23))),
    );
    const ok = results.filter((r) => r.ok);
    expect(ok).toHaveLength(2);
    expect(results.filter((r) => !r.ok && r.reason === "no_rooms_available")).toHaveLength(10);

    const stored = await Booking.find({ status: "pending" }).lean();
    expect(stored).toHaveLength(2);
    expect(new Set(stored.map((b) => String(b.room))).size).toBe(2);
  });

  it("simultaneous requests for partly overlapping dates on a one-room type", async () => {
    // Only room 101 exists for "single".
    const results = await Promise.all([
      book(alice, d(30), d(33), { roomTypeSlug: "single", guests: 1 }),
      book(bob, d(32), d(35), { roomTypeSlug: "single", guests: 1 }),
      book(alice, d(34), d(36), { roomTypeSlug: "single", guests: 1 }),
    ]);
    const stays = await Booking.find().sort({ checkIn: 1 }).lean();
    // Whatever order they ran in, no two stored stays may overlap.
    for (let i = 1; i < stays.length; i++) {
      expect(stays[i].checkIn.getTime()).toBeGreaterThanOrEqual(stays[i - 1].checkOut.getTime());
    }
    expect(results.filter((r) => r.ok).length).toBe(stays.length);
    expect(stays.length).toBeGreaterThanOrEqual(1);
  });

  it("an admin taking a room out of service cannot race a booking (FR-ADM-04)", async () => {
    const roomInput = (status: string) =>
      roomSchema.parse({ roomNumber: "201", floor: "2", roomTypeId: deluxeId, status });
    const room201 = await Room.findOne({ roomNumber: "201" }).lean();
    await Room.updateOne({ roomNumber: "202" }, { status: "inactive" }); // only 201 left

    const [booking, update] = await Promise.all([
      book(alice, d(40), d(42)),
      updateRoom(String(room201!._id), roomInput("maintenance")),
    ]);
    // Exactly one of them wins: either a booking on an available room,
    // or the room went to maintenance with no booking on it.
    const finalRoom = await Room.findById(room201!._id).lean();
    const bookings = await Booking.countDocuments({ room: room201!._id });
    if (booking.ok) {
      expect(update).toMatchObject({ ok: false, reason: "blocked" });
      expect(finalRoom?.status).toBe("available");
      expect(bookings).toBe(1);
    } else {
      expect(update.ok).toBe(true);
      expect(finalRoom?.status).toBe("maintenance");
      expect(bookings).toBe(0);
    }
  });
});

describe("customer bookings (FR-BOOK-08, FR-BOOK-09)", () => {
  it("groups bookings into upcoming, past and cancelled", async () => {
    const upcoming = await bookOk(alice, d(5), d(7));
    const current = await bookOk(alice, d(-1), d(2)); // stay in progress
    const old = await bookOk(alice, d(-10), d(-8));
    const cancelled = await bookOk(alice, d(20), d(21));
    await Booking.updateOne({ _id: old.id }, { status: "completed" });
    await Booking.updateOne({ _id: cancelled.id }, { status: "cancelled" });
    await bookOk(bob, d(5), d(7)); // someone else's booking

    const groups = await listBookingsForUser(alice, TODAY);
    expect(groups.upcoming.map((b) => b.id)).toEqual([current.id, upcoming.id]); // soonest first
    expect(groups.past.map((b) => b.id)).toEqual([old.id]);
    expect(groups.cancelled.map((b) => b.id)).toEqual([cancelled.id]);
  });

  it("only the owner can see a booking", async () => {
    const b = await bookOk(alice, d(5), d(7));
    expect(await getBookingForUser(bob, b.id)).toBeNull();
    expect(await getBookingForUser(alice, "not-an-id")).toBeNull();
  });

  it("cancels before check-in and frees the room", async () => {
    const b = await bookOk(alice, d(5), d(7));
    await bookOk(bob, d(5), d(7));
    const r = await cancelBookingByCustomer(alice, b.id, TODAY);
    expect(r).toMatchObject({ ok: true, booking: { status: "cancelled", cancelledBy: "customer", canCancel: false } });
    expect(await bookOk(bob, d(5), d(7))).toMatchObject({ roomNumber: b.roomNumber });
  });

  it("refuses to cancel on/after check-in day, twice, or someone else's booking", async () => {
    const today = await bookOk(alice, TODAY, d(2));
    expect(today.canCancel).toBe(false);
    expect(await cancelBookingByCustomer(alice, today.id, TODAY)).toMatchObject({ ok: false, reason: "not_cancellable" });

    const later = await bookOk(alice, d(5), d(7));
    expect(await cancelBookingByCustomer(bob, later.id, TODAY)).toMatchObject({ ok: false, reason: "not_found" });
    expect((await cancelBookingByCustomer(alice, later.id, TODAY)).ok).toBe(true);
    expect(await cancelBookingByCustomer(alice, later.id, TODAY)).toMatchObject({ ok: false, reason: "not_cancellable" });
  });

  it("customers cannot change payment status through cancellation", async () => {
    const b = await bookOk(alice, d(5), d(7));
    await cancelBookingByCustomer(alice, b.id, TODAY);
    expect((await Booking.findById(b.id).lean())?.paymentStatus).toBe("unpaid");
  });
});

describe("admin guards (FR-ADM-04)", () => {
  const roomInput = (overrides: object = {}) =>
    roomSchema.parse({ roomNumber: "201", floor: "2", roomTypeId: deluxeId, status: "available", ...overrides });

  it("blocks taking a booked room out of service until the booking ends or is cancelled", async () => {
    const b = await bookOk(alice, d(5), d(7));
    const room = await Room.findOne({ roomNumber: "201" }).lean();
    const r = await updateRoom(String(room!._id), roomInput({ status: "maintenance" }), TODAY);
    expect(r).toMatchObject({ ok: false, reason: "blocked" });
    expect((r as { message: string }).message).toMatch(/1 upcoming booking/);

    // Renaming/moving floors is still allowed.
    expect((await updateRoom(String(room!._id), roomInput({ floor: "3" }), TODAY)).ok).toBe(true);

    await cancelBookingByCustomer(alice, b.id, TODAY);
    expect((await updateRoom(String(room!._id), roomInput({ status: "maintenance" }), TODAY)).ok).toBe(true);
  });

  it("allows it once the stay is in the past", async () => {
    await bookOk(alice, d(5), d(7));
    const room = await Room.findOne({ roomNumber: "201" }).lean();
    expect((await updateRoom(String(room!._id), roomInput({ status: "inactive" }), d(7))).ok).toBe(true);
  });

  it("blocks moving a booked room to another room type", async () => {
    await bookOk(alice, d(5), d(7));
    const single = await RoomType.findOne({ slug: "single" }).lean();
    const room = await Room.findOne({ roomNumber: "201" }).lean();
    const r = await updateRoom(String(room!._id), roomInput({ roomTypeId: String(single!._id) }), TODAY);
    expect(r).toMatchObject({ ok: false, reason: "blocked" });
  });

  it("blocks deactivating a room type with upcoming bookings", async () => {
    const b = await bookOk(alice, d(5), d(7));
    expect(await setRoomTypeActive(deluxeId, false, TODAY)).toMatchObject({ ok: false, reason: "blocked" });
    await cancelBookingByCustomer(alice, b.id, TODAY);
    expect((await setRoomTypeActive(deluxeId, false, TODAY)).ok).toBe(true);
  });
});
