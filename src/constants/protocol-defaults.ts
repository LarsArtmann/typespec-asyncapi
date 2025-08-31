/**
 * Protocol default configurations and constants
 * 
 * Centralized location for protocol-specific default values
 * used across the AsyncAPI TypeSpec emitter.
 */

import type {ProtocolType} from "../protocol-bindings.js"

/**
 * All supported protocol types for validation
 * 
 * Centralized list of all protocols supported by the AsyncAPI TypeSpec emitter.
 * Used for validation in decorators and configuration.
 */
export const SUPPORTED_PROTOCOLS: readonly ProtocolType[] = [
	"kafka", 
	"websocket", 
	"http", 
	"amqp", 
	"mqtt", 
	"redis"
] as const

/**
 * Default port numbers for each supported protocol
 * 
 * These are the standard default ports used by each protocol
 * when no explicit port is specified in server configurations.
 */
export const DEFAULT_PROTOCOL_PORTS: Record<ProtocolType, number> = {
	kafka: 9092,
	websocket: 80,
	ws: 80,
	http: 80,
	https: 443,
	amqp: 5672,
	mqtt: 1883,
	redis: 6379,
	nats: 4222,
} as const

/**
 * Get the default port for a specific protocol
 * 
 * @param protocol The protocol type
 * @returns The default port number for the protocol, or undefined if not found
 */
export function getDefaultProtocolPort(protocol: ProtocolType): number | undefined {
	return DEFAULT_PROTOCOL_PORTS[protocol]
}