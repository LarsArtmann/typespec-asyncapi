/**
 * Shared Effect.TS utility patterns
 * Eliminates code duplication across Effect.TS usage
 */

import {Effect} from "effect"
import type {EmitContext} from "@typespec/compiler"
import type {AsyncAPIEmitterOptions} from "../options.js"
import {SpecGenerationError} from "../errors/SpecGenerationError.js"

/**
 * Common Effect.TS logging patterns
 * Eliminates duplication in Effect.log calls throughout the codebase
 */
export const EffectLogging = {
	/**
	 * Log debug information about operation/schema generation
	 */
	logDebugGeneration: (type: "channel" | "operation" | "message" | "security-scheme", id: string, details?: Record<string, unknown>) => {
		return Effect.logDebug(`Generated ${type}: ${id}`, details || {})
	},

	/**
	 * Log info about AsyncAPI generation context
	 */
	logGenerationContext: (outputFile: string, fileType: string, memoryMonitoring = false) => {
		return Effect.logInfo("AsyncAPI generation context initialized", {
			outputFile,
			fileType,
			memoryMonitoring,
		})
	},

	/**
	 * Log successful AsyncAPI specification generation
	 */
	logSpecGenerationSuccess: (specSize: number, outputFile: string) => {
		return Effect.logInfo("AsyncAPI specification generated successfully", {
			specSize,
			outputFile,
		})
	},

	/**
	 * Log emitter performance metrics
	 */
	logPerformanceMetrics: (throughput: number, memoryPerOp: number, totalDuration: number) => {
		return Effect.logInfo("Emitter performance metrics", {
			throughput: `${throughput.toFixed(2)} ops/sec`,
			memoryPerOp: `${memoryPerOp.toFixed(0)} bytes`,
			totalDuration: `${totalDuration.toFixed(2)}ms`,
		})
	},

	/**
	 * Log batch processing completion
	 */
	logBatchCompletion: (processedCount: number, throughput: number, totalDuration: number) => {
		return Effect.logInfo("Batch emit completed", {
			processedCount,
			throughput: `${throughput.toFixed(0)} contexts/sec`,
			totalDuration: `${totalDuration.toFixed(2)}ms`,
		})
	},
}

/**
 * Common Effect.TS validation patterns
 * Eliminates duplication in validation logic
 */
export const EffectValidation = {
	/**
	 * Validate program context exists - common pattern used in multiple generation functions
	 */
	validateProgramContext: (context: EmitContext<object>): Effect.Effect<void, SpecGenerationError> => {
		return Effect.gen(function* () {
			if (!context.program) {
				return yield* Effect.fail(new SpecGenerationError("TypeSpec program context missing", {} as AsyncAPIEmitterOptions))
			}
			return undefined as void
		})
	},

	/**
	 * Log and count decorator state maps - common debugging pattern
	 */
	logStateMapInfo: (mapName: string, mapSize: number) => {
		return Effect.logDebug(`Found ${mapSize} items in ${mapName}`)
	},
}

/**
 * Common Effect.TS error handling patterns
 * Eliminates duplication in error handling logic
 */
export const EffectErrorHandling = {
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
}
