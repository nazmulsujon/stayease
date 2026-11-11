import { MongoMemoryReplSet } from "mongodb-memory-server";
import {
  connectToDatabase,
  disconnectFromDatabase,
} from "@/lib/db-core";

/**
 * Starts a throw-away, single-node MongoDB *replica set* in memory.
 * A replica set is required because booking logic uses transactions.
 */
export async function startTestDatabase() {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });
  const uri = replSet.getUri();
  await connectToDatabase(uri, "stayease_test");

  return {
    uri,
    async stop() {
      await disconnectFromDatabase();
      await replSet.stop();
    },
  };
}
