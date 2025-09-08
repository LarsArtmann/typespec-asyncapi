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
  bindingVersion: string
}

export type AMQPMessageBinding = {
  contentEncoding?: string
  messageType?: string
  bindingVersion: string
}

// NOTE: This class was unused and causing compilation errors
// Removed EnhancedAMQPPlugin class - functionality is in enhanced-amqp-plugin-refactored.ts


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