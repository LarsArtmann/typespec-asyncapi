/**
 * Library Integration Utilities
 * 
 * Leverages well-established libraries for better reliability
 * Replaces custom implementations with battle-tested solutions
 * Follows "Don't Reinvent the Wheel" principle
 */

import {Ajv} from "ajv"
import {parse as yamlParse, stringify as yamlStringify} from "yaml"
import {type AsyncAPIDocument} from "@asyncapi/parser"
import {Schema} from "@effect/schema"
import {Effect, pipe} from "effect"
import {glob} from "glob"
import {readFile, writeFile} from "node:fs/promises"
import {join, dirname, extname, basename} from "node:path"

// ============================================================================
// AJV SCHEMA VALIDATION INTEGRATION
// ============================================================================

/** Optimized AJV instance for AsyncAPI validation */
export const optimizedAjv = new Ajv({
	allErrors: true,
	verbose: true,
	strict: false,
	removeAdditional: true,
	useDefaults: true,
	coerceTypes: true
})

// ============================================================================
// YAML PROCESSING UTILITIES
// ============================================================================

/**
 * Parse YAML with proper error handling
 * Replaces custom YAML parsing with js-yaml library
 */
export const parseYaml = Effect.tryPromise({
	try: (content: string) => yamlParse(content),
	catch: (error) => new Error(`YAML parsing failed: ${error.message}`)
})

/**
 * Stringify to YAML with proper formatting
 * Uses js-yaml instead of custom implementation
 */
export const stringifyYaml = (obj: unknown): string => 
	yamlStringify(obj, {
		indent: 2,
		lineWidth: 120,
		minAliasWidth: 0,
		noRefs: true,
		sortKeys: false
	})

// ============================================================================
// FILESYSTEM UTILITIES WITH GLOB
// ============================================================================

/**
 * Find TypeSpec files using glob patterns
 * More reliable than custom file walking
 */
export const findTypeSpecFiles = (pattern: string = "**/*.tsp"): Effect.Effect<readonly string[], Error> =>
	Effect.tryPromise({
		try: () => glob(pattern, {
			ignore: ["node_modules/**", "dist/**", "test-output/**"],
			absolute: false
		}),
		catch: (error) => new Error(`Failed to find TypeSpec files: ${error.message}`)
	})

/**
 * Read file with proper encoding and error handling
 */
export const readTextFile = (path: string): Effect.Effect<string, Error> =>
	Effect.tryPromise({
		try: () => readFile(path, 'utf-8'),
		catch: (error) => new Error(`Failed to read file ${path}: ${error.message}`)
	})

/**
 * Write file with proper directory creation
 */
export const writeTextFile = (path: string, content: string): Effect.Effect<void, Error> =>
	Effect.tryPromise({
		try: () => writeFile(path, content, 'utf-8'),
		catch: (error) => new Error(`Failed to write file ${path}: ${error.message}`)
	})

// ============================================================================
// EFFECT.TS SCHEMA INTEGRATION
// ============================================================================

/** AsyncAPI Document Schema using Effect.TS Schema */
export const AsyncAPIDocumentSchema = Schema.Struct({
	asyncapi: Schema.Literal("3.0.0"),
	info: Schema.Struct({
		title: Schema.String,
		version: Schema.String,
		description: Schema.optional(Schema.String),
		termsOfService: Schema.optional(Schema.String),
		contact: Schema.optional(Schema.Struct({
			name: Schema.optional(Schema.String),
			url: Schema.optional(Schema.String),
			email: Schema.optional(Schema.String)
		})),
		license: Schema.optional(Schema.Struct({
			name: Schema.optional(Schema.String),
			url: Schema.optional(Schema.String)
		}))
	}),
	servers: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
	channels: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
	components: Schema.optional(Schema.Struct({
			schemas: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
			messages: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
			parameters: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
			correlationIds: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
			operationTraits: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
			messageTraits: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
			serverBindings: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
			channelBindings: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
			operationBindings: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
			messageBindings: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
			securitySchemes: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
			servers: Schema.optional(Schema.Record(Schema.String, Schema.Unknown))
		})),
	defaultContentType: Schema.optional(Schema.String)
})

