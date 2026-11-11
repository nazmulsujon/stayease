import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingListItem } from "@/components/booking/booking-list-item";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requireRole } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { listBookingsForUser } from "@/services/booking.service";
import type { BookingDTO } from "@/types/booking";

export const metadata: Metadata = { title: "My bookings" };

/** FR-BOOK-08: the customer's bookings grouped as Upcoming, Past and Cancelled. */
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
  await dbConnect();
  const { upcoming, past, cancelled } = await listBookingsForUser(user.id);
  const total = upcoming.length + past.length + cancelled.length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="My bookings"
        description={`Hello, ${user.name}. Here are all your reservations.`}
        actions={
          total > 0 && (
            <Button asChild>
              <Link href="/rooms">Book another stay</Link>
            </Button>
          )
        }
      />

      {total === 0 ? (
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
      ) : (
        <>
          <BookingGroup title="Upcoming" bookings={upcoming} empty="No upcoming stays." />
          <BookingGroup title="Past" bookings={past} empty="No past stays yet." />
          {cancelled.length > 0 && <BookingGroup title="Cancelled" bookings={cancelled} />}
        </>
      )}
    </div>
  );
}

function BookingGroup({
  title,
  bookings,
  empty,
}: {
  title: string;
  bookings: BookingDTO[];
  empty?: string;
}) {
  return (
    <section className="space-y-3" aria-labelledby={`group-${title}`}>
      <h2 id={`group-${title}`} className="text-lg font-semibold">
        {title} <span className="text-muted-foreground">({bookings.length})</span>
      </h2>
      {bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <BookingListItem key={b.id} booking={b} />
          ))}
        </div>
      )}
    </section>
  );
}
