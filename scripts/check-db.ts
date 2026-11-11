/**
 * Checks that the MongoDB in `.env.local` is reachable and supports
 * transactions. Run with: npm run db:check
 */
import mongoose from "mongoose";
import {
  connectToDatabase,
  disconnectFromDatabase,
} from "../src/lib/db-core";

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || "stayease";

  if (!uri) {
    console.error("✖ MONGODB_URI is not set. Copy .env.example to .env.local first.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB…");
  await connectToDatabase(uri, dbName);
  const admin = mongoose.connection.db!.admin();
  await admin.ping();
  const hello = (await admin.command({ hello: 1 })) as {
    setName?: string;
    msg?: string;
  };
  const { version } = await admin.serverInfo();

  console.log(`✔ Connected (MongoDB ${version}, database "${dbName}")`);
  if (hello.setName || hello.msg === "isdbgrid") {
    console.log("✔ Replica set detected: transactions are supported.");
  } else {
    console.error(
      "✖ Standalone server: transactions are NOT supported.\n" +
        "  Use MongoDB Atlas or run a local replica set.",
    );
    process.exitCode = 1;
  }

  await disconnectFromDatabase();
}

main().catch(async (error) => {
  console.error("✖ Database check failed:", error instanceof Error ? error.message : error);
  await disconnectFromDatabase();
  process.exit(1);
});
