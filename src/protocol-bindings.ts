/**
 * Protocol Binding Implementation for TypeSpec AsyncAPI Emitter
 * 
 * Provides protocol-specific binding generation and validation for:
 * - Kafka
 * - WebSocket  
 * - HTTP
 */

import type {
  ServerBindings,
  ChannelBindings,
  OperationBindings,
  MessageBindings,
  KafkaServerBinding,
  KafkaChannelBinding,
  KafkaOperationBinding,
  KafkaMessageBinding,
  WebSocketChannelBinding,
  WebSocketMessageBinding,
  HttpOperationBinding,
  HttpMessageBinding,
  SchemaObject,
  ReferenceObject,
  KafkaTopicConfiguration,
} from "./types/asyncapi.js";

export type ProtocolType = "kafka" | "ws" | "http" | "https" | "amqp" | "mqtt";

export interface ProtocolBindingConfig {
  protocol: ProtocolType;
  serverBindings?: ServerBindings;
  channelBindings?: ChannelBindings;
  operationBindings?: OperationBindings;
  messageBindings?: MessageBindings;
}

export interface KafkaBindingConfig {
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
    groupId?: { type?: "string" | "integer"; enum?: string[] | number[]; description?: string };
    clientId?: { type?: "string" | "integer"; enum?: string[] | number[]; description?: string };
  };
  message?: {
    key?: { type?: "string" | "integer"; enum?: string[] | number[]; description?: string };
    schemaIdLocation?: "header" | "payload";
    schemaIdPayloadEncoding?: string;
    schemaLookupStrategy?: "TopicIdStrategy" | "RecordIdStrategy" | "TopicRecordIdStrategy";
  };
}

export interface WebSocketBindingConfig {
  channel?: {
    method?: "GET" | "POST";
    query?: SchemaObject | ReferenceObject;
    headers?: SchemaObject | ReferenceObject;
  };
  message?: Record<string, never>; // WebSocket message bindings are empty
}

export interface HttpBindingConfig {
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
    groupId?: { type?: "string" | "integer"; enum?: string[] | number[]; description?: string };
    clientId?: { type?: "string" | "integer"; enum?: string[] | number[]; description?: string };
  }): KafkaOperationBinding {
    return {
      bindingVersion: "0.5.0",
      ...config,
    };
  }

  static createMessageBinding(config: {
    key?: { type?: "string" | "integer"; enum?: string[] | number[]; description?: string };
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
          kafka: KafkaProtocolBinding.createServerBinding(config),
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
          kafka: KafkaProtocolBinding.createChannelBinding(config),
        };
      case "ws":
        return {
          ws: WebSocketProtocolBinding.createChannelBinding(config),
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
          kafka: KafkaProtocolBinding.createOperationBinding(config),
        };
      case "http":
      case "https":
        return {
          http: HttpProtocolBinding.createOperationBinding(config),
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
          kafka: KafkaProtocolBinding.createMessageBinding(config),
        };
      case "ws":
        return {
          ws: WebSocketProtocolBinding.createMessageBinding(),
        };
      case "http":
      case "https":
        return {
          http: HttpProtocolBinding.createMessageBinding(config),
        };
      default:
        return undefined;
    }
  }

  /**
   * Validate protocol-specific binding configuration
   */
  static validateBinding(protocol: ProtocolType, bindingType: "server" | "channel" | "operation" | "message", config: ProtocolSpecificConfig): string[] {
    const errors: string[] = [];

    switch (protocol) {
      case "kafka":
        errors.push(...this.validateKafkaBinding(bindingType, config));
        break;
      case "ws":
        errors.push(...this.validateWebSocketBinding(bindingType, config));
        break;
      case "http":
      case "https":
        errors.push(...this.validateHttpBinding(bindingType, config));
        break;
    }

    return errors;
  }

  private static validateKafkaBinding(bindingType: string, config: KafkaBindingConfig): string[] {
    const errors: string[] = [];

    switch (bindingType) {
      case "channel":
        if (config.channel?.partitions && (typeof config.channel.partitions !== "number" || config.channel.partitions < 1)) {
          errors.push("Kafka channel binding partitions must be a positive integer");
        }
        if (config.channel?.replicas && (typeof config.channel.replicas !== "number" || config.channel.replicas < 1)) {
          errors.push("Kafka channel binding replicas must be a positive integer");
        }
        break;
      case "message":
        if (config.message?.schemaIdLocation && !["header", "payload"].includes(config.message.schemaIdLocation)) {
          errors.push("Kafka message binding schemaIdLocation must be 'header' or 'payload'");
        }
        if (config.message?.schemaLookupStrategy && !["TopicIdStrategy", "RecordIdStrategy", "TopicRecordIdStrategy"].includes(config.message.schemaLookupStrategy)) {
          errors.push("Kafka message binding schemaLookupStrategy must be valid Kafka strategy");
        }
        break;
    }

    return errors;
  }

  private static validateWebSocketBinding(bindingType: string, config: WebSocketBindingConfig): string[] {
    const errors: string[] = [];

    switch (bindingType) {
      case "channel":
        if (config.channel?.method && !["GET", "POST"].includes(config.channel.method)) {
          errors.push("WebSocket channel binding method must be 'GET' or 'POST'");
        }
        break;
    }

    return errors;
  }

  private static validateHttpBinding(bindingType: string, config: HttpBindingConfig): string[] {
    const errors: string[] = [];

    switch (bindingType) {
      case "operation":
        if (config.operation?.type && !["request", "response"].includes(config.operation.type)) {
          errors.push("HTTP operation binding type must be 'request' or 'response'");
        }
        if (config.operation?.method) {
          const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "CONNECT", "TRACE"];
          if (!validMethods.includes(config.operation.method)) {
            errors.push(`HTTP operation binding method must be one of: ${validMethods.join(", ")}`);
          }
        }
        if (config.operation?.statusCode && (typeof config.operation.statusCode !== "number" || config.operation.statusCode < 100 || config.operation.statusCode > 599)) {
          errors.push("HTTP operation binding statusCode must be a valid HTTP status code (100-599)");
        }
        break;
      case "message":
        if (config.message?.statusCode && (typeof config.message.statusCode !== "number" || config.message.statusCode < 100 || config.message.statusCode > 599)) {
          errors.push("HTTP message binding statusCode must be a valid HTTP status code (100-599)");
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
            },
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
    const supportMatrix: Record<ProtocolType, Set<string>> = {
      kafka: new Set(["server", "channel", "operation", "message"]),
      ws: new Set(["channel", "message"]),
      http: new Set(["operation", "message"]),
      https: new Set(["operation", "message"]),
      amqp: new Set(["server", "channel", "operation", "message"]),
      mqtt: new Set(["server", "operation", "message"]),
    };

    return supportMatrix[protocol]?.has(bindingType) || false;
  }

  /**
   * Extract protocol from URL or protocol string
   */
  static extractProtocol(protocolOrUrl: string): ProtocolType | null {
    if (protocolOrUrl.includes("://")) {
      const protocol = protocolOrUrl.split("://")[0].toLowerCase();
      return this.isValidProtocol(protocol) ? (protocol as ProtocolType) : null;
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