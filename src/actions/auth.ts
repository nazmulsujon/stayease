"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/auth/session";
import { postLoginRedirect } from "@/lib/auth/redirect";
import { authenticateUser, registerUser } from "@/services/auth.service";
import { loginSchema, registerSchema } from "@/validations/auth";

/**
 * Authentication Server Actions.
 * Input is re-validated here with the same Zod schemas the forms use —
 * client-side validation is only for user experience, never trusted.
 */

export type ActionResult = {
  ok: false;
  /** Message shown at the top of the form. */
  formError?: string;
  /** Per-field messages, keyed by field name. */
  fieldErrors?: Record<string, string[] | undefined>;
};

function validationFailure(error: z.ZodError): ActionResult {
  return {
    ok: false,
    formError: "Please correct the highlighted fields.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[] | undefined>,
  };
}

const UNEXPECTED: ActionResult = {
  ok: false,
  formError: "Something went wrong on our side. Please try again in a moment.",
};

// FR-AUTH-01, FR-AUTH-02
export async function registerAction(values: unknown, next?: string): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success) return validationFailure(parsed.error);

  let destination: string;
  try {
    await dbConnect();
    const result = await registerUser(parsed.data);
    if (!result.ok) {
      return {
        ok: false,
        fieldErrors: { email: ["An account with this email already exists."] },
      };
    }
    await createSession(result.user); // log the new customer in straight away
    destination = postLoginRedirect(result.user.role, next);
  } catch (error) {
    console.error("[registerAction]", error);
    return UNEXPECTED;
  }
  redirect(destination); // must be outside try/catch: redirect() works by throwing
}

// FR-AUTH-04, FR-AUTH-05, FR-AUTH-08
export async function loginAction(values: unknown, next?: string): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return validationFailure(parsed.error);

  let destination: string;
  try {
    await dbConnect();
    const result = await authenticateUser(parsed.data);
    if (!result.ok) {
      return {
        ok: false,
        formError:
          result.reason === "blocked"
            ? "Your account has been blocked. Please contact the hotel for help."
            : "Invalid email or password.",
      };
    }
    await createSession(result.user);
    destination = postLoginRedirect(result.user.role, next);
  } catch (error) {
    console.error("[loginAction]", error);
    return UNEXPECTED;
  }
  redirect(destination);
}

// FR-AUTH-06
export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/");
}
