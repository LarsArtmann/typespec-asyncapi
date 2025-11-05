/**
 * Effect-based AsyncAPI Validation
 * 
 * Pure Effect.TS validation patterns with railway programming.
 * Composable validation with proper error boundaries.
 */

import { Effect } from "effect"
import type { AsyncAPIObject } from "@asyncapi/parser"
import { effectLogging } from "../../utils/effect-helpers.js"
import { validateStructure, toValidationResult } from "./validation-core.js"
import type { ValidationResult, ValidationOptions } from "./types.js"

/**
 * Effect-based document validation entry point
 */
export const validateDocumentEffect = (
	document: unknown,
	options?: ValidationOptions
): Effect.Effect<ValidationResult, Error> => {
	return Effect.gen(function* () {
		const startTime = performance.now()
		
		// Debug logging at entry point
		if (options?.enableDetailedLogging) {
			yield* effectLogging.logInfo(`Validating document of type: ${typeof document}`)
		}

		// Type guard for valid objects
		if (typeof document === "object" && document !== null) {
			// Core structure validation
			const coreResult = yield* validateStructure(document)
			
			// Extract metrics from document
			if (coreResult.valid) {
				const metrics = yield* extractMetrics(document, coreResult.metrics.duration)
				return {
					...coreResult,
					metrics
				}
			}
			
			return toValidationResult(coreResult)
		}

		// Invalid type fallback
		const errorResult = {
			valid: false,
			errors: [{
				message: `Invalid document type: ${typeof document}. Expected object.`,
				keyword: "type-validation",
				instancePath: "",
				schemaPath: ""
			}],
			warnings: [],
			summary: "Type validation failed",
			metrics: {
				duration: performance.now() - startTime,
				channelCount: 0,
				operationCount: 0,
				schemaCount: 0,
				validatedAt: new Date()
			}
		}
		
		yield* railwayLogging.logError(`Type validation failed: ${errorResult.summary}`)
		return errorResult
	})
}

/**
 * Extract metrics from AsyncAPI document
 */
export const extractMetrics = (
	document: unknown,
	baseDuration: number
): Effect.Effect<{
	duration: number
	channelCount: number
	operationCount: number
	schemaCount: number
	validatedAt: Date
}, Error> => {
	return Effect.sync(() => {
		if (typeof document !== "object" || document === null) {
			return {
				duration: baseDuration,
				channelCount: 0,
				operationCount: 0,
				schemaCount: 0,
				validatedAt: new Date()
			}
		}

		const doc = document as AsyncAPIObject
		
		// Extract channels count
		const channelCount = doc.channels ? Object.keys(doc.channels).length : 0
		
		// Extract operations count
		let operationCount = 0
		if (doc.channels) {
			for (const channel of Object.values(doc.channels)) {
				const channelObj = channel as any
				if (channelObj.operations) {
					operationCount += Object.keys(channelObj.operations).length
				}
			}
		}

		// Extract schema count
		const schemaCount = doc.components?.schemas ? Object.keys(doc.components.schemas).length : 0

		return {
			duration: baseDuration,
			channelCount,
			operationCount,
			schemaCount,
			validatedAt: new Date()
		}
	})
}

/**
 * Batch validation with controlled concurrency
 */
export const validateBatchEffect = (
	documents: Array<{ content: unknown, identifier?: string }>,
	options?: ValidationOptions
): Effect.Effect<ValidationResult[], Error> => {
	return Effect.gen(function* () {
		const startTime = performance.now()
		
		if (options?.enableDetailedLogging) {
			yield* effectLogging.logInitialization(`Batch validation of ${documents.length} documents`)
		}

		// Create validation effects for each document
		const validationEffects = documents.map(doc =>
			validateDocumentEffect(doc.content, options)
		)

		// Process with controlled concurrency
		const concurrency = options?.maxConcurrentValidations || 5
		const results = yield* Effect.all(validationEffects, { concurrency })

		const totalDuration = performance.now() - startTime
		const validCount = results.filter(r => r.valid).length
		const invalidCount = results.length - validCount

		yield* effectLogging.logInfo(
			`✅ Batch validation completed: ${results.length} documents in ${totalDuration.toFixed(2)}ms`
		)
		yield* effectLogging.logInfo(
			`📊 Valid: ${validCount}, Invalid: ${invalidCount}`
		)

		return results
	})
}