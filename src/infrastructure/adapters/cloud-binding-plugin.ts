import type {Effect, DecoratorContext, Model, Operation, AsyncAPIObject, CloudBindingResult} from "./cloud-binding-shared-types.js"
import {CloudBindingPluginRegistry} from "./cloud-binding-plugin-registry.js"

/**
 * Cloud binding plugin interface
 *
 * Defines the contract for cloud provider-specific binding plugins
 * that extend AsyncAPI specifications with cloud-native features.
 */
export type CloudBindingPlugin = {
	/** Unique identifier for the binding type */
	readonly bindingType: string

	/** Human-readable plugin name */
	readonly name: string

	/** Plugin version */
	readonly version: string

	/** Plugin description */
	readonly description: string

	/**
	 * Process cloud bindings for a given target
	 *
	 * @param context - TypeSpec decorator context
	 * @param target - Operation or Model being processed
	 * @param asyncApiDoc - Current AsyncAPI document state
	 * @returns Effect that produces binding results or fails with validation errors
	 */
	processBindings(
		context: DecoratorContext,
		target: Operation | Model,
		asyncApiDoc: AsyncAPIObject,
	): Effect.Effect<CloudBindingResult, Error>

	/**
	 * Validate plugin configuration
	 *
	 * @param config - Plugin-specific configuration
	 * @returns Effect that succeeds with validation status or fails with error
	 */
	validateConfiguration(config: Record<string, unknown>): Effect.Effect<boolean, Error>

	/**
	 * Get plugin capabilities and supported features
	 *
	 * @returns Object describing plugin capabilities
	 */
	getCapabilities(): Record<string, unknown>

	/**
	 * Optional: Generate additional documentation or examples
	 *
	 * @param target - Target being processed
	 * @returns Generated documentation or examples
	 */
	generateDocumentation?(target: Operation | Model): Record<string, unknown>

	/**
	 * Optional: Validate target compatibility
	 *
	 * @param target - Target to validate
	 * @returns Whether the target is compatible with this plugin
	 */
	isCompatible?(target: Operation | Model): boolean

	/**
	 * Optional: Transform AsyncAPI document post-processing
	 *
	 * @param asyncApiDoc - Complete AsyncAPI document
	 * @returns Transformed document
	 */
	transformDocument?(asyncApiDoc: AsyncAPIObject): Effect.Effect<AsyncAPIObject, Error>
}

/**
 * Global cloud binding plugin registry instance
 */
export const globalCloudBindingRegistry = new CloudBindingPluginRegistry()

/**
 * Plugin registration helper
 */
export function registerCloudBindingPlugin(plugin: CloudBindingPlugin): void {
	globalCloudBindingRegistry.register(plugin)
}

