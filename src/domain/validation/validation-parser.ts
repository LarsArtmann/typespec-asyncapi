/**
 * AsyncAPI Parser Integration
 * 
 * Handles integration with @asyncapi/parser library.
 * Converts between parser output and validation types.
 */

import { Effect } from "effect"
import { Parser } from "@asyncapi/parser"
import type { AsyncAPIObject } from "@asyncapi/parser"
import { effectLogging } from "../../utils/effect-helpers.js"
import { extractMetrics } from "./validation-effects.js"
import type { ValidationResult } from "./types.js"

/**
 * Parse document using @asyncapi/parser with error handling
 */
export const parseDocument = (content: string): Effect.Effect<AsyncAPIObject, Error> => {
	return Effect.gen(function* () {
		yield* effectLogging.logInitialization("Parsing AsyncAPI document with @asyncapi/parser...")
		
		const parser = new Parser()
		const parseResult = yield* Effect.tryPromise({
			try: () => parser.parse(content),
			catch: (error) => new Error(`Parse failed: ${error}`)
		})

		yield* effectLogging.logInfo(`Document parsed successfully`)
		return parseResult.document
	})
}

/**
 * Parse and validate in single Effect
 */
export const parseAndValidate = (
	content: string
): Effect.Effect<ValidationResult, Error> => {
	return Effect.gen(function* () {
		const startTime = performance.now()
		
		// Parse the document
		const document = yield* parseDocument(content)
		
		// Extract metrics
		const metrics = yield* extractMetrics(document, performance.now() - startTime)

		// Check for parser diagnostics
		const diagnostics = document.diagnostics || []
		
		if (diagnostics.length === 0) {
			return {
				valid: true,
				errors: [],
				warnings: [],
				summary: `Document parsed and validated successfully`,
				metrics
			}
		}

		// Convert diagnostics to validation errors
		const errors = diagnostics
			.filter(d => d.severity === 0) // Error level
			.map(d => ({
				message: d.message,
				keyword: String(d.code || "parser-error"),
				instancePath: d.path?.join('.') || "",
				schemaPath: d.path?.join('.') || "",
			}))

		const warnings = diagnostics
			.filter(d => d.severity === 1) // Warning level
			.map(d => d.message)

		return {
			valid: errors.length === 0,
			errors,
			warnings,
			summary: `Parser validation completed (${errors.length} errors, ${warnings.length} warnings)`,
			metrics
		}
	})
}

/**
 * Handle document conversion (JSON/YAML) and parsing
 */
export const convertAndParse = (input: unknown): Effect.Effect<ValidationResult, Error> => {
	return Effect.gen(function* () {
		let content: string

		// Convert input to string
		if (typeof input === 'string') {
			content = input
		} else if (typeof input === 'object') {
			content = JSON.stringify(input)
		} else {
			return {
				valid: false,
				errors: [{
					message: `Invalid input type: ${typeof input}`,
					keyword: "type-validation",
					instancePath: "",
					schemaPath: ""
				}],
				warnings: [],
				summary: "Input conversion failed",
				metrics: {
					duration: 0,
					channelCount: 0,
					operationCount: 0,
					schemaCount: 0,
					validatedAt: new Date()
				}
			}
		}

		// Detect content type and parse
		if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
			// JSON content
			return yield* parseAndValidate(content)
		} else if (content.trim().startsWith('asyncapi:')) {
			// YAML content - import YAML parser dynamically
			const yaml = yield* Effect.tryPromise({
				try: () => import("yaml"),
				catch: (error) => new Error(`Failed to import YAML parser: ${error}`)
			})
			
			const parsedContent = yaml.parse(content)
			return yield* parseAndValidate(JSON.stringify(parsedContent))
		} else {
			return {
				valid: false,
				errors: [{
					message: "Unable to determine content format (JSON/YAML)",
					keyword: "format-detection",
					instancePath: "",
					schemaPath: ""
				}],
				warnings: [],
				summary: "Content format detection failed",
				metrics: {
					duration: 0,
					channelCount: 0,
					operationCount: 0,
					schemaCount: 0,
					validatedAt: new Date()
				}
			}
		}
	})
}