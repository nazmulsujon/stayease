"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BedDouble, CalendarCheck, DoorClosed, LayoutDashboard, MessageSquareText, Users } from "lucide-react";
import { cn } from "@/lib/utils";

/** Admin section navigation. */
const adminNav = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Bookings", href: "/admin/bookings", icon: CalendarCheck },
  { title: "Room types", href: "/admin/room-types", icon: BedDouble },
  { title: "Rooms", href: "/admin/rooms", icon: DoorClosed },
  { title: "Customers", href: "/admin/users", icon: Users },
  { title: "Reviews", href: "/admin/reviews", icon: MessageSquareText },
];

/** Render inside <Suspense fallback={<AdminNavLinks />}> (the path is request data). */
export function AdminNav() {
  return <AdminNavLinks pathname={usePathname()} />;
}

export function AdminNavLinks({ pathname }: { pathname?: string }) {
  return (
    <nav aria-label="Admin" className="-mb-px flex gap-1 overflow-x-auto">
      {adminNav.map(({ title, href, icon: Icon, exact }) => {
        const active =
          pathname !== undefined && (exact ? pathname === href : pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {title}
          </Link>
        );
      })}
    </nav>
  );
}
