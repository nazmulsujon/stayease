import { NextResponse, type NextRequest } from "next/server";
import { decideRoute } from "@/lib/auth/route-guard";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/token";

/**
 * Next.js 16 Proxy (formerly "middleware").
 *
 * Fast, OPTIMISTIC route protection (FR-AUTH-07): verifies the JWT signature
 * and role without touching the database, and redirects early.
 * It is NOT the security boundary — pages, Server Actions and Route Handlers
 * re-check the user against the database through `src/lib/auth/dal.ts`.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token, process.env.JWT_SECRET);

  const decision = decideRoute(
    request.nextUrl.pathname,
    request.nextUrl.search,
    session,
  );
  if (decision.action === "redirect") {
    return NextResponse.redirect(new URL(decision.to, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/my-bookings/:path*",
    "/booking/:path*",
    "/profile/:path*",
  ],
};
