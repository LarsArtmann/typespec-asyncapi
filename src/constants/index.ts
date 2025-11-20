/**
 * Constants for TypeSpec AsyncAPI Emitter
 */

export const ASYNCAPI_VERSION = "3.0.0";
export const DEFAULT_CONTENT_TYPE = "application/json";

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