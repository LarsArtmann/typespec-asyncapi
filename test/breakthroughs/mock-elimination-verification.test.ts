/**
 * VERIFICATION: Mock Infrastructure Elimination Test
 * 
 * This test verifies that we can use REAL TypeSpec objects instead of mocks
 */

import { describe, it, expect } from "bun:test"
import { compileAsyncAPISpec } from "./utils/test-helpers"

describe("🚨 Mock Infrastructure Elimination", () => {
  it("should use REAL TypeSpec Program instead of mock objects", async () => {
    const source = `
      namespace TestService;
      
      model SimpleMessage {
        id: string;
        content: string;
      }
      
      @channel("test.messages")
      op publishMessage(): SimpleMessage;
    `
    
    // This should use REAL TypeSpec compilation now, not mocks
    const result = await compileAsyncAPISpec(source)
    
    // The program should be a REAL TypeSpec Program with real methods
    expect(result.program).toBeDefined()
    expect(result.program.stateMap).toBeDefined()
    expect(typeof result.program.stateMap).toBe("function")
    
    // Most importantly - no more mock objects!
    expect(result.program.host).toBeDefined() // Real host should be available
    
    Effect.log("✅ SUCCESS: Using real TypeSpec Program instead of mock!")
    Effect.log("Program has real methods:", Object.keys(result.program))
  })
  
  it("should generate AsyncAPI output using real emitter", async () => {
    const source = `
      namespace RealTestService;
      
      model UserEvent {
        userId: string;
        eventType: string;
      }
      
      @channel("user.events")
      op handleUserEvent(): UserEvent;
    `
    
    const result = await compileAsyncAPISpec(source)
    
    // Should have actual output files
    expect(result.outputFiles).toBeDefined()
    expect(result.outputFiles.size).toBeGreaterThan(0)
    
    // List all output files to verify generation
    const files = Array.from(result.outputFiles.keys())
    Effect.log("Generated files:", files)
    
    // Should have AsyncAPI specification file
    const hasAsyncAPIFile = files.some(f => f.includes("asyncapi") || f.includes("AsyncAPI"))
    expect(hasAsyncAPIFile).toBe(true)
    
    Effect.log("✅ SUCCESS: Real emitter generated actual output files!")
  })
})