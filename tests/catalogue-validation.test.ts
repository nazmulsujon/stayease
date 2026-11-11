import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";
import { roomSchema, roomTypeSchema } from "@/validations/catalogue";

const validType = {
  name: "  Deluxe Double Room ",
  description: "A spacious room with a lake view and a king-size bed.",
  pricePerNight: "5500",
  capacity: "2",
  bedType: "1 King Bed",
  sizeSqft: "",
  amenities: "Wi-Fi, Air conditioning,\nSmart TV, Wi-Fi, ",
  images: "https://example.com/a.jpg\n\n  /images/b.jpg  \nhttps://example.com/a.jpg",
};

const typeErrors = (override: Partial<typeof validType>) => {
  const r = roomTypeSchema.safeParse({ ...validType, ...override });
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]));
};

describe("roomTypeSchema (FR-ADM-02)", () => {
  it("converts form strings into clean typed values", () => {
    const data = roomTypeSchema.parse(validType);
    expect(data).toMatchObject({
      name: "Deluxe Double Room",
      pricePerNight: 5500,
      capacity: 2,
      sizeSqft: null,
      amenities: ["Wi-Fi", "Air conditioning", "Smart TV"], // trimmed, de-duplicated
      images: ["https://example.com/a.jpg", "/images/b.jpg"],
    });
  });

  it("accepts an optional size", () => {
    expect(roomTypeSchema.parse({ ...validType, sizeSqft: "320" }).sizeSqft).toBe(320);
  });

  it.each([
    ["pricePerNight", { pricePerNight: "" }],
    ["pricePerNight", { pricePerNight: "0" }],
    ["pricePerNight", { pricePerNight: "55.5" }],
    ["pricePerNight", { pricePerNight: "-100" }],
    ["capacity", { capacity: "11" }],
    ["capacity", { capacity: "0" }],
    ["sizeSqft", { sizeSqft: "10" }],
    ["name", { name: "AB" }],
    ["description", { description: "Too short" }],
    ["bedType", { bedType: "" }],
    ["images", { images: "http://insecure.com/a.jpg" }],
    ["images", { images: "javascript:alert(1)" }],
    ["images", { images: "//evil.com/a.jpg" }],
    ["images", { images: Array.from({ length: 7 }, (_, i) => `/img/${i}.jpg`).join("\n") }],
    ["amenities", { amenities: "x".repeat(41) }],
  ])("rejects invalid %s", (field, override) => {
    expect(typeErrors(override)).toHaveProperty(field);
  });
});

describe("roomSchema (FR-ADM-03)", () => {
  const validRoom = {
    roomNumber: " 203a ",
    floor: "2",
    roomTypeId: "65f000000000000000000001",
    status: "available",
  };

  it("normalises the room number to upper case", () => {
    expect(roomSchema.parse(validRoom)).toEqual({
      roomNumber: "203A",
      floor: 2,
      roomTypeId: "65f000000000000000000001",
      status: "available",
    });
  });

  it("allows the ground floor (0)", () => {
    expect(roomSchema.parse({ ...validRoom, floor: "0" }).floor).toBe(0);
  });

  it.each([
    { roomNumber: "" },
    { roomNumber: "20 3" },
    { floor: "-1" },
    { roomTypeId: "" },
    { roomTypeId: "not-an-id" },
    { status: "booked" },
  ])("rejects %o", (override) => {
    expect(roomSchema.safeParse({ ...validRoom, ...override }).success).toBe(false);
  });
});

describe("slugify", () => {
  it.each([
    ["Deluxe Double Room", "deluxe-double-room"],
    ["  Family Suite (Lake View) ", "family-suite-lake-view"],
    ["Bed & Breakfast", "bed-and-breakfast"],
    ["Café Room", "cafe-room"],
  ])("%s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});
