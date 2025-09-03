/**
 * Debug test for server decorator
 * Direct unit test to verify decorator functionality
 */

import { describe, it, expect } from "bun:test"
import { $server } from "../src/decorators/server.js"
import { $lib } from "../src/lib.js"

describe("Server Decorator Debug", () => {
  it("should be callable and process server config", () => {
    // Create mock TypeSpec context and target
    const mockProgram = {
      stateMap: (key: symbol) => {
        const map = new Map()
        return map
      },
      reportDiagnostic: (diagnostic: any) => {
        console.log("Mock diagnostic:", diagnostic)
      }
    }

    const mockContext = {
      program: mockProgram,
      reportDiagnostic: (code: string, target: any, args: any) => {
        console.log("Mock context diagnostic:", code, target, args)
      }
    } as any

    const mockNamespace = {
      kind: "Namespace" as const,
      name: "TestNamespace"
    } as any

    const serverName = "test-server"
    const serverConfig = {
      url: "kafka://localhost:9092",
      protocol: "kafka",
      description: "Test server"
    }

    // Call the decorator directly
    expect(() => {
      $server(mockContext, mockNamespace, serverName, serverConfig)
    }).not.toThrow()

    console.log("✅ Server decorator called successfully")
  })
})