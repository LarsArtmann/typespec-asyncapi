/**
 * Enhanced MQTT Protocol Plugin
 * 
 * TASK M29: Extract MQTT binding logic from core emitter
 * TASK M30: Implement MQTT topic hierarchies and QoS settings
 * Provides comprehensive MQTT protocol support for AsyncAPI 3.0.0
 * 
 * Features:
 * - MQTT channel bindings with topic hierarchies
 * - QoS level support (0, 1, 2)
 * - Retained message configuration
 * - Last Will and Testament (LWT) support
 * - Clean session and keep-alive configuration
 * - Topic filter patterns (+, #)
 * - Shared subscription support (MQTT 5.0)
 * - Real compilation testing support
 */

import { Effect } from "effect"

import type {ProtocolPlugin} from "../protocol-plugin.js"

/**
 * TASK M28: MQTT Plugin Interface Definition
 * Enhanced MQTT configuration types based on MQTT 3.1.1 and 5.0 standards
 */

// MQTT QoS Levels
export type MQTTQoS = 0 | 1 | 2

// MQTT Protocol Versions
export type MQTTVersion = "3.1.1" | "5.0"

// Enhanced MQTT Configuration
export type MQTTConfig = {
  // Topic configuration
  topic?: {
    template: string           // e.g., "devices/{deviceId}/telemetry"
    levels?: string[]          // Topic hierarchy levels
    wildcard?: "+" | "#"       // Single-level (+) or multi-level (#) wildcard
    shared?: {
      name: string             // Shared subscription name (MQTT 5.0)
      group?: string           // Subscription group
    }
  }
  // Quality of Service
  qos?: MQTTQoS
  retain?: boolean             // Retain flag for published messages
  // Last Will and Testament
  lastWill?: {
    topic: string
    message: string
    qos?: MQTTQoS
    retain?: boolean
  }
  // Connection settings
  connection?: {
    keepAlive?: number         // Keep-alive interval in seconds
    cleanSession?: boolean     // Clean session flag
    clientId?: string          // MQTT client identifier
    username?: string
    password?: string
  }
  // MQTT 5.0 specific features
  mqtt5?: {
    topicAlias?: number        // Topic alias (1-65535)
    responseInformation?: string
    correlationData?: string
    userProperties?: Record<string, string>
    messageExpiryInterval?: number  // Message expiry in seconds
    subscriptionIdentifier?: number
    receiveMaximum?: number    // Maximum QoS 1/2 messages
    maximumPacketSize?: number // Maximum packet size in bytes
    wildcardSubscriptionAvailable?: boolean
    subscriptionIdentifierAvailable?: boolean
    sharedSubscriptionAvailable?: boolean
  }
}

// MQTT Operation data extracted from TypeSpec
export type MQTTOperationData = {
  channel: {
    name: string
    parameters?: Record<string, unknown>
    config?: MQTTConfig
  }
  operation: {
    name: string
    action: "send" | "receive" 
    parameters?: Record<string, unknown>
  }
  message?: {
    name: string
    payload?: unknown
  }
}

// MQTT Server configuration
export type MQTTServerData = {
  url: string
  protocol: "mqtt" | "mqtts" | "ws" | "wss"
  config?: {
    version?: MQTTVersion
    port?: number
    path?: string              // WebSocket path for MQTT over WebSocket
    maxConnections?: number
    sessionExpiryInterval?: number
  }
}

/**
 * TASK M29: Extract MQTT binding logic from core emitter  
 * AsyncAPI MQTT Binding Types (v0.2.0)
 */
export type MQTTServerBinding = {
  clientId?: string
  cleanSession?: boolean
  lastWill?: {
    topic: string
    qos?: MQTTQoS
    message?: string
    retain?: boolean
  }
  keepAlive?: number
  bindingVersion?: string
}

export type MQTTOperationBinding = {
  qos?: MQTTQoS
  retain?: boolean
  messageExpiryInterval?: number
  bindingVersion?: string
}

export type MQTTMessageBinding = {
  payloadFormatIndicator?: 0 | 1  // 0 = bytes, 1 = UTF-8 string
  correlationData?: string
  responseTopic?: string
  contentType?: string
  bindingVersion?: string
}

