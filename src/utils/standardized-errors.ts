/**
 * Standardized Error Handling Utilities
 *
 * Eliminates split-brain error handling by providing consistent Effect.TS patterns
 * across the entire codebase. Implements What/Reassure/Why/Fix/Escape pattern.
 */

import {Effect} from "effect"

/**
 * Base error types following What/Reassure/Why/Fix/Escape pattern
 */
export type ErrorSeverity = "warning" | "error" | "critical"

export type StandardizedError = {
	readonly what: string      // What went wrong (user-friendly)
	readonly reassure: string  // This is recoverable/normal (reassurance)
	readonly why: string       // Technical explanation
	readonly fix: string       // How to resolve
	readonly escape: string    // Fallback/workaround
	readonly severity: ErrorSeverity
	readonly code: string      // Machine-readable error code
	readonly context?: Record<string, unknown>  // Additional context
}

/**
 * Create standardized error with What/Reassure/Why/Fix/Escape pattern
 */
export const createError = (params: {
	what: string
	reassure: string
	why: string
	fix: string
	escape: string
	severity: ErrorSeverity
	code: string
	context?: Record<string, unknown>
}): StandardizedError => ({
	what: params.what,
	reassure: params.reassure,
	why: params.why,
	fix: params.fix,
	escape: params.escape,
	severity: params.severity,
	code: params.code,
	...(params.context ? {context: params.context} : {}),
})

/**
 * Effect.TS error creation utilities
 */
export const failWith = (error: StandardizedError) =>
	Effect.fail(error)

export const warnWith = (error: StandardizedError) =>
	Effect.log(`⚠️ ${error.what}: ${error.why}`)

export const dieWith = (message: string, _context?: Record<string, unknown>) =>
	Effect.die(new Error(message))

/**
 * Common error patterns for TypeSpec AsyncAPI Emitter
 */
