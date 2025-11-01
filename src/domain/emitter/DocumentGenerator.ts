/**
 * DocumentGenerator - AsyncAPI Document Serialization
 *
 * Handles the final generation and serialization of AsyncAPI documents.
 * Supports multiple output formats (JSON/YAML) and provides formatting options.
 *
 * Key Responsibilities:
 * - Document structure validation
 * - JSON/YAML serialization
 * - Format-specific optimization
 * - Output formatting and validation
 * - Content compression (future)
 *
 * MIGRATED TO EFFECT.TS RAILWAY PROGRAMMING (M017)
 * - Eliminates throw statements and try/catch blocks
 * - Implements What/Reassure/Why/Fix/Escape error pattern
 * - Provides comprehensive error context for debugging
 */

import {Effect} from "effect"
import {safeStringify} from "../../utils/standardized-errors.js"
import {stringify} from "yaml"
import type {AsyncAPIObject} from "@asyncapi/parser/esm/spec-types/v3.js"
import {
	DEFAULT_SERIALIZATION_FORMAT,
	SERIALIZATION_FORMAT_OPTION_JSON,
	SERIALIZATION_FORMAT_OPTION_YAML,
	type SerializationFormatOption,
	type SerializationOptions,
} from "../models/serialization-format-option.js"

// Standardized error handling
import { 
	type StandardizedError, 
	createError, 
	failWith, 
	railway 
} from "../../utils/standardized-errors.js"

export type DocumentStats = {
	channels: number
	operations: number
	messages: number
	schemas: number
	securitySchemes: number
	contentLength: number
}

/**
 * AsyncAPI document generator with multi-format support
 */
export class DocumentGenerator {

	/**
	 * Serialize AsyncAPI document to string format with Railway programming
	 */
	serializeDocument(
		document: AsyncAPIObject, 
		format: SerializationFormatOption = DEFAULT_SERIALIZATION_FORMAT
	): Effect.Effect<string, StandardizedError> {
		return Effect.gen(function* (this: DocumentGenerator) {
			yield* Effect.log(`📄 DocumentGenerator: Serializing to ${format.toUpperCase()}`)

			const options: SerializationOptions = {
				format,
				indent: 2,
				compact: false,
				preserveOrder: true,
			}

			return yield* this.serializeWithOptions(document, options)
		})
	}

	/**
	 * Serialize with detailed options using Railway programming
	 */
	serializeWithOptions(
		document: AsyncAPIObject, 
		options: SerializationOptions
	): Effect.Effect<string, StandardizedError> {
		return Effect.gen(function* (this: DocumentGenerator) {
			yield* Effect.log(`📄 Serializing AsyncAPI document with options: ${JSON.stringify(options)}`)

			// Validate document structure before serialization
			yield* this.validateDocumentStructure(document)

			// Generate statistics
			const stats = yield* this.generateDocumentStats(document)
			yield* this.logDocumentStats(stats)

			// Serialize based on format
			switch (options.format) {
				case SERIALIZATION_FORMAT_OPTION_JSON:
					return this.serializeToJSON(document, options)
				case SERIALIZATION_FORMAT_OPTION_YAML:
					return this.serializeToYAML(document, options)
				default:
					return yield* failWith(createError({
						what: `Unsupported serialization format: ${options.format}`,
						reassure: "Only JSON and YAML formats are currently supported",
						why: `Format '${options.format}' is not in the supported list: [json, yaml]`,
						fix: "Use 'json' or 'yaml' as the serialization format",
						escape: "Default to JSON format if format detection fails",
						severity: "error" as const,
						code: "UNSUPPORTED_SERIALIZATION_FORMAT",
						context: { requestedFormat: options.format, supportedFormats: ['json', 'yaml'] }
					}))
			}
		}).pipe(
			Effect.mapError((error: unknown): StandardizedError => {
				if (typeof error === 'object' && error !== null && 'what' in error) {
					return error as StandardizedError
				}
				return createError({
					what: 'Document serialization failed',
					reassure: 'This is a recoverable error that can be fixed',
					why: `Unexpected error during serialization: ${safeStringify(error)}`,
					fix: 'Check document structure and serialization options',
					escape: 'Try with different serialization format',
					severity: 'error' as const,
					code: 'SERIALIZATION_ERROR'
				})
			})
		)
	}

	/**
	 * Serialize to JSON format
	 */
	private serializeToJSON(document: AsyncAPIObject, options: SerializationOptions): string {
		Effect.log(`📄 Generating JSON format`)

		const indent = options.compact ? 0 : (options.indent ?? 2)
		const result = JSON.stringify(document, null, indent)

		Effect.log(`✅ JSON serialization complete: ${result.length} characters`)
		return result
	}

