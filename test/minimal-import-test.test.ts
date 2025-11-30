import { describe, it } from "bun:test";
import { createTestHost, createTestLibrary, createTestWrapper } from "@typespec/compiler/testing";
import { findTestPackageRoot } from "@typespec/compiler/testing";

describe("MINIMAL: Import Resolution Test", () => {
  it("should test library creation in isolation", async () => {
    const packageRoot = await findTestPackageRoot(import.meta.url);
    
    console.log("=== Minimal Library Test ===");
    console.log("Package root:", packageRoot);
    
    // Create library exactly like @typespec/http
    const asyncapiLib = createTestLibrary({
      name: "@lars-artmann/typespec-asyncapi",
      packageRoot,
      typespecFileFolder: "lib",
      jsFileFolder: "dist",
    });
    
    console.log("Library created:", asyncapiLib.name);
    
    // Create host with just our library (MUST await)
    const host = await createTestHost({
      libraries: [asyncapiLib],
    });
    
    console.log("Host created, checking libraries...");
    
    // Create test wrapper and use proper compilation API
    const runner = createTestWrapper(host, {
      autoUsings: ["TypeSpec.AsyncAPI"],
    });
    
    // Try a simple compilation using correct test host API
    const testCode = `
import "@lars-artmann/typespec-asyncapi";

@server("https://api.test.com")
namespace TestApi {
}
`;
    
    try {
      const [result, diagnostics] = await runner.compileAndDiagnose(testCode, {
        emit: ["@lars-artmann/typespec-asyncapi"],
      });
      
      console.log("Compilation result diagnostics:", diagnostics.length);
      if (diagnostics.length > 0) {
        console.log("First diagnostic:", diagnostics[0]);
      }
    } catch (error) {
      console.log("Compilation error:", error.message);
    }
  });
});