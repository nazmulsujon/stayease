export const USER_ROLES = ["customer", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * The minimal, non-sensitive user shape that server code passes around
 * and may hand to Client Components. Never contains the password hash.
 */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};
