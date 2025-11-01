/**
 * AsyncAPI Options Utility Functions
 */

import {Effect} from "effect"
import {JSONSchema} from "@effect/schema"
import {asyncAPIEmitterOptionsEffectSchema} from "./schemas.js"
import {validateAsyncAPIEmitterOptions} from "./validation.js"
import {SERIALIZATION_FORMAT_OPTION_YAML, SERIALIZATION_FORMAT_OPTIONS} from "../../domain/models/serialization-format-option.js"
import {ASYNCAPI_VERSIONS} from "../../constants/asyncapi-constants.js"
import type {AsyncAPIEmitterOptions} from "./asyncAPIEmitterOptions.js"

/**
 * JSON Schema representation for TypeSpec compatibility
 * Generated from Effect.TS Schema but maintains TypeSpec compiler compatibility
 *
 * CRITICAL: This bridges Effect.TS validation with TypeSpec's expected JSONSchemaType format
 */
export const ASYNC_API_EMITTER_OPTIONS_SCHEMA = Effect.runSync(
	Effect.gen(function* () {
		// Convert Effect.TS Schema to JSON Schema format for TypeSpec compatibility
		const jsonSchema = JSONSchema.make(asyncAPIEmitterOptionsEffectSchema)

		// Return JSON Schema with TypeSpec-compatible structure
		return {
			...jsonSchema,
			type: "object",
			additionalProperties: false, // SECURITY: prevent arbitrary property injection
		}
	}).pipe(
		Effect.catchAll((error) =>
			Effect.gen(function* () {
				yield* Effect.logWarning("⚠️  Effect.TS Schema conversion failed, falling back to manual JSON Schema:", error)
				// Fallback to manual JSON Schema if conversion fails
				return {
					type: "object",
					additionalProperties: false,
					properties: {
						"output-file": {type: "string", nullable: true},
						"file-type": {type: "string", enum: SERIALIZATION_FORMAT_OPTIONS, nullable: true},
						"asyncapi-version": {type: "string", enum: [ASYNCAPI_VERSIONS.CURRENT], nullable: true},
						"omit-unreachable-types": {type: "boolean", nullable: true},
						"include-source-info": {type: "boolean", nullable: true},
						"default-servers": {type: "object", additionalProperties: true, nullable: true},
						"validate-spec": {type: "boolean", nullable: true},
						"additional-properties": {type: "object", additionalProperties: true, nullable: true},
						"protocol-bindings": {
							type: "array",
							//TODO: copy how SERIALIZATION_FORMAT_OPTIONS does it!
							items: {type: "string", enum: ["kafka", "amqp", "websocket", "http"]},
							nullable: true,
						},
						"security-schemes": {type: "object", additionalProperties: true, nullable: true},
						"versioning": {type: "object", additionalProperties: false, nullable: true},
					},
				}
			})
		)
	)
)

/**
 * Create validated AsyncAPI emitter options with defaults
 * Returns Effect that provides fully validated configuration
 */
export const createAsyncAPIEmitterOptions = (input: Partial<AsyncAPIEmitterOptions> = {}) =>
	Effect.gen(function* () {
		//TODO: Should be all constants!
		const defaults: AsyncAPIEmitterOptions = {
			"output-file": "asyncapi",
			"file-type": SERIALIZATION_FORMAT_OPTION_YAML,
			"asyncapi-version": ASYNCAPI_VERSIONS.CURRENT,
			"omit-unreachable-types": false,
			"include-source-info": false,
			"validate-spec": true,
		}

		const merged = {...defaults, ...input}
		return yield* validateAsyncAPIEmitterOptions(merged)
	})

/**
 * Runtime type guard for AsyncAPI emitter options
 * Uses Effect.TS validation for type safety with Railway programming
 */
export const isAsyncAPIEmitterOptions = (input: unknown): input is AsyncAPIEmitterOptions => {
	//TODO: does this need to be this completed? Is This logic even correct??
	return Effect.runSync(
		Effect.gen(function* () {
			yield* validateAsyncAPIEmitterOptions(input)
			return true
		}).pipe(
			Effect.catchAll((error) =>
				Effect.gen(function* () {
					yield* Effect.logWarning(`⚠️  AsyncAPI options validation failed: ${String(error)}`)
					return false
				})
			)
		).pipe(
			Effect.catchAll(() => Effect.succeed(false))
		)
	)
}
