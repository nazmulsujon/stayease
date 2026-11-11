"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  UNEXPECTED_FAILURE,
  validationFailure,
  type ActionFailure,
  type ActionResult,
} from "@/lib/action-result";
import { authorize } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { cancelBookingByCustomer, createBooking } from "@/services/booking.service";
import { objectIdSchema } from "@/validations/catalogue";
import { createBookingSchema } from "@/validations/booking";

/**
 * Customer booking Server Actions.
 * Only logged-in customers may book or cancel (FR-BOOK-01); this is checked
 * against the database here, independently of the page and proxy checks.
 * Prices are always computed on the server (FR-BOOK-03) — the form only
 * sends the room type, dates, guests and special request.
 */

// FR-BOOK-01 … FR-BOOK-07, FR-BOOK-10
export async function createBookingAction(values: unknown): Promise<ActionFailure> {
  let bookingId: string;
  try {
    await dbConnect();
    const auth = await authorize("customer");
    if (!auth.ok) return { ok: false, formError: auth.message };

    const parsed = createBookingSchema().safeParse(values); // FR-AVAIL-02 (server side)
    if (!parsed.success) return validationFailure(parsed.error);

    const result = await createBooking({
      userId: auth.user.id,
      roomTypeSlug: parsed.data.roomType,
      checkIn: parsed.data.checkIn,
      checkOut: parsed.data.checkOut,
      guests: parsed.data.guests,
      specialRequest: parsed.data.specialRequest,
    });
    if (!result.ok) return { ok: false, formError: result.message };
    bookingId = result.booking.id;
  } catch (error) {
    console.error("[createBookingAction]", error);
    return UNEXPECTED_FAILURE;
  }
  redirect(`/booking/${bookingId}/confirmation`);
}

// FR-BOOK-09
export async function cancelBookingAction(bookingId: unknown): Promise<ActionResult> {
  try {
    await dbConnect();
    const auth = await authorize("customer");
    if (!auth.ok) return { ok: false, formError: auth.message };

    const id = objectIdSchema.safeParse(bookingId);
    if (!id.success) return { ok: false, formError: "Booking not found." };

    const result = await cancelBookingByCustomer(auth.user.id, id.data);
    if (!result.ok) return { ok: false, formError: result.message };
    refresh();
    return { ok: true };
  } catch (error) {
    console.error("[cancelBookingAction]", error);
    return UNEXPECTED_FAILURE;
  }
}
