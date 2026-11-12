import { cn } from "@/lib/utils";

/** Eyebrow + serif title used by every home-page section. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "default",
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "default" | "light";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl space-y-4", align === "center" && "mx-auto text-center", className)}>
      <p
        className={cn(
          "flex items-center gap-3 text-xs font-semibold tracking-[0.25em] uppercase",
          align === "center" && "justify-center",
          tone === "light" ? "text-gold" : "text-primary",
        )}
      >
        <span className="h-px w-8 bg-gold" aria-hidden />
        {eyebrow}
        {align === "center" && <span className="h-px w-8 bg-gold" aria-hidden />}
      </p>
      <h2
        className={cn(
          "text-3xl font-medium tracking-tight text-balance sm:text-5xl",
          tone === "light" ? "text-white" : "text-foreground",
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn("text-lg leading-relaxed", tone === "light" ? "text-white/80" : "text-muted-foreground")}>
          {description}
        </p>
      )}
    </div>
  );
}