/**
 * TASK M29: Enhanced MQTT Protocol Plugin Implementation
 */
export const enhancedMQTTPlugin: ProtocolPlugin = {
  name: "mqtt",
  version: "2.0.0",

  /**
   * Generate MQTT operation binding with QoS and retain settings
   */
  generateOperationBinding: (operation: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("🔧 Enhanced MQTT operation binding generation")
      
      try {
        const opData = operation as MQTTOperationData
        const config = opData.channel?.config || {}

        const binding: MQTTOperationBinding = {
          bindingVersion: "0.2.0"
        }

        // Set QoS level
        if (config.qos !== undefined) {
          binding.qos = config.qos
          yield* Effect.log(`📶 MQTT QoS level set to: ${config.qos}`)
        }

        // Set retain flag
        if (config.retain !== undefined) {
          binding.retain = config.retain
          yield* Effect.log(`📎 MQTT retain flag set to: ${config.retain}`)
        }

        // MQTT 5.0 message expiry interval
        if (config.mqtt5?.messageExpiryInterval !== undefined) {
          binding.messageExpiryInterval = config.mqtt5.messageExpiryInterval
          yield* Effect.log(`⏰ MQTT message expiry set to: ${config.mqtt5.messageExpiryInterval}s`)
        }

        yield* Effect.log("✅ MQTT operation binding created successfully")
        return { mqtt: binding }
      } catch (error) {
        yield* Effect.logError(`❌ MQTT operation binding error: ${error}`)
        return { mqtt: { bindingVersion: "0.2.0" } }
      }
    }),

  /**
   * Generate MQTT message binding with format indicators
   */
  generateMessageBinding: (message: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("📨 Enhanced MQTT message binding generation")
      
      try {
        const messageData = message as { config?: MQTTConfig }
        const config = messageData?.config || {}

        const binding: MQTTMessageBinding = {
          bindingVersion: "0.2.0"
        }

        // MQTT 5.0 specific message properties
        if (config.mqtt5) {
          const mqtt5 = config.mqtt5

          if (mqtt5.correlationData) {
            binding.correlationData = mqtt5.correlationData
          }

          if (mqtt5.responseInformation) {
            binding.responseTopic = mqtt5.responseInformation
          }

          // Assume UTF-8 string format for JSON payloads
          binding.payloadFormatIndicator = 1
        }

        yield* Effect.log("✅ MQTT message binding created successfully")
        return { mqtt: binding }
      } catch (error) {
        yield* Effect.logError(`❌ MQTT message binding error: ${error}`)
        return { mqtt: { bindingVersion: "0.2.0" } }
      }
    }),

  /**
   * Generate MQTT server binding with connection configuration
   */
  generateServerBinding: (server: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("🖥️ Enhanced MQTT server binding generation")
      
      try {
        const serverData = server as MQTTServerData
        const config = serverData?.config || {}

        const binding: MQTTServerBinding = {
          bindingVersion: "0.2.0"
        }

        // Set clean session flag
        if (config.sessionExpiryInterval !== undefined) {
          binding.cleanSession = config.sessionExpiryInterval === 0
        }

        // Set keep-alive interval  
        const defaultKeepAlive = 60
        binding.keepAlive = defaultKeepAlive

        yield* Effect.log("✅ MQTT server binding created successfully")
        return { mqtt: binding }
      } catch (error) {
        yield* Effect.logError(`❌ MQTT server binding error: ${error}`)
        return { mqtt: { bindingVersion: "0.2.0" } }
      }
    }),

  /**
   * Enhanced MQTT configuration validation
   */
  validateConfig: (config: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("🔍 Enhanced MQTT configuration validation")
      
      try {
        if (!config || typeof config !== 'object') {
          yield* Effect.logWarning("⚠️ MQTT config is not an object")
          return false
        }

        const mqttConfig = config as MQTTConfig

        // Validate QoS level
        if (mqttConfig.qos !== undefined && ![0, 1, 2].includes(mqttConfig.qos)) {
          yield* Effect.logError(`❌ Invalid MQTT QoS level: ${mqttConfig.qos} (must be 0, 1, or 2)`)
          return false
        }

        // Validate topic configuration
        if (mqttConfig.topic) {
          const topic = mqttConfig.topic

          if (topic.template && typeof topic.template !== 'string') {
            yield* Effect.logError("❌ MQTT topic template must be a string")
            return false
          }

          if (topic.wildcard && !["+", "#"].includes(topic.wildcard)) {
            yield* Effect.logError(`❌ Invalid MQTT wildcard: ${topic.wildcard} (must be + or #)`)
            return false
          }

          // Validate topic hierarchy
          if (topic.template) {
            const levels = topic.template.split('/')
            if (levels.length > 255) {
              yield* Effect.logError(`❌ MQTT topic hierarchy too deep: ${levels.length} levels (max 255)`)
              return false
            }
          }
        }

        // Validate Last Will and Testament
        if (mqttConfig.lastWill) {
          const lwt = mqttConfig.lastWill

          if (!lwt.topic) {
            yield* Effect.logError("❌ MQTT Last Will topic is required")
            return false
          }

          if (!lwt.message) {
            yield* Effect.logError("❌ MQTT Last Will message is required")
            return false
          }

          if (lwt.qos !== undefined && ![0, 1, 2].includes(lwt.qos)) {
            yield* Effect.logError(`❌ Invalid MQTT Last Will QoS: ${lwt.qos}`)
            return false
          }
        }

        // Validate connection settings
        if (mqttConfig.connection) {
          const conn = mqttConfig.connection

          if (conn.keepAlive !== undefined && (conn.keepAlive < 0 || conn.keepAlive > 65535)) {
            yield* Effect.logError(`❌ Invalid MQTT keep-alive: ${conn.keepAlive} (must be 0-65535)`)
            return false
          }

          if (conn.clientId && conn.clientId.length > 65535) {
            yield* Effect.logError(`❌ MQTT client ID too long: ${conn.clientId.length} chars (max 65535)`)
            return false
          }
        }

        // Validate MQTT 5.0 specific settings
        if (mqttConfig.mqtt5) {
          const mqtt5 = mqttConfig.mqtt5

          if (mqtt5.topicAlias !== undefined && (mqtt5.topicAlias < 1 || mqtt5.topicAlias > 65535)) {
            yield* Effect.logError(`❌ Invalid MQTT topic alias: ${mqtt5.topicAlias} (must be 1-65535)`)
            return false
          }

          if (mqtt5.messageExpiryInterval !== undefined && mqtt5.messageExpiryInterval < 0) {
            yield* Effect.logError(`❌ Invalid MQTT message expiry interval: ${mqtt5.messageExpiryInterval}`)
            return false
          }

          if (mqtt5.receiveMaximum !== undefined && (mqtt5.receiveMaximum < 1 || mqtt5.receiveMaximum > 65535)) {
            yield* Effect.logError(`❌ Invalid MQTT receive maximum: ${mqtt5.receiveMaximum} (must be 1-65535)`)
            return false
          }

          if (mqtt5.maximumPacketSize !== undefined && (mqtt5.maximumPacketSize < 1 || mqtt5.maximumPacketSize > 268435455)) {
            yield* Effect.logError(`❌ Invalid MQTT maximum packet size: ${mqtt5.maximumPacketSize}`)
            return false
          }
        }

        yield* Effect.log("✅ MQTT configuration validation passed")
        return true
      } catch (error) {
        yield* Effect.logError(`❌ MQTT validation error: ${error}`)
        return false
      }
    })
}

