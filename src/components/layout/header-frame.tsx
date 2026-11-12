"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

function subscribeScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

/**
 * The <header> element. With `overlay`, it floats transparently over the
 * home-page hero and turns solid once the page is scrolled. Colours in the
 * transparent state are handled by `.site-header-transparent` (globals.css).
 */
export function HeaderFrame({ overlay = false, children }: { overlay?: boolean; children: React.ReactNode }) {
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    () => window.scrollY > 24,
    () => false,
  );
  const transparent = overlay && !scrolled;

  return (
    <header
      className={cn(
        "z-40 transition-[background-color,border-color,box-shadow] duration-300",
        overlay ? "fixed inset-x-0 top-0" : "sticky top-0",
        transparent
          ? "site-header-transparent border-b border-transparent bg-transparent"
          : "border-b bg-background/90 shadow-[0_1px_0_0_rgb(0_0_0/0.02)] backdrop-blur supports-backdrop-filter:bg-background/80",
      )}
    >
      {children}
    </header>
  );
}
