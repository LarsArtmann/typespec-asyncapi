import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/**/*.d.ts"],
      include: ["src/**/*.ts"],
      provider: "istanbul",
      reporter: ["text", "json", "lcov"],
    },
    environment: "node",
    globals: true,
    include: ["test/**/*.test.ts"],
    isolate: false,
    testTimeout: 30_000,
    maxConcurrency: 4,
  },
});
