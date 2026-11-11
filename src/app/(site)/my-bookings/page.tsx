import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requireRole } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "My bookings" };

/**
 * Customer-only page (FR-AUTH-07).
 * Phase 2 provides the protected shell; booking history (FR-BOOK-08)
 * is implemented in Phase 4.
 */
export default function MyBookingsPage() {
  return (
    <Container className="py-10">
      <Suspense fallback={<PageSkeleton />}>
        <MyBookingsContent />
      </Suspense>
    </Container>
  );
}

async function MyBookingsContent() {
  const user = await requireRole("customer", "/my-bookings");

  return (
    <div className="space-y-8">
      <PageHeader
        title="My bookings"
        description={`Welcome, ${user.name}. Your reservations will appear here.`}
      />
      <EmptyState
        icon={CalendarDays}
        title="No bookings yet"
        description="When you book a room, you can track its status here."
        action={
          <Button asChild>
            <Link href="/rooms">Browse rooms</Link>
          </Button>
        }
      />
    </div>
  );
}
