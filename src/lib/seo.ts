import { siteConfig } from "@/config/site";

/** Trim text to a search-snippet length without cutting a word in half. */
export function snippet(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

/** schema.org Hotel entity for the home page. */
export function hotelJsonLd(rating?: { average: number; count: number }) {
  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "@id": `${siteConfig.url}/#hotel`,
    name: siteConfig.fullName,
    description: siteConfig.description,
    url: siteConfig.url,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    image: `${siteConfig.url}/opengraph-image`,
    priceRange: "৳৳",
    checkinTime: "14:00",
    checkoutTime: "12:00",
    address: {
      "@type": "PostalAddress",
      streetAddress: "House 12, Road 7, Dhanmondi",
      addressLocality: "Dhaka",
      postalCode: "1205",
      addressCountry: "BD",
    },
    geo: { "@type": "GeoCoordinates", latitude: siteConfig.geo.lat, longitude: siteConfig.geo.lon },
    ...(rating && rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.average,
            reviewCount: rating.count,
          },
        }
      : {}),
  };
}
