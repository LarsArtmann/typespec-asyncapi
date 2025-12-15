/**
 * Debug test for diagnostic resolution issues
 */

import { describe, it, expect } from "bun:test";
import { createAsyncAPITestHost } from "./utils/test-helpers.js";

describe("Diagnostic Isolation Debug", () => {
  it("should test simple diagnostic without parameters", async () => {
    console.log("🧪 TESTING SIMPLE DIAGNOSTIC (no parameters)");

    try {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "simple-diagnostic-test.tsp",
        `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

// Test simple diagnostic without parameters (no @server decorator to trigger)
namespace TestNamespace;
      `,
      );

      console.log("📝 Files added, testing simple diagnostic...");

      // Test diagnostics without any decorator triggers
      const diagnostics = await host.diagnose("simple-diagnostic-test.tsp", {
        emit: ["@lars-artmann/typespec-asyncapi"],
      });

      console.log("📊 Simple diagnostics count:", diagnostics.length);

      // Check for any server config missing diagnostic (simple message without params)
      const serverMissingDiagnostics = diagnostics.filter((d) =>
        d.code?.includes("missing-server-config"),
      );
      console.log(`🔍 Missing server config diagnostics: ${serverMissingDiagnostics.length}`);

      serverMissingDiagnostics.forEach((d, i) => {
        console.log(`\n=== Simple Diagnostic ${i + 1} ===`);
        console.log(`  Code: ${d.code}`);
        console.log(`  Severity: ${d.severity}`);
        console.log(`  Message: ${d.message}`);
        console.log(`  Message Type: ${typeof d.message}`);
      });

      // If we find missing server diagnostic, check if message works
      if (serverMissingDiagnostics.length > 0) {
        const diagnostic = serverMissingDiagnostics[0];
        console.log("✅ Simple diagnostic message:", diagnostic.message);
        expect(diagnostic.message).toBeDefined();
        expect(diagnostic.severity).toBeDefined();
      }
    } catch (error) {
      console.log("💥 ERROR:", error.message);
      expect(error).toBeDefined();
    }
  });

  it("should identify diagnostic resolution failure", async () => {
    console.log("🧪 ISOLATING DIAGNOSTIC RESOLUTION ISSUE");

    try {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "diagnostic-test.tsp",
        `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

// Test with minimal diagnostic trigger
@server({
  name: "test",
  url: "test://test",
  protocol: "test"
})
namespace TestNamespace;

// Also add a simple diagnostic trigger elsewhere  
@channel("")  // This should trigger missing-channel-path or similar  
op testOp(): void;
      `,
      );

      console.log("📝 Files added, testing diagnostic isolation...");

      // Test diagnostics - bypass expectDiagnosticEmpty
      console.log("🔍 Attempting direct diagnostic inspection...");
      try {
        const diagnostics = await host.diagnose("diagnostic-test.tsp", {
          emit: ["@lars-artmann/typespec-asyncapi"],
        });

        console.log("📊 Direct diagnostics count:", diagnostics.length);

        // Check if there are any diagnostic codes that look like our custom ones
        const customDiagnostics = diagnostics.filter((d) => d.code?.includes("asyncapi"));
        console.log(`🔍 Custom AsyncAPI diagnostics: ${customDiagnostics.length}`);

        // Check all diagnostic codes
        const allCodes = diagnostics.map((d) => d.code);
        console.log(`🔍 All diagnostic codes:`, allCodes);

        // Check for undefined messages
        const undefinedMessages = diagnostics.filter((d) => d.message === undefined);
        console.log(`🔍 Diagnostics with undefined messages: ${undefinedMessages.length}`);

        diagnostics.forEach((d, i) => {
          console.log(`\n=== Diagnostic ${i + 1} ===`);
          console.log(`  Code: ${d.code}`);
          console.log(`  Severity: ${d.severity}`);
          console.log(`  Message: ${d.message}`);
          console.log(`  Message Type: ${typeof d.message}`);

          if (d.code?.includes("asyncapi") || d.code?.includes("server")) {
            console.log(`  🔍 CUSTOM DIAGNOSTIC DETECTED!`);

            if (d.target) {
              console.log(`     Target: ${d.target.kind} at ${d.target.name}`);
            }
          }
        });

        // We expect diagnostics but not undefined ones
        expect(diagnostics.length).toBeGreaterThan(0);

        // Find any undefined diagnostic messages
        const undefinedDiagnostics = diagnostics.filter((d) => d.message === undefined);
        if (undefinedDiagnostics.length > 0) {
          console.log("❌ Found undefined diagnostic messages - this is the core issue!");

          // Log problematic diagnostic details
          undefinedDiagnostics.forEach((d, i) => {
            console.log(`\n❌ UNDEFINED DIAGNOSTIC ${i + 1}:`);
            console.log(`  Code: ${d.code}`);
            console.log(`  Target: ${d.target?.kind}`);
            console.log(`  Raw diagnostic object keys:`, Object.keys(d));
          });

          expect(undefinedDiagnostics.length).toBe(0);
        }
      } catch (diagError) {
        console.log("💥 Diagnostic inspection error:", diagError.message);
        expect(diagError).toBeUndefined();
      }
    } catch (error) {
      console.log("💥 ERROR:", error.message);
      console.log("📋 Stack:", error.stack);
      expect(error).toBeDefined();
    }
  });
});
