"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { createBookingAction } from "@/actions/booking";
import { applyServerFieldErrors } from "@/components/forms/apply-server-errors";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import {
  createBookingSchema,
  type CreateBookingFormValues,
  type CreateBookingInput,
} from "@/validations/booking";

/**
 * Final step of the booking flow (FR-BOOK-02, FR-BOOK-10).
 * Sends only what the customer chose; the server recalculates availability
 * and price and assigns the room inside a transaction (FR-BOOK-03/04/05).
 */
export function BookingForm({
  stay,
  totalPrice,
}: {
  stay: { roomType: string; checkIn: string; checkOut: string; guests: string };
  totalPrice: number;
}) {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();

  const form = useForm<CreateBookingFormValues, unknown, CreateBookingInput>({
    resolver: ((values, context, options) =>
      zodResolver(createBookingSchema())(values, context, options)) as Resolver<
      CreateBookingFormValues,
      unknown,
      CreateBookingInput
    >,
    defaultValues: { ...stay, specialRequest: "" },
  });
  const { errors } = form.formState;
  const length = useWatch({ control: form.control, name: "specialRequest" })?.length ?? 0;

  const onSubmit = form.handleSubmit(
    () => {
      setFormError(undefined);
      const raw = form.getValues();
      startTransition(async () => {
        // On success the action redirects to the confirmation page.
        const result = await createBookingAction(raw);
        if (result) {
          setFormError(result.formError);
          applyServerFieldErrors(result.fieldErrors, form.setError);
        }
      });
    },
    // Date problems belong to hidden fields; show them at the top instead.
    (fieldErrors) => {
      const dateError = fieldErrors.checkIn ?? fieldErrors.checkOut ?? fieldErrors.guests;
      if (dateError?.message) setFormError(`${dateError.message}. Please change your dates.`);
    },
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormAlert message={formError} />
      <Field data-invalid={!!errors.specialRequest}>
        <FieldLabel htmlFor="specialRequest">Special request (optional)</FieldLabel>
        <Textarea
          id="specialRequest"
          rows={3}
          maxLength={500}
          placeholder="e.g. late arrival around 10 PM, extra pillows…"
          aria-invalid={!!errors.specialRequest}
          {...form.register("specialRequest")}
        />
        <FieldDescription>{length}/500 characters. Requests are not guaranteed.</FieldDescription>
        <FieldError errors={[errors.specialRequest]} />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {pending ? "Confirming…" : `Confirm booking · ${formatCurrency(totalPrice)}`}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Your booking is held as <strong>Pending</strong> until the hotel confirms it.
      </p>
    </form>
  );
}
