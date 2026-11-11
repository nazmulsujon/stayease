"use server";

import { redirect } from "next/navigation";
import {
  UNEXPECTED_FAILURE as UNEXPECTED,
  validationFailure,
  type ActionFailure,
} from "@/lib/action-result";
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

// FR-AUTH-01, FR-AUTH-02
export async function registerAction(values: unknown, next?: string): Promise<ActionFailure> {
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
export async function loginAction(values: unknown, next?: string): Promise<ActionFailure> {
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
