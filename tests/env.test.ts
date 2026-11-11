import { afterEach, describe, expect, it, vi } from "vitest";

const validEnv = {
  MONGODB_URI: "mongodb://127.0.0.1:27017/?replicaSet=rs0",
  JWT_SECRET: "x".repeat(32),
};

async function loadGetEnv() {
  vi.resetModules(); // getEnv caches its result per module instance
  return (await import("@/lib/env")).getEnv;
}

describe("environment validation", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts a valid configuration and applies defaults", async () => {
    vi.stubEnv("MONGODB_URI", validEnv.MONGODB_URI);
    vi.stubEnv("JWT_SECRET", validEnv.JWT_SECRET);
    vi.stubEnv("MONGODB_DB_NAME", "");
    vi.stubEnv("JWT_EXPIRES_IN", "");
    delete process.env.MONGODB_DB_NAME;
    delete process.env.JWT_EXPIRES_IN;

    const env = (await loadGetEnv())();
    expect(env.MONGODB_DB_NAME).toBe("stayease");
    expect(env.JWT_EXPIRES_IN).toBe("7d");
  });

  it("rejects a missing MONGODB_URI", async () => {
    vi.stubEnv("MONGODB_URI", "");
    vi.stubEnv("JWT_SECRET", validEnv.JWT_SECRET);
    expect(await loadGetEnv()).toThrow(/MONGODB_URI/);
  });

  it("rejects a non-MongoDB connection string", async () => {
    vi.stubEnv("MONGODB_URI", "postgres://localhost/db");
    vi.stubEnv("JWT_SECRET", validEnv.JWT_SECRET);
    expect(await loadGetEnv()).toThrow(/mongodb:\/\//);
  });

  it("rejects a JWT_SECRET shorter than 32 characters", async () => {
    vi.stubEnv("MONGODB_URI", validEnv.MONGODB_URI);
    vi.stubEnv("JWT_SECRET", "too-short");
    expect(await loadGetEnv()).toThrow(/JWT_SECRET/);
  });
});
