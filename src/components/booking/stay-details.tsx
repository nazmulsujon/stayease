import { CalendarDays, Moon, Users } from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatDate } from "@/lib/dates";

/** Check-in / check-out / nights / guests summary. */
export function StayDetails({
  checkIn,
  checkOut,
  nights,
  guests,
}: {
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
}) {
  return (
    <dl className="grid gap-4 text-sm sm:grid-cols-2">
      <div className="flex gap-3">
        <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div>
          <dt className="text-muted-foreground">Check-in</dt>
          <dd className="font-medium">{formatDate(checkIn)}</dd>
          <dd className="text-xs text-muted-foreground">from {siteConfig.checkInTime}</dd>
        </div>
      </div>
      <div className="flex gap-3">
        <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div>
          <dt className="text-muted-foreground">Check-out</dt>
          <dd className="font-medium">{formatDate(checkOut)}</dd>
          <dd className="text-xs text-muted-foreground">until {siteConfig.checkOutTime}</dd>
        </div>
      </div>
      <div className="flex gap-3">
        <Moon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div>
          <dt className="text-muted-foreground">Length of stay</dt>
          <dd className="font-medium">
            {nights} {nights === 1 ? "night" : "nights"}
          </dd>
        </div>
      </div>
      <div className="flex gap-3">
        <Users className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div>
          <dt className="text-muted-foreground">Guests</dt>
          <dd className="font-medium">
            {guests} {guests === 1 ? "guest" : "guests"}
          </dd>
        </div>
      </div>
    </dl>
  );
}
