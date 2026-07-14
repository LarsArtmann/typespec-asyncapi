/**
 * AsyncAPI Protocol Definitions - Single Source of Truth
 *
 * All supported AsyncAPI 3.0 protocols defined once.
 * Every other file must import from here.
 */

const PROTOCOLS = [
  "http",
  "https",
  "ws",
  "wss",
  "websocket",
  "mqtt",
  "mqtt5",
  "kafka",
  "amqp",
  "amqp1",
  "nats",
  "jms",
  "sns",
  "sqs",
  "stomp",
  "redis",
  "mercure",
  "ibmmq",
  "pulsar",
] as const;

export type AsyncAPIProtocol = (typeof PROTOCOLS)[number];

export const SUPPORTED_PROTOCOLS: ReadonlySet<string> = new Set(PROTOCOLS);

export function isSupportedProtocol(value: string): value is AsyncAPIProtocol {
  return SUPPORTED_PROTOCOLS.has(value);
}

export const PROTOCOL_LIST: readonly AsyncAPIProtocol[] = PROTOCOLS;
