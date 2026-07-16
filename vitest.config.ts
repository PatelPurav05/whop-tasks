import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    setupFiles: ["./tests/load-env.ts"],
    testTimeout: 30_000,
  },
});
