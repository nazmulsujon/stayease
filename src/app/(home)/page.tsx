import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Car,
  Clock,
  Coffee,
  Dumbbell,
  MapPin,
  Navigation,
  Quote,
  ShieldCheck,
  Star,
  UtensilsCrossed,
  Waves,
  Wallet,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StaySearchForm } from "@/components/booking/stay-search-form";
import { CountUp } from "@/components/landing/count-up";
import { Parallax } from "@/components/landing/parallax";
import { Reveal } from "@/components/landing/reveal";
import { SectionHeading } from "@/components/landing/section-heading";
import { Stars } from "@/components/reviews/stars";
import { RoomImage } from "@/components/rooms/room-image";
import { Container } from "@/components/shared/container";
import { photos, unsplash } from "@/config/images";
import { siteConfig } from "@/config/site";
import { dbConnect } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { countBookableRooms, listActiveRoomTypes } from "@/services/catalogue.service";
import { getFeaturedReviews, getOverallRating, getRatingSummaries } from "@/services/review.service";

/**
 * Home page. Static sections are prerendered; live data (rating, numbers,
 * rooms, reviews) streams in from the database inside <Suspense>.
 * All motion is CSS or small client components and respects reduced motion.
 */

const HERO_SLIDES = [
  { id: photos.tuftedBedroom, alt: "Elegant guest room with upholstered headboard" },
  { id: photos.suiteLounge, alt: "Suite lounge with sofa" },
  { id: photos.warmBedroom, alt: "Warmly lit bedroom" },
  { id: photos.restaurant, alt: "Saffron Restaurant dining room" },
];

const HEADLINE = ["Your", "calm", "corner", "in", "the", "heart", "of", "Dhaka"];

