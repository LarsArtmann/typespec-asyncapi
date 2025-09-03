/**
 * Railway Programming Effect.TS Utilities
 * Eliminates Effect.TS anti-patterns and provides comprehensive Railway programming patterns
 */

import {Effect} from "effect"
import type {EmitContext} from "@typespec/compiler"
import type {AsyncAPIEmitterOptions} from "../options.js"
import {SpecGenerationError} from "../errors/SpecGenerationError.js"

/**
 * Railway Programming Logging - All logging properly composed within Effect contexts
 * FIXES: Scattered Effect.log anti-patterns throughout codebase
 */
export const railwayLogging = {
	/**
	 * Log debug information about operation/schema generation - Railway style
	 */
	logDebugGeneration: (type: "channel" | "operation" | "message" | "security-scheme", id: string, details?: Record<string, unknown>) => {
		return Effect.logDebug(`Generated ${type}: ${id}`, details || {})
	},

	/**
	 * Log initialization messages with proper Effect composition
	 */
	logInitialization: (component: string, details?: Record<string, unknown>) =>
		Effect.logInfo(`🔧 Initializing ${component}...`, details || {}),

	/**
	 * Log successful initialization with proper Effect composition
	 */
	logInitializationSuccess: (component: string) =>
		Effect.logInfo(`✅ ${component} initialized successfully`),

	/**
	 * Log AsyncAPI generation context with proper Railway composition
	 */
	logGenerationContext: (outputFile: string, fileType: string, memoryMonitoring = false) =>
		Effect.logInfo("AsyncAPI generation context initialized", {
			outputFile,
			fileType,
			memoryMonitoring,
		}),

	/**
	 * Log successful AsyncAPI specification generation
	 */
	logSpecGenerationSuccess: (specSize: number, outputFile: string) =>
		Effect.logInfo("AsyncAPI specification generated successfully", {
			specSize,
			outputFile,
		}),

	/**
	 * Log performance metrics with proper Railway composition
	 */
	logPerformanceMetrics: (throughput: number, memoryPerOp: number, totalDuration: number) =>
		Effect.logInfo("Emitter performance metrics", {
			throughput: `${throughput.toFixed(2)} ops/sec`,
			memoryPerOp: `${memoryPerOp.toFixed(0)} bytes`,
			totalDuration: `${totalDuration.toFixed(2)}ms`,
		}),

	/**
	 * Log batch processing completion
	 */
	logBatchCompletion: (processedCount: number, throughput: number, totalDuration: number) =>
		Effect.logInfo("Batch emit completed", {
			processedCount,
			throughput: `${throughput.toFixed(0)} contexts/sec`,
			totalDuration: `${totalDuration.toFixed(2)}ms`,
		}),

	/**
	 * Log validation batch progress with proper Railway composition
	 */
	logValidationBatch: (current: number, total: number, fileName: string) =>
		Effect.logInfo(`📄 [${current}/${total}] Validating: ${fileName}`),

	/**
	 * Log validation results with proper Railway composition
	 */
	logValidationResult: (fileName: string, isValid: boolean, duration: number, details?: string) =>
		isValid
			? Effect.logInfo(`  ✅ VALID: ${fileName} (${duration.toFixed(2)}ms)`, {details})
			: Effect.logError(`  ❌ INVALID: ${fileName} (${duration.toFixed(2)}ms)`, {details}),

	/**
	 * Log performance testing with proper Railway composition
	 */
	logPerformanceTest: (mode: string) =>
		Effect.logInfo(`🚀 Running AsyncAPI Performance Tests in ${mode} mode`),

	/**
	 * Log test completion with proper Railway composition
	 */
	logTestCompletion: (testType: string, duration: number, success: boolean) =>
		success
			? Effect.logInfo(`✅ ${testType} completed successfully (${duration.toFixed(2)}ms)`)
			: Effect.logError(`❌ ${testType} failed (${duration.toFixed(2)}ms)`),
}

/**
 * Railway Programming Validation - Pure Effect composition with proper error handling
 * FIXES: Mixed async/Effect patterns and improper error chaining
 */
export const railwayValidation = {
	/**
	 * Validate program context exists - common pattern used in multiple generation functions
	 */
	validateProgramContext: (context: EmitContext<object>): Effect.Effect<void, SpecGenerationError> => {
		return Effect.gen(function* () {
			if (!context.program) {
				return yield* Effect.fail(new SpecGenerationError("TypeSpec program context missing", {} as AsyncAPIEmitterOptions))
			}
			return Effect.succeed(undefined)
		})
	},

	/**
	 * Log and count decorator state maps - Railway style
	 */
	logStateMapInfo: (mapName: string, mapSize: number) =>
		Effect.logDebug(`Found ${mapSize} items in ${mapName}`),

	/**
	 * Log validation warnings in consistent format - Railway composition
	 * Used by protocol.ts and security.ts decorators
	 */
	logValidationWarnings: (warningType: string, warnings: string[]) =>
		Effect.gen(function* () {
			if (warnings.length > 0) {
				yield* Effect.logWarning(`⚠  ${warningType} validation warnings:`, warnings)
				for (const warning of warnings) {
					yield* Effect.logWarning(`⚠  ${warning}`)
				}
			}
		}),
}

