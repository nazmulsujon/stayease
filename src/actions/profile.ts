"use server";

import { refresh } from "next/cache";
import {
  UNEXPECTED_FAILURE,
  fieldFailure,
  validationFailure,
  type ActionResult,
} from "@/lib/action-result";
import { authorize } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { changePassword, updateProfile } from "@/services/profile.service";
import { changePasswordSchema, profileSchema } from "@/validations/profile";

/** FR-AUTH-09: any logged-in user (customer or admin) manages their own account. */

export async function updateProfileAction(values: unknown): Promise<ActionResult> {
  try {
    await dbConnect();
    const auth = await authorize();
    if (!auth.ok) return { ok: false, formError: auth.message };
    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) return validationFailure(parsed.error);
    await updateProfile(auth.user.id, parsed.data);
    refresh(); // header shows the new name
    return { ok: true };
  } catch (error) {
    console.error("[updateProfileAction]", error);
    return UNEXPECTED_FAILURE;
  }
}

export async function changePasswordAction(values: unknown): Promise<ActionResult> {
  try {
    await dbConnect();
    const auth = await authorize();
    if (!auth.ok) return { ok: false, formError: auth.message };
    const parsed = changePasswordSchema.safeParse(values);
    if (!parsed.success) return validationFailure(parsed.error);
    const result = await changePassword(auth.user.id, parsed.data);
    return result.ok ? { ok: true } : fieldFailure(result.field, result.message);
  } catch (error) {
    console.error("[changePasswordAction]", error);
    return UNEXPECTED_FAILURE;
  }
}
