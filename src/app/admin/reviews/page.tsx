import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewModeration } from "@/components/admin/review-moderation";
import { Stars } from "@/components/reviews/stars";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requireRole } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { listReviewsForAdmin } from "@/services/review.service";

export const metadata: Metadata = { title: "Reviews" };

const FILTERS = [
  { value: "all", label: "All" },
  { value: "visible", label: "Visible" },
  { value: "hidden", label: "Hidden" },
] as const;

/** FR-ADM-09, FR-REV-04: review moderation. */
export default function AdminReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" description="Hide or remove inappropriate guest reviews." />
      <Suspense fallback={<PageSkeleton />}>
        <ReviewsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ReviewsList({ searchParams }: { searchParams: PageProps<"/admin/reviews">["searchParams"] }) {
  await requireRole("admin", "/admin/reviews");
  const { show } = await searchParams;
  const filter = FILTERS.some((f) => f.value === show) ? (show as "all" | "visible" | "hidden") : "all";
  await dbConnect();
  const reviews = await listReviewsForAdmin(filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-muted p-1 sm:w-fit" role="tablist" aria-label="Filter reviews">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/reviews" : `/admin/reviews?show=${f.value}`}
            role="tab"
            aria-selected={filter === f.value}
            className={cn(
              "flex-1 rounded-md px-4 py-1.5 text-center text-sm font-medium",
              filter === f.value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <EmptyState icon={MessageSquareText} title="No reviews here" />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className={cn("py-4", r.isHidden && "opacity-70")}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Stars rating={r.rating} />
                    <span className="font-medium">{r.authorName}</span>
                    <span className="text-muted-foreground">on</span>
                    <Link href={`/rooms/${r.roomTypeSlug}`} className="text-primary hover:underline">
                      {r.roomTypeName}
                    </Link>
                    <span className="text-muted-foreground">· {formatDate(new Date(r.createdAt.slice(0, 10)))}</span>
                    {r.isHidden && <Badge variant="outline">Hidden</Badge>}
                  </div>
                  <p className="max-w-3xl text-sm whitespace-pre-line">{r.comment}</p>
                </div>
                <ReviewModeration id={r.id} isHidden={r.isHidden} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