/** Validate AsyncAPI document using Effect.TS Schema */
export const validateAsyncAPIDocument = (doc: unknown): Effect.Effect<AsyncAPIDocument, Error> =>
	pipe(
		Effect.sync(() => Schema.decodeUnknown(AsyncAPIDocumentSchema)(doc)),
		Effect.flatMap(
			Effect.match({
				onSuccess: (result) => 
					result._tag === "Success" 
						? Effect.succeed(result.value)
						: Effect.fail(new Error(`Validation failed: ${result.errors.map(e => e.message).join(", ")}`)),
				onFailure: (error) => Effect.fail(new Error(`Schema decode failed: ${error.message}`))
			})
		)
	)

// ============================================================================
// ASYNCAPI PARSER INTEGRATION
// ============================================================================

/**
 * Parse AsyncAPI document using official parser
 * Replaces custom parsing with battle-tested library
 */
export const parseAsyncAPIDocument = (content: string, format: "json" | "yaml" = "yaml"): Effect.Effect<AsyncAPIDocument, Error> =>
	Effect.gen(function*() {
		// Parse based on format
		const parsedDoc = format === "json" 
			? JSON.parse(content) 
			: yield* parseYaml(content)
		
		// Validate with official parser
		const document = yield* Effect.tryPromise({
			try: () => import("@asyncapi/parser").then(parser => parser.parse(parsedDoc)),
			catch: (error) => new Error(`AsyncAPI parsing failed: ${error.message}`)
		})
		
		// Additional validation with Effect.TS schema
		const validatedDoc = yield* validateAsyncAPIDocument(document)
		
		return validatedDoc
	})

// ============================================================================
// PATH UTILITIES
// ============================================================================

/**
 * Convert file extension to output format
 */
export const getOutputFormat = (filePath: string): "json" | "yaml" => {
	const ext = extname(filePath).toLowerCase()
	return ext === ".json" ? "json" : "yaml"
}

/**
 * Generate output filename with proper extension
 */
export const generateOutputFileName = (baseName: string, format: "json" | "yaml"): string => 
	`${baseName}${format === "json" ? ".json" : ".yaml"}`

/**
 * Safe path joining that resolves properly
 */
export const safePathJoin = (...paths: string[]): string => 
	join(...paths).replace(/\\/g, "/") // Normalize to forward slashes

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Enhanced error with context information
 */
export const createErrorWithContext = (message: string, context: Record<string, unknown>): Error => {
	const contextStr = Object.entries(context)
		.map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
		.join(", ")
	return new Error(`${message} (Context: ${contextStr})`)
}

/**
 * Create structured error for logging and debugging
 */
export const createStructuredError = (
	type: string, 
	message: string, 
	details: Record<string, unknown> = {}
) => ({
	type,
	message,
	timestamp: new Date().toISOString(),
	details,
	stack: new Error().stack?.split("\n").slice(1, 5) // First few stack frames
})

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Create performance timer with Effect.TS
 */
export const createTimer = (): Effect.Effect<() => number, never> =>
	Effect.sync(() => {
		const start = Date.now()
		return () => Date.now() - start
	})

/**
 * Measure execution time of an Effect
 */
export const measureExecution = <A, E>(
	effect: Effect.Effect<A, E>,
	label: string
): Effect.Effect<A, E> =>
	Effect.gen(function*() {
		const timer = yield* createTimer()
		const result = yield* effect
		const duration = timer()
		yield* Effect.log(`⏱️ ${label}: ${duration}ms`)
		return result
	})

// ============================================================================
// EXPORTS - Clean Public API
// ============================================================================

export {
	// AJV integration
	optimizedAjv,
	
	// YAML utilities
	parseYaml,
	stringifyYaml,
	
	// File utilities with glob
	findTypeSpecFiles,
	readTextFile,
	writeTextFile,
	
	// Effect.TS schema integration
	AsyncAPIDocumentSchema,
	validateAsyncAPIDocument,
	
	// AsyncAPI parser integration
	parseAsyncAPIDocument,
	
	// Path utilities
	getOutputFormat,
	generateOutputFileName,
	safePathJoin,
	
	// Error handling
	createErrorWithContext,
	createStructuredError,
	
	// Performance utilities
	createTimer,
	measureExecution
}