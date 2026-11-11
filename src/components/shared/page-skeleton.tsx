import { Skeleton } from "@/components/ui/skeleton";

/** Generic loading placeholder for a page body. */
export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
