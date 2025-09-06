/**
 * Enhanced AMQP Protocol Plugin (Refactored)
 * 
 * TASK M24: Extract protocol plugin base class to reduce duplication
 * Refactored to use EnhancedProtocolPluginBase for common functionality
 * 
 * Features:
 * - AMQP channel bindings with queue/exchange declarations
 * - Message binding generation with routing keys
 * - Exchange type support (direct, topic, fanout, headers)
 * - Queue configuration (durable, exclusive, auto-delete)
 * - Dead letter exchange (DLX) support
 * - Message TTL and priority configuration
 * - Real compilation testing support
 */

import { Effect } from "effect"
import type { ProtocolPlugin } from "./protocol-plugin.js"
import { 
  EnhancedProtocolPluginBase, 
  type BaseOperationData, 
  type BaseServerData,
  type BaseTestingUtils 
} from "./enhanced-protocol-plugin-base.js"

/**
 * AMQP Exchange Types
 */
export type AMQPExchangeType = "direct" | "topic" | "fanout" | "headers"

/**
 * Enhanced AMQP Configuration
 */
export type AMQPConfig = {
  exchange?: {
    name: string
    type: AMQPExchangeType
    durable?: boolean
    autoDelete?: boolean
    internal?: boolean
    arguments?: Record<string, unknown>
  }
  queue?: {
    name: string
    durable?: boolean
    exclusive?: boolean
    autoDelete?: boolean
    arguments?: Record<string, unknown>
  }
  routingKey?: string
  deliveryMode?: 1 | 2  // 1 = non-persistent, 2 = persistent
  priority?: number     // 0-255
  timestamp?: boolean
  userId?: string
  contentType?: string
  contentEncoding?: string
  headers?: Record<string, unknown>
  correlationId?: string
  replyTo?: string
  expiration?: string   // TTL in milliseconds as string
  messageId?: string
  messageType?: string
  // Consumer configuration
  consumer?: {
    prefetchCount?: number
    prefetchSize?: number
    globalPrefetch?: boolean
    noAck?: boolean
    exclusive?: boolean
    consumerTag?: string
    arguments?: Record<string, unknown>
  }
}

/**
 * AMQP Operation data extending base structure
 */
export interface AMQPOperationData extends BaseOperationData {
  channel: {
    name: string
    parameters?: Record<string, unknown>
    config?: AMQPConfig
  }
}

/**
 * AMQP Server configuration extending base structure
 */
export interface AMQPServerData extends BaseServerData {
  protocol: "amqp" | "amqps"
  config?: {
    vhost?: string
    username?: string
    password?: string
    heartbeat?: number
    connectionTimeout?: number
    channelMax?: number
    frameMax?: number
  }
}

/**
 * AsyncAPI AMQP Binding Types (v0.3.0)
 */
export interface AMQPChannelBinding {
  is?: "queue" | "routingKey"
  exchange?: {
    name: string
    type: AMQPExchangeType
    durable?: boolean
    autoDelete?: boolean
    vhost?: string
    arguments?: Record<string, unknown>
  }
  queue?: {
    name: string
    durable?: boolean
    exclusive?: boolean
    autoDelete?: boolean
    vhost?: string
    arguments?: Record<string, unknown>
  }
  bindingVersion?: string
}

export interface AMQPOperationBinding {
  expiration?: number
  userId?: string
  cc?: string[]
  priority?: number
  deliveryMode?: 1 | 2
  mandatory?: boolean
  bcc?: string[]
  replyTo?: string
  timestamp?: boolean
  ack?: boolean
  bindingVersion?: string
}

export interface AMQPMessageBinding {
  contentEncoding?: string
  messageType?: string
  bindingVersion?: string
}

/**
 * Enhanced AMQP Protocol Plugin Implementation using Base Class
 */
class EnhancedAMQPPlugin extends EnhancedProtocolPluginBase {
  public readonly name = "amqp" as const
  public readonly version = "2.0.0"
  protected readonly bindingVersion = "0.3.0"

