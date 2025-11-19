import type { StandardizedError } from "./StandardizedError.js";
import { Effect } from "effect";
import { readFile } from "fs/promises";

/**
 * Migration utilities for converting Promise/try-catch patterns to Effect.TS
 */
export class ErrorHandlingMigration {
  // Unused method removed - was causing TypeScript error
  // private static mapErrorToStandardized(...)

  /**
   * Convert Promise-based function to Effect.TS
   */
  static promiseToEffect<T>(
    promiseFn: () => Promise<T>,
    errorMapper?: (error: unknown) => StandardizedError,
  ) {
    return ErrorHandlingMigration.handleEffectErrors(
      Effect.tryPromise(promiseFn),
      errorMapper,
    );
  }

  /**
   * Shared error handling pattern for Effect conversion
   * Eliminates duplication between promiseToEffect and syncToEffect
   */
  private static handleEffectErrors<T>(
    effect: Effect.Effect<T, unknown>,
    errorMapper?: (error: unknown) => StandardizedError,
  ): Effect.Effect<T, StandardizedError> {
    return effect.pipe(
      Effect.catchAll((error) => {
        const standardError = errorMapper
          ? errorMapper(error)
          : ErrorHandlingMigration.mapUnknownError(error);
        return Effect.fail(standardError);
      }),
    );
  }

  /**
   * Convert try-catch block to Effect.TS
   */
  static tryCatchToEffect<T>(
    tryFn: () => T,
    errorMapper?: (error: unknown) => StandardizedError,
  ) {
    return ErrorHandlingMigration.handleEffectErrors(
      Effect.sync(tryFn),
      errorMapper,
    );
  }

  /**
   * Convert filesystem operations to Effect.TS
   */
  static fileOperationToEffect(filePath: string) {
    return Effect.promise(() => readFile(filePath, "utf-8")).pipe(
      Effect.catchAll((error) =>
        Effect.fail({
          category: "io_error" as const,
          code: "FILE_READ_FAILED",
          message: `Failed to read file: ${filePath}`,
          details: { filePath, error: error as Error },
          timestamp: new Date(),
          recoverable: false,
        } satisfies StandardizedError),
      ),
    );
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
      };
    }

    return {
      category: "system_error",
      code: "UNKNOWN_ERROR",
      message: String(error),
      timestamp: new Date(),
      recoverable: false,
    };
  }
}
