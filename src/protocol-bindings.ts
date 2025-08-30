/**
 * Protocol Binding Implementation for TypeSpec AsyncAPI Emitter
 * 
 * Provides protocol-specific binding generation and validation for:
 * - Kafka
 * - WebSocket  
 * - HTTP
 */

// Define basic schema types locally to fix import issues
type SchemaObject = {
  type?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  required?: string[];
  description?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: unknown[];
  const?: unknown;
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  allOf?: SchemaObject[];
  not?: SchemaObject;
  additionalProperties?: boolean | SchemaObject;
  default?: unknown;
  example?: unknown;
  examples?: unknown[];
  title?: string;
  multipleOf?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  minProperties?: number;
  maxProperties?: number;
};

type ReferenceObject = {
  $ref: string;
};

// Protocol binding types
type ServerBindings = Record<string, unknown>;
type ChannelBindings = Record<string, unknown>;
type OperationBindings = Record<string, unknown>;
type MessageBindings = Record<string, unknown>;

type KafkaServerBinding = {
  bindingVersion?: string;
  schemaRegistryUrl?: string;
  schemaRegistryVendor?: string;
};

type KafkaChannelBinding = {
  bindingVersion?: string;
  topic?: string;
  partitions?: number;
  replicas?: number;
  topicConfiguration?: Record<string, unknown>;
};

type KafkaOperationBinding = {
  bindingVersion?: string;
  groupId?: SchemaObject | ReferenceObject;
  clientId?: SchemaObject | ReferenceObject;
};

type KafkaMessageBinding = {
  bindingVersion?: string;
  key?: SchemaObject | ReferenceObject;
  schemaIdLocation?: "header" | "payload";
  schemaIdPayloadEncoding?: string;
  schemaLookupStrategy?: "TopicIdStrategy" | "RecordIdStrategy" | "TopicRecordIdStrategy";
};

type WebSocketChannelBinding = {
  bindingVersion?: string;
  method?: "GET" | "POST";
  query?: SchemaObject | ReferenceObject;
  headers?: SchemaObject | ReferenceObject;
};

type WebSocketMessageBinding = {
  bindingVersion?: string;
};

type HttpOperationBinding = {
  bindingVersion?: string;
  type: "request" | "response";
  method?: string;
  query?: SchemaObject | ReferenceObject;
};

type HttpMessageBinding = {
  bindingVersion?: string;
  headers?: SchemaObject | ReferenceObject;
  statusCode?: number;
};

type KafkaTopicConfiguration = Record<string, unknown>;
// Define protocol binding types locally
type ProtocolType = "kafka" | "websocket" | "http" | "mqtt" | "amqp" | "redis" | "nats";

type ProtocolBindingValidationError = {
  protocol: ProtocolType;
  bindingType: "server" | "channel" | "operation" | "message";
  message: string;
  severity: "error" | "warning";
};

type ProtocolBindingValidationResult = {
  isValid: boolean;
  errors: ProtocolBindingValidationError[];
  warnings: ProtocolBindingValidationError[];
};

type KafkaFieldConfig = {
  type: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  format?: string;
};

type KafkaProtocolBindingConfig = {
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
    topicConfiguration?: Record<string, unknown>;
  };
  operation?: {
    groupId?: SchemaObject | ReferenceObject;
    clientId?: SchemaObject | ReferenceObject;
  };
  message?: {
    key?: SchemaObject | ReferenceObject;
    schemaIdLocation?: "header" | "payload";
    schemaIdPayloadEncoding?: string;
    schemaLookupStrategy?: "TopicIdStrategy" | "RecordIdStrategy" | "TopicRecordIdStrategy";
  };
};

type WebSocketProtocolBindingConfig = {
  channel?: {
    method?: "GET" | "POST";
    query?: SchemaObject | ReferenceObject;
    headers?: SchemaObject | ReferenceObject;
  };
  message?: Record<string, unknown>;
};

type HttpProtocolBindingConfig = {
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
};

type ProtocolSpecificConfig = KafkaProtocolBindingConfig | WebSocketProtocolBindingConfig | HttpProtocolBindingConfig;

// Re-export for external use
export type { KafkaFieldConfig, ProtocolType };

// Define protocol support locally
const DEFAULT_PROTOCOL_SUPPORT: Record<ProtocolType, { server: boolean; channel: boolean; operation: boolean; message: boolean }> = {
  kafka: { server: true, channel: true, operation: true, message: true },
  websocket: { server: false, channel: true, operation: false, message: true },
  http: { server: false, channel: false, operation: true, message: true },
  mqtt: { server: true, channel: true, operation: true, message: true },
  amqp: { server: true, channel: true, operation: true, message: true },
  redis: { server: true, channel: true, operation: false, message: false },
  nats: { server: true, channel: true, operation: true, message: true },
};

