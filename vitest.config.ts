import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["test/**/*.test.ts"],
    isolate: false,
    testTimeout: 30_000,
    maxConcurrency: 4,
  },
});
