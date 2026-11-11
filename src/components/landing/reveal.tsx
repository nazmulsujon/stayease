"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Fades its children up when they scroll into view.
 * Server-rendered content stays visible; only elements that start below the
 * fold are hidden (via a data attribute) and then revealed once. Honours
 * prefers-reduced-motion through CSS (see globals.css).
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.state = "visible";
          observer.disconnect();
        } else if (el.dataset.state !== "visible") {
          el.dataset.state = "hidden";
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal", className)}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
