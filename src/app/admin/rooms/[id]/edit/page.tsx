import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomForm } from "@/components/admin/room-form";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requireRole } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { getRoomById, listRoomTypeOptions } from "@/services/catalogue.service";

export const metadata: Metadata = { title: "Edit room" };

export default function EditRoomPage({ params }: PageProps<"/admin/rooms/[id]/edit">) {
  return (
    <div className="mx-auto max-w-2xl">
      <Suspense fallback={<PageSkeleton />}>
        <EditRoom params={params} />
      </Suspense>
    </div>
  );
}

async function EditRoom({ params }: { params: PageProps<"/admin/rooms/[id]/edit">["params"] }) {
  const { id } = await params;
  await requireRole("admin", `/admin/rooms/${id}/edit`);
  await dbConnect();
  const [room, roomTypes] = await Promise.all([getRoomById(id), listRoomTypeOptions()]);
  if (!room) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit room ${room.roomNumber}`} />
      <RoomForm room={room} roomTypes={roomTypes} />
    </div>
  );
}
