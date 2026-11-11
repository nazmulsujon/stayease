"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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
import { isActivePath } from "./main-nav";

/** Slide-out navigation menu for small screens. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
                  active ? "bg-muted text-foreground" : "text-muted-foreground",
                )}
              >
                {item.title}
              </Link>
            );
          })}
          <Separator className="my-3" />
          <Button asChild variant="outline" onClick={() => setOpen(false)}>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="mt-2" onClick={() => setOpen(false)}>
            <Link href="/register">Create account</Link>
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
