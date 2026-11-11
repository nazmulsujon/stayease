"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addDays, hotelToday } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  MAX_DAYS_AHEAD,
  MAX_GUESTS,
  MAX_NIGHTS,
  staySearchSchema,
  type StaySearch,
  type StaySearchFormValues,
} from "@/validations/booking";

/**
 * Stay search form (FR-AVAIL-01) with client-side date validation
 * (FR-AVAIL-02). The server validates the same values again.
 *
 * - Without `roomTypeSlug` it searches all room types (→ /search).
 * - With `roomTypeSlug` it starts booking that room type (→ /booking/new).
 *
 * "Today" is read in the browser only (useSyncExternalStore with an empty
 * server snapshot), never while prerendering, so the static page shell does
 * not contain the build date.
 */
const noopSubscribe = () => () => {};
function useHotelToday(): string | undefined {
  return useSyncExternalStore(noopSubscribe, hotelToday, () => undefined);
}

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

  const form = useForm<StaySearchFormValues, unknown, StaySearch>({
    // Build the schema at validation time so "today" is always current.
    resolver: ((values, context, options) =>
      zodResolver(staySearchSchema())(values, context, options)) as Resolver<
      StaySearchFormValues,
      unknown,
      StaySearch
    >,
    mode: "onTouched",
    defaultValues: {
      checkIn: defaults?.checkIn ?? "",
      checkOut: defaults?.checkOut ?? "",
      guests: defaults?.guests ?? "1",
    },
  });
  const { errors } = form.formState;

  // Suggest tonight → tomorrow when no dates were given.
  useEffect(() => {
    if (today && !form.getValues("checkIn") && !form.getValues("checkOut")) {
      form.setValue("checkIn", today);
      form.setValue("checkOut", addDays(today, 1));
    }
  }, [today, form]);

  // Keep check-out after check-in when the guest moves check-in forward.
  const checkIn = useWatch({ control: form.control, name: "checkIn" });
  useEffect(() => {
    const checkOut = form.getValues("checkOut");
    if (checkIn && checkOut && checkOut <= checkIn && /^\d{4}-\d{2}-\d{2}$/.test(checkIn)) {
      form.setValue("checkOut", addDays(checkIn, 1), { shouldValidate: form.formState.isSubmitted });
    }
  }, [checkIn, form]);

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

  const guestOptions = Array.from({ length: maxGuests }, (_, i) => String(i + 1));
  const stacked = layout === "stacked";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Check availability"
      className={cn(
        "grid gap-4",
        stacked ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-[1fr_1fr_140px_auto] lg:items-start",
      )}
    >
      <Field data-invalid={!!errors.checkIn}>
        <FieldLabel htmlFor="checkIn">Check-in</FieldLabel>
        <Input
          id="checkIn"
          type="date"
          min={today}
          max={today ? addDays(today, MAX_DAYS_AHEAD) : undefined}
          aria-invalid={!!errors.checkIn}
          {...form.register("checkIn")}
        />
        <FieldError errors={[errors.checkIn]} />
      </Field>

      <Field data-invalid={!!errors.checkOut}>
        <FieldLabel htmlFor="checkOut">Check-out</FieldLabel>
        <Input
          id="checkOut"
          type="date"
          min={checkIn ? addDaysSafe(checkIn, 1) : today}
          max={checkIn ? addDaysSafe(checkIn, MAX_NIGHTS) : undefined}
          aria-invalid={!!errors.checkOut}
          {...form.register("checkOut")}
        />
        <FieldError errors={[errors.checkOut]} />
      </Field>

      <Field data-invalid={!!errors.guests}>
        <FieldLabel htmlFor="guests">Guests</FieldLabel>
        <Controller
          control={form.control}
          name="guests"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="guests" className="w-full" aria-invalid={!!errors.guests}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {guestOptions.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n} {n === "1" ? "guest" : "guests"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError errors={[errors.guests]} />
      </Field>

      <div className={cn(!stacked && "sm:col-span-2 lg:col-span-1 lg:pt-[1.375rem]")}>
        <Button type="submit" size="lg" className="w-full">
          <CalendarSearch aria-hidden />
          {submitLabel ?? (roomTypeSlug ? "Check availability" : "Search rooms")}
        </Button>
      </div>
    </form>
  );
}

function addDaysSafe(date: string, days: number) {
  try {
    return addDays(date, days);
  } catch {
    return undefined;
  }
}
