import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Room } from "@/models/room";
import { RoomType } from "@/models/room-type";
import {
  createRoom,
  createRoomType,
  getActiveRoomTypeBySlug,
  getRoomById,
  listActiveRoomTypes,
  listRoomTypesForAdmin,
  listRoomsForAdmin,
  setRoomTypeActive,
  updateRoom,
  updateRoomType,
} from "@/services/catalogue.service";
import { roomSchema, roomTypeSchema } from "@/validations/catalogue";
import { startTestDatabase } from "./helpers/mongo";

let db: Awaited<ReturnType<typeof startTestDatabase>>;

beforeAll(async () => {
  db = await startTestDatabase();
  await Promise.all([RoomType.init(), Room.init()]); // unique indexes
});
afterAll(async () => {
  await db?.stop();
});
beforeEach(async () => {
  await Promise.all([RoomType.deleteMany({}), Room.deleteMany({})]);
});

const typeInput = (name: string, price = "5000", capacity = "2") =>
  roomTypeSchema.parse({
    name,
    description: "A comfortable room for a relaxing stay in Dhaka.",
    pricePerNight: price,
    capacity,
    bedType: "1 Queen Bed",
    sizeSqft: "",
    amenities: "Wi-Fi",
    images: "",
  });

async function makeType(name: string, price?: string) {
  const r = await createRoomType(typeInput(name, price));
  if (!r.ok) throw new Error(`setup failed: ${JSON.stringify(r)}`);
  return r.value;
}

const roomInput = (roomNumber: string, roomTypeId: string, status = "available", floor = "1") =>
  roomSchema.parse({ roomNumber, floor, roomTypeId, status });

describe("room types", () => {
  it("creates a room type with a slug (FR-ADM-02)", async () => {
    const t = await makeType("Deluxe Double Room");
    expect(t).toMatchObject({ slug: "deluxe-double-room", isActive: true, pricePerNight: 5000 });
  });

  it("rejects a duplicate name, including names that produce the same slug", async () => {
    await makeType("Deluxe Room");
    expect(await createRoomType(typeInput("Deluxe Room"))).toMatchObject({ ok: false, field: "name" });
    expect(await createRoomType(typeInput("deluxe  room!"))).toMatchObject({ ok: false, field: "name" });
  });

  it("updates fields and the slug, but not into another type's name", async () => {
    const a = await makeType("Standard Room");
    await makeType("Family Suite");
    const renamed = await updateRoomType(a.id, typeInput("Standard Plus Room", "4200"));
    expect(renamed).toMatchObject({ ok: true, value: { slug: "standard-plus-room", pricePerNight: 4200 } });
    expect(await updateRoomType(a.id, typeInput("Family Suite"))).toMatchObject({ ok: false, field: "name" });
    // Saving with its own unchanged name is fine.
    expect((await updateRoomType(a.id, typeInput("Standard Plus Room"))).ok).toBe(true);
  });

  it("returns not_found for unknown or malformed ids", async () => {
    expect(await updateRoomType("65f000000000000000000000", typeInput("X Room"))).toEqual({ ok: false, reason: "not_found" });
    expect(await setRoomTypeActive("bad-id", false)).toEqual({ ok: false, reason: "not_found" });
  });
});

describe("public catalogue (FR-ROOM-01, FR-ROOM-02)", () => {
  it("lists only active types, cheapest first", async () => {
    await makeType("Suite", "12000");
    const std = await makeType("Standard", "3000");
    const hidden = await makeType("Old Room", "1000");
    await setRoomTypeActive(hidden.id, false);

    const list = await listActiveRoomTypes();
    expect(list.map((t) => t.name)).toEqual(["Standard", "Suite"]);
    expect(await listActiveRoomTypes(1)).toEqual([expect.objectContaining({ id: std.id })]);
  });

  it("hides inactive types from the details page", async () => {
    const t = await makeType("Garden Room");
    expect(await getActiveRoomTypeBySlug("garden-room")).toMatchObject({ id: t.id });
    await setRoomTypeActive(t.id, false);
    expect(await getActiveRoomTypeBySlug("garden-room")).toBeNull();
    await setRoomTypeActive(t.id, true);
    expect(await getActiveRoomTypeBySlug("garden-room")).not.toBeNull();
  });

  it("rejects malformed slugs without querying", async () => {
    expect(await getActiveRoomTypeBySlug("../etc")).toBeNull();
    expect(await getActiveRoomTypeBySlug("")).toBeNull();
  });
});

describe("rooms (FR-ADM-03)", () => {
  it("creates rooms and rejects duplicate room numbers (case-insensitive)", async () => {
    const t = await makeType("Standard");
    const r = await createRoom(roomInput("101a", t.id));
    expect(r).toMatchObject({ ok: true, value: { roomNumber: "101A", roomType: { id: t.id, name: "Standard" } } });
    expect(await createRoom(roomInput("101A", t.id))).toMatchObject({ ok: false, field: "roomNumber" });
  });

  it("rejects a room for a room type that does not exist", async () => {
    expect(await createRoom(roomInput("101", "65f000000000000000000000"))).toMatchObject({
      ok: false,
      field: "roomTypeId",
    });
  });

  it("updates status and type; refuses taking another room's number", async () => {
    const a = await makeType("Standard");
    const b = await makeType("Deluxe");
    const r1 = await createRoom(roomInput("101", a.id));
    await createRoom(roomInput("102", a.id));
    if (!r1.ok) throw new Error("setup failed");

    const updated = await updateRoom(r1.value.id, roomInput("101", b.id, "maintenance", "1"));
    expect(updated).toMatchObject({ ok: true, value: { status: "maintenance", roomType: { id: b.id } } });
    expect(await updateRoom(r1.value.id, roomInput("102", a.id))).toMatchObject({ ok: false, field: "roomNumber" });
    expect((await getRoomById(r1.value.id))?.roomNumber).toBe("101");
  });

  it("starts every room with lockVersion 0 for booking transactions (§12.5)", async () => {
    const t = await makeType("Standard");
    const r = await createRoom(roomInput("101", t.id));
    if (!r.ok) throw new Error("setup failed");
    expect((await Room.findById(r.value.id).lean())?.lockVersion).toBe(0);
  });

  it("lists rooms in natural order and filters by type", async () => {
    const a = await makeType("Standard");
    const b = await makeType("Deluxe");
    for (const n of ["110", "102", "1001"]) await createRoom(roomInput(n, a.id));
    await createRoom(roomInput("201", b.id, "available", "2"));

    expect((await listRoomsForAdmin()).map((r) => r.roomNumber)).toEqual(["102", "110", "1001", "201"]);
    expect((await listRoomsForAdmin(b.id)).map((r) => r.roomNumber)).toEqual(["201"]);
  });

  it("counts total and available rooms per type for the admin table", async () => {
    const a = await makeType("Standard");
    await makeType("Empty Type");
    await createRoom(roomInput("101", a.id));
    await createRoom(roomInput("102", a.id, "maintenance"));
    await createRoom(roomInput("103", a.id, "inactive"));

    const rows = await listRoomTypesForAdmin();
    expect(rows.find((r) => r.name === "Standard")).toMatchObject({ totalRooms: 3, availableRooms: 1 });
    expect(rows.find((r) => r.name === "Empty Type")).toMatchObject({ totalRooms: 0, availableRooms: 0 });
  });
});
