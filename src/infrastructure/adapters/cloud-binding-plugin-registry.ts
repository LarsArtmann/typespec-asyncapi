import {Effect} from "effect"
import type {DecoratorContext, Model, Operation} from "@typespec/compiler"
import type {AsyncAPIObject} from "@asyncapi/parser/esm/spec-types/v3.js"
import type {CloudBindingResult} from "./cloud-binding-result.js"
import type {CloudBindingPlugin} from "./cloud-binding-plugin.js"

/**
 * Cloud binding plugin registry
 */
export class CloudBindingPluginRegistry {
	private readonly plugins = new Map<string, CloudBindingPlugin>()

	/**
	 * Register a cloud binding plugin
	 */
	register(plugin: CloudBindingPlugin): void {
		this.plugins.set(plugin.bindingType, plugin)
		Effect.log(`📦 Registered cloud binding plugin: ${plugin.name} (${plugin.bindingType})`)
	}

	/**
	 * Get plugin by binding type
	 */
	getPlugin(bindingType: string): CloudBindingPlugin | undefined {
		return this.plugins.get(bindingType)
	}

	/**
	 * Get all registered plugins
	 */
	getAllPlugins(): CloudBindingPlugin[] {
		return Array.from(this.plugins.values())
	}

	/**
	 * Check if binding type is supported
	 */
	isSupported(bindingType: string): boolean {
		return this.plugins.has(bindingType)
	}

	/**
	 * Process bindings using appropriate plugins
	 */
	processBindings(
		context: DecoratorContext,
		target: Operation | Model,
		bindingType: string,
		asyncApiDoc: AsyncAPIObject,
	): Effect.Effect<CloudBindingResult, Error> {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this
		return Effect.gen(function* () {
			const plugin = self.plugins.get(bindingType)

			if (!plugin) {
				return yield* Effect.fail(new Error(`Unsupported binding type: ${bindingType}`))
			}

			if (plugin.isCompatible && !plugin.isCompatible(target)) {
				return yield* Effect.fail(new Error(`Target ${target.name} is not compatible with ${bindingType} bindings`))
			}

			return yield* plugin.processBindings(context, target, asyncApiDoc)
		})
	}

	/**
	 * Get capabilities for all registered plugins
	 */
	getAllCapabilities(): Record<string, Record<string, unknown>> {
		const capabilities: Record<string, Record<string, unknown>> = {}

		for (const [bindingType, plugin] of this.plugins) {
			capabilities[bindingType] = {
				...plugin.getCapabilities(),
				name: plugin.name,
				version: plugin.version,
				description: plugin.description,
			}
		}

		return capabilities
	}

	/**
	 * Validate all plugin configurations
	 */
	validateAllConfigurations(
		configs: Record<string, Record<string, unknown>>,
	): Effect.Effect<boolean, Error> {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this
		return Effect.gen(function* () {
			for (const [bindingType, config] of Object.entries(configs)) {
				const plugin = self.plugins.get(bindingType)
				if (plugin) {
					yield* plugin.validateConfiguration(config)
				}
			}
			return true
		})
	}
}