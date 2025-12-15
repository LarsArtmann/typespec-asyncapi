/**
 * Standardized Error Types
 *
 * Provides consistent error handling across the AsyncAPI emitter
 */

import { Effect } from "effect";

/**
 * Base error class for AsyncAPI emitter
 */
export abstract class AsyncAPIEmitterError extends Error {
  abstract readonly _tag: string;
  abstract readonly code: string;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Validation Error
 */
/**
 * Validation Error Type
 */
export type StandardizedError = {
  what: string;
  reassure: string;
  why: string;
  fix: string;
  escape: string;
  severity: "error" | "warning" | "info";
  code: string;
  context?: Record<string, unknown>;
};

export class ValidationError extends AsyncAPIEmitterError implements StandardizedError {
  readonly _tag = "ValidationError";
  readonly code = "VALIDATION_ERROR";

  // StandardizedError interface properties
  what: string = "Validation failed";
  reassure: string = "This validation error can be fixed";
  why: string = "Input validation failed";
  fix: string = "Provide valid input data";
  escape: string = "Use default values or skip validation";
  severity: "error" | "warning" | "info" = "error";

  constructor(message: string, context?: Record<string, unknown>) {
    super(`Validation failed: ${message}`, context);

    // Extract error details from message if available
    this.what = `Validation failed: ${message}`;
  }
}

/**
 * TypeSpec Compilation Error
 */
export class CompilationError extends AsyncAPIEmitterError {
  readonly _tag = "CompilationError";
  readonly code = "COMPILATION_ERROR";

  constructor(message: string, context?: Record<string, unknown>) {
    super(`TypeSpec compilation failed: ${message}`, context);
  }
}

/**
 * Schema Generation Error
 */
export class SchemaGenerationError extends AsyncAPIEmitterError {
  readonly _tag = "SchemaGenerationError";
  readonly code = "SCHEMA_GENERATION_ERROR";

  constructor(message: string, context?: Record<string, unknown>) {
    super(`Schema generation failed: ${message}`, context);
  }
}

/**
 * File I/O Error
 */
export class FileError extends AsyncAPIEmitterError {
  readonly _tag = "FileError";
  readonly code = "FILE_ERROR";

  constructor(message: string, context?: Record<string, unknown>) {
    super(`File operation failed: ${message}`, context);
  }
}

/**
 * Configuration Error
 */
export class ConfigurationError extends AsyncAPIEmitterError {
  readonly _tag = "ConfigurationError";
  readonly code = "CONFIGURATION_ERROR";

  constructor(message: string, context?: Record<string, unknown>) {
    super(`Configuration error: ${message}`, context);
  }
}

/**
 * Create standardized error Effect
 */
export function createErrorEffect<T>(
  errorClass: new (message: string, context?: Record<string, unknown>) => AsyncAPIEmitterError,
  message: string,
  context?: Record<string, unknown>,
): Effect.Effect<T, AsyncAPIEmitterError> {
  return Effect.fail(new errorClass(message, context));
}

/**
 * Error type guards
 */
export function isValidationError(error: AsyncAPIEmitterError): error is ValidationError {
  return error._tag === "ValidationError";
}

export function isCompilationError(error: AsyncAPIEmitterError): error is CompilationError {
  return error._tag === "CompilationError";
}

export function isSchemaGenerationError(
  error: AsyncAPIEmitterError,
): error is SchemaGenerationError {
  return error._tag === "SchemaGenerationError";
}

export function isFileError(error: AsyncAPIEmitterError): error is FileError {
  return error._tag === "FileError";
}

export function isConfigurationError(error: AsyncAPIEmitterError): error is ConfigurationError {
  return error._tag === "ConfigurationError";
}
