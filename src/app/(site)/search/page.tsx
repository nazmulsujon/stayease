import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { CalendarX2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AvailabilityCard } from "@/components/booking/availability-card";
import { StaySearchForm } from "@/components/booking/stay-search-form";
import { FormAlert } from "@/components/forms/form-alert";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { dbConnect } from "@/lib/db";
import { formatDateRange } from "@/lib/dates";
import { searchAvailability } from "@/services/availability.service";
import { staySearchSchema } from "@/validations/booking";

export const metadata: Metadata = { title: "Check availability" };

type SearchParams = PageProps<"/search">["searchParams"];

/** FR-AVAIL-01 … FR-AVAIL-06: availability search results. */
export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <Container className="space-y-8 py-10">
      <PageHeader title="Check availability" description="Live availability and total price for your dates." />
      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

async function SearchResults({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await connection(); // "today" for date validation must be the request date
  const raw = { checkIn: str(params.checkIn), checkOut: str(params.checkOut), guests: str(params.guests) || "1" };

  // Server-side validation of the same rules as the form (FR-AVAIL-02).
  const parsed = staySearchSchema().safeParse(raw);
  const hasQuery = Boolean(raw.checkIn || raw.checkOut);

  const form = (
    <Card>
      <CardContent>
        <StaySearchForm defaults={raw} />
      </CardContent>
    </Card>
  );

  if (!parsed.success) {
    return (
      <div className="space-y-6">
        {hasQuery && <FormAlert message={parsed.error.issues[0]?.message ?? "Please check your dates."} />}
        {form}
      </div>
    );
  }

  const query = parsed.data;
  await dbConnect();
  const results = await searchAvailability(query, query.guests);
  const available = results.filter((r) => r.availableRooms > 0).length;

  return (
    <div className="space-y-6">
      {form}
      <p className="text-sm text-muted-foreground">
        {formatDateRange(query.checkIn, query.checkOut)} · {query.guests}{" "}
        {query.guests === 1 ? "guest" : "guests"} ·{" "}
        <span className="font-medium text-foreground">
          {available} of {results.length} room {results.length === 1 ? "type" : "types"} available
        </span>
      </p>
      {results.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="No rooms for that many guests"
          description="Try fewer guests per room, or book more than one room."
        />
      ) : (
        <div className="space-y-4">
          {results.map((r) => (
            <AvailabilityCard key={r.roomType.id} result={r} query={query} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}
