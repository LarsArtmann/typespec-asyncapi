/**
 * Protocol Binding Implementation for TypeSpec AsyncAPI Emitter
 *
 * Provides protocol-specific binding generation and validation for:
 * - Kafka
 * - WebSocket
 * - HTTP
 */

import type {ReferenceObject, SchemaObject} from "@asyncapi/parser/esm/spec-types/v3"
import type {KafkaChannelBinding, KafkaMessageBinding, KafkaOperationBinding} from "./bindings/kafka"
import type {GlobalConfig} from "@confluentinc/kafka-javascript/types/config"
import {validateEnumValue, validateHttpStatusCode, validatePositiveInteger} from "./utils/protocol-validation"
import {getDefaultProtocolPort} from "./constants/protocol-defaults"

//TODO: This file is to big. Split it up!

//TODO: Is it possible to have stricter types here?
// Protocol binding types
type ServerBindings = Record<string, unknown>;
type ChannelBindings = Record<string, unknown>;
type OperationBindings = Record<string, unknown>;
type MessageBindings = Record<string, unknown>;

//TODO: Is it possible to have stricter types here?
// Server binding type for Kafka (not in centralized types yet)
type KafkaServerBinding = {
	bindingVersion?: string;
	schemaRegistryUrl?: string;
	schemaRegistryVendor?: string;
};

// Using imported types from centralized location with binding version extension
// Using official Confluent Kafka types from ./bindings/kafka

type WebSocketChannelBinding = {
	//TODO: Is it possible to have stricter types here?
	bindingVersion?: string;
	method?: "GET" | "POST";
	query?: SchemaObject | ReferenceObject;
	headers?: SchemaObject | ReferenceObject;
};

type WebSocketMessageBinding = {
	//TODO: Is it possible to have stricter types here?
	bindingVersion?: string;
};

type HttpOperationBinding = {
	//TODO: Is it possible to have stricter types here?
	bindingVersion?: string;
	type: "request" | "response";
	method?: string;
	query?: SchemaObject | ReferenceObject;
};

type HttpMessageBinding = {
	bindingVersion?: string;
	headers?: SchemaObject | ReferenceObject;
	statusCode?: number;
};

// KafkaTopicConfiguration removed - using official Confluent GlobalConfig instead
// Define protocol binding types locally
type ProtocolType = "kafka" | "websocket" | "http" | "mqtt" | "amqp" | "redis" | "nats" | "ws" | "https";

type ProtocolBindingValidationError = {
	protocol: ProtocolType;
	bindingType: "server" | "channel" | "operation" | "message";
	property?: string;
	message: string;
	severity: "error" | "warning";
};

type ProtocolBindingValidationResult = {
	isValid: boolean;
	errors: ProtocolBindingValidationError[];
	warnings: ProtocolBindingValidationError[];
};

// Named types for Kafka binding configurations (avoiding anonymous sub-objects)
export type KafkaChannelBindingConfig = {
	topic: string; // Required in official types
	partitions?: number;
	replicas?: number;
	configs?: Partial<GlobalConfig>; // Use official GlobalConfig type
};

export type KafkaOperationBindingConfig = {
	groupId?: string;
	clientId?: string;
};

export type KafkaMessageBindingConfig = {
	key?: {
		type: "string" | "avro" | "json" | "protobuf";
		schema?: string;
		schemaId?: number;
	};
	schemaIdLocation?: "header" | "payload";
	headers?: Record<string, string | Buffer | null>;
};

/**
 * OFFICIAL KAFKA PROTOCOL BINDINGS using Confluent Types
 *
 * ✅ GHOST SYSTEM ELIMINATED!
 * Replaced legacy anonymous sub-types with official Confluent binding types
 */
type KafkaProtocolBindingConfig = {
	/** Official Kafka server binding using Confluent types */
	server?: KafkaServerBinding;
	/** Official Kafka channel binding using Confluent types */
	channel?: KafkaChannelBindingConfig;
	/** Official Kafka operation binding using Confluent types */
	operation?: KafkaOperationBindingConfig;
	/** Official Kafka message binding using Confluent types */
	message?: KafkaMessageBindingConfig;
};

// Named types for WebSocket binding configurations (avoiding anonymous sub-objects)
export type WebSocketChannelBindingConfig = {
	method?: "GET" | "POST";
	query?: SchemaObject | ReferenceObject;
	headers?: SchemaObject | ReferenceObject;
};

export type WebSocketMessageBindingConfig = Record<string, unknown>;

