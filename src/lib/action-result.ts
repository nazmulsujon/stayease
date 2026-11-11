import { z } from "zod";

/**
 * Standard result shape returned by Server Actions to forms.
 * `fieldErrors` is keyed by form field name.
 */
export type ActionFailure = {
  ok: false;
  /** Message shown at the top of the form. */
  formError?: string;
  /** Per-field messages, keyed by field name. */
  fieldErrors?: Record<string, string[] | undefined>;
};

export type ActionResult = { ok: true } | ActionFailure;

export function validationFailure(error: z.ZodError): ActionFailure {
  return {
    ok: false,
    formError: "Please correct the highlighted fields.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[] | undefined>,
  };
}

export function fieldFailure(field: string, message: string): ActionFailure {
  return { ok: false, fieldErrors: { [field]: [message] } };
}

export const UNEXPECTED_FAILURE: ActionFailure = {
  ok: false,
  formError: "Something went wrong on our side. Please try again in a moment.",
};
