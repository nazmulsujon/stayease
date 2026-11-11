import mongoose, { type ClientSession } from "mongoose";

/**
 * Framework-independent MongoDB connection logic.
 * Kept free of `server-only` / env imports so it can also be used by
 * scripts (seeding) and automated tests.
 *
 * In development, Next.js hot reloading re-executes modules, which would
 * open a new connection on every change. The connection promise is therefore
 * cached on `globalThis` so only one connection pool exists per process.
 */
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  _mongooseCache?: MongooseCache;
};

const cache: MongooseCache = (globalForMongoose._mongooseCache ??= {
  conn: null,
  promise: null,
});

export async function connectToDatabase(
  uri: string,
  dbName: string,
): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    cache.promise = mongoose.connect(uri, {
      dbName,
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // Allow a later call to retry instead of reusing a failed promise.
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cache.conn) {
    await mongoose.disconnect();
  }
  cache.conn = null;
  cache.promise = null;
}

/**
 * Runs `fn` inside a MongoDB multi-document transaction.
 *
 * `session.withTransaction` automatically retries the whole callback on
 * `TransientTransactionError` (e.g. a write conflict caused by two concurrent
 * bookings touching the same room) and retries the commit on
 * `UnknownTransactionCommitResult`. This is the foundation of the
 * double-booking protection described in docs/PROJECT_PLAN.md §12.5.
 *
 * Requires a replica set (MongoDB Atlas, or a local replica set).
 * The callback may run more than once, so it must not have side effects
 * outside the database.
 */
export async function withTransaction<T>(
  fn: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(
      async () => {
        result = await fn(session);
      },
      {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
        readPreference: "primary",
      },
    );
    return result;
  } finally {
    await session.endSession();
  }
}
