import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { hashPassword } from "@/lib/auth/password";
import { addDays, hotelToday } from "@/lib/dates";
import { Booking } from "@/models/booking";
import { Review } from "@/models/review";
import { Room } from "@/models/room";
import { RoomType } from "@/models/room-type";
import { User } from "@/models/user";
import {
  getDashboardStats,
  listBookingsForAdmin,
  listUsersForAdmin,
  setPaymentStatus,
  setUserBlocked,
  updateBookingStatus,
} from "@/services/admin.service";
import { authenticateUser, findActiveSessionUser } from "@/services/auth.service";
import { createBooking } from "@/services/booking.service";
import { listActiveRoomTypes } from "@/services/catalogue.service";
import { changePassword, getProfile, updateProfile } from "@/services/profile.service";
import {
  createReview,
  deleteReview,
  displayName,
  getRatingSummaries,
  getRoomTypeReviews,
  setReviewHidden,
} from "@/services/review.service";
import { changePasswordSchema } from "@/validations/profile";
import { reviewSchema } from "@/validations/review";
import { startTestDatabase } from "./helpers/mongo";

let db: Awaited<ReturnType<typeof startTestDatabase>>;
const TODAY = hotelToday();
const d = (n: number) => addDays(TODAY, n);

let alice: string;
let bob: string;
let adminId: string;
let deluxeId: string;

beforeAll(async () => {
  db = await startTestDatabase();
  await Promise.all([User.init(), RoomType.init(), Room.init(), Booking.init(), Review.init()]);
});
afterAll(async () => {
  await db?.stop();
});

beforeEach(async () => {
  await Promise.all([User, RoomType, Room, Booking, Review].map((m) => (m as typeof User).deleteMany({})));
  const hash = await hashPassword("secret123");
  const [a, b, admin] = await User.create([
    { name: "Alice Rahman", email: "alice@test.com", phone: "01711111111", passwordHash: hash },
    { name: "Bob Hasan", email: "bob@test.com", phone: "01722222222", passwordHash: hash },
    { name: "Admin", email: "admin@test.com", phone: "01733333333", passwordHash: hash, role: "admin" },
  ]);
  alice = String(a._id);
  bob = String(b._id);
  adminId = String(admin._id);
  const [deluxe, suite] = await RoomType.create([
    { name: "Deluxe", slug: "deluxe", description: "d".repeat(30), pricePerNight: 5000, capacity: 2, bedType: "King" },
    { name: "Suite", slug: "suite", description: "d".repeat(30), pricePerNight: 12000, capacity: 4, bedType: "King" },
  ]);
  deluxeId = String(deluxe._id);
  await Room.create([
    { roomNumber: "201", floor: 2, roomType: deluxe._id },
    { roomNumber: "202", floor: 2, roomType: deluxe._id },
    { roomNumber: "203", floor: 2, roomType: deluxe._id, status: "maintenance" },
    { roomNumber: "501", floor: 5, roomType: suite._id },
  ]);
});

async function book(userId: string, checkIn: string, checkOut: string, slug = "deluxe") {
  const r = await createBooking({ userId, roomTypeSlug: slug, checkIn, checkOut, guests: 2, specialRequest: "" });
  if (!r.ok) throw new Error(r.message);
  return r.booking;
}

