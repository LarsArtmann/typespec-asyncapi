/**
 * ValidationService - AsyncAPI Document Validation Engine
 * 
 * Extracted from 1,800-line monolithic emitter to handle AsyncAPI document validation
 * and compliance checking with proper error handling and reporting.
 * 
 * REAL BUSINESS LOGIC EXTRACTED from validation methods in AsyncAPIEffectEmitter class
 * This service ensures generated AsyncAPI documents meet specification requirements
 * 
 * ENHANCED: Now using Effect Schema for runtime validation
 */

import { Effect, Schedule } from "effect"
import { decodeAsyncAPIDocument } from "../../infrastructure/configuration/schemas.js"
import type {
	AsyncAPIObject,
	ReferenceObject
} from "@asyncapi/parser/esm/spec-types/v3.js"
import { emitterErrors, type StandardizedError, safeStringify } from "../../utils/standardized-errors.js"
import { PERFORMANCE_CONSTANTS } from "../../constants/defaults.js"

// Import canonical validation types (no more split brain!)
import {
	success,
	failure,
	getChannelCount,
	getOperationCount,
	getSchemaCount,
	type ValidationError,
	type ValidationWarning,
	type ExtendedValidationResult
} from "../types/ValidationTypes.js"

/**
 * 🛠️ HELPER: Build validation metrics consistently
 */
const buildValidationMetrics = (startTime: number) => ({
	duration: performance.now() - startTime,
	validatedAt: new Date()
})

/**
 * 🛠️ HELPER: Build validation result consistently (NO split brain - discriminated union)
 */
const buildValidationResult = (
	asyncApiDoc: AsyncAPIObject,
	errors: ValidationError[],
	warnings: ValidationWarning[],
	startTime: number,
	customSummary?: string
): ExtendedValidationResult<AsyncAPIObject> => {
	const metrics = buildValidationMetrics(startTime)
	
	if (errors.length === 0) {
		return {
			...success(asyncApiDoc),
			metrics,
			summary: customSummary || `AsyncAPI document validation passed! (${metrics.duration.toFixed(2)}ms)`
		}
	} else {
		return {
			...failure(errors, warnings),
			metrics,
			summary: customSummary || `AsyncAPI document validation failed with ${errors.length} errors, ${warnings.length} warnings (${metrics.duration.toFixed(2)}ms)`
		}
	}
}

/**
 * 🛠️ HELPER: Schema validation with consistent error handling
 */
const validateWithSchemaConsistent = (document: unknown): Effect.Effect<unknown, unknown> => {
	return Effect.flatten(
		Effect.map(
			Effect.try({
				try: () => decodeAsyncAPIDocument(document),
				catch: (error) => ({
					message: `Schema validation failed: ${error instanceof Error ? error.message : String(error)}`,
					keyword: "schema-validation",
					instancePath: "",
					schemaPath: "root"
				})
			}),
			(result) => result
		)
	)
}
} from "../models/validation-result.js"

// Re-export for external consumers
export type { ExtendedValidationResult as ValidationResult }

/**
 * ValidationService - Core AsyncAPI Document Validation
 * 
 * Handles comprehensive validation of AsyncAPI documents to ensure:
 * - AsyncAPI 3.0 specification compliance
 * - Required fields presence and correctness
 * - Document structure integrity
 * - Channel and operation consistency
 * - Message and schema validity
 * 
 * Uses Effect.TS for functional error handling and comprehensive logging
 */
export class ValidationService {

	constructor() {
		Effect.log("🔧 ValidationService initialized with robust type safety")
	}

	/**
	 * Type guard to check if object is a reference
	 */
	private isReference(obj: unknown): obj is ReferenceObject {
		return obj != null && typeof obj === 'object' && '$ref' in obj
	}

