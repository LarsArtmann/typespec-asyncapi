/**
 * Effect.TS Error Handling Utilities
 *
 * Extracted from duplicated error handling patterns in:
 * - DocumentGenerator.ts
 * - ValidationService.ts
 */

import {
  createError,
  safeStringify,
  type StandardizedError,
} from "./standardized-errors.js";

/**
 * StandardizedError fallback configuration type
 * Shared across error mapping utilities
 */
export type StandardizedErrorFallbackConfig = {
  what: string;
  reassure: string;
  why: string;
  fix: string;
  escape: string;
  code: string;
  context?: Record<string, unknown>;
};

/**
 * Check if error is already a StandardizedError
 * Extracted from duplicated type guards
 */
function isStandardizedError(error: unknown): error is StandardizedError {
  return typeof error === "object" && error !== null && "what" in error;
}

/**
 * Ensure unknown error is converted to StandardizedError
 * Extracted from duplicated Effect.mapError patterns
 *
 * @param error - Unknown error to convert
 * @param fallbackConfig - Configuration for creating fallback error if not already StandardizedError
 * @returns StandardizedError
 */
export function ensureStandardizedError(
  error: unknown,
  fallbackConfig: StandardizedErrorFallbackConfig,
): StandardizedError {
  // Check if already a StandardizedError
  if (isStandardizedError(error)) {
    return error;
  }

  // Create new StandardizedError with fallback configuration
  return createError({
    ...fallbackConfig,
    severity: "error" as const,
    why: `${fallbackConfig.why}: ${safeStringify(error)}`,
    context: {
      ...fallbackConfig.context,
      originalError: error,
    },
  });
}

/**
 * Create a standardized error mapper for Effect pipelines
 * Common pattern: Effect.mapError(ensureStandardizedErrorMapper({...config}))
 *
 * @param fallbackConfig - Configuration for creating fallback error
 * @returns Effect error mapper function
 */
export function ensureStandardizedErrorMapper(
  fallbackConfig: StandardizedErrorFallbackConfig,
): (error: unknown) => StandardizedError {
  return (error: unknown) => ensureStandardizedError(error, fallbackConfig);
}

/**
 * Create a standardized error mapper with custom fallback function
 * Useful when fallback error creation requires custom logic
 *
 * @param fallbackFn - Custom function to create fallback error
 * @returns Effect error mapper function
 */
export function ensureStandardizedErrorMapperCustom(
  fallbackFn: (error: unknown) => StandardizedError,
): (error: unknown) => StandardizedError {
  return (error: unknown) => {
    // Check if already a StandardizedError using shared helper
    if (isStandardizedError(error)) {
      return error;
    }
    // Use custom fallback function
    return fallbackFn(error);
  };
}
