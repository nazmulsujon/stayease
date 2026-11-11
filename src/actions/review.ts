"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { UNEXPECTED_FAILURE, validationFailure, type ActionResult } from "@/lib/action-result";
import { authorize } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { createReview, deleteReview, setReviewHidden } from "@/services/review.service";
import { objectIdSchema } from "@/validations/catalogue";
import { reviewSchema } from "@/validations/review";

/** Review Server Actions: customers write (FR-REV-01/02), admins moderate (FR-REV-04). */

export async function createReviewAction(bookingId: unknown, values: unknown): Promise<ActionResult> {
  try {
    await dbConnect();
    const auth = await authorize("customer");
    if (!auth.ok) return { ok: false, formError: auth.message };
    const id = objectIdSchema.safeParse(bookingId);
    if (!id.success) return { ok: false, formError: "Booking not found." };
    const parsed = reviewSchema.safeParse(values);
    if (!parsed.success) return validationFailure(parsed.error);

    const result = await createReview(auth.user.id, id.data, parsed.data);
    if (!result.ok) return { ok: false, formError: result.message };
    refresh();
    return { ok: true };
  } catch (error) {
    console.error("[createReviewAction]", error);
    return UNEXPECTED_FAILURE;
  }
}

const moderateSchema = z.object({
  id: objectIdSchema,
  action: z.enum(["hide", "show", "delete"]),
});

export async function moderateReviewAction(id: unknown, action: unknown): Promise<ActionResult> {
  try {
    await dbConnect();
    const auth = await authorize("admin");
    if (!auth.ok) return { ok: false, formError: auth.message };
    const parsed = moderateSchema.safeParse({ id, action });
    if (!parsed.success) return { ok: false, formError: "Invalid request." };

    const done =
      parsed.data.action === "delete"
        ? await deleteReview(parsed.data.id)
        : await setReviewHidden(parsed.data.id, parsed.data.action === "hide");
    if (!done) return { ok: false, formError: "Review not found." };
    refresh();
    return { ok: true };
  } catch (error) {
    console.error("[moderateReviewAction]", error);
    return UNEXPECTED_FAILURE;
  }
}
