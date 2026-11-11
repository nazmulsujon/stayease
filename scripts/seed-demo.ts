/**
 * Loads realistic demo data for presentations and manual testing:
 * room types (with photos), physical rooms, demo customers, bookings in
 * every status (relative to today) and reviews.
 *
 *   npm run seed:demo            → only runs on an empty catalogue
 *   npm run seed:demo -- --reset → first DELETES all room types, rooms,
 *                                  bookings, reviews and customer accounts
 *                                  (administrator accounts are kept)
 *
 * Demo customers log in with DEMO_CUSTOMER_PASSWORD from .env.local.
 */
import type { Types } from "mongoose";
import { z } from "zod";
import { photos, unsplash } from "../src/config/images";
import { connectToDatabase, disconnectFromDatabase } from "../src/lib/db-core";
import { addDays, hotelToday, nightsBetween, parseDateString } from "../src/lib/dates";
import { hashPassword } from "../src/lib/auth/password";
import { generateReferenceCode } from "../src/lib/reference-code";
import { slugify } from "../src/lib/slug";
import { Booking } from "../src/models/booking";
import { Review } from "../src/models/review";
import { Room } from "../src/models/room";
import { RoomType } from "../src/models/room-type";
import { User } from "../src/models/user";
import { passwordSchema } from "../src/validations/auth";
import type { RoomStatus } from "../src/types/catalogue";

const env = z
  .object({
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    MONGODB_DB_NAME: z.string().default("stayease"),
    DEMO_CUSTOMER_PASSWORD: passwordSchema,
  })
  .safeParse({ ...process.env, MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || undefined });

const img = (...ids: string[]) => ids.map((id) => unsplash(id, 1600, 1000));

const ROOM_TYPES = [
  {
    name: "Standard Single Room",
    description:
      "A cosy, well-designed room for solo travellers. Features a comfortable single bed with premium linen, a work desk with ergonomic chair, blackout curtains and a modern en-suite shower room.",
    pricePerNight: 3200, capacity: 1, bedType: "1 Single Bed", sizeSqft: 180,
    amenities: ["Free Wi-Fi", "Air conditioning", "Work desk", "Smart TV", "Rain shower", "Daily housekeeping"],
    images: img(photos.minimalRoom),
    rooms: [["101", 1], ["102", 1], ["103", 1], ["104", 1, "maintenance"]],
  },
  {
    name: "Twin Room",
    description:
      "Two comfortable single beds in a bright, airy room. Ideal for friends or colleagues travelling together, with a seating corner, ample storage and a spacious bathroom.",
    pricePerNight: 4800, capacity: 2, bedType: "2 Single Beds", sizeSqft: 260,
    amenities: ["Free Wi-Fi", "Air conditioning", "Smart TV", "Mini fridge", "Tea & coffee maker", "Safe"],
    images: img(photos.twinRoom, photos.curtainRoom),
    rooms: [["105", 1], ["106", 1], ["107", 1], ["108", 1]],
  },
  {
    name: "Deluxe Double Room",
    description:
      "Our most popular room. A king-size bed, a large window overlooking leafy Dhanmondi, a writing desk and a modern bathroom with rain shower. Perfect for couples and business travellers.",
    pricePerNight: 5500, capacity: 2, bedType: "1 King Bed", sizeSqft: 320,
    amenities: ["Free Wi-Fi", "Air conditioning", "Smart TV", "Mini fridge", "Tea & coffee maker", "Safe", "City view"],
    images: img(photos.modernKing, photos.windowRoom, photos.whiteBedroom),
    rooms: [["201", 2], ["202", 2], ["203", 2], ["204", 2], ["205", 2], ["206", 2]],
  },
  {
    name: "Executive King Room",
    description:
      "Rich wood finishes, a plush king bed and a dedicated lounge chair make this room a quiet retreat. Includes access to the executive lounge with evening snacks and pressing service.",
    pricePerNight: 7500, capacity: 2, bedType: "1 King Bed", sizeSqft: 380,
    amenities: ["Free Wi-Fi", "Air conditioning", "Smart TV", "Nespresso machine", "Bathrobe & slippers", "Executive lounge access", "Pressing service"],
    images: img(photos.darkWoodRoom, photos.tuftedBedroom, photos.moodyRoom),
    rooms: [["301", 3], ["302", 3], ["303", 3], ["304", 3]],
  },
  {
    name: "Family Suite",
    description:
      "Space for the whole family: a separate living area with sofa, a king bedroom plus two single beds, two TVs and a large bathroom with bathtub. Children under 6 stay free.",
    pricePerNight: 9800, capacity: 4, bedType: "1 King + 2 Single Beds", sizeSqft: 560,
    amenities: ["Free Wi-Fi", "Air conditioning", "Living area with sofa", "2 Smart TVs", "Bathtub", "Mini fridge", "Kids' welcome kit"],
    images: img(photos.suiteLounge, photos.classicRoom, photos.brightLiving),
    rooms: [["401", 4], ["402", 4], ["403", 4]],
  },
  {
    name: "Premier Suite",
    description:
      "Our finest accommodation on the top floor. A light-filled suite with panoramic windows, a freestanding bathtub, walk-in wardrobe and a lounge for entertaining. Includes airport transfer.",
    pricePerNight: 14500, capacity: 3, bedType: "1 King Bed + Sofa Bed", sizeSqft: 750,
    amenities: ["Free Wi-Fi", "Air conditioning", "Panoramic view", "Freestanding bathtub", "Walk-in wardrobe", "Nespresso machine", "Free airport transfer", "Late checkout"],
    images: img(photos.warmBedroom, photos.armchairCorner, photos.ottomanBedroom),
    rooms: [["501", 5], ["502", 5]],
  },
] as const;

