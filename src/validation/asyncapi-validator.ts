/**
 * AsyncAPI Validation Module - Main entry point
 *
 * This file provides backward compatibility exports and aggregates all validation functionality.
 */

import type {ValidationError, ValidationResult} from "../errors/validation-error.js"
import {Effect} from "effect"
import {Parser} from "@asyncapi/parser"
import type { ValidationStats } from "./ValidationStats.js"
import type { ValidationOptions } from "./ValidationOptions.js"
import * as NodeFS from "node:fs/promises"
import { RailwayLogging } from "../utils/effect-helpers.js"

/**
 * AsyncAPI 3.0 Validator Class using REAL @asyncapi/parser
 *
 * Production-ready validator using the official AsyncAPI parser library.
 */
export class AsyncAPIValidator {
	private readonly parser: Parser
	private readonly stats: ValidationStats
	private initialized = false

	constructor(_options: ValidationOptions = {}) {
		//TODO: BULLSHIT PLACEHOLDER CODE! "needs to be implemented one day" IS NOT ACCEPTABLE!
		//TODO: CRITICAL FAILURE - ValidationOptions parameter exists but is COMPLETELY IGNORED! 
		//TODO: ARCHITECTURAL LIE - Constructor accepts options but does NOTHING with them - PURE DECEPTION!
		//TODO: IMPLEMENT IMMEDIATELY - Options should configure validation behavior, parser settings, cache options!
		//TODO: BUSINESS LOGIC MISSING - No validation timeouts, no custom schema paths, no validation level configuration!
		//TODO: REMOVE THE FUCKING UNDERSCORE PREFIX - Either use the parameter or make constructor parameterless!
		// Options parameter is available for future use but not currently needed

		this.stats = {
			totalValidations: 0,
			averageDuration: 0,
			cacheHits: 0,
		}

		// Initialize the REAL AsyncAPI parser
		this.parser = new Parser()
		
		// Eager initialization for performance (avoid check on every validation)  
		this.initialize()
	}

	/**
	 * Initialize the validator with AsyncAPI parser - Railway programming style
	 */
	initializeEffect(): Effect.Effect<void, never> {
		return Effect.gen(this, function* () {
			if (this.initialized) {
				return
			}

			yield* RailwayLogging.logInitialization("AsyncAPI 3.0.0 Validator with REAL @asyncapi/parser")
			this.initialized = true
			yield* RailwayLogging.logInitializationSuccess("AsyncAPI 3.0.0 Validator")
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
	validateEffect(document: unknown, _identifier?: string): Effect.Effect<ValidationResult, never> {
		return Effect.gen(this, function*() {
			// Ensure initialization in Effect context
			yield* this.initializeEffect()
			const startTime = performance.now()

			try {
				// Convert document to string for parser (no pretty printing for performance)
				const content = typeof document === 'string' ? document : JSON.stringify(document)

				// Enforce AsyncAPI 3.0.0 strict compliance
				const docObject: Record<string, unknown> = typeof document === 'string' ? JSON.parse(content) as Record<string, unknown> : document as Record<string, unknown>
				if (docObject && typeof docObject === 'object' && 'asyncapi' in docObject) {
					const version = String(docObject.asyncapi)
					if (version !== '3.0.0') {
						return {
							valid: false,
							errors: [{
								message: `AsyncAPI version must be 3.0.0, got: ${version}`,
								keyword: 'version-constraint',
								instancePath: 'asyncapi',
								schemaPath: '#/asyncapi'
							}],
							warnings: [],
							summary: `AsyncAPI version validation failed: expected 3.0.0, got ${version}`,
							metrics: this.extractMetrics(null, performance.now() - startTime)
						}
					}
				}

				// Use the REAL AsyncAPI parser with Effect promise wrapper
				const parseResult = yield* Effect.promise(() => this.parser.parse(content))
				const duration = performance.now() - startTime

				// Update statistics
				this.updateStats(duration)

				// Extract metrics from document
				const metrics = this.extractMetrics(parseResult.document, duration)

				if (parseResult.diagnostics.length === 0) {
					return {
						valid: true,
						errors: [],
						warnings: [],
						summary: `AsyncAPI document is valid (${duration.toFixed(2)}ms)`,
						metrics,
					}
				} else {
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
					}
				}
			} catch (error) {
				const duration = performance.now() - startTime
				this.updateStats(duration)

				return {
					valid: false,
					errors: [{
						message: `Parser failed: ${error instanceof Error ? error.message : String(error)}`,
						keyword: "parse-error",
						instancePath: "",
						schemaPath: "",
					}],
					warnings: [],
					summary: `Parser failed with error (${duration.toFixed(2)}ms)`,
					metrics: this.extractMetrics(null, duration),
				}
			}
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
		return Effect.gen(this, function*() {
			try {
				// Use Effect.promise to wrap Node.js file reading
				const content = yield* Effect.promise(() => NodeFS.readFile(filePath, "utf-8"))
				return yield* this.validateEffect(content, filePath)
			} catch (error) {
				return {
					valid: false,
					errors: [{
						message: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
						keyword: "file-error",
						instancePath: "",
						schemaPath: "",
					}],
					warnings: [],
					summary: "File reading failed",
					metrics: this.extractMetrics(null, 0),
				}
			}
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
	validateBatchEffect(documents: Array<{content: unknown, identifier?: string}>): Effect.Effect<ValidationResult[], never> {
		return Effect.gen(this, function*() {
			const startTime = performance.now()
			yield* RailwayLogging.logInitialization(`batch validation of ${documents.length} documents`)

			// Process documents in parallel using Effect.all with controlled concurrency
			const validationEffects = documents.map(doc => 
				this.validateEffect(doc.content, doc.identifier)
			)

			// Use Effect.all to run validations in parallel with limited concurrency
			const results = yield* Effect.all(validationEffects, { concurrency: 5 })

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
	async validateBatch(documents: Array<{content: unknown, identifier?: string}>): Promise<ValidationResult[]> {
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
