import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { BookingSummaryCard } from "@/components/booking/booking-summary-card";
import { CancelBookingButton } from "@/components/booking/cancel-booking-button";
import { Container } from "@/components/shared/container";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { siteConfig } from "@/config/site";
import { requireRole } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { getBookingForUser } from "@/services/booking.service";
import { getReviewForBooking } from "@/services/review.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewForm } from "@/components/reviews/review-form";
import { Stars } from "@/components/reviews/stars";

export const metadata: Metadata = { title: "Booking details", robots: { index: false, follow: false } };

/** One booking of the logged-in customer, with cancellation (FR-BOOK-08, FR-BOOK-09). */
export default function BookingDetailsPage({ params }: PageProps<"/my-bookings/[id]">) {
  return (
    <Container className="max-w-3xl space-y-6 py-10">
      <Link
        href="/my-bookings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        My bookings
      </Link>
      <Suspense fallback={<PageSkeleton />}>
        <BookingDetails params={params} />
      </Suspense>
    </Container>
  );
}

async function BookingDetails({ params }: { params: PageProps<"/my-bookings/[id]">["params"] }) {
  const { id } = await params;
  const user = await requireRole("customer", `/my-bookings/${id}`);
  await dbConnect();
  // Only the owner can see a booking; anyone else gets "not found".
  const booking = await getBookingForUser(user.id, id);
  if (!booking) notFound();
  const review = booking.status === "completed" ? await getReviewForBooking(user.id, booking.id) : null;

  return (
    <div className="space-y-6">
    <BookingSummaryCard
      booking={booking}
      footer={
        <>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Booked on {formatDate(new Date(booking.createdAt.slice(0, 10)))}
            {booking.cancelledBy &&
              ` · Cancelled by ${booking.cancelledBy === "customer" ? "you" : "the hotel"}`}
          </p>
          {booking.canCancel ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                You can cancel free of charge until the day before check-in.
              </p>
              <CancelBookingButton bookingId={booking.id} referenceCode={booking.referenceCode} />
            </div>
          ) : (
            (booking.status === "pending" || booking.status === "confirmed") && (
              <p className="text-sm text-muted-foreground">
                Online cancellation is closed for this booking. Please call {siteConfig.contact.phone}{" "}
                for changes.
              </p>
            )
          )}
        </>
      }
    />
    {booking.status === "completed" && (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{review ? "Your review" : "How was your stay?"}</CardTitle>
        </CardHeader>
        <CardContent>
          {review ? (
            <div className="space-y-2">
              <Stars rating={review.rating} />
              <p className="text-sm whitespace-pre-line">{review.comment}</p>
              {review.isHidden && (
                <p className="text-xs text-muted-foreground">This review is not shown publicly.</p>
              )}
            </div>
          ) : (
            <ReviewForm bookingId={booking.id} />
          )}
        </CardContent>
      </Card>
    )}
    </div>
  );
}
