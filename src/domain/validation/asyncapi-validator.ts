/**
 * AsyncAPI Validation Module - Main entry point
 *
 * This file provides backward compatibility exports and aggregates all validation functionality.
 */

import type {ValidationError, ValidationResult} from "../models/errors/validation-error.js"
import {Effect, Schedule} from "effect"
import {Parser} from "@asyncapi/parser"
import type {ValidationStats} from "./ValidationStats.js"
import type {ValidationOptions} from "./ValidationOptions.js"
import { readFile } from "node:fs/promises"
import {railwayLogging} from "../../utils/effect-helpers.js"
import {safeStringify} from "../../utils/standardized-errors.js"

/**
 * Helper to log error synchronously - eliminates duplication
 */
function logErrorSync(message: string): void {
	Effect.runSync(Effect.logError(message))
}

/**
 * Helper to create validation error result - eliminates duplication
 */
function createValidationErrorResult(
	errorMessage: string,
	duration: number,
	keyword: string = 'validation-error',
	instancePath: string = '',
	schemaPath: string = ''
): ValidationResult {
	return {
		valid: false,
		errors: [{
			message: errorMessage,
			keyword,
			instancePath,
			schemaPath,
		}],
		warnings: [],
		summary: errorMessage,
		metrics: { duration, channelCount: 0, operationCount: 0, schemaCount: 0, validatedAt: new Date() },
	}
}

/**
 * AsyncAPI 3.0 Validator Class using REAL @asyncapi/parser
 *
 * Production-ready validator using the official AsyncAPI parser library.
 */
export class AsyncAPIValidator {
	private readonly parser: Parser
	private readonly stats: ValidationStats
	private readonly options: Required<ValidationOptions>
	private initialized = false
	private readonly validationCache = new Map<string, ValidationResult>()

	constructor(options: ValidationOptions = {}) {
		// Implement ValidationOptions parameter with proper defaults
		this.options = {
			strict: options.strict ?? true,
			enableCache: options.enableCache ?? true,
			benchmarking: options.benchmarking ?? false,
			customRules: options.customRules ?? [],
		}

		this.stats = {
			totalValidations: 0,
			averageDuration: 0,
			cacheHits: 0,
		}

		// Initialize the REAL AsyncAPI parser
		this.parser = new Parser()

		// Eager initialization for performance (avoid check on every validation)  
		this.initializeEffect()
	}

	/**
	 * Initialize the validator with AsyncAPI parser - Railway programming style
	 */
	initializeEffect(): Effect.Effect<void, never> {
		return Effect.gen(this, function* () {
			if (this.initialized) {
				return
			}

			yield* railwayLogging.logInitialization("AsyncAPI 3.0.0 Validator with REAL @asyncapi/parser")
			this.initialized = true
			yield* railwayLogging.logInitializationSuccess("AsyncAPI 3.0.0 Validator")
		})
	}

	/**
	 * Legacy synchronous initialize for backward compatibility
	 * @deprecated Use initializeEffect() for proper Railway programming
	 */
	initialize(): void {
		if (this.initialized) {
			return
		}
		// Run Effect synchronously for legacy compatibility
		Effect.runSync(this.initializeEffect())
	}

