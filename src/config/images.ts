/**
 * Photography used on the public site and by the demo seed script.
 * Photos are served by the Unsplash CDN (free to use under the Unsplash
 * License); `unsplash()` requests a size-appropriate, compressed version.
 * Replace these with the hotel's own photos when available.
 */
export function unsplash(id: string, width: number, height?: number): string {
  const params = new URLSearchParams({
    w: String(width),
    q: "75",
    auto: "format",
    fit: "crop",
  });
  if (height) params.set("h", String(height));
  return `https://images.unsplash.com/photo-${id}?${params}`;
}

export const photos = {
  // Rooms
  warmBedroom: "1618773928121-c32242e63f39",
  modernKing: "1631049307264-da0ec9d70304",
  classicRoom: "1590490360182-c33d57733427",
  darkWoodRoom: "1611892440504-42a792e24d32",
  windowRoom: "1582719478250-c89cae4dc85b",
  twinRoom: "1595576508898-0ad5c879a061",
  minimalRoom: "1522771739844-6a9f6d5f14af",
  suiteLounge: "1591088398332-8a7791972843",
  brightLiving: "1560448204-e02f11c3d0e2",
  tuftedBedroom: "1505693416388-ac5ce068fe85",
  ottomanBedroom: "1540518614846-7eded433c457",
  armchairCorner: "1586023492125-27b2c045efd7",
  curtainRoom: "1629140727571-9b5c6f6267b4",
  moodyRoom: "1566665797739-1674de7a421a",
  whiteBedroom: "1559599238-308793637427",
  // Facilities
  restaurant: "1517248135467-4c7edcad34c4",
  dining: "1414235077428-338989a2e8c0",
  gym: "1534438327276-14e5300c3a48",
  pool: "1564501049412-61c2a3083791",
} as const;