const CUSTOMERS = [
  { name: "Ayesha Rahman", email: "ayesha@demo.stayease.test", phone: "01711000001" },
  { name: "Tanvir Hasan", email: "tanvir@demo.stayease.test", phone: "01811000002" },
  { name: "Nusrat Jahan", email: "nusrat@demo.stayease.test", phone: "01911000003" },
  { name: "Farhan Ahmed", email: "farhan@demo.stayease.test", phone: "01611000004" },
  { name: "Sadia Islam", email: "sadia@demo.stayease.test", phone: "01511000005" },
];

/** [customer index, room number, check-in offset, nights, guests, status, paid, special request, review] */
type Plan = [number, string, number, number, number, "pending" | "confirmed" | "completed" | "cancelled", boolean, string?, [number, string]?];

const BOOKINGS: Plan[] = [
  // Past, completed, with reviews
  [0, "201", -40, 3, 2, "completed", true, "", [5, "Spotless room, super comfortable bed and the staff went out of their way to help us. Breakfast had great variety. We will definitely be back!"]],
  [1, "301", -32, 2, 1, "completed", true, "Quiet room please", [5, "Perfect for a business trip. Fast Wi-Fi, quiet room and the executive lounge was a nice bonus. Check-in took two minutes."]],
  [2, "401", -25, 4, 4, "completed", true, "Baby cot needed", [4, "The family suite gave us plenty of space with two kids. Pool on the roof was a hit. Only wish the bathroom had a second sink."]],
  [3, "101", -20, 2, 1, "completed", true, "", [4, "Small but very smart single room, everything you need. Great location near Dhanmondi Lake for morning walks."]],
  [4, "501", -15, 2, 2, "completed", true, "Anniversary stay", [5, "We celebrated our anniversary in the Premier Suite and it was magical. The team surprised us with a cake. Absolutely worth it."]],
  [0, "105", -12, 1, 2, "completed", true, "", [4, "Clean twin room, friendly reception and easy airport pickup. Good value for Dhaka."]],
  [1, "202", -9, 2, 2, "completed", true, "", [3, "Room was nice and clean, but the street was a bit noisy in the evening. Staff were very polite."]],
  [2, "302", -6, 3, 2, "completed", false, ""],
  // Stays in progress and today's movements
  [3, "203", -2, 4, 2, "confirmed", true, "Extra pillows please"],
  [4, "402", -1, 3, 3, "confirmed", false, ""],
  [0, "204", 0, 2, 2, "confirmed", false, "Arriving around 9 PM"],
  [1, "106", 0, 1, 2, "pending", false, ""],
  [2, "102", -3, 3, 1, "confirmed", true, ""], // checks out today
  // Upcoming
  [3, "303", 3, 2, 2, "confirmed", false, ""],
  [4, "205", 5, 3, 2, "pending", false, "Ground floor if possible"],
  [0, "502", 9, 2, 2, "pending", false, "Honeymoon"],
  [1, "403", 14, 5, 4, "pending", false, ""],
  [2, "107", 21, 2, 2, "confirmed", false, ""],
  // Cancelled
  [3, "206", 7, 2, 2, "cancelled", false, ""],
  [4, "304", -5, 2, 1, "cancelled", false, ""],
];

