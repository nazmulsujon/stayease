import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { mainNav, siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/40">
      <Container className="grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            {siteConfig.tagline}
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Explore</h2>
          <ul className="space-y-2 text-sm">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold">Contact</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              {siteConfig.contact.address}
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 size-4 shrink-0" aria-hidden />
              {siteConfig.contact.phone}
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 size-4 shrink-0" aria-hidden />
              {siteConfig.contact.email}
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t">
        <Container className="flex flex-col gap-1 py-4 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>© {siteConfig.fullName}. All rights reserved.</span>
          <span>
            Check-in from {siteConfig.checkInTime} · Check-out until {siteConfig.checkOutTime}
          </span>
        </Container>
      </div>
    </footer>
  );
}
