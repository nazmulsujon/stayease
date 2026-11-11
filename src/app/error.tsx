"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

/** Catches unexpected rendering errors and offers a retry (NFR-06). */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <EmptyState
        icon={TriangleAlert}
        title="Something went wrong"
        description="An unexpected error occurred. Please try again."
        action={<Button onClick={reset}>Try again</Button>}
        className="w-full max-w-md"
      />
    </main>
  );
}
