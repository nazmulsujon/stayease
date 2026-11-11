"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DateRange } from "react-day-picker";
import { CalendarDays, Minus, Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDays, hotelToday, isValidDateString, nightsBetween } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  MAX_DAYS_AHEAD,
  MAX_GUESTS,
  staySearchSchema,
  type StaySearch,
  type StaySearchFormValues,
} from "@/validations/booking";

/**
 * Stay search / booking bar (FR-AVAIL-01) with client-side date validation
 * (FR-AVAIL-02). The server validates the same values again.
 *
 * - Without `roomTypeSlug` it searches all room types (→ /search).
 * - With `roomTypeSlug` it starts booking that room type (→ /booking/new).
 *
 * Dates are picked as one range in a calendar popover; guests with a stepper.
 * "Today" is read in the browser only, never while prerendering, so the
 * static page shell does not contain the build date.
 */

const noopSubscribe = () => () => {};
function useHotelToday(): string | undefined {
  return useSyncExternalStore(noopSubscribe, hotelToday, () => undefined);
}

function subscribeWide(callback: () => void) {
  const mq = window.matchMedia("(min-width: 640px)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
/** Two calendar months side by side on wider screens. */
function useWideScreen() {
  return useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia("(min-width: 640px)").matches,
    () => true,
  );
}

/** "YYYY-MM-DD" ↔ local Date (the calendar works with local dates). */
const toLocalDate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const fromLocalDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const shortDate = (s: string) =>
  isValidDateString(s)
    ? new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
        new Date(`${s}T00:00:00Z`),
      )
    : undefined;

