import { Suspense } from "react";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { HeaderAccount, HeaderAccountSkeleton } from "./header-account";
import { HeaderFrame } from "./header-frame";
import { MainNav, MainNavFallback } from "./main-nav";

/**
 * Public site header. The account area streams in once the session is read.
 * `overlay` makes it float transparently over a full-bleed hero (home page).
 */
export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  return (
    <HeaderFrame overlay={overlay}>
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <Suspense fallback={<MainNavFallback className="hidden md:flex" />}>
            <MainNav className="hidden md:flex" />
          </Suspense>
        </div>
        <Suspense fallback={<HeaderAccountSkeleton />}>
          <HeaderAccount />
        </Suspense>
      </Container>
    </HeaderFrame>
  );
}
