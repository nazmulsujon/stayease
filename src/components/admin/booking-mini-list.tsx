import Link from "next/link";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/booking/booking-status-badge";
import { formatDateRange } from "@/lib/dates";
import type { AdminBookingRow } from "@/services/admin.service";

/** Compact list of bookings for dashboard panels. */
export function BookingMiniList({ rows, empty }: { rows: AdminBookingRow[]; empty: string }) {
  if (rows.length === 0) return <p className="py-4 text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y">
      {rows.map((b) => (
        <li key={b.id}>
          <Link
            href={`/admin/bookings/${b.id}`}
            className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 hover:bg-muted/60"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{b.customer.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {b.referenceCode} · {b.roomTypeName} · Room {b.roomNumber}
              </p>
              <p className="text-xs text-muted-foreground">{formatDateRange(b.checkIn, b.checkOut)}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <BookingStatusBadge status={b.status} />
              <PaymentStatusBadge status={b.paymentStatus} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
