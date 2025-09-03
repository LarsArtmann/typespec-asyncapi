/**
 * Shared validation utilities
 * Extracted from duplicated validation logic across multiple files
 */

import {Effect} from "effect"
import type {AsyncAPIObject} from "@asyncapi/parser/esm/spec-types/v3.js"
import {ValidationError} from "../core/ErrorHandlingStandardization.js"
import {ASYNCAPI_VERSION} from "../constants/asyncapi-constants.js"


/**
 * Pure Effect.TS AsyncAPI document validation
 * Extracted from integration-example.ts validateAsyncAPIObjectEffect
 */
export const validateAsyncAPIObjectEffect = (spec: unknown): Effect.Effect<boolean, ValidationError> =>
	Effect.gen(function* () {
		if (!spec || typeof spec !== "object") {
			return yield* Effect.fail(new ValidationError(
				"Invalid AsyncAPI specification format",
				spec,
			))
		}

		const document = spec as Record<string, unknown>

		if (!document["asyncapi"]) {
			return yield* Effect.fail(new ValidationError(
				"Missing required 'asyncapi' field",
				spec,
			))
		}

		if (document["asyncapi"] !== ASYNCAPI_VERSION) {
			return yield* Effect.fail(new ValidationError(
				`Invalid AsyncAPI version: ${String(document["asyncapi"])}, expected ${ASYNCAPI_VERSION}`,
				spec,
			))
		}

		if (!document["info"]) {
			return yield* Effect.fail(new ValidationError(
				"Missing required 'info' field",
				spec,
			))
		}

		yield* Effect.logDebug("AsyncAPI document validation passed", {
			asyncapiVersion: document["asyncapi"],
			hasInfo: !!document["info"],
			hasChannels: !!document["channels"],
			hasOperations: !!document["operations"],
		})

		return true
	}).pipe(
		Effect.withSpan("asyncapi-validation", {
			attributes: {
				specSize: typeof spec === "object" ? JSON.stringify(spec).length : 0,
			},
		}),
	)

/**
 * Quick validation check for AsyncAPI document structure
 * Centralized basic validation logic
 */
export function isValidAsyncAPIStructure(document: unknown): document is AsyncAPIObject {
	if (!document || typeof document !== "object") return false

	const doc = document as Record<string, unknown>
	return (
		doc["asyncapi"] === ASYNCAPI_VERSION &&
		typeof doc["info"] === "object" &&
		doc["info"] !== null
	)
}

/**
 * Validate AsyncAPI document with basic checks
 * Synchronous validation for simple cases
 */
export function validateAsyncAPIObjectSync(document: unknown): { valid: boolean; errors: string[] } {
	const errors: string[] = []

	if (!document || typeof document !== "object") {
		errors.push("Document must be an object")
		return {valid: false, errors}
	}

	const doc = document as Record<string, unknown>

	if (!doc["asyncapi"]) {
		errors.push("Missing required 'asyncapi' field")
	} else if (doc["asyncapi"] !== ASYNCAPI_VERSION) {
		errors.push(`Invalid AsyncAPI version: ${String(doc["asyncapi"])}, expected ${ASYNCAPI_VERSION}`)
	}

	if (!doc["info"]) {
		errors.push("Missing required 'info' field")
	}

	return {
		valid: errors.length === 0,
		errors,
	}
}
