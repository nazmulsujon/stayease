import { Suspense } from "react";
import type { Metadata } from "next";
import { RoomTypeForm } from "@/components/admin/room-type-form";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requireRole } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Add room type" };

export default function NewRoomTypePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Add room type" description="Customers will see this room type once it is created." />
      <Suspense fallback={<PageSkeleton />}>
        <NewRoomTypeForm />
      </Suspense>
    </div>
  );
}

async function NewRoomTypeForm() {
  await requireRole("admin", "/admin/room-types/new");
  return <RoomTypeForm />;
}
