import type {StandardizedError} from "./StandardizedError.js"
import {Effect} from "effect"
import {readFile} from "fs/promises"

/**
 * Migration utilities for converting Promise/try-catch patterns to Effect.TS
 */
export class ErrorHandlingMigration {
	/**
	 * Map error to standardized format - extracted to eliminate duplication
	 */
	private static mapErrorToStandardized(
		error: unknown,
		errorMapper?: (error: unknown) => StandardizedError
	): StandardizedError {
		return errorMapper
			? errorMapper(error)
			: ErrorHandlingMigration.mapUnknownError(error)
	}

	/**
	 * Convert Promise-based function to Effect.TS
	 */
	static promiseToEffect<T>(
		promiseFn: () => Promise<T>,
		errorMapper?: (error: unknown) => StandardizedError,
	) {
		return Effect.tryPromise(promiseFn).pipe(
<<<<<<< HEAD
			Effect.catchAll(error =>
				Effect.fail(ErrorHandlingMigration.mapErrorToStandardized(error, errorMapper))
			)
=======
			Effect.catchAll(error => {
				const standardError = errorMapper
					? errorMapper(error)
					: ErrorHandlingMigration.mapUnknownError(error)
				return Effect.fail(standardError)
			})
>>>>>>> master
		)
	}

	/**
	 * Convert try-catch block to Effect.TS
	 */
	static tryCatchToEffect<T>(
		tryFn: () => T,
		errorMapper?: (error: unknown) => StandardizedError,
	) {
		return Effect.sync(tryFn).pipe(
<<<<<<< HEAD
			Effect.catchAll(error =>
				Effect.fail(ErrorHandlingMigration.mapErrorToStandardized(error, errorMapper))
			)
=======
			Effect.catchAll(error => {
				const standardError = errorMapper
					? errorMapper(error)
					: ErrorHandlingMigration.mapUnknownError(error)
				return Effect.fail(standardError)
			})
>>>>>>> master
		)
	}

	/**
	 * Convert filesystem operations to Effect.TS
	 */
	static fileOperationToEffect(filePath: string) {
		return Effect.promise(() => readFile(filePath, 'utf-8')).pipe(
			Effect.catchAll(error => 
				Effect.fail({
					category: "io_error" as const,
					code: "FILE_READ_FAILED", 
					message: `Failed to read file: ${filePath}`,
					details: {filePath, error: error as Error},
					timestamp: new Date(),
					recoverable: false,
				} satisfies StandardizedError)
			)
		)
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
				...(error.stack ? { stack: error.stack } : { stack: "" }),
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