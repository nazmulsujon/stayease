import type { UserRole } from "@/types/auth";

/**
 * Accepts only same-site relative paths ("/rooms?x=1").
 * Rejects absolute URLs and protocol-relative tricks ("//evil.com", "/\\evil.com")
 * so the `next` login parameter cannot be used as an open redirect.
 */
export function safeRedirectPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) {
    return null;
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return null;
  }
  if (/[\u0000-\u001f]/.test(value)) return null;
  return value;
}

export const ADMIN_HOME = "/admin";
export const CUSTOMER_HOME = "/";

/** Path prefixes reserved for each role. */
export const ADMIN_PATHS = ["/admin"];
export const CUSTOMER_PATHS = ["/my-bookings", "/booking", "/profile"];

export function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Where to send a user after login / registration. */
export function postLoginRedirect(role: UserRole, next: unknown): string {
  const target = safeRedirectPath(next);
  if (role === "admin") {
    return target && matchesPrefix(target.split("?")[0], ADMIN_PATHS) ? target : ADMIN_HOME;
  }
  if (target && !matchesPrefix(target.split("?")[0], ADMIN_PATHS)) return target;
  return CUSTOMER_HOME;
}
