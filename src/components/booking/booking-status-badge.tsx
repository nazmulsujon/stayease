import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BOOKING_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type BookingStatus,
  type PaymentStatus,
} from "@/types/booking";

const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-muted text-muted-foreground",
  completed: "bg-sky-100 text-sky-800",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge className={cn("font-medium", statusStyles[status])}>{BOOKING_STATUS_LABELS[status]}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="outline" className="font-medium">
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
