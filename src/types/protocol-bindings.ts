/**
 * Protocol Binding Type Definitions for TypeSpec AsyncAPI Emitter
 * 
 * Provides strict type-safe protocol binding interfaces with proper
 * type hierarchy and validation for all supported protocols.
 */

import type {
  ServerBindings,
  ChannelBindings,
  OperationBindings,
  MessageBindings,
  SchemaObject,
  ReferenceObject,
  KafkaTopicConfiguration,
} from "./asyncapi.js";

/**
 * Supported protocol types
 */
export type ProtocolType = "kafka" | "ws" | "http" | "https" | "amqp" | "mqtt";

/**
 * Common Kafka field configuration for type, enum, and description
 */
export interface KafkaFieldConfig {
  type?: "string" | "integer";
  enum?: string[] | number[];
  description?: string;
}

/**
 * Base protocol binding configuration interface
 */
export interface BaseProtocolBindingConfig {
  protocol: ProtocolType;
  enabled?: boolean;
  version?: string;
}

/**
 * Kafka-specific binding configuration
 */
export interface KafkaProtocolBindingConfig extends BaseProtocolBindingConfig {
  protocol: "kafka";
  server?: {
    schemaRegistryUrl?: string;
    schemaRegistryVendor?: string;
    clientId?: string;
    groupId?: string;
  };
  channel?: {
    topic?: string;
    partitions?: number;
    replicas?: number;
    topicConfiguration?: KafkaTopicConfiguration;
  };
  operation?: {
    groupId?: KafkaFieldConfig;
    clientId?: KafkaFieldConfig;
  };
  message?: {
    key?: KafkaFieldConfig;
    schemaIdLocation?: "header" | "payload";
    schemaIdPayloadEncoding?: string;
    schemaLookupStrategy?: "TopicIdStrategy" | "RecordIdStrategy" | "TopicRecordIdStrategy";
  };
}

/**
 * WebSocket-specific binding configuration
 */
export interface WebSocketProtocolBindingConfig extends BaseProtocolBindingConfig {
  protocol: "ws";
  channel?: {
    method?: "GET" | "POST";
    query?: SchemaObject | ReferenceObject;
    headers?: SchemaObject | ReferenceObject;
  };
  message?: Record<string, never>; // WebSocket message bindings are empty
}

/**
 * HTTP-specific binding configuration
 */
export interface HttpProtocolBindingConfig extends BaseProtocolBindingConfig {
  protocol: "http" | "https";
  operation?: {
    type?: "request" | "response";
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "CONNECT" | "TRACE";
    query?: SchemaObject | ReferenceObject;
    statusCode?: number;
  };
  message?: {
    headers?: SchemaObject | ReferenceObject;
    statusCode?: number;
  };
}

/**
 * Union type for all protocol-specific configurations
 */
export type ProtocolBindingConfig = 
  | KafkaProtocolBindingConfig 
  | WebSocketProtocolBindingConfig 
  | HttpProtocolBindingConfig;

/**
 * Protocol binding factory configuration
 */
export interface ProtocolBindingFactoryConfig {
  defaultProtocol?: ProtocolType;
  strictValidation?: boolean;
  supportedProtocols?: ProtocolType[];
}

/**
 * Protocol-specific binding validation error
 */
export interface ProtocolBindingValidationError {
  protocol: ProtocolType;
  bindingType: "server" | "channel" | "operation" | "message";
  property?: string;
  message: string;
  severity: "error" | "warning";
}

/**
 * Protocol binding validation result
 */
export interface ProtocolBindingValidationResult {
  isValid: boolean;
  errors: ProtocolBindingValidationError[];
  warnings: ProtocolBindingValidationError[];
}

/**
 * Type-safe binding creation parameters for each protocol
 */
export interface ProtocolBindingParams {
  kafka: {
    server?: KafkaProtocolBindingConfig["server"];
    channel?: KafkaProtocolBindingConfig["channel"];
    operation?: KafkaProtocolBindingConfig["operation"];
    message?: KafkaProtocolBindingConfig["message"];
  };
  ws: {
    channel?: WebSocketProtocolBindingConfig["channel"];
    message?: WebSocketProtocolBindingConfig["message"];
  };
  http: {
    operation?: HttpProtocolBindingConfig["operation"];
    message?: HttpProtocolBindingConfig["message"];
  };
  https: {
    operation?: HttpProtocolBindingConfig["operation"];
    message?: HttpProtocolBindingConfig["message"];
  };
  amqp: Record<string, never>; // Future implementation
  mqtt: Record<string, never>; // Future implementation
}

/**
 * Protocol binding support matrix
 */
export type ProtocolBindingSupportMatrix = {
  [K in ProtocolType]: {
    server: boolean;
    channel: boolean;
    operation: boolean;
    message: boolean;
  };
};

/**
 * Default protocol binding support matrix
 */
export const DEFAULT_PROTOCOL_SUPPORT: ProtocolBindingSupportMatrix = {
  kafka: {
    server: true,
    channel: true,
    operation: true,
    message: true,
  },
  ws: {
    server: false,
    channel: true,
    operation: false,
    message: true,
  },
  http: {
    server: false,
    channel: false,
    operation: true,
    message: true,
  },
  https: {
    server: false,
    channel: false,
    operation: true,
    message: true,
  },
  amqp: {
    server: true,
    channel: true,
    operation: true,
    message: true,
  },
  mqtt: {
    server: true,
    channel: false,
    operation: true,
    message: true,
  },
} as const;

/**
 * Type guard functions for protocol binding configurations
 */
export const isKafkaBindingConfig = (config: ProtocolBindingConfig): config is KafkaProtocolBindingConfig => {
  return config.protocol === "kafka";
};

export const isWebSocketBindingConfig = (config: ProtocolBindingConfig): config is WebSocketProtocolBindingConfig => {
  return config.protocol === "ws";
};

export const isHttpBindingConfig = (config: ProtocolBindingConfig): config is HttpProtocolBindingConfig => {
  return config.protocol === "http" || config.protocol === "https";
};

/**
 * Type-safe protocol binding parameter extraction
 */
export type ExtractBindingParams<T extends ProtocolType> = T extends keyof ProtocolBindingParams 
  ? ProtocolBindingParams[T] 
  : never;

/**
 * Protocol binding result types
 */
export interface ProtocolBindingResult {
  serverBindings?: ServerBindings;
  channelBindings?: ChannelBindings;
  operationBindings?: OperationBindings;
  messageBindings?: MessageBindings;
}

/**
 * Runtime protocol binding configuration with validation
 */
export interface ValidatedProtocolBindingConfig {
  config: ProtocolBindingConfig;
  validationResult: ProtocolBindingValidationResult;
  timestamp: Date;
}