import { Types } from "mongoose";
import { hotelToday, parseDateString, toDateString, type DateString } from "@/lib/dates";
import { Booking, type BookingDoc } from "@/models/booking";
import { Room } from "@/models/room";
import { User } from "@/models/user";
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_STATUSES,
  type BookingStatus,
  type PaymentStatus,
} from "@/types/booking";

/**
 * Admin Dashboard Module (System Module 7): statistics, booking management
 * (FR-ADM-01, FR-ADM-05 … FR-ADM-07) and user management (FR-ADM-08).
 * Every function here is ADMIN ONLY — callers must authorise first.
 */

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isId = (id: string) => Types.ObjectId.isValid(id) && /^[a-f\d]{24}$/i.test(id);

// ─── Types ───────────────────────────────────────────────────────────

export type AdminBookingRow = {
  id: string;
  referenceCode: string;
  customer: { id: string; name: string; email: string; phone: string };
  roomTypeName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  pricePerNight: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  specialRequest: string;
  cancelledBy: "customer" | "admin" | null;
  createdAt: string;
};

type PopulatedAdminBooking = BookingDoc & {
  user: { _id: Types.ObjectId; name: string; email: string; phone: string } | null;
  room: { roomNumber: string } | null;
  roomType: { name: string } | null;
};

type AdminRefs = {
  user: PopulatedAdminBooking["user"];
  room: PopulatedAdminBooking["room"];
  roomType: PopulatedAdminBooking["roomType"];
};

function toRow(doc: PopulatedAdminBooking): AdminBookingRow {
  return {
    id: String(doc._id),
    referenceCode: doc.referenceCode,
    customer: {
      id: String(doc.user?._id ?? ""),
      name: doc.user?.name ?? "Deleted user",
      email: doc.user?.email ?? "",
      phone: doc.user?.phone ?? "",
    },
    roomTypeName: doc.roomType?.name ?? "—",
    roomNumber: doc.room?.roomNumber ?? "—",
    checkIn: toDateString(doc.checkIn),
    checkOut: toDateString(doc.checkOut),
    nights: doc.nights,
    guests: doc.guests,
    totalPrice: doc.totalPrice,
    pricePerNight: doc.pricePerNight,
    status: doc.status as BookingStatus,
    paymentStatus: doc.paymentStatus as PaymentStatus,
    specialRequest: doc.specialRequest ?? "",
    cancelledBy: (doc.cancelledBy as AdminBookingRow["cancelledBy"]) ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

async function findRows(filter: object, opts: { sort?: object; skip?: number; limit?: number } = {}) {
  const docs = await Booking.find(filter)
    .sort(opts.sort ? (opts.sort as Record<string, 1 | -1>) : { createdAt: -1 })
    .skip(opts.skip ?? 0)
    .limit(opts.limit ?? 0)
    .populate<AdminRefs>("user", "name email phone")
    .populate<AdminRefs>("room", "roomNumber")
    .populate<AdminRefs>("roomType", "name")
    .lean();
  return (docs as PopulatedAdminBooking[]).map(toRow);
}

// ─── Dashboard (FR-ADM-01) ───────────────────────────────────────────

export type DashboardStats = {
  totalBookings: number;
  pendingBookings: number;
  todaysCheckIns: AdminBookingRow[];
  todaysCheckOuts: AdminBookingRow[];
  occupiedRooms: number;
  bookableRooms: number;
  occupancyRate: number; // 0–100
  totalRevenue: number; // paid, not cancelled
  registeredCustomers: number;
  recentPending: AdminBookingRow[];
};

export async function getDashboardStats(today: DateString = hotelToday()): Promise<DashboardStats> {
  const todayDate = parseDateString(today);
  const active = { $in: ACTIVE_BOOKING_STATUSES };

  const [
    totalBookings,
    pendingBookings,
    todaysCheckIns,
    todaysCheckOuts,
    occupied,
    bookableRooms,
    revenue,
    registeredCustomers,
    recentPending,
  ] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ status: "pending" }),
    findRows({ status: active, checkIn: todayDate }, { sort: { roomType: 1 } }),
    findRows({ status: { $in: ["pending", "confirmed", "completed"] }, checkOut: todayDate }, { sort: { roomType: 1 } }),
    // Rooms occupied tonight: active stays with checkIn <= today < checkOut.
    Booking.distinct("room", { status: active, checkIn: { $lte: todayDate }, checkOut: { $gt: todayDate } }),
    Room.countDocuments({ status: "available" }),
    Booking.aggregate<{ total: number }>([
      { $match: { paymentStatus: "paid", status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]),
    User.countDocuments({ role: "customer" }),
    findRows({ status: "pending" }, { sort: { checkIn: 1 }, limit: 5 }),
  ]);

  const occupiedRooms = occupied.length;
  return {
    totalBookings,
    pendingBookings,
    todaysCheckIns,
    todaysCheckOuts,
    occupiedRooms,
    bookableRooms,
    occupancyRate: bookableRooms ? Math.round((occupiedRooms / bookableRooms) * 100) : 0,
    totalRevenue: revenue[0]?.total ?? 0,
    registeredCustomers,
    recentPending,
  };
}

// ─── Booking list (FR-ADM-05) ────────────────────────────────────────

export type BookingListQuery = {
  q?: string; // reference code, customer name or email
  status?: string;
  from?: string; // stays overlapping [from, to]
  to?: string;
  page?: number;
};

export const ADMIN_PAGE_SIZE = 15;

