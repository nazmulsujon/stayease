import bcrypt from "bcryptjs";

/** bcrypt work factor. 12 ≈ a few hundred ms per hash: slow for attackers, fine for users. */
const SALT_ROUNDS = 12;

/** FR-AUTH-03: passwords are only ever stored as bcrypt hashes. */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * A valid hash of a random value. Comparing against it when an email does
 * not exist makes "unknown email" take as long as "wrong password", so
 * response timing does not reveal which emails are registered.
 */
export const DUMMY_PASSWORD_HASH =
  "$2b$12$ftIcpYDN1KfUwW2nmFEw1OaxJnPuovmGJmH3azqSGJ1a60WR6RuaG";
