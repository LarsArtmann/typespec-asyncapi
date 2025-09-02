/**
 * Plugin System Unit Tests
 * 
 * Tests the simple plugin architecture for protocol bindings
 */

import { describe, expect, it } from "bun:test"
import { Effect } from "effect"
import { 
  pluginRegistry, 
  registerBuiltInPlugins, 
  generateProtocolBinding 
} from "../../src/plugins/plugin-system.js"

describe("Plugin System", () => {
  it("should initialize built-in plugins without errors", async () => {
    const initEffect = registerBuiltInPlugins()
    
    // Should not throw
    await Effect.runPromise(initEffect)
  })
  
  it("should register and retrieve plugins correctly", async () => {
    await Effect.runPromise(registerBuiltInPlugins())
    
    // Test plugin retrieval
    const kafkaPlugin = await Effect.runPromise(pluginRegistry.getPlugin("kafka"))
    const httpPlugin = await Effect.runPromise(pluginRegistry.getPlugin("http"))
    const websocketPlugin = await Effect.runPromise(pluginRegistry.getPlugin("websocket"))
    
    expect(kafkaPlugin).toBeTruthy()
    expect(kafkaPlugin?.name).toBe("kafka")
    expect(kafkaPlugin?.version).toBe("1.0.0")
    
    expect(httpPlugin).toBeTruthy()
    expect(httpPlugin?.name).toBe("http")
    
    expect(websocketPlugin).toBeTruthy()
    expect(websocketPlugin?.name).toBe("websocket")
  })
  
  it("should generate protocol bindings using plugins", async () => {
    await Effect.runPromise(registerBuiltInPlugins())
    
    // Test Kafka operation binding generation
    const kafkaBinding = await Effect.runPromise(
      generateProtocolBinding("kafka", "operation", { test: "data" })
    )
    
    expect(kafkaBinding).toBeTruthy()
    expect(kafkaBinding).toHaveProperty("kafka")
    expect(kafkaBinding?.kafka).toHaveProperty("groupId")
    expect(kafkaBinding?.kafka).toHaveProperty("clientId")
    expect(kafkaBinding?.kafka).toHaveProperty("bindingVersion")
  })
  
  it("should return null for unsupported protocols", async () => {
    await Effect.runPromise(registerBuiltInPlugins())
    
    const unknownBinding = await Effect.runPromise(
      generateProtocolBinding("unsupported" as any, "operation", {})
    )
    
    expect(unknownBinding).toBeNull()
  })
  
  it("should handle plugin errors gracefully", async () => {
    // Test with uninitialized registry
    const uninitializedBinding = await Effect.runPromise(
      generateProtocolBinding("kafka", "operation", {})
    )
    
    // Should handle gracefully when no plugins are registered
    expect(uninitializedBinding).toBeNull()
  })
  
  it("should list all registered plugins", async () => {
    await Effect.runPromise(registerBuiltInPlugins())
    
    const allPlugins = await Effect.runPromise(pluginRegistry.getAllPlugins())
    
    expect(allPlugins.length).toBeGreaterThanOrEqual(3) // kafka, http, websocket
    
    const pluginNames = allPlugins.map(p => p.name)
    expect(pluginNames).toContain("kafka")
    expect(pluginNames).toContain("http") 
    expect(pluginNames).toContain("websocket")
  })
  
  it("should check protocol support correctly", async () => {
    await Effect.runPromise(registerBuiltInPlugins())
    
    const kafkaSupported = await Effect.runPromise(pluginRegistry.isSupported("kafka"))
    const httpSupported = await Effect.runPromise(pluginRegistry.isSupported("http"))
    const unsupportedProtocol = await Effect.runPromise(pluginRegistry.isSupported("nonexistent" as any))
    
    expect(kafkaSupported).toBe(true)
    expect(httpSupported).toBe(true)
    expect(unsupportedProtocol).toBe(false)
  })
})