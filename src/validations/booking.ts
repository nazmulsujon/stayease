import { z } from "zod";
import { addDays, hotelToday, isValidDateString, nightsBetween } from "@/lib/dates";

/**
 * Stay date validation (FR-AVAIL-02, FR-AVAIL-03), shared by the search form,
 * the booking form (browser) and the Server Actions / pages (server).
 *
 * `today` is the hotel's date. It is a parameter so that tests can fix it;
 * normal callers use the default.
 */

export const MAX_NIGHTS = 30; // FR-AVAIL-03
export const MAX_DAYS_AHEAD = 365; // bookings open one year in advance
export const MAX_GUESTS = 10;

const dateField = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .refine(isValidDateString, `${label} must be a valid date`);

const guestsField = z
  .string({ error: "Number of guests is required" })
  .trim()
  .min(1, "Number of guests is required")
  .regex(/^\d+$/, "Number of guests must be a whole number")
  .transform(Number)
  .pipe(
    z
      .number()
      .min(1, "At least 1 guest is required")
      .max(MAX_GUESTS, `At most ${MAX_GUESTS} guests per room`),
  );

type StayShape = { checkIn: string; checkOut: string };

/** Cross-field date rules. Adds issues to `checkIn` / `checkOut`. */
function refineStay(today: string) {
  return (data: StayShape, ctx: z.RefinementCtx) => {
    const { checkIn, checkOut } = data;
    if (!isValidDateString(checkIn) || !isValidDateString(checkOut)) return;

    if (checkIn < today) {
      ctx.addIssue({ code: "custom", path: ["checkIn"], message: "Check-in cannot be in the past" });
    } else if (checkIn > addDays(today, MAX_DAYS_AHEAD)) {
      ctx.addIssue({
        code: "custom",
        path: ["checkIn"],
        message: `Bookings open at most ${MAX_DAYS_AHEAD} days in advance`,
      });
    }

    if (checkOut <= checkIn) {
      ctx.addIssue({ code: "custom", path: ["checkOut"], message: "Check-out must be after check-in" });
    } else if (nightsBetween(checkIn, checkOut) > MAX_NIGHTS) {
      ctx.addIssue({
        code: "custom",
        path: ["checkOut"],
        message: `A stay can be at most ${MAX_NIGHTS} nights`,
      });
    }
  };
}

/** Availability search: check-in, check-out, guests (FR-AVAIL-01). */
export function staySearchSchema(today: string = hotelToday()) {
  return z
    .object({
      checkIn: dateField("Check-in date"),
      checkOut: dateField("Check-out date"),
      guests: guestsField,
    })
    .superRefine(refineStay(today));
}

/** Booking request (FR-BOOK-02, FR-BOOK-10). */
export function createBookingSchema(today: string = hotelToday()) {
  return z
    .object({
      roomType: z
        .string({ error: "Room type is required" })
        .regex(/^[a-z0-9-]{1,80}$/, "Invalid room type"),
      checkIn: dateField("Check-in date"),
      checkOut: dateField("Check-out date"),
      guests: guestsField,
      specialRequest: z
        .string()
        .trim()
        .max(500, "Special request must be at most 500 characters")
        .optional()
        .default(""),
    })
    .superRefine(refineStay(today));
}

export type StaySearchFormValues = z.input<ReturnType<typeof staySearchSchema>>;
export type StaySearch = z.output<ReturnType<typeof staySearchSchema>>;
export type CreateBookingFormValues = z.input<ReturnType<typeof createBookingSchema>>;
export type CreateBookingInput = z.output<ReturnType<typeof createBookingSchema>>;
