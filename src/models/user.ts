import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { USER_ROLES } from "@/types/auth";

/**
 * User collection (docs/PROJECT_PLAN.md §12.2 `users`).
 * `passwordHash` is excluded from queries by default (`select: false`)
 * so it can never leak through an API response by accident (FR-AUTH-03).
 */
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true, // FR-AUTH-02 (enforced by a unique index)
      maxlength: 254,
    },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: "customer", required: true },
    isBlocked: { type: Boolean, default: false }, // FR-AUTH-08
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

// Reuse the compiled model during Next.js hot reloads.
export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc> | undefined) ??
  mongoose.model<UserDoc>("User", userSchema);