  /**
   * Generate AMQP operation binding with comprehensive configuration
   */
  public generateOperationBinding(operation: unknown): Effect.Effect<Record<string, unknown>, Error> {
    return this.wrapOperationBinding(
      "Enhanced AMQP",
      () => Effect.gen(this, function* () {
        const opData = operation as AMQPOperationData
        const config = opData.channel?.config || {}

        const binding = this.createBaseBinding<AMQPOperationBinding>({})

        // Extract operation-specific AMQP configuration
        if (config.deliveryMode) {
          binding.deliveryMode = config.deliveryMode
        }

        if (config.priority !== undefined) {
          binding.priority = config.priority
        }

        if (config.expiration) {
          binding.expiration = parseInt(config.expiration, 10)
        }

        if (config.userId) {
          binding.userId = config.userId
        }

        if (config.replyTo) {
          binding.replyTo = config.replyTo
        }

        if (config.timestamp !== undefined) {
          binding.timestamp = config.timestamp
        }

        // Consumer acknowledgment configuration
        if (config.consumer?.noAck !== undefined) {
          binding.ack = !config.consumer.noAck
        }

        yield* Effect.log("✅ AMQP operation binding created successfully")
        return { amqp: binding }
      }),
      { amqp: this.createBaseBinding() }
    )
  }

  /**
   * Generate AMQP message binding
   */
  public generateMessageBinding(message: unknown): Effect.Effect<Record<string, unknown>, Error> {
    return this.wrapMessageBinding(
      "Enhanced AMQP",
      () => Effect.gen(this, function* () {
        const messageData = message as { config?: AMQPConfig }
        const config = messageData?.config || {}

        const binding = this.createBaseBinding<AMQPMessageBinding>({})

        if (config.contentEncoding) {
          binding.contentEncoding = config.contentEncoding
        }

        if (config.messageType) {
          binding.messageType = config.messageType
        }

        yield* Effect.log("✅ AMQP message binding created successfully")
        return { amqp: binding }
      }),
      { amqp: this.createBaseBinding() }
    )
  }

  /**
   * Generate AMQP server binding - NOT SUPPORTED
   * AMQP doesn't have server bindings in AsyncAPI 3.0
   */
  public generateServerBinding(server: unknown): Effect.Effect<Record<string, unknown>, Error> {
    return this.wrapServerBinding(
      "AMQP",
      () => Effect.gen(function* () {
        const serverData = server as AMQPServerData
        
        if (serverData?.protocol && !["amqp", "amqps"].includes(serverData.protocol)) {
          yield* Effect.logWarning(`⚠️ Invalid AMQP protocol: ${serverData.protocol}`)
        }

        yield* Effect.log("✅ AMQP server validation completed (no binding required)")
        return {}
      }),
      {}
    )
  }

  /**
   * Enhanced AMQP configuration validation using base class helpers
   */
  public validateConfig(config: unknown): Effect.Effect<boolean, Error> {
    return this.wrapConfigValidation(
      "Enhanced AMQP",
      () => Effect.gen(this, function* () {
        const isObjectValid = yield* this.validateConfigIsObject(config, "AMQP")
        if (!isObjectValid) return false

        const amqpConfig = config as AMQPConfig

        // Validate exchange configuration
        if (amqpConfig.exchange) {
          const exchange = amqpConfig.exchange
          
          if (!exchange.name) {
            yield* Effect.logError("❌ AMQP exchange name is required")
            return false
          }

          const validExchangeTypes = ["direct", "topic", "fanout", "headers"] as const
          const isValidType = yield* this.validateEnum(exchange.type, validExchangeTypes, "exchange type", "AMQP")
          if (!isValidType) return false
        }

        // Validate queue configuration
        if (amqpConfig.queue) {
          const queue = amqpConfig.queue
          
          if (!queue.name) {
            yield* Effect.logError("❌ AMQP queue name is required")
            return false
          }
        }

        // Validate delivery mode using base class helper
        if (amqpConfig.deliveryMode !== undefined) {
          const validModes = ["1", "2"] as const
          const isValidMode = yield* this.validateEnum(amqpConfig.deliveryMode.toString(), validModes, "delivery mode", "AMQP")
          if (!isValidMode) return false
        }

        // Validate priority using base class helper
        if (amqpConfig.priority !== undefined) {
          const isValidPriority = yield* this.validateNumericRange(amqpConfig.priority, "priority", 0, 255, "AMQP")
          if (!isValidPriority) return false
        }

        // Validate consumer configuration using base class helpers
        if (amqpConfig.consumer) {
          const consumer = amqpConfig.consumer
          
          if (consumer.prefetchCount !== undefined) {
            const isValidPrefetchCount = yield* this.validateNumericRange(consumer.prefetchCount, "prefetchCount", 0, Number.MAX_SAFE_INTEGER, "AMQP")
            if (!isValidPrefetchCount) return false
          }

          if (consumer.prefetchSize !== undefined) {
            const isValidPrefetchSize = yield* this.validateNumericRange(consumer.prefetchSize, "prefetchSize", 0, Number.MAX_SAFE_INTEGER, "AMQP")
            if (!isValidPrefetchSize) return false
          }
        }

        yield* Effect.log("✅ AMQP configuration validation passed")
        return true
      })
    )
  }

