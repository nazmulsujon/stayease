import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { siteConfig } from "@/config/site";
import { dbConnect } from "@/lib/db";
import { listActiveRoomTypes } from "@/services/catalogue.service";

/** Public pages only. Room detail pages are added from the live catalogue. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/rooms`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.5 },
  ];

  try {
    await connection();
    await dbConnect();
    const roomTypes = await listActiveRoomTypes();
    for (const rt of roomTypes) {
      entries.push({ url: `${base}/rooms/${rt.slug}`, changeFrequency: "weekly", priority: 0.8 });
    }
  } catch {
    // Database unavailable: still serve the static pages.
  }
  return entries;
}
