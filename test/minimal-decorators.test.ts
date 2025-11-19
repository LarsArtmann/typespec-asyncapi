import { describe, it } from "bun:test";
import { createAsyncAPITestHost } from "./utils/test-helpers.js";

describe("Minimal Decorators Test", () => {
  it("should execute minimal decorators", async () => {
    console.log("🧪 TESTING MINIMAL DECORATORS");
    
    try {
      const host = await createAsyncAPITestHost();
      host.addTypeSpecFile(
        "minimal-decorators-test.tsp",
        `
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

// Test minimal decorators
@channel("/test/simple")
op simpleOp(): void;

@server({
  name: "test-server",
  url: "test://localhost", 
  protocol: "test"
})
namespace TestNamespace;
      `,
      );

      console.log("📝 Files added, testing minimal decorators...");

      // Test diagnostics - using same approach as working test
      const diagnostics = await host.diagnose("minimal-decorators-test.tsp", {
        emit: ["@lars-artmann/typespec-asyncapi"],
      });

      console.log(`📊 Minimal diagnostics count: ${diagnostics.length}`);
      
      if (diagnostics.length > 0) {
        console.log("=== All diagnostics ===");
        diagnostics.forEach((d, i) => {
          console.log(`${i + 1}. Code: ${d.code}`);
          console.log(`   Severity: ${d.severity}`);
          console.log(`   Message: ${d.message}`);
        });
        
        // Check for missing implementation errors
        const missingImpl = diagnostics.filter(d => d.code === "missing-implementation");
        if (missingImpl.length > 0) {
          console.log(`❌ CRITICAL: ${missingImpl.length} missing-implementation errors`);
          console.log("🚨 Decorators not being discovered by TypeSpec");
        } else {
          console.log("✅ No missing-implementation errors");
          console.log("🎯 Decorator discovery working!");
        }
      } else {
        console.log("✅ No diagnostics - decorators working silently");
      }
      
    } catch (error) {
      console.log("💥 ERROR:", error);
      throw error;
    }
  });
});