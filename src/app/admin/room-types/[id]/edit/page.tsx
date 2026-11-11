import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomTypeForm } from "@/components/admin/room-type-form";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requireRole } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { getRoomTypeById } from "@/services/catalogue.service";

export const metadata: Metadata = { title: "Edit room type" };

export default function EditRoomTypePage({ params }: PageProps<"/admin/room-types/[id]/edit">) {
  return (
    <div className="mx-auto max-w-3xl">
      <Suspense fallback={<PageSkeleton />}>
        <EditRoomType params={params} />
      </Suspense>
    </div>
  );
}

async function EditRoomType({ params }: { params: PageProps<"/admin/room-types/[id]/edit">["params"] }) {
  const { id } = await params;
  await requireRole("admin", `/admin/room-types/${id}/edit`);
  await dbConnect();
  const roomType = await getRoomTypeById(id);
  if (!roomType) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${roomType.name}`} description="Changes apply to new bookings immediately." />
      <RoomTypeForm roomType={roomType} />
    </div>
  );
}
