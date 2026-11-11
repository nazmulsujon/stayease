import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { User } from "@/models/user";
import {
  authenticateUser,
  findActiveSessionUser,
  registerUser,
} from "@/services/auth.service";
import { registerSchema } from "@/validations/auth";
import { startTestDatabase } from "./helpers/mongo";

let db: Awaited<ReturnType<typeof startTestDatabase>>;

beforeAll(async () => {
  db = await startTestDatabase();
  await User.init(); // build the unique email index
});
afterAll(async () => {
  await db?.stop();
});
beforeEach(async () => {
  await User.deleteMany({});
});

const input = (overrides: Partial<Record<string, string>> = {}) =>
  registerSchema.parse({
    name: "Ayesha Rahman",
    email: "ayesha@example.com",
    phone: "01712345678",
    password: "secret123",
    confirmPassword: "secret123",
    ...overrides,
  });

describe("registerUser", () => {
  it("creates a customer with a bcrypt-hashed password (FR-AUTH-01, FR-AUTH-03)", async () => {
    const result = await registerUser(input());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user).toMatchObject({ name: "Ayesha Rahman", role: "customer" });
    expect(result.user).not.toHaveProperty("passwordHash");

    const stored = await User.findById(result.user.id).select("+passwordHash").lean();
    expect(stored!.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(stored!.passwordHash).not.toContain("secret123");
  });

  it("never returns the password hash in normal queries", async () => {
    await registerUser(input());
    const user = await User.findOne({ email: "ayesha@example.com" }).lean();
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("rejects a duplicate email, case-insensitively (FR-AUTH-02)", async () => {
    await registerUser(input());
    const second = await registerUser(input({ email: "AYESHA@example.com" }));
    expect(second).toEqual({ ok: false, reason: "email_taken" });
    expect(await User.countDocuments()).toBe(1);
  });

  it("handles two simultaneous registrations with the same email", async () => {
    const results = await Promise.all([registerUser(input()), registerUser(input())]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await User.countDocuments()).toBe(1);
  });
});

describe("authenticateUser", () => {
  beforeEach(async () => {
    await registerUser(input());
  });

  it("logs in with correct credentials (FR-AUTH-04)", async () => {
    const result = await authenticateUser({ email: "ayesha@example.com", password: "secret123" });
    expect(result.ok).toBe(true);
  });

  it("returns the same error for wrong password and unknown email", async () => {
    const wrong = await authenticateUser({ email: "ayesha@example.com", password: "nope12345" });
    const unknown = await authenticateUser({ email: "nobody@example.com", password: "secret123" });
    expect(wrong).toEqual({ ok: false, reason: "invalid_credentials" });
    expect(unknown).toEqual({ ok: false, reason: "invalid_credentials" });
  });

  it("refuses blocked users (FR-AUTH-08)", async () => {
    await User.updateOne({ email: "ayesha@example.com" }, { isBlocked: true });
    const result = await authenticateUser({ email: "ayesha@example.com", password: "secret123" });
    expect(result).toEqual({ ok: false, reason: "blocked" });
  });

  it("does not reveal blocked status to someone with the wrong password", async () => {
    await User.updateOne({ email: "ayesha@example.com" }, { isBlocked: true });
    const result = await authenticateUser({ email: "ayesha@example.com", password: "nope12345" });
    expect(result).toEqual({ ok: false, reason: "invalid_credentials" });
  });
});

describe("findActiveSessionUser (DAL lookup)", () => {
  it("returns the user for a valid session", async () => {
    const reg = await registerUser(input());
    if (!reg.ok) throw new Error("setup failed");
    expect(await findActiveSessionUser(reg.user.id)).toEqual(reg.user);
  });

  it("ends the session immediately when the user is blocked", async () => {
    const reg = await registerUser(input());
    if (!reg.ok) throw new Error("setup failed");
    await User.updateOne({ _id: reg.user.id }, { isBlocked: true });
    expect(await findActiveSessionUser(reg.user.id)).toBeNull();
  });

  it("uses the role from the database, not from the token", async () => {
    const reg = await registerUser(input());
    if (!reg.ok) throw new Error("setup failed");
    await User.updateOne({ _id: reg.user.id }, { role: "admin" });
    expect((await findActiveSessionUser(reg.user.id))?.role).toBe("admin");
  });

  it("returns null for unknown or malformed ids", async () => {
    expect(await findActiveSessionUser("65f000000000000000000000")).toBeNull();
    expect(await findActiveSessionUser("not-an-id")).toBeNull();
  });
});
