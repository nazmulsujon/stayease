import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connectToDatabase, withTransaction } from "@/lib/db-core";
import { startTestDatabase } from "./helpers/mongo";

/**
 * Phase 1 infrastructure tests:
 *  - the connection utility connects and is reused (no duplicate pools)
 *  - transactions commit and roll back correctly
 *  - concurrent transactions writing the same document cause a write
 *    conflict that is retried, so only one "wins" per conflicting check.
 *    This is the mechanism that Phase 4 uses for room-level locking
 *    (docs/PROJECT_PLAN.md §12.5).
 */

let db: Awaited<ReturnType<typeof startTestDatabase>>;

const Counter = mongoose.model(
  "TestCounter",
  new mongoose.Schema({ key: String, value: Number }),
);
const Claim = mongoose.model(
  "TestClaim",
  new mongoose.Schema({ resource: String, owner: String }),
);

beforeAll(async () => {
  db = await startTestDatabase();
  // Collections must exist before use inside a transaction.
  await Counter.createCollection();
  await Claim.createCollection();
});

afterAll(async () => {
  await db?.stop();
});

describe("database connection", () => {
  it("connects to MongoDB", async () => {
    expect(mongoose.connection.readyState).toBe(1);
    const ping = await mongoose.connection.db!.admin().ping();
    expect(ping.ok).toBe(1);
  });

  it("reuses the cached connection on repeated calls", async () => {
    const first = await connectToDatabase(db.uri, "stayease_test");
    const second = await connectToDatabase(db.uri, "stayease_test");
    expect(second).toBe(first);
    expect(mongoose.connections.filter((c) => c.readyState === 1)).toHaveLength(1);
  });

  it("runs against a replica set (transactions supported)", async () => {
    const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
    expect(hello.setName).toBeTruthy();
  });
});

describe("withTransaction", () => {
  it("commits all writes when the callback succeeds", async () => {
    await withTransaction(async (session) => {
      await Counter.create([{ key: "commit", value: 1 }], { session });
      await Counter.create([{ key: "commit", value: 2 }], { session });
    });
    expect(await Counter.countDocuments({ key: "commit" })).toBe(2);
  });

  it("rolls back every write when the callback throws", async () => {
    await expect(
      withTransaction(async (session) => {
        await Counter.create([{ key: "rollback", value: 1 }], { session });
        throw new Error("simulated failure");
      }),
    ).rejects.toThrow("simulated failure");
    expect(await Counter.countDocuments({ key: "rollback" })).toBe(0);
  });

  it("serialises concurrent check-then-insert via a write conflict on a shared lock document", async () => {
    await Counter.create({ key: "lock:resource-1", value: 0 });

    // Each attempt: (1) touch the lock document, (2) check for an existing
    // claim, (3) insert a claim only if none exists. Without the lock write,
    // both transactions could pass step 2 at the same time.
    const attempt = (owner: string) =>
      withTransaction(async (session) => {
        await Counter.updateOne(
          { key: "lock:resource-1" },
          { $inc: { value: 1 } },
          { session },
        );
        const existing = await Claim.findOne({ resource: "resource-1" }).session(session);
        if (existing) return "rejected" as const;
        await Claim.create([{ resource: "resource-1", owner }], { session });
        return "claimed" as const;
      });

    const results = await Promise.all(
      Array.from({ length: 8 }, (_, i) => attempt(`owner-${i}`)),
    );

    expect(results.filter((r) => r === "claimed")).toHaveLength(1);
    expect(results.filter((r) => r === "rejected")).toHaveLength(7);
    expect(await Claim.countDocuments({ resource: "resource-1" })).toBe(1);
  });
});
