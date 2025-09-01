/**
 * AsyncAPI Standard Protocol Bindings Implementation
 * 
 * CRITICAL MIGRATION: Replaced custom types with official AsyncAPI v3 standard types
 * 
 * This module provides protocol-specific binding generation using official
 * AsyncAPI parser types instead of custom implementations.
 */

import type {
	ServerBindingsObject,
	ChannelBindingsObject,
	OperationBindingsObject,
	MessageBindingsObject,
	Binding,
	ReferenceObject,
	SchemaObject
} from "@asyncapi/parser/esm/spec-types/v3.js"

// Protocol type definition (from types/index.ts)
export type ProtocolType = 
	| "kafka" 
	| "websocket" 
	| "http" 
	| "mqtt" 
	| "amqp" 
	| "redis" 
	| "nats" 
	| "ws" 
	| "https"

/**
 * OFFICIAL ASYNCAPI v3 KAFKA BINDING TYPES
 * Based on AsyncAPI Kafka Binding Specification v0.5.0
 */

export type KafkaServerBinding = {
	schemaRegistryUrl?: string;
	schemaRegistryVendor?: string;
} & Binding

export type KafkaChannelBinding = {
	topic?: string;
	partitions?: number;
	replicas?: number;
	topicConfiguration?: Record<string, unknown>;
} & Binding

export type KafkaOperationBinding = {
	groupId?: SchemaObject | ReferenceObject | string;
	clientId?: SchemaObject | ReferenceObject | string;
} & Binding

export type KafkaMessageBinding = {
	key?: SchemaObject | ReferenceObject;
	schemaIdLocation?: "header" | "payload";
	schemaIdPayloadEncoding?: string;
	schemaLookupStrategy?: string;
} & Binding

/**
 * Configuration types for binding creation (backwards compatibility)
 */
export type KafkaChannelBindingConfig = Omit<KafkaChannelBinding, 'bindingVersion'>;
export type KafkaOperationBindingConfig = Omit<KafkaOperationBinding, 'bindingVersion'>;
export type KafkaMessageBindingConfig = Omit<KafkaMessageBinding, 'bindingVersion'>;

/**
 * WebSocket Binding Types (from AsyncAPI WebSocket Binding Specification v0.1.0)
 */
export type WebSocketChannelBinding = {
	method?: "GET" | "POST";
	query?: SchemaObject | ReferenceObject;
	headers?: SchemaObject | ReferenceObject;
} & Binding

export type WebSocketMessageBinding = {
	// WebSocket message bindings are minimal in AsyncAPI spec
} & Binding

export type WebSocketChannelBindingConfig = Omit<WebSocketChannelBinding, 'bindingVersion'>;
export type WebSocketMessageBindingConfig = Omit<WebSocketMessageBinding, 'bindingVersion'>;

/**
 * HTTP Binding Types (from AsyncAPI HTTP Binding Specification v0.3.0)
 */
export type HttpOperationBinding = {
	type?: "request" | "response";
	method?: string;
	query?: SchemaObject;
} & Binding

export type HttpMessageBinding = {
	headers?: SchemaObject | ReferenceObject;
	statusCode?: number;
} & Binding

export type HttpOperationBindingConfig = Omit<HttpOperationBinding, 'bindingVersion'>;
export type HttpMessageBindingConfig = Omit<HttpMessageBinding, 'bindingVersion'>;

/**
 * Protocol Binding Builders - Generate standard AsyncAPI bindings
 */
export class KafkaProtocolBinding {
	static createServerBinding(config: Partial<KafkaServerBinding> = {}): KafkaServerBinding {
		return {
			bindingVersion: "0.5.0",
			...config,
		}
	}

	static createChannelBinding(config: KafkaChannelBindingConfig & { topic: string }): KafkaChannelBinding {
		return {
			bindingVersion: "0.5.0",
			...config,
		}
	}

	static createOperationBinding(config: KafkaOperationBindingConfig = {}): KafkaOperationBinding {
		return {
			bindingVersion: "0.5.0",
			...config,
		}
	}

	static createMessageBinding(config: KafkaMessageBindingConfig = {}): KafkaMessageBinding {
		return {
			bindingVersion: "0.5.0",
			...config,
		}
	}
}

export class WebSocketProtocolBinding {
	static createChannelBinding(config: WebSocketChannelBindingConfig = {}): WebSocketChannelBinding {
		return {
			bindingVersion: "0.1.0",
			...config,
		}
	}

