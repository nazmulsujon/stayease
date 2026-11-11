import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  BadgeCheck,
  Car,
  Clock,
  Coffee,
  Dumbbell,
  MapPin,
  Quote,
  UtensilsCrossed,
  Waves,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaySearchForm } from "@/components/booking/stay-search-form";
import { Reveal } from "@/components/landing/reveal";
import { Stars } from "@/components/reviews/stars";
import { RoomTypeCard, RoomTypeCardSkeleton } from "@/components/rooms/room-type-card";
import { Container } from "@/components/shared/container";
import { photos, unsplash } from "@/config/images";
import { siteConfig } from "@/config/site";
import { dbConnect } from "@/lib/db";
import { listActiveRoomTypes } from "@/services/catalogue.service";
import { getFeaturedReviews, getOverallRating, getRatingSummaries } from "@/services/review.service";

/**
 * Home page: hero with availability search (FR-AVAIL-01), hotel highlights,
 * featured rooms and guest reviews (live from the database), facilities and
 * location. Static sections are prerendered; database sections stream in.
 */

const highlights = [
  { icon: Wifi, title: "Free high-speed Wi-Fi", text: "Fibre internet in every room and public area." },
  { icon: UtensilsCrossed, title: "Breakfast included", text: "Bengali and continental buffet, 7–10 AM." },
  { icon: Car, title: "Airport transfer", text: "Pick-up from Hazrat Shahjalal Airport on request." },
  { icon: Clock, title: "24/7 front desk", text: "Our team is here day and night." },
];

const facilities = [
  { icon: UtensilsCrossed, title: "Saffron Restaurant", text: "All-day dining with Bengali favourites, grills and fresh juices.", photo: photos.restaurant },
  { icon: Waves, title: "Rooftop pool", text: "Unwind above the city with a view over Dhanmondi.", photo: photos.pool },
  { icon: Coffee, title: "Executive lounge", text: "A quiet space for meetings, work and evening tea with snacks.", photo: photos.armchairCorner },
  { icon: Dumbbell, title: "Fitness centre", text: "Modern equipment, open from 6 AM to 11 PM.", photo: photos.gym },
];