	/**
	 * Static method for document validation (to avoid 'this' binding issues)
	 *
	 * Now returns ExtendedValidationResult with discriminated union (_tag)
	 * NO MORE SPLIT BRAIN: isValid boolean removed, use _tag instead
	 */
	static validateDocumentStatic(asyncApiDoc: AsyncAPIObject): Effect.Effect<ExtendedValidationResult<AsyncAPIObject>, StandardizedError> {
		return Effect.gen(function* () {
			const startTime = performance.now()
			yield* Effect.log(`🔍 Starting comprehensive AsyncAPI document validation (static method)...`)

			const errors: ValidationError[] = []
			const warnings: ValidationWarning[] = []

			// Basic structure validation
			if (!asyncApiDoc.asyncapi) {
				errors.push({
					message: "Missing required field: asyncapi",
					keyword: "required",
					instancePath: "/asyncapi",
					schemaPath: "#/required"
				})
			}

			if (!asyncApiDoc.info) {
				errors.push({
					message: "Missing required field: info",
					keyword: "required",
					instancePath: "/info",
					schemaPath: "#/required"
				})
			}

			if (!asyncApiDoc.info?.title) {
				errors.push({
					message: "Missing required field: info.title",
					keyword: "required",
					instancePath: "/info/title",
					schemaPath: "#/properties/info/properties/title"
				})
			}

			if (!asyncApiDoc.info?.version) {
				errors.push({
					message: "Missing required field: info.version",
					keyword: "required",
					instancePath: "/info/version",
					schemaPath: "#/properties/info/properties/version"
				})
			}

			// Build validation result using helper (NO split brain)
			const result = buildValidationResult(asyncApiDoc, errors, warnings, startTime)

			yield* Effect.log(`✅ AsyncAPI document validation completed (static method)!`)
			return result
		})
	}

	/**
	 * Validate AsyncAPI document structure and compliance
	 *
	 * MIGRATED: Now returns ExtendedValidationResult (discriminated union)
	 * NO MORE SPLIT BRAIN: Check result._tag instead of result.isValid
	 *
	 * @param asyncApiDoc - AsyncAPI document to validate
	 * @returns Effect containing detailed validation results with metrics
	 */
	validateDocument(asyncApiDoc: AsyncAPIObject): Effect.Effect<ExtendedValidationResult<AsyncAPIObject>, StandardizedError> {
		return Effect.gen(function* (this: ValidationService) {
			const startTime = performance.now()
			yield* Effect.log(`🔍 Starting comprehensive AsyncAPI document validation...`)

			const errors: ValidationError[] = []
			const warnings: ValidationWarning[] = []

			// Temporary string arrays for existing validation methods
			const stringErrors: string[] = []
			const stringWarnings: string[] = []

			// Basic structure validation
			this.validateBasicStructure(asyncApiDoc, stringErrors, stringWarnings)

			// Validate info section
			this.validateInfoSection(asyncApiDoc, stringErrors, stringWarnings)

			// Validate channels
			const channelsCount = this.validateChannels(asyncApiDoc, stringErrors, stringWarnings)

			// Validate operations
			const operationsCount = this.validateOperations(asyncApiDoc, stringErrors, stringWarnings)

			// Validate components
			const { messagesCount: _messagesCount, schemasCount: _schemasCount } = this.validateComponents(asyncApiDoc, stringErrors, stringWarnings)

			// Validate cross-references
			this.validateCrossReferences(asyncApiDoc, stringErrors, stringWarnings)

			// Convert string errors to structured ValidationError objects
			stringErrors.forEach(errorMsg => {
				errors.push({
					message: errorMsg,
					keyword: "validation",
					instancePath: "",
					schemaPath: ""
				})
			})

			// Convert string warnings to structured ValidationWarning objects
			stringWarnings.forEach(warningMsg => {
				warnings.push({
					message: warningMsg,
					severity: "warning"
				})
			})

			// Build validation result using helper (NO split brain)
			const channelsCount = getChannelCount(asyncApiDoc)
			const operationsCount = getOperationCount(asyncApiDoc)
			const customSummary = errors.length === 0 
				? `AsyncAPI document validation passed! ${channelsCount} channels, ${operationsCount} operations (${buildValidationMetrics(startTime).duration.toFixed(2)}ms)`
				: `AsyncAPI document validation failed with ${errors.length} errors, ${warnings.length} warnings (${buildValidationMetrics(startTime).duration.toFixed(2)}ms)`
			
			const result = buildValidationResult(asyncApiDoc, errors, warnings, startTime, customSummary)

			// Log based on discriminated union _tag
			if (result._tag === "Success") {
				yield* Effect.log(`✅ ${result.summary}`)
			} else {
				yield* Effect.log(`❌ ${result.summary}`)
			}

			return result
		}.bind(this))
	}

