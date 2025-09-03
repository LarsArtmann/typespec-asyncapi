/**
 * Debug test to understand what the Alpha emitter actually outputs
 */

import { describe, it, expect } from "bun:test"
import { compileAsyncAPISpecRaw } from "./test/utils/test-helpers.js"

describe("Debug Alpha Emitter Output", () => {
  it("should show exactly what the emitter generates", async () => {
    const source = `
      namespace TestService;
      
      model BasicEvent {
        id: string;
        timestamp: utcDateTime;
        data: string;
      }

      @channel("events.basic")
      @subscribe
      op receiveBasicEvent(): BasicEvent;
    `

    try {
      const result = await compileAsyncAPISpecRaw(source, {
        "output-file": "debug-test",
        "file-type": "json"
      })

      console.log("=== COMPILATION RESULT DEBUG ===")
      console.log("result keys:", Object.keys(result))
      console.log("outputFiles type:", typeof result.outputFiles)
      console.log("outputFiles is Map:", result.outputFiles instanceof Map)
      console.log("outputFiles size:", result.outputFiles?.size)
      
      if (result.outputFiles instanceof Map) {
        console.log("=== ALL OUTPUT FILES ===")
        for (const [key, value] of result.outputFiles) {
          console.log(`File: ${key}`)
          console.log(`  Type: ${typeof value}`)
          console.log(`  Size: ${value?.length || (typeof value === 'object' && value?.content?.length) || 0}`)
          if (typeof value === 'string' && value.length < 200) {
            console.log(`  Content preview: ${value.substring(0, 100)}...`)
          }
        }
      }

      console.log("=== DIAGNOSTICS ===")
      result.diagnostics.forEach((d, i) => {
        console.log(`${i}: [${d.severity}] ${d.message}`)
      })

      expect(result).toBeDefined()
      expect(result.outputFiles).toBeDefined()
    } catch (error) {
      console.error("Test failed:", error)
      throw error
    }
  })
})