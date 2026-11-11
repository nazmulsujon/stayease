import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { MainNav } from "./main-nav";
import { MobileNav } from "./mobile-nav";

/**
 * Public site header.
 * The account buttons are static for now; Phase 2 (Authentication) will
 * replace them with a user menu when a customer or admin is logged in.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <MainNav className="hidden md:flex" />
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Create account</Link>
          </Button>
        </div>
        <div className="md:hidden">
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
