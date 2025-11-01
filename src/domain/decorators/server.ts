import type { DecoratorContext, Model, Namespace, StringValue, Operation } from "@typespec/compiler"
import {$lib, reportDiagnostic} from "../../lib.js"
import {Effect} from "effect"
import {$tags as $tagsImpl} from "./tags.js"
import {$correlationId as $correlationIdImpl} from "./correlation-id.js"
import {$bindings as $bindingsImpl} from "./cloud-bindings.js"

/**
 * AsyncAPI root document decorator - defines top-level AsyncAPI specification metadata
 */
export function $asyncapi(
	context: DecoratorContext,
	target: Namespace,
	config: Record<string, unknown>
): void {
	Effect.log(`🔍 PROCESSING @asyncapi decorator on namespace: ${target.name}`)
	Effect.log(`📋 Config:`, config)

	// Validate target is Namespace
	if (target.kind !== "Namespace") {
		reportDiagnostic(context, target, "invalid-asyncapi-target", {
			targetType: target.kind
		})
		return
	}

	// Store asyncapi configuration in program state
	// Note: Using serverConfigs temporarily until asyncApiConfigs is added to lib.ts stateKeys
	const asyncApiMap = context.program.stateMap($lib.stateKeys.serverConfigs)
	asyncApiMap.set(target, config)

	Effect.log(`✅ Successfully stored AsyncAPI config for namespace ${target.name}`)
}

/**
 * Tags decorator - apply categorization tags to operations, models, or namespaces
 */
export function $tags(
	context: DecoratorContext,
	target: Operation | Model | Namespace,
	tags: string[]
): void {
	return $tagsImpl(context, target, tags)
}

/**
 * Correlation ID decorator - define message correlation tracking
 */
export function $correlationId(
	context: DecoratorContext,
	target: Model,
	config: Record<string, unknown>
): void {
	return $correlationIdImpl(context, target, config)
}

/**
 * Bindings decorator - define protocol-specific bindings
 */
export function $bindings(
	context: DecoratorContext,
	target: Operation | Model,
	bindingType: string,
	config: Record<string, unknown>
): void {
	return $bindingsImpl(context, target, bindingType, config)
}

//TODO: CRITICAL - Add AsyncAPI 3.0.0 Server Object compliance validation
//TODO: CRITICAL - Missing required AsyncAPI Server fields (host, pathname, protocol version)
//TODO: CRITICAL - Add server variable support for URL templating
//TODO: CRITICAL - Implement server security scheme validation
//TODO: CRITICAL - Add server binding support (protocol-specific configurations)
//TODO: CRITICAL - Validate server tags and external documentation fields

//TODO: CRITICAL - Missing AsyncAPI Server Object fields: host, pathname, protocolVersion, security, bindings, tags
export type ServerConfig = {
	name: string;
	url: string;
	protocol: string;
	//TODO: CRITICAL - Should be required string, not optional undefined
	description?: string | undefined;
}