export type ProtocolBindingConfig = {
  protocol: ProtocolType;
  serverBindings?: ServerBindings;
  channelBindings?: ChannelBindings;
  operationBindings?: OperationBindings;
  messageBindings?: MessageBindings;
}

// Use type alias for Kafka binding configuration from types/protocol-bindings.ts
export type KafkaBindingConfig = Omit<KafkaProtocolBindingConfig, 'protocol' | 'enabled' | 'version'>;

// Use type alias for WebSocket binding configuration from types/protocol-bindings.ts
export type WebSocketBindingConfig = Omit<WebSocketProtocolBindingConfig, 'protocol' | 'enabled' | 'version'>;

// Use type alias for HTTP binding configuration from types/protocol-bindings.ts
export type HttpBindingConfig = Omit<HttpProtocolBindingConfig, 'protocol' | 'enabled' | 'version'>;

export type ProtocolSpecificConfig = KafkaBindingConfig | WebSocketBindingConfig | HttpBindingConfig;

/**
 * Kafka Protocol Binding Builder
 */
export class KafkaProtocolBinding {
  static createServerBinding(config: {
    schemaRegistryUrl?: string;
    schemaRegistryVendor?: string;
    clientId?: string;
    groupId?: string;
  }): KafkaServerBinding {
    return {
      bindingVersion: "0.5.0",
      ...config,
    };
  }

  static createChannelBinding(config: {
    topic?: string;
    partitions?: number;
    replicas?: number;
    topicConfiguration?: KafkaTopicConfiguration;
  }): KafkaChannelBinding {
    return {
      bindingVersion: "0.5.0",
      ...config,
    };
  }

  static createOperationBinding(config: {
    groupId?: KafkaFieldConfig;
    clientId?: KafkaFieldConfig;
  }): KafkaOperationBinding {
    return {
      bindingVersion: "0.5.0",
      ...config,
    };
  }

  static createMessageBinding(config: {
    key?: KafkaFieldConfig;
    schemaIdLocation?: "header" | "payload";
    schemaIdPayloadEncoding?: string;
    schemaLookupStrategy?: "TopicIdStrategy" | "RecordIdStrategy" | "TopicRecordIdStrategy";
  }): KafkaMessageBinding {
    return {
      bindingVersion: "0.5.0",
      ...config,
    };
  }
}

/**
 * WebSocket Protocol Binding Builder
 */
export class WebSocketProtocolBinding {
  static createChannelBinding(config: {
    method?: "GET" | "POST";
    query?: SchemaObject | ReferenceObject;
    headers?: SchemaObject | ReferenceObject;
  }): WebSocketChannelBinding {
    return {
      bindingVersion: "0.1.0",
      ...config,
    };
  }

  static createMessageBinding(): WebSocketMessageBinding {
    return {
      bindingVersion: "0.1.0",
    };
  }
}

/**
 * HTTP Protocol Binding Builder
 */
export class HttpProtocolBinding {
  static createOperationBinding(config: {
    type?: "request" | "response";
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "CONNECT" | "TRACE";
    query?: SchemaObject | ReferenceObject;
    statusCode?: number;
  }): HttpOperationBinding {
    return {
      bindingVersion: "0.3.0",
      ...config,
    };
  }

  static createMessageBinding(config: {
    headers?: SchemaObject | ReferenceObject;
    statusCode?: number;
  }): HttpMessageBinding {
    return {
      bindingVersion: "0.3.0",
      ...config,
    };
  }
}

/**
 * Protocol Binding Factory
 */
export class ProtocolBindingFactory {
  /**
   * Create server bindings for a specific protocol
   */
  static createServerBindings(protocol: ProtocolType, config: KafkaBindingConfig["server"]): ServerBindings | undefined {
    switch (protocol) {
      case "kafka":
        return {
          kafka: KafkaProtocolBinding.createServerBinding(config ?? {}),
        };
      default:
        return undefined;
    }
  }

  /**
   * Create channel bindings for a specific protocol
   */
  static createChannelBindings(protocol: ProtocolType, config: KafkaBindingConfig["channel"] | WebSocketBindingConfig["channel"]): ChannelBindings | undefined {
    switch (protocol) {
      case "kafka":
        return {
          kafka: KafkaProtocolBinding.createChannelBinding((config as KafkaBindingConfig["channel"]) ?? {}),
        };
      case "ws":
        return {
          ws: WebSocketProtocolBinding.createChannelBinding((config as WebSocketBindingConfig["channel"]) ?? {}),
        };
      default:
        return undefined;
    }
  }

