/**
 * Clean AsyncAPI Validator Implementation
 * 
 * Refactored validator with clean architecture.
 * <300 lines following design standards.
 * Pure Effect.TS patterns with proper separation of concerns.
 */

import { Effect } from "effect"
import { effectLogging } from "../../utils/effect-helpers.js"
import { validateDocumentEffect, validateBatchEffect, extractMetrics } from "./validation-effects.js"
import { convertAndParse } from "./validation-parser.js"
import type { ValidationResult, ValidationOptions, ValidationStats } from "./types.js"

/**
 * Clean AsyncAPI Validator with microkernel architecture
 */
export class CleanAsyncAPIValidator {
	private stats: ValidationStats = {
		totalValidations: 0,
		averageDuration: 0,
		lastValidationAt: undefined
	}

	constructor(private options?: ValidationOptions) {
		// Initialize with options
		if (options?.enableDetailedLogging) {
			console.log(`🔧 CleanAsyncAPIValidator initialized with detailed logging`)
		}
	}

	/**
	 * Validate AsyncAPI document - Pure Effect Method
	 */
	validate(document: unknown, identifier?: string): Effect.Effect<ValidationResult, Error> {
		return Effect.gen(function* () {
			if (this.options?.enableDetailedLogging) {
				yield* effectLogging.logInitialization(`Validating document${identifier ? `: ${identifier}` : ''}`)
			}
			
			// Use the clean validation effect
			return yield* validateDocumentEffect(document, this.options)
		})
	}

	/**
	 * Validate AsyncAPI document from file - Pure Effect Method
	 */
	validateFile(filePath: string): Effect.Effect<ValidationResult, Error> {
		return Effect.gen(function* () {
			if (this.options?.enableDetailedLogging) {
				yield* effectLogging.logInitialization(`Validating file: ${filePath}`)
			}

			// Read file with error handling
			const content = yield* Effect.tryPromise({
				try: () => import("node:fs").then(fs => fs.promises.readFile(filePath, "utf-8")),
				catch: (error) => new Error(`Failed to read file: ${error}`)
			})

			// Validate content
			const result = yield* validateDocumentEffect(content, this.options)
			
			if (this.options?.enableDetailedLogging) {
				yield* effectLogging.logInfo(`File validation completed: ${result.summary}`)
			}
			return result
		})
	}

	/**
	 * Validate AsyncAPI document from file - Pure Effect Method
	 */
	validateFile(filePath: string): Effect.Effect<ValidationResult, Error> {
		return Effect.gen(function* () {
			yield* railwayLogging.logInitialization(`Validating file: ${filePath}`)

			// Read file with error handling
			const content = yield* Effect.tryPromise({
				try: () => import("node:fs").then(fs => fs.promises.readFile(filePath, "utf-8")),
				catch: (error) => new Error(`Failed to read file: ${error}`)
			})

			// Validate content
			const result = yield* convertAndParse(content)
			
			yield* railwayLogging.logInfo(`File validation completed: ${result.summary}`)
			return result
		})
	}

	/**
	 * Validate batch of AsyncAPI documents - Pure Effect Method
	 */
	validateBatch(documents: Array<{ content: unknown, identifier?: string }>): Effect.Effect<ValidationResult[], Error> {
		return validateBatchEffect(documents, this.options)
	}

	/**
	 * Get validation statistics
	 */
	getValidationStats(): ValidationStats {
		return { ...this.stats }
	}

	/**
	 * Update validation statistics
	 */
	private updateStats(duration: number) {
		this.stats.totalValidations++
		this.stats.averageDuration = this.stats.totalValidations === 1 
			? duration 
			: (this.stats.averageDuration * (this.stats.totalValidations - 1) + duration) / this.stats.totalValidations
		this.stats.lastValidationAt = new Date()
	}

	/**
	 * Reset statistics
	 */
	resetStats(): void {
		this.stats = {
			totalValidations: 0,
			averageDuration: 0,
			lastValidationAt: undefined
		}
	}
}

/**
 * Factory function for creating validators with options
 */
export const createValidator = (options?: ValidationOptions): CleanAsyncAPIValidator => {
	return new CleanAsyncAPIValidator(options)
}

/**
 * Legacy compatibility exports
 */
export const validateAsyncAPIEffect = (document: unknown, options?: ValidationOptions): Effect.Effect<ValidationResult, Error> => {
	const validator = createValidator(options)
	return validator.validate(document)
}

export const validateAsyncAPI = async (document: unknown, options?: ValidationOptions): Promise<ValidationResult> => {
	const validator = createValidator(options)
	return Effect.runPromise(validator.validate(document))
}

export const isValidAsyncAPI = (result: ValidationResult): boolean => {
	return result.valid
}