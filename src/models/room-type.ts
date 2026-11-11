import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * RoomType collection (docs/PROJECT_PLAN.md §12.2 `roomtypes`).
 * A *kind* of room that customers book, e.g. "Deluxe Double Room".
 */
const roomTypeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true, maxlength: 2000 },
    pricePerNight: { type: Number, required: true, min: 1 }, // BDT
    capacity: { type: Number, required: true, min: 1, max: 10 },
    bedType: { type: String, required: true, trim: true, maxlength: 40 },
    sizeSqft: { type: Number, min: 50, default: null },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export type RoomTypeDoc = InferSchemaType<typeof roomTypeSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const RoomType: Model<RoomTypeDoc> =
  (mongoose.models.RoomType as Model<RoomTypeDoc> | undefined) ??
  mongoose.model<RoomTypeDoc>("RoomType", roomTypeSchema);
