import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookingAdminActions } from "@/components/admin/booking-admin-actions";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/booking/booking-status-badge";
import { PriceBreakdown } from "@/components/booking/price-breakdown";
import { StayDetails } from "@/components/booking/stay-details";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requireRole } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { formatDate, hotelToday } from "@/lib/dates";
import { getBookingForAdmin } from "@/services/admin.service";

export const metadata: Metadata = { title: "Booking" };

/** Admin view of one booking with status and payment controls (FR-ADM-06, FR-ADM-07). */
export default function AdminBookingPage({ params }: PageProps<"/admin/bookings/[id]">) {
  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All bookings
      </Link>
      <Suspense fallback={<PageSkeleton />}>
        <AdminBooking params={params} />
      </Suspense>
    </div>
  );
}

async function AdminBooking({ params }: { params: PageProps<"/admin/bookings/[id]">["params"] }) {
  const { id } = await params;
  await requireRole("admin", `/admin/bookings/${id}`);
  await dbConnect();
  const b = await getBookingForAdmin(id);
  if (!b) notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardHeader className="space-y-2">
          <p className="font-mono text-sm text-muted-foreground">{b.referenceCode}</p>
          <CardTitle className="text-xl">
            {b.roomTypeName} · Room {b.roomNumber}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <BookingStatusBadge status={b.status} />
            <PaymentStatusBadge status={b.paymentStatus} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <StayDetails checkIn={b.checkIn} checkOut={b.checkOut} nights={b.nights} guests={b.guests} />
          {b.specialRequest && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="mb-1 text-muted-foreground">Special request</p>
              <p className="whitespace-pre-line">{b.specialRequest}</p>
            </div>
          )}
          <Separator />
          <PriceBreakdown pricePerNight={b.pricePerNight} nights={b.nights} totalPrice={b.totalPrice} />
          <p className="text-xs text-muted-foreground">
            Booked on {formatDate(new Date(b.createdAt.slice(0, 10)))}
            {b.cancelledBy && ` · Cancelled by ${b.cancelledBy === "admin" ? "the hotel" : "the guest"}`}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Guest</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2"><User className="size-4 text-muted-foreground" aria-hidden />{b.customer.name}</p>
            <p className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" aria-hidden />
              <a href={`mailto:${b.customer.email}`} className="hover:underline">{b.customer.email}</a>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" aria-hidden />
              <a href={`tel:${b.customer.phone}`} className="hover:underline">{b.customer.phone}</a>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manage</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingAdminActions
              bookingId={b.id}
              status={b.status}
              paymentStatus={b.paymentStatus}
              canComplete={b.checkIn <= hotelToday()}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
