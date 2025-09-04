/**
 * Built-in HTTP Protocol Plugin
 *
 * Provides HTTP-specific binding generation following AsyncAPI 3.0.0 specification
 * Extracted from ProtocolBindingFactory for modular architecture
 */

import {Effect} from "effect"
import {PROTOCOL_DEFAULTS} from "../../constants/protocol-defaults.js"
import type {
	HttpOperationBindingConfig,
	HttpMessageBindingConfig
} from "../../protocol-bindings.js"
import type {ProtocolPlugin} from "../protocol-plugin.js"
import type {HttpOperationBinding} from "../../http-operation-binding.js"
import type {HttpMessageBinding} from "../../http-message-binding.js"

/**
 * HTTP Plugin - Extracts logic from ProtocolBindingFactory
 * 
 * This implementation provides the same functionality as HttpProtocolBinding
 * but integrates with the plugin system for better modularity.
 */
export const httpPlugin: ProtocolPlugin = {
	name: "http",
	version: "1.0.0",

	generateOperationBinding: (operation: unknown) => Effect.gen(function* () {
		yield* Effect.log("🔧 Generating HTTP operation binding")
		
		// Extract config from operation or use defaults
		const config = (operation as {config?: HttpOperationBindingConfig})?.config || {}
		
		const binding: HttpOperationBinding = {
			bindingVersion: "0.3.0",
			type: config.type ?? "request",
			method: config.method ?? PROTOCOL_DEFAULTS.http.method,
			...config,
		}

		return {http: binding}
	}),

	generateMessageBinding: (message: unknown) => Effect.gen(function* () {
		yield* Effect.log("📨 Generating HTTP message binding")
		
		// Extract config from message or use defaults
		const config = (message as {config?: HttpMessageBindingConfig})?.config || {}

		const binding: HttpMessageBinding = {
			bindingVersion: "0.3.0",
			headers: config.headers ?? {
				"Content-Type": PROTOCOL_DEFAULTS.http.contentType,
			},
			...(config.statusCode ? { statusCode: config.statusCode } : {}),
			...config,
		}

		return {http: binding}
	}),

	generateServerBinding: (_server: unknown) => Effect.gen(function* () {
		yield* Effect.log("🖥️  Generating HTTP server binding")

		// HTTP server binding is minimal in AsyncAPI 3.0
		return {http: {bindingVersion: "0.3.0"}}
	}),

	validateConfig: (config: unknown) => Effect.gen(function* () {
		yield* Effect.log("✅ Validating HTTP configuration")

		// Validate HTTP-specific configuration
		if (typeof config !== 'object' || config === null) {
			return false
		}

		const httpConfig = config as HttpOperationBindingConfig | HttpMessageBindingConfig
		
		// Validate operation binding config
		if ('method' in httpConfig && httpConfig.method) {
			const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
			if (typeof httpConfig.method === 'string' && !validMethods.includes(httpConfig.method.toUpperCase())) {
				return false
			}
		}

		// Validate message binding config
		if ('statusCode' in httpConfig && httpConfig.statusCode) {
			if (typeof httpConfig.statusCode !== 'number' || httpConfig.statusCode < 100 || httpConfig.statusCode > 599) {
				return false
			}
		}

		return true
	}),
}