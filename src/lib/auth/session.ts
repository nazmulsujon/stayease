import "server-only";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import type { SessionUser } from "@/types/auth";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "./token";

/**
 * Session cookie management (FR-AUTH-05, FR-AUTH-06).
 * The JWT lives in an HTTP-only cookie: JavaScript in the browser cannot read
 * it (protects against XSS token theft), and SameSite=Lax blocks it from
 * being sent on cross-site form posts (CSRF protection).
 *
 * `createSession` / `deleteSession` may only be called from Server Actions
 * or Route Handlers (Next.js does not allow setting cookies while rendering).
 */

export async function createSession(user: SessionUser): Promise<void> {
  const { JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV } = getEnv();
  const { token, expiresAt } = await signSessionToken(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    JWT_EXPIRES_IN,
  );

  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt * 1000),
  });
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}

/** Reads and verifies the session cookie. Does NOT check the database. */
export async function readSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token, getEnv().JWT_SECRET);
}
