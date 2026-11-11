"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { UNEXPECTED_FAILURE, type ActionResult } from "@/lib/action-result";
import { authorize } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import {
  setPaymentStatus,
  setUserBlocked,
  updateBookingStatus,
} from "@/services/admin.service";
import { PAYMENT_STATUSES } from "@/types/booking";
import { objectIdSchema } from "@/validations/catalogue";

/**
 * Admin-only Server Actions for bookings and users (FR-ADM-06 … FR-ADM-08).
 * Payment status can only be changed here, after a database-verified admin
 * check (supervisor requirement 6, FR-ADM-07).
 */

async function asAdmin(label: string, fn: (adminId: string) => Promise<ActionResult>): Promise<ActionResult> {
  try {
    await dbConnect();
    const auth = await authorize("admin");
    if (!auth.ok) return { ok: false, formError: auth.message };
    const result = await fn(auth.user.id);
    if (result.ok) refresh();
    return result;
  } catch (error) {
    console.error(`[${label}]`, error);
    return UNEXPECTED_FAILURE;
  }
}

const statusActionSchema = z.object({
  id: objectIdSchema,
  action: z.enum(["confirm", "cancel", "complete"]),
});

export async function updateBookingStatusAction(id: unknown, action: unknown): Promise<ActionResult> {
  return asAdmin("updateBookingStatusAction", async () => {
    const parsed = statusActionSchema.safeParse({ id, action });
    if (!parsed.success) return { ok: false, formError: "Invalid request." };
    const result = await updateBookingStatus(parsed.data.id, parsed.data.action);
    return result.ok ? { ok: true } : { ok: false, formError: result.message };
  });
}

const paymentSchema = z.object({ id: objectIdSchema, paymentStatus: z.enum(PAYMENT_STATUSES) });

export async function setPaymentStatusAction(id: unknown, paymentStatus: unknown): Promise<ActionResult> {
  return asAdmin("setPaymentStatusAction", async () => {
    const parsed = paymentSchema.safeParse({ id, paymentStatus });
    if (!parsed.success) return { ok: false, formError: "Invalid request." };
    const result = await setPaymentStatus(parsed.data.id, parsed.data.paymentStatus);
    return result.ok ? { ok: true } : { ok: false, formError: result.message };
  });
}

const blockSchema = z.object({ id: objectIdSchema, isBlocked: z.boolean() });

export async function setUserBlockedAction(id: unknown, isBlocked: unknown): Promise<ActionResult> {
  return asAdmin("setUserBlockedAction", async (adminId) => {
    const parsed = blockSchema.safeParse({ id, isBlocked });
    if (!parsed.success) return { ok: false, formError: "Invalid request." };
    if (parsed.data.id === adminId) return { ok: false, formError: "You cannot block your own account." };
    const result = await setUserBlocked(parsed.data.id, parsed.data.isBlocked);
    return result.ok ? { ok: true } : { ok: false, formError: result.message };
  });
}
