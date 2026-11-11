import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo-mark";

/** Brand logo (mark + wordmark) linking to the home page. */
export function Logo({ className, tone = "default" }: { className?: string; tone?: "default" | "light" }) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-2.5", className)}
      aria-label={`${siteConfig.name} home`}
    >
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-3" />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[1.2rem] font-semibold tracking-tight",
            tone === "light" ? "text-white" : "text-foreground",
          )}
        >
          Stay<span className={tone === "light" ? "text-white/80" : "text-primary"}>Ease</span>
        </span>
        <span
          className={cn(
            "mt-1 text-[0.6rem] font-medium tracking-[0.28em] uppercase",
            tone === "light" ? "text-white/70" : "text-muted-foreground",
          )}
        >
          Hotel · Dhaka
        </span>
      </span>
    </Link>
  );
}
