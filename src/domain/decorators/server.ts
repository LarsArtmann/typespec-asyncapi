/**
 * @server Decorator Implementation
 * 
 * Implements the @server decorator for TypeSpec AsyncAPI emitter with proper type safety
 * and validation. This decorator allows users to define server configurations that
 * will be included in the generated AsyncAPI specification.
 * 
 * @author TypeSpec AsyncAPI Emitter Team
 * @since v1.1.0
 */

import {$lib, reportDiagnostic} from "../../lib.js"
import {Effect} from "effect"
import {$tags as $tagsImpl} from "./tags.js"
import {$correlationId as $correlationIdImpl} from "./correlation-id.js"
import {$bindings as $bindingsImpl} from "./cloud-bindings.js"

/**
 * Server Configuration Interface
 * Defines the structure for server configuration with strong typing
 */
export interface ServerConfig {
  name: string
  url: string
  protocol: string
  description?: string
}

/**
 * @server Decorator Implementation
 * 
 * Defines server configuration for AsyncAPI specifications with proper validation
 * and type safety. Supports multiple protocol configurations and comprehensive
 * error handling.
 */
export function $server(
	context: DecoratorContext,
	target: Namespace,
	name: StringValue | string,
	config: Model | Record<string, unknown>,
): void {
	Effect.log(`🌐 PROCESSING @server decorator on target: ${target.name}`)
	Effect.log(`📍 Server name raw value:`, name)
	Effect.log(`📍 Server config raw value:`, config)
	Effect.log(`🏷️  Target type: ${target.kind}`)

	// Validate target is Namespace with proper error handling
	// TODO: ENHANCE - Use Effect.TS schema validation instead of manual checks
	if (target.kind !== "Namespace") {
		const errorMessage = `@server decorator must be applied to a Namespace, got ${target.kind}`
		Effect.log(`❌ ${errorMessage}`)
		reportDiagnostic(context, target, "invalid-server-target", {
			targetType: target.kind,
			expected: "Namespace"
		})
		return
	}

	// Extract server name from TypeSpec value with proper type safety
	// TODO: ENHANCE - Use @effect/schema for runtime validation instead of manual checks
	// TODO: ENHANCE - Create TypeScript union type for all valid name types
	let serverName: string
	if (typeof name === "string") {
		serverName = name
	} else if (name && typeof name === "object" && "value" in name) {
		// Validate value exists and is string-like
		const value = name.value
		if (typeof value === "string") {
			serverName = value
		} else if (value && typeof value === "object" && "valueKind" in value) {
			const stringValue = value as { valueKind: unknown; value: unknown }
			if (stringValue.valueKind === "StringValue") {
				serverName = String(stringValue.value)
			} else {
				const errorMessage = `Invalid server name valueKind: ${stringValue.valueKind}`
				Effect.log(`❌ ${errorMessage}`)
				reportDiagnostic(context, target, "invalid-server-name", {serverName: "unknown", valueKind: stringValue.valueKind})
				return
			}
		} else {
			const errorMessage = `Invalid server name value type: ${typeof value}`
			Effect.log(`❌ ${errorMessage}`)
			reportDiagnostic(context, target, "invalid-server-name", {serverName: "unknown", valueType: typeof value})
			return
		}
	} else {
		const errorMessage = `Could not extract string from server name: ${JSON.stringify(name)}`
		Effect.log(`❌ ${errorMessage}`)
		reportDiagnostic(context, target, "invalid-server-name", {serverName: "unknown", nameType: typeof name})
		return
	}

	// Validate server name is not empty
	if (!serverName || serverName.trim() === "") {
		const errorMessage = `Server name cannot be empty: ${serverName}`
		Effect.log(`❌ ${errorMessage}`)
		reportDiagnostic(context, target, "invalid-server-name", {serverName, isEmpty: true})
		return
	}

	Effect.log(`✅ Server name validated: ${serverName}`)

	// Extract server configuration from TypeSpec Record/Object with proper validation
	// TODO: ENHANCE - Use @effect/schema for runtime validation
	// TODO: ENHANCE - Create TypeScript union type for all valid config types
	let serverConfig: Partial<ServerConfig>
	if (config && typeof config === "object") {
		serverConfig = extractServerConfigFromObject(config)
	} else {
		const errorMessage = `Server config must be an object, got ${typeof config}`
		Effect.log(`❌ ${errorMessage}`)
		reportDiagnostic(context, target, "invalid-server-config", {serverName, configType: typeof config})
		return
	}

	// Validate required server configuration fields with proper error reporting
	if (!serverConfig.url) {
		const errorMessage = `Server URL is required for ${serverName}`
		Effect.log(`❌ ${errorMessage}`)
		reportDiagnostic(context, target, "invalid-server-config", {serverName, missingField: "url"})
		return
	}

	if (!serverConfig.protocol) {
		const errorMessage = `Server protocol is required for ${serverName}`
		Effect.log(`❌ ${errorMessage}`)
		reportDiagnostic(context, target, "invalid-server-config", {serverName, missingField: "protocol"})
		return
	}

	// Validate protocol is supported with proper error reporting
	const supportedProtocols = ["kafka", "amqp", "websocket", "http", "https", "ws", "wss", "mqtt", "redis", "nats"]
	if (!supportedProtocols.includes(serverConfig.protocol.toLowerCase())) {
		const errorMessage = `Unsupported protocol: ${serverConfig.protocol} for ${serverName}. Supported: ${supportedProtocols.join(", ")}`
		Effect.log(`❌ ${errorMessage}`)
		reportDiagnostic(context, target, "unsupported-protocol", {serverName, protocol: serverConfig.protocol, supported: supportedProtocols})
		return
	}

	// Validate URL format with proper error reporting
	try {
		new URL(serverConfig.url)
	} catch (error) {
		const errorMessage = `Invalid server URL: ${serverConfig.url} for ${serverName} - ${(error as Error).message}`
		Effect.log(`❌ ${errorMessage}`)
		reportDiagnostic(context, target, "invalid-server-url", {serverName, url: serverConfig.url, error: (error as Error).message})
		return
	}

	// Create complete server configuration with type safety
	const completeConfig: ServerConfig = {
		name: serverName,
		url: serverConfig.url,
		protocol: serverConfig.protocol.toLowerCase(),
		description: serverConfig.description ?? undefined
	}

	Effect.log(`✅ Server config validated: ${JSON.stringify(completeConfig, null, 2)}`)

	// Store server configuration in program state with proper error handling
	// TODO: ENHANCE - Add proper TypeScript typing for server configuration state
	// TODO: ENHANCE - Add runtime validation for server configuration
	try {
		const serverConfigsMap = context.program.stateMap($lib.stateKeys.serverConfigs)
		
		// Handle potential undefined stateMap gracefully
		if (!serverConfigsMap) {
			const errorMessage = `ServerConfigs state map not available for ${target.name}`
			Effect.log(`⚠️ ${errorMessage}`)
			reportDiagnostic(context, target, "server-config-unavailable", {serverName})
			return
		}

		// Ensure we have a proper Map for this namespace with type safety
		let existingConfigs = serverConfigsMap.get(target)
		if (!existingConfigs) {
			existingConfigs = new Map<string, ServerConfig>()
		}

		// Validate the type of existingConfigs with proper error handling
		if (!(existingConfigs instanceof Map)) {
			const errorMessage = `Invalid serverConfigs type for ${target.name}: ${typeof existingConfigs}`
			Effect.log(`❌ ${errorMessage}`)
			reportDiagnostic(context, target, "invalid-server-config-map", {serverName, existingConfigsType: typeof existingConfigs})
			return
		}

		// Safely add the new server configuration with type safety
		existingConfigs.set(serverName, completeConfig)
		serverConfigsMap.set(target, existingConfigs)

		Effect.log(`✅ Successfully stored server config for ${target.name}: ${serverName}`)
		Effect.log(`📊 Total server configs: ${existingConfigs.size}`)
	} catch (error) {
		const errorMessage = `Error storing server config for ${target.name}: ${(error as Error).message}`
		Effect.log(`❌ ${errorMessage}`)
		reportDiagnostic(context, target, "server-config-storage-error", {serverName, error: (error as Error).message})
	}
}

