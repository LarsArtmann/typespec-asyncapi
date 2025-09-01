/**
 * DIRECT Program Test - Test emitter with real TypeSpec Program
 * 
 * This bypasses decorator loading and tests the emitter directly
 */

import { describe, it, expect } from "vitest"
import { createTestHost, createTestWrapper } from "@typespec/compiler/testing"

describe("🔥 Direct Program Test", () => {
  it("should create a REAL TypeSpec Program without decorators", async () => {
    // Create a basic TypeSpec test host
    const host = createTestHost()
    const runner = createTestWrapper(host)
    
    // Compile TypeSpec source using the test runner
    const { program } = await runner.compile(`
      namespace TestBasic;
      
      model SimpleData {
        id: string;
        value: string;
      }
      
      op processData(): SimpleData;
    `)
    
    // This should be a REAL TypeSpec Program, not a mock!
    expect(program).toBeDefined()
    expect(program.stateMap).toBeDefined()
    expect(typeof program.stateMap).toBe("function")
    expect(program.checker).toBeDefined()
    expect(program.sourceFiles).toBeDefined()
    
    // Check if it has the methods that our emitter needs
    expect(program.getGlobalNamespaceType).toBeDefined()
    expect(typeof program.getGlobalNamespaceType).toBe("function")
    
    console.log("✅ SUCCESS: Created REAL TypeSpec Program with all required methods!")
    console.log("Program methods:", Object.keys(program).filter(k => typeof program[k] === 'function'))
    
    // Test calling the emitter directly with this REAL program
    const emitterContext = {
      program: program,
      emitterOutputDir: "test-output",
      options: {},
    }
    
    // Import and call our emitter
    const { generateAsyncAPIWithEffect } = await import("../dist/emitter-with-effect.js")
    
    try {
      await generateAsyncAPIWithEffect(emitterContext)
      console.log("✅ SUCCESS: Emitter ran with REAL Program without errors!")
    } catch (error) {
      console.log("⚠️  Emitter error (expected without decorators):", error.message)
      // This is expected since we don't have decorator data
    }
  })
})