/**
 * Simple Plugin System for AsyncAPI TypeSpec Emitter
 *
 * Provides a minimal, extensible plugin architecture for protocol bindings
 * without overcomplicating the core emitter functionality.
 */

import {Effect} from "effect"
import type {AsyncAPIProtocolType} from "../constants/protocol-defaults.js"
import {SimplePluginRegistry} from "./simple-plugin-registry.js"
import {kafkaPlugin} from "./built-in/kafka-plugin.js"
import {websocketPlugin} from "./built-in/websocket-plugin.js"
import {httpPlugin} from "./built-in/http-plugin.js"

// Export types needed by other modules
export type {AsyncAPIProtocolType} from "../constants/protocol-defaults.js"

// Re-exports are not cool!

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

		yield* pluginRegistry.register(kafkaPlugin)
		yield* pluginRegistry.register(websocketPlugin)
		yield* pluginRegistry.register(httpPlugin)

		yield* Effect.log("✅ Built-in plugins loaded successfully")
	})

/**
 * Helper to generate protocol bindings using registered plugins
 * Enhanced to support all AsyncAPI 3.0 binding types
 * TODO: TYPES!
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