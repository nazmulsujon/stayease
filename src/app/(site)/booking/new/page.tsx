import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarX2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookingForm } from "@/components/booking/booking-form";
import { PriceBreakdown } from "@/components/booking/price-breakdown";
import { StayDetails } from "@/components/booking/stay-details";
import { RoomImage } from "@/components/rooms/room-image";
import { Container } from "@/components/shared/container";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requireRole } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { getRoomTypeAvailability } from "@/services/availability.service";
import { createBookingSchema } from "@/validations/booking";

export const metadata: Metadata = { title: "Review your booking", robots: { index: false, follow: false } };

type SearchParams = PageProps<"/booking/new">["searchParams"];

/** Booking summary before confirmation (FR-BOOK-01, FR-BOOK-02). Customers only. */
export default function NewBookingPage({ searchParams }: PageProps<"/booking/new">) {
  return (
    <Container className="max-w-3xl py-10">
      <Suspense fallback={<PageSkeleton />}>
        <NewBooking searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

async function NewBooking({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const stay = {
    roomType: str(params.roomType),
    checkIn: str(params.checkIn),
    checkOut: str(params.checkOut),
    guests: str(params.guests) || "1",
  };

  // Guests are sent to login and brought back here with their dates (§10.1).
  await requireRole("customer", `/booking/new?${new URLSearchParams(stay)}`);

  const parsed = createBookingSchema().safeParse(stay);
  const backHref = stay.roomType ? `/rooms/${stay.roomType}` : "/rooms";

  if (!parsed.success) {
    return (
      <EmptyState
        icon={CalendarX2}
        title="These booking details are not valid"
        description={parsed.error.issues[0]?.message ?? "Please choose your dates again."}
        action={
          <Button asChild>
            <Link href={backHref}>Choose dates</Link>
          </Button>
        }
      />
    );
  }

  await dbConnect();
  const range = { checkIn: parsed.data.checkIn, checkOut: parsed.data.checkOut };
  const availability = await getRoomTypeAvailability(parsed.data.roomType, range);

  if (!availability) {
    return (
      <EmptyState
        icon={CalendarX2}
        title="Room type not available"
        description="This room type is no longer offered. Please choose another room."
        action={
          <Button asChild>
            <Link href="/rooms">Browse rooms</Link>
          </Button>
        }
      />
    );
  }

  const { roomType, nights, totalPrice, availableRooms } = availability;
  const searchHref = `/search?${new URLSearchParams({
    checkIn: range.checkIn,
    checkOut: range.checkOut,
    guests: String(parsed.data.guests),
  })}`;

  if (parsed.data.guests > roomType.capacity || availableRooms === 0) {
    return (
      <EmptyState
        icon={CalendarX2}
        title={availableRooms === 0 ? `${roomType.name} is fully booked` : "Too many guests for this room"}
        description={
          availableRooms === 0
            ? "There are no rooms of this type left for your dates."
            : `${roomType.name} holds up to ${roomType.capacity} guests.`
        }
        action={
          <Button asChild>
            <Link href={searchHref}>See other rooms for these dates</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Change room or dates
      </Link>
      <PageHeader title="Review your booking" description="Check the details below, then confirm." />

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <RoomImage src={roomType.image} alt={roomType.name} className="size-20 shrink-0 rounded-lg" />
          <div>
            <CardTitle className="text-lg">{roomType.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {roomType.bedType} · up to {roomType.capacity} guests
            </p>
            <p className="text-sm text-emerald-700">
              {availableRooms} {availableRooms === 1 ? "room" : "rooms"} left for your dates
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <StayDetails {...range} nights={nights} guests={parsed.data.guests} />
          <Separator />
          <PriceBreakdown pricePerNight={roomType.pricePerNight} nights={nights} totalPrice={totalPrice} />
          <Separator />
          <BookingForm stay={stay} totalPrice={totalPrice} />
        </CardContent>
      </Card>
    </div>
  );
}