  /**
   * Create operation bindings for a specific protocol
   */
  static createOperationBindings(protocol: ProtocolType, config: KafkaBindingConfig["operation"] | HttpBindingConfig["operation"]): OperationBindings | undefined {
    switch (protocol) {
      case "kafka":
        return {
          kafka: KafkaProtocolBinding.createOperationBinding((config as KafkaBindingConfig["operation"]) ?? {}),
        };
      case "http":
      case "https":
        return {
          http: HttpProtocolBinding.createOperationBinding((config as HttpBindingConfig["operation"]) ?? {}),
        };
      default:
        return undefined;
    }
  }

  /**
   * Create message bindings for a specific protocol
   */
  static createMessageBindings(protocol: ProtocolType, config: KafkaBindingConfig["message"] | WebSocketBindingConfig["message"] | HttpBindingConfig["message"]): MessageBindings | undefined {
    switch (protocol) {
      case "kafka":
        return {
          kafka: KafkaProtocolBinding.createMessageBinding((config as KafkaBindingConfig["message"]) ?? {}),
        };
      case "ws":
        return {
          ws: WebSocketProtocolBinding.createMessageBinding(),
        };
      case "http":
      case "https":
        return {
          http: HttpProtocolBinding.createMessageBinding((config as HttpBindingConfig["message"]) ?? {}),
        };
      default:
        return undefined;
    }
  }

