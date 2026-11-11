import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * StayEase brand mark: a roofline over an arched doorway ("home away from
 * home") with a gold star for hotel quality. The same drawing is used for the
 * favicon (app/icon.svg) and the Apple touch icon (app/apple-icon.tsx).
 */
export const BRAND = {
  teal: "#1F6B70",
  tealDark: "#164F53",
  gold: "#E8B44C",
} as const;

export function LogoMark({ className, title }: { className?: string; title?: string }) {
  const gradientId = `se-bg-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-9 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={BRAND.teal} />
          <stop offset="1" stopColor={BRAND.tealDark} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${gradientId})`} />
      {/* roofline */}
      <path
        d="M13 33 32 19l19 14"
        fill="none"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* arched doorway */}
      <path
        d="M24 49V39a8 8 0 0 1 16 0v10"
        fill="none"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* ground line */}
      <path d="M17 49h30" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" />
      {/* star */}
      <path
        d="m32 4.8 1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z"
        fill={BRAND.gold}
      />
    </svg>
  );
}
