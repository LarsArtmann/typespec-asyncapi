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
		//TODO: needs to be implemented one day
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
	 * Initialize the validator with AsyncAPI parser
	 */
	initialize(): void {
		if (this.initialized) {
			return
		}

		Effect.log("🔧 Initializing AsyncAPI 3.0.0 Validator with REAL @asyncapi/parser...")
		this.initialized = true
		Effect.log("✅ AsyncAPI 3.0.0 Validator initialized successfully")
	}

	/**
	 * Validate AsyncAPI document using the REAL parser
	 */
	async validate(document: unknown, _identifier?: string): Promise<ValidationResult> {
		// Initialization now done eagerly in constructor for performance
		const startTime = performance.now()

		try {
			// Convert document to string for parser (no pretty printing for performance)
			const content = typeof document === 'string' ? document : JSON.stringify(document)

			// Enforce AsyncAPI 3.0.0 strict compliance
			const docObject = typeof document === 'string' ? JSON.parse(content) : document
			if (docObject && typeof docObject === 'object' && 'asyncapi' in docObject) {
				const version = (docObject as any).asyncapi
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

			// Use the REAL AsyncAPI parser
			const {document: parsedDocument, diagnostics} = await this.parser.parse(content)
			const duration = performance.now() - startTime

			// Update statistics
			this.updateStats(duration)

			// Extract metrics from document
			const metrics = this.extractMetrics(parsedDocument, duration)

			if (diagnostics.length === 0) {
				return {
					valid: true,
					errors: [],
					warnings: [],
					summary: `AsyncAPI document is valid (${duration.toFixed(2)}ms)`,
					metrics,
				}
			} else {
				// Convert diagnostics to validation errors
				const errors: ValidationError[] = diagnostics
					.filter(d => Number(d.severity) === 0) // Error level
					.map(d => ({
						message: d.message,
						keyword: String(d.code || "validation-error"),
						instancePath: d.path?.join('.') || "",
						schemaPath: d.path?.join('.') || "",
					}))

				const warnings = diagnostics
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
	}

	/**
	 * Validate AsyncAPI document from file
	 */
	async validateFile(filePath: string): Promise<ValidationResult> {
		try {
			const {readFile} = await import("node:fs/promises")
			const content = await readFile(filePath, "utf-8")
			return this.validate(content, filePath)
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
	}

	/**
	 * Validate multiple AsyncAPI documents in batch
	 * Returns an array of ValidationResult objects with optimized performance
	 */
	async validateBatch(documents: Array<{content: unknown, identifier?: string}>): Promise<ValidationResult[]> {
		const results: ValidationResult[] = []
		const startTime = performance.now()

		Effect.log(`🔄 Starting batch validation of ${documents.length} documents...`)

		// Process documents in parallel with limited concurrency for memory management
		const BATCH_SIZE = 5 // Process 5 documents concurrently
		const batches: Array<Array<{content: unknown, identifier?: string}>> = []
		
		for (let i = 0; i < documents.length; i += BATCH_SIZE) {
			batches.push(documents.slice(i, i + BATCH_SIZE))
		}

		for (const batch of batches) {
			const batchPromises = batch.map(doc => this.validate(doc.content, doc.identifier))
			const batchResults = await Promise.all(batchPromises)
			results.push(...batchResults)
		}

		const totalDuration = performance.now() - startTime
		Effect.log(`✅ Batch validation completed: ${results.length} documents in ${totalDuration.toFixed(2)}ms`)
		Effect.log(`📊 Valid: ${results.filter(r => r.valid).length}, Invalid: ${results.filter(r => !r.valid).length}`)

		return results
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

// Export additional utility functions
export function validateAsyncAPIEffect(document: unknown, options?: ValidationOptions) {
    return Effect.promise(() => validateAsyncAPIObject(document, options))
}

export function isValidAsyncAPI(result: ValidationResult): boolean {
    return result.valid && result.errors.length === 0
}
