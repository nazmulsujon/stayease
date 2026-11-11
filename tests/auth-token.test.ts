import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "@/lib/auth/token";

const SECRET = "test-secret-".padEnd(48, "x");

describe("session token (FR-AUTH-05)", () => {
  it("round-trips user id and role", async () => {
    const { token, expiresAt } = await signSessionToken(
      { userId: "65f000000000000000000001", role: "admin" },
      SECRET,
      "7d",
    );
    const payload = await verifySessionToken(token, SECRET);
    expect(payload).toEqual({
      userId: "65f000000000000000000001",
      role: "admin",
      expiresAt,
    });
    const sevenDays = 7 * 24 * 3600;
    expect(expiresAt - Math.floor(Date.now() / 1000)).toBeGreaterThan(sevenDays - 60);
  });

  it("rejects a token signed with another secret", async () => {
    const { token } = await signSessionToken({ userId: "u1", role: "customer" }, SECRET, "1h");
    expect(await verifySessionToken(token, "another-secret-".padEnd(48, "y"))).toBeNull();
  });

  it("rejects a tampered token (role changed to admin)", async () => {
    const { token } = await signSessionToken({ userId: "u1", role: "customer" }, SECRET, "1h");
    const [header, , signature] = token.split(".");
    const forgedPayload = Buffer.from(
      JSON.stringify({ role: "admin", sub: "u1", iss: "stayease", exp: 9999999999 }),
    ).toString("base64url");
    expect(await verifySessionToken(`${header}.${forgedPayload}.${signature}`, SECRET)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const expired = await new SignJWT({ role: "customer" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setIssuer("stayease")
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(SECRET));
    expect(await verifySessionToken(expired, SECRET)).toBeNull();
  });

  it("rejects an unknown role", async () => {
    const token = await new SignJWT({ role: "superuser" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u1")
      .setIssuer("stayease")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(SECRET));
    expect(await verifySessionToken(token, SECRET)).toBeNull();
  });

  it("returns null for missing token or secret", async () => {
    expect(await verifySessionToken(undefined, SECRET)).toBeNull();
    expect(await verifySessionToken("abc", undefined)).toBeNull();
    expect(await verifySessionToken("garbage", SECRET)).toBeNull();
  });
});
