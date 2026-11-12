import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private, account-specific and transactional pages: nothing to index.
      disallow: ["/admin", "/api/", "/login", "/register", "/my-bookings", "/profile", "/booking/", "/search"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
