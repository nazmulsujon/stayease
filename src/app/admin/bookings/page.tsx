import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarSearch, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookingStatusBadge, PaymentStatusBadge } from "@/components/booking/booking-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requireRole } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { listBookingsForAdmin } from "@/services/admin.service";
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS } from "@/types/booking";

export const metadata: Metadata = { title: "Bookings" };

type SearchParams = PageProps<"/admin/bookings">["searchParams"];
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

/** FR-ADM-05: all bookings with search and filters. */
export default function AdminBookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="Search, filter and manage all reservations." />
      <Suspense fallback={<PageSkeleton />}>
        <BookingsTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function BookingsTable({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("admin", "/admin/bookings");
  const p = await searchParams;
  const query = {
    q: str(p.q),
    status: str(p.status),
    from: str(p.from),
    to: str(p.to),
    page: Number(str(p.page)) || 1,
  };
  await dbConnect();
  const { rows, total, page, pageCount } = await listBookingsForAdmin(query);

  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...query, page: String(n) })) if (v && v !== "1") params.set(k, String(v));
    return `/admin/bookings${params.size ? `?${params}` : ""}`;
  };
  const filtered = Boolean(query.q || query.status || query.from || query.to);

  return (
    <div className="space-y-4">
      {/* Plain GET form: filters live in the URL, so results can be bookmarked and shared. */}
      <form action="/admin/bookings" className="grid gap-3 rounded-xl border bg-background p-4 sm:grid-cols-2 lg:grid-cols-[1fr_160px_150px_150px_auto]">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Search</span>
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input name="q" defaultValue={query.q} placeholder="Reference, name, email or phone" className="pl-8" />
          </div>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Status</span>
          <select
            name="status"
            defaultValue={query.status}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {BOOKING_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Stay from</span>
          <Input type="date" name="from" defaultValue={query.from} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Stay to</span>
          <Input type="date" name="to" defaultValue={query.to} />
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" className="flex-1">Apply</Button>
          {filtered && (
            <Button asChild variant="ghost">
              <Link href="/admin/bookings">Reset</Link>
            </Button>
          )}
        </div>
      </form>

      <p className="text-sm text-muted-foreground">
        {total} {total === 1 ? "booking" : "bookings"} found
      </p>

      {rows.length === 0 ? (
        <EmptyState
          icon={CalendarSearch}
          title={filtered ? "No bookings match these filters" : "No bookings yet"}
          description={filtered ? "Try a different search or reset the filters." : "New reservations will appear here."}
        />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Reference</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Stay</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4">Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => (
                <TableRow key={b.id} className="relative">
                  <TableCell className="pl-4 font-mono text-xs">
                    <Link href={`/admin/bookings/${b.id}`} className="font-medium text-primary after:absolute after:inset-0 hover:underline">
                      {b.referenceCode}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{b.customer.name}</div>
                    <div className="text-xs text-muted-foreground">{b.customer.email}</div>
                  </TableCell>
                  <TableCell>
                    <div>{b.roomTypeName}</div>
                    <div className="text-xs text-muted-foreground">Room {b.roomNumber}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{formatDate(b.checkIn)}</div>
                    <div className="text-xs text-muted-foreground">
                      {b.nights} {b.nights === 1 ? "night" : "nights"} · {b.guests} {b.guests === 1 ? "guest" : "guests"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(b.totalPrice)}</TableCell>
                  <TableCell>
                    <BookingStatusBadge status={b.status} />
                  </TableCell>
                  <TableCell className="pr-4">
                    <PaymentStatusBadge status={b.paymentStatus} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" aria-disabled={page <= 1} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
              <Link href={pageHref(page - 1)}>
                <ChevronLeft aria-hidden /> Previous
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" aria-disabled={page >= pageCount} className={page >= pageCount ? "pointer-events-none opacity-50" : ""}>
              <Link href={pageHref(page + 1)}>
                Next <ChevronRight aria-hidden />
              </Link>
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
