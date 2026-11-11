import { describe, expect, it } from "vitest";
import { postLoginRedirect, safeRedirectPath } from "@/lib/auth/redirect";
import { decideRoute } from "@/lib/auth/route-guard";
import type { SessionPayload } from "@/lib/auth/token";

const customer: SessionPayload = { userId: "c", role: "customer", expiresAt: 0 };
const admin: SessionPayload = { userId: "a", role: "admin", expiresAt: 0 };

describe("safeRedirectPath (open-redirect protection)", () => {
  it.each(["/", "/rooms", "/my-bookings?x=1"])("accepts %s", (p) => {
    expect(safeRedirectPath(p)).toBe(p);
  });
  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "rooms",
    "",
    undefined,
    ["/a"],
    "/\nfoo",
  ])("rejects %s", (p) => {
    expect(safeRedirectPath(p)).toBeNull();
  });
});

describe("postLoginRedirect", () => {
  it("sends admins to the dashboard unless next is an admin page", () => {
    expect(postLoginRedirect("admin", undefined)).toBe("/admin");
    expect(postLoginRedirect("admin", "/my-bookings")).toBe("/admin");
    expect(postLoginRedirect("admin", "/admin/bookings")).toBe("/admin/bookings");
  });
  it("sends customers back to where they were, never to admin pages", () => {
    expect(postLoginRedirect("customer", undefined)).toBe("/");
    expect(postLoginRedirect("customer", "/rooms/deluxe?checkIn=2026-12-01")).toBe(
      "/rooms/deluxe?checkIn=2026-12-01",
    );
    expect(postLoginRedirect("customer", "/admin")).toBe("/");
    expect(postLoginRedirect("customer", "//evil.com")).toBe("/");
  });
});

describe("decideRoute (proxy, FR-AUTH-07)", () => {
  it("allows public pages for everyone", () => {
    for (const s of [null, customer, admin]) {
      expect(decideRoute("/", "", s)).toEqual({ action: "allow" });
      expect(decideRoute("/rooms", "", s)).toEqual({ action: "allow" });
      // a prefix match must be a full path segment
      expect(decideRoute("/administrator-info", "", s)).toEqual({ action: "allow" });
    }
  });

  it("sends guests to login and remembers the page", () => {
    expect(decideRoute("/my-bookings", "", null)).toEqual({
      action: "redirect",
      to: "/login?next=%2Fmy-bookings",
    });
    expect(decideRoute("/admin/rooms", "?page=2", null)).toEqual({
      action: "redirect",
      to: "/login?next=%2Fadmin%2Frooms%3Fpage%3D2",
    });
  });

  it("keeps customers out of the admin area", () => {
    expect(decideRoute("/admin", "", customer)).toEqual({ action: "redirect", to: "/" });
    expect(decideRoute("/my-bookings", "", customer)).toEqual({ action: "allow" });
  });

  it("keeps admins in the admin area", () => {
    expect(decideRoute("/admin", "", admin)).toEqual({ action: "allow" });
    expect(decideRoute("/my-bookings", "", admin)).toEqual({ action: "redirect", to: "/admin" });
  });
});
