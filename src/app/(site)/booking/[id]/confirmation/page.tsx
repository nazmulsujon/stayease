import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingSummaryCard } from "@/components/booking/booking-summary-card";
import { Container } from "@/components/shared/container";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requireRole } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { getBookingForUser } from "@/services/booking.service";

export const metadata: Metadata = { title: "Booking received" };

/** Shown right after a successful booking (FR-BOOK-06). */
export default function BookingConfirmationPage({ params }: PageProps<"/booking/[id]/confirmation">) {
  return (
    <Container className="max-w-3xl py-10">
      <Suspense fallback={<PageSkeleton />}>
        <Confirmation params={params} />
      </Suspense>
    </Container>
  );
}

async function Confirmation({ params }: { params: PageProps<"/booking/[id]/confirmation">["params"] }) {
  const { id } = await params;
  const user = await requireRole("customer", `/booking/${id}/confirmation`);
  await dbConnect();
  const booking = await getBookingForUser(user.id, id);
  if (!booking) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
        <CircleCheck className="size-12 text-emerald-600" aria-hidden />
        <h1 className="text-2xl font-semibold tracking-tight">Booking received!</h1>
        <p className="max-w-md text-muted-foreground">
          Your reference code is{" "}
          <span className="font-mono font-semibold text-foreground">{booking.referenceCode}</span>.
          Keep it for check-in. Your room is held as <strong>Pending</strong> until the hotel confirms
          it.
        </p>
      </div>
      <BookingSummaryCard booking={booking} />
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/my-bookings">Go to my bookings</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/rooms">Browse more rooms</Link>
        </Button>
      </div>
    </div>
  );
}
