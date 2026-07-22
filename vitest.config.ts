import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/**/*.d.ts", "dist/**/*.d.ts"],
      include: ["src/**/*.ts", "dist/src/**/*.js"],
      provider: "v8",
      reporter: ["text", "json", "lcov"],
      // V8 captures coverage for dynamically-imported dist/*.js (loaded by TypeSpec compiler).
      // Sourcemaps remap dist/src/*.js back to src/*.ts for accurate per-file reporting.
    },
    environment: "node",
    globals: true,
    include: ["test/**/*.test.ts"],
    isolate: false,
    testTimeout: 30_000,
    maxConcurrency: 4,
  },
});
