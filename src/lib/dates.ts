import { siteConfig } from "@/config/site";

/**
 * Date-only helpers for bookings (docs/PROJECT_PLAN.md §13.1 "timezone" risk).
 *
 * Stay dates have no time of day. They are handled as "YYYY-MM-DD" strings
 * and stored in MongoDB as UTC midnight, so the same calendar date is
 * produced on every server and browser regardless of their time zone.
 * "Today" is always the hotel's local date (Asia/Dhaka).
 *
 * Shared by the browser (form validation) and the server.
 */

export type DateString = string; // "YYYY-MM-DD"

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for real calendar dates in YYYY-MM-DD form ("2026-02-30" is false). */
export function isValidDateString(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return toDateString(date) === value;
}

/** "YYYY-MM-DD" → Date at UTC midnight. */
export function parseDateString(value: DateString): Date {
  if (!isValidDateString(value)) throw new Error(`Invalid date: ${value}`);
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Date (UTC midnight) → "YYYY-MM-DD". */
export function toDateString(date: Date): DateString {
  return date.toISOString().slice(0, 10);
}

/** Today's date at the hotel, e.g. "2026-11-11". */
export function hotelToday(now: Date = new Date()): DateString {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: siteConfig.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(value: DateString, days: number): DateString {
  return toDateString(new Date(parseDateString(value).getTime() + days * DAY_MS));
}

/** Number of nights between check-in and check-out (check-out day is not a night). */
export function nightsBetween(checkIn: DateString, checkOut: DateString): number {
  return Math.round((parseDateString(checkOut).getTime() - parseDateString(checkIn).getTime()) / DAY_MS);
}

/** "Sat, 12 Dec 2026". */
export function formatDate(value: DateString | Date): string {
  const date = typeof value === "string" ? parseDateString(value) : value;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC", // stored dates are UTC midnight
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** "12 Dec – 15 Dec 2026" style range. */
export function formatDateRange(checkIn: DateString, checkOut: DateString): string {
  return `${formatDate(checkIn)} → ${formatDate(checkOut)}`;
}
