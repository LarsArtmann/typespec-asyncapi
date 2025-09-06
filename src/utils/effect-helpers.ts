/**
 * Railway Programming Effect.TS Utilities
 * Eliminates Effect.TS anti-patterns and provides comprehensive Railway programming patterns
 */

import {Effect, Schedule, TSemaphore} from "effect"
import {existsSync, readFileSync, writeFileSync} from "fs"
import type {EmitContext} from "@typespec/compiler"
import type {AsyncAPIEmitterOptions} from "../infrastructure/configuration/options.js"
import {SpecGenerationError} from "../domain/models/errors/SpecGenerationError.js"

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

/**
 * ERROR RECOVERY MECHANISMS (M020) - Comprehensive Error Recovery Patterns
 * 
 * Implements graceful degradation, automatic retry, circuit breaker patterns,
 * and comprehensive fallback strategies for all failure modes.
 */
export const railwayErrorRecovery = {
	/**
	 * Retry operations with exponential backoff
	 */
	retryWithBackoff: <T, E>(
		operation: Effect.Effect<T, E>,
		maxRetries: number = 3,
		baseDelayMs: number = 100,
		maxDelayMs: number = 5000
	): Effect.Effect<T, E> => {
		const retrySchedule = Schedule.exponential(`${baseDelayMs} millis`, 2.0)
			.pipe(
				Schedule.upTo(`${maxDelayMs} millis`),
				Schedule.compose(Schedule.recurs(maxRetries))
			)

		return operation.pipe(
			Effect.retry(retrySchedule),
			Effect.tapError(error => 
				Effect.logWarning(`Operation failed after ${maxRetries} retries`, { error: String(error) })
			)
		)
	},

	/**
	 * Circuit breaker pattern for external dependencies
	 */
	circuitBreaker: <T, E>(
		operation: Effect.Effect<T, E>,
		failureThreshold: number = 5,
		timeoutMs: number = 10000
	): Effect.Effect<T, E | Error> => {
		// Simple circuit breaker implementation
		let failureCount = 0
		let lastFailureTime = 0
		
		return Effect.gen(function* () {
			const now = Date.now()
			
			// Check if circuit is open (too many failures recently)
			if (failureCount >= failureThreshold && (now - lastFailureTime) < timeoutMs) {
				return yield* Effect.fail(new Error("Circuit breaker is OPEN - too many recent failures"))
			}
			
			// Reset failure count after timeout period
			if ((now - lastFailureTime) >= timeoutMs) {
				failureCount = 0
			}
			
			// Execute operation with failure tracking
			return yield* operation.pipe(
				Effect.tapError(() => Effect.sync(() => {
					failureCount++
					lastFailureTime = now
				})),
				Effect.tap(() => Effect.sync(() => {
					// Reset on success
					failureCount = 0
				}))
			)
		})
	},

	/**
	 * Graceful degradation with fallback values
	 */
	gracefulDegrade: <T, E>(
		primaryOperation: Effect.Effect<T, E>,
		fallbackValue: T,
		degradedModeMessage?: string
	): Effect.Effect<T, never> => {
		return primaryOperation.pipe(
			Effect.orElse(() => 
				Effect.gen(function* () {
					if (degradedModeMessage) {
						yield* Effect.logWarning(degradedModeMessage)
					}
					yield* Effect.logInfo("Switching to degraded mode with fallback value")
					return fallbackValue
				})
			)
		)
	},

	/**
	 * Multi-level fallback chain
	 */
	fallbackChain: <T, E>(
		operations: Effect.Effect<T, E>[],
		finalFallback: T
	): Effect.Effect<T, never> => {
		if (operations.length === 0) {
			return Effect.succeed(finalFallback)
		}

		const [primary, ...alternatives] = operations
		
		if (!primary) {
			return Effect.succeed(finalFallback)
		}
		
		return primary.pipe(
			Effect.orElse(() => {
				if (alternatives.length > 0) {
					return railwayErrorRecovery.fallbackChain(alternatives, finalFallback)
				} else {
					return Effect.succeed(finalFallback)
				}
			})
		)
	},

	/**
	 * Partial failure handling - collect successes and report failures
	 */
	partialFailureHandling: <T, E>(
		operations: Effect.Effect<T, E>[],
		minSuccessCount: number = 1
	): Effect.Effect<{ successes: T[]; failures: E[] }, Error> => {
		return Effect.gen(function* () {
			const results = yield* Effect.all(
				operations.map(op => 
					op.pipe(
						Effect.either
					)
				),
				{ concurrency: "inherit" }
			)

			const successes: T[] = []
			const failures: E[] = []

			for (const result of results) {
				if (result._tag === "Right") {
					successes.push(result.right)
				} else {
					failures.push(result.left)
				}
			}

			if (successes.length < minSuccessCount) {
				return yield* Effect.fail(new Error(
					`Insufficient successes: ${successes.length}/${minSuccessCount} required`
				))
			}

			return { successes, failures }
		}).pipe(
			Effect.mapError((error: unknown): Error => {
				if (error instanceof Error) {
					return error
				}
				return new Error(`Partial failure handling error: ${String(error)}`)
			})
		)
	},

	/**
	 * Timeout with graceful recovery
	 */
	timeoutWithRecovery: <T, E>(
		operation: Effect.Effect<T, E>,
		timeoutMs: number,
		recoveryOperation: Effect.Effect<T, never>
	): Effect.Effect<T, E> => {
		const timeoutEffect = Effect.sleep(`${timeoutMs} millis`).pipe(
			Effect.flatMap(() => 
				Effect.gen(function* () {
					yield* Effect.logWarning(`Operation timed out after ${timeoutMs}ms, switching to recovery`)
					return yield* recoveryOperation
				})
			)
		)

		return Effect.race(operation, timeoutEffect)
	},

	/**
	 * Bulkhead pattern - isolate failures
	 */
	bulkheadIsolation: <T, E>(
		operation: Effect.Effect<T, E>,
		maxConcurrent: number = 10
	): Effect.Effect<T, E | Error> => {
		// Simplified bulkhead using semaphore
		return Effect.gen(function* () {
			const semaphore = yield* TSemaphore.make(maxConcurrent)
			yield* TSemaphore.acquire(semaphore)
			const result = yield* operation
			yield* TSemaphore.release(semaphore)
			return result
		}).pipe(
			Effect.mapError((error: unknown): E | Error => {
				if (error instanceof Error) {
					return error
				}
				// Try to cast to E type first, then fallback to Error
				return new Error(`Bulkhead operation failed: ${String(error)}`)
			})
		)
	},

	/**
	 * Health check with automatic recovery
	 */
	healthCheckWithRecovery: <T, E>(
		healthCheck: Effect.Effect<boolean, E>,
		operation: Effect.Effect<T, E>,
		recoveryAction: Effect.Effect<void, never>
	): Effect.Effect<T, E | Error> => {
		return Effect.gen(function* () {
			const isHealthy = yield* healthCheck.pipe(
				Effect.orElse(() => Effect.succeed(false))
			)

			if (!isHealthy) {
				yield* Effect.logWarning("Health check failed, attempting recovery")
				yield* recoveryAction
				
				// Re-check health after recovery
				const isHealthyAfterRecovery = yield* healthCheck.pipe(
					Effect.orElse(() => Effect.succeed(false))
				)
				
				if (!isHealthyAfterRecovery) {
					return yield* Effect.fail(new Error("System unhealthy and recovery failed"))
				}
			}

			return yield* operation
		})
	},

	/**
	 * Resource cleanup with error recovery
	 */
	withResourceCleanup: <T, R, E>(
		acquire: Effect.Effect<R, E>,
		use: (resource: R) => Effect.Effect<T, E>,
		release: (resource: R) => Effect.Effect<void, never>
	): Effect.Effect<T, E> => {
		return Effect.acquireUseRelease(
			acquire,
			use,
			(resource, _exit) => 
				release(resource).pipe(
					Effect.tapError(error => 
						Effect.logError("Resource cleanup failed", { error: String(error) })
					),
					Effect.orElse(() => Effect.void)
				)
		)
	}
}

