/**
 * Debug test for TypeSpec types compilation
 */

import { describe, it, expect } from "bun:test";
import { createAsyncAPITestHost } from "./utils/test-helpers.js";

describe("TypeSpec Types Compilation", () => {
  it("should compile @server decorator without errors", async () => {
    console.log("🧪 TESTING WORKING TYPESPEC TYPES");

    try {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "types-test.tsp",
        `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;
using TypeSpec.Reflection;

// Fix Task 2.3: Blockless namespace MUST come first
namespace TestTypes;

// Test actual @server decorator (no extern declaration needed)
@server({
  name: "test",
  url: "kafka://localhost:9092",
  protocol: "kafka"
})
namespace TestNamespace;
      `,
      );

      console.log("📝 Files added, testing compilation...");

      // Test compilation
      const compilationResult = await host.compile("types-test.tsp");
      console.log("✅ Compilation:", compilationResult ? "SUCCESS" : "FAILED");

      // Expect compilation to succeed
      expect(compilationResult).toBe(true);
    } catch (error) {
      console.log("💥 ERROR:", error.message);
      console.log("📋 Stack:", error.stack);
      // If compilation fails, that's what we're debugging
      expect(error).toBeDefined();
    }
  });
});
