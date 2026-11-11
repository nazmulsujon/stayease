import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Review collection (docs/PROJECT_PLAN.md §12.2 `reviews`).
 * One review per completed booking (unique index on `booking`).
 */
const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roomType: { type: Schema.Types.ObjectId, ref: "RoomType", required: true, index: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type ReviewDoc = InferSchemaType<typeof reviewSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export const Review: Model<ReviewDoc> =
  (mongoose.models.Review as Model<ReviewDoc> | undefined) ??
  mongoose.model<ReviewDoc>("Review", reviewSchema);
