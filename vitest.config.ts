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
    include: ["test/**/*.test.ts"],
    isolate: false,
  },
});
