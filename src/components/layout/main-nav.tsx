"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/config/site";
import { cn } from "@/lib/utils";

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLinks({ pathname, className }: { pathname?: string; className?: string }) {
  return (
    <nav aria-label="Main" className={cn("flex items-center gap-1", className)}>
      {mainNav.map((item) => {
        const active = pathname !== undefined && isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Desktop navigation links with active-page highlighting.
 * Render inside <Suspense fallback={<MainNavFallback />}>: the current path is
 * request data, so on dynamic routes it is only known at request time.
 */
export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();
  return <NavLinks pathname={pathname} className={className} />;
}

/** Same links without the active highlight, used in the static shell. */
export function MainNavFallback({ className }: { className?: string }) {
  return <NavLinks className={className} />;
}