describe("admin booking management (FR-ADM-05 … FR-ADM-07)", () => {
  it("follows the allowed status transitions only", async () => {
    const b = await book(alice, d(-1), d(2));
    expect(await updateBookingStatus(b.id, "complete", TODAY)).toMatchObject({ ok: false }); // pending → completed not allowed
    expect(await updateBookingStatus(b.id, "confirm", TODAY)).toMatchObject({ ok: true, booking: { status: "confirmed" } });
    expect(await updateBookingStatus(b.id, "confirm", TODAY)).toMatchObject({ ok: false });
    expect(await updateBookingStatus(b.id, "complete", TODAY)).toMatchObject({ ok: true, booking: { status: "completed" } });
    expect(await updateBookingStatus(b.id, "cancel", TODAY)).toMatchObject({ ok: false });
  });

  it("cannot complete a booking before check-in", async () => {
    const b = await book(alice, d(5), d(7));
    await updateBookingStatus(b.id, "confirm", TODAY);
    const r = await updateBookingStatus(b.id, "complete", TODAY);
    expect(r).toMatchObject({ ok: false, message: expect.stringMatching(/checked in/) });
  });

  it("admin cancellation records who cancelled and frees the room", async () => {
    const b = await book(alice, d(5), d(7));
    await book(bob, d(5), d(7));
    expect(await updateBookingStatus(b.id, "cancel", TODAY)).toMatchObject({
      ok: true,
      booking: { status: "cancelled", cancelledBy: "admin" },
    });
    await expect(book(bob, d(5), d(7))).resolves.toMatchObject({ roomNumber: b.roomNumber });
  });

  it("sets payment status; not on cancelled bookings", async () => {
    const b = await book(alice, d(5), d(7));
    expect(await setPaymentStatus(b.id, "paid")).toMatchObject({ ok: true, booking: { paymentStatus: "paid" } });
    await updateBookingStatus(b.id, "cancel", TODAY);
    expect(await setPaymentStatus(b.id, "unpaid")).toMatchObject({ ok: false });
  });

  it("searches by reference, customer name/email and filters by status and dates", async () => {
    const a = await book(alice, d(5), d(7));
    await book(bob, d(20), d(22));
    await updateBookingStatus(a.id, "confirm", TODAY);

    expect((await listBookingsForAdmin({ q: a.referenceCode })).rows.map((r) => r.id)).toEqual([a.id]);
    expect((await listBookingsForAdmin({ q: "bob@" })).total).toBe(1);
    expect((await listBookingsForAdmin({ q: "rahman" })).total).toBe(1);
    expect((await listBookingsForAdmin({ status: "confirmed" })).total).toBe(1);
    expect((await listBookingsForAdmin({ from: d(19), to: d(25) })).total).toBe(1);
    expect((await listBookingsForAdmin({ q: "(.*" })).total).toBe(0); // regex characters are escaped
  });

  it("computes dashboard statistics (FR-ADM-01)", async () => {
    const staying = await book(alice, d(-1), d(2)); // occupies a room tonight
    const arriving = await book(bob, TODAY, d(1));
    await book(alice, d(10), d(12), "suite");
    await setPaymentStatus(staying.id, "paid");
    await updateBookingStatus(arriving.id, "confirm", TODAY);

    const s = await getDashboardStats(TODAY);
    expect(s).toMatchObject({
      totalBookings: 3,
      pendingBookings: 2,
      occupiedRooms: 2,
      bookableRooms: 3, // 203 is under maintenance
      occupancyRate: 67,
      totalRevenue: 15000,
      registeredCustomers: 2,
    });
    expect(s.todaysCheckIns.map((b) => b.id)).toEqual([arriving.id]);
  });
});

describe("user management (FR-ADM-08)", () => {
  it("blocks and unblocks customers, which ends their session immediately", async () => {
    expect(await setUserBlocked(alice, true)).toEqual({ ok: true });
    expect(await findActiveSessionUser(alice)).toBeNull();
    expect(await authenticateUser({ email: "alice@test.com", password: "secret123" })).toMatchObject({ ok: false, reason: "blocked" });
    expect(await setUserBlocked(alice, false)).toEqual({ ok: true });
    expect(await findActiveSessionUser(alice)).not.toBeNull();
  });

  it("never blocks an administrator", async () => {
    expect(await setUserBlocked(adminId, true)).toMatchObject({ ok: false });
  });

  it("lists users with booking counts", async () => {
    const b = await book(alice, d(5), d(7));
    await book(alice, d(10), d(11));
    await updateBookingStatus(b.id, "cancel", TODAY);
    const rows = await listUsersForAdmin();
    expect(rows.find((u) => u.email === "alice@test.com")).toMatchObject({ bookingCount: 2, activeBookingCount: 1 });
    expect(await listUsersForAdmin("bob")).toHaveLength(1);
  });
});