	/**
	 * Validate AsyncAPI document using the REAL parser - Effect version
	 */
	validateEffect(document: unknown, identifier?: string): Effect.Effect<ValidationResult, never, never> {
		return Effect.gen(this, function* () {
			// Ensure initialization in Effect context
			yield* this.initializeEffect()
			const startTime = performance.now()

			// Convert document to string for parser (no pretty printing for performance)
			const content = typeof document === 'string' ? document : JSON.stringify(document)
			
			// Check cache if enabled
			if (this.options.enableCache && identifier) {
				const cacheKey = `${identifier}-${this.hashContent(content)}`
				const cachedResult = this.validationCache.get(cacheKey)
				if (cachedResult) {
					this.stats.cacheHits++
					yield* railwayLogging.logValidationResult(identifier, true, 0, "cache hit")
					return cachedResult
				}
			}

			// Enforce AsyncAPI version validation based on strict mode setting
			const docObjectResult = yield* Effect.try({
				try: () => {
					const docObject: Record<string, unknown> = typeof document === 'string' ? JSON.parse(content) as Record<string, unknown> : document as Record<string, unknown>
					if (this.options.strict && docObject && typeof docObject === 'object' && 'asyncapi' in docObject) {
						const version = String(docObject.asyncapi)
						if (version !== '3.0.0') {
							return Effect.fail(new Error(`AsyncAPI version must be 3.0.0 (strict mode), got: ${version}`))
						}
					}
					return docObject
				},
				catch: (error) => new Error(`Version validation failed: ${error instanceof Error ? error.message : String(error)}`)
			}).pipe(
				Effect.catchAll((error) => {
					const duration = performance.now() - startTime
					this.updateStats(duration)
					logErrorSync(`AsyncAPI version validation failed: ${error.message}`)
					return Effect.succeed(createValidationErrorResult(error.message, duration, 'version-constraint', 'asyncapi', '#/asyncapi'))
				})
			)

			// Return early if version validation failed
			if (typeof docObjectResult === 'object' && docObjectResult !== null && 'valid' in docObjectResult) {
				return docObjectResult as ValidationResult
			}

			// Use the REAL AsyncAPI parser with Effect tryPromise wrapper, retry patterns, and timeout
			const parseResult = yield* Effect.tryPromise({
				try: () => this.parser.parse(content),
				catch: (error) => new Error(`Parser failed: ${error instanceof Error ? error.message : String(error)}`)
			}).pipe(
				// Add timeout for long-running parsing operations (30 seconds)
				Effect.timeout("30 seconds"),
				// Add retry pattern with exponential backoff for transient parser failures
				Effect.retry(Schedule.exponential("100 millis").pipe(
					Schedule.compose(Schedule.recurs(3))
				)),
				Effect.tapError(attempt => Effect.log(`⚠️  Parser attempt failed, retrying: ${safeStringify(attempt)}`)),
				Effect.catchAll((error) => {
					const duration = performance.now() - startTime
					this.updateStats(duration)

					if (error.message?.includes("timeout")) {
						logErrorSync(`AsyncAPI parser timed out after 30 seconds`)
						return Effect.succeed(createValidationErrorResult(
							"Parser operation timed out - document may be too large or complex",
							duration,
							"timeout-error"
						))
					}
					// Handle non-timeout errors
					logErrorSync(`AsyncAPI parser failed after retries: ${error.message}`)
					return Effect.succeed(createValidationErrorResult(
						error.message,
						duration,
						"parse-error"
					))
				})
			)

			// Return early if parsing failed
			if (typeof parseResult === 'object' && parseResult !== null && 'valid' in parseResult) {
				return parseResult
			}

			const duration = performance.now() - startTime

			// Update statistics
			this.updateStats(duration)

			// Extract metrics from document
			const metrics = this.extractMetrics(parseResult.document, duration)

			yield* Effect.logInfo(`AsyncAPI validation completed in ${duration.toFixed(2)}ms`)

			const validationResult = parseResult.diagnostics.length === 0 
				? {
					valid: true,
					errors: [],
					warnings: [],
					summary: `AsyncAPI document is valid (${duration.toFixed(2)}ms)`,
					metrics,
				} as ValidationResult
				: (() => {
					// Convert diagnostics to validation errors
					const errors: ValidationError[] = parseResult.diagnostics
						.filter(d => Number(d.severity) === 0) // Error level
						.map(d => ({
							message: d.message,
							keyword: String(d.code || "validation-error"),
							instancePath: d.path?.join('.') || "",
							schemaPath: d.path?.join('.') || "",
						}))

					const warnings = parseResult.diagnostics
						.filter(d => Number(d.severity) === 1) // Warning level
						.map(d => d.message)

					return {
						valid: errors.length === 0,
						errors,
						warnings,
						summary: `AsyncAPI document validation completed (${errors.length} errors, ${warnings.length} warnings, ${duration.toFixed(2)}ms)`,
						metrics,
					} as ValidationResult
				})()

			// Cache the result if enabled
			this.cacheResult(identifier, content, validationResult)
			
			return validationResult
		})
	}

	/**
	 * Legacy Promise-based validate method for backward compatibility
	 */
	async validate(document: unknown, _identifier?: string): Promise<ValidationResult> {
		return Effect.runPromise(this.validateEffect(document, _identifier))
	}