async function main() {
  if (!env.success) {
    console.error("✖ Invalid settings in .env.local:");
    for (const i of env.error.issues) console.error(`  - ${i.path.join(".")}: ${i.message}`);
    process.exit(1);
  }
  const { MONGODB_URI, MONGODB_DB_NAME, DEMO_CUSTOMER_PASSWORD } = env.data;
  const reset = process.argv.includes("--reset");

  await connectToDatabase(MONGODB_URI, MONGODB_DB_NAME);
  await Promise.all([User.init(), RoomType.init(), Room.init(), Booking.init(), Review.init()]);

  if (reset) {
    console.log("Removing existing room types, rooms, bookings, reviews and customers…");
    await Promise.all([
      Review.deleteMany({}),
      Booking.deleteMany({}),
      Room.deleteMany({}),
      RoomType.deleteMany({}),
      User.deleteMany({ role: "customer" }),
    ]);
  } else if (await RoomType.exists({})) {
    console.error("✖ The database already has room types. Run `npm run seed:demo -- --reset` to replace them.");
    await disconnectFromDatabase();
    process.exit(1);
  }

  // Room types and rooms
  const roomIds = new Map<string, { roomId: Types.ObjectId; typeId: Types.ObjectId; price: number }>();
  for (const t of ROOM_TYPES) {
    const { rooms, ...data } = t;
    const type = await RoomType.create({
      ...data,
      amenities: [...data.amenities],
      images: [...data.images],
      slug: slugify(data.name),
    });
    for (const [roomNumber, floor, status] of rooms as readonly (readonly [string, number, RoomStatus?])[]) {
      const room = await Room.create({ roomNumber, floor, roomType: type._id, status: status ?? "available" });
      roomIds.set(roomNumber, { roomId: room._id, typeId: type._id, price: type.pricePerNight });
    }
  }
  console.log(`✔ ${ROOM_TYPES.length} room types and ${roomIds.size} rooms`);

  // Customers
  const passwordHash = await hashPassword(DEMO_CUSTOMER_PASSWORD);
  const customers = await User.create(CUSTOMERS.map((c) => ({ ...c, passwordHash, role: "customer" as const })));
  console.log(`✔ ${customers.length} demo customers (password from DEMO_CUSTOMER_PASSWORD)`);

  // Bookings (+ reviews), dated relative to today
  const today = hotelToday();
  let reviewCount = 0;
  for (const [ci, roomNumber, offset, nights, guests, status, paid, request, review] of BOOKINGS) {
    const room = roomIds.get(roomNumber)!;
    const checkIn = addDays(today, offset);
    const checkOut = addDays(checkIn, nights);
    const createdAt = parseDateString(addDays(checkIn, -Math.min(20, 3 + nights * 2)));
    const booking = await Booking.create({
      referenceCode: generateReferenceCode(),
      user: customers[ci]._id,
      room: room.roomId,
      roomType: room.typeId,
      checkIn: parseDateString(checkIn),
      checkOut: parseDateString(checkOut),
      nights: nightsBetween(checkIn, checkOut),
      guests,
      pricePerNight: room.price,
      totalPrice: nights * room.price,
      status,
      paymentStatus: paid ? "paid" : "unpaid",
      specialRequest: request ?? "",
      cancelledBy: status === "cancelled" ? (ci % 2 ? "customer" : "admin") : null,
      cancelledAt: status === "cancelled" ? createdAt : null,
      createdAt,
    });
    if (review) {
      await Review.create({
        user: customers[ci]._id,
        roomType: room.typeId,
        booking: booking._id,
        rating: review[0],
        comment: review[1],
        createdAt: parseDateString(checkOut),
      });
      reviewCount++;
    }
  }
  console.log(`✔ ${BOOKINGS.length} bookings and ${reviewCount} reviews`);
  console.log("\nDemo customer logins:");
  for (const c of CUSTOMERS) console.log(`  ${c.email}`);

  await disconnectFromDatabase();
}

main().catch(async (error) => {
  console.error("✖ Seeding failed:", error instanceof Error ? error.message : error);
  await disconnectFromDatabase();
  process.exit(1);
});
