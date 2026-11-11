"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { mainNav, siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types/auth";
import { accountLinks } from "./account-links";
import { isActivePath } from "./main-nav";

/** Slide-out navigation menu for small screens. */
export function MobileNav({ user }: { user: SessionUser | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  const linkClass = (active: boolean) =>
    cn(
      "rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
      active ? "bg-muted text-foreground" : "text-muted-foreground",
    );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>{siteConfig.name}</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
          {mainNav.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                aria-current={active ? "page" : undefined}
                className={linkClass(active)}
              >
                {item.title}
              </Link>
            );
          })}
          <Separator className="my-3" />
          {user ? (
            <>
              <p className="px-3 pb-1 text-xs text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user.name}</span>
              </p>
              {accountLinks(user).map((link) => {
                const active = isActivePath(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={linkClass(active)}
                  >
                    {link.title}
                  </Link>
                );
              })}
              <form action={logoutAction} className="mt-2">
                <Button type="submit" variant="outline" className="w-full">
                  <LogOut aria-hidden />
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="outline" onClick={close}>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild className="mt-2" onClick={close}>
                <Link href="/register">Create account</Link>
              </Button>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