export function StaySearchForm({
  defaults,
  roomTypeSlug,
  maxGuests = MAX_GUESTS,
  layout = "row",
  submitLabel,
}: {
  defaults?: Partial<StaySearchFormValues>;
  roomTypeSlug?: string;
  maxGuests?: number;
  layout?: "row" | "stacked";
  submitLabel?: string;
}) {
  const router = useRouter();
  const today = useHotelToday();
  const wide = useWideScreen();
  const [datesOpen, setDatesOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);

  const form = useForm<StaySearchFormValues, unknown, StaySearch>({
    // Build the schema at validation time so "today" is always current.
    resolver: ((values, context, options) =>
      zodResolver(staySearchSchema())(values, context, options)) as Resolver<
      StaySearchFormValues,
      unknown,
      StaySearch
    >,
    defaultValues: {
      checkIn: defaults?.checkIn ?? "",
      checkOut: defaults?.checkOut ?? "",
      guests: defaults?.guests ?? (maxGuests >= 2 ? "2" : "1"),
    },
  });
  const { errors, isSubmitted } = form.formState;
  const [checkIn, checkOut, guests] = useWatch({ control: form.control, name: ["checkIn", "checkOut", "guests"] });

  // Suggest tonight → tomorrow when no dates were given.
  useEffect(() => {
    if (today && !form.getValues("checkIn") && !form.getValues("checkOut")) {
      form.setValue("checkIn", today);
      form.setValue("checkOut", addDays(today, 1));
    }
  }, [today, form]);

  const setDates = (range: DateRange | undefined) => {
    const from = range?.from ? fromLocalDate(range.from) : "";
    let to = range?.to ? fromLocalDate(range.to) : "";
    if (to && to <= from) to = ""; // same day clicked twice → still choosing check-out
    form.setValue("checkIn", from, { shouldValidate: isSubmitted });
    form.setValue("checkOut", to, { shouldValidate: isSubmitted });
    if (from && to) setDatesOpen(false);
  };

  const onSubmit = form.handleSubmit((data) => {
    const params = new URLSearchParams({
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: String(data.guests),
    });
    if (roomTypeSlug) {
      params.set("roomType", roomTypeSlug);
      router.push(`/booking/new?${params}`);
    } else {
      router.push(`/search?${params}`);
    }
  });

  const nights =
    isValidDateString(checkIn) && isValidDateString(checkOut) && checkOut > checkIn
      ? nightsBetween(checkIn, checkOut)
      : 0;
  const guestCount = Number(guests) || 1;
  const error = errors.checkIn?.message ?? errors.checkOut?.message ?? errors.guests?.message;
  const stacked = layout === "stacked";

  const selected: DateRange | undefined = isValidDateString(checkIn)
    ? { from: toLocalDate(checkIn), to: isValidDateString(checkOut) ? toLocalDate(checkOut) : undefined }
    : undefined;

  const segment =
    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:outline-none data-[state=open]:bg-muted/70";
  const label = "block text-[11px] font-semibold tracking-wider text-muted-foreground uppercase";

  return (
    <form onSubmit={onSubmit} noValidate aria-label="Check availability" className="w-full">
      <div
        className={cn(
          "rounded-2xl border bg-background p-1.5 text-foreground",
          stacked ? "space-y-1" : "flex flex-col gap-1 md:flex-row md:items-stretch",
        )}
      >
        {/* Dates */}
        <Popover open={datesOpen} onOpenChange={setDatesOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(segment, "md:flex-[1.6]", errors.checkIn || errors.checkOut ? "ring-1 ring-destructive/50" : "")}
              aria-label={`Stay dates: ${shortDate(checkIn) ?? "check-in"} to ${shortDate(checkOut) ?? "check-out"}. Change dates`}
            >
              <CalendarDays className="size-5 shrink-0 text-primary" aria-hidden />
              <span className="grid flex-1 grid-cols-2 gap-4">
                <span>
                  <span className={label}>Check-in</span>
                  <span className={cn("block font-medium", !shortDate(checkIn) && "text-muted-foreground")}>
                    {shortDate(checkIn) ?? "Add date"}
                  </span>
                </span>
                <span className="border-l pl-4">
                  <span className={label}>Check-out</span>
                  <span className={cn("block font-medium", !shortDate(checkOut) && "text-muted-foreground")}>
                    {shortDate(checkOut) ?? "Add date"}
                  </span>
                </span>
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex items-center justify-between gap-4 border-b px-4 py-3 text-sm">
              <span className="font-medium">
                {!checkIn ? "Select check-in date" : !checkOut ? "Select check-out date" : `${nights} ${nights === 1 ? "night" : "nights"}`}
              </span>
              {(checkIn || checkOut) && (
                <button type="button" className="text-muted-foreground underline-offset-4 hover:underline" onClick={() => setDates(undefined)}>
                  Clear
                </button>
              )}
            </div>
            <Calendar
              mode="range"
              numberOfMonths={wide ? 2 : 1}
              selected={selected}
              onSelect={setDates}
              defaultMonth={selected?.from ?? (today ? toLocalDate(today) : undefined)}
              disabled={today ? [{ before: toLocalDate(today) }, { after: toLocalDate(addDays(today, MAX_DAYS_AHEAD)) }] : undefined}
              excludeDisabled
              resetOnSelect
              className="[--cell-size:--spacing(9)]"
            />
          </PopoverContent>
        </Popover>

        {!stacked && <div className="hidden w-px self-stretch bg-border md:block" aria-hidden />}

        {/* Guests */}
        <Controller
          control={form.control}
          name="guests"
          render={({ field }) => (
            <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
              <PopoverTrigger asChild>
                <button type="button" className={cn(segment, "md:flex-1")} aria-label={`Guests: ${guestCount}. Change number of guests`}>
                  <Users className="size-5 shrink-0 text-primary" aria-hidden />
                  <span>
                    <span className={label}>Guests</span>
                    <span className="block font-medium">
                      {guestCount} {guestCount === 1 ? "guest" : "guests"}
                    </span>
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Guests</p>
                    <p className="text-xs text-muted-foreground">Up to {maxGuests} per room</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                      aria-label="Fewer guests"
                      disabled={guestCount <= 1}
                      onClick={() => field.onChange(String(Math.max(1, guestCount - 1)))}
                    >
                      <Minus aria-hidden />
                    </Button>
                    <span className="w-5 text-center font-medium tabular-nums" aria-live="polite">
                      {guestCount}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                      aria-label="More guests"
                      disabled={guestCount >= maxGuests}
                      onClick={() => field.onChange(String(Math.min(maxGuests, guestCount + 1)))}
                    >
                      <Plus aria-hidden />
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className={cn("h-12 rounded-xl px-6 text-base", stacked ? "w-full" : "w-full md:w-auto md:self-center")}
        >
          <Search aria-hidden />
          {submitLabel ?? (roomTypeSlug ? "Check availability" : "Search")}
        </Button>
      </div>

      <div className="mt-2 min-h-5 px-1 text-sm" aria-live="polite">
        {error ? (
          <p className="font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : nights > 0 ? (
          <p className={cn("text-muted-foreground", !stacked && "sr-only")}>
            {nights} {nights === 1 ? "night" : "nights"} · {guestCount} {guestCount === 1 ? "guest" : "guests"}
          </p>
        ) : null}
      </div>
    </form>
  );
}