//TODO: CRITICAL - Add proper Effect.TS monadic error handling instead of void returns
//TODO: CRITICAL - Validate AsyncAPI Server Object structure compliance
//TODO: CRITICAL - Add server URL format validation (RFC 3986)
//TODO: CRITICAL - Implement protocol-specific server configuration validation
export function $server(
	context: DecoratorContext,
	target: Namespace,
	config: {name: string, url: string, protocol: string, [key: string]: unknown},
): void {
	Effect.log(`🌐 PROCESSING @server decorator on target: ${target.name}`)
	Effect.log(`📍 Server config:`, config)
	Effect.log(`🏷️  Target type: ${target.kind}`)

	// Extract name and config from config object
	const {name, ...serverConfig} = config

	//TODO: CRITICAL - Redundant validation - TypeScript ensures target is Namespace
	if (target.kind !== "Namespace") {
		reportDiagnostic(context, target, "invalid-server-config", {serverName: name})
		return
	}

	//TODO: CRITICAL - Use Effect.TS schema validation for server config
	if (!name || !serverConfig.url || !serverConfig.protocol) {
		reportDiagnostic(context, target, "invalid-server-config", {serverName: name || ""})
		return
	}

	//TODO: CRITICAL - Hardcoded protocol array should be extracted to constants
	//TODO: CRITICAL - Missing AsyncAPI 3.0.0 protocol specifications (mqtt, mqtt5, nats, redis, etc.)
	// Validate protocol
	const supportedProtocols = ["kafka", "amqp", "websocket", "http", "https", "ws", "wss"]
	//TODO: CRITICAL - Should validate against official AsyncAPI protocol specifications
	if (!supportedProtocols.includes(serverConfig.protocol.toLowerCase())) {
		reportDiagnostic(context, target, "unsupported-protocol", {protocol: serverConfig.protocol})
		return
	}

	// Create complete server configuration
	const completeConfig: ServerConfig = {
		name,
		url: serverConfig.url,
		protocol: serverConfig.protocol.toLowerCase(),
		description: serverConfig.description as string | undefined,
	}

	Effect.log(`📍 Extracted server config:`, completeConfig)

	//TODO: CRITICAL - No validation that serverConfigsMap exists or handles potential undefined
	//TODO: CRITICAL - Unsafe type assertion defeats type safety
	// Store server configuration in program state
	const serverConfigsMap = context.program.stateMap($lib.stateKeys.serverConfigs)
	const existingConfigs = (serverConfigsMap.get(target) as Map<string, ServerConfig> | undefined) ?? new Map<string, ServerConfig>()
	existingConfigs.set(name, completeConfig)
	serverConfigsMap.set(target, existingConfigs)

	Effect.log(`✅ Successfully stored server config for ${target.name}: ${name}`)
	Effect.log(`📊 Total server configs: ${existingConfigs.size}`)
}

//TODO: CRITICAL - Complex extraction logic should use Effect.TS schema validation
//TODO: CRITICAL - Function handles two completely different type structures - violates single responsibility
//TODO: CRITICAL - Missing error handling for malformed object structures
//TODO: CRITICAL - Should validate extracted values match ServerConfig schema
function extractServerConfigFromObject(obj: Model | Record<string, unknown>): Partial<ServerConfig> {
	const config: Partial<ServerConfig> = {}

	if ("properties" in obj && obj.properties && typeof obj.properties === "object" && "entries" in obj.properties) {
		// Handle Model type with RekeyableMap
		const modelObj = obj as Model
		modelObj.properties.forEach((modelProperty, key) => {
			const keyStr = key
			let valueStr: string | undefined

			// Extract value from ModelProperty.type or ModelProperty.defaultValue
			const propertyValue = modelProperty.defaultValue
			if (propertyValue && typeof propertyValue === "object" && "valueKind" in propertyValue && (propertyValue as StringValue).valueKind === "StringValue") {
				const stringValue = propertyValue as StringValue
				valueStr = String(stringValue.value)
			}

			if (valueStr) {
				assignServerConfigValue(config, keyStr, valueStr)
			}
		})
	} else if (obj && typeof obj === "object" && !("properties" in obj)) {
		// Handle Record<string, unknown> type
		for (const [key, value] of Object.entries(obj)) {
			let valueStr: string | undefined

			if (typeof value === "string") {
				valueStr = value
			} else if (value && typeof value === "object" && "value" in value && value.value !== undefined) {
				valueStr = String((value as StringValue).value)
			} else if (value && typeof value === "object" && "valueKind" in value && (value as StringValue).valueKind === "StringValue") {
				const stringValue = value as StringValue
				valueStr = String(stringValue.value)
			}

			if (valueStr) {
				assignServerConfigValue(config, key, valueStr)
			}
		}
	}

	return config
}

//TODO: CRITICAL - Should validate value format for each field type (URL format, protocol format, etc.)
//TODO: CRITICAL - Missing validation for unknown/unsupported server configuration keys
//TODO: CRITICAL - Should use enum/union types instead of hardcoded strings
//TODO: CRITICAL - No error handling for invalid values
function assignServerConfigValue(config: Partial<ServerConfig>, key: string, value: string): void {
	switch (key) {
		case "url":
			//TODO: CRITICAL - Should validate URL format (RFC 3986)
			config.url = value
			break
		case "protocol":
			//TODO: CRITICAL - Should validate protocol against AsyncAPI specifications
			config.protocol = value
			break
		case "description":
			config.description = value
			break
		//TODO: CRITICAL - Missing default case to handle unknown keys
	}
}