export const emitterErrors = {
	/**
	 * TypeSpec compilation errors
	 */
	compilationFailed: (reason: string, source?: string) => createError({
		what: "TypeSpec compilation failed",
		reassure: "This is usually a syntax or type error in your TypeSpec source",
		why: `Compilation failed because: ${reason}`,
		fix: "Check your TypeSpec syntax and fix any type errors",
		escape: "Use a simpler TypeSpec example to test the emitter",
		severity: "error" as const,
		code: "TYPESPEC_COMPILATION_FAILED",
		context: {reason, source},
	}),

	/**
	 * AsyncAPI validation errors
	 */
	invalidAsyncAPI: (validationErrors: string[], document?: unknown) => createError({
		what: "Generated AsyncAPI specification is invalid",
		reassure: "This is a bug in the emitter, not your TypeSpec code",
		why: `AsyncAPI validation failed with errors: ${validationErrors.join(", ")}`,
		fix: "Please report this issue with your TypeSpec source code",
		escape: "Try using a simpler TypeSpec definition to isolate the problem",
		severity: "error" as const,
		code: "ASYNCAPI_VALIDATION_FAILED",
		context: {validationErrors, document},
	}),

	/**
	 * Plugin system errors
	 */
	pluginInitializationFailed: (pluginName: string, error: unknown) => createError({
		what: `Plugin "${pluginName}" failed to initialize`,
		reassure: "The emitter will continue without this plugin",
		why: `Plugin initialization failed: ${error instanceof Error ? error.message : String(error)}`,
		fix: "Check plugin configuration and dependencies",
		escape: "Disable the plugin or use default protocol bindings",
		severity: "warning" as const,
		code: "PLUGIN_INITIALIZATION_FAILED",
		context: {pluginName, error},
	}),

	/**
	 * Configuration errors
	 */
	invalidConfiguration: (configPath: string, reason: string) => createError({
		what: "Emitter configuration is invalid",
		reassure: "Default configuration will be used instead",
		why: `Configuration at "${configPath}" is invalid: ${reason}`,
		fix: "Check your configuration file syntax and values",
		escape: "Delete the configuration file to use defaults",
		severity: "warning" as const,
		code: "INVALID_CONFIGURATION",
		context: {configPath, reason},
	}),

	/**
	 * Performance threshold violations
	 */
	performanceThresholdExceeded: (metric: string, actual: number, threshold: number) => createError({
		what: `Performance threshold exceeded for ${metric}`,
		reassure: "The emitter completed successfully but slower than expected",
		why: `${metric} took ${actual}ms, which exceeds the ${threshold}ms threshold`,
		fix: "Consider simplifying your TypeSpec model or increasing timeout limits",
		escape: "The generated AsyncAPI should still be valid",
		severity: "warning" as const,
		code: "PERFORMANCE_THRESHOLD_EXCEEDED",
		context: {metric, actual, threshold},
	}),

	/**
	 * File system errors
	 */
	fileSystemError: (operation: string, path: string, error: unknown) => createError({
		what: `File system operation "${operation}" failed`,
		reassure: "This is usually a permissions or disk space issue",
		why: `Could not ${operation} "${path}": ${error instanceof Error ? error.message : String(error)}`,
		fix: "Check file permissions and available disk space",
		escape: "Try using a different output directory with proper permissions",
		severity: "error" as const,
		code: "FILE_SYSTEM_ERROR",
		context: {operation, path, error},
	}),

	/**
	 * General validation failure errors
	 */
	validationFailure: (errors: string[], context?: unknown) => createError({
		what: "Validation failed",
		reassure: "This indicates an issue with the data being validated",
		why: `Validation failed with errors: ${errors.join(", ")}`,
		fix: "Check the input data and ensure it meets validation requirements",
		escape: "Try using simpler or default values",
		severity: "error" as const,
		code: "VALIDATION_FAILURE",
		context: {errors, additionalContext: context},
	}),

	/**
	 * Emitter initialization errors
	 */
	emitterInitializationFailed: (reason: string, emitter?: unknown) => createError({
		what: "AsyncAPI emitter failed to initialize",
		reassure: "This is a configuration issue, not a problem with your TypeSpec code",
		why: `Emitter initialization failed because: ${reason}`,
		fix: "Check your TypeSpec emitter configuration and ensure AssetEmitter is properly configured",
		escape: "Try using the default emitter configuration or report this issue",
		severity: "critical" as const,
		code: "EMITTER_INITIALIZATION_FAILED",
		context: {reason, emitter},
	}),
}

/**
 * Railway programming utilities for Effect.TS
 */
