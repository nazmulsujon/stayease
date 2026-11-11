import type { SessionPayload } from "./token";
import {
  ACCOUNT_PATHS,
  ADMIN_HOME,
  ADMIN_PATHS,
  CUSTOMER_HOME,
  CUSTOMER_PATHS,
  matchesPrefix,
} from "./redirect";

export type GuardDecision =
  | { action: "allow" }
  | { action: "redirect"; to: string };

/**
 * Pure routing decision used by `proxy.ts` (optimistic check, FR-AUTH-07).
 * Kept separate from the proxy so it can be unit-tested.
 */
export function decideRoute(
  pathname: string,
  search: string,
  session: SessionPayload | null,
): GuardDecision {
  const isAdminArea = matchesPrefix(pathname, ADMIN_PATHS);
  const isCustomerArea = matchesPrefix(pathname, CUSTOMER_PATHS);
  const isAccountArea = matchesPrefix(pathname, ACCOUNT_PATHS);
  if (!isAdminArea && !isCustomerArea && !isAccountArea) return { action: "allow" };

  if (!session) {
    const next = encodeURIComponent(pathname + search);
    return { action: "redirect", to: `/login?next=${next}` };
  }
  if (isAdminArea && session.role !== "admin") {
    return { action: "redirect", to: CUSTOMER_HOME };
  }
  if (isCustomerArea && session.role !== "customer") {
    return { action: "redirect", to: ADMIN_HOME };
  }
  return { action: "allow" };
}