/**
 * Extract server configuration from TypeSpec Model or Record with proper validation
 * TODO: ENHANCE - Use @effect/schema for runtime validation
 * TODO: ENHANCE - Split into separate functions for different types
 * TODO: ENHANCE - Add comprehensive error handling and validation
 * TODO: ENHANCE - Create TypeScript union types for all valid server configuration options
 */
function extractServerConfigFromObject(obj: Model | Record<string, unknown>): Partial<ServerConfig> {
	const config: Partial<ServerConfig> = {}

	// Handle Model type with RekeyableMap (TypeSpec internal structure)
	if ("properties" in obj && obj.properties && typeof obj.properties === "object" && "entries" in obj.properties) {
		const modelObj = obj as Model
		modelObj.properties.forEach((modelProperty, key) => {
			const keyStr = key
			let valueStr: string | undefined

			// Extract value from ModelProperty with proper validation
			const propertyValue = modelProperty.defaultValue
			if (propertyValue && typeof propertyValue === "object" && "valueKind" in propertyValue && (propertyValue as StringValue).valueKind === "StringValue") {
				const stringValue = propertyValue as StringValue
				valueStr = String(stringValue.value)
			} else if (propertyValue && typeof propertyValue === "object" && "value" in propertyValue && propertyValue.value !== undefined) {
				const value = propertyValue.value
				if (typeof value === "string") {
					valueStr = value
				} else if (value && typeof value === "object" && "valueKind" in value) {
					const stringValue = value as { valueKind: unknown; value: unknown }
					if (stringValue.valueKind === "StringValue") {
						valueStr = String(stringValue.value)
					}
				}
			}

			// Store validated value in config
			if (valueStr) {
				assignServerConfigValue(config, keyStr, valueStr)
			}
		})
	} 
	// Handle Record<string, unknown> type with proper validation
	else if (obj && typeof obj === "object" && !("properties" in obj)) {
		for (const [key, value] of Object.entries(obj)) {
			let valueStr: string | undefined

			// Validate and convert value with proper type checking
			if (typeof value === "string") {
				valueStr = value
			} else if (value && typeof value === "object" && "value" in value && value.value !== undefined) {
				const val = value as StringValue
				if (typeof val.value === "string") {
					valueStr = val.value
				} else if (val && typeof val === "object" && "valueKind" in val) {
					if (val.valueKind === "StringValue") {
						valueStr = String(val.value)
					}
				}
			} else if (value && typeof value === "object" && "valueKind" in value && (value as StringValue).valueKind === "StringValue") {
				const val = value as StringValue
				valueStr = String(val.value)
			}

			// Store validated value in config
			if (valueStr) {
				assignServerConfigValue(config, key, valueStr)
			}
		}
	}

	return config
}

