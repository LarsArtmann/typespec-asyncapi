/**
 * CONSTANTS FOR TYPESPEC ASYNCAPI EMITTER
 * 
 * REFACTORED: Eliminated all TODOs through comprehensive system replacement
 * Consolidated version management, path handling, and configuration
 */

// Core constants
import { CURRENT_ASYNCAPI_VERSION, SUPPORTED_ASYNCAPI_VERSIONS } from "./version.js";
export const ASYNCAPI_VERSION = CURRENT_ASYNCAPI_VERSION;
export const DEFAULT_CONTENT_TYPE = "application/json";

// Protocol constants
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

// Binding constants
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

// Re-export comprehensive systems (no more TODOs)
export { versionUtils, VERSION_INFO, type AsyncAPIVersion, type SemanticVersion, type CompatibilityRange } from "./version.js";
export { pathUtils, pathValidation, pathTransformation, type ValidatedPath, type AbsolutePath, type RelativePath, type FilePath, type DirectoryPath } from "./paths.js";
export { configUtils, configurationUtils, type Configuration, type ConfigurationInput } from "./config.js";

// Legacy compatibility exports (maintained for test compatibility)
export const ASYNCAPI_VERSIONS = {
  CURRENT: CURRENT_ASYNCAPI_VERSION,
  SUPPORTED: SUPPORTED_ASYNCAPI_VERSIONS,
  LATEST: CURRENT_ASYNCAPI_VERSION,
  COMPATIBILITY: {
    MIN: CURRENT_ASYNCAPI_VERSION,
    MAX: CURRENT_ASYNCAPI_VERSION,
  },
} as const;

export const DEFAULT_CONFIG = {
  version: CURRENT_ASYNCAPI_VERSION,
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
  libraryName: "@lars-artmann/typespec-asyncapi",
} as const;