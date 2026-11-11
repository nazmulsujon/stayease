import { z } from "zod";

/** FR-REV-02: rating 1–5 and a comment. */
export const reviewSchema = z.object({
  rating: z
    .number({ error: "Please choose a rating" })
    .int()
    .min(1, "Please choose a rating")
    .max(5, "Rating must be between 1 and 5"),
  comment: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters")
    .max(1000, "Comment must be at most 1000 characters"),
});

export type ReviewFormValues = z.input<typeof reviewSchema>;
export type ReviewInput = z.output<typeof reviewSchema>;
