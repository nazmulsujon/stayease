import { ImageResponse } from "next/og";

/** iOS home-screen icon (180×180 PNG) generated from the brand mark. */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Full-bleed version of app/icon.svg: iOS applies its own rounded corners.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#1F6B70"/><stop offset="1" stop-color="#164F53"/>
  </linearGradient></defs>
  <rect width="64" height="64" fill="url(#bg)"/>
  <g transform="translate(6.4 6.4) scale(0.8)">
    <g fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M13 33 32 19l19 14"/><path d="M24 49V39a8 8 0 0 1 16 0v10"/><path d="M17 49h30"/>
    </g>
    <path d="m32 4.8 1.9 3.9 4.3.6-3.1 3 .7 4.3-3.8-2-3.8 2 .7-4.3-3.1-3 4.3-.6z" fill="#E8B44C"/>
  </g>
</svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders plain img
      <img
        src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`}
        width={180}
        height={180}
        alt=""
      />
    ),
    size,
  );
}
