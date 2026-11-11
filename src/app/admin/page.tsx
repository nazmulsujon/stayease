import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BedDouble, CalendarCheck, Clock, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingMiniList } from "@/components/admin/booking-mini-list";
import { StatCard } from "@/components/admin/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { formatDate, hotelToday } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { getDashboardStats } from "@/services/admin.service";

export const metadata: Metadata = { title: "Admin dashboard" };

/** FR-ADM-01: key statistics, today's arrivals and departures, pending bookings. */
export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  await requireRole("admin", "/admin");
  await dbConnect();
  const today = hotelToday();
  const s = await getDashboardStats(today);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={`Overview for ${formatDate(today)}`}
        actions={
          <Button asChild>
            <Link href="/admin/bookings?status=pending">Review pending bookings</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total bookings" value={String(s.totalBookings)} hint={`${s.pendingBookings} pending`} icon={CalendarCheck} />
        <StatCard
          label="Occupancy tonight"
          value={`${s.occupancyRate}%`}
          hint={`${s.occupiedRooms} of ${s.bookableRooms} rooms occupied`}
          icon={BedDouble}
        />
        <StatCard label="Revenue (paid)" value={formatCurrency(s.totalRevenue)} hint="Paid, not cancelled" icon={Wallet} />
        <StatCard label="Registered customers" value={String(s.registeredCustomers)} icon={Users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s check-ins ({s.todaysCheckIns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingMiniList rows={s.todaysCheckIns} empty="No arrivals today." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s check-outs ({s.todaysCheckOuts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingMiniList rows={s.todaysCheckOuts} empty="No departures today." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-amber-600" aria-hidden />
              Awaiting confirmation ({s.pendingBookings})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BookingMiniList rows={s.recentPending} empty="Nothing waiting. 🎉" />
            {s.pendingBookings > s.recentPending.length && (
              <Link href="/admin/bookings?status=pending" className="mt-2 inline-block text-sm text-primary hover:underline">
                View all {s.pendingBookings}
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
