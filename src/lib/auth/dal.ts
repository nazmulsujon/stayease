import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { findActiveSessionUser } from "@/services/auth.service";
import type { SessionUser, UserRole } from "@/types/auth";
import { ADMIN_HOME, CUSTOMER_HOME } from "./redirect";
import { readSession } from "./session";

/**
 * Data Access Layer for authentication (FR-AUTH-07).
 *
 * This is the AUTHORITATIVE check. `proxy.ts` only performs a fast,
 * optimistic redirect based on the token; every page, Server Action and
 * Route Handler that needs a user must call one of these functions.
 *
 * The database is consulted on every request, so a blocked user or a
 * changed role takes effect immediately, even if their token is still valid.
 *
 * With Cache Components these functions read cookies, so callers must render
 * inside a <Suspense> boundary.
 */

/** Current user, or `null` when logged out / token invalid / user blocked. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await readSession();
  if (!session) return null;
  await dbConnect();
  return findActiveSessionUser(session.userId);
});

/** Requires any logged-in user; otherwise redirects to login and comes back afterwards. */
export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login");
  }
  return user;
}

/**
 * Requires a specific role. Users with the wrong role are sent to their own
 * home page (admins to the dashboard, customers to the home page).
 */
export async function requireRole(role: UserRole, returnTo?: string): Promise<SessionUser> {
  const user = await requireUser(returnTo);
  if (user.role !== role) {
    redirect(user.role === "admin" ? ADMIN_HOME : CUSTOMER_HOME);
  }
  return user;
}

/** Non-redirecting variant for Server Actions / Route Handlers that return errors. */
export async function authorize(
  role?: UserRole,
): Promise<
  | { ok: true; user: SessionUser }
  | { ok: false; status: 401 | 403; message: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, status: 401, message: "Please log in to continue." };
  if (role && user.role !== role) {
    return { ok: false, status: 403, message: "You do not have permission to do this." };
  }
  return { ok: true, user };
}