const experiences = [
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

const MAP = { lat: 23.7465, lon: 90.376 };
const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${MAP.lon - 0.012}%2C${MAP.lat - 0.007}%2C${MAP.lon + 0.012}%2C${MAP.lat + 0.007}&layer=mapnik&marker=${MAP.lat}%2C${MAP.lon}`;
const directionsHref = `https://www.openstreetmap.org/?mlat=${MAP.lat}&mlon=${MAP.lon}#map=16/${MAP.lat}/${MAP.lon}`;

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 -z-10" aria-hidden>
          {HERO_SLIDES.map((slide, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- remote CDN photo, see config/images.ts
            <img
              key={slide.id}
              src={unsplash(slide.id, 2200)}
              alt=""
              fetchPriority={i === 0 ? "high" : "low"}
              loading={i === 0 ? "eager" : "lazy"}
              className="hero-slide absolute inset-0 size-full object-cover"
              style={{ animationDelay: `${i * 6 - 1.2}s` }}
            />
          ))}
        </div>
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-black/60 via-black/30 to-black/80" aria-hidden />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-black/50 to-transparent" aria-hidden />

        <Container className="flex flex-1 flex-col justify-center pt-28 pb-10">
          <p className="animate-fade-up mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-[0.2em] uppercase backdrop-blur">
            <MapPin className="size-3.5 text-gold" aria-hidden /> Dhanmondi · Dhaka
          </p>
          <h1 className="max-w-4xl text-5xl leading-[1.02] font-medium tracking-tight text-balance sm:text-7xl lg:text-8xl">
            {HEADLINE.map((word, i) => (
              <span
                key={i}
                className={cn("animate-fade-up inline-block pr-[0.22em]", word === "calm" && "text-gold italic")}
                style={{ animationDelay: `${150 + i * 70}ms` }}
              >
                {word}
              </span>
            ))}
          </h1>
          <p className="animate-fade-up mt-6 max-w-xl text-lg text-white/85 sm:text-xl" style={{ animationDelay: "800ms" }}>
            Thoughtfully designed rooms, warm Bengali hospitality and a short walk to Dhanmondi Lake.
          </p>

          <div className="animate-fade-up mt-10 w-full max-w-4xl" style={{ animationDelay: "950ms" }}>
            <div className="rounded-3xl bg-white/15 p-2 pb-0 shadow-2xl ring-1 ring-white/30 backdrop-blur-xl">
              <StaySearchForm />
            </div>
          </div>

          <Suspense fallback={<TrustRow />}>
            <LiveTrustRow />
          </Suspense>
        </Container>

        <div className="animate-fade-up pb-6 text-center" style={{ animationDelay: "1400ms" }} aria-hidden>
          <span className="inline-block h-10 w-6 rounded-full border border-white/40 p-1">
            <span className="mx-auto block h-2 w-1 animate-bounce rounded-full bg-white/80" />
          </span>
        </div>
      </section>

      {/* ── Live numbers ─────────────────────────────────────── */}
      <section className="border-b bg-sand">
        <Container className="py-14">
          <Suspense fallback={<div className="h-24" />}>
            <NumbersBand />
          </Suspense>
        </Container>
      </section>

      {/* ── Story ───────────────────────────────────────────── */}
      <section className="overflow-hidden">
        <Container className="grid items-center gap-16 py-24 lg:grid-cols-2 lg:py-32">
          <Reveal className="relative pb-16 sm:pr-16">
            {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN photo */}
            <img
              src={unsplash(photos.brightLiving, 1100, 900)}
              alt="Bright suite living area with large windows"
              loading="lazy"
              className="aspect-[5/4] w-full rounded-[2rem] object-cover shadow-2xl"
            />
            <Parallax speed={0.08} className="absolute right-0 bottom-0 w-1/2 max-w-xs">
              {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN photo */}
              <img
                src={unsplash(photos.dining, 600, 700)}
                alt="Dinner table at the hotel restaurant"
                loading="lazy"
                className="aspect-[6/7] w-full rounded-[1.5rem] border-8 border-background object-cover shadow-2xl"
              />
            </Parallax>
            <div className="absolute top-6 -left-3 hidden rotate-[-4deg] rounded-2xl bg-gold px-5 py-3 text-neutral-900 shadow-xl sm:block">
              <p className="text-xs font-semibold tracking-widest uppercase">Free cancellation</p>
              <p className="text-sm">until the day before arrival</p>
            </div>
          </Reveal>

          <Reveal delay={120} className="space-y-8">
            <SectionHeading
              eyebrow={`Welcome to ${siteConfig.name}`}
              title="A boutique hotel made for rest, work and everything in between"
            />
            <p className="text-lg leading-relaxed text-muted-foreground">
              Tucked away on a quiet tree-lined road in Dhanmondi, {siteConfig.name} combines the comfort of a modern hotel
              with the warmth of a family home. Whether you are in Dhaka for business, a family visit or a weekend away,
              our team makes every stay feel effortless.
            </p>
            <ul className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Wifi, text: "Free high-speed Wi-Fi" },
                { icon: UtensilsCrossed, text: "Breakfast included" },
                { icon: Car, text: "Airport transfer on request" },
                { icon: Clock, text: "24/7 front desk" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  <span className="font-medium">{text}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="lg" className="rounded-full px-6">
              <Link href="/about">
                Our story <ArrowRight aria-hidden />
              </Link>
            </Button>
          </Reveal>
        </Container>
      </section>

      {/* ── Rooms bento (live) ──────────────────────────────── */}
      <section className="bg-sand">
        <Container className="space-y-12 py-24 lg:py-32">
          <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading eyebrow="Rooms & suites" title="Find the room that fits your stay" />
            <Button asChild variant="outline" className="w-fit rounded-full px-5">
              <Link href="/rooms">
                View all rooms <ArrowRight aria-hidden />
              </Link>
            </Button>
          </Reveal>
          <Suspense fallback={<div className="h-[560px] animate-pulse rounded-3xl bg-muted" />}>
            <RoomsBento />
          </Suspense>
        </Container>
      </section>

      {/* ── Experiences ─────────────────────────────────────── */}
      <section>
        <Container className="space-y-12 py-24 lg:py-32">
          <Reveal>
            <SectionHeading
              eyebrow="Experiences"
              title="Everything you need, under one roof"
              description="Dine, swim, work and unwind without leaving the hotel."
            />
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {experiences.map(({ icon: Icon, title, text, photo }, i) => (
              <Reveal key={title} delay={i * 100}>
                <article className="group relative isolate h-[26rem] overflow-hidden rounded-3xl text-white">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN photo */}
                  <img
                    src={unsplash(photo, 700, 950)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="flex h-full flex-col justify-end p-6">
                    <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                      <Icon className="size-5 text-gold" aria-hidden />
                    </span>
                    <h3 className="font-heading text-2xl">{title}</h3>
                    <p className="mt-2 text-sm text-white/80 transition-all duration-500 lg:max-h-0 lg:opacity-0 lg:group-hover:max-h-24 lg:group-hover:opacity-100">
                      {text}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Reviews (live) ─────────────────────────────────── */}
      <Suspense fallback={null}>
        <ReviewsMarquee />
      </Suspense>

      {/* ── Location ────────────────────────────────────────── */}
      <section>
        <Container className="grid items-center gap-12 py-24 lg:grid-cols-[1fr_1.2fr] lg:py-32">
          <Reveal className="space-y-8">
            <SectionHeading eyebrow="Location" title="Quiet street, central address" />
            <p className="flex items-start gap-3 text-lg text-muted-foreground">
              <MapPin className="mt-1 size-5 shrink-0 text-primary" aria-hidden />
              {siteConfig.contact.address}
            </p>
            <ul className="divide-y rounded-2xl border bg-card">
              {nearby.map((n) => (
                <li key={n.place} className="flex items-center justify-between px-5 py-4">
                  <span className="font-medium">{n.place}</span>
                  <span className="text-sm text-muted-foreground">{n.distance}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="rounded-full px-5">
              <a href={directionsHref} target="_blank" rel="noopener noreferrer">
                <Navigation aria-hidden /> Open in maps
              </a>
            </Button>
          </Reveal>
          <Reveal delay={120}>
            <div className="overflow-hidden rounded-[2rem] border shadow-xl">
              <iframe
                title={`Map showing ${siteConfig.fullName}`}
                src={mapSrc}
                loading="lazy"
                className="aspect-[4/3] w-full"
                referrerPolicy="no-referrer"
              />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── Closing call to action ──────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-neutral-950 text-white">
        <Parallax speed={0.18} className="absolute -inset-y-24 inset-x-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN photo */}
          <img src={unsplash(photos.whiteBedroom, 2000, 1100)} alt="" loading="lazy" className="size-full object-cover" />
        </Parallax>
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-primary/90 via-primary/75 to-black/50" />
        <Container className="py-28 lg:py-36">
          <Reveal className="max-w-2xl space-y-8">
            <SectionHeading
              tone="light"
              eyebrow="Ready when you are"
              title="Your room is waiting"
              description="Check live availability for your dates. No payment needed now; pay when you arrive."
            />
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-full bg-gold px-7 text-base text-neutral-900 hover:bg-gold/90">
                <Link href="/rooms">
                  Book your stay <ArrowUpRight aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/40 bg-white/10 px-7 text-base text-white hover:bg-white/20 hover:text-white"
              >
                <a href={`tel:${siteConfig.contact.phone.replace(/[\s-]/g, "")}`}>Call {siteConfig.contact.phone}</a>
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}

// ─── Live sections ────────────────────────────────────────────────────

function TrustRow({ rating }: { rating?: { average: number; count: number } }) {
  const items = [
    { icon: ShieldCheck, text: "Free cancellation" },
    { icon: Wallet, text: "Pay at the hotel" },
    { icon: BadgeCheck, text: "Best rate when booking direct" },
  ];
  return (
    <ul className="animate-fade-up mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/85" style={{ animationDelay: "1100ms" }}>
      {rating && rating.count > 0 && (
        <li className="flex items-center gap-2">
          <Star className="size-4 fill-gold text-gold" aria-hidden />
          <span className="font-semibold text-white">{rating.average.toFixed(1)}</span>
          <span>from {rating.count} guest reviews</span>
        </li>
      )}
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-2">
          <Icon className="size-4 text-gold" aria-hidden />
          {text}
        </li>
      ))}
    </ul>
  );
}

async function LiveTrustRow() {
  await connection();
  await dbConnect();
  return <TrustRow rating={await getOverallRating()} />;
}

async function NumbersBand() {
  await connection();
  await dbConnect();
  const [rooms, roomTypes, rating] = await Promise.all([countBookableRooms(), listActiveRoomTypes(), getOverallRating()]);
  const stats = [
    { value: rooms, label: "Rooms & suites" },
    { value: roomTypes.length, label: "Room categories" },
    { value: rating.average, decimals: 1, label: "Average guest rating", suffix: "★" },
    { value: rating.count, label: "Verified guest reviews" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <dt className="sr-only">{s.label}</dt>
          <dd className="font-heading text-4xl text-primary sm:text-5xl">
            <CountUp value={s.value} decimals={s.decimals ?? 0} />
            {s.suffix && <span className="ml-1 text-3xl text-gold">{s.suffix}</span>}
          </dd>
          <dd className="mt-2 text-sm tracking-wide text-muted-foreground uppercase">{s.label}</dd>
        </div>
      ))}
    </dl>
  );
}

