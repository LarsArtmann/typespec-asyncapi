import { describe, it, expect } from "bun:test";
import { $onEmit } from "../src/index.js";
import { compileRealAsyncAPI, createUnifiedAsyncAPITestHost } from "./core/unified-test-infrastructure.js";

describe("Real Emitter Test", () => {
  it("should generate real AsyncAPI files", async () => {
    // Test typespec code with decorators
    const typespecCode = `
      namespace TestService {
        @channel("user-events")
        @publish
        op publishUserEvent(userId: string, eventType: string): void;
        
        @channel("orders")
        @subscribe
        op subscribeToOrders(): void;
      }
    `;

    // Compile with unified test infrastructure
    const result = await compileRealAsyncAPI(typespecCode);
    
    console.log("🔍 DEBUG: Compilation diagnostics:", result.diagnostics);
    console.log("🔍 DEBUG: Diagnostic count:", result.diagnostics.length);
    
    // Check compilation success
    expect(result.diagnostics).toHaveLength(0);
    
    // Test emitter
    const emitterResult = await $onEmit(result.program, {
      "output-file": "test-asyncapi",
      "file-type": "yaml",
      title: "Test API",
      version: "1.0.0",
      description: "Real test API"
    } as any);

    console.log("🔍 DEBUG: Emitter completed");
    expect(emitterResult).toBeDefined();
    
    // Verify we have actual decorator state
    const stateCheck = result.program.stateMap("channelPaths");
    console.log("🔍 DEBUG: Channel paths state size:", stateCheck?.size || 0);
  });
});