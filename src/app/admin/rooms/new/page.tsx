import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RoomForm } from "@/components/admin/room-form";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requireRole } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { listRoomTypeOptions } from "@/services/catalogue.service";

export const metadata: Metadata = { title: "Add room" };

export default function NewRoomPage({ searchParams }: PageProps<"/admin/rooms/new">) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Add room" description="Add a physical room to a room type." />
      <Suspense fallback={<PageSkeleton />}>
        <NewRoom searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NewRoom({ searchParams }: { searchParams: PageProps<"/admin/rooms/new">["searchParams"] }) {
  await requireRole("admin", "/admin/rooms/new");
  const { type } = await searchParams;
  await dbConnect();
  const roomTypes = await listRoomTypeOptions();
  if (roomTypes.length === 0) redirect("/admin/room-types/new");

  const defaultRoomTypeId =
    typeof type === "string" && roomTypes.some((t) => t.id === type) ? type : undefined;

  return <RoomForm roomTypes={roomTypes} defaultRoomTypeId={defaultRoomTypeId} />;
}