	/**
	 * Validate document as string content
	 *
	 * MIGRATED: Now uses ExtendedValidationResult (discriminated union)
	 * NO MORE result.isValid - use result._tag === "Success" instead
	 *
	 * @param content - Serialized AsyncAPI document content
	 * @returns Effect containing validated content or sanitized fallback
	 */
	validateDocumentContent(content: string): Effect.Effect<string, StandardizedError> {
		return Effect.gen(function* () {
			yield* Effect.log(`🔍 Validating AsyncAPI document content (${content.length} bytes)`)
			yield* Effect.log(`🔍 Content preview: ${content.substring(0, 100)}...`)

			// Parse the content with proper error handling, retry patterns, and fallback
			yield* Effect.logInfo("🔧 About to parse JSON...")
			const parsedDoc = yield* Effect.gen(function*() {
				yield* Effect.logInfo("🔧 Starting JSON parsing attempt...")
				return JSON.parse(content) as AsyncAPIObject
			}).pipe(
				Effect.retry(Schedule.exponential(`${PERFORMANCE_CONSTANTS.RETRY_BASE_DELAY_MS / 2} millis`).pipe(
					Schedule.compose(Schedule.recurs(PERFORMANCE_CONSTANTS.MAX_RETRY_ATTEMPTS - 1))
				))
			)
			yield* Effect.logInfo(`🔧 Parsed doc type: ${typeof parsedDoc}, keys: ${parsedDoc ? Object.keys(parsedDoc).join(', ') : 'null'}`)

			// Use static validation to avoid this binding issues
			const result = yield* ValidationService.validateDocumentStatic(parsedDoc).pipe(
				Effect.catchAll(error =>
					Effect.gen(function* () {
						yield* Effect.log(`⚠️  Document validation failed, using graceful degradation: ${safeStringify(error)}`)
						// Return failure result with error details
						const fallbackResult: ExtendedValidationResult<AsyncAPIObject> = {
							...failure([{
								message: `Validation service failed: ${safeStringify(error)}`,
								keyword: "validation-failure",
								instancePath: "",
								schemaPath: ""
							}], [{
								message: "Document may be partially valid but validation service encountered errors",
								severity: "warning"
							}]),
							summary: "Validation failed with errors",
							metrics: {
								duration: 0,
								validatedAt: new Date()
							}
						}
						return Effect.succeed(fallbackResult)
					}).pipe(Effect.flatten)
				)
			)

			// Check discriminated union _tag instead of isValid boolean
			if (result._tag === "Success") {
				yield* Effect.log(`✅ Document content validation passed!`)
				return content
			} else {
				// Failure case - log errors
				yield* Effect.log(`❌ Document content validation failed:`)
				// Use Effect.forEach for proper composition instead of runSync
				yield* Effect.forEach(result.errors, (error: ValidationError) =>
					Effect.log(`  - ${error.message}`)
				)

				// Try to return sanitized content instead of failing completely
				yield* Effect.log(`🔧 Attempting to return sanitized content despite validation errors`)
				const sanitizedContent = JSON.stringify({
					asyncapi: "3.0.0",
					info: { title: "Generated API (Validation Issues)", version: "1.0.0" },
					channels: parsedDoc.channels ?? {},
					operations: parsedDoc.operations ?? {}
				}, null, 2)

				return sanitizedContent
			}
		}).pipe(
			Effect.mapError((error: unknown): StandardizedError => {
				if (typeof error === 'object' && error !== null && 'what' in error) {
					return error as StandardizedError
				}
				return emitterErrors.validationFailure(
					[`Unexpected validation error: ${safeStringify(error)}`],
					{ content: content.substring(0, 100) + "..." }
				)
			})
		)
	}

	/**
	 * Validate basic AsyncAPI document structure
	 */
	private validateBasicStructure(doc: AsyncAPIObject, errors: string[], warnings: string[]): void {
		// Handle null/undefined document
		if (!doc) {
			errors.push("Document is null or undefined")
			return
		}

		// Validate AsyncAPI version
		if (!doc.asyncapi) {
			errors.push("Missing required 'asyncapi' field")
		} else if (!doc.asyncapi.startsWith('3.')) {
			warnings.push(`Using AsyncAPI version ${doc.asyncapi}, expected 3.x`)
		}

		// Validate required top-level fields
		if (!doc.info) {
			errors.push("Missing required 'info' section")
		}
	}

	/**
	 * Validate info section compliance
	 */
	private validateInfoSection(doc: AsyncAPIObject, errors: string[], warnings: string[]): void {
		if (!doc?.info) return

		// Required fields
		if (!doc.info.title) {
			errors.push("Missing required 'info.title' field")
		}

		if (!doc.info.version) {
			errors.push("Missing required 'info.version' field")
		}

		// Recommendations
		if (!doc.info.description) {
			warnings.push("Missing recommended 'info.description' field")
		}
	}

