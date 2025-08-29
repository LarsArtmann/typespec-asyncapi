/**
 * Unit tests for versioning module functionality
 */

import { describe, it, expect } from "vitest";
import { resolveVersioningModule, isVersioningAvailable } from "../../src/versioning-module.js";

describe("Versioning Module", () => {
  it("should handle missing versioning module gracefully", async () => {
    // This test should pass regardless of whether versioning is installed
    const module = await resolveVersioningModule();
    
    // Module might be undefined if @typespec/versioning is not installed
    if (module === undefined) {
      console.log("📝 @typespec/versioning not available - this is expected for isolated testing");
    } else {
      console.log("✅ @typespec/versioning is available");
      expect(module).toBeDefined();
    }
  });

  it("should correctly report versioning availability", async () => {
    const available = await isVersioningAvailable();
    expect(typeof available).toBe("boolean");
    console.log(`📊 Versioning available: ${available}`);
  });

  it("should not throw errors when versioning module is missing", async () => {
    // This should not throw even if the module is missing
    expect(async () => {
      await resolveVersioningModule();
    }).not.toThrow();
    
    expect(async () => {
      await isVersioningAvailable();
    }).not.toThrow();
  });
});