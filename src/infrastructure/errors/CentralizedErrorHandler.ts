/**
 * Centralized Error Handling Architecture
 *
 * Provides unified error handling across all components:
 * - Type-safe error hierarchy
 * - Structured error logging
 * - Error recovery patterns
 * - Error aggregation and reporting
 */

import { Effect, Context, Layer } from "effect";

/**
 * Error severity levels for structured error handling
 */
export const enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Error categories for proper error classification
 */
export const enum ErrorCategory {
  VALIDATION = "validation",
  COMPILATION = "compilation",
  PLUGIN = "plugin",
  SCHEMA = "schema",
  NETWORK = "network",
  SYSTEM = "system",
  USER_INPUT = "user_input",
}

/**
 * Base error interface for all AsyncAPI emitter errors
 */
export type BaseError = {
  readonly id: string;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly message: string;
  readonly code?: string;
  readonly cause?: unknown;
  readonly context?: Record<string, unknown>;
  readonly timestamp: number;
  readonly recoverable: boolean;
};

/**
 * TypeSpec compilation error
 */
export type CompilationError = {
  readonly category: ErrorCategory.COMPILATION;
  readonly typeName: string;
  readonly decorator?: string;
  readonly line?: number;
  readonly column?: number;
} & BaseError;

/**
 * Plugin system error
 */
export type PluginError = {
  readonly category: ErrorCategory.PLUGIN;
  readonly pluginName: string;
  readonly protocol?: string;
  readonly operation?: string;
} & BaseError;

/**
 * Schema validation error
 */
export type SchemaError = {
  readonly category: ErrorCategory.SCHEMA;
  readonly schemaPath: string;
  readonly validationRule: string;
  readonly invalidValue: unknown;
} & BaseError;

/**
 * Error handler interface
 */
export type ErrorHandler = {
  readonly handleError: (error: BaseError) => Effect.Effect<void, never>;
  readonly handleCompilationError: (
    error: CompilationError,
  ) => Effect.Effect<void, never>;
  readonly handlePluginError: (
    error: PluginError,
  ) => Effect.Effect<void, never>;
  readonly handleSchemaError: (
    error: SchemaError,
  ) => Effect.Effect<void, never>;
  readonly getErrorSummary: () => Effect.Effect<ErrorSummary, never>;
};

/**
 * Error summary interface
 */
export type ErrorSummary = {
  readonly totalErrors: number;
  readonly errorsByCategory: Record<ErrorCategory, number>;
  readonly errorsBySeverity: Record<ErrorSeverity, number>;
  readonly recentErrors: BaseError[];
  readonly criticalErrors: BaseError[];
};

/**
 * Error handler tag for dependency injection
 */
export const ErrorHandler = Context.GenericTag<"ErrorHandler", ErrorHandler>(
  "ErrorHandler",
);

/**
 * Centralized error handler implementation
 */
