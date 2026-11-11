import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ROOM_STATUSES } from "@/types/catalogue";

/**
 * Room collection (docs/PROJECT_PLAN.md §12.2 `rooms`).
 * A physical room (e.g. No. 203) belonging to one RoomType.
 */
const roomSchema = new Schema(
  {
    roomNumber: { type: String, required: true, trim: true, uppercase: true, unique: true },
    floor: { type: Number, required: true, min: 0 },
    roomType: { type: Schema.Types.ObjectId, ref: "RoomType", required: true, index: true },
    status: { type: String, enum: ROOM_STATUSES, default: "available", required: true },
    /**
     * Room-level lock used by booking transactions (§12.5). Every booking
     * transaction that assigns this room increments it first, so two
     * concurrent transactions on the same room cause a write conflict.
     */
    lockVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type RoomDoc = InferSchemaType<typeof roomSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Room: Model<RoomDoc> =
  (mongoose.models.Room as Model<RoomDoc> | undefined) ??
  mongoose.model<RoomDoc>("Room", roomSchema);
