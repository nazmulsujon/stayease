import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RoomImage } from "@/components/rooms/room-image";
import type { BookingDTO } from "@/types/booking";
import { BookingStatusBadge, PaymentStatusBadge } from "./booking-status-badge";
import { PriceBreakdown } from "./price-breakdown";
import { StayDetails } from "./stay-details";

/** Full booking details for the confirmation and "My bookings" detail pages. */
export function BookingSummaryCard({
  booking,
  footer,
}: {
  booking: BookingDTO;
  footer?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <RoomImage
          src={booking.roomType.image}
          alt={booking.roomType.name}
          className="aspect-[4/3] w-full shrink-0 rounded-lg sm:size-24"
        />
        <div className="flex-1 space-y-1">
          <p className="font-mono text-sm text-muted-foreground">{booking.referenceCode}</p>
          <h2 className="text-lg font-semibold">
            {booking.roomType.slug ? (
              <Link href={`/rooms/${booking.roomType.slug}`} className="hover:text-primary">
                {booking.roomType.name}
              </Link>
            ) : (
              booking.roomType.name
            )}
          </h2>
          <div className="flex flex-wrap gap-2">
            <BookingStatusBadge status={booking.status} />
            <PaymentStatusBadge status={booking.paymentStatus} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <StayDetails
          checkIn={booking.checkIn}
          checkOut={booking.checkOut}
          nights={booking.nights}
          guests={booking.guests}
        />
        <p className="text-sm">
          <span className="text-muted-foreground">Room number: </span>
          <span className="font-medium">{booking.roomNumber}</span>
        </p>
        {booking.specialRequest && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="mb-1 text-muted-foreground">Special request</p>
            <p className="whitespace-pre-line">{booking.specialRequest}</p>
          </div>
        )}
        <Separator />
        <PriceBreakdown
          pricePerNight={booking.pricePerNight}
          nights={booking.nights}
          totalPrice={booking.totalPrice}
        />
        {footer}
      </CardContent>
    </Card>
  );
}