/**
 * TASK M30: MQTT Topic Hierarchy Utilities
 * Implement MQTT topic hierarchies and pattern matching
 */
export const mqttTopicUtils = {
  /**
   * Parse MQTT topic template into hierarchy levels
   */
  parseTopicHierarchy: (template: string): string[] => {
    return template.split('/').filter(level => level.length > 0)
  },

  /**
   * Validate MQTT topic pattern
   */
  isValidTopicPattern: (pattern: string): boolean => {
    // MQTT topic rules:
    // - Must not be empty
    // - Can contain + for single-level wildcard
    // - Can contain # for multi-level wildcard (only at end)
    // - Cannot start with $SYS unless it's a system topic
    
    if (!pattern || pattern.length === 0) return false
    if (pattern.length > 65535) return false  // MQTT spec limit
    
    const levels = pattern.split('/')
    
    // Check for invalid # placement
    for (let i = 0; i < levels.length; i++) {
      const level = levels[i]
      if (!level) continue  // Skip undefined levels
      
      if (level === '#' && i !== levels.length - 1) {
        return false  // # can only be at the end
      }
      if (level.includes('#') && level !== '#') {
        return false  // # must be alone in its level
      }
    }
    
    return true
  },

  /**
   * Check if topic matches pattern with wildcards
   */
  matchesPattern: (topic: string, pattern: string): boolean => {
    const topicLevels = topic.split('/')
    const patternLevels = pattern.split('/')
    
    let topicIndex = 0
    let patternIndex = 0
    
    while (topicIndex < topicLevels.length && patternIndex < patternLevels.length) {
      const topicLevel = topicLevels[topicIndex]
      const patternLevel = patternLevels[patternIndex]
      
      if (patternLevel === '#') {
        return true  // # matches remaining levels
      } else if (patternLevel === '+') {
        // + matches any single level
        topicIndex++
        patternIndex++
      } else if (topicLevel === patternLevel) {
        topicIndex++
        patternIndex++
      } else {
        return false
      }
    }
    
    // Check if we've consumed all levels correctly
    return topicIndex === topicLevels.length && 
           (patternIndex === patternLevels.length || 
            (patternIndex === patternLevels.length - 1 && patternLevels[patternIndex] === '#'))
  },

  /**
   * Create shared subscription topic (MQTT 5.0)
   */
  createSharedSubscription: (groupName: string, topicFilter: string): string => {
    return `$share/${groupName}/${topicFilter}`
  }
}

