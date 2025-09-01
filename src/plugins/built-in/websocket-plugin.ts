/**
 * Built-in WebSocket Protocol Plugin
 * 
 * Provides WebSocket-specific binding generation following AsyncAPI 3.0.0 specification
 */

import { Effect } from "effect"
import type { ProtocolPlugin } from "../plugin-system.js"
import { PROTOCOL_DEFAULTS } from "../../constants/protocol-defaults.js"

/**
 * WebSocket message binding data structure
 */
type WebSocketMessageBinding = {
  method?: string
  query?: Record<string, unknown>
  headers?: Record<string, unknown>
  bindingVersion?: string
}

/**
 * WebSocket server binding data structure
 */
type WebSocketServerBinding = {
  method?: string
  bindingVersion?: string
}

/**
 * Simple WebSocket plugin implementation
 */
export const websocketPlugin: ProtocolPlugin = {
  name: "websocket",
  version: "1.0.0",
  
  generateOperationBinding: (_operation: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("🔧 Generating WebSocket operation binding")
      
      // WebSocket doesn't have specific operation bindings in AsyncAPI 3.0
      return {}
    }),
    
  generateMessageBinding: (_message: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("📨 Generating WebSocket message binding")
      
      const binding: WebSocketMessageBinding = {
        method: PROTOCOL_DEFAULTS.websocket.method,
        bindingVersion: "0.1.0"
      }
      
      return { ws: binding }
    }),
    
  generateServerBinding: (_server: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("🖥️  Generating WebSocket server binding")
      
      const binding: WebSocketServerBinding = {
        method: PROTOCOL_DEFAULTS.websocket.method,
        bindingVersion: "0.1.0"
      }
      
      return { ws: binding }
    }),
    
  validateConfig: (config: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("✅ Validating WebSocket configuration")
      
      // Simple validation for WebSocket configs
      if (typeof config === 'object' && config !== null) {
        return true
      }
      
      return false
    })
}