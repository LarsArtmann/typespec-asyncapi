/**
 * Protocol default configurations and constants
 * 
 * Centralized location for protocol-specific default values
 * used across the AsyncAPI TypeSpec emitter.
 */

/**
 * Standard AsyncAPI protocol types
 * 
 * Based on AsyncAPI 3.0 specification protocol values
 * Used for validation in decorators and configuration.
 */
export type AsyncAPIProtocolType = 
	| "kafka" 
	| "websocket" 
	| "http" 
	| "amqp" 
	| "mqtt" 
	| "redis" 
	| "ws"
	| "https"
	| "amqps"
	| "nats"

/**
 * All supported protocol types for validation
 * 
 * Centralized list of all protocols supported by the AsyncAPI TypeSpec emitter.
 * Used for validation in decorators and configuration.
 */
export const SUPPORTED_PROTOCOLS: readonly AsyncAPIProtocolType[] = [
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
export const DEFAULT_PROTOCOL_PORTS: Record<string, number> = {
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
 * Protocol-specific default configurations
 */
export const PROTOCOL_DEFAULTS = {
	kafka: {
		port: 9092,
		defaultTopic: "events",
		defaultGroupId: "consumer-group",
		defaultClientId: "typespec-client",
		schemaIdLocation: "payload",
	},
	websocket: {
		port: 80,
		method: "GET",
		subprotocol: undefined,
	},
	http: {
		port: 80,
		method: "POST",
		contentType: "application/json",
	},
	amqp: {
		port: 5672,
		exchange: "events",
		routingKey: "default",
		deliveryMode: 2, // Persistent
	},
	mqtt: {
		port: 1883,
		qos: 1,
		retain: false,
		cleanSession: true,
	},
	redis: {
		port: 6379,
		channel: "events",
		messageId: "*",
	},
} as const

/**
 * Get the default port for a specific protocol
 * 
 * @param protocol The protocol type
 * @returns The default port number for the protocol, or undefined if not found
 */
export function getDefaultProtocolPort(protocol: AsyncAPIProtocolType): number | undefined {
	return DEFAULT_PROTOCOL_PORTS[protocol]
}