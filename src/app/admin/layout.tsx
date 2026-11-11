import { Suspense } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { UserMenu } from "@/components/layout/user-menu";
import { AdminNav, AdminNavLinks } from "@/components/admin/admin-nav";
import { requireRole } from "@/lib/auth/dal";

/**
 * Admin area layout. Every page under /admin is rendered through
 * <AdminGuard>, which verifies the admin role against the database
 * (FR-AUTH-07).
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted/30">
      <header className="border-b bg-background">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo />
            <Badge variant="secondary">Admin</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/">
                View site
                <ExternalLink aria-hidden />
              </Link>
            </Button>
            <Suspense fallback={null}>
              <AdminUserMenu />
            </Suspense>
          </div>
        </Container>
        <Container>
          <Suspense fallback={<AdminNavLinks />}>
            <AdminNav />
          </Suspense>
        </Container>
      </header>
      <main className="flex-1">
        <Container className="py-8">
          <Suspense fallback={<PageSkeleton />}>
            <AdminGuard>{children}</AdminGuard>
          </Suspense>
        </Container>
      </main>
    </div>
  );
}

async function AdminGuard({ children }: { children: React.ReactNode }) {
  await requireRole("admin", "/admin");
  return children;
}

async function AdminUserMenu() {
  const user = await requireRole("admin", "/admin");
  return <UserMenu user={user} />;
}