export async function listBookingsForAdmin(query: BookingListQuery) {
  const filter: Record<string, unknown> = {};

  if (query.status && (BOOKING_STATUSES as readonly string[]).includes(query.status)) {
    filter.status = query.status;
  }
  // Date range: bookings whose stay overlaps the selected period.
  if (query.from && /^\d{4}-\d{2}-\d{2}$/.test(query.from)) {
    filter.checkOut = { $gt: parseDateString(query.from) };
  }
  if (query.to && /^\d{4}-\d{2}-\d{2}$/.test(query.to)) {
    filter.checkIn = { $lte: parseDateString(query.to) };
  }

  const q = query.q?.trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    const users = await User.find({ $or: [{ name: rx }, { email: rx }, { phone: rx }] })
      .select("_id")
      .limit(200)
      .lean();
    filter.$or = [{ referenceCode: rx }, { user: { $in: users.map((u) => u._id) } }];
  }

  const page = Math.max(1, Math.floor(query.page ?? 1));
  const [rows, total] = await Promise.all([
    findRows(filter, { sort: { createdAt: -1 }, skip: (page - 1) * ADMIN_PAGE_SIZE, limit: ADMIN_PAGE_SIZE }),
    Booking.countDocuments(filter),
  ]);
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getBookingForAdmin(id: string): Promise<AdminBookingRow | null> {
  if (!isId(id)) return null;
  const [row] = await findRows({ _id: id }, { limit: 1 });
  return row ?? null;
}

// ─── Booking status & payment (FR-ADM-06, FR-ADM-07) ─────────────────

export type BookingAction = "confirm" | "cancel" | "complete";

export type AdminUpdateResult =
  | { ok: true; booking: AdminBookingRow }
  | { ok: false; message: string };

/**
 * Allowed transitions (§10.2):
 *   confirm:  pending → confirmed
 *   cancel:   pending | confirmed → cancelled (by admin)
 *   complete: confirmed → completed, once the stay has started (check-in ≤ today)
 * Each is a single conditional update, so two admins clicking at the same
 * time cannot produce an invalid status.
 */
export async function updateBookingStatus(
  id: string,
  action: BookingAction,
  today: DateString = hotelToday(),
): Promise<AdminUpdateResult> {
  if (!isId(id)) return { ok: false, message: "Booking not found." };

  const rules: Record<BookingAction, { from: BookingStatus[]; set: Record<string, unknown>; extra?: object }> = {
    confirm: { from: ["pending"], set: { status: "confirmed" } },
    cancel: {
      from: ["pending", "confirmed"],
      set: { status: "cancelled", cancelledBy: "admin", cancelledAt: new Date() },
    },
    complete: {
      from: ["confirmed"],
      set: { status: "completed" },
      extra: { checkIn: { $lte: parseDateString(today) } },
    },
  };
  const rule = rules[action];
  const res = await Booking.updateOne(
    { _id: id, status: { $in: rule.from }, ...rule.extra },
    { $set: rule.set },
  );

  if (res.modifiedCount === 0) {
    const current = await Booking.findById(id).select("status checkIn").lean();
    if (!current) return { ok: false, message: "Booking not found." };
    if (action === "complete" && current.status === "confirmed") {
      return { ok: false, message: "A booking can only be completed once the guest has checked in." };
    }
    const verb = { confirm: "confirmed", cancel: "cancelled", complete: "completed" }[action];
    return { ok: false, message: `A ${current.status} booking cannot be ${verb}.` };
  }
  return { ok: true, booking: (await getBookingForAdmin(id))! };
}

/** FR-ADM-07: admins only. Cancelled bookings keep their last payment status. */
export async function setPaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<AdminUpdateResult> {
  if (!isId(id)) return { ok: false, message: "Booking not found." };
  const res = await Booking.updateOne(
    { _id: id, status: { $ne: "cancelled" } },
    { $set: { paymentStatus } },
  );
  if (res.matchedCount === 0) {
    return (await Booking.exists({ _id: id }))
      ? { ok: false, message: "Payment status of a cancelled booking cannot be changed." }
      : { ok: false, message: "Booking not found." };
  }
  return { ok: true, booking: (await getBookingForAdmin(id))! };
}

// ─── Users (FR-ADM-08) ───────────────────────────────────────────────

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin";
  isBlocked: boolean;
  createdAt: string;
  bookingCount: number;
  activeBookingCount: number;
};

export async function listUsersForAdmin(q?: string): Promise<AdminUserRow[]> {
  const filter: Record<string, unknown> = {};
  if (q?.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const users = await User.find(filter).sort({ role: 1, createdAt: -1 }).limit(500).lean();
  const counts = await Booking.aggregate<{ _id: Types.ObjectId; total: number; active: number }>([
    { $match: { user: { $in: users.map((u) => u._id) } } },
    {
      $group: {
        _id: "$user",
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $in: ["$status", [...ACTIVE_BOOKING_STATUSES]] }, 1, 0] } },
      },
    },
  ]);
  const byUser = new Map(counts.map((c) => [String(c._id), c]));
  return users.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role as AdminUserRow["role"],
    isBlocked: u.isBlocked,
    createdAt: (u as unknown as { createdAt: Date }).createdAt.toISOString(),
    bookingCount: byUser.get(String(u._id))?.total ?? 0,
    activeBookingCount: byUser.get(String(u._id))?.active ?? 0,
  }));
}

/** Blocks/unblocks a CUSTOMER account. Admin accounts cannot be blocked from the UI (§5). */
export async function setUserBlocked(
  id: string,
  isBlocked: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isId(id)) return { ok: false, message: "User not found." };
  const res = await User.updateOne({ _id: id, role: "customer" }, { $set: { isBlocked } });
  if (res.matchedCount === 0) {
    return (await User.exists({ _id: id }))
      ? { ok: false, message: "Administrator accounts cannot be blocked." }
      : { ok: false, message: "User not found." };
  }
  return { ok: true };
}
