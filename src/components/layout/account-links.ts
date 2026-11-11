import type { SessionUser } from "@/types/auth";

/** Account-area links shown in the header menus, by role. */
export function accountLinks(user: SessionUser) {
  return user.role === "admin"
    ? [{ title: "Admin dashboard", href: "/admin" }]
    : [{ title: "My bookings", href: "/my-bookings" }];
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
