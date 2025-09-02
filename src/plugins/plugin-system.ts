/**
 * Simple Plugin System for AsyncAPI TypeSpec Emitter
 *
 * Provides a minimal, extensible plugin architecture for protocol bindings
 * without overcomplicating the core emitter functionality.
 */

import {Effect} from "effect"
import type {AsyncAPIProtocolType} from "../constants/protocol-defaults.js"

// Re-export AsyncAPIProtocolType for convenience
export type {AsyncAPIProtocolType} from "../constants/protocol-defaults.js"

/**
 * Protocol plugin interface - comprehensive AsyncAPI 3.0 support
 * Enhanced to support all binding types (server, channel, operation, message)
 */
export type ProtocolPlugin = {
	readonly name: AsyncAPIProtocolType
	readonly version: string

	/**
	 * Generate protocol-specific bindings for operations
	 */
	generateOperationBinding?: (operation: unknown) => Effect.Effect<Record<string, unknown>, Error>

	/**
	 * Generate protocol-specific bindings for messages
	 */
	generateMessageBinding?: (message: unknown) => Effect.Effect<Record<string, unknown>, Error>

	/**
	 * Generate protocol-specific server configuration
	 */
	generateServerBinding?: (server: unknown) => Effect.Effect<Record<string, unknown>, Error>

	/**
	 * Generate protocol-specific channel configuration (for Kafka topics, etc.)
	 */
	generateChannelBinding?: (channel: unknown) => Effect.Effect<Record<string, unknown>, Error>

	/**
	 * Validate protocol-specific configuration
	 */
	validateConfig?: (config: unknown) => Effect.Effect<boolean, Error>
}

/**
 * Simple plugin registry - no complex DI, just a Map
 */
class SimplePluginRegistry {
	private readonly plugins = new Map<AsyncAPIProtocolType, ProtocolPlugin>()

	//TODO: FUCKING LOSING GENERICS FOR WHAT, FOR YOU LAZINESS - Error <-- REALLY??
	/**
	 * Register a protocol plugin
	 */
	register(plugin: ProtocolPlugin): Effect.Effect<void, Error> {
		const plugins = this.plugins
		return Effect.gen(function* () {
			yield* Effect.log(`📦 Registering plugin: ${plugin.name} v${plugin.version}`)

			if (plugins.has(plugin.name)) {
				yield* Effect.log(`⚠️  Plugin ${plugin.name} already registered, replacing`)
			}

			plugins.set(plugin.name, plugin)
			yield* Effect.log(`✅ Plugin ${plugin.name} registered successfully`)
		})
	}

	//TODO: FUCKING null! How about a not FoundError! Learn Effect!!!!
	/**
	 * Get a registered plugin
	 */
	getPlugin(protocolName: AsyncAPIProtocolType): Effect.Effect<ProtocolPlugin | null, never> {
		return Effect.succeed(this.plugins.get(protocolName) ?? null)
	}

	/**
	 * Get all registered plugins
	 */
	getAllPlugins(): Effect.Effect<ProtocolPlugin[], never> {
		return Effect.succeed(Array.from(this.plugins.values()))
	}

	/**
	 * Check if a protocol is supported
	 */
	isSupported(protocolName: AsyncAPIProtocolType): Effect.Effect<boolean, never> {
		return Effect.succeed(this.plugins.has(protocolName))
	}
}

/**
 * Global plugin registry instance - simple singleton pattern
 */
export const pluginRegistry = new SimplePluginRegistry()

//TODO: FUCKING LOSING GENERICS FOR WHAT, FOR YOU LAZINESS - Error <-- REALLY??; LEARN EFFECT!
/**
 * Helper function to register built-in plugins
 */
export const registerBuiltInPlugins = (): Effect.Effect<void, Error> =>
	Effect.gen(function* () {
		yield* Effect.log("🚀 Loading built-in protocol plugins...")

		// Register built-in plugins (imported lazily)
		const {kafkaPlugin} = yield* Effect.promise(() => import("./built-in/kafka-plugin.js"))
		const {websocketPlugin} = yield* Effect.promise(() => import("./built-in/websocket-plugin.js"))
		const {httpPlugin} = yield* Effect.promise(() => import("./built-in/http-plugin.js"))

		yield* pluginRegistry.register(kafkaPlugin)
		yield* pluginRegistry.register(websocketPlugin)
		yield* pluginRegistry.register(httpPlugin)

		yield* Effect.log("✅ Built-in plugins loaded successfully")
	})

/**
 * Helper to generate protocol bindings using registered plugins
 * Enhanced to support all AsyncAPI 3.0 binding types
 */
export const generateProtocolBinding = (
	protocolName: AsyncAPIProtocolType,
	bindingType: 'operation' | 'message' | 'server' | 'channel',
	data: unknown,
): Effect.Effect<Record<string, unknown> | null, Error> =>
	Effect.gen(function* () {
		const plugin = yield* pluginRegistry.getPlugin(protocolName)

		if (!plugin) {
			yield* Effect.log(`⚠️  No plugin found for protocol: ${protocolName}`)
			return null
		}

		switch (bindingType) {
			case 'operation':
				if (plugin.generateOperationBinding) {
					return yield* plugin.generateOperationBinding(data)
				}
				break
			case 'message':
				if (plugin.generateMessageBinding) {
					return yield* plugin.generateMessageBinding(data)
				}
				break
			case 'server':
				if (plugin.generateServerBinding) {
					return yield* plugin.generateServerBinding(data)
				}
				break
			case 'channel':
				if (plugin.generateChannelBinding) {
					return yield* plugin.generateChannelBinding(data)
				}
				break
		}

		yield* Effect.log(`⚠️  Plugin ${protocolName} does not support ${bindingType} bindings`)
		return null
	})