"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { createReviewAction } from "@/actions/review";
import { applyServerFieldErrors } from "@/components/forms/apply-server-errors";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { reviewSchema, type ReviewFormValues, type ReviewInput } from "@/validations/review";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Review form for a completed stay (FR-REV-01, FR-REV-02). */
export function ReviewForm({ bookingId }: { bookingId: string }) {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const [hover, setHover] = useState(0);

  const form = useForm<ReviewFormValues, unknown, ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await createReviewAction(bookingId, values);
      if (result.ok) {
        toast.success("Thank you for your review!");
      } else {
        setFormError(result.formError);
        applyServerFieldErrors(result.fieldErrors, form.setError);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormAlert message={formError} />
      <Field data-invalid={!!errors.rating}>
        <FieldLabel id="rating-label">Your rating</FieldLabel>
        <Controller
          control={form.control}
          name="rating"
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <div role="radiogroup" aria-labelledby="rating-label" className="flex" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const lit = n <= (hover || field.value);
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={field.value === n}
                      aria-label={`${n} star${n > 1 ? "s" : ""}, ${LABELS[n]}`}
                      onClick={() => field.onChange(n)}
                      onMouseEnter={() => setHover(n)}
                      className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <Star className={cn("size-7", lit ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} aria-hidden />
                    </button>
                  );
                })}
              </div>
              <span className="text-sm text-muted-foreground">{LABELS[hover || field.value]}</span>
            </div>
          )}
        />
        <FieldError errors={[errors.rating]} />
      </Field>
      <Field data-invalid={!!errors.comment}>
        <FieldLabel htmlFor="comment">Your review</FieldLabel>
        <Textarea
          id="comment"
          rows={4}
          maxLength={1000}
          placeholder="What did you enjoy? Anything we could do better?"
          aria-invalid={!!errors.comment}
          {...form.register("comment")}
        />
        <FieldError errors={[errors.comment]} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Submit review
      </Button>
    </form>
  );
}
