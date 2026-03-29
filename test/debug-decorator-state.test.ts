import { describe, it, expect } from "bun:test";
import { compileAsyncAPI } from "./utils/emitter-test-helpers";

describe("Decorator State Consolidation", () => {
  it("should properly compile TypeSpec with AsyncAPI decorators", async () => {
    const source = `
namespace TestService {
  
model UserEvent {
  userId: string;
  action: string;
}

@channel("user/events")
@publish
op publishUserEvent(event: UserEvent): void;
}`;

    const result = await compileAsyncAPI(source, {
      "output-file": "test-state",
    });

    console.log("🔍 Testing decorator state consolidation:");
    console.log("  📋 Has program:", !!result.program);
    console.log("  📋 Diagnostics count:", result.diagnostics.length);
    
    // Check for compilation errors (excluding expected AsyncAPI validation)
    const errors = result.diagnostics.filter(d => d.severity === "error");
    console.log("  📋 Error count:", errors.length);
    
    if (errors.length > 0) {
      console.log("  📋 Errors:");
      for (const error of errors) {
        console.log(`    - ${error.code}: ${error.message}`);
      }
    }

    // The test passes if the source compiles without errors
    // Note: The emitter generates asyncapi.yaml which may not be captured by test helpers
    expect(result.program).toBeDefined();
    expect(errors.length).toBe(0);
  }, 15000);
});
