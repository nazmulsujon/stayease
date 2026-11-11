import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { BedDouble, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RoomTypeCard, RoomTypeCardSkeleton } from "@/components/rooms/room-type-card";
import { dbConnect } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { listActiveRoomTypes } from "@/services/catalogue.service";
import { getRatingSummaries } from "@/services/review.service";

export const metadata: Metadata = {
  title: "Rooms",
  description: "Browse all room types, prices and capacities.",
};

const PRICE_OPTIONS = [4000, 6000, 8000, 12000];
const GUEST_OPTIONS = [1, 2, 3, 4];

type SearchParams = PageProps<"/rooms">["searchParams"];

/** FR-ROOM-01, FR-ROOM-03: active room types with price and capacity filters. */
export default function RoomsPage({ searchParams }: PageProps<"/rooms">) {
  return (
    <Container className="space-y-8 py-10">
      <PageHeader
        title="Our rooms"
        description="Choose the room that fits your stay. Prices are per room, per night."
      />
      <Suspense fallback={<RoomGridSkeleton />}>
        <RoomGrid searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

const num = (v: string | string[] | undefined) => {
  const n = typeof v === "string" ? Number(v) : NaN;
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

const selectClass =
  "h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

async function RoomGrid({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await connection(); // always show the latest prices and ratings
  const filters = { maxPrice: num(params.maxPrice), guests: num(params.guests) };
  const filtered = Boolean(filters.maxPrice || filters.guests);

  await dbConnect();
  const [roomTypes, ratings] = await Promise.all([
    listActiveRoomTypes(undefined, filters),
    getRatingSummaries(),
  ]);

  return (
    <div className="space-y-6">
      {/* GET form: filters are in the URL, so a filtered list can be shared. */}
      <form action="/rooms" className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 p-4">
        <SlidersHorizontal className="mb-1.5 size-4 text-muted-foreground" aria-hidden />
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Guests</span>
          <select name="guests" defaultValue={filters.guests ?? ""} className={selectClass}>
            <option value="">Any</option>
            {GUEST_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}+ {g === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Max price / night</span>
          <select name="maxPrice" defaultValue={filters.maxPrice ?? ""} className={selectClass}>
            <option value="">Any price</option>
            {PRICE_OPTIONS.map((p) => (
              <option key={p} value={p}>
                Up to {formatCurrency(p)}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" size="sm">Apply</Button>
        {filtered && (
          <Button asChild size="sm" variant="ghost">
            <Link href="/rooms">Clear</Link>
          </Button>
        )}
        <span className="ml-auto text-sm text-muted-foreground">
          {roomTypes.length} {roomTypes.length === 1 ? "room type" : "room types"}
        </span>
      </form>

      {roomTypes.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title={filtered ? "No rooms match these filters" : "No rooms to show yet"}
          description={filtered ? "Try a higher price or fewer guests." : "Please check back soon."}
          action={
            filtered && (
              <Button asChild variant="outline">
                <Link href="/rooms">Show all rooms</Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {roomTypes.map((roomType) => (
            <RoomTypeCard key={roomType.id} roomType={roomType} rating={ratings.get(roomType.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function RoomGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <RoomTypeCardSkeleton key={i} />
      ))}
    </div>
  );
}
