/**
 * Protocol Defaults - Legacy Compatibility for Tests
 *
 * Provides protocol types and supported protocols for AsyncAPI bindings.
 * This file exists to support test compatibility with AsyncAPI 3.0 standard.
 */

export const SUPPORTED_PROTOCOLS = [
  "http",
  "ws",
  "mqtt",
  "kafka",
  "amqp",
  "nats",
  "redis",
  "stomp",
  "jms",
] as const;

export type AsyncAPIProtocolType = (typeof SUPPORTED_PROTOCOLS)[number];

/**
 * Protocol binding configuration defaults
 */
export const PROTOCOL_BINDING_DEFAULTS = {
  http: {
    version: "0.5.0",
    method: "POST",
    contentType: "application/json",
  },
  ws: {
    version: "0.5.0",
    subprotocol: "asyncapi",
  },
  mqtt: {
    version: "0.5.0",
    qos: 1,
    retain: false,
  },
  kafka: {
    version: "0.5.0",
    clientId: "typespec-asyncapi",
  },
  amqp: {
    version: "0.5.0",
  },
  nats: {
    version: "0.5.0",
  },
  redis: {
    version: "0.5.0",
  },
  stomp: {
    version: "0.5.0",
  },
  jms: {
    version: "0.5.0",
  },
} as const;

/**
 * Check if protocol is supported
 */
export function isSupportedProtocol(protocol: string): protocol is AsyncAPIProtocolType {
  return SUPPORTED_PROTOCOLS.includes(protocol as AsyncAPIProtocolType);
}

/**
 * Get binding defaults for protocol
 */
export function getProtocolBindingDefaults(protocol: AsyncAPIProtocolType) {
  return PROTOCOL_BINDING_DEFAULTS[protocol];
}
