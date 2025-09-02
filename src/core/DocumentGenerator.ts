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
 */

import {Effect} from "effect"
import {stringify} from "yaml"
import type {AsyncAPIObject} from "@asyncapi/parser/esm/spec-types/v3.js"
import {
	DEFAULT_SERIALIZATION_FORMAT,
	SERIALIZATION_FORMAT_OPTION_JSON,
	SERIALIZATION_FORMAT_OPTION_YAML,
	type SerializationFormatOptions,
	type SerializationOptions,
} from "./serialization-format-options.js"

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
	 * Serialize AsyncAPI document to string format
	 */
	serializeDocument(document: AsyncAPIObject, format: SerializationFormatOptions = DEFAULT_SERIALIZATION_FORMAT): string {
		Effect.log(`📄 DocumentGenerator: Serializing to ${format.toUpperCase()}`)

		const options: SerializationOptions = {
			format,
			indent: 2,
			compact: false,
			preserveOrder: true,
		}

		return this.serializeWithOptions(document, options)
	}

	/**
	 * Serialize with detailed options
	 */
	serializeWithOptions(document: AsyncAPIObject, options: SerializationOptions): string {
		Effect.log(`📄 Serializing AsyncAPI document with options: ${JSON.stringify(options)}`)

		// Validate document structure before serialization
		this.validateDocumentStructure(document)

		// Generate statistics
		const stats = this.generateDocumentStats(document)
		this.logDocumentStats(stats)

		// Serialize based on format
		switch (options.format) {
			case SERIALIZATION_FORMAT_OPTION_JSON:
				return this.serializeToJSON(document, options)
			case SERIALIZATION_FORMAT_OPTION_YAML:
				return this.serializeToYAML(document, options)
			default:
				throw new Error(`Unsupported format: ${options.format}`)
		}
	}

	/**
	 * Serialize to JSON format
	 */
	private serializeToJSON(document: AsyncAPIObject, options: SerializationOptions): string {
		Effect.log(`📄 Generating JSON format`)

		const indent = options.compact ? 0 : (options.indent || 2)
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
			indent: options.indent || 2,
			lineWidth: options.compact ? -1 : 120,
			minContentWidth: 0,
			sortKeys: !options.preserveOrder,
		}

		const result = stringify(document, yamlOptions)

		Effect.log(`✅ YAML serialization complete: ${result.length} characters`)
		return result
	}

	/**
	 * Validate document structure before serialization
	 */
	private validateDocumentStructure(document: AsyncAPIObject): void {
		Effect.log(`🔍 Validating document structure...`)

		// Check required fields
		if (!document.asyncapi) {
			throw new Error("Missing required field: asyncapi")
		}

		if (!document.info) {
			throw new Error("Missing required field: info")
		}

		if (!document.info.title) {
			throw new Error("Missing required field: info.title")
		}

		if (!document.info.version) {
			throw new Error("Missing required field: info.version")
		}

		// Validate AsyncAPI version format
		const versionPattern = /^\d+\.\d+\.\d+$/
		if (!versionPattern.test(document.asyncapi)) {
			Effect.logWarning(`⚠️ AsyncAPI version '${document.asyncapi}' may not be valid semantic version`)
		}

		// Check for common structural issues
		if (document.channels && Object.keys(document.channels).length === 0) {
			Effect.logWarning(`⚠️ Document has empty channels object`)
		}

		if (document.operations && Object.keys(document.operations).length === 0) {
			Effect.logWarning(`⚠️ Document has empty operations object`)
		}

		Effect.log(`✅ Document structure validation passed`)
	}

	/**
	 * Generate document statistics
	 */
	private generateDocumentStats(document: AsyncAPIObject): DocumentStats {
		const stats: DocumentStats = {
			channels: Object.keys(document.channels || {}).length,
			operations: Object.keys(document.operations || {}).length,
			messages: Object.keys(document.components?.messages || {}).length,
			schemas: Object.keys(document.components?.schemas || {}).length,
			securitySchemes: Object.keys(document.components?.securitySchemes || {}).length,
			contentLength: 0, // Will be set after serialization
		}

		return stats
	}

	/**
	 * Log document statistics
	 */
	private logDocumentStats(stats: DocumentStats): void {
		Effect.log(`📊 Document Statistics:`)
		Effect.log(`  - Channels: ${stats.channels}`)
		Effect.log(`  - Operations: ${stats.operations}`)
		Effect.log(`  - Messages: ${stats.messages}`)
		Effect.log(`  - Schemas: ${stats.schemas}`)
		Effect.log(`  - Security Schemes: ${stats.securitySchemes}`)
	}

	/**
	 * Get document statistics (for external monitoring)
	 */
	getDocumentStats(document: AsyncAPIObject): DocumentStats {
		return this.generateDocumentStats(document)
	}

	/**
	 * Optimize document for size (remove empty objects, compress whitespace)
	 */
	optimizeDocument(document: AsyncAPIObject): AsyncAPIObject {
		Effect.log(`🔧 Optimizing document structure...`)

		// Deep clone to avoid modifying original
		const optimized = JSON.parse(JSON.stringify(document)) as AsyncAPIObject

		// Remove empty objects
		this.removeEmptyObjects(optimized)

		Effect.log(`✅ Document optimization complete`)
		return optimized
	}

	//TODO: NO FUCKING ANY!
	/**
	 * Recursively remove empty objects and arrays
	 */
	private removeEmptyObjects(obj: any): void {
		Object.keys(obj).forEach(key => {
			const value = obj[key]

			if (value && typeof value === 'object') {
				if (Array.isArray(value)) {
					// Remove empty arrays
					if (value.length === 0) {
						delete obj[key]
					}
				} else {
					// Recursively process nested objects
					this.removeEmptyObjects(value)

					// Remove empty objects
					if (Object.keys(value).length === 0) {
						delete obj[key]
					}
				}
			} else if (value === null || value === undefined || value === '') {
				// Remove null, undefined, or empty string values
				delete obj[key]
			}
		})
	}

	//TODO: This my should return a proper Effect with all it's Named/TypedErrors!
	/**
	 * Validate serialized content (basic checks)
	 */
	validateSerializedContent(content: string, format: SerializationFormatOptions): boolean {
		Effect.log(`🔍 Validating serialized ${format} content...`)

		if (!content || content.trim().length === 0) {
			Effect.logError(`❌ Empty ${format} content`)
			return false
		}

		if (format === "json") {
			try {
				JSON.parse(content)
				Effect.log(`✅ Valid JSON format`)
				return true
			} catch (error) {
				Effect.logError(`❌ Invalid JSON format: ${error}`)
				return false
			}
		}

		if (format === "yaml") {
			// Basic YAML validation - check for common syntax issues
			if (content.includes("\t")) {
				Effect.logWarning(`⚠️ YAML contains tabs - may cause parsing issues`)
			}

			// Check for balanced quotes
			const singleQuotes = (content.match(/'/g) || []).length
			const doubleQuotes = (content.match(/"/g) || []).length

			if (singleQuotes % 2 !== 0) {
				Effect.logWarning(`⚠️ Unbalanced single quotes in YAML`)
			}

			if (doubleQuotes % 2 !== 0) {
				Effect.logWarning(`⚠️ Unbalanced double quotes in YAML`)
			}

			Effect.log(`✅ Basic YAML validation passed`)
			return true
		}

		return false
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