async function RoomsBento() {
  await connection();
  await dbConnect();
  const [all, ratings] = await Promise.all([listActiveRoomTypes(), getRatingSummaries()]);
  // Most premium room type first (large tile), then up to four more.
  const rooms = [...all].sort((a, b) => b.pricePerNight - a.pricePerNight).slice(0, 5);
  if (rooms.length === 0) return <p className="text-muted-foreground">Rooms will be listed here soon.</p>;

  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4 lg:grid-rows-[17rem_17rem]">
      {rooms.map((room, i) => {
        const rating = ratings.get(room.id);
        const featured = i === 0;
        return (
          <Reveal
            key={room.id}
            delay={i * 90}
            className={cn("w-[82%] shrink-0 snap-start sm:w-auto", featured && "sm:col-span-2 lg:row-span-2")}
          >
            <Link
              href={`/rooms/${room.slug}`}
              className="group relative isolate flex h-[22rem] flex-col justify-end overflow-hidden rounded-3xl text-white shadow-lg sm:h-full sm:min-h-[17rem]"
            >
              <RoomImage
                src={room.images[0]}
                alt={room.name}
                className="absolute inset-0 -z-10 size-full transition-transform duration-[1200ms] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/85 via-black/25 to-transparent" />
              {rating && rating.count > 0 && (
                <span className="absolute top-4 left-4 flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-sm backdrop-blur">
                  <Star className="size-3.5 fill-gold text-gold" aria-hidden /> {rating.average.toFixed(1)}
                </span>
              )}
              <span className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/15 opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
                <ArrowUpRight className="size-5" aria-hidden />
              </span>
              <div className={cn("p-6", featured && "sm:p-8")}>
                <p className="text-xs tracking-[0.2em] text-white/75 uppercase">
                  {featured && `${room.bedType} · `}up to {room.capacity} {room.capacity === 1 ? "guest" : "guests"}
                </p>
                <h3 className={cn("mt-2 font-heading", featured ? "text-3xl sm:text-4xl" : "text-2xl")}>{room.name}</h3>
                {featured && <p className="mt-3 line-clamp-2 max-w-md text-white/80">{room.description}</p>}
                <p className="mt-3 text-sm text-white/80">
                  from <span className="text-lg font-semibold text-white">{formatCurrency(room.pricePerNight)}</span> / night
                </p>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}

async function ReviewsMarquee() {
  await connection();
  await dbConnect();
  const [reviews, overall] = await Promise.all([getFeaturedReviews(10), getOverallRating()]);
  if (reviews.length === 0) return null;

  const card = (r: (typeof reviews)[number], key: string, hidden = false) => (
    <li key={key} aria-hidden={hidden || undefined} className="w-[22rem] shrink-0 rounded-3xl border bg-card p-7 shadow-sm">
      <Quote className="size-7 text-gold" aria-hidden />
      <p className="mt-4 line-clamp-5 font-heading text-lg leading-relaxed">{r.comment}</p>
      <div className="mt-6 flex items-center justify-between gap-3 border-t pt-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {r.authorName[0]}
          </span>
          <div>
            <p className="font-medium">{r.authorName}</p>
            <p className="text-xs text-muted-foreground">{r.roomTypeName}</p>
          </div>
        </div>
        <Stars rating={r.rating} />
      </div>
    </li>
  );

  return (
    <section className="overflow-hidden bg-sand">
      <Container className="py-24 lg:py-32">
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading eyebrow="Guest reviews" title="Loved by our guests" />
          <div className="flex items-center gap-4">
            <span className="font-heading text-6xl text-primary">{overall.average.toFixed(1)}</span>
            <div>
              <Stars rating={overall.average} />
              <p className="mt-1 text-sm text-muted-foreground">from {overall.count} verified stays</p>
            </div>
          </div>
        </Reveal>
      </Container>
      <div className="marquee relative -mt-8 pb-24 lg:pb-32" tabIndex={0} aria-label="Guest reviews, scrolling">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-sand to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-sand to-transparent" aria-hidden />
        <ul className="marquee-track flex w-max gap-6 px-3">
          {reviews.map((r) => card(r, r.id))}
          {reviews.map((r) => card(r, `${r.id}-copy`, true))}
        </ul>
      </div>
    </section>
  );
}
