import type { DecoratorContext, Model, Operation, Type } from "@typespec/compiler";
import { reportDiagnostic, stateKeys } from "../lib.js";

export type ProtocolType = "kafka" | "websocket" | "http" | "amqp" | "mqtt" | "redis";

export interface KafkaBindingConfig {
  /** Kafka topic name */
  topic?: string;
  /** Partition key field */
  key?: string;
  /** Schema registry configuration */
  schemaIdLocation?: "payload" | "header";
  /** Schema registry ID */
  schemaId?: number;
  /** Schema lookup strategy */
  schemaLookupStrategy?: "TopicIdStrategy" | "RecordNameStrategy" | "TopicRecordNameStrategy";
  /** Consumer group ID */
  groupId?: string;
  /** Client ID */
  clientId?: string;
}

export interface WebSocketBindingConfig {
  /** WebSocket method (GET only for WebSocket upgrade) */
  method?: "GET";
  /** Query parameters schema */
  query?: Record<string, unknown>;
  /** Headers schema */
  headers?: Record<string, unknown>;
  /** Subprotocol */
  subprotocol?: string;
}

export interface HttpBindingConfig {
  /** HTTP method */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
  /** Query parameters schema */
  query?: Record<string, unknown>;
  /** Headers schema */
  headers?: Record<string, unknown>;
  /** Request/response status codes */
  statusCode?: number;
}

export interface AMQPBindingConfig {
  /** Exchange name */
  exchange?: string;
  /** Queue name */
  queue?: string;
  /** Routing key */
  routingKey?: string;
  /** Message delivery mode */
  deliveryMode?: 1 | 2; // 1 = non-persistent, 2 = persistent
  /** Message priority */
  priority?: number;
  /** Message TTL in milliseconds */
  expiration?: number;
}

export interface MQTTBindingConfig {
  /** Topic name */
  topic?: string;
  /** Quality of Service level */
  qos?: 0 | 1 | 2;
  /** Retain flag */
  retain?: boolean;
  /** Clean session flag */
  cleanSession?: boolean;
  /** Keep alive interval */
  keepAlive?: number;
}

export interface RedisBindingConfig {
  /** Redis channel or stream */
  channel?: string;
  /** Redis stream consumer group */
  consumerGroup?: string;
  /** Redis message ID */
  messageId?: string;
}

export interface ProtocolConfig {
  /** Protocol type */
  protocol: ProtocolType;
  /** Protocol-specific binding configuration */
  binding: KafkaBindingConfig | WebSocketBindingConfig | HttpBindingConfig | AMQPBindingConfig | MQTTBindingConfig | RedisBindingConfig;
  /** Additional protocol metadata */
  version?: string;
  /** Protocol description */
  description?: string;
}

/**
 * @protocol decorator for defining AsyncAPI protocol bindings
 * 
 * Applies protocol-specific binding information to operations, channels, or servers.
 * Supports Kafka, WebSocket, HTTP, AMQP, MQTT, and Redis protocols.
 * 
 * @example
 * ```typespec
 * @protocol({
 *   protocol: "kafka",
 *   binding: {
 *     topic: "user-events",
 *     key: "userId",
 *     groupId: "user-service",
 *     schemaIdLocation: "header"
 *   }
 * })
 * @channel("user.registered")
 * @publish
 * op publishUserRegistered(@message user: UserRegisteredMessage): void;
 * ```
 */
