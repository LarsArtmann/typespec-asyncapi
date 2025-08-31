/**
 * AsyncAPI Options Utility Functions
 */

import {Effect} from "effect"
import {JSONSchema} from "@effect/schema"
import {asyncAPIEmitterOptionsEffectSchema} from "./schemas.js"
import {validateAsyncAPIEmitterOptions} from "./validation.js"
import type {AsyncAPIEmitterOptions} from "./types.js"

/**
 * JSON Schema representation for TypeSpec compatibility
 * Generated from Effect.TS Schema but maintains TypeSpec compiler compatibility
 *
 * CRITICAL: This bridges Effect.TS validation with TypeSpec's expected JSONSchemaType format
 */
export const ASYNC_API_EMITTER_OPTIONS_SCHEMA = (() => {
	try {
		// Convert Effect.TS Schema to JSON Schema format for TypeSpec compatibility
		const jsonSchema = JSONSchema.make(asyncAPIEmitterOptionsEffectSchema)

		// Return JSON Schema with TypeSpec-compatible structure
		return {
			...jsonSchema,
			type: "object",
			additionalProperties: false, // SECURITY: prevent arbitrary property injection
		}
	} catch (error) {
		Effect.logWarning("⚠️  Effect.TS Schema conversion failed, falling back to manual JSON Schema:", error)
		// Fallback to manual JSON Schema if conversion fails
		return {
			type: "object",
			additionalProperties: false,
			properties: {
				"output-file": {type: "string", nullable: true},
				"file-type": {type: "string", enum: ["yaml", "json"], nullable: true},
				"asyncapi-version": {type: "string", enum: ["3.0.0"], nullable: true},
				"omit-unreachable-types": {type: "boolean", nullable: true},
				"include-source-info": {type: "boolean", nullable: true},
				"default-servers": {type: "object", additionalProperties: true, nullable: true},
				"validate-spec": {type: "boolean", nullable: true},
				"additional-properties": {type: "object", additionalProperties: true, nullable: true},
				"protocol-bindings": {
					type: "array",
					items: {type: "string", enum: ["kafka", "amqp", "websocket", "http"]},
					nullable: true,
				},
				"security-schemes": {type: "object", additionalProperties: true, nullable: true},
				"versioning": {type: "object", additionalProperties: false, nullable: true},
			},
		}
	}
})()

/**
 * Create validated AsyncAPI emitter options with defaults
 * Returns Effect that provides fully validated configuration
 */
export const createAsyncAPIEmitterOptions = (input: Partial<AsyncAPIEmitterOptions> = {}) =>
	Effect.gen(function* () {
		const defaults: AsyncAPIEmitterOptions = {
			"output-file": "asyncapi",
			"file-type": "yaml",
			"asyncapi-version": "3.0.0",
			"omit-unreachable-types": false,
			"include-source-info": false,
			"validate-spec": true,
		}

		const merged = {...defaults, ...input}
		return yield* validateAsyncAPIEmitterOptions(merged)
	})

/**
 * Runtime type guard for AsyncAPI emitter options
 * Uses Effect.TS validation for type safety
 */
export const isAsyncAPIEmitterOptions = (input: unknown): input is AsyncAPIEmitterOptions => {
	try {
		return Effect.runSync(
			Effect.gen(function* () {
				yield* validateAsyncAPIEmitterOptions(input)
				return true
			}).pipe(
				Effect.catchAll(() => Effect.succeed(false)),
			)
		)
	} catch {
		return false
	}
}
