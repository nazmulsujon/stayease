import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

/** Default social-share card (1200×630) used by every page without its own image. */
export const alt = `${siteConfig.fullName} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          color: "white",
          background: "linear-gradient(135deg, #1F6B70 0%, #164F53 100%)",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, color: "#E8B44C", letterSpacing: 8 }}>
          HOTEL · DHAKA
        </div>
        <div style={{ display: "flex", fontSize: 128, fontWeight: 700, marginTop: 16 }}>
          {siteConfig.name}
        </div>
        <div style={{ display: "flex", fontSize: 46, marginTop: 24, opacity: 0.9 }}>
          {siteConfig.tagline}
        </div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 56, opacity: 0.75 }}>
          Boutique stays in Dhanmondi · Book online instantly
        </div>
      </div>
    ),
    size,
  );
}