	static createMessageBinding(config: WebSocketMessageBindingConfig = {}): WebSocketMessageBinding {
		return {
			bindingVersion: "0.1.0",
			...config,
		}
	}
}

export class HttpProtocolBinding {
	static createOperationBinding(config: HttpOperationBindingConfig = {}): HttpOperationBinding {
		return {
			bindingVersion: "0.3.0",
			type: config.type ?? "request",
			...config,
		}
	}

	static createMessageBinding(config: HttpMessageBindingConfig = {}): HttpMessageBinding {
		return {
			bindingVersion: "0.3.0",
			...config,
		}
	}
}

/**
 * Protocol Binding Factory - Creates standard AsyncAPI binding objects
 */
export class ProtocolBindingFactory {
	/**
	 * Create server bindings using standard AsyncAPI format
	 */
	static createServerBindings(protocol: ProtocolType, config: Record<string, unknown> = {}): ServerBindingsObject | undefined {
		switch (protocol) {
			case "kafka":
				return {
					kafka: KafkaProtocolBinding.createServerBinding(config),
				}
			default:
				return undefined
		}
	}

	/**
	 * Create channel bindings using standard AsyncAPI format
	 */
	static createChannelBindings(protocol: ProtocolType, config: Record<string, unknown> = {}): ChannelBindingsObject | undefined {
		switch (protocol) {
			case "kafka": {
				const kafkaConfig = config.topic ? config as KafkaChannelBindingConfig & { topic: string } : { topic: "default-topic", ...config }
				return {
					kafka: KafkaProtocolBinding.createChannelBinding(kafkaConfig),
				}
			}
			case "ws":
			case "websocket":
				return {
					ws: WebSocketProtocolBinding.createChannelBinding(config),
				}
			default:
				return undefined
		}
	}

	/**
	 * Create operation bindings using standard AsyncAPI format
	 */
	static createOperationBindings(protocol: ProtocolType, config: Record<string, unknown> = {}): OperationBindingsObject | undefined {
		switch (protocol) {
			case "kafka":
				return {
					kafka: KafkaProtocolBinding.createOperationBinding(config),
				}
			case "http":
			case "https":
				return {
					http: HttpProtocolBinding.createOperationBinding(config),
				}
			default:
				return undefined
		}
	}

	/**
	 * Create message bindings using standard AsyncAPI format
	 */
	static createMessageBindings(protocol: ProtocolType, config: Record<string, unknown> = {}): MessageBindingsObject | undefined {
		switch (protocol) {
			case "kafka":
				return {
					kafka: KafkaProtocolBinding.createMessageBinding(config),
				}
			case "ws":
			case "websocket":
				return {
					ws: WebSocketProtocolBinding.createMessageBinding(config),
				}
			case "http":
			case "https":
				return {
					http: HttpProtocolBinding.createMessageBinding(config),
				}
			default:
				return undefined
		}
	}

	/**
	 * Validate protocol binding configuration (simplified for now)
	 */
	static validateBinding(_protocol: ProtocolType, _bindingType: string, _config: Record<string, unknown>): { isValid: boolean; errors: string[]; warnings: string[] } {
		// Basic validation - can be enhanced with proper schema validation
		return {
			isValid: true,
			errors: [],
			warnings: []
		}
	}
}

/**
 * Protocol utility functions
 */
export class ProtocolUtils {
	static isValidProtocol(protocol: string): boolean {
		const validProtocols: ProtocolType[] = ["kafka", "ws", "websocket", "http", "https", "amqp", "mqtt", "redis", "nats"]
		return validProtocols.includes(protocol as ProtocolType)
	}

	static supportsBinding(protocol: ProtocolType, bindingType: string): boolean {
		// Define which protocols support which binding types
		const supportMap: Record<ProtocolType, Record<string, boolean>> = {
			kafka: { server: true, channel: true, operation: true, message: true },
			websocket: { server: false, channel: true, operation: false, message: true },
			ws: { server: false, channel: true, operation: false, message: true },
			http: { server: false, channel: false, operation: true, message: true },
			https: { server: false, channel: false, operation: true, message: true },
			mqtt: { server: true, channel: true, operation: true, message: true },
			amqp: { server: true, channel: true, operation: true, message: true },
			redis: { server: true, channel: true, operation: false, message: false },
			nats: { server: true, channel: true, operation: true, message: true },
		}

		return supportMap[protocol]?.[bindingType] ?? false
	}
}