	/**
	 * Serialize to YAML format
	 */
	private serializeToYAML(document: AsyncAPIObject, options: SerializationOptions): string {
		Effect.log(`📄 Generating YAML format`)

		const yamlOptions = {
			indent: options.indent ?? 2,
			lineWidth: options.compact ? -1 : 120,
			minContentWidth: 0,
			sortKeys: !options.preserveOrder,
		}

		const result = stringify(document, yamlOptions)

		Effect.log(`✅ YAML serialization complete: ${result.length} characters`)
		return result
	}

	/**
	 * Validate document structure before serialization using Railway programming
	 */
	private validateDocumentStructure(document: AsyncAPIObject): Effect.Effect<void, StandardizedError> {
		return Effect.gen(function* () {
			yield* Effect.log(`🔍 Validating document structure...`)

			// Check required fields with comprehensive error messages
			if (!document.asyncapi) {
				return yield* failWith(createError({
					what: "AsyncAPI document is missing required 'asyncapi' field",
					reassure: "This is a document structure issue that can be easily fixed",
					why: "AsyncAPI specification requires the 'asyncapi' field to specify the version",
					fix: "Add an 'asyncapi' field with a valid version (e.g., '3.0.0') to the document",
					escape: "Use a default AsyncAPI version or check document creation process",
					severity: "error" as const,
					code: "MISSING_ASYNCAPI_FIELD",
					context: { documentProvided: !!document }
				}))
			}

			if (!document.info) {
				return yield* failWith(createError({
					what: "AsyncAPI document is missing required 'info' section",
					reassure: "This is a document structure issue that can be easily fixed",
					why: "AsyncAPI specification requires an 'info' section with metadata",
					fix: "Add an 'info' section with at least 'title' and 'version' fields",
					escape: "Use DocumentBuilder.createInitialDocument to ensure proper structure",
					severity: "error" as const,
					code: "MISSING_INFO_SECTION",
					context: { documentProvided: !!document, hasAsyncapi: !!document.asyncapi }
				}))
			}

			if (!document.info.title) {
				return yield* failWith(createError({
					what: "AsyncAPI document info section is missing required 'title' field",
					reassure: "This is a metadata validation issue",
					why: "AsyncAPI specification requires 'info.title' to describe the API",
					fix: "Add a 'title' field to the 'info' section with a descriptive API name",
					escape: "Use a generic title like 'AsyncAPI Specification' as placeholder",
					severity: "error" as const,
					code: "MISSING_INFO_TITLE",
					context: { hasInfo: !!document.info, infoKeys: Object.keys(document.info || {}) }
				}))
			}

			if (!document.info.version) {
				return yield* failWith(createError({
					what: "AsyncAPI document info section is missing required 'version' field",
					reassure: "This is a metadata validation issue",
					why: "AsyncAPI specification requires 'info.version' to specify the API version",
					fix: "Add a 'version' field to the 'info' section (e.g., '1.0.0')",
					escape: "Use '1.0.0' as a default API version",
					severity: "error" as const,
					code: "MISSING_INFO_VERSION",
					context: { hasInfo: !!document.info, infoKeys: Object.keys(document.info || {}) }
				}))
			}

			// Validate AsyncAPI version format
			const versionPattern = /^\d+\.\d+\.\d+$/
			if (!versionPattern.test(document.asyncapi)) {
				yield* Effect.logWarning(`⚠️ AsyncAPI version '${document.asyncapi}' may not be valid semantic version`)
			}

			// Check for common structural issues
			if (document.channels && Object.keys(document.channels).length === 0) {
				yield* Effect.logWarning(`⚠️ Document has empty channels object`)
			}

			if (document.operations && Object.keys(document.operations).length === 0) {
				yield* Effect.logWarning(`⚠️ Document has empty operations object`)
			}

			yield* Effect.log(`✅ Document structure validation passed`)
		})
	}

	/**
	 * Generate document statistics using Railway programming
	 */
	private generateDocumentStats(document: AsyncAPIObject): Effect.Effect<DocumentStats, StandardizedError> {
		return Effect.gen(function* () {
			// Safe statistics generation with error handling
			return yield* railway.trySync(() => {
				const stats: DocumentStats = {
					channels: Object.keys(document.channels ?? {}).length,
					operations: Object.keys(document.operations ?? {}).length,
					messages: Object.keys(document.components?.messages ?? {}).length,
					schemas: Object.keys(document.components?.schemas ?? {}).length,
					securitySchemes: Object.keys(document.components?.securitySchemes ?? {}).length,
					contentLength: 0, // Will be set after serialization
				}

				return stats
			}, { context: { operation: "document statistics generation" } })
		})
	}

	/**
	 * Log document statistics using Railway programming
	 */
	private logDocumentStats(stats: DocumentStats): Effect.Effect<void, StandardizedError> {
		return Effect.gen(function* () {
			yield* Effect.log(`📊 Document Statistics:`)
			yield* Effect.log(`  - Channels: ${stats.channels}`)
			yield* Effect.log(`  - Operations: ${stats.operations}`)
			yield* Effect.log(`  - Messages: ${stats.messages}`)
			yield* Effect.log(`  - Schemas: ${stats.schemas}`)
			yield* Effect.log(`  - Security Schemes: ${stats.securitySchemes}`)
		})
	}

