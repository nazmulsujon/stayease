import { Types } from "mongoose";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { User } from "@/models/user";
import type { ChangePasswordInput, ProfileInput } from "@/validations/profile";

/** User and Profile Module (System Module 2): FR-AUTH-09. */

export type ProfileDTO = { name: string; email: string; phone: string; role: string; memberSince: string };

export async function getProfile(userId: string): Promise<ProfileDTO | null> {
  if (!Types.ObjectId.isValid(userId)) return null;
  const u = await User.findById(userId).select("name email phone role createdAt").lean();
  if (!u) return null;
  return {
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    memberSince: (u as unknown as { createdAt: Date }).createdAt.toISOString(),
  };
}

export async function updateProfile(userId: string, input: ProfileInput): Promise<boolean> {
  const res = await User.updateOne({ _id: userId }, { $set: { name: input.name, phone: input.phone } });
  return res.matchedCount === 1;
}

export type ChangePasswordResult = { ok: true } | { ok: false; field: "currentPassword"; message: string };

export async function changePassword(userId: string, input: ChangePasswordInput): Promise<ChangePasswordResult> {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user || !(await verifyPassword(input.currentPassword, user.passwordHash))) {
    return { ok: false, field: "currentPassword", message: "Current password is incorrect." };
  }
  user.passwordHash = await hashPassword(input.newPassword);
  await user.save();
  return { ok: true };
}
