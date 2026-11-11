import { connection } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";

/**
 * GET /api/health
 * Verifies that the app is running and can reach MongoDB.
 * Also reports whether the database supports transactions
 * (required for double-booking protection).
 */
export async function GET() {
  await connection(); // always evaluate at request time

  try {
    await dbConnect();
    const admin = mongoose.connection.db!.admin();
    await admin.ping();
    const hello = (await admin.command({ hello: 1 })) as {
      setName?: string;
      msg?: string;
    };
    const transactionsSupported =
      Boolean(hello.setName) || hello.msg === "isdbgrid";

    return Response.json({
      status: "ok",
      database: "connected",
      transactionsSupported,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[health] database check failed:", error);
    return Response.json(
      {
        status: "error",
        database: "unreachable",
        message:
          error instanceof Error && error.message.startsWith("Invalid environment")
            ? "Server environment is not configured."
            : "Could not connect to the database.",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