/**
 * TASK M31: MQTT Plugin Testing Support
 */
export const mqttTestingUtils = {
  /**
   * Create test MQTT operation data
   */
  createTestOperationData: (overrides: Partial<MQTTOperationData> = {}): MQTTOperationData => ({
    channel: {
      name: "test-mqtt-channel",
      config: {
        topic: {
          template: "devices/{deviceId}/telemetry",
          levels: ["devices", "{deviceId}", "telemetry"]
        },
        qos: 1,
        retain: false,
        lastWill: {
          topic: "devices/{deviceId}/status",
          message: '{"status": "offline"}',
          qos: 1,
          retain: true
        }
      },
      ...overrides.channel
    },
    operation: {
      name: "testMQTTOperation", 
      action: "receive",
      ...overrides.operation
    },
    message: {
      name: "TestMQTTMessage",
      payload: { temperature: "number", humidity: "number" },
      ...overrides.message
    }
  }),

  /**
   * Create test MQTT server data
   */
  createTestServerData: (overrides: Partial<MQTTServerData> = {}): MQTTServerData => ({
    url: "mqtt://localhost:1883",
    protocol: "mqtt",
    config: {
      version: "3.1.1",
      port: 1883,
      maxConnections: 1000,
      sessionExpiryInterval: 300
    },
    ...overrides
  }),

  /**
   * Validate MQTT binding output
   */
  validateBindingOutput: (binding: unknown): binding is { mqtt: MQTTServerBinding | MQTTOperationBinding | MQTTMessageBinding } => {
    return (
      typeof binding === 'object' &&
      binding !== null &&
      'mqtt' in binding &&
      typeof (binding as Record<string, unknown>).mqtt === 'object' &&
      'bindingVersion' in ((binding as Record<string, unknown>).mqtt as Record<string, unknown>)
    )
  },

  /**
   * Create MQTT 5.0 advanced configuration
   */
  createMQTT5Config: (): MQTTConfig['mqtt5'] => ({
    topicAlias: 1,
    messageExpiryInterval: 3600,
    receiveMaximum: 65535,
    maximumPacketSize: 268435455,
    wildcardSubscriptionAvailable: true,
    subscriptionIdentifierAvailable: true,
    sharedSubscriptionAvailable: true,
    userProperties: {
      "client-version": "2.0.0",
      "platform": "nodejs"
    }
  }),

  /**
   * Create IoT device topic hierarchy
   */
  createIoTTopicHierarchy: (deviceId: string, dataType: string): string => {
    return `iot/devices/${deviceId}/${dataType}`
  }
}