export const railway = {
	/**
	 * Transform standard JavaScript Error to StandardizedError
	 */
	fromError: (error: Error, context?: Record<string, unknown>) => createError({
		what: "An unexpected error occurred",
		reassure: "This is likely a temporary issue",
		why: error.message,
		fix: "Try the operation again, or report this issue if it persists",
		escape: "Check your input and try with simpler data OR report this error at https://github.com/LarsArtmann/typespec-asyncapi/",
		severity: "error" as const,
		code: "UNEXPECTED_ERROR",
		context: {originalError: error.message, stack: error.stack, ...context},
	}),

	/**
	 * Transform unknown error to StandardizedError
	 */
	fromUnknown: (error: unknown, context?: Record<string, unknown>) => createError({
		what: "An unknown error occurred",
		reassure: "The system is designed to handle unexpected situations",
		why: `Unknown error type: ${typeof error} - ${String(error)}`,
		fix: "Please report this error with the context information",
		escape: "Try restarting the operation or using different input",
		severity: "error" as const,
		code: "UNKNOWN_ERROR",
		context: {originalError: error, ...context},
	}),

	/**
	 * Safe execution with automatic error transformation
	 */
	trySync: <T>(fn: () => T, context?: Record<string, unknown>) =>
		Effect.try({
			try: fn,
			catch: (error) => error instanceof Error
				? railway.fromError(error, context)
				: railway.fromUnknown(error, context),
		}),

	/**
	 * Safe async execution with automatic error transformation
	 */
	tryAsync: <T>(fn: () => Promise<T>, context?: Record<string, unknown>) =>
		Effect.tryPromise({
			try: fn,
			catch: (error) => error instanceof Error
				? railway.fromError(error, context)
				: railway.fromUnknown(error, context),
		}),

	/**
	 * Chain operations with proper error propagation
	 */
	chain: <A, B>(
		effect: Effect.Effect<A, StandardizedError>,
		fn: (a: A) => Effect.Effect<B, StandardizedError>,
	) => Effect.flatMap(effect, fn),

	/**
	 * Combine multiple effects with error collection
	 */
	all: <T1, T2 extends readonly Effect.Effect<T1, StandardizedError>[]>(effects: T2) =>
		Effect.all(effects),

	/**
	 * Provide fallback for failed operations
	 */
	fallback: <A>(
		effect: Effect.Effect<A, StandardizedError>,
		fallbackValue: A,
	) => Effect.orElse(effect, () => Effect.succeed(fallbackValue)),

	/**
	 * Log error and continue (useful for non-critical operations)
	 */
	logAndContinue: <A>(
		effect: Effect.Effect<A, StandardizedError>,
		defaultValue: A,
	) =>
		Effect.tapError(effect, (error) =>
			Effect.log(`⚠️ Non-critical error: ${error.what} - ${error.why}`),
		).pipe(Effect.orElse(() => Effect.succeed(defaultValue))),
}

/**
 * Error formatting utilities
 */
export const errorFormatters = {
	/**
	 * Format error for user display (What/Reassure pattern)
	 */
	forUser: (error: StandardizedError): string =>
		`${error.what}. ${error.reassure}`,

	/**
	 * Format error for developer display (Why/Fix pattern)
	 */
	forDeveloper: (error: StandardizedError): string =>
		`${error.why}. ${error.fix}`,

	/**
	 * Format error for logging (complete information)
	 */
	forLogging: (error: StandardizedError): string =>
		`[${error.code}] ${error.what} | Why: ${error.why} | Fix: ${error.fix} | Escape: ${error.escape}` +
		(error.context ? ` | Context: ${JSON.stringify(error.context)}` : ""),

	/**
	 * Format error as structured log entry
	 */
	toLogEntry: (error: StandardizedError) => ({
		timestamp: new Date().toISOString(),
		level: error.severity,
		code: error.code,
		what: error.what,
		why: error.why,
		fix: error.fix,
		escape: error.escape,
		context: error.context,
	}),
}

/**
 * Validation utilities that return standardized errors
 */
export const validators = {
	/**
	 * Validate required string field
	 */
	requiredString: (value: unknown, fieldName: string) =>
		typeof value === "string" && value.trim().length > 0
			? Effect.succeed(value.trim())
			: failWith(createError({
				what: `${fieldName} is required`,
				reassure: "This is a validation issue, not a system error",
				why: `${fieldName} must be a non-empty string, got: ${typeof value}`,
				fix: `Provide a valid string value for ${fieldName}`,
				escape: `Use a placeholder value like "default-${fieldName.toLowerCase()}"`,
				severity: "error" as const,
				code: "REQUIRED_FIELD_MISSING",
				context: {fieldName, receivedType: typeof value, receivedValue: value},
			})),

	/**
	 * Validate optional string field
	 */
	optionalString: (value: unknown, fieldName: string) =>
		value === undefined || value === null
			? Effect.succeed(undefined)
			: typeof value === "string"
				? Effect.succeed(value.trim())
				: failWith(createError({
					what: `${fieldName} must be a string if provided`,
					reassure: "This is a type validation issue",
					why: `${fieldName} must be string | undefined, got: ${typeof value}`,
					fix: `Provide a string value or omit ${fieldName}`,
					escape: `Remove ${fieldName} to use the default`,
					severity: "error" as const,
					code: "INVALID_FIELD_TYPE",
					context: {fieldName, expectedType: "string | undefined", receivedType: typeof value},
				})),

	/**
	 * Validate array with specific element type
	 */
	arrayOf: <T>(
		value: unknown,
		fieldName: string,
		elementValidator: (item: unknown, index: number) => Effect.Effect<T, StandardizedError>,
	) => {
		if (!Array.isArray(value)) {
			return failWith(createError({
				what: `${fieldName} must be an array`,
				reassure: "This is a type validation issue",
				why: `${fieldName} must be an array, got: ${typeof value}`,
				fix: `Provide an array for ${fieldName}`,
				escape: `Use an empty array [] for ${fieldName}`,
				severity: "error" as const,
				code: "INVALID_FIELD_TYPE",
				context: {fieldName, expectedType: "array", receivedType: typeof value},
			}))
		}

		return Effect.all(
			value.map((item, index) => elementValidator(item, index)),
		)
	},
}

