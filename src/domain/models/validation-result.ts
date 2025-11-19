/**
 * Canonical ValidationResult Type - Single Source of Truth
 *
 * This file contains THE ONLY ValidationResult definition in the entire codebase.
 * All other ValidationResult types should import from this file.
 *
 * Uses discriminated union pattern with `_tag` field for type-safe pattern matching
 * and to make invalid states unrepresentable at compile time.
 *
 * **Architecture Decision:**
 * - Discriminated union with `_tag: "Success" | "Failure"` for explicit type narrowing
 * - Generic `<T>` for flexible value types
 * - Readonly fields for immutability
 * - Factory functions for safe construction
 * - Type guards for type-safe pattern matching
 *
 * **Why `_tag` instead of `valid: boolean`?**
 * - More explicit: `result._tag === "Success"` vs `result.valid === true`
 * - Better TypeScript narrowing: discriminated unions are THE canonical pattern
 * - Eliminates split brain: can't have `_tag: "Success"` with errors
 * - Industry standard: Effect.TS, fp-ts, and functional programming libraries use `_tag`
 *
 * @since THE 1% Foundation - Consolidation from 9 duplicate definitions
 */

/**
 * Validation error with detailed context
 */
export type ValidationError = {
  readonly message: string;
  readonly keyword: string;
  readonly instancePath: string;
  readonly schemaPath: string;
};

/**
 * Validation warning with optional severity
 */
export type ValidationWarning = {
  readonly message: string;
  readonly severity?: "info" | "warning" | "error";
};

/**
 * Success case of ValidationResult
 * Contains validated value and empty error/warning arrays
 *
 * @template T The type of the validated value
 */
export type ValidationSuccess<T> = {
  readonly _tag: "Success";
  readonly value: T;
  readonly errors: readonly [];
  readonly warnings: readonly [];
};

/**
 * Failure case of ValidationResult
 * Contains error details and optional warnings
 */
export type ValidationFailure = {
  readonly _tag: "Failure";
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
};

/**
 * Canonical ValidationResult discriminated union
 *
 * This is THE ONLY ValidationResult type that should be used throughout the codebase.
 * Use type guards `isSuccess()` and `isFailure()` for type-safe pattern matching.
 * Use factory functions `success()` and `failure()` for safe construction.
 *
 * @template T The type of the validated value (defaults to unknown)
 *
 * @example
 * ```typescript
 * // Creating results
 * const valid = success({ foo: "bar" })
 * const invalid = failure([{ message: "Invalid", keyword: "required", instancePath: "/foo", schemaPath: "#/required" }])
 *
 * // Pattern matching with type guards
 * if (isSuccess(result)) {
 *   console.log(result.value) // Type: T
 * } else {
 *   console.log(result.errors) // Type: ValidationError[]
 * }
 *
 * // Pattern matching with _tag
 * switch (result._tag) {
 *   case "Success":
 *     return result.value
 *   case "Failure":
 *     throw new Error(result.errors[0].message)
 * }
 * ```
 */
export type ValidationResult<T = unknown> =
  | ValidationSuccess<T>
  | ValidationFailure;

/**
 * Type guard for ValidationSuccess
 * Narrows ValidationResult<T> to ValidationSuccess<T>
 *
 * @param result The validation result to check
 * @returns True if result is success, false otherwise
 */
export function isSuccess<T>(
  result: ValidationResult<T>,
): result is ValidationSuccess<T> {
  return result._tag === "Success";
}

/**
 * Type guard for ValidationFailure
 * Narrows ValidationResult<T> to ValidationFailure
 *
 * @param result The validation result to check
 * @returns True if result is failure, false otherwise
 */
export function isFailure<T>(
  result: ValidationResult<T>,
): result is ValidationFailure {
  return result._tag === "Failure";
}

/**
 * Factory function for creating successful validation results
 *
 * @template T The type of the validated value
 * @param value The validated value
 * @returns A success ValidationResult containing the value
 *
 * @example
 * ```typescript
 * const result = success({ name: "John", age: 30 })
 * // result._tag === "Success"
 * // result.value === { name: "John", age: 30 }
 * // result.errors === []
 * // result.warnings === []
 * ```
 */
export function success<T>(value: T): ValidationSuccess<T> {
  return {
    _tag: "Success",
    value,
    errors: [],
    warnings: [],
  };
}

/**
 * Factory function for creating failed validation results
 *
 * @param errors Array of validation errors
 * @param warnings Optional array of validation warnings
 * @returns A failure ValidationResult containing errors and warnings
 *
 * @example
 * ```typescript
 * const result = failure([
 *   { message: "Required field missing", keyword: "required", instancePath: "/name", schemaPath: "#/required" }
 * ])
 * // result._tag === "Failure"
 * // result.errors.length === 1
 * // result.warnings === []
 * ```
 */
export function failure(
  errors: readonly ValidationError[],
  warnings: readonly ValidationWarning[] = [],
): ValidationFailure {
  return {
    _tag: "Failure",
    errors,
    warnings,
  };
}

/**
 * Performance metrics for validation
 *
 * NOTE: Does NOT store derived counts (channelCount, operationCount, schemaCount)
 * to avoid split brain - those should be computed from the validated value.
 * Use helper functions to get counts from ValidationSuccess<AsyncAPIObject>.
 */
export type ValidationMetrics = {
  readonly duration: number;
  readonly validatedAt: Date;
};

/**
 * ValidationResult extended with metrics and summary
 * Used by validation services for detailed reporting
 *
 * ARCHITECTURAL DECISION:
 * - summary is REQUIRED (not optional) because we always set it
 * - metrics does NOT contain derived counts (compute from value instead)
 */
export type ExtendedValidationResult<T = unknown> = ValidationResult<T> & {
  readonly metrics: ValidationMetrics;
  readonly summary: string; // Made required - we always set it
};

/**
 * Helper functions to compute counts from AsyncAPIObject
 * These prevent split brain by computing from source data instead of storing separately
 */

import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";

/**
 * Get channel count from AsyncAPI document
 */
export function getChannelCount(doc: AsyncAPIObject): number {
  return Object.keys(doc.channels ?? {}).length;
}

/**
 * Get operation count from AsyncAPI document
 */
export function getOperationCount(doc: AsyncAPIObject): number {
  return Object.keys(doc.operations ?? {}).length;
}

/**
 * Get schema count from AsyncAPI document (schemas + messages)
 */
export function getSchemaCount(doc: AsyncAPIObject): number {
  const schemas = Object.keys(doc.components?.schemas ?? {}).length;
  const messages = Object.keys(doc.components?.messages ?? {}).length;
  return schemas + messages;
}
