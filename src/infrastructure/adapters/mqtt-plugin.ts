/**
 * MQTT Protocol Plugin for AsyncAPI TypeSpec Emitter
 * 
 * Follows existing kafka-plugin.ts patterns for consistency
 * Supports AsyncAPI 3.0 MQTT binding specification
 */

import { Effect } from "effect"
import type { AsyncAPIProtocolType } from "../../constants/protocol-defaults.js"
import type { Operation } from "@typespec/compiler"

/**
 * MQTT Plugin Configuration (following kafka-plugin patterns)
 */
export interface MQTTBindingConfig {
  qos: 0 | 1 | 2
  retain: boolean
  clientId?: string
  cleanSession?: boolean
  keepAlive?: number
  willTopic?: string
  willMessage?: string
  willQos?: 0 | 1 | 2
  willRetain?: boolean
}

/**
 * MQTT Plugin Implementation (following kafka-plugin structure)
 */
export const mqttPlugin = {
  name: "mqtt",
  version: "1.0.0",
  
  /**
   * Check if plugin handles specific protocol
   */
  canHandle: (protocolName: AsyncAPIProtocolType): boolean => {
    return protocolName === "mqtt"
  },

  /**
   * Generate operation binding for MQTT
   */
  generateOperationBinding: (operation: Operation, data: Record<string, unknown>) => {
    return Effect.gen(function* () {
      const config = data as MQTTBindingConfig
      
      const binding = {
        mqtt: {
          qos: config.qos || 0,
          retain: config.retain || false,
          clientId: config.clientId,
          cleanSession: config.cleanSession,
          keepAlive: config.keepAlive
        }
      }

      // Add will message configuration if provided
      if (config.willTopic || config.willMessage) {
        binding.mqtt.will = {
          topic: config.willTopic,
          payload: config.willMessage,
          qos: config.willQos || 0,
          retain: config.willRetain || false
        }
      }

      yield* Effect.logInfo(`🔌 Generated MQTT operation binding for ${operation.name}: QoS ${config.qos || 0}`)
      return binding
    })
  },

  /**
   * Generate message binding for MQTT
   */
  generateMessageBinding: (data: Record<string, unknown>) => {
    return Effect.gen(function* () {
      const config = data as MQTTBindingConfig
      
      const binding = {
        mqtt: {
          qos: config.qos || 0,
          retain: config.retain || false,
          contentType: config.contentType
        }
      }

      yield* Effect.logInfo("📨 Generated MQTT message binding")
      return binding
    })
  },

  /**
   * Generate server binding for MQTT
   */
  generateServerBinding: (data: Record<string, unknown>) => {
    return Effect.gen(function* () {
      const config = data as MQTTBindingConfig
      
      const binding = {
        mqtt: {
          protocolVersion: "5.0",
          clientId: config.clientId,
          cleanSession: config.cleanSession !== false,
          keepAlive: config.keepAlive || 60,
          maxReconnectInterval: 300,
          maxReconnectAttempts: 16,
          bindingVersion: "0.3.0"
        }
      }

      yield* Effect.logInfo("🖥️ Generated MQTT server binding")
      return binding
    })
  },

  /**
   * Validate MQTT binding configuration
   */
  validate: (config: Record<string, unknown>) => {
    return Effect.gen(function* () {
      const mqttConfig = config as MQTTBindingConfig
      
      const errors: string[] = []

      // Validate QoS
      if (mqttConfig.qos !== undefined && ![0, 1, 2].includes(mqttConfig.qos)) {
        errors.push("MQTT QoS must be 0, 1, or 2")
      }

      // Validate retain flag
      if (mqttConfig.retain !== undefined && typeof mqttConfig.retain !== "boolean") {
        errors.push("MQTT retain flag must be boolean")
      }

      // Validate keep alive
      if (mqttConfig.keepAlive !== undefined && 
          (typeof mqttConfig.keepAlive !== "number" || mqttConfig.keepAlive <= 0)) {
        errors.push("MQTT keep alive must be positive number")
      }

      if (errors.length > 0) {
        yield* Effect.logError(`❌ MQTT validation failed: ${errors.join(", ")}`)
        return false
      }

      yield* Effect.logInfo("✅ MQTT binding configuration is valid")
      return true
    })
  }
}
