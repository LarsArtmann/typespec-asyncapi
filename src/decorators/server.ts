import type {DecoratorContext, Model, Namespace, StringValue} from "@typespec/compiler"
import {$lib, reportDiagnostic} from "../lib.js"
import {Effect} from "effect"

export type ServerConfig = {
	name: string;
	url: string;
	protocol: string;
	description?: string | undefined;
}

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

	if (target.kind !== "Namespace") {
		reportDiagnostic(context, target, "invalid-server-config", {serverName: ""})
		return
	}

	// Extract server name from TypeSpec value with proper type handling
	let serverName: string
	if (typeof name === "string") {
		serverName = name
	} else if (name && typeof name === "object" && "value" in name) {
		serverName = String(name.value)
	} else if (name && typeof name === "object" && "valueKind" in name) {
		const stringValue = name as { value: unknown }
		serverName = String(stringValue.value)
	} else {
		Effect.log(`⚠️  Could not extract string from server name:`, name)
		reportDiagnostic(context, target, "invalid-server-config", {serverName: "unknown"})
		return
	}

	// Extract server configuration from TypeSpec Record/Object
	let serverConfig: Partial<ServerConfig>
	if (config && typeof config === "object" && "properties" in config) {
		serverConfig = extractServerConfigFromObject(config)
	} else {
		Effect.log(`⚠️  Could not extract config from server config:`, config)
		reportDiagnostic(context, target, "invalid-server-config", {serverName: serverName})
		return
	}

	// Validate required server configuration fields
	if (!serverConfig.url) {
		reportDiagnostic(context, target, "invalid-server-config", {serverName: serverName})
		return
	}

	if (!serverConfig.protocol) {
		reportDiagnostic(context, target, "invalid-server-config", {serverName: serverName})
		return
	}

	// Validate protocol
	const supportedProtocols = ["kafka", "amqp", "websocket", "http", "https", "ws", "wss"]
	if (!supportedProtocols.includes(serverConfig.protocol.toLowerCase())) {
		reportDiagnostic(context, target, "unsupported-protocol", {protocol: serverConfig.protocol})
		return
	}

	// Create complete server configuration
	const completeConfig: ServerConfig = {
		name: serverName,
		url: serverConfig.url,
		protocol: serverConfig.protocol.toLowerCase(),
		description: serverConfig.description || undefined,
	}

	Effect.log(`📍 Extracted server config:`, completeConfig)

	// Store server configuration in program state
	const serverConfigsMap = context.program.stateMap($lib.stateKeys.serverConfigs)
	const existingConfigs = (serverConfigsMap.get(target) as Map<string, ServerConfig> | undefined) ?? new Map<string, ServerConfig>()
	existingConfigs.set(serverName, completeConfig)
	serverConfigsMap.set(target, existingConfigs)

	Effect.log(`✅ Successfully stored server config for ${target.name}: ${serverName}`)
	Effect.log(`📊 Total server configs: ${existingConfigs.size}`)
}

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

function assignServerConfigValue(config: Partial<ServerConfig>, key: string, value: string): void {
	switch (key) {
		case "url":
			config.url = value
			break
		case "protocol":
			config.protocol = value
			break
		case "description":
			config.description = value
			break
	}
}