import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star rating, e.g. 4.5 → ★★★★½ (rounded to whole stars visually). */
export function Stars({ rating, className }: { rating: number; className?: string }) {
  const full = Math.round(rating);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn("size-4", i < full ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30")}
          aria-hidden
        />
      ))}
    </span>
  );
}
