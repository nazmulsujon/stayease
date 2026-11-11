import "server-only";
import { connectToDatabase } from "./db-core";
import { getEnv } from "./env";

/**
 * Returns a shared Mongoose connection for server code
 * (Route Handlers, Server Actions, Server Components).
 */
export async function dbConnect() {
  const { MONGODB_URI, MONGODB_DB_NAME } = getEnv();
  return connectToDatabase(MONGODB_URI, MONGODB_DB_NAME);
}

export { withTransaction } from "./db-core";
