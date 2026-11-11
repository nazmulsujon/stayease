import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { UserBlockToggle } from "@/components/admin/user-block-toggle";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requireRole } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { listUsersForAdmin } from "@/services/admin.service";

export const metadata: Metadata = { title: "Customers" };

/** FR-ADM-08: registered users with booking counts; block / unblock customers. */
export default function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Registered accounts and their bookings." />
      <Suspense fallback={<PageSkeleton />}>
        <UsersTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function UsersTable({ searchParams }: { searchParams: PageProps<"/admin/users">["searchParams"] }) {
  const admin = await requireRole("admin", "/admin/users");
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  await dbConnect();
  const users = await listUsersForAdmin(query);

  return (
    <div className="space-y-4">
      <form action="/admin/users" className="flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={query} placeholder="Name, email or phone" className="pl-8" aria-label="Search customers" />
        </div>
        <Button type="submit">Search</Button>
        {query && (
          <Button asChild variant="ghost">
            <Link href="/admin/users">Reset</Link>
          </Button>
        )}
      </form>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No accounts found" />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="pl-4">
                    <span className="font-medium">{u.name}</span>
                    {u.role === "admin" && <Badge variant="secondary" className="ml-2">Admin</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{u.email}</div>
                    <div className="text-xs text-muted-foreground">{u.phone}</div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(new Date(u.createdAt.slice(0, 10)))}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {u.bookingCount > 0 ? (
                      <Link href={`/admin/bookings?q=${encodeURIComponent(u.email)}`} className="hover:underline">
                        {u.bookingCount}
                        {u.activeBookingCount > 0 && <span className="text-muted-foreground"> ({u.activeBookingCount} active)</span>}
                      </Link>
                    ) : (
                      0
                    )}
                  </TableCell>
                  <TableCell>
                    {u.isBlocked ? (
                      <Badge className="bg-red-100 text-red-800">Blocked</Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {u.role === "customer" && u.id !== admin.id && (
                      <UserBlockToggle id={u.id} name={u.name} isBlocked={u.isBlocked} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
