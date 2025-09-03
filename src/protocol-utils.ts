import type {ProtocolType} from "./protocol-type.js"

/**
 * Protocol utility functions
 * TODO: USE IT?
 */
export class ProtocolUtils {
	static isValidProtocol(protocol: string): boolean {
		const validProtocols: ProtocolType[] = ["kafka", "ws", "websocket", "http", "https", "amqp", "mqtt", "redis", "nats"]
		return validProtocols.includes(protocol as ProtocolType)
	}

	static supportsBinding(protocol: ProtocolType, bindingType: string): boolean {
		// Define which protocols support which binding types
		const supportMap: Record<ProtocolType, Record<string, boolean>> = {
			kafka: {server: true, channel: true, operation: true, message: true},
			websocket: {server: false, channel: true, operation: false, message: true},
			ws: {server: false, channel: true, operation: false, message: true},
			http: {server: false, channel: false, operation: true, message: true},
			https: {server: false, channel: false, operation: true, message: true},
			mqtt: {server: true, channel: true, operation: true, message: true},
			amqp: {server: true, channel: true, operation: true, message: true},
			redis: {server: true, channel: true, operation: false, message: false},
			nats: {server: true, channel: true, operation: true, message: true},
		}

		return supportMap[protocol]?.[bindingType] ?? false
	}
}