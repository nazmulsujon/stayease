import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { BOOKING_STATUSES, PAYMENT_STATUSES } from "@/types/booking";

/**
 * Booking collection (docs/PROJECT_PLAN.md §12.2 `bookings`).
 * checkIn / checkOut are date-only values stored as UTC midnight.
 * pricePerNight is a snapshot taken at booking time (FR-BOOK-07).
 */
const bookingSchema = new Schema(
  {
    referenceCode: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    roomType: { type: Schema.Types.ObjectId, ref: "RoomType", required: true, index: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true, min: 1 },
    guests: { type: Number, required: true, min: 1 },
    pricePerNight: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: BOOKING_STATUSES, default: "pending", required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "unpaid", required: true },
    specialRequest: { type: String, default: "", maxlength: 500 },
    cancelledBy: { type: String, enum: ["customer", "admin", null], default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Fast overlap checks for one room (§12.4).
bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
// "My bookings" list.
bookingSchema.index({ user: 1, checkIn: -1 });

export type BookingDoc = InferSchemaType<typeof bookingSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Booking: Model<BookingDoc> =
  (mongoose.models.Booking as Model<BookingDoc> | undefined) ??
  mongoose.model<BookingDoc>("Booking", bookingSchema);
