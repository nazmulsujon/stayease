import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { RoomImage } from "@/components/rooms/room-image";
import { formatDateRange } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import type { BookingDTO } from "@/types/booking";
import { BookingStatusBadge, PaymentStatusBadge } from "./booking-status-badge";

/** Compact booking row for "My bookings" (FR-BOOK-08). */
export function BookingListItem({ booking }: { booking: BookingDTO }) {
  return (
    <Card className="py-0 transition-shadow hover:shadow-md">
      <Link
        href={`/my-bookings/${booking.id}`}
        className="flex items-center gap-4 p-4"
        aria-label={`Booking ${booking.referenceCode}, ${booking.roomType.name}`}
      >
        <RoomImage
          src={booking.roomType.image}
          alt=""
          className="hidden size-16 shrink-0 rounded-lg sm:flex"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{booking.roomType.name}</span>
            <BookingStatusBadge status={booking.status} />
            <PaymentStatusBadge status={booking.paymentStatus} />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDateRange(booking.checkIn, booking.checkOut)} · {booking.nights}{" "}
            {booking.nights === 1 ? "night" : "nights"}
          </p>
          <p className="font-mono text-xs text-muted-foreground">{booking.referenceCode}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-semibold tabular-nums">{formatCurrency(booking.totalPrice)}</p>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </Card>
  );
}
