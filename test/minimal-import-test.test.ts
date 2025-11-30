import { describe, it } from "bun:test";
import { createTestHost, createTestLibrary } from "@typespec/compiler/testing";
import { findTestPackageRoot } from "@typespec/compiler/testing";
import { join } from "path";

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
    
    // Create host with just our library
    const host = createTestHost({
      libraries: [asyncapiLib],
    });
    
    console.log("Host created with libraries:", Object.keys(host.libraries));
    
    // Try a simple compilation
    const testCode = `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@server("https://api.test.com")
namespace TestApi {
}
`;
    
    try {
      const result = await host.compile(testCode);
      console.log("Compilation result diagnostics:", result.diagnostics.length);
      if (result.diagnostics.length > 0) {
        console.log("First diagnostic:", result.diagnostics[0]);
      }
    } catch (error) {
      console.log("Compilation error:", error.message);
    }
  });
});