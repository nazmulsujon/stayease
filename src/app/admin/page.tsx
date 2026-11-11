import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = { title: "Admin dashboard" };

/**
 * Admin dashboard shell (protected by app/admin/layout.tsx).
 * Statistics (FR-ADM-01) are implemented in Phase 5.
 */
export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Manage rooms, bookings and customers."
      />
      <EmptyState
        icon={LayoutDashboard}
        title="Dashboard coming soon"
        description="Booking statistics and management tools will appear here."
      />
    </div>
  );
}
