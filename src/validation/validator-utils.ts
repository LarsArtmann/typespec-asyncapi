/**
 * Utility functions for AsyncAPI validation
 */

import {Effect} from "effect"
import type {ValidationError, ValidationResult} from "../errors/validation-error"
import type {ValidationDiagnostic, ValidationWithDiagnostics, LegacyValidationResult, ObjectValidationOptions} from "./types"
import {AsyncAPIValidator} from "./validator-core"

/**
 * Common validation helper to reduce duplication
 * @internal
 */
export async function createDeprecatedValidator(): Promise<AsyncAPIValidator> {
	const validator = new AsyncAPIValidator({})
	validator.initialize()
	return validator
}

/**
 * Effect.TS wrapper for AsyncAPI validation
 */
export const validateAsyncAPIEffect = (content: string): Effect.Effect<LegacyValidationResult, Error> =>
	Effect.gen(function* () {
		const validator = new AsyncAPIValidator({})
		validator.initialize()
		const result = yield* Effect.tryPromise({
			try: () => validator.validate(content),
			catch: (error) => new Error(`AsyncAPI validation failed: ${error}`),
		})
		return {
			valid: result.valid,
			errors: result.errors,
			warnings: result.warnings
		}
	})

/**
 * Validate AsyncAPI document with detailed diagnostics
 */
export async function validateWithDiagnostics(content: string): Promise<ValidationWithDiagnostics> {
	const validator = new AsyncAPIValidator({})
	validator.initialize()
	const result = await validator.validate(content)

	const diagnostics: ValidationDiagnostic[] = result.errors.map((err: ValidationError) => ({
		severity: "error" as const,
		message: err.message,
		path: err.instancePath,
	}))

	result.warnings.forEach(warn => {
		diagnostics.push({
			severity: "warning" as const,
			message: warn,
		})
	})

	return {
		valid: result.valid,
		diagnostics,
	}
}

/**
 * Quick validation check - returns boolean only
 */
export async function isValidAsyncAPI(content: string): Promise<boolean> {
	try {
		const validator = new AsyncAPIValidator({})
		validator.initialize()
		const result = await validator.validate(content)
		return result.valid
	} catch {
		return false
	}
}

/**
 * Main validation function used by test helpers
 */
export async function validateAsyncAPIObject(document: unknown, options: ObjectValidationOptions = {}): Promise<ValidationResult> {
	const validator = new AsyncAPIValidator(options)
	validator.initialize()
	return validator.validate(document)
}