/**
 * Railway Programming File System Operations - Extract common Effect.try patterns
 * FIXES: Duplicated Effect.try patterns in PerformanceRegressionTester and other files
 */
export const railwayFileSystem = {
	/**
	 * Read file with proper Effect.try error handling - extracted common pattern
	 */
	readFileEffect: (filePath: string, context?: string) =>
		Effect.try({
			try: () => readFileSync(filePath, 'utf-8'),
			catch: (error) => new Error(`Failed to read ${context || 'file'} (${filePath}): ${error}`)
		}),

	/**
	 * Parse JSON with proper Effect.try error handling - extracted common pattern
	 */
	parseJsonEffect: <T>(jsonString: string, context?: string) =>
		Effect.try({
			try: () => JSON.parse(jsonString) as T,
			catch: (error) => new Error(`Failed to parse ${context || 'JSON'}: ${error}`)
		}),

	/**
	 * Write file with proper Effect.try error handling - extracted common pattern
	 */
	writeFileEffect: (filePath: string, data: string, context?: string) =>
		Effect.try({
			try: () => writeFileSync(filePath, data),
			catch: (error) => new Error(`Failed to write ${context || 'file'} (${filePath}): ${error}`)
		}),

	/**
	 * Read and parse JSON file - combines common read + parse pattern
	 */
	readJsonFileEffect: <T>(filePath: string, context?: string) =>
		Effect.flatMap(
			railwayFileSystem.readFileEffect(filePath, context),
			(content) => railwayFileSystem.parseJsonEffect<T>(content, context)
		),

	/**
	 * Write JSON file with proper formatting - combines stringify + write pattern
	 */
	writeJsonFileEffect: <T>(filePath: string, data: T, context?: string) =>
		Effect.try({
			try: () => writeFileSync(filePath, JSON.stringify(data, null, 2)),
			catch: (error) => new Error(`Failed to write ${context || 'JSON file'} (${filePath}): ${error}`)
		}),

	/**
	 * Safe file existence check - no exceptions
	 */
	fileExistsEffect: (filePath: string) =>
		Effect.sync(() => existsSync(filePath)),

	/**
	 * Read file with default value if it doesn't exist - common pattern
	 */
	readFileWithDefault: (filePath: string, defaultValue: string, context?: string) =>
		Effect.gen(function* () {
			const exists = yield* railwayFileSystem.fileExistsEffect(filePath)
			if (!exists) {
				return defaultValue
			}
			return yield* railwayFileSystem.readFileEffect(filePath, context)
		}),

	/**
	 * Read JSON file with default value - common pattern for config files
	 */
	readJsonFileWithDefault: <T>(filePath: string, defaultValue: T, context?: string) =>
		Effect.gen(function* () {
			const exists = yield* railwayFileSystem.fileExistsEffect(filePath)
			if (!exists) {
				return defaultValue
			}
			return yield* railwayFileSystem.readJsonFileEffect<T>(filePath, context)
		})
}

