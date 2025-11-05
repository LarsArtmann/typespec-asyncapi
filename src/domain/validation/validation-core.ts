/**
 * Core AsyncAPI Validation Logic
 * 
 * Handles core validation business logic with pure Effect.TS patterns.
 * Type-safe validation with comprehensive error handling.
 * Designed for <300 lines following architectural standards.
 */

import { Effect } from "effect"
import type { ValidationResult, ValidationError } from "../validation/types.js"

/**
 * Core validation result type
 */
export type CoreValidationResult = {
	valid: boolean
	errors: ValidationError[]
	warnings: string[]
	summary: string
	metrics: {
		duration: number
		channelCount: number
		operationCount: number
		schemaCount: number
		validatedAt: Date
	}
}

/**
 * Validate AsyncAPI version
 */
export const validateVersion = (document: any): Effect.Effect<void, Error> => {
	const version = String(document.asyncapi || "")
	if (version !== "3.0.0") {
		return Effect.fail(new Error(`AsyncAPI version must be 3.0.0, got: ${version}`))
	}
	return Effect.void
}

/**
 * Validate AsyncAPI document structure
 */
export const validateStructure = (document: any): Effect.Effect<CoreValidationResult, Error> => {
	return Effect.gen(function* () {
		const startTime = performance.now()
		
		// Basic structure validation
		if (!document || typeof document !== "object") {
			return {
				valid: false,
				errors: [{
					message: "Invalid document: must be an object",
					keyword: "structure-validation",
					instancePath: "",
					schemaPath: ""
				}],
				warnings: [],
				summary: "Document structure validation failed",
				metrics: {
					duration: performance.now() - startTime,
					channelCount: 0,
					operationCount: 0,
					schemaCount: 0,
					validatedAt: new Date()
				}
			}
		}

		// Version validation
		yield* validateVersion(document)

		// Basic required fields validation
		const requiredFields = ["asyncapi", "info"]
		const missingFields = requiredFields.filter(field => !(field in document))
		
		if (missingFields.length > 0) {
			return {
				valid: false,
				errors: missingFields.map(field => ({
					message: `Missing required field: ${field}`,
					keyword: "required-field",
					instancePath: field,
					schemaPath: ""
				})),
				warnings: [],
				summary: `Missing required fields: ${missingFields.join(", ")}`,
				metrics: {
					duration: performance.now() - startTime,
					channelCount: 0,
					operationCount: 0,
					schemaCount: 0,
					validatedAt: new Date()
				}
			}
		}

		return {
			valid: true,
			errors: [],
			warnings: [],
			summary: "Document structure validation successful",
			metrics: {
				duration: performance.now() - startTime,
				channelCount: 0,
				operationCount: 0,
				schemaCount: 0,
				validatedAt: new Date()
			}
		}
	})
}

/**
 * Convert CoreValidationResult to ValidationResult
 */
export const toValidationResult = (core: CoreValidationResult): ValidationResult => ({
	valid: core.valid,
	errors: core.errors,
	warnings: core.warnings,
	summary: core.summary,
	metrics: core.metrics
})