export function $protocol(
  context: DecoratorContext, 
  target: Operation | Model, 
  config: ProtocolConfig
): void {
  console.log(`= PROCESSING @protocol decorator on: ${target.kind} ${target.name || 'unnamed'}`);
  console.log(`=� Protocol config:`, config);
  console.log(`<�  Target type: ${target.kind}`);
  
  if (target.kind !== "Operation" && target.kind !== "Model") {
    reportDiagnostic(context.program, {
      code: "invalid-protocol-target",
      target: target,
      format: { targetType: (target as any).kind || 'unknown' },
    });
    return;
  }

  // Validate protocol configuration
  if (!config || !config.protocol) {
    reportDiagnostic(context.program, {
      code: "missing-protocol-type",
      target: target,
    });
    return;
  }

  // Validate protocol type
  const validProtocols: ProtocolType[] = ["kafka", "websocket", "http", "amqp", "mqtt", "redis"];
  if (!validProtocols.includes(config.protocol)) {
    reportDiagnostic(context.program, {
      code: "invalid-protocol-type",
      target: target,
      format: { protocol: config.protocol, validProtocols: validProtocols.join(", ") },
    });
    return;
  }

  // Validate protocol-specific binding configuration
  const validationResult = validateProtocolBinding(config.protocol, config.binding);
  if (!validationResult.valid) {
    console.log(`�  Protocol binding validation warnings:`, validationResult.warnings);
    validationResult.warnings.forEach(warning => {
      console.log(`�  ${warning}`);
    });
  }

  console.log(`=� Validated protocol config for ${config.protocol}:`, config);

  // Store protocol configuration in program state
  const protocolMap = context.program.stateMap(stateKeys.protocolConfigs);
  protocolMap.set(target, config);
  
  console.log(` Successfully stored protocol config for ${target.kind} ${target.name || 'unnamed'}`);
  console.log(`=� Total entities with protocol config: ${protocolMap.size}`);
}

/**
 * Validate protocol-specific binding configuration
 */
function validateProtocolBinding(protocol: ProtocolType, binding: unknown): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  switch (protocol) {
    case "kafka":
      const kafkaBinding = binding as KafkaBindingConfig;
      if (kafkaBinding.schemaId && !kafkaBinding.schemaIdLocation) {
        warnings.push("schemaId specified without schemaIdLocation - defaulting to 'payload'");
      }
      if (kafkaBinding.schemaLookupStrategy && !kafkaBinding.schemaId) {
        warnings.push("schemaLookupStrategy specified without schemaId - may not work as expected");
      }
      break;
      
    case "websocket":
      const wsBinding = binding as WebSocketBindingConfig;
      if (wsBinding.method && wsBinding.method !== "GET") {
        warnings.push("WebSocket binding method should be GET for upgrade requests");
      }
      break;
      
    case "http":
      const httpBinding = binding as HttpBindingConfig;
      if (httpBinding.statusCode && (httpBinding.statusCode < 100 || httpBinding.statusCode > 599)) {
        warnings.push("HTTP status code should be between 100-599");
      }
      break;
      
    case "amqp":
      const amqpBinding = binding as AMQPBindingConfig;
      if (amqpBinding.deliveryMode && ![1, 2].includes(amqpBinding.deliveryMode)) {
        warnings.push("AMQP delivery mode should be 1 (non-persistent) or 2 (persistent)");
      }
      if (amqpBinding.priority && (amqpBinding.priority < 0 || amqpBinding.priority > 255)) {
        warnings.push("AMQP priority should be between 0-255");
      }
      break;
      
    case "mqtt":
      const mqttBinding = binding as MQTTBindingConfig;
      if (mqttBinding.qos && ![0, 1, 2].includes(mqttBinding.qos)) {
        warnings.push("MQTT QoS should be 0, 1, or 2");
      }
      break;
      
    case "redis":
      // Redis validation could check for valid channel patterns, etc.
      break;
  }
  
  return { valid: warnings.length === 0, warnings };
}

/**
 * Get protocol configuration for a target
 */
export function getProtocolConfig(context: DecoratorContext, target: Operation | Model): ProtocolConfig | undefined {
  const protocolMap = context.program.stateMap(stateKeys.protocolConfigs);
  return protocolMap.get(target);
}

/**
 * Check if a target has protocol configuration
 */
export function hasProtocolBinding(context: DecoratorContext, target: Operation | Model): boolean {
  const protocolMap = context.program.stateMap(stateKeys.protocolConfigs);
  return protocolMap.has(target);
}

/**
 * Get all protocol configurations in the program
 */
export function getAllProtocolConfigs(context: DecoratorContext): Map<Type, ProtocolConfig> {
  return context.program.stateMap(stateKeys.protocolConfigs);
}