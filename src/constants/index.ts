/**
 * Constants for TypeSpec AsyncAPI Emitter
 */

export const ASYNCAPI_VERSION = "3.0.0";
export const DEFAULT_CONTENT_TYPE = "application/json";

/**
 * 🚨 LEGACY COMPATIBILITY: These exports exist for test compatibility
 * 
 * TODO: REFACTOR TESTS to use proper version management
 * TODO: IMPLEMENT semantic versioning throughout system
 * TODO: REMOVE legacy version array in favor of single version
 * TODO: CONSOLIDATE version sources to eliminate split brain
 */
export const ASYNCAPI_VERSIONS = {
  CURRENT: ASYNCAPI_VERSION,
  SUPPORTED: ["3.0.0"],
  LATEST: "3.0.0",
  COMPATIBILITY: {
    MIN: "3.0.0",
    MAX: "3.0.0",
  },
} as const;

/**
 * 🚨 LEGACY CONFIGURATION: Default configuration for test compatibility
 * 
 * TODO: REPLACE with proper configuration system
 * TODO: IMPLEMENT environment-based configuration
 * TODO: REMOVE hardcoded defaults in favor of dynamic config
 * TODO: CONSOLIDATE configuration sources to eliminate split brain
 */
export const DEFAULT_CONFIG = {
  version: ASYNCAPI_VERSION,
  title: "AsyncAPI Specification",
  description: "Generated AsyncAPI specification from TypeSpec",
  contentType: DEFAULT_CONTENT_TYPE,
  server: {
    url: "http://localhost:3000",
    protocol: "http",
    description: "Default development server",
  },
  output: {
    file: "asyncapi.yaml",
    format: "yaml",
  },
  validation: {
    strict: true,
    warnings: true,
  },
} as const;

export const PROTOCOL_DEFAULTS = {
  HTTP: "http",
  KAFKA: "kafka",
  MQTT: "mqtt",
  WEBSOCKET: "ws",
  AMQP: "amqp",
  NATS: "nats",
  REDIS: "redis",
} as const;

export type ProtocolType = typeof PROTOCOL_DEFAULTS[keyof typeof PROTOCOL_DEFAULTS];

export const BINDING_DEFAULTS = {
  KAFKA: "kafka",
  HTTP: "http",
  WEBSOCKET: "ws",
  MQTT: "mqtt",
  AMQP: "amqp",
  AMQP1: "amqp1",
  AMQP091: "amqp091",
  NATS: "nats",
  REDIS: "redis",
  STOMP: "stomp",
  JMS: "jms",
  SNS: "sns",
  SQS: "sqs",
  GOOGLE_PUBSUB: "googlepubsub",
  PULSAR: "pulsar",
} as const;

export type BindingType = typeof BINDING_DEFAULTS[keyof typeof BINDING_DEFAULTS];