	/**
	 * Get document statistics (for external monitoring) using Railway programming
	 */
	getDocumentStats(document: AsyncAPIObject): Effect.Effect<DocumentStats, StandardizedError> {
		return this.generateDocumentStats(document)
	}

	/**
	 * Optimize document for size (remove empty objects, compress whitespace) using Railway programming
	 */
	optimizeDocument(document: AsyncAPIObject): Effect.Effect<AsyncAPIObject, StandardizedError> {
		return Effect.gen(function* (this: DocumentGenerator) {
			yield* Effect.log(`🔧 Optimizing document structure...`)

			// Safe document optimization with error handling
			const optimized = yield* railway.trySync(() => {
				// Deep clone to avoid modifying original
				const cloned = JSON.parse(JSON.stringify(document)) as AsyncAPIObject
				
				// Remove empty objects
				this.removeEmptyObjects(cloned as unknown as Record<string, unknown>)
				
				return cloned
			}, { context: { operation: "document optimization" } })

			yield* Effect.log(`✅ Document optimization complete`)
			return optimized
		})
	}

	/**
	 * Recursively remove empty objects and arrays
	 * Uses union type for safe object manipulation
	 */
	private removeEmptyObjects(obj: Record<string, unknown> | unknown[]): void {
		// Handle arrays
		if (Array.isArray(obj)) {
			return // Arrays are handled by parent object
		}

		// Handle objects
		const objRecord = obj
		const keysToRemove: string[] = []

		Object.keys(objRecord).forEach(key => {
			const value = objRecord[key]

			if (value && typeof value === 'object') {
				if (Array.isArray(value)) {
					// Remove empty arrays
					if (value.length === 0) {
						keysToRemove.push(key)
					}
				} else {
					// Recursively process nested objects
					this.removeEmptyObjects(value as Record<string, unknown>)

					// Remove empty objects
					if (Object.keys(value as Record<string, unknown>).length === 0) {
						keysToRemove.push(key)
					}
				}
			} else if (value === null || value === undefined || value === '') {
				// Remove null, undefined, or empty string values
				keysToRemove.push(key)
			}
		})

		// Safely remove keys without dynamic delete
		keysToRemove.forEach(key => {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete objRecord[key]
		})
	}

	/**
	 * Validate serialized content (basic checks) using Railway programming
	 * RESOLVED: Now returns a proper Effect with Named/TypedErrors
	 */
	validateSerializedContent(
		content: string, 
		format: SerializationFormatOption
	): Effect.Effect<boolean, StandardizedError> {
		return Effect.gen(function* () {
			yield* Effect.log(`🔍 Validating serialized ${format} content...`)

			if (!content || content.trim().length === 0) {
				return yield* failWith(createError({
					what: `Empty ${format} content detected`,
					reassure: "This is usually a serialization issue that can be debugged",
					why: `Serialized content is null, undefined, or empty string`,
					fix: "Check the document serialization process and ensure valid input",
					escape: "Use a simple test document to verify serialization works",
					severity: "error" as const,
					code: "EMPTY_SERIALIZED_CONTENT",
					context: { format, contentLength: content?.length || 0 }
				}))
			}

			if (format === "json") {
				// Safe JSON parsing with Railway programming
				const isValidJson = yield* railway.trySync(() => {
					JSON.parse(content)
					return true
				}, { context: { operation: "JSON validation", format, contentLength: content.length } })
				.pipe(Effect.orElse(() => Effect.succeed(false)))

				if (isValidJson) {
					yield* Effect.log(`✅ Valid JSON format`)
					return true
				} else {
					yield* Effect.logError(`❌ Invalid JSON format`)
					return false
				}
			}

			if (format === "yaml") {
				// Basic YAML validation - check for common syntax issues
				if (content.includes("\t")) {
					yield* Effect.logWarning(`⚠️ YAML contains tabs - may cause parsing issues`)
				}

				// Check for balanced quotes
				const singleQuotes = (content.match(/'/g) || []).length
				const doubleQuotes = (content.match(/"/g) || []).length

				if (singleQuotes % 2 !== 0) {
					yield* Effect.logWarning(`⚠️ Unbalanced single quotes in YAML`)
				}

				if (doubleQuotes % 2 !== 0) {
					yield* Effect.logWarning(`⚠️ Unbalanced double quotes in YAML`)
				}

				yield* Effect.log(`✅ Basic YAML validation passed`)
				return true
			}

			return false
		})
	}

	/**
	 * Generate content preview for debugging
	 */
	generateContentPreview(content: string, maxLength: number = 200): string {
		if (content.length <= maxLength) {
			return content
		}

		const preview = content.substring(0, maxLength)
		return `${preview}...\n[Content truncated - showing first ${maxLength} characters of ${content.length} total]`
	}
}