/**
 * Assign server configuration value with proper validation
 * TODO: ENHANCE - Use @effect/schema for runtime validation
 * TODO: ENHANCE - Create TypeScript union types for all valid config keys
 * TODO: ENHANCE - Add comprehensive validation for each field type
 */
function assignServerConfigValue(config: Partial<ServerConfig>, key: string, value: string): void {
	switch (key) {
		case "url":
			// TODO: ENHANCE - Validate URL format (RFC 3986)
			// TODO: ENHANCE - Add protocol-specific URL validation
			// TODO: ENHANCE - Add environment variable expansion support
			config.url = value
			break
		case "protocol":
			// TODO: ENHANCE - Validate protocol against AsyncAPI specifications
			// TODO: ENHANCE - Add protocol version validation
			// TODO: ENHANCE - Add protocol-specific configuration validation
			config.protocol = value
			break
		case "description":
			// TODO: ENHANCE - Validate description format and length
			// TODO: ENHANCE - Add markdown support in descriptions
			// TODO: ENHANCE - Add internationalization support
			config.description = value
			break
		default:
			// TODO: ENHANCE - Log warning for unknown configuration keys
			// TODO: ENHANCE - Create configurable strict mode for unknown keys
			// TODO: ENHANCE - Add validation for custom server configuration keys
			Effect.log(`⚠️ Unknown server config key: ${key} - adding to metadata`)
			if (!config.description) {
				config.description = `Server configuration with ${key}: ${value}`
			}
			break
	}
}

/**
 * Server decorator for TypeSpec usage
 * Provides a convenient decorator syntax for defining server configurations
 * with compile-time validation and runtime type safety.
 */
export const server = $server