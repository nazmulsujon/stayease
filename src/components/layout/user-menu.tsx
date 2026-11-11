"use client";

import Link from "next/link";
import { CalendarDays, ChevronDown, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SessionUser } from "@/types/auth";
import { accountLinks, initials } from "./account-links";

/** Desktop account dropdown for a logged-in user. */
export function UserMenu({ user }: { user: SessionUser }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2" aria-label="Account menu">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(user.name)}
          </span>
          <span className="max-w-32 truncate">{user.name}</span>
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate font-medium text-foreground">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accountLinks(user).map((link) => (
          <DropdownMenuItem key={link.href} asChild>
            <Link href={link.href}>
              {link.href === "/profile" ? <UserRound /> : user.role === "admin" ? <LayoutDashboard /> : <CalendarDays />}
              {link.title}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut />
              Log out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
