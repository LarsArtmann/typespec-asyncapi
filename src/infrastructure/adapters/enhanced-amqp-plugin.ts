/**
 * Enhanced AMQP Protocol Plugin  
 * 
 * TASK M25: Extract AMQP binding logic from core emitter
 * TASK M26: Implement AMQP queue declarations and exchanges
 * Provides comprehensive AMQP protocol support for AsyncAPI 3.0.0
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

import type {ProtocolPlugin} from "./protocol-plugin.js"

/**
 * TASK M24: AMQP Plugin Interface Definition
 * Enhanced AMQP configuration types based on RabbitMQ standards
 */

// AMQP Exchange Types
export type AMQPExchangeType = "direct" | "topic" | "fanout" | "headers"

// Enhanced AMQP Configuration
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
  appId?: string
  clusterId?: string
  messageType?: string
  contentType?: string
  contentEncoding?: string
  headers?: Record<string, unknown>
  correlationId?: string
  replyTo?: string
  expiration?: string   // TTL in milliseconds as string
  messageId?: string
  // Dead Letter Exchange support
  dlx?: {
    exchange: string
    routingKey?: string
    arguments?: Record<string, unknown>
  }
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

// AMQP Operation data extracted from TypeSpec
export type AMQPOperationData = {
  channel: {
    name: string
    parameters?: Record<string, unknown>
    config?: AMQPConfig
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

// AMQP Server configuration
export type AMQPServerData = {
  url: string
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
 * TASK M25: Extract AMQP binding logic from core emitter
 * AsyncAPI AMQP Binding Types (v0.3.0)
 */
export type AMQPChannelBinding = {
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

export type AMQPOperationBinding = {
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

export type AMQPMessageBinding = {
  contentEncoding?: string
  messageType?: string
  bindingVersion?: string
}

/**
 * TASK M25: Enhanced AMQP Protocol Plugin Implementation
 */
export const enhancedAMQPPlugin: ProtocolPlugin = {
  name: "amqp",
  version: "2.0.0",

  /**
   * Generate AMQP operation binding with comprehensive configuration
   */
  generateOperationBinding: (operation: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("🔧 Enhanced AMQP operation binding generation")
      
      try {
        const opData = operation as AMQPOperationData
        const config = opData.channel?.config || {}

        const binding: AMQPOperationBinding = {
          bindingVersion: "0.3.0"
        }

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
      } catch (error) {
        yield* Effect.logError(`❌ AMQP operation binding error: ${error}`)
        return { amqp: { bindingVersion: "0.3.0" } }
      }
    }),

  /**
   * Generate AMQP message binding
   */
  generateMessageBinding: (message: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("📨 Enhanced AMQP message binding generation")
      
      try {
        const messageData = message as { config?: AMQPConfig }
        const config = messageData?.config || {}

        const binding: AMQPMessageBinding = {
          bindingVersion: "0.3.0"
        }

        if (config.contentEncoding) {
          binding.contentEncoding = config.contentEncoding
        }

        if (config.messageType) {
          binding.messageType = config.messageType
        }

        yield* Effect.log("✅ AMQP message binding created successfully")
        return { amqp: binding }
      } catch (error) {
        yield* Effect.logError(`❌ AMQP message binding error: ${error}`)
        return { amqp: { bindingVersion: "0.3.0" } }
      }
    }),

  /**
   * TASK M26: Generate AMQP server binding - NOT SUPPORTED
   * AMQP doesn't have server bindings in AsyncAPI 3.0
   */
  generateServerBinding: (server: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("🖥️ AMQP server binding generation (not supported)")
      
      try {
        const serverData = server as AMQPServerData
        
        if (serverData?.protocol && !["amqp", "amqps"].includes(serverData.protocol)) {
          yield* Effect.logWarning(`⚠️ Invalid AMQP protocol: ${serverData.protocol}`)
        }

        yield* Effect.log("✅ AMQP server validation completed (no binding required)")
        return {}
      } catch (error) {
        yield* Effect.logError(`❌ AMQP server binding error: ${error}`)
        return {}
      }
    }),

  /**
   * Enhanced AMQP configuration validation
   */
  validateConfig: (config: unknown) =>
    Effect.gen(function* () {
      yield* Effect.log("🔍 Enhanced AMQP configuration validation")
      
      try {
        if (!config || typeof config !== 'object') {
          yield* Effect.logWarning("⚠️ AMQP config is not an object")
          return false
        }

        const amqpConfig = config as AMQPConfig

        // Validate exchange configuration
        if (amqpConfig.exchange) {
          const exchange = amqpConfig.exchange
          
          if (!exchange.name) {
            yield* Effect.logError("❌ AMQP exchange name is required")
            return false
          }

          if (!["direct", "topic", "fanout", "headers"].includes(exchange.type)) {
            yield* Effect.logError(`❌ Invalid AMQP exchange type: ${exchange.type}`)
            return false
          }
        }

        // Validate queue configuration
        if (amqpConfig.queue) {
          const queue = amqpConfig.queue
          
          if (!queue.name) {
            yield* Effect.logError("❌ AMQP queue name is required")
            return false
          }
        }

        // Validate delivery mode
        if (amqpConfig.deliveryMode && ![1, 2].includes(amqpConfig.deliveryMode)) {
          yield* Effect.logError(`❌ Invalid AMQP delivery mode: ${amqpConfig.deliveryMode}`)
          return false
        }

        // Validate priority
        if (amqpConfig.priority !== undefined && (amqpConfig.priority < 0 || amqpConfig.priority > 255)) {
          yield* Effect.logError(`❌ Invalid AMQP priority: ${amqpConfig.priority} (must be 0-255)`)
          return false
        }

        // Validate consumer configuration
        if (amqpConfig.consumer) {
          const consumer = amqpConfig.consumer
          
          if (consumer.prefetchCount !== undefined && consumer.prefetchCount < 0) {
            yield* Effect.logError(`❌ Invalid prefetchCount: ${consumer.prefetchCount}`)
            return false
          }

          if (consumer.prefetchSize !== undefined && consumer.prefetchSize < 0) {
            yield* Effect.logError(`❌ Invalid prefetchSize: ${consumer.prefetchSize}`)
            return false
          }
        }

        yield* Effect.log("✅ AMQP configuration validation passed")
        return true
      } catch (error) {
        yield* Effect.logError(`❌ AMQP validation error: ${error}`)
        return false
      }
    })
}

/**
 * TASK M26: AMQP Channel Binding Factory with Queue/Exchange Declarations
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

    // Add dead letter exchange support
    if (config.dlx && binding.queue) {
      binding.queue.arguments = {
        ...(binding.queue.arguments || {}),
        "x-dead-letter-exchange": config.dlx.exchange,
        ...(config.dlx.routingKey && { "x-dead-letter-routing-key": config.dlx.routingKey }),
        ...config.dlx.arguments
      }
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

/**
 * TASK M27: AMQP Plugin Testing Support 
 */
export const amqpTestingUtils = {
  /**
   * Create test AMQP operation data
   */
  createTestOperationData: (overrides: Partial<AMQPOperationData> = {}): AMQPOperationData => ({
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
      },
      ...overrides.channel
    },
    operation: {
      name: "testAMQPOperation",
      action: "receive",
      ...overrides.operation
    },
    message: {
      name: "TestAMQPMessage",
      payload: { data: "string" },
      ...overrides.message
    }
  }),

  /**
   * Create test AMQP server data
   */
  createTestServerData: (overrides: Partial<AMQPServerData> = {}): AMQPServerData => ({
    url: "amqp://localhost:5672",
    protocol: "amqp",
    config: {
      vhost: "/",
      heartbeat: 60,
      connectionTimeout: 30000
    },
    ...overrides
  }),

  /**
   * Validate AMQP binding output  
   */
  validateBindingOutput: (binding: unknown): binding is { amqp: AMQPChannelBinding | AMQPOperationBinding | AMQPMessageBinding } => {
    return (
      typeof binding === 'object' &&
      binding !== null &&
      'amqp' in binding &&
      typeof (binding as Record<string, unknown>).amqp === 'object' &&
      'bindingVersion' in ((binding as Record<string, unknown>).amqp as Record<string, unknown>)
    )
  },

  /**
   * Create DLX (Dead Letter Exchange) configuration
   */
  createDLXConfig: (exchangeName: string, routingKey?: string): AMQPConfig['dlx'] => ({
    exchange: exchangeName,
    arguments: {
      "x-message-ttl": 86400000, // 24 hours
      "x-max-retries": 3
    },
    ...(routingKey ? { routingKey } : {})
  })
}