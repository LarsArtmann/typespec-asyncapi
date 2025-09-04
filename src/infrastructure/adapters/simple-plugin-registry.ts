import type {AsyncAPIProtocolType} from "../../constants/index.js"
import type {ProtocolPlugin} from "./protocol-plugin.js"
import {Effect} from "effect"

/**
 * Simple plugin registry - no complex DI, just a Map
 */
export class SimplePluginRegistry {
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