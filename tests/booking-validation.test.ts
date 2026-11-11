import { describe, expect, it } from "vitest";
import {
  addDays,
  formatDate,
  hotelToday,
  isValidDateString,
  nightsBetween,
  parseDateString,
  toDateString,
} from "@/lib/dates";
import { REFERENCE_CODE_RE, generateReferenceCode } from "@/lib/reference-code";
import { createBookingSchema, staySearchSchema } from "@/validations/booking";

const TODAY = "2026-11-11";

describe("date helpers", () => {
  it("validates real calendar dates only", () => {
    expect(isValidDateString("2026-12-31")).toBe(true);
    expect(isValidDateString("2028-02-29")).toBe(true); // leap year
    expect(isValidDateString("2026-02-29")).toBe(false);
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("2026-1-5")).toBe(false);
    expect(isValidDateString("tomorrow")).toBe(false);
  });

  it("stores dates as UTC midnight and round-trips", () => {
    const d = parseDateString("2026-12-24");
    expect(d.toISOString()).toBe("2026-12-24T00:00:00.000Z");
    expect(toDateString(d)).toBe("2026-12-24");
  });

  it("counts nights across month and year boundaries", () => {
    expect(nightsBetween("2026-12-30", "2027-01-02")).toBe(3);
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });

  it("uses the hotel's date (Asia/Dhaka, UTC+6), not the server's", () => {
    // 20:00 UTC on 11 Nov is already 02:00 on 12 Nov in Dhaka.
    expect(hotelToday(new Date("2026-11-11T20:00:00Z"))).toBe("2026-11-12");
    expect(hotelToday(new Date("2026-11-11T17:59:00Z"))).toBe("2026-11-11");
  });

  it("formats dates without shifting the day", () => {
    expect(formatDate("2026-12-24")).toBe("Thu, 24 Dec 2026");
  });
});

describe("staySearchSchema (FR-AVAIL-02, FR-AVAIL-03)", () => {
  const schema = staySearchSchema(TODAY);
  const errors = (input: object) => {
    const r = schema.safeParse({ checkIn: "2026-12-01", checkOut: "2026-12-03", guests: "2", ...input });
    return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]));
  };

  it("accepts a valid stay and converts guests to a number", () => {
    expect(schema.parse({ checkIn: TODAY, checkOut: "2026-11-12", guests: "1" })).toEqual({
      checkIn: TODAY,
      checkOut: "2026-11-12",
      guests: 1,
    });
  });

  it.each([
    ["checkIn", { checkIn: "2026-11-10" }, /past/],
    ["checkIn", { checkIn: "2026-02-30" }, /valid date/],
    ["checkIn", { checkIn: "2027-12-01", checkOut: "2027-12-02" }, /365 days/],
    ["checkOut", { checkOut: "2026-12-01" }, /after check-in/], // same day
    ["checkOut", { checkOut: "2026-11-30" }, /after check-in/], // before
    ["checkOut", { checkOut: "2027-01-01" }, /30 nights/], // 31 nights
    ["guests", { guests: "0" }, /At least 1/],
    ["guests", { guests: "11" }, /At most 10/],
    ["guests", { guests: "two" }, /whole number/],
  ])("rejects invalid %s (%o)", (field, input, message) => {
    expect(errors(input)[field]).toMatch(message);
  });

  it("allows exactly 30 nights", () => {
    expect(errors({ checkOut: "2026-12-31" })).toEqual({});
  });
});

describe("createBookingSchema (FR-BOOK-10)", () => {
  const schema = createBookingSchema(TODAY);
  const base = { roomType: "deluxe-double-room", checkIn: "2026-12-01", checkOut: "2026-12-03", guests: "2" };

  it("trims the special request and defaults it to empty", () => {
    expect(schema.parse(base).specialRequest).toBe("");
    expect(schema.parse({ ...base, specialRequest: "  late arrival  " }).specialRequest).toBe("late arrival");
  });

  it("rejects a too-long special request and a bad slug", () => {
    expect(schema.safeParse({ ...base, specialRequest: "x".repeat(501) }).success).toBe(false);
    expect(schema.safeParse({ ...base, roomType: "../admin" }).success).toBe(false);
  });

  it("never accepts a price from the client", () => {
    const parsed = schema.parse({ ...base, totalPrice: 1, pricePerNight: 1 });
    expect(parsed).not.toHaveProperty("totalPrice");
    expect(parsed).not.toHaveProperty("pricePerNight");
  });
});

describe("reference codes (FR-BOOK-06)", () => {
  it("have the SE-XXXXXX format without confusing characters", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateReferenceCode();
      expect(code).toMatch(REFERENCE_CODE_RE);
      expect(code.slice(3)).not.toMatch(/[01IOL]/);
    }
  });
});
