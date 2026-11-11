import { z } from "zod";
import { ROOM_STATUSES } from "@/types/catalogue";

/**
 * Room catalogue schemas, shared by the admin forms and Server Actions.
 * Form fields are strings (that is what HTML inputs produce); the schemas
 * convert them to numbers and arrays.
 */

/** A required whole number typed into a text/number input. */
const wholeNumber = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^\d+$/, `${label} must be a whole number`)
    .transform(Number)
    .pipe(
      z
        .number()
        .min(min, `${label} must be at least ${min.toLocaleString("en")}`)
        .max(max, `${label} must be at most ${max.toLocaleString("en")}`),
    );

/** Accepts https URLs or site-relative paths such as /images/room.jpg. */
const imageUrl = z
  .string()
  .max(500, "Image URL is too long")
  .refine(
    (v) => {
      if (v.startsWith("/") && !v.startsWith("//")) return true;
      try {
        return new URL(v).protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Each image must be an https:// URL or a path starting with /" },
  );

const splitList = (separator: RegExp) => (value: string) => [
  ...new Set(
    value
      .split(separator)
      .map((item) => item.trim())
      .filter(Boolean),
  ),
];

export const roomTypeSchema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters").max(60, "Name must be at most 60 characters"),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be at most 2000 characters"),
  pricePerNight: wholeNumber("Price per night", 1, 1_000_000),
  capacity: wholeNumber("Maximum guests", 1, 10),
  bedType: z.string().trim().min(2, "Bed type is required").max(40, "Bed type is too long"),
  sizeSqft: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(
      z
        .string()
        .regex(/^\d+$/, "Size must be a whole number")
        .transform(Number)
        .pipe(z.number().min(50, "Size must be at least 50 sq ft").max(10_000, "Size is too large"))
        .nullable(),
    ),
  /** Comma- or newline-separated list, e.g. "Wi-Fi, Air conditioning, TV". */
  amenities: z
    .string()
    .transform(splitList(/[,\n]/))
    .pipe(
      z
        .array(z.string().max(40, "Each amenity must be at most 40 characters"))
        .max(20, "Add at most 20 amenities"),
    ),
  /** One image URL per line. */
  images: z
    .string()
    .transform(splitList(/\s*\n\s*/))
    .pipe(z.array(imageUrl).max(6, "Add at most 6 images")),
});

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const roomSchema = z.object({
  roomNumber: z
    .string()
    .trim()
    .min(1, "Room number is required")
    .max(10, "Room number is too long")
    .regex(/^[A-Za-z0-9-]+$/, "Use only letters, numbers and hyphens")
    .transform((v) => v.toUpperCase()),
  floor: wholeNumber("Floor", 0, 200),
  roomTypeId: z.string().min(1, "Choose a room type").pipe(objectIdSchema),
  status: z.enum(ROOM_STATUSES, { error: "Choose a status" }),
});

export type RoomTypeFormValues = z.input<typeof roomTypeSchema>;
export type RoomTypeInput = z.output<typeof roomTypeSchema>;
export type RoomFormValues = z.input<typeof roomSchema>;
export type RoomInput = z.output<typeof roomSchema>;
