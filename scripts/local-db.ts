/**
 * Starts a local single-node MongoDB REPLICA SET for development,
 * without installing MongoDB or Docker. Data is kept in `.mongo-data/`
 * so it survives restarts.
 *
 * Run with: npm run db:local   (stop with Ctrl+C)
 * Then set in .env.local:
 *   MONGODB_URI=mongodb://127.0.0.1:27018/?replicaSet=rs0&directConnection=true
 *
 * MongoDB Atlas is recommended for deployment; this is a local convenience.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { MongoMemoryReplSet } from "mongodb-memory-server";

const PORT = Number(process.env.LOCAL_DB_PORT ?? 27018);
const dbPath = path.resolve(process.cwd(), ".mongo-data");

async function main() {
  mkdirSync(dbPath, { recursive: true });

  const replSet = await MongoMemoryReplSet.create({
    replSet: { name: "rs0", count: 1, storageEngine: "wiredTiger" },
    instanceOpts: [{ port: PORT, dbPath, storageEngine: "wiredTiger" }],
  });

  const uri = `mongodb://127.0.0.1:${PORT}/?replicaSet=rs0&directConnection=true`;
  console.log("✔ Local MongoDB replica set is running");
  console.log(`  URI:  ${uri}`);
  console.log(`  Data: ${dbPath}`);
  console.log("  Press Ctrl+C to stop.");

  const shutdown = async () => {
    console.log("\nStopping local MongoDB…");
    await replSet.stop({ doCleanup: false, force: false });
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("✖ Could not start local MongoDB:", error);
  process.exit(1);
});
