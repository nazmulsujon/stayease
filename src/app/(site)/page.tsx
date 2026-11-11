import Link from "next/link";
import { BedDouble, CalendarCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/shared/container";
import { siteConfig } from "@/config/site";

/**
 * Home page (Phase 1 foundation).
 * The availability search bar and featured rooms are added in
 * Phase 3 (Room Catalogue) and Phase 4 (Availability & Booking).
 */
const highlights = [
  {
    icon: CalendarCheck,
    title: "Live availability",
    description: "See which rooms are free for your exact dates before you book.",
  },
  {
    icon: BedDouble,
    title: "Rooms for every trip",
    description: "From single rooms to family suites, with clear nightly prices.",
  },
  {
    icon: ShieldCheck,
    title: "Guaranteed reservation",
    description: "Your room is held for you the moment your booking is placed.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="border-b bg-linear-to-b from-primary/10 to-background">
        <Container className="flex flex-col items-start gap-6 py-20 sm:py-28">
          <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            Dhaka, Bangladesh
          </span>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {siteConfig.tagline}
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            {siteConfig.description}
          </p>
          <Button asChild size="lg">
            <Link href="/rooms">Browse rooms</Link>
          </Button>
        </Container>
      </section>

      <section>
        <Container className="grid gap-4 py-16 sm:grid-cols-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <Card key={title}>
              <CardHeader>
                <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </Container>
      </section>
    </>
  );
}
