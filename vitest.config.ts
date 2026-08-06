import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["test/**/*.test.ts"],
    isolate: false,
    testTimeout: 30_000,
    maxConcurrency: 4,
    coverage: {
      provider: "v8",
      reporter: ["lcov"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts", "dist/src/**/*.js"],
    },
  },
});
