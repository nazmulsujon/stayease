import { SignJWT, jwtVerify } from "jose";
import { USER_ROLES, type UserRole } from "@/types/auth";

/**
 * Signed session token (JWT, HS256).
 * Framework-independent so it can be used by `proxy.ts`, server code and tests.
 * The token only carries the user id and role — never personal data.
 */
export const SESSION_COOKIE_NAME = "stayease_session";

export type SessionPayload = {
  userId: string;
  role: UserRole;
  /** Expiry as a Unix timestamp (seconds). */
  expiresAt: number;
};

const ALGORITHM = "HS256";
const ISSUER = "stayease";

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  data: { userId: string; role: UserRole },
  secret: string,
  expiresIn: string,
): Promise<{ token: string; expiresAt: number }> {
  const token = await new SignJWT({ role: data.role })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(data.userId)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key(secret));

  const { expiresAt } = (await verifySessionToken(token, secret))!;
  return { token, expiresAt };
}

/** Returns the payload, or `null` if the token is missing, tampered with or expired. */
export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
): Promise<SessionPayload | null> {
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      algorithms: [ALGORITHM],
      issuer: ISSUER,
    });
    const role = payload.role;
    if (
      typeof payload.sub !== "string" ||
      typeof payload.exp !== "number" ||
      !USER_ROLES.includes(role as UserRole)
    ) {
      return null;
    }
    return { userId: payload.sub, role: role as UserRole, expiresAt: payload.exp };
  } catch {
    return null;
  }
}
