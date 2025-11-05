/**
 * MQTT Protocol Plugin for AsyncAPI TypeSpec Emitter
 * 
 * Follows existing kafka-plugin.ts patterns for consistency
 * Supports AsyncAPI 3.0 MQTT binding specification
 */

import { Effect } from "effect"


// MQTT Plugin Configuration (following kafka-plugin patterns)
export type MQTTBindingConfig = {
  qos: 0 | 1 | 2
  retain: boolean
  clientId?: string
  cleanSession?: boolean
  keepAlive?: number
  willTopic?: string
  willMessage?: string
  willQos?: 0 | 1 | 2
  willRetain?: boolean
  contentType?: string
}

// Protocol type for MQTT
export const MQTT_PROTOCOL = "mqtt" as const

/**
 * MQTT Plugin Implementation (following kafka-plugin structure)
 */
export const mqttPlugin = {
  name: "mqtt" as const,
  version: "1.0.0",
  
  /**
   * Check if plugin handles specific protocol
   */
  canHandle: (protocolName: string): boolean => {
    return protocolName === MQTT_PROTOCOL
  },

  /**
   * Generate operation binding for MQTT
   */
  generateOperationBinding: (operation: unknown) => {
    return Effect.gen(function* () {
      const config = operation as Record<string, unknown>
      const mqttConfig = config as MQTTBindingConfig
      
      const binding = {
        mqtt: {
          qos: config.qos ?? 0,
          retain: config.retain ?? false,
          clientId: mqttConfig.clientId,
          cleanSession: mqttConfig.cleanSession,
          keepAlive: mqttConfig.keepAlive
        }
      } as const

      // Add will message configuration if provided (type-safe mutation)
      const willConfig = config.willTopic ?? config.willMessage
      if (willConfig) {
        // Create new binding with will configuration to avoid type mutation
        const bindingWithWill = {
          mqtt: {
            ...(binding as {mqtt: Record<string, unknown>}).mqtt,
            will: {
              topic: config.willTopic,
              payload: config.willMessage,
              qos: config.willQos ?? 0,
              retain: config.willRetain ?? false
            }
          }
        } as const
        return bindingWithWill
      }

      yield* Effect.logInfo(`🔌 Generated MQTT operation binding: QoS ${mqttConfig.qos ?? 0}`)
      return binding
    })
  },

  /**
   * Generate message binding for MQTT
   */
  generateMessageBinding: (operation: unknown) => {
    return Effect.gen(function* () {
      const config = operation as Record<string, unknown>
      const mqttConfig = config as MQTTBindingConfig
      
      const binding = {
        mqtt: {
          qos: mqttConfig.qos ?? 0,
          retain: mqttConfig.retain ?? false,
          contentType: mqttConfig.contentType ?? 'application/json'
        }
      } as const

      yield* Effect.logInfo("📨 Generated MQTT message binding")
      return binding
    })
  },

  /**
   * Generate server binding for MQTT
   */
  generateServerBinding: (operation: unknown) => {
    return Effect.gen(function* () {
      const config = operation as Record<string, unknown>
      const mqttConfig = config as MQTTBindingConfig
      
      const binding = {
        mqtt: {
          protocolVersion: "5.0",
          clientId: mqttConfig.clientId,
          cleanSession: mqttConfig.cleanSession ?? true,
          keepAlive: mqttConfig.keepAlive ?? 60,
          maxReconnectInterval: 300,
          maxReconnectAttempts: 16,
          bindingVersion: "0.3.0"
        }
      } as const

      yield* Effect.logInfo("🖥️ Generated MQTT server binding")
      return binding
    })
  },

  /**
   * Validate MQTT binding configuration
   */
  validateConfig: (operation: unknown) => {
    return Effect.gen(function* () {
      const config = operation as Record<string, unknown>
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