/**
 * Railway Programming Validation Helpers - Extract common AsyncAPI validation patterns
 * FIXES: Duplicated validation logic across AsyncAPIValidator and other validation files
 */
export const railwayValidationHelpers = {
	/**
	 * Validate AsyncAPI version with configurable strictness - extracted pattern
	 */
	validateAsyncAPIVersion: (document: unknown, strict: boolean = true) =>
		Effect.try({
			try: () => {
				const docObject: Record<string, unknown> = typeof document === 'string' 
					? JSON.parse(document as string) as Record<string, unknown> 
					: document as Record<string, unknown>
					
				if (strict && docObject && typeof docObject === 'object' && 'asyncapi' in docObject) {
					const version = String(docObject.asyncapi)
					if (version !== '3.0.0') {
						throw new Error(`AsyncAPI version must be 3.0.0 (strict mode), got: ${version}`)
					}
				}
				return docObject
			},
			catch: (error) => new Error(`Version validation failed: ${error instanceof Error ? error.message : String(error)}`)
		}),

	/**
	 * Create validation result with standard format - extracted pattern
	 */
	createValidationResult: (
		valid: boolean, 
		errors: Array<{message: string, keyword: string, instancePath: string, schemaPath: string}> = [],
		warnings: string[] = [],
		duration: number = 0,
		context?: string
	) => Effect.succeed({
		valid,
		errors,
		warnings,
		summary: context 
			? `${context}: ${valid ? 'Valid' : 'Invalid'} (${errors.length} errors, ${warnings.length} warnings, ${duration.toFixed(2)}ms)`
			: `Validation ${valid ? 'passed' : 'failed'} (${duration.toFixed(2)}ms)`,
		metrics: {
			duration,
			errors: errors.length,
			warnings: warnings.length,
			validatedAt: new Date()
		}
	}),

	/**
	 * Validate required fields with proper Effect error handling - common pattern
	 */
	validateRequiredFields: <T extends Record<string, unknown>>(
		obj: T, 
		requiredFields: Array<keyof T>,
		context?: string
	) => Effect.try({
		try: () => {
			const missingFields = requiredFields.filter(field => !(field in obj) || obj[field] == null)
			if (missingFields.length > 0) {
				throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
			}
			return obj
		},
		catch: (error) => new Error(`${context ? `${context}: ` : ''}${error instanceof Error ? error.message : String(error)}`)
	}),

	/**
	 * Validate object against schema with proper error transformation - extracted pattern  
	 */
	validateWithRetry: <T>(
		validationFn: () => Promise<T>,
		retries: number = 3,
		context?: string
	) => Effect.tryPromise({
		try: validationFn,
		catch: (error) => new Error(`${context ? `${context}: ` : ''}Validation failed: ${error instanceof Error ? error.message : String(error)}`)
	}).pipe(
		Effect.retry(Schedule.exponential("100 millis").pipe(
			Schedule.compose(Schedule.recurs(retries))
		)),
		Effect.tapError(error => Effect.logWarning(`Validation retry failed: ${error.message}`))
	),

	/**
	 * Cache validation results with TTL - common pattern for expensive validations
	 */
	createValidationCache: <V>(maxSize: number = 1000) => {
		const cache = new Map<string, { value: V; timestamp: number }>()
		const ttlMs = 5 * 60 * 1000 // 5 minutes
		
		return {
			get: (key: string): Effect.Effect<V | null, never> => Effect.sync(() => {
				const entry = cache.get(key)
				if (!entry) return null
				
				// Check TTL
				if (Date.now() - entry.timestamp > ttlMs) {
					cache.delete(key)
					return null
				}
				
				return entry.value
			}),
			
			set: (key: string, value: V): Effect.Effect<void, never> => Effect.sync(() => {
				// Limit cache size
				if (cache.size >= maxSize) {
					const firstKey = cache.keys().next().value
					if (firstKey) cache.delete(firstKey)
				}
				
				cache.set(key, { value, timestamp: Date.now() })
			}),
			
			clear: (): Effect.Effect<void, never> => Effect.sync(() => {
				cache.clear()
			}),
			
			size: (): Effect.Effect<number, never> => Effect.sync(() => cache.size)
		}
	},

	/**
	 * Batch validation with concurrent processing - extracted pattern
	 */
	validateBatch: <T, R>(
		items: T[],
		validator: (item: T, index: number) => Effect.Effect<R, Error>,
		maxConcurrency: number = 10
	): Effect.Effect<R[], Error> => 
		Effect.all(
			items.map((item, index) => validator(item, index)),
			{ concurrency: maxConcurrency }
		),

	/**
	 * Validation with timeout and graceful degradation - common pattern
	 */
	validateWithTimeout: <T>(
		validation: Effect.Effect<T, Error>,
		timeoutMs: number = 30000,
		fallbackValue?: T,
		context?: string
	): Effect.Effect<T, Error> => {
		const timeoutEffect = Effect.sleep(`${timeoutMs} millis`).pipe(
			Effect.flatMap(() => Effect.fail(new Error(`${context ? `${context}: ` : ''}Validation timed out after ${timeoutMs}ms`)))
		)
		
		const mainEffect = fallbackValue 
			? Effect.race(validation, timeoutEffect).pipe(
				Effect.orElse(() => Effect.succeed(fallbackValue))
			)
			: Effect.race(validation, timeoutEffect)
			
		return mainEffect
	}
}