/**
 * Safe string conversion utilities for template literals
 * 
 * Addresses @typescript-eslint/restrict-template-expressions errors
 * by providing type-safe string conversion for Effect.TS errors and unknown values
 */

/**
 * Safely convert any value to string for template literals
 * 
 * @param value - The value to convert (can be anything including Effect errors)
 * @param fallback - Optional fallback string if conversion fails
 * @returns Safe string representation
 */
export const safeStringify = (value: unknown, fallback = "unknown"): string => {
	// Handle null/undefined
	if (value === null) return "null"
	if (value === undefined) return "undefined"
	
	// Handle primitives
	if (typeof value === "string") return value
	if (typeof value === "number") return String(value)
	if (typeof value === "boolean") return String(value)
	if (typeof value === "bigint") return `${value}n`
	if (typeof value === "symbol") return value.toString()
	
	// Handle StandardizedError
	if (isStandardizedError(value)) {
		return `${value.what} (${value.code})`
	}
	
	// Handle Error objects
	if (value instanceof Error) {
		return `${value.name}: ${value.message}`
	}
	
	// Handle objects with toString using Effect.try
	if (typeof value.toString === "function" && value.toString !== Object.prototype.toString) {
		const toStringResult = Effect.runSync(
			Effect.try({
				try: () => value.toString(),
				catch: () => null // Return null on error to fall through
			})
		)

		if (toStringResult && typeof toStringResult === "string" && toStringResult.length > 0 && toStringResult !== "[object Object]") {
			return toStringResult
		}
	}

	// Handle objects using Effect.try
	if (typeof value === "object") {
		const jsonResult = Effect.runSync(
			Effect.try({
				try: () => JSON.stringify(value),
				catch: () => null // Return null to trigger fallback
			})
		)

		if (jsonResult) {
			if (jsonResult.length > 200) {
				return `${jsonResult.substring(0, 200)}...`
			}
			return jsonResult
		}
		return fallback
	}
	
	// Fallback for functions or other types
	return fallback
}

/**
 * Type guard for StandardizedError
 */
export const isStandardizedError = (value: unknown): value is StandardizedError => {
	return typeof value === "object" && 
		   value !== null && 
		   "what" in value && 
		   "why" in value && 
		   "fix" in value &&
		   typeof value.what === "string"
}

/**
 * Safe template literal helper for common error patterns
 * 
 * @param template - Template string with ${value} placeholders
 * @param values - Values to safely interpolate
 * @returns Safe string with all values converted safely
 */
export const safeTemplate = (template: string, ...values: unknown[]): string => {
	let result = template
	
	values.forEach((value, index) => {
		const safeValue = safeStringify(value)
		result = result.replace(new RegExp(`\\$\\{${index}\\}`, "g"), safeValue)
	})
	
	return result
}