type WebSocketProtocolBindingConfig = {
	channel?: WebSocketChannelBindingConfig;
	message?: WebSocketMessageBindingConfig;
};

// Named types for HTTP binding configurations (avoiding anonymous sub-objects)
export type HttpOperationBindingConfig = {
	type?: "request" | "response";
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "CONNECT" | "TRACE";
	query?: SchemaObject | ReferenceObject;
	statusCode?: number;
};

export type HttpMessageBindingConfig = {
	headers?: SchemaObject | ReferenceObject;
	statusCode?: number;
};

type HttpProtocolBindingConfig = {
	operation?: HttpOperationBindingConfig;
	message?: HttpMessageBindingConfig;
};


// Re-export for external use (using official Confluent Kafka types)
export type {ProtocolType}

// Define protocol support locally
//TODO: All types should have a dedicated name, no anonymous sub objects
const DEFAULT_PROTOCOL_SUPPORT: Record<ProtocolType, {
	server: boolean;
	channel: boolean;
	operation: boolean;
	message: boolean
}> = {
	kafka: {server: true, channel: true, operation: true, message: true},
	websocket: {server: false, channel: true, operation: false, message: true},
	http: {server: false, channel: false, operation: true, message: true},
	mqtt: {server: true, channel: true, operation: true, message: true},
	amqp: {server: true, channel: true, operation: true, message: true},
	redis: {server: true, channel: true, operation: false, message: false},
	nats: {server: true, channel: true, operation: true, message: true},
	ws: {server: false, channel: true, operation: false, message: true},
	https: {server: false, channel: false, operation: true, message: true},
}

export type ProtocolBindingConfig = {
	protocol: ProtocolType;
	serverBindings?: ServerBindings;
	channelBindings?: ChannelBindings;
	operationBindings?: OperationBindings;
	messageBindings?: MessageBindings;
}

// Use type alias for Kafka binding configuration from types/protocol-bindings.ts
export type KafkaBindingConfig = Omit<KafkaProtocolBindingConfig, 'protocol' | 'enabled' | 'version'>;

// Use type alias for WebSocket binding configuration from types/protocol-bindings.ts
export type WebSocketBindingConfig = Omit<WebSocketProtocolBindingConfig, 'protocol' | 'enabled' | 'version'>;

// Use type alias for HTTP binding configuration from types/protocol-bindings.ts
export type HttpBindingConfig = Omit<HttpProtocolBindingConfig, 'protocol' | 'enabled' | 'version'>;

export type ProtocolSpecificConfig = KafkaBindingConfig | WebSocketBindingConfig | HttpBindingConfig;

/**
 * Kafka Protocol Binding Builder
 */
export class KafkaProtocolBinding {
	//TODO: All types should have a dedicated name, no anonymous sub objects
	static createServerBinding(config: {
		schemaRegistryUrl?: string;
		schemaRegistryVendor?: string;
		clientId?: string;
		groupId?: string;
	}): KafkaServerBinding {
		return {
			bindingVersion: "0.5.0",
			...config,
		}
	}

	/** Create Kafka channel binding using official Confluent types */
	static createChannelBinding(config: KafkaChannelBindingConfig): KafkaChannelBinding {
		return {
			bindingVersion: "0.5.0",
			...config,
		}
	}

	/** Create Kafka operation binding using official Confluent types */
	static createOperationBinding(config: KafkaOperationBindingConfig): KafkaOperationBinding {
		return {
			bindingVersion: "0.5.0",
			...config,
		}
	}

	/** Create Kafka message binding using official Confluent types */
	static createMessageBinding(config: {
		key?: {
			type: "string" | "avro" | "json" | "protobuf";
			schema?: string;
			schemaId?: number;
		};
		schemaIdLocation?: "header" | "payload";
		headers?: Record<string, string | Buffer | null>;
	}): KafkaMessageBinding {
		return {
			bindingVersion: "0.5.0",
			...config,
		}
	}
}

/**
 * WebSocket Protocol Binding Builder
 */
export class WebSocketProtocolBinding {
	//TODO: All types should have a dedicated name, no anonymous sub objects
	static createChannelBinding(config: {
		method?: "GET" | "POST";
		query?: SchemaObject | ReferenceObject;
		headers?: SchemaObject | ReferenceObject;
	}): WebSocketChannelBinding {
		return {
			bindingVersion: "0.1.0",
			...config,
		}
	}

