import type {DecoratorContext, Model, Operation} from "@typespec/compiler"
import type {AsyncAPIObject} from "@asyncapi/parser/esm/spec-types/v3.js"
import {Effect} from "effect"
import type {CloudBindingResult} from "./cloud-binding-result.js"
import type {CloudBindingPlugin} from "./cloud-binding-plugin.js"

/**
 * Base class for cloud binding plugins with common functionality
 * TODO: Use it somewhere!
 */
export abstract class BaseCloudBindingPlugin implements CloudBindingPlugin {
	abstract readonly bindingType: string
	abstract readonly name: string
	abstract readonly version: string
	abstract readonly description: string

	abstract processBindings(
		context: DecoratorContext,
		target: Operation | Model,
		asyncApiDoc: AsyncAPIObject,
	): Effect.Effect<CloudBindingResult, Error>

	abstract validateConfiguration(config: Record<string, unknown>): Effect.Effect<boolean, Error>

	abstract getCapabilities(): Record<string, unknown>

	/**
	 * Default compatibility check - all targets are compatible
	 */
	isCompatible(_target: Operation | Model): boolean {
		//TODO: What?? implement!
		return true
	}

	/**
	 * Default documentation generator
	 */
	generateDocumentation(target: Operation | Model): Record<string, unknown> {
		return {
			bindingType: this.bindingType,
			targetName: target.name,
			targetKind: target.kind,
			plugin: {
				name: this.name,
				version: this.version,
				description: this.description,
			},
		}
	}

	/**
	 * Default document transformer - no transformation
	 */
	transformDocument(asyncApiDoc: AsyncAPIObject): Effect.Effect<AsyncAPIObject, Error> {
		return Effect.succeed(asyncApiDoc)
	}

	/**
	 * Helper method to create empty result
	 */
	protected createEmptyResult(): CloudBindingResult {
		return {
			bindings: {},
			channels: {},
			operations: {},
			components: {},
		}
	}

	/**
	 * Helper method to merge results
	 */
	protected mergeResults(
		result1: CloudBindingResult,
		result2: CloudBindingResult,
	): CloudBindingResult {
		return {
			bindings: {...result1.bindings, ...result2.bindings},
			channels: {...result1.channels, ...result2.channels},
			operations: {...result1.operations, ...result2.operations},
			components: {...result1.components, ...result2.components},
		}
	}
}