	/**
	 * Validate AsyncAPI document from file - Effect version
	 */
	validateFileEffect(filePath: string): Effect.Effect<ValidationResult, never> {
		return Effect.gen(this, function* () {
			// Use Effect.tryPromise to wrap Node.js file reading with proper error handling
			const content = yield* Effect.tryPromise({
				try: () => readFile(filePath, "utf-8"),
				catch: (error) => new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`)
			}).pipe(
				Effect.catchAll((error) => {
					logErrorSync(`File reading failed: ${error.message}`)
					return Effect.succeed(createValidationErrorResult(
						error.message,
						0,
						"file-error"
					))
				})
			)

			// Return early if file reading failed
			if (typeof content === 'object' && content !== null && 'valid' in content) {
				return content
			}

			return yield* this.validateEffect(content, filePath)
		})
	}

	/**
	 * Legacy Promise-based validateFile method for backward compatibility
	 */
	async validateFile(filePath: string): Promise<ValidationResult> {
		return Effect.runPromise(this.validateFileEffect(filePath))
	}

	/**
	 * Validate multiple AsyncAPI documents in batch - Effect version
	 * Returns an array of ValidationResult objects with optimized performance
	 */
	validateBatchEffect(documents: Array<{
		content: unknown,
		identifier?: string
	}>): Effect.Effect<ValidationResult[], never> {
		return Effect.gen(this, function* () {
			const startTime = performance.now()
			yield* railwayLogging.logInitialization(`batch validation of ${documents.length} documents`)

			// Process documents in parallel using Effect.all with controlled concurrency
			const validationEffects = documents.map(doc =>
				this.validateEffect(doc.content, doc.identifier),
			)

			// Use Effect.all to run validations in parallel with limited concurrency
			const results = yield* Effect.all(validationEffects, {concurrency: 5})

			const totalDuration = performance.now() - startTime
			const validCount = results.filter(r => r.valid).length
			const invalidCount = results.length - validCount

			yield* Effect.logInfo(`✅ Batch validation completed: ${results.length} documents in ${totalDuration.toFixed(2)}ms`)
			yield* Effect.logInfo(`📊 Valid: ${validCount}, Invalid: ${invalidCount}`)

			return results
		})
	}

	/**
	 * Legacy Promise-based validateBatch method for backward compatibility
	 */
	async validateBatch(documents: Array<{ content: unknown, identifier?: string }>): Promise<ValidationResult[]> {
		return Effect.runPromise(this.validateBatchEffect(documents))
	}

	/**
	 * Get validation statistics
	 */
	getValidationStats(): ValidationStats {
		return {...this.stats}
	}

	/**
	 * Extract metrics from AsyncAPI document
	 */
	private extractMetrics(document: unknown, duration: number) {
		let channelCount = 0
		let operationCount = 0
		let schemaCount = 0

		if (document && typeof document === 'object') {
			const doc = document as {
				channels?: Record<string, unknown>;
				operations?: Record<string, unknown>;
				components?: { schemas?: Record<string, unknown> };
			}

			// Try to extract metrics from parsed document
			if (doc.channels) {
				channelCount = Object.keys(doc.channels).length
			}
			if (doc.operations) {
				operationCount = Object.keys(doc.operations).length
			}
			if (doc.components?.schemas) {
				schemaCount = Object.keys(doc.components.schemas).length
			}
		}

		return {
			duration,
			channelCount,
			operationCount,
			schemaCount,
			validatedAt: new Date(),
		}
	}

	/**
	 * Generate a simple hash for caching purposes
	 */
	private hashContent(content: string): string {
		let hash = 0
		for (let i = 0; i < content.length; i++) {
			const char = content.charCodeAt(i)
			hash = ((hash << 5) - hash) + char
			hash = hash & hash // Convert to 32-bit integer
		}
		return hash.toString(36)
	}

	/**
	 * Store validation result in cache if enabled
	 */
	private cacheResult(identifier: string | undefined, content: string, result: ValidationResult): void {
		if (this.options.enableCache && identifier) {
			const cacheKey = `${identifier}-${this.hashContent(content)}`
			this.validationCache.set(cacheKey, result)
			
			// Limit cache size to prevent memory leaks (keep most recent 1000 results)
			if (this.validationCache.size > 1000) {
				const firstKey = this.validationCache.keys().next().value
				if (firstKey) {
					this.validationCache.delete(firstKey)
				}
			}
		}
	}

	/**
	 * Update validation statistics
	 */
	private updateStats(duration: number) {
		this.stats.totalValidations++

		// Update rolling average
		if (this.stats.totalValidations === 1) {
			this.stats.averageDuration = duration
		} else {
			this.stats.averageDuration =
				(this.stats.averageDuration * (this.stats.totalValidations - 1) + duration) /
				this.stats.totalValidations
		}
	}
}

// Re-export types
//NOTE: use the real thing for: export type {ValidationOptions, ValidationStats}

// Re-export legacy functions for backward compatibility
//NOTE: use the real thing for: export {validateAsyncAPIFile, validateAsyncAPIString} from "./legacy-functions"

// Export utility function for backward compatibility
export async function validateAsyncAPIObject(document: unknown, options?: ValidationOptions): Promise<ValidationResult> {
	const validator = new AsyncAPIValidator(options)
	return await validator.validate(document)
}

// Export Effect-based utility functions
export function validateAsyncAPIEffect(document: unknown, options?: ValidationOptions): Effect.Effect<ValidationResult, never> {
	const validator = new AsyncAPIValidator(options)
	return validator.validateEffect(document)
}

export function isValidAsyncAPI(result: ValidationResult): boolean {
	return result.valid && result.errors.length === 0
}