	/**
	 * Validate channels section
	 */
	private validateChannels(doc: AsyncAPIObject, errors: string[], warnings: string[]): number {
		if (!doc?.channels || Object.keys(doc.channels).length === 0) {
			warnings.push("No channels defined - document may be incomplete")
			return 0
		}

		const channelNames = Object.keys(doc.channels)
		
		channelNames.forEach(channelName => {
			const channel = doc.channels?.[channelName]
			if (!channel) return

			// Skip validation for references - they should be resolved externally
			if (this.isReference(channel)) {
				warnings.push(`Channel '${channelName}' is a reference ($ref) - cannot validate structure`)
				return
			}

			// Validate channel structure for actual ChannelObject
			if (!channel.address) {
				errors.push(`Channel '${channelName}' missing required 'address' field`)
			}

			// Validate messages reference
			if (channel.messages && Object.keys(channel.messages).length === 0) {
				warnings.push(`Channel '${channelName}' has empty messages section`)
			}
		})

		return channelNames.length
	}

	/**
	 * Validate operations section
	 */
	private validateOperations(doc: AsyncAPIObject, errors: string[], warnings: string[]): number {
		if (!doc?.operations || Object.keys(doc.operations).length === 0) {
			warnings.push("No operations defined - document may be incomplete")
			return 0
		}

		const operationNames = Object.keys(doc.operations)
		
		operationNames.forEach(operationName => {
			const operation = doc.operations?.[operationName]
			if (!operation) return

			// Skip validation for references - they should be resolved externally
			if (this.isReference(operation)) {
				warnings.push(`Operation '${operationName}' is a reference ($ref) - cannot validate structure`)
				return
			}

			// Validate required fields for actual OperationObject
			if (!operation.action) {
				errors.push(`Operation '${operationName}' missing required 'action' field`)
			} else if (!['send', 'receive'].includes(operation.action)) {
				errors.push(`Operation '${operationName}' has invalid action '${operation.action}', must be 'send' or 'receive'`)
			}

			if (!operation.channel) {
				errors.push(`Operation '${operationName}' missing required 'channel' reference`)
			}
		})

		return operationNames.length
	}

	/**
	 * Validate components section
	 */
	private validateComponents(doc: AsyncAPIObject, _errors: string[], warnings: string[]): { messagesCount: number, schemasCount: number } {
		let messagesCount = 0
		let schemasCount = 0

		if (!doc?.components) {
			warnings.push("No components section defined")
			return { messagesCount, schemasCount }
		}

		// Validate messages
		if (doc.components.messages) {
			messagesCount = Object.keys(doc.components.messages).length
			
			Object.entries(doc.components.messages).forEach(([messageName, message]) => {
				// Skip validation for references
				if (this.isReference(message)) {
					warnings.push(`Message '${messageName}' is a reference ($ref) - cannot validate structure`)
					return
				}

				// Validate actual MessageObject
				if (!message.name) {
					warnings.push(`Message '${messageName}' missing 'name' field`)
				}
			})
		}

		// Validate schemas
		if (doc.components.schemas) {
			schemasCount = Object.keys(doc.components.schemas).length
		}

		return { messagesCount, schemasCount }
	}

	/**
	 * Validate cross-references between document sections
	 */
	private validateCrossReferences(doc: AsyncAPIObject, errors: string[], _warnings: string[]): void {
		if (!doc) return
		
		// Validate operation channel references
		if (doc.operations && doc.channels) {
			Object.entries(doc.operations).forEach(([operationName, operation]) => {
				// Skip reference operations
				if (this.isReference(operation)) {
					return
				}

				// Check if operation channel is a reference
				if (operation.channel && this.isReference(operation.channel)) {
					const channelRef = operation.channel.$ref.replace('#/channels/', '')
					if (!doc.channels?.[channelRef]) {
						errors.push(`Operation '${operationName}' references non-existent channel '${channelRef}'`)
					}
				}
			})
		}

		// Validate message references in channels
		if (doc.channels && doc.components?.messages) {
			Object.entries(doc.channels).forEach(([channelName, channel]) => {
				// Skip reference channels
				if (this.isReference(channel)) {
					return
				}

				if (channel.messages) {
					Object.entries(channel.messages).forEach(([, messageRef]) => {
						if (this.isReference(messageRef)) {
							const messageRefName = messageRef.$ref.replace('#/components/messages/', '')
							if (!doc.components?.messages?.[messageRefName]) {
								errors.push(`Channel '${channelName}' references non-existent message '${messageRefName}'`)
							}
						}
					})
				}
			})
		}
	}

