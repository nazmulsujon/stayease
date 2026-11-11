import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, BedDouble, Check, Clock, Maximize2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "@/components/shared/container";
import { RoomImage } from "@/components/rooms/room-image";
import { StaySearchForm } from "@/components/booking/stay-search-form";
import { siteConfig } from "@/config/site";
import { dbConnect } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { getActiveRoomTypeBySlug } from "@/services/catalogue.service";
import { getRoomTypeReviews } from "@/services/review.service";
import { ReviewList } from "@/components/reviews/review-list";
import { Stars } from "@/components/reviews/stars";

export async function generateMetadata({ params }: PageProps<"/rooms/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  await connection();
  await dbConnect();
  const roomType = await getActiveRoomTypeBySlug(slug);
  return roomType
    ? { title: roomType.name, description: roomType.description.slice(0, 160) }
    : { title: "Room not found" };
}

/** FR-ROOM-02: room type details. */
export default function RoomDetailsPage({ params }: PageProps<"/rooms/[slug]">) {
  return (
    <Container className="py-8">
      <Link
        href="/rooms"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All rooms
      </Link>
      <Suspense fallback={<DetailsSkeleton />}>
        <RoomDetails params={params} />
      </Suspense>
    </Container>
  );
}

async function RoomDetails({ params }: { params: PageProps<"/rooms/[slug]">["params"] }) {
  const { slug } = await params;
  await connection(); // always read the latest room data at request time
  await dbConnect();
  const roomType = await getActiveRoomTypeBySlug(slug);
  if (!roomType) notFound();
  const { reviews, summary } = await getRoomTypeReviews(roomType.id);

  const [cover, ...gallery] = roomType.images;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        <div className="space-y-3">
          <RoomImage
            src={cover}
            alt={roomType.name}
            priority
            className="aspect-[16/9] w-full rounded-xl"
          />
          {gallery.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {gallery.map((src, i) => (
                <RoomImage
                  key={src}
                  src={src}
                  alt={`${roomType.name}, photo ${i + 2}`}
                  className="aspect-square w-full rounded-lg"
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">{roomType.name}</h1>
          {summary.count > 0 && (
            <a href="#reviews-heading" className="inline-flex items-center gap-2 text-sm hover:underline">
              <Stars rating={summary.average} />
              <span className="font-medium">{summary.average.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({summary.count} {summary.count === 1 ? "review" : "reviews"})
              </span>
            </a>
          )}
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Users className="size-4" aria-hidden />
              Up to {roomType.capacity} {roomType.capacity === 1 ? "guest" : "guests"}
            </li>
            <li className="flex items-center gap-2">
              <BedDouble className="size-4" aria-hidden />
              {roomType.bedType}
            </li>
            {roomType.sizeSqft && (
              <li className="flex items-center gap-2">
                <Maximize2 className="size-4" aria-hidden />
                {roomType.sizeSqft} sq ft
              </li>
            )}
          </ul>
          <p className="leading-relaxed whitespace-pre-line">{roomType.description}</p>
        </div>

        {roomType.amenities.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Amenities</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {roomType.amenities.map((amenity) => (
                <li key={amenity} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 text-primary" aria-hidden />
                  {amenity}
                </li>
              ))}
            </ul>
          </section>
        )}

        <ReviewList reviews={reviews} summary={summary} />
      </div>

      <aside>
        <Card className="lg:sticky lg:top-24">
          <CardContent className="space-y-4">
            <p>
              <span className="text-3xl font-semibold">{formatCurrency(roomType.pricePerNight)}</span>
              <span className="text-muted-foreground"> / night</span>
            </p>
            <Separator />
            <StaySearchForm
              roomTypeSlug={roomType.slug}
              maxGuests={roomType.capacity}
              layout="stacked"
              submitLabel="Book this room"
            />
            <Separator />
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Clock className="size-4" aria-hidden />
                Check-in from {siteConfig.checkInTime}
              </li>
              <li className="flex items-center gap-2">
                <Clock className="size-4" aria-hidden />
                Check-out until {siteConfig.checkOutTime}
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-4" aria-hidden />
                Pay at the hotel
              </li>
            </ul>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]" aria-busy="true">
      <div className="space-y-6">
        <Skeleton className="aspect-[16/9] w-full rounded-xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