export const CentralizedErrorHandler: ErrorHandler = {
  handleError: (error) =>
    Effect.gen(function* () {
      // Log error with structured format
      yield* Effect.log({
        level: "error",
        error_id: error.id,
        category: error.category,
        severity: error.severity,
        message: error.message,
        code: error.code,
        timestamp: error.timestamp,
        recoverable: error.recoverable,
        context: error.context,
      });

      // Store error in global error registry
      globalThis.__ASYNCAPI_ERROR_REGISTRY ??= [];
      const errorRegistry = globalThis.__ASYNCAPI_ERROR_REGISTRY;
      errorRegistry.push(error);

      // Keep only last 500 errors to prevent memory leaks
      if (errorRegistry.length > 500) {
        errorRegistry.splice(0, errorRegistry.length - 500);
      }

      // Trigger alerts for critical errors
      if (error.severity === ErrorSeverity.CRITICAL) {
        yield* Effect.logError(`🚨 CRITICAL ERROR: ${error.message}`, {
          error,
        });
      }
    }),

  handleCompilationError: (error) =>
    Effect.gen(function* () {
      yield* Effect.logError(
        `❌ TypeSpec Compilation Error: ${error.message}`,
        {
          error_id: error.id,
          type_name: error.typeName,
          decorator: error.decorator,
          line: error.line,
          column: error.column,
          context: error.context,
        },
      );

      yield* CentralizedErrorHandler.handleError(error);
    }),

  handlePluginError: (error) =>
    Effect.gen(function* () {
      yield* Effect.logError(`🔌 Plugin System Error: ${error.message}`, {
        error_id: error.id,
        plugin_name: error.pluginName,
        protocol: error.protocol,
        operation: error.operation,
        context: error.context,
      });

      yield* CentralizedErrorHandler.handleError(error);
    }),

  handleSchemaError: (error) =>
    Effect.gen(function* () {
      yield* Effect.logError(`📋 Schema Validation Error: ${error.message}`, {
        error_id: error.id,
        schema_path: error.schemaPath,
        validation_rule: error.validationRule,
        invalid_value: error.invalidValue,
        context: error.context,
      });

      yield* CentralizedErrorHandler.handleError(error);
    }),

  getErrorSummary: () =>
    Effect.sync(() => {
      globalThis.__ASYNCAPI_ERROR_REGISTRY ??= [];
      const errorRegistry = globalThis.__ASYNCAPI_ERROR_REGISTRY;

      const errorsByCategory = errorRegistry.reduce(
        (acc, error) => {
          acc[error.category] = (acc[error.category] || 0) + 1;
          return acc;
        },
        {} as Record<ErrorCategory, number>,
      );

      const errorsBySeverity = errorRegistry.reduce(
        (acc, error) => {
          acc[error.severity] = (acc[error.severity] || 0) + 1;
          return acc;
        },
        {} as Record<ErrorSeverity, number>,
      );

      const criticalErrors = errorRegistry.filter(
        (error) => error.severity === ErrorSeverity.CRITICAL,
      );

      const recentErrors = errorRegistry.slice(-10).reverse();

      return {
        totalErrors: errorRegistry.length,
        errorsByCategory,
        errorsBySeverity,
        recentErrors,
        criticalErrors,
      };
    }),
};

/**
 * Error handler layer for dependency injection
 */
export const ErrorHandlerLive = Layer.succeed(
  ErrorHandler,
  CentralizedErrorHandler,
);

/**
 * Error factory functions for creating typed errors
 */
export const ErrorFactory = {
  compilationError: (
    message: string,
    context: Partial<CompilationError>,
  ): CompilationError => ({
    id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    category: ErrorCategory.COMPILATION,
    severity: ErrorSeverity.HIGH,
    message,
    timestamp: Date.now(),
    recoverable: false,
    typeName: context.typeName ?? "unknown",
    decorator: context.decorator,
    line: context.line,
    column: context.column,
    cause: context.cause,
    context: context.context,
    code: context.code,
  }),

  pluginError: (
    message: string,
    context: Partial<PluginError>,
  ): PluginError => ({
    id: `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    category: ErrorCategory.PLUGIN,
    severity: ErrorSeverity.MEDIUM,
    message,
    timestamp: Date.now(),
    recoverable: true,
    pluginName: context.pluginName ?? "unknown",
    protocol: context.protocol,
    operation: context.operation,
    cause: context.cause,
    context: context.context,
    code: context.code,
  }),

  schemaError: (
    message: string,
    context: Partial<SchemaError>,
  ): SchemaError => ({
    id: `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    category: ErrorCategory.SCHEMA,
    severity: ErrorSeverity.MEDIUM,
    message,
    timestamp: Date.now(),
    recoverable: true,
    schemaPath: context.schemaPath ?? "unknown",
    validationRule: context.validationRule ?? "unknown",
    invalidValue: context.invalidValue,
    cause: context.cause,
    context: context.context,
    code: context.code,
  }),
};

/**
 * Global type declarations for error storage
 */
declare global {
  var __ASYNCAPI_ERROR_REGISTRY: BaseError[] | undefined;
}