/**
 * Railway Programming Error Handling - Comprehensive error chaining and composition
 * FIXES: Poor error propagation and inconsistent error handling patterns
 */
export const railwayErrorHandling = {
	/**
	 * Handle spec generation errors with consistent logging
	 */
	handleSpecGenerationError: (error: unknown, options: AsyncAPIEmitterOptions) => {
		return Effect.fail(new SpecGenerationError(
			`Failed to generate AsyncAPI spec: ${error}`,
			options,
		))
	},

	/**
	 * Log error with context and re-fail
	 */
	logAndRethrow: <E>(error: E, context: string, details?: Record<string, unknown>) => {
		return Effect.gen(function* () {
			yield* Effect.logError(`${context}`, {
				error: String(error),
				...details,
			})
			return yield* Effect.fail(error)
		})
	},

	/**
	 * Log throughput measurement results in a consistent format - Railway style
	 */
	logThroughputResults: (throughputResult: { operationsPerSecond?: number }, processType: string, count: number) =>
		Effect.gen(function* () {
			yield* Effect.logInfo(`📊 ${processType} completed: ${throughputResult.operationsPerSecond?.toFixed(0) ?? 0} ops/sec`)
			yield* Effect.logInfo(`📊 Processed ${count} items successfully`)
		}),
}

/**
 * Railway Programming Pipeline - Async-first operations with proper Effect composition
 * FIXES: Blocking operations and mixed Promise/Effect patterns
 */
export const railwayPipeline = {
	/**
	 * Execute async operation with proper Effect wrapping and error handling
	 */
	executeAsync: <T>(operation: () => Promise<T>, errorMessage: string) =>
		Effect.tryPromise({
			try: operation,
			catch: (error) => new Error(`${errorMessage}: ${String(error)}`),
		}),

	/**
	 * Chain multiple Effect operations with proper Railway composition
	 */
	chainOperations: <A, B, C, E1, E2>(
		first: Effect.Effect<A, E1>,
		second: (a: A) => Effect.Effect<B, E2>,
		third: (b: B) => Effect.Effect<C, E2>,
	): Effect.Effect<C, E1 | E2> =>
		Effect.flatMap(first, (a) =>
			Effect.flatMap(second(a), third),
		),

	/**
	 * Execute operation with logging and error recovery
	 */
	executeWithLogging: <T, E>(
		operation: Effect.Effect<T, E>,
		operationName: string,
		recovery?: (error: E) => Effect.Effect<T, never>,
	): Effect.Effect<T, E> =>
		Effect.gen(function* () {
			yield* Effect.logDebug(`Starting ${operationName}...`)
			const result = yield* recovery
				? Effect.catchAll(operation, recovery)
				: operation
			yield* Effect.logDebug(`Completed ${operationName} successfully`)
			return result
		}),

	/**
	 * Validate and transform data through Railway pipeline
	 */
	validateAndTransform: <T, U, E>(
		data: T,
		validator: (data: T) => Effect.Effect<T, E>,
		transformer: (data: T) => Effect.Effect<U, E>,
	): Effect.Effect<U, E> =>
		Effect.flatMap(validator(data), transformer),

	/**
	 * Execute batch operations with proper Railway composition
	 */
	executeBatch: <T, U, E>(
		items: T[],
		processor: (item: T, index: number) => Effect.Effect<U, E>,
	): Effect.Effect<U[], E> =>
		Effect.all(items.map((item, index) => processor(item, index))),

	/**
	 * Measure operation performance with proper Effect composition
	 */
	measurePerformance: <T, E>(
		operation: Effect.Effect<T, E>,
		operationName: string,
	): Effect.Effect<{ result: T; duration: number }, E> =>
		Effect.gen(function* () {
			const startTime = performance.now()
			const result = yield* operation
			const duration = performance.now() - startTime
			yield* Effect.logDebug(`${operationName} completed in ${duration.toFixed(2)}ms`)
			return {result, duration}
		}),

	/**
	 * Execute operations with timeout and proper error handling
	 */
	executeWithTimeout: <T, E>(
		operation: Effect.Effect<T, E>,
		timeoutMs: number,
		timeoutMessage: string,
	): Effect.Effect<T, E | Error> =>
		Effect.gen(function* () {
			const timeoutEffect = Effect.sleep(`${timeoutMs} millis`).pipe(
				Effect.flatMap(() => Effect.fail(new Error(timeoutMessage))),
			)
			return yield* Effect.race(operation, timeoutEffect)
		}),
}