const nearby = [
  { place: "Dhanmondi Lake", distance: "5 min walk" },
  { place: "Rabindra Sarobar", distance: "8 min walk" },
  { place: "Bashundhara City Mall", distance: "15 min drive" },
  { place: "Hazrat Shahjalal Int'l Airport", distance: "45 min drive" },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN photo, see config/images.ts */}
        <img
          src={unsplash(photos.tuftedBedroom, 2000)}
          alt=""
          fetchPriority="high"
          className="animate-slow-zoom absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-black/75 via-black/45 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-linear-to-t from-black/50 to-transparent" />

        <Container className="flex min-h-[min(78vh,760px)] flex-col justify-center gap-8 py-24 text-white sm:py-32">
          <div className="max-w-2xl space-y-5">
            <p className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm backdrop-blur">
              <MapPin className="size-4" aria-hidden /> Dhanmondi, Dhaka
            </p>
            <h1
              className="animate-fade-up text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
              style={{ animationDelay: "120ms" }}
            >
              Your calm corner in the heart of Dhaka
            </h1>
            <p className="animate-fade-up max-w-xl text-lg text-white/85" style={{ animationDelay: "240ms" }}>
              Thoughtfully designed rooms, warm Bengali hospitality and a short walk to Dhanmondi Lake.
              See live availability and book in under a minute.
            </p>
          </div>
          <div
            className="animate-fade-up w-full max-w-4xl rounded-3xl bg-background/95 p-2 pb-0 shadow-2xl ring-1 ring-black/5 backdrop-blur"
            style={{ animationDelay: "380ms" }}
          >
            <StaySearchForm />
          </div>
        </Container>
      </section>

      {/* ── Highlights ──────────────────────────────────────── */}
      <section className="border-b bg-background">
        <Container className="grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 80} className="flex gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-medium">{title}</h2>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </Reveal>
          ))}
        </Container>
      </section>

      {/* ── Welcome ─────────────────────────────────────────── */}
      <section>
        <Container className="grid items-center gap-12 py-20 lg:grid-cols-2">
          <Reveal className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN photo */}
            <img
              src={unsplash(photos.suiteLounge, 1000, 760)}
              alt="Suite lounge with sofa and city view"
              loading="lazy"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN photo */}
            <img
              src={unsplash(photos.dining, 600, 600)}
              alt="Dinner table at the hotel restaurant"
              loading="lazy"
              className="absolute -right-4 -bottom-8 hidden aspect-square w-48 rounded-2xl border-4 border-background object-cover shadow-xl sm:block lg:-right-8"
            />
          </Reveal>
          <Reveal delay={120} className="space-y-6">
            <p className="text-sm font-medium tracking-wider text-primary uppercase">Welcome to {siteConfig.name}</p>
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              A boutique hotel made for rest, work and everything in between
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Tucked away on a quiet tree-lined road in Dhanmondi, {siteConfig.name} combines the comfort of a
              modern hotel with the warmth of a family home. Whether you are in Dhaka for business, a
              family visit or a weekend away, our team makes sure every stay feels effortless.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {["Soundproofed rooms", "Daily housekeeping", "Pay at the hotel", "Free cancellation*"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <BadgeCheck className="size-5 text-primary" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">*Free cancellation online until the day before check-in.</p>
            <Button asChild variant="outline">
              <Link href="/about">
                More about us <ArrowRight aria-hidden />
              </Link>
            </Button>
          </Reveal>
        </Container>
      </section>

      {/* ── Featured rooms (live) ───────────────────────────── */}
      <section className="bg-muted/40">
        <Container className="space-y-10 py-20">
          <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium tracking-wider text-primary uppercase">Rooms & suites</p>
              <h2 className="text-3xl font-semibold tracking-tight">Find the room that fits your stay</h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/rooms">
                View all rooms <ArrowRight aria-hidden />
              </Link>
            </Button>
          </Reveal>
          <Suspense
            fallback={
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <RoomTypeCardSkeleton key={i} />
                ))}
              </div>
            }
          >
            <FeaturedRooms />
          </Suspense>
        </Container>
      </section>

      {/* ── Facilities ──────────────────────────────────────── */}
      <section>
        <Container className="space-y-10 py-20">
          <Reveal className="max-w-2xl space-y-2">
            <p className="text-sm font-medium tracking-wider text-primary uppercase">Facilities</p>
            <h2 className="text-3xl font-semibold tracking-tight">Everything you need, under one roof</h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {facilities.map(({ icon: Icon, title, text, photo }, i) => (
              <Reveal key={title} delay={i * 100} className="group overflow-hidden rounded-2xl border bg-card">
                <div className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN photo */}
                  <img
                    src={unsplash(photo, 700, 500)}
                    alt={title}
                    loading="lazy"
                    className="aspect-[7/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-1.5 p-5">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Icon className="size-4 text-primary" aria-hidden />
                    {title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Reviews (live) ──────────────────────────────────── */}
      <Suspense fallback={null}>
        <GuestReviews />
      </Suspense>

      {/* ── Location ────────────────────────────────────────── */}
      <section>
        <Container className="grid items-center gap-12 py-20 lg:grid-cols-2">
          <Reveal className="space-y-6">
            <p className="text-sm font-medium tracking-wider text-primary uppercase">Location</p>
            <h2 className="text-3xl font-semibold tracking-tight">Quiet street, central address</h2>
            <p className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              {siteConfig.contact.address}
            </p>
            <ul className="divide-y rounded-xl border">
              {nearby.map((n) => (
                <li key={n.place} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span>{n.place}</span>
                  <span className="text-muted-foreground">{n.distance}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN photo */}
            <img
              src={unsplash(photos.brightLiving, 1000, 760)}
              alt="Bright suite living area with large windows"
              loading="lazy"
              className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
            />
          </Reveal>
        </Container>
      </section>

      {/* ── Call to action ─────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN photo */}
        <img src={unsplash(photos.warmBedroom, 1800, 700)} alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-primary/85" />
        <Container className="flex flex-col items-center gap-6 py-20 text-center text-primary-foreground">
          <Reveal className="space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Ready when you are</h2>
            <p className="mx-auto max-w-xl text-primary-foreground/85">
              Check live availability for your dates. No payment needed now; pay when you arrive.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/rooms">
                Book your stay <ArrowRight aria-hidden />
              </Link>
            </Button>
          </Reveal>
        </Container>
      </section>
    </>
  );
}

async function FeaturedRooms() {
  await connection();
  await dbConnect();
  const [roomTypes, ratings] = await Promise.all([listActiveRoomTypes(3), getRatingSummaries()]);

  if (roomTypes.length === 0) {
    return <p className="text-muted-foreground">Rooms will be listed here soon.</p>;
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {roomTypes.map((roomType, i) => (
        <Reveal key={roomType.id} delay={i * 100}>
          <RoomTypeCard roomType={roomType} rating={ratings.get(roomType.id)} />
        </Reveal>
      ))}
    </div>
  );
}

async function GuestReviews() {
  await connection();
  await dbConnect();
  const [reviews, overall] = await Promise.all([getFeaturedReviews(3), getOverallRating()]);
  if (reviews.length === 0) return null;

  return (
    <section className="bg-muted/40">
      <Container className="space-y-10 py-20">
        <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium tracking-wider text-primary uppercase">Guest reviews</p>
            <h2 className="text-3xl font-semibold tracking-tight">What our guests say</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-semibold">{overall.average.toFixed(1)}</span>
            <div>
              <Stars rating={overall.average} />
              <p className="text-sm text-muted-foreground">
                from {overall.count} verified {overall.count === 1 ? "stay" : "stays"}
              </p>
            </div>
          </div>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 100} className="flex h-full flex-col gap-4 rounded-2xl border bg-card p-6">
              <Quote className="size-6 text-primary/40" aria-hidden />
              <p className="flex-1 leading-relaxed">{r.comment}</p>
              <div className="flex items-center justify-between gap-3 border-t pt-4">
                <div>
                  <p className="font-medium">{r.authorName}</p>
                  <Link href={`/rooms/${r.roomTypeSlug}`} className="text-xs text-muted-foreground hover:underline">
                    Stayed in {r.roomTypeName}
                  </Link>
                </div>
                <Stars rating={r.rating} />
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
