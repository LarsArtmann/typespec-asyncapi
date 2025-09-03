import type {StandardizedError} from "./StandardizedError.js"
import {Effect} from "effect"
import {readFile} from "fs/promises"

/**
 * Migration utilities for converting Promise/try-catch patterns to Effect.TS
 */
export class ErrorHandlingMigration {
	/**
	 * Convert Promise-based function to Effect.TS
	 */
	static promiseToEffect<T>(
		promiseFn: () => Promise<T>,
		errorMapper?: (error: unknown) => StandardizedError,
	) {
		return Effect.gen(function* () {
			try {
				return yield* Effect.promise(() => promiseFn())
			} catch (error) {
				const standardError = errorMapper
					? errorMapper(error)
					: ErrorHandlingMigration.mapUnknownError(error)

				return yield* Effect.fail(standardError)
			}
		})
	}

	/**
	 * Convert try-catch block to Effect.TS
	 */
	static tryCatchToEffect<T>(
		tryFn: () => T,
		errorMapper?: (error: unknown) => StandardizedError,
	) {
		return Effect.gen(function* () {
			try {
				return tryFn()
			} catch (error) {
				const standardError = errorMapper
					? errorMapper(error)
					: ErrorHandlingMigration.mapUnknownError(error)

				return yield* Effect.fail(standardError)
			}
		})
	}

	/**
	 * Convert filesystem operations to Effect.TS
	 */
	static fileOperationToEffect(filePath: string) {
		return Effect.gen(function* () {
			try {
				const content = yield* Effect.promise(() => readFile(filePath, 'utf-8'))
				return content
			} catch (error) {
				return yield* Effect.fail({
					category: "io_error" as const,
					code: "FILE_READ_FAILED",
					message: `Failed to read file: ${filePath}`,
					details: {filePath, error: error as Error},
					timestamp: new Date(),
					recoverable: false,
				} satisfies StandardizedError)
			}
		})
	}

	/**
	 * Map unknown errors to standardized format
	 */
	static mapUnknownError(error: unknown): StandardizedError {
		if (error instanceof Error) {
			return {
				category: "system_error",
				code: "UNKNOWN_ERROR",
				message: error.message,
				timestamp: new Date(),
				stack: error.stack,
				recoverable: false,
			}
		}

		return {
			category: "system_error",
			code: "UNKNOWN_ERROR",
			message: String(error),
			timestamp: new Date(),
			recoverable: false,
		}
	}
}