import type { Metadata } from "next";
import Link from "next/link";
import { Clock, HeartHandshake, Leaf, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/landing/reveal";
import { Container } from "@/components/shared/container";
import { photos, unsplash } from "@/config/images";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "About us & contact",
  description: `About ${siteConfig.fullName}: our story, facilities, address, phone and email. Find us in Dhanmondi, Dhaka.`,
  alternates: { canonical: "/about" },
};

const values = [
  { icon: HeartHandshake, title: "Warm hospitality", text: "A small, friendly team that knows guests by name." },
  { icon: ShieldCheck, title: "Safe & secure", text: "24/7 front desk, CCTV and key-card access on every floor." },
  { icon: Leaf, title: "Quiet comfort", text: "Soundproofed windows and premium mattresses for deep sleep." },
];

/** Public About / Contact page (feature list §8.1). */
export default function AboutPage() {
  const details = [
    { icon: MapPin, label: "Address", value: siteConfig.contact.address },
    { icon: Phone, label: "Phone", value: siteConfig.contact.phone, href: `tel:${siteConfig.contact.phone.replace(/[\s-]/g, "")}` },
    { icon: Mail, label: "Email", value: siteConfig.contact.email, href: `mailto:${siteConfig.contact.email}` },
    { icon: Clock, label: "Check-in / check-out", value: `From ${siteConfig.checkInTime} / until ${siteConfig.checkOutTime}` },
  ];

  return (
    <>
      <section className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN photo, see config/images.ts */}
        <img src={unsplash(photos.restaurant, 1800, 700)} alt="" className="animate-slow-zoom absolute inset-0 -z-10 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-black/60" />
        <Container className="py-24 text-white sm:py-32">
          <h1 className="animate-fade-up max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            About {siteConfig.name}
          </h1>
          <p className="animate-fade-up mt-4 max-w-xl text-lg text-white/85" style={{ animationDelay: "120ms" }}>
            A boutique city hotel in Dhanmondi, run with care by people who love Dhaka.
          </p>
        </Container>
      </section>

      <Container className="grid gap-12 py-16 lg:grid-cols-2">
        <Reveal className="space-y-4 leading-relaxed text-muted-foreground">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Our story</h2>
          <p>
            {siteConfig.name} opened its doors on a quiet, tree-lined road in Dhanmondi with one idea: travellers
            to Dhaka deserve a calm, comfortable base close to everything that matters. Today we welcome business
            travellers, families and tourists all year round.
          </p>
          <p>
            Our rooms are designed for real rest, with blackout curtains, soundproofed windows and fast Wi-Fi.
            Breakfast is served every morning in our restaurant, and our front desk team is happy to arrange airport
            transfers, city tours and anything else you need.
          </p>
          <p>
            Check live availability, compare our rooms and book online in minutes. There is no need to call first,
            and you pay at the hotel when you arrive.
          </p>
          <Button asChild>
            <Link href="/rooms">Browse rooms</Link>
          </Button>
        </Reveal>
        <Reveal delay={120}>
          {/* eslint-disable-next-line @next/next/no-img-element -- remote CDN photo */}
          <img
            src={unsplash(photos.whiteBedroom, 1000, 760)}
            alt="Elegant guest room with upholstered headboard"
            loading="lazy"
            className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
          />
        </Reveal>
      </Container>

      <section className="bg-muted/40">
        <Container className="grid gap-6 py-16 md:grid-cols-3">
          {values.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 100} className="space-y-2 rounded-2xl border bg-card p-6">
              <Icon className="size-6 text-primary" aria-hidden />
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </Reveal>
          ))}
        </Container>
      </section>

      <Container className="py-16">
        <Reveal>
          <Card className="mx-auto max-w-3xl">
            <CardContent>
              <h2 className="mb-6 text-xl font-semibold">Contact us</h2>
              <dl className="grid gap-6 sm:grid-cols-2">
                {details.map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex gap-3">
                    <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    <div>
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd>{href ? <a href={href} className="hover:underline">{value}</a> : value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </Reveal>
      </Container>
    </>
  );
}
