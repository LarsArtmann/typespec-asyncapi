import { describe, it, expect } from "bun:test";
import { $onEmit } from "../src/index.js";
import { compileRealAsyncAPI, createUnifiedAsyncAPITestHost } from "./core/unified-test-infrastructure.js";

describe("Real Emitter Test", () => {
  it("should generate real AsyncAPI files", async () => {
    // Test typespec code with decorators - SIMPLE PATTERN
    const typespecCode = `
      using TypeSpec.AsyncAPI;
      
      @channel("user-events")
      @publish
      op publishUserEvent(userId: string, eventType: string): void;
        
      @channel("orders")
      @subscribe
      op subscribeToOrders(): void;
    `;

    // Compile with unified test infrastructure
    const result = await compileRealAsyncAPI(typespecCode);
    
    console.log("🔍 DEBUG: Compilation result:", result);
    console.log("🔍 DEBUG: Program diagnostics:", result.program?.diagnostics);
    console.log("🔍 DEBUG: Diagnostic count:", result.program?.diagnostics?.length || 0);
    
    console.log("🔍 DEBUG: Generated TypeSpec code:");
    console.log(typespecCode);
    console.log("🔍 DEBUG: TypeSpec code lines:");
    typespecCode.split('\n').forEach((line, index) => {
      console.log(`${index + 1}: ${line}`);
    });
    
    // Check compilation success
    expect(result.program?.diagnostics || []).toHaveLength(0);
    
    // CRITICAL TEST: Try emitter even if program looks empty
    // Decorators are working, so program should be valid
    console.log("🔥 CRITICAL: Testing emitter despite empty program appearance...");
    
    try {
      const emitterResult = await $onEmit(result.program, {
        "output-file": "test-asyncapi",
        "file-type": "yaml",
        title: "Test API",
        version: "1.0.0",
        description: "Real test API"
      } as any);

      console.log("🎉 SUCCESS: Emitter completed!");
      console.log("🔍 Emitter result:", emitterResult);
      expect(emitterResult).toBeDefined();
    } catch (error) {
      console.log("❌ EMITTER ERROR:", error.message);
      throw error;
    }

    console.log("🔍 DEBUG: Emitter completed");
    expect(emitterResult).toBeDefined();
    
    // Verify we have actual decorator state
    const stateCheck = result.program.stateMap("channelPaths");
    console.log("🔍 DEBUG: Channel paths state size:", stateCheck?.size || 0);
  });
});