describe("reviews (FR-REV-01 … FR-REV-04)", () => {
  const input = reviewSchema.parse({ rating: 5, comment: "Wonderful stay, very clean." });

  async function completedStay(userId = alice) {
    const b = await book(userId, d(-5), d(-3));
    await updateBookingStatus(b.id, "confirm", TODAY);
    await updateBookingStatus(b.id, "complete", TODAY);
    return b;
  }

  it("only allows the owner to review a completed stay, once", async () => {
    const pending = await book(alice, d(5), d(7));
    expect(await createReview(alice, pending.id, input)).toMatchObject({ ok: false, message: expect.stringMatching(/completed/) });

    const done = await completedStay();
    expect(await createReview(bob, done.id, input)).toMatchObject({ ok: false, message: "Booking not found." });
    expect(await createReview(alice, done.id, input)).toMatchObject({ ok: true, review: { rating: 5, authorName: "Alice R." } });
    expect(await createReview(alice, done.id, input)).toMatchObject({ ok: false, message: expect.stringMatching(/already/) });
  });

  it("averages visible reviews; hidden and deleted ones are excluded", async () => {
    const one = await completedStay(alice);
    const two = await completedStay(bob);
    const r1 = await createReview(alice, one.id, { rating: 5, comment: "Excellent all round!" });
    await createReview(bob, two.id, { rating: 2, comment: "Noisy at night, sorry." });

    expect((await getRoomTypeReviews(deluxeId)).summary).toEqual({ average: 3.5, count: 2 });
    if (!r1.ok) throw new Error("setup");
    await setReviewHidden(r1.review.id, true);
    expect((await getRoomTypeReviews(deluxeId)).summary).toEqual({ average: 2, count: 1 });
    expect((await getRatingSummaries()).get(deluxeId)).toEqual({ average: 2, count: 1 });
    await setReviewHidden(r1.review.id, false);
    await deleteReview(r1.review.id);
    expect((await getRoomTypeReviews(deluxeId)).summary.count).toBe(1);
  });

  it("validates rating and comment", () => {
    expect(reviewSchema.safeParse({ rating: 0, comment: "Long enough comment" }).success).toBe(false);
    expect(reviewSchema.safeParse({ rating: 6, comment: "Long enough comment" }).success).toBe(false);
    expect(reviewSchema.safeParse({ rating: 4, comment: "short" }).success).toBe(false);
  });

  it("shows reviewer names as first name and last initial", () => {
    expect(displayName("Ayesha Rahman")).toBe("Ayesha R.");
    expect(displayName("Madonna")).toBe("Madonna");
    expect(displayName("Md. Tanvir Hasan")).toBe("Md. H.");
  });
});

describe("room filters (FR-ROOM-03)", () => {
  it("filters by maximum price and guest capacity", async () => {
    expect((await listActiveRoomTypes(undefined, { maxPrice: 6000 })).map((t) => t.slug)).toEqual(["deluxe"]);
    expect((await listActiveRoomTypes(undefined, { guests: 3 })).map((t) => t.slug)).toEqual(["suite"]);
    expect(await listActiveRoomTypes(undefined, { guests: 3, maxPrice: 6000 })).toEqual([]);
  });
});

describe("profile (FR-AUTH-09)", () => {
  it("updates name and phone", async () => {
    await updateProfile(alice, { name: "Alice Karim", phone: "01799999999" });
    expect(await getProfile(alice)).toMatchObject({ name: "Alice Karim", phone: "01799999999", email: "alice@test.com" });
  });

  it("changes the password only with the correct current password", async () => {
    const parse = (current: string, next: string) =>
      changePasswordSchema.parse({ currentPassword: current, newPassword: next, confirmNewPassword: next });
    expect(await changePassword(alice, parse("wrong-pass1", "newpass123"))).toMatchObject({ ok: false, field: "currentPassword" });
    expect(await changePassword(alice, parse("secret123", "newpass123"))).toEqual({ ok: true });
    expect((await authenticateUser({ email: "alice@test.com", password: "newpass123" })).ok).toBe(true);
    expect((await authenticateUser({ email: "alice@test.com", password: "secret123" })).ok).toBe(false);
  });

  it("rejects a new password equal to the current one or not confirmed", () => {
    expect(changePasswordSchema.safeParse({ currentPassword: "secret123", newPassword: "secret123", confirmNewPassword: "secret123" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ currentPassword: "secret123", newPassword: "newpass123", confirmNewPassword: "other123" }).success).toBe(false);
  });
});