	//TODO: All types should have a dedicated name, no anonymous sub objects
	static createMessageBinding(): WebSocketMessageBinding {
		return {
			bindingVersion: "0.1.0",
		}
	}
}

/**
 * HTTP Protocol Binding Builder
 */
export class HttpProtocolBinding {
	//TODO: All types should have a dedicated name, no anonymous sub objects
	static createOperationBinding(config: {
		type?: "request" | "response";
		method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "CONNECT" | "TRACE";
		query?: SchemaObject | ReferenceObject;
		statusCode?: number;
	}): HttpOperationBinding {
		return {
			bindingVersion: "0.3.0",
			type: config.type ?? "request",
			...config,
		}
	}

	//TODO: All types should have a dedicated name, no anonymous sub objects
	static createMessageBinding(config: {
		headers?: SchemaObject | ReferenceObject;
		statusCode?: number;
	}): HttpMessageBinding {
		return {
			bindingVersion: "0.3.0",
			...config,
		}
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
					kafka: KafkaProtocolBinding.createServerBinding(config ?? {}),
				}
			default:
				return undefined
		}
	}

	//TODO: This need a fundamental type fix:
	/**
	 * Create channel bindings for a specific protocol
	 */
	static createChannelBindings(protocol: ProtocolType, config: KafkaChannelBindingConfig | WebSocketChannelBindingConfig): ChannelBindings | undefined {
		switch (protocol) {
			case "kafka":
				return {
					//TODO: This need a fundamental type fix:
					kafka: KafkaProtocolBinding.createChannelBinding((config as KafkaChannelBindingConfig) ?? {topic: "default-topic"}),
				}
			case "ws":
				return {
					//TODO: This need a fundamental type fix:
					ws: WebSocketProtocolBinding.createChannelBinding((config as WebSocketChannelBindingConfig) ?? {}),
				}
			default:
				return undefined
		}
	}

	/**
	 * Create operation bindings for a specific protocol
	 */
	static createOperationBindings(protocol: ProtocolType, config: KafkaOperationBindingConfig | HttpOperationBindingConfig): OperationBindings | undefined {
		switch (protocol) {
			case "kafka":
				return {
					kafka: KafkaProtocolBinding.createOperationBinding((config as KafkaOperationBindingConfig) ?? {}),
				}
			case "http":
			case "https":
				return {
					http: HttpProtocolBinding.createOperationBinding((config as HttpOperationBindingConfig) ?? {}),
				}
			default:
				return undefined
		}
	}

	/**
	 * Create message bindings for a specific protocol
	 */
	static createMessageBindings(protocol: ProtocolType, config: KafkaBindingConfig["message"] | WebSocketBindingConfig["message"] | HttpBindingConfig["message"]): MessageBindings | undefined {
		switch (protocol) {
			case "kafka":
				return {
					kafka: KafkaProtocolBinding.createMessageBinding((config as KafkaBindingConfig["message"]) ?? {}),
				}
			case "ws":
				return {
					ws: WebSocketProtocolBinding.createMessageBinding(),
				}
			case "http":
			case "https":
				return {
					http: HttpProtocolBinding.createMessageBinding((config as HttpBindingConfig["message"]) ?? {}),
				}
			default:
				return undefined
		}
	}

	/**
	 * Validate protocol-specific binding configuration
	 */
	static validateBinding(protocol: ProtocolType, bindingType: "server" | "channel" | "operation" | "message", config: ProtocolSpecificConfig): ProtocolBindingValidationResult {
		const errors: ProtocolBindingValidationError[] = []
		const warnings: ProtocolBindingValidationError[] = []

		// Check if protocol supports the binding type
		if (!ProtocolUtils.supportsBinding(protocol, bindingType)) {
			errors.push({
				protocol,
				bindingType,
				message: `Protocol '${protocol}' does not support '${bindingType}' bindings`,
				severity: "error",
			})
			return {isValid: false, errors, warnings}
		}

		switch (protocol) {
			case "kafka":
				errors.push(...this.validateKafkaBinding(bindingType, config as KafkaBindingConfig))
				break
			case "ws":
				errors.push(...this.validateWebSocketBinding(bindingType, config as WebSocketBindingConfig))
				break
			case "http":
			case "https":
				errors.push(...this.validateHttpBinding(bindingType, config as HttpBindingConfig))
				break
		}

		return {
			isValid: errors.length === 0,
			errors,
			warnings,
		}
	}

	private static validateKafkaBinding(bindingType: string, config: KafkaBindingConfig): ProtocolBindingValidationError[] {
		const errors: ProtocolBindingValidationError[] = []

		switch (bindingType) {
			case "channel":
				const partitionValidation = validatePositiveInteger(config.channel?.partitions, "partitions")
				const replicaValidation = validatePositiveInteger(config.channel?.replicas, "replicas")

				errors.push(...partitionValidation.errors.map(err => ({
					protocol: "kafka" as const,
					bindingType: "channel" as const,
					property: "partitions",
					message: err,
					severity: "error" as const,
				})))

				errors.push(...replicaValidation.errors.map(err => ({
					protocol: "kafka" as const,
					bindingType: "channel" as const,
					property: "replicas",
					message: err,
					severity: "error" as const,
				})))
				break
			case "message":
				errors.push(...validateEnumValue(config.message?.schemaIdLocation, "schemaIdLocation", ["header", "payload"] as const).map(err => ({
					protocol: "kafka" as const,
					bindingType: "message" as const,
					property: "schemaIdLocation",
					message: err,
					severity: "error" as const,
				})))

				// schemaLookupStrategy removed - not part of official Confluent types
				break
		}

		return errors
	}

	private static validateWebSocketBinding(bindingType: string, config: WebSocketBindingConfig): ProtocolBindingValidationError[] {
		const errors: ProtocolBindingValidationError[] = []

		switch (bindingType) {
			case "channel":
				if (config.channel?.method && !["GET", "POST"].includes(config.channel.method)) {
					errors.push({
						protocol: "ws",
						bindingType: "channel",
						property: "method",
						message: "WebSocket channel binding method must be 'GET' or 'POST'",
						severity: "error",
					})
				}
				break
		}

		return errors
	}

	private static validateHttpBinding(bindingType: string, config: HttpBindingConfig): ProtocolBindingValidationError[] {
		const errors: ProtocolBindingValidationError[] = []
		const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "CONNECT", "TRACE"] as const

		switch (bindingType) {
			case "operation":
				errors.push(...validateEnumValue(config.operation?.type, "type", ["request", "response"] as const).map(err => ({
					protocol: "http" as const,
					bindingType: "operation" as const,
					property: "type",
					message: err,
					severity: "error" as const,
				})))

				errors.push(...validateEnumValue(config.operation?.method, "method", validMethods).map(err => ({
					protocol: "http" as const,
					bindingType: "operation" as const,
					property: "method",
					message: err,
					severity: "error" as const,
				})))

				errors.push(...validateHttpStatusCode(config.operation?.statusCode, "statusCode").map(err => ({
					protocol: "http" as const,
					bindingType: "operation" as const,
					property: "statusCode",
					message: err,
					severity: "error" as const,
				})))
				break
			case "message":
				errors.push(...validateHttpStatusCode(config.message?.statusCode, "statusCode").map(err => ({
					protocol: "http" as const,
					bindingType: "message" as const,
					property: "statusCode",
					message: err,
					severity: "error" as const,
				})))
				break
		}

		return errors
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
						topic: "default-topic",
						partitions: 1,
						replicas: 1,
					},
					operation: {
						clientId: "typespec-asyncapi-client",
					},
					message: {
						schemaIdLocation: "payload",
					},
				}
			case "ws":
				return {
					channel: {
						method: "GET",
					},
					message: {},
				}
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
				}
			default:
				return {}
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
		return DEFAULT_PROTOCOL_SUPPORT[protocol][bindingType]
	}

	/**
	 * Extract protocol from URL or protocol string
	 */
	static extractProtocol(protocolOrUrl: string): ProtocolType | null {
		if (protocolOrUrl.includes("://")) {
			const protocol = protocolOrUrl.split("://")[0]?.toLowerCase()
			return protocol && this.isValidProtocol(protocol) ? (protocol as ProtocolType) : null
		}

		const protocol = protocolOrUrl.toLowerCase()
		return this.isValidProtocol(protocol) ? (protocol as ProtocolType) : null
	}

	/**
	 * Check if a string is a valid protocol
	 */
	static isValidProtocol(protocol: string): boolean {
		const validProtocols: ProtocolType[] = ["kafka", "ws", "http", "https", "amqp", "mqtt"]
		return validProtocols.includes(protocol as ProtocolType)
	}

	/**
	 * Get protocol-specific default ports
	 */
	static getDefaultPort(protocol: ProtocolType): number | undefined {
		return getDefaultProtocolPort(protocol)
	}
}