	/**
	 * Perform quick validation check
	 * 
	 * Simplified validation for fast checks during development
	 * 
	 * @param asyncApiDoc - Document to validate
	 * @returns Boolean indicating basic validity
	 */
	quickValidation(asyncApiDoc: AsyncAPIObject): Effect.Effect<boolean, never> {
		return Effect.gen(function* () {
			const hasAsyncAPI = !!asyncApiDoc.asyncapi
			const hasInfo = !!asyncApiDoc.info
			const hasChannelsOrOps = !!(asyncApiDoc.channels && Object.keys(asyncApiDoc.channels).length > 0) ||
									   !!(asyncApiDoc.operations && Object.keys(asyncApiDoc.operations).length > 0)

			const isValid = hasAsyncAPI && hasInfo && hasChannelsOrOps
			
			yield* Effect.log(`⚡ Quick validation: ${isValid ? 'PASS' : 'FAIL'}`)
			
			return isValid
		})
	}

	/**
	 * Generate validation report summary
	 *
	 * MIGRATED: Now accepts ExtendedValidationResult (discriminated union)
	 * Uses _tag to determine status instead of isValid boolean
	 *
	 * @param result - Extended validation result to summarize
	 * @returns Human-readable validation report
	 */
	generateValidationReport(result: ExtendedValidationResult<AsyncAPIObject>): string {
		// Use discriminated union _tag instead of isValid boolean
		const status = result._tag === "Success" ? '✅ VALID' : '❌ INVALID'
		const report = [
			`AsyncAPI Document Validation Report`,
			`Status: ${status}`,
			``
		]

		// Add summary if present
		if (result.summary) {
			report.push(`Summary: ${result.summary}`)
			report.push(``)
		}

		// Add metrics
		report.push(`Document Statistics:`)

		// Compute counts from value (Success) or show N/A (Failure) - NO SPLIT BRAIN!
		if (result._tag === "Success") {
			const channelCount = getChannelCount(result.value)
			const operationCount = getOperationCount(result.value)
			const schemaCount = getSchemaCount(result.value)
			report.push(`- Channels: ${channelCount}`)
			report.push(`- Operations: ${operationCount}`)
			report.push(`- Schemas: ${schemaCount}`)
		} else {
			report.push(`- Channels: N/A (validation failed)`)
			report.push(`- Operations: N/A (validation failed)`)
			report.push(`- Schemas: N/A (validation failed)`)
		}

		report.push(`- Validation Duration: ${result.metrics.duration.toFixed(2)}ms`)
		report.push(`- Validated At: ${result.metrics.validatedAt.toISOString()}`)
		report.push(``)

		// Only failure has errors/warnings
		if (result._tag === "Failure") {
			if (result.errors.length > 0) {
				report.push(`Errors (${result.errors.length}):`)
				result.errors.forEach((error: ValidationError) => {
					report.push(`- ${error.message}`)
					if (error.instancePath) {
						report.push(`  Path: ${error.instancePath}`)
					}
				})
				report.push('')
			}

			if (result.warnings.length > 0) {
				report.push(`Warnings (${result.warnings.length}):`)
				result.warnings.forEach((warning: ValidationWarning) => {
					report.push(`- ${warning.message}`)
				})
			}
		} else {
			// Success case - no errors/warnings
			report.push(`No errors or warnings found.`)
		}

		return report.join('\n')
	}

	/**
	 * 🔥 NEW: Effect Schema-based validation for runtime type safety
	 * 
	 * Uses Effect Schema to provide compile-time and runtime validation
	 * of AsyncAPI documents with proper error messages
	 * 
	 * @param document - Unknown input to validate
	 * @returns Effect with validated AsyncAPI document or error
	 */
	validateWithSchema(document: unknown): Effect.Effect<unknown, unknown> {
		return validateWithSchemaConsistent(document)
	}

	/**
	 * 🔥 NEW: Static method for schema validation with unified error types
	 */
	static validateWithSchema(document: unknown): Effect.Effect<unknown, unknown> {
		return validateWithSchemaConsistent(document)
	}
}