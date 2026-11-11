"use client";

import { useEffect, useRef, useState } from "react";
import { BedDouble } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Room photo with a graceful placeholder when there is no image or the URL
 * fails to load. Uses a plain <img> because image URLs are entered by the
 * admin and can point to any host (next/image would need every host allow-listed).
 */
export function RoomImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // The image can fail before React hydrates and attaches onError,
  // so also check its state once mounted.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "flex items-center justify-center bg-linear-to-br from-primary/15 via-primary/5 to-muted text-primary/50",
          className,
        )}
      >
        <BedDouble className="size-10" aria-hidden />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- see component comment
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