  /**
   * Create AMQP testing utilities using base class pattern
   */
  public createTestingUtils(): BaseTestingUtils<AMQPOperationData, AMQPServerData> & {
    createDLXConfig: (exchangeName: string, routingKey?: string) => AMQPConfig['consumer']
    validateBindingOutput: (binding: unknown) => binding is { amqp: AMQPChannelBinding | AMQPOperationBinding | AMQPMessageBinding }
  } {
    const baseUtils = this.createBaseTestingUtils<AMQPOperationData, AMQPServerData>(
      "amqp",
      {
        channel: {
          name: "test-amqp-channel",
          config: {
            exchange: {
              name: "test.exchange",
              type: "topic",
              durable: true
            },
            queue: {
              name: "test.queue",
              durable: true,
              exclusive: false
            },
            routingKey: "test.routing.key",
            deliveryMode: 2
          }
        },
        operation: {
          name: "testAMQPOperation",
          action: "receive"
        },
        message: {
          name: "TestAMQPMessage",
          payload: { data: "string" }
        }
      },
      {
        url: "amqp://localhost:5672",
        protocol: "amqp",
        config: {
          vhost: "/",
          heartbeat: 60,
          connectionTimeout: 30000
        }
      }
    )

    return {
      ...baseUtils,
      createDLXConfig: (exchangeName: string, routingKey?: string) => ({
        exchange: exchangeName,
        arguments: {
          "x-message-ttl": 86400000, // 24 hours
          "x-max-retries": 3
        },
        ...(routingKey ? { routingKey } : {})
      }),
      validateBindingOutput: (binding: unknown): binding is { amqp: AMQPChannelBinding | AMQPOperationBinding | AMQPMessageBinding } => {
        return (
          typeof binding === 'object' &&
          binding !== null &&
          'amqp' in binding &&
          typeof (binding as Record<string, unknown>).amqp === 'object' &&
          'bindingVersion' in ((binding as Record<string, unknown>).amqp as Record<string, unknown>)
        )
      }
    }
  }
}

/**
 * AMQP Channel Binding Factory
 */
export const createAMQPChannelBinding = (config: AMQPConfig = {}): AMQPChannelBinding => {
  const binding: AMQPChannelBinding = {
    bindingVersion: "0.3.0"
  }

  // Set binding type based on configuration
  if (config.queue) {
    binding.is = "queue"
    binding.queue = {
      name: config.queue.name,
      durable: config.queue.durable ?? true,
      exclusive: config.queue.exclusive ?? false,
      autoDelete: config.queue.autoDelete ?? false,
      ...(config.queue.arguments ? { arguments: config.queue.arguments } : {})
    }
  }

  if (config.exchange) {
    binding.is = config.queue ? "queue" : "routingKey"
    binding.exchange = {
      name: config.exchange.name,
      type: config.exchange.type,
      durable: config.exchange.durable ?? true,
      autoDelete: config.exchange.autoDelete ?? false,
      ...(config.exchange.arguments ? { arguments: config.exchange.arguments } : {})
    }
  }

  return binding
}

// Export the singleton instance
export const enhancedAMQPPlugin: ProtocolPlugin = new EnhancedAMQPPlugin()

// Export testing utilities
export const amqpTestingUtils = new EnhancedAMQPPlugin().createTestingUtils()