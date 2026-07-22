/**
 * AsyncAPI 3.1 Protocol Binding Type Definitions
 *
 * Typed interfaces for protocol-specific binding objects based on the official
 * AsyncAPI binding specifications from @asyncapi/specs/bindings/.
 *
 * These types serve as documentation and provide compile-time guidance.
 * At runtime, binding objects are still `Record<string, unknown>` because
 * TypeSpec value literals (`#{}`) cannot be statically typed at the decorator level.
 *
 * @see https://github.com/asyncapi/bindings
 */

// ============================================================================
// Kafka Bindings (v0.5.0)
// ============================================================================

export type KafkaChannelBinding = {
  topic?: string;
  partitions?: number;
  replicas?: number;
  topicConfiguration?: Record<string, unknown>;
  bindingVersion?: string;
};

export type KafkaOperationBinding = {
  groupId?: Record<string, unknown>;
  clientId?: Record<string, unknown>;
  bindingVersion?: string;
};

export type KafkaMessageBinding = {
  key?: Record<string, unknown>;
  schemaIdLocation?: "header" | "payload";
  schemaIdPayloadEncoding?: string;
  schemaLookupStrategy?: string;
  bindingVersion?: string;
};

// ============================================================================
// AMQP Bindings (v0.3.0)
// ============================================================================

export type AmqpExchange = {
  name?: string;
  type?: "topic" | "direct" | "fanout" | "default" | "headers";
  durable?: boolean;
  autoDelete?: boolean;
  vhost?: string;
};

export type AmqpQueue = {
  name?: string;
  durable?: boolean;
  exclusive?: boolean;
  autoDelete?: boolean;
  vhost?: string;
};

export type AmqpChannelBinding = {
  is?: "queue" | "routingKey";
  exchange?: AmqpExchange;
  queue?: AmqpQueue;
  bindingVersion?: string;
};

export type AmqpOperationBinding = {
  cc?: string;
  bcc?: string;
  replyTo?: string;
  priority?: number;
  deliveryMode?: number;
  mandatory?: boolean;
  timestamp?: boolean;
  ack?: boolean;
  bindingVersion?: string;
};

export type AmqpMessageBinding = {
  contentEncoding?: string;
  messageType?: string;
  bindingVersion?: string;
};

// ============================================================================
// MQTT Bindings (v0.2.0)
// ============================================================================

export type MqttLastWill = {
  topic?: string;
  qos?: 0 | 1 | 2;
  message?: string;
  retain?: boolean;
};

export type MqttServerBinding = {
  clientId?: string;
  cleanSession?: boolean;
  lastWill?: MqttLastWill;
  keepAlive?: number;
  sessionExpiryInterval?: number;
  bindingVersion?: string;
};

export type MqttOperationBinding = {
  qos?: 0 | 1 | 2;
  retain?: boolean;
  messageExpiryInterval?: number;
  bindingVersion?: string;
};

export type MqttMessageBinding = {
  bindingVersion?: string;
};

// ============================================================================
// HTTP Bindings (v0.3.0)
// ============================================================================

export type HttpOperationBinding = {
  type?: "request" | "response";
  method?: string;
  query?: Record<string, unknown>;
  bindingVersion?: string;
};

export type HttpMessageBinding = {
  headers?: Record<string, unknown>;
  bindingVersion?: string;
};

// ============================================================================
// WebSocket Bindings (v0.1.0)
// ============================================================================

export type WebSocketChannelBinding = {
  method?: "GET" | "POST";
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  bindingVersion?: string;
};

// ============================================================================
// Union Types for Documentation
// ============================================================================

/** All known channel binding types keyed by protocol name. */
export type ChannelBindingMap = {
  kafka?: KafkaChannelBinding;
  amqp?: AmqpChannelBinding;
  ws?: WebSocketChannelBinding;
  [key: string]: Record<string, unknown> | undefined;
};

/** All known operation binding types keyed by protocol name. */
export type OperationBindingMap = {
  kafka?: KafkaOperationBinding;
  amqp?: AmqpOperationBinding;
  mqtt?: MqttOperationBinding;
  http?: HttpOperationBinding;
  [key: string]: Record<string, unknown> | undefined;
};

/** All known message binding types keyed by protocol name. */
export type MessageBindingMap = {
  kafka?: KafkaMessageBinding;
  amqp?: AmqpMessageBinding;
  mqtt?: MqttMessageBinding;
  http?: HttpMessageBinding;
  [key: string]: Record<string, unknown> | undefined;
};

/** All known server binding types keyed by protocol name. */
export type ServerBindingMap = {
  mqtt?: MqttServerBinding;
  [key: string]: Record<string, unknown> | undefined;
};
