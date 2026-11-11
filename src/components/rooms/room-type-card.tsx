import Link from "next/link";
import { BedDouble, Maximize2, Star, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { RoomTypeDTO } from "@/types/catalogue";
import { RoomImage } from "./room-image";

/** Room type summary card used on the rooms list and home page (FR-ROOM-01). */
export function RoomTypeCard({
  roomType,
  rating,
}: {
  roomType: RoomTypeDTO;
  rating?: { average: number; count: number };
}) {
  return (
    <Card className="group gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      <Link href={`/rooms/${roomType.slug}`} className="flex h-full flex-col focus-visible:outline-none">
        <RoomImage
          src={roomType.images[0]}
          alt={roomType.name}
          className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold tracking-tight group-hover:text-primary">
                {roomType.name}
              </h3>
              {rating && rating.count > 0 && (
                <span className="flex shrink-0 items-center gap-1 text-sm font-medium" aria-label={`Rated ${rating.average} out of 5 from ${rating.count} reviews`}>
                  <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                  {rating.average.toFixed(1)}
                  <span className="font-normal text-muted-foreground">({rating.count})</span>
                </span>
              )}
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground">{roomType.description}</p>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Users className="size-4" aria-hidden />
              Up to {roomType.capacity} {roomType.capacity === 1 ? "guest" : "guests"}
            </li>
            <li className="flex items-center gap-1.5">
              <BedDouble className="size-4" aria-hidden />
              {roomType.bedType}
            </li>
            {roomType.sizeSqft && (
              <li className="flex items-center gap-1.5">
                <Maximize2 className="size-4" aria-hidden />
                {roomType.sizeSqft} sq ft
              </li>
            )}
          </ul>
          <p className="mt-auto pt-2">
            <span className="text-xl font-semibold">{formatCurrency(roomType.pricePerNight)}</span>
            <span className="text-sm text-muted-foreground"> / night</span>
          </p>
        </div>
      </Link>
    </Card>
  );
}

export function RoomTypeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border" aria-hidden>
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