  /**
   * Validate protocol-specific binding configuration
   */
  static validateBinding(protocol: ProtocolType, bindingType: "server" | "channel" | "operation" | "message", config: ProtocolSpecificConfig): ProtocolBindingValidationResult {
    const errors: ProtocolBindingValidationError[] = [];
    const warnings: ProtocolBindingValidationError[] = [];

    // Check if protocol supports the binding type
    if (!ProtocolUtils.supportsBinding(protocol, bindingType)) {
      errors.push({
        protocol,
        bindingType,
        message: `Protocol '${protocol}' does not support '${bindingType}' bindings`,
        severity: "error",
      });
      return { isValid: false, errors, warnings };
    }

    switch (protocol) {
      case "kafka":
        errors.push(...this.validateKafkaBinding(bindingType, config as KafkaBindingConfig));
        break;
      case "ws":
        errors.push(...this.validateWebSocketBinding(bindingType, config as WebSocketBindingConfig));
        break;
      case "http":
      case "https":
        errors.push(...this.validateHttpBinding(bindingType, config as HttpBindingConfig));
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static validateKafkaBinding(bindingType: string, config: KafkaBindingConfig): ProtocolBindingValidationError[] {
    const errors: ProtocolBindingValidationError[] = [];

    switch (bindingType) {
      case "channel":
        if (config.channel?.partitions && (typeof config.channel.partitions !== "number" || config.channel.partitions < 1)) {
          errors.push({
            protocol: "kafka",
            bindingType: "channel",
            property: "partitions",
            message: "Kafka channel binding partitions must be a positive integer",
            severity: "error",
          });
        }
        if (config.channel?.replicas && (typeof config.channel.replicas !== "number" || config.channel.replicas < 1)) {
          errors.push({
            protocol: "kafka",
            bindingType: "channel",
            property: "replicas",
            message: "Kafka channel binding replicas must be a positive integer",
            severity: "error",
          });
        }
        break;
      case "message":
        if (config.message?.schemaIdLocation && !["header", "payload"].includes(config.message.schemaIdLocation)) {
          errors.push({
            protocol: "kafka",
            bindingType: "message",
            property: "schemaIdLocation",
            message: "Kafka message binding schemaIdLocation must be 'header' or 'payload'",
            severity: "error",
          });
        }
        if (config.message?.schemaLookupStrategy && !["TopicIdStrategy", "RecordIdStrategy", "TopicRecordIdStrategy"].includes(config.message.schemaLookupStrategy)) {
          errors.push({
            protocol: "kafka",
            bindingType: "message",
            property: "schemaLookupStrategy",
            message: "Kafka message binding schemaLookupStrategy must be valid Kafka strategy",
            severity: "error",
          });
        }
        break;
    }

    return errors;
  }

  private static validateWebSocketBinding(bindingType: string, config: WebSocketBindingConfig): ProtocolBindingValidationError[] {
    const errors: ProtocolBindingValidationError[] = [];

    switch (bindingType) {
      case "channel":
        if (config.channel?.method && !["GET", "POST"].includes(config.channel.method)) {
          errors.push({
            protocol: "ws",
            bindingType: "channel",
            property: "method",
            message: "WebSocket channel binding method must be 'GET' or 'POST'",
            severity: "error",
          });
        }
        break;
    }

    return errors;
  }

  private static validateHttpBinding(bindingType: string, config: HttpBindingConfig): ProtocolBindingValidationError[] {
    const errors: ProtocolBindingValidationError[] = [];

    switch (bindingType) {
      case "operation":
        if (config.operation?.type && !["request", "response"].includes(config.operation.type)) {
          errors.push({
            protocol: "http",
            bindingType: "operation",
            property: "type",
            message: "HTTP operation binding type must be 'request' or 'response'",
            severity: "error",
          });
        }
        if (config.operation?.method) {
          const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "CONNECT", "TRACE"];
          if (!validMethods.includes(config.operation.method)) {
            errors.push({
              protocol: "http",
              bindingType: "operation",
              property: "method",
              message: `HTTP operation binding method must be one of: ${validMethods.join(", ")}`,
              severity: "error",
            });
          }
        }
        if (config.operation?.statusCode && (typeof config.operation.statusCode !== "number" || config.operation.statusCode < 100 || config.operation.statusCode > 599)) {
          errors.push({
            protocol: "http",
            bindingType: "operation",
            property: "statusCode",
            message: "HTTP operation binding statusCode must be a valid HTTP status code (100-599)",
            severity: "error",
          });
        }
        break;
      case "message":
        if (config.message?.statusCode && (typeof config.message.statusCode !== "number" || config.message.statusCode < 100 || config.message.statusCode > 599)) {
          errors.push({
            protocol: "http",
            bindingType: "message",
            property: "statusCode",
            message: "HTTP message binding statusCode must be a valid HTTP status code (100-599)",
            severity: "error",
          });
        }
        break;
    }

    return errors;
  }

  /**
   * Get default configuration for a protocol
   */
  static getDefaultConfig(protocol: ProtocolType): ProtocolSpecificConfig {
    switch (protocol) {
      case "kafka":
        return {
          server: {
            schemaRegistryVendor: "confluent",
          },
          channel: {
            partitions: 1,
            replicas: 1,
          },
          operation: {
            clientId: {
              type: "string",
              description: "Kafka client ID",
            } as KafkaFieldConfig,
          },
          message: {
            schemaIdLocation: "payload",
            schemaLookupStrategy: "TopicIdStrategy",
          },
        };
      case "ws":
        return {
          channel: {
            method: "GET",
          },
          message: {},
        };
      case "http":
      case "https":
        return {
          operation: {
            type: "request",
            method: "POST",
          },
          message: {
            statusCode: 200,
          },
        };
      default:
        return {};
    }
  }
}

/**
 * Utility functions for protocol detection and validation
 */
export class ProtocolUtils {
  /**
   * Determine if a protocol supports specific binding types
   */
  static supportsBinding(protocol: ProtocolType, bindingType: "server" | "channel" | "operation" | "message"): boolean {
    return DEFAULT_PROTOCOL_SUPPORT[protocol]?.[bindingType] ?? false;
  }

  /**
   * Extract protocol from URL or protocol string
   */
  static extractProtocol(protocolOrUrl: string): ProtocolType | null {
    if (protocolOrUrl.includes("://")) {
      const protocol = protocolOrUrl.split("://")[0]?.toLowerCase();
      return protocol && this.isValidProtocol(protocol) ? (protocol as ProtocolType) : null;
    }
    
    const protocol = protocolOrUrl.toLowerCase();
    return this.isValidProtocol(protocol) ? (protocol as ProtocolType) : null;
  }

  /**
   * Check if a string is a valid protocol
   */
  static isValidProtocol(protocol: string): boolean {
    const validProtocols: ProtocolType[] = ["kafka", "ws", "http", "https", "amqp", "mqtt"];
    return validProtocols.includes(protocol as ProtocolType);
  }

  /**
   * Get protocol-specific default ports
   */
  static getDefaultPort(protocol: ProtocolType): number | undefined {
    const defaultPorts: Record<ProtocolType, number> = {
      kafka: 9092,
      ws: 80,
      http: 80,
      https: 443,
      amqp: 5672,
      mqtt: 1883,
    };

    return defaultPorts[protocol];
  }
}