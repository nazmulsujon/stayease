import { MessageSquareText } from "lucide-react";
import { formatDate } from "@/lib/dates";
import type { RatingSummary, ReviewDTO } from "@/services/review.service";
import { Stars } from "./stars";

/** Reviews section on the room details page (FR-ROOM-02, FR-REV-03). */
export function ReviewList({ reviews, summary }: { reviews: ReviewDTO[]; summary: RatingSummary }) {
  return (
    <section className="space-y-4" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="reviews-heading" className="text-lg font-semibold">
          Guest reviews
        </h2>
        {summary.count > 0 && (
          <span className="flex items-center gap-2 text-sm">
            <Stars rating={summary.average} />
            <span className="font-medium">{summary.average.toFixed(1)}</span>
            <span className="text-muted-foreground">
              ({summary.count} {summary.count === 1 ? "review" : "reviews"})
            </span>
          </span>
        )}
      </div>
      {reviews.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquareText className="size-4" aria-hidden />
          No reviews yet. Guests can review this room after their stay.
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {r.authorName[0]}
                  </span>
                  <span className="font-medium">{r.authorName}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(new Date(r.createdAt.slice(0, 10)))}</span>
              </div>
              <Stars rating={r.rating} className="mb-2" />
              <p className="text-sm leading-relaxed whitespace-pre-line">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
