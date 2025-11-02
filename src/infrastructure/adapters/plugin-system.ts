/**
 * Simple Plugin System for AsyncAPI TypeSpec Emitter
 *
 * Provides a minimal, extensible plugin architecture for protocol bindings
 * without overcomplicating the core emitter functionality.
 */

import {Effect} from "effect"
import type {AsyncAPIProtocolType} from "../../constants/protocol-defaults.js"
import type {StandardizedError} from "../../utils/standardized-errors.js"
import {createError} from "../../utils/standardized-errors.js"
import {SimplePluginRegistry} from "./simple-plugin-registry.js"
import {kafkaPlugin} from "./kafka-plugin.js"
import {websocketPlugin} from "./websocket-plugin.js"
import {httpPlugin} from "./http-plugin.js"
import {mqttPlugin} from "./mqtt-plugin.js"

// Export types needed by other modules
export type {AsyncAPIProtocolType} from "../../constants/protocol-defaults.js"

// Re-exports are not cool!

/**
 * Global plugin registry instance - simple singleton pattern
 */
export const pluginRegistry = new SimplePluginRegistry()

//TODO: FUCKING LOSING GENERICS FOR WHAT, FOR YOU LAZINESS - Error <-- REALLY??; LEARN EFFECT!
/**
 * Helper function to register built-in plugins
 */
export const registerBuiltInPlugins = (): Effect.Effect<void, StandardizedError> =>
	Effect.gen(function* () {
		yield* Effect.log("🚀 Loading built-in protocol plugins...")

		yield* pluginRegistry.register(kafkaPlugin).pipe(
			Effect.catchAll((error) => Effect.fail(createError({
				what: "Failed to register Kafka plugin",
				reassure: "The emitter will continue without Kafka protocol support",
				why: "Plugin registration failed due to configuration or dependency issues",
				fix: "Check Kafka plugin configuration and dependencies",
				escape: "Use other protocol plugins or manual binding configuration",
				severity: "warning",
				code: "KAFKA_PLUGIN_REGISTRATION_ERROR",
				context: { error }
			})))
		)

		yield* pluginRegistry.register(websocketPlugin).pipe(
			Effect.catchAll((error) => Effect.fail(createError({
				what: "Failed to register WebSocket plugin",
				reassure: "The emitter will continue without WebSocket protocol support",
				why: "Plugin registration failed due to configuration or dependency issues",
				fix: "Check WebSocket plugin configuration and dependencies",
				escape: "Use other protocol plugins or manual binding configuration",
				severity: "warning",
				code: "WEBSOCKET_PLUGIN_REGISTRATION_ERROR",
				context: { error }
			})))
		)

		yield* pluginRegistry.register(httpPlugin).pipe(
			Effect.catchAll((error) => Effect.fail(createError({
				what: "Failed to register HTTP plugin",
				reassure: "The emitter will continue without HTTP protocol support",
				why: "Plugin registration failed due to configuration or dependency issues",
				fix: "Check HTTP plugin configuration and dependencies",
				escape: "Use other protocol plugins or manual binding configuration",
				severity: "warning",
				code: "HTTP_PLUGIN_REGISTRATION_ERROR",
				context: { error }
			})))
		)

		yield* pluginRegistry.register(mqttPlugin).pipe(
			Effect.catchAll((error) => Effect.fail(createError({
				what: "Failed to register MQTT plugin",
				reassure: "The emitter will continue without MQTT protocol support",
				why: "Plugin registration failed due to configuration or dependency issues",
				fix: "Check MQTT plugin configuration and dependencies",
				escape: "Use other protocol plugins or manual binding configuration",
				severity: "warning",
				code: "MQTT_PLUGIN_REGISTRATION_ERROR",
				context: { error }
			})))
		)

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
): Effect.Effect<Record<string, unknown> | null, StandardizedError> =>
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