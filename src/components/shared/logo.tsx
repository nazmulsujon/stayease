import Link from "next/link";
import { Hotel } from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 text-lg font-semibold tracking-tight",
        className,
      )}
      aria-label={`${siteConfig.name} home`}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Hotel className="size-4.5" aria-hidden />
      </span>
      {siteConfig.name}
    </Link>
  );
}
