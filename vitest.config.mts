import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside the Next.js server bundle; tests run
      // server code directly in Node, so replace it with an empty module.
      "server-only": fileURLToPath(
        new URL("./tests/stubs/empty.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // In-memory MongoDB replica sets take a few seconds to start.
    testTimeout: 60_000,
    hookTimeout: 120_000,
    // Database tests share one Mongoose connection; run files one by one.
    fileParallelism: false,
  },
});
