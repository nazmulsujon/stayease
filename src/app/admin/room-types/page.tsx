import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { BedDouble, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActiveBadge } from "@/components/admin/room-status-badge";
import { RoomTypeStatusToggle } from "@/components/admin/room-type-status-toggle";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { listRoomTypesForAdmin } from "@/services/catalogue.service";

export const metadata: Metadata = { title: "Room types" };

/** FR-ADM-02: list of all room types with room counts. */
export default function AdminRoomTypesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Room types"
        description="Categories of rooms that customers can book."
        actions={
          <Button asChild>
            <Link href="/admin/room-types/new">
              <Plus aria-hidden />
              Add room type
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <RoomTypesTable />
      </Suspense>
      <p className="text-xs text-muted-foreground">
        Rooms column shows available / total physical rooms. Room types are deactivated rather than
        deleted so that booking history stays intact.
      </p>
    </div>
  );
}

async function RoomTypesTable() {
  await requireRole("admin", "/admin/room-types");
  await dbConnect();
  const roomTypes = await listRoomTypesForAdmin();

  return roomTypes.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No room types yet"
          description="Create your first room type, then add physical rooms to it."
        />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead className="text-right">Price / night</TableHead>
                <TableHead className="text-right">Guests</TableHead>
                <TableHead className="text-right">Rooms</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomTypes.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="pl-4">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.bedType}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(t.pricePerNight)}</TableCell>
                  <TableCell className="text-right tabular-nums">{t.capacity}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Link
                      href={`/admin/rooms?type=${t.id}`}
                      className="hover:underline"
                      title={`${t.availableRooms} available of ${t.totalRooms}`}
                    >
                      {t.availableRooms} / {t.totalRooms}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ActiveBadge isActive={t.isActive} />
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/room-types/${t.id}/edit`}>Edit</Link>
                      </Button>
                      <RoomTypeStatusToggle id={t.id} name={t.name} isActive={t.isActive} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      );
}
