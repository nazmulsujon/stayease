import { Suspense } from "react";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { HeaderAccount, HeaderAccountSkeleton } from "./header-account";
import { MainNav, MainNavFallback } from "./main-nav";

/** Public site header. The account area streams in once the session is read. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
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
    </header>
  );
}
