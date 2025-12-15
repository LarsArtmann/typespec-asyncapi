import { describe, it, expect } from "bun:test";
import { createTestHost, createTestLibrary, createTestWrapper } from "@typespec/compiler/testing";
import { findTestPackageRoot } from "@typespec/compiler/testing";

describe("MINIMAL: Import Resolution Test", () => {
  it("should test library creation in isolation", async () => {
    const packageRoot = await findTestPackageRoot(import.meta.url);

    console.log("=== Minimal Library Test ===");
    console.log("Package root:", packageRoot);

    // Create library exactly like @typespec/http
    // CRITICAL: jsFileFolder must point to "dist/src" where tsp-index.js is located
    const asyncapiLib = createTestLibrary({
      name: "@lars-artmann/typespec-asyncapi",
      packageRoot,
      typespecFileFolder: "lib",
      jsFileFolder: "dist/src", // Fixed: was "dist", should be "dist/src"
    });

    console.log("Library created:", asyncapiLib.name);

    // Create host with just our library (MUST await)
    const host = await createTestHost({
      libraries: [asyncapiLib],
    });

    console.log("Host created, checking libraries...");

    // Create test wrapper WITHOUT autoUsings since we import manually
    const runner = createTestWrapper(host, {});

    // Try a simple compilation - import the library and use decorators
    const testCode = `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@server({ url: "https://api.test.com", protocol: "https" })
namespace TestApi {
  model TestEvent {
    id: string;
  }
  
  @channel("/test/events")
  @publish
  op publishEvent(): TestEvent;
}
`;

    try {
      const [result, diagnostics] = await runner.compileAndDiagnose(testCode, {
        emit: ["@lars-artmann/typespec-asyncapi"],
      });

      console.log("Compilation result diagnostics:", diagnostics.length);
      if (diagnostics.length > 0) {
        for (const diag of diagnostics) {
          console.log(`  ${diag.severity}: ${diag.code} - ${diag.message}`);
        }
      }

      // Check that we don't have library-invalid errors
      const libraryErrors = diagnostics.filter((d) => d.code === "library-invalid");
      const unknownDecoratorErrors = diagnostics.filter(
        (d) => d.code === "invalid-ref" && d.message?.includes("Unknown decorator"),
      );

      expect(libraryErrors.length).toBe(0);
      expect(unknownDecoratorErrors.length).toBe(0);
      console.log("✅ Library loaded successfully, no decorator resolution errors!");
    } catch (error: any) {
      console.log("Compilation error:", error.message);
      throw error;
    }
  });
});
