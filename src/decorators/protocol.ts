import type {DecoratorContext, Model, Operation, Type} from "@typespec/compiler"
import {$lib, reportDiagnostic} from "../lib.js"
import {Effect} from "effect"
import {SUPPORTED_PROTOCOLS} from "../constants/protocol-defaults.js"

export type ProtocolType = "kafka" | "websocket" | "http" | "amqp" | "mqtt" | "redis";

export type KafkaBindingConfig = {
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

export type WebSocketBindingConfig = {
	/** WebSocket method (GET only for WebSocket upgrade) */
	method?: "GET";
	/** Query parameters schema */
	query?: Record<string, unknown>;
	/** Headers schema */
	headers?: Record<string, unknown>;
	/** Subprotocol */
	subprotocol?: string;
}

export type HttpBindingConfig = {
	/** HTTP method */
	method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";
	/** Query parameters schema */
	query?: Record<string, unknown>;
	/** Headers schema */
	headers?: Record<string, unknown>;
	/** Request/response status codes */
	statusCode?: number;
}

export type AMQPBindingConfig = {
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

export type MQTTBindingConfig = {
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

export type RedisBindingConfig = {
	/** Redis channel or stream */
	channel?: string;
	/** Redis stream consumer group */
	consumerGroup?: string;
	/** Redis message ID */
	messageId?: string;
}

export type ProtocolConfig = {
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
	...args: unknown[]
): void {
	console.log(`🔧 DEBUG: @protocol decorator called`)
	console.log(`🔧 DEBUG: Number of arguments:`, arguments.length)
	console.log(`🔧 DEBUG: All arguments:`, [...arguments])
	console.log(`🔧 DEBUG: Target:`, target?.kind, target?.name || 'unnamed')
	console.log(`🔧 DEBUG: Args:`, args)
	
	// The actual config should be in args[0]
	const config = args[0] as ProtocolConfig
	console.log(`🔧 DEBUG: Config extracted:`, config)
	console.log(`🔧 DEBUG: Config type:`, typeof config)
	console.log(`🔧 DEBUG: Config.kind:`, (config as any)?.kind)
	
	// If it's a Model, we need to extract the actual values from the properties
	let actualConfig: ProtocolConfig | undefined
	if (config && typeof config === 'object' && 'kind' in config && (config as any).kind === 'Model') {
		console.log(`🔧 DEBUG: This is a TypeSpec Model, extracting properties...`)
		const modelProperties = (config as any).properties
		console.log(`🔧 DEBUG: Model properties type:`, typeof modelProperties)
		
		// Convert TypeSpec Model properties to plain object
		const extractedConfig: any = {}
		if (modelProperties && typeof modelProperties.forEach === 'function') {
			modelProperties.forEach((property: any, key: string) => {
				console.log(`🔧 DEBUG: Property ${key} full object:`, property)
				console.log(`🔧 DEBUG: Property ${key} type:`, property?.type)
				console.log(`🔧 DEBUG: Property ${key} type.kind:`, property?.type?.kind)
				console.log(`🔧 DEBUG: Property ${key} type.value:`, property?.type?.value)
				
				// Extract the property value from ModelProperty
				if (property && property.node && property.node.value) {
					const nodeValue = property.node.value
					console.log(`🔧 DEBUG: Property ${key} node.value:`, nodeValue)
					
					// Direct value extraction from TypeSpec AST node
					if (nodeValue.value !== undefined) {
						extractedConfig[key] = nodeValue.value
						console.log(`✅ DEBUG: Extracted ${key} = ${nodeValue.value}`)
					} else if (nodeValue.kind === 14) { // Model object
						// This is a nested object - extract its properties
						const nestedProps: any = {}
						if (nodeValue.properties && Array.isArray(nodeValue.properties)) {
							nodeValue.properties.forEach((nestedProp: any) => {
								const nestedKey = nestedProp.id?.sv || nestedProp.name
								const nestedValue = nestedProp.value?.value
								if (nestedKey && nestedValue !== undefined) {
									nestedProps[nestedKey] = nestedValue
									console.log(`✅ DEBUG: Extracted nested ${nestedKey} = ${nestedValue}`)
								}
							})
						}
						extractedConfig[key] = nestedProps
						console.log(`✅ DEBUG: Extracted nested object for ${key}:`, nestedProps)
					} else {
						console.log(`🔧 DEBUG: Unknown node value type for ${key}:`, nodeValue.kind)
					}
				}
			})
		}
		
		console.log(`🔧 DEBUG: Extracted config:`, extractedConfig)
		actualConfig = extractedConfig as ProtocolConfig
	} else {
		actualConfig = config
	}
	
	console.log(`🔧 DEBUG: Final actualConfig:`, actualConfig)
	console.log(`🔧 DEBUG: actualConfig.protocol:`, actualConfig?.protocol)
	
	// Early validation to prevent the rest of the function from running with bad data
	if (!actualConfig) {
		console.log(`❌ DEBUG: actualConfig is null/undefined`)
		reportDiagnostic(context, target, "missing-protocol-type")
		return
	}

	if (!actualConfig.protocol) {
		console.log(`❌ DEBUG: actualConfig.protocol is null/undefined`) 
		reportDiagnostic(context, target, "missing-protocol-type")
		return
	}

	console.log(`🔧 DEBUG: About to validate protocol: ${actualConfig.protocol}`)
	console.log(`🔧 DEBUG: SUPPORTED_PROTOCOLS:`, SUPPORTED_PROTOCOLS)
	Effect.log(`=
 PROCESSING @protocol decorator on: ${target.kind} ${target.name || 'unnamed'}`)
	Effect.log(`=� Protocol config:`, config)
	Effect.log(`<�  Target type: ${target.kind}`)

	// Target is already constrained to Operation | Model - no validation needed

	// Protocol is required in ProtocolConfig type, so this check is unnecessary
	// TypeScript ensures config.protocol is defined

	// Validate protocol type using centralized constant
	if (!SUPPORTED_PROTOCOLS.includes(actualConfig.protocol)) {
		reportDiagnostic(context, target, "invalid-protocol-type", {
			protocol: actualConfig.protocol,
			validProtocols: SUPPORTED_PROTOCOLS.join(", "),
		})
		return
	}

	// Validate protocol-specific binding configuration
	const validationResult = validateProtocolBinding(actualConfig.protocol, actualConfig.binding)
	if (validationResult.warnings.length > 0) {
		Effect.log(`�  Protocol binding validation warnings:`, validationResult.warnings)
		validationResult.warnings.forEach(warning => {
			Effect.log(`�  ${warning}`)
		})
	}

	Effect.log(`✅ Validated protocol config for ${actualConfig.protocol}:`, actualConfig)

	// Store protocol configuration in program state
	const protocolMap = context.program.stateMap($lib.stateKeys.protocolConfigs)
	protocolMap.set(target, actualConfig)

	Effect.log(` Successfully stored protocol config for ${target.kind} ${target.name || 'unnamed'}`)
	Effect.log(`=� Total entities with protocol config: ${protocolMap.size}`)
}

/**
 * Validate protocol-specific binding configuration
 */
function validateProtocolBinding(protocol: ProtocolType, binding: unknown): { valid: boolean; warnings: string[] } {
	const warnings: string[] = []

	switch (protocol) {
		case "kafka": {
			const kafkaBinding = binding as KafkaBindingConfig
			if (kafkaBinding.schemaId && !kafkaBinding.schemaIdLocation) {
				warnings.push("schemaId specified without schemaIdLocation - defaulting to 'payload'")
			}
			if (kafkaBinding.schemaLookupStrategy && !kafkaBinding.schemaId) {
				warnings.push("schemaLookupStrategy specified without schemaId - may not work as expected")
			}
			break
		}

		case "websocket": {
			const wsBinding = binding as WebSocketBindingConfig
			if (wsBinding.method && wsBinding.method as string !== "GET") {
				warnings.push("WebSocket binding method should be GET for upgrade requests")
			}
			break
		}

		case "http": {
			const httpBinding = binding as HttpBindingConfig
			if (httpBinding.statusCode && (httpBinding.statusCode < 100 || httpBinding.statusCode > 599)) {
				warnings.push("HTTP status code should be between 100-599")
			}
			break
		}

		case "amqp": {
			const amqpBinding = binding as AMQPBindingConfig
			if (amqpBinding.deliveryMode && ![1, 2].includes(amqpBinding.deliveryMode)) {
				warnings.push("AMQP delivery mode should be 1 (non-persistent) or 2 (persistent)")
			}
			if (amqpBinding.priority && (amqpBinding.priority < 0 || amqpBinding.priority > 255)) {
				warnings.push("AMQP priority should be between 0-255")
			}
			break
		}

		case "mqtt": {
			const mqttBinding = binding as MQTTBindingConfig
			if (mqttBinding.qos && ![0, 1, 2].includes(mqttBinding.qos)) {
				warnings.push("MQTT QoS should be 0, 1, or 2")
			}
			break
		}

		case "redis":
			// Redis validation could check for valid channel patterns, etc.
			break
	}

	return {valid: warnings.length === 0, warnings}
}

/**
 * Get protocol configuration for a target
 */
export function getProtocolConfig(context: DecoratorContext, target: Operation | Model): ProtocolConfig | undefined {
	const protocolMap = context.program.stateMap($lib.stateKeys.protocolConfigs)
	return protocolMap.get(target) as ProtocolConfig | undefined
}

/**
 * Check if a target has protocol configuration
 */
export function hasProtocolBinding(context: DecoratorContext, target: Operation | Model): boolean {
	const protocolMap = context.program.stateMap($lib.stateKeys.protocolConfigs)
	return protocolMap.has(target)
}

/**
 * Get all protocol configurations in the program
 */
export function getAllProtocolConfigs(context: DecoratorContext): Map<Type, ProtocolConfig> {
	return context.program.stateMap($lib.stateKeys.protocolConfigs) as Map<Type, ProtocolConfig>
}