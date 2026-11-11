import Link from "next/link";
import { BedDouble, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RoomImage } from "@/components/rooms/room-image";
import { formatCurrency } from "@/lib/format";
import type { RoomTypeAvailability } from "@/types/booking";

/** One search result: a room type with live availability and total price (FR-AVAIL-04). */
export function AvailabilityCard({
  result,
  query,
}: {
  result: RoomTypeAvailability;
  query: { checkIn: string; checkOut: string; guests: number };
}) {
  const { roomType, availableRooms, nights, totalPrice } = result;
  const soldOut = availableRooms === 0;
  const bookHref = `/booking/new?${new URLSearchParams({
    roomType: roomType.slug,
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    guests: String(query.guests),
  })}`;

  return (
    <Card className="flex-col gap-0 overflow-hidden py-0 sm:flex-row">
      <Link href={`/rooms/${roomType.slug}`} className="sm:w-64 sm:shrink-0">
        <RoomImage src={roomType.image} alt={roomType.name} className="aspect-[4/3] h-full w-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold tracking-tight">
              <Link href={`/rooms/${roomType.slug}`} className="hover:text-primary">
                {roomType.name}
              </Link>
            </h3>
            {soldOut ? (
              <Badge variant="outline" className="text-muted-foreground">Sold out</Badge>
            ) : (
              <Badge className="bg-emerald-100 text-emerald-800">
                {availableRooms} {availableRooms === 1 ? "room" : "rooms"} left
              </Badge>
            )}
          </div>
          <p className="line-clamp-2 max-w-xl text-sm text-muted-foreground">{roomType.description}</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Users className="size-4" aria-hidden />
              Up to {roomType.capacity}
            </li>
            <li className="flex items-center gap-1.5">
              <BedDouble className="size-4" aria-hidden />
              {roomType.bedType}
            </li>
          </ul>
        </div>
        <div className="shrink-0 space-y-2 sm:text-right">
          <p className="text-sm text-muted-foreground">
            {formatCurrency(roomType.pricePerNight)} × {nights} {nights === 1 ? "night" : "nights"}
          </p>
          <p className="text-2xl font-semibold tabular-nums">{formatCurrency(totalPrice)}</p>
          {soldOut ? (
            <Button disabled className="w-full sm:w-auto">Not available</Button>
          ) : (
            <Button asChild className="w-full sm:w-auto">
              <Link href={bookHref}>Book now</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
