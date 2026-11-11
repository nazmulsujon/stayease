import { User, type UserDoc } from "@/models/user";
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from "@/lib/auth/password";
import type { LoginInput, RegisterInput } from "@/validations/auth";
import type { SessionUser, UserRole } from "@/types/auth";

/**
 * Authentication business logic. Independent of Next.js (no cookies, no
 * redirects), so it can be unit-tested directly against a database.
 * Callers must pass input that has already been validated with Zod.
 */

export function toSessionUser(user: Pick<UserDoc, "_id" | "name" | "email" | "role">): SessionUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  };
}

function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

export type RegisterResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "email_taken" };

/** FR-AUTH-01, FR-AUTH-02, FR-AUTH-03. Public registration always creates a customer. */
export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  if (await User.exists({ email: input.email })) {
    return { ok: false, reason: "email_taken" };
  }

  try {
    const user = await User.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash: await hashPassword(input.password),
      role: "customer",
    });
    return { ok: true, user: toSessionUser(user) };
  } catch (error) {
    // Two registrations with the same email at the same moment:
    // the unique index rejects the second one.
    if (isDuplicateKeyError(error)) return { ok: false, reason: "email_taken" };
    throw error;
  }
}

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "invalid_credentials" | "blocked" };

/** FR-AUTH-04, FR-AUTH-08. */
export async function authenticateUser(input: LoginInput): Promise<LoginResult> {
  const user = await User.findOne({ email: input.email }).select("+passwordHash");

  // Always run bcrypt so response time does not reveal whether the email exists.
  const passwordOk = await verifyPassword(
    input.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordOk) {
    return { ok: false, reason: "invalid_credentials" };
  }
  // Only reported after a correct password, so it cannot be used to probe accounts.
  if (user.isBlocked) {
    return { ok: false, reason: "blocked" };
  }
  return { ok: true, user: toSessionUser(user) };
}

/** Loads an active (not blocked) user for an existing session. */
export async function findActiveSessionUser(userId: string): Promise<SessionUser | null> {
  if (!/^[a-f\d]{24}$/i.test(userId)) return null;
  const user = await User.findById(userId).select("name email role isBlocked").lean();
  if (!user || user.isBlocked) return null;
  return toSessionUser(user);
}
