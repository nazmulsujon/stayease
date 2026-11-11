import { Suspense } from "react";
import type { Metadata } from "next";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import Link from "next/link";
import { DoorClosed, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { RoomStatusBadge } from "@/components/admin/room-status-badge";
import { RoomTypeFilter } from "@/components/admin/room-type-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { listRoomTypeOptions, listRoomsForAdmin } from "@/services/catalogue.service";

export const metadata: Metadata = { title: "Rooms" };

/** FR-ADM-03: physical rooms, optionally filtered by room type (?type=<id>). */
export default function AdminRoomsPage({ searchParams }: PageProps<"/admin/rooms">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <RoomsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function RoomsContent({ searchParams }: { searchParams: PageProps<"/admin/rooms">["searchParams"] }) {
  await requireRole("admin", "/admin/rooms");
  const { type } = await searchParams;
  const typeId = typeof type === "string" ? type : undefined;

  await dbConnect();
  const [rooms, roomTypes] = await Promise.all([listRoomsForAdmin(typeId), listRoomTypeOptions()]);
  const selectedType = roomTypes.find((t) => t.id === typeId);
  const newRoomHref = selectedType ? `/admin/rooms/new?type=${selectedType.id}` : "/admin/rooms/new";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms"
        description="Physical rooms and their current status."
        actions={
          roomTypes.length > 0 && (
            <Button asChild>
              <Link href={newRoomHref}>
                <Plus aria-hidden />
                Add room
              </Link>
            </Button>
          )
        }
      />

      {roomTypes.length === 0 ? (
        <EmptyState
          icon={DoorClosed}
          title="Create a room type first"
          description="Every room belongs to a room type, such as Deluxe Double Room."
          action={
            <Button asChild>
              <Link href="/admin/room-types/new">Add room type</Link>
            </Button>
          }
        />
      ) : (
        <>
          <RoomTypeFilter roomTypes={roomTypes} selected={selectedType?.id} />
          {rooms.length === 0 ? (
            <EmptyState
              icon={DoorClosed}
              title={selectedType ? `No rooms in ${selectedType.name}` : "No rooms yet"}
              description="Add the hotel's physical rooms so customers can book them."
            />
          ) : (
            <Card className="py-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Room</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Room type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="pl-4 font-medium tabular-nums">{room.roomNumber}</TableCell>
                      <TableCell className="tabular-nums">{room.floor === 0 ? "Ground" : room.floor}</TableCell>
                      <TableCell>
                        {room.roomType.name}
                        {!room.roomType.isActive && (
                          <Badge variant="outline" className="ml-2">
                            type inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <RoomStatusBadge status={room.status} />
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/rooms/${room.id}/edit`}>Edit</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
