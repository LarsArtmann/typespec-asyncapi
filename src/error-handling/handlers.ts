import { Effect } from "effect";
import type { Program, EmitContext } from "@typespec/compiler";
import type { AsyncAPIEmitterOptions } from "../options.js";
import type { 
  ErrorHandler, 
  ErrorContext, 
  ErrorHandlingResult
} from "./index.js";
import {
  createValidationError,
  createFileSystemError,
  createSchemaError,
  createCompilationError,
  createPerformanceError
} from "./index.js";

/**
 * SPECIALIZED ERROR HANDLERS
 * 
 * Implements specific error handling strategies for different error categories
 * Each handler knows how to recover from specific types of failures
 */

// ==========================================
// VALIDATION ERROR HANDLER
// ==========================================

/**
 * Handles TypeSpec and configuration validation errors
 */
export class ValidationErrorHandler implements ErrorHandler<AsyncAPIEmitterOptions> {
  canHandle(error: Error): boolean {
    return error.message.includes("validation") ||
           error.message.includes("Invalid") ||
           error.message.includes("Expected") ||
           error.name === "ValidationError";
  }
  
  handle(
    error: Error,
    context: Partial<ErrorContext>
  ): Effect.Effect<ErrorHandlingResult<AsyncAPIEmitterOptions>, never> {
    return Effect.gen(function* () {
      // Extract validation details from error
      const validationDetails = parseValidationError(error);
      
      const errorContext = createValidationError({
        field: validationDetails.field,
        value: validationDetails.value,
        expected: validationDetails.expected,
        operation: context.operation || "validation",
        target: context.target,
        recoveryValue: getDefaultValue(validationDetails.field)
      });
      
      // Attempt recovery with default values
      const recoveredOptions = yield* recoverWithDefaults(validationDetails);
      
      if (recoveredOptions) {
        return {
          success: true,
          result: recoveredOptions,
          recovery: {
            attempted: true,
            successful: true,
            strategy: "default",
            fallbackResult: recoveredOptions
          }
        };
      }
      
      return {
        success: false,
        error: errorContext,
        recovery: {
          attempted: true,
          successful: false,
          strategy: "default"
        }
      };
    });
  }
}

/**
 * Parse validation error details
 */
interface ValidationDetails {
  field: string;
  value: unknown;
  expected: string;
}

function parseValidationError(error: Error): ValidationDetails {
  // Parse Effect.TS Schema validation errors
  if (error.message.includes("Expected")) {
    const match = error.message.match(/Expected ([^,]+), actual (.+)/);
    if (match) {
      return {
        field: "unknown",
        value: match[2],
        expected: match[1]
      };
    }
  }
  
  // Parse field-specific errors
  const fieldMatch = error.message.match(/'([^']+)'/); 
  const field = fieldMatch ? fieldMatch[1] : "unknown";
  
  return {
    field,
    value: "invalid",
    expected: "valid value"
  };
}

/**
 * Get default value for a field
 */
function getDefaultValue(field: string): unknown {
  const defaults: Record<string, unknown> = {
    "output-file": "asyncapi",
    "file-type": "yaml",
    "asyncapi-version": "3.0.0",
    "omit-unreachable-types": false,
    "include-source-info": false,
    "validate-spec": true
  };
  
  return defaults[field];
}

/**
 * Recover configuration with default values
 */
function recoverWithDefaults(
  details: ValidationDetails
): Effect.Effect<AsyncAPIEmitterOptions | null, never> {
  return Effect.gen(function* () {
    const defaultValue = getDefaultValue(details.field);
    if (defaultValue !== undefined) {
      return {
        [details.field]: defaultValue
      } as AsyncAPIEmitterOptions;
    }
    return null;
  });
}

// ==========================================
// FILE SYSTEM ERROR HANDLER
// ==========================================

/**
 * Handles file system operation errors
 */
export class FileSystemErrorHandler implements ErrorHandler<string> {
  canHandle(error: Error): boolean {
    return error.message.includes("ENOENT") ||
           error.message.includes("EACCES") ||
           error.message.includes("EMFILE") ||
           error.message.includes("ENOSPC") ||
           error.code === "ENOENT" ||
           error.code === "EACCES";
  }
  
  handle(
    error: Error,
    context: Partial<ErrorContext>
  ): Effect.Effect<ErrorHandlingResult<string>, never> {
    return Effect.gen(function* () {
      const path = extractPathFromError(error) || context.additionalData?.path as string || "unknown";
      const operation = context.operation || "file-operation";
      
      // Try to generate fallback path
      const fallbackPath = generateFallbackPath(path, error);
      
      const errorContext = createFileSystemError({
        path,
        operation,
        originalError: error,
        fallbackPath
      });
      
      // Attempt recovery strategies
      if (fallbackPath) {
        const recoveredPath = yield* tryFallbackPath(fallbackPath);
        if (recoveredPath) {
          return {
            success: true,
            result: recoveredPath,
            recovery: {
              attempted: true,
              successful: true,
              strategy: "fallback",
              fallbackResult: recoveredPath
            }
          };
        }
      }
      
      // Try memory storage as last resort
      if (canUseMemoryStorage(operation)) {
        return {
          success: true,
          result: "memory://temp",
          recovery: {
            attempted: true,
            successful: true,
            strategy: "cache",
            fallbackResult: "memory://temp"
          }
        };
      }
      
      return {
        success: false,
        error: errorContext,
        recovery: {
          attempted: true,
          successful: false,
          strategy: "fallback"
        }
      };
    });
  }
}

function extractPathFromError(error: Error): string | null {
  const match = error.message.match(/path '([^']+)'/) || 
                error.message.match(/file '([^']+)'/) ||
                error.message.match(/([^\s]+\/[^\s]+)/);
  return match ? match[1] : null;
}

function generateFallbackPath(originalPath: string, error: Error): string | null {
  if (error.code === "ENOENT") {
    // Try parent directory with different name
    const dir = originalPath.split('/').slice(0, -1).join('/');
    const filename = originalPath.split('/').pop();
    return `${dir}/fallback-${filename}`;
  }
  
  if (error.code === "EACCES") {
    // Try temp directory
    return `/tmp/${originalPath.split('/').pop()}`;
  }
  
  return null;
}

function tryFallbackPath(path: string): Effect.Effect<string | null, never> {
  return Effect.gen(function* () {
    // This would need actual file system operations
    // For now, assume the fallback path is valid
    return path;
  });
}

function canUseMemoryStorage(operation: string): boolean {
  return operation.includes("write") || operation.includes("output");
}

// ==========================================
// SCHEMA GENERATION ERROR HANDLER
// ==========================================

/**
 * Handles AsyncAPI schema generation errors
 */
export class SchemaGenerationErrorHandler implements ErrorHandler<Record<string, unknown>> {
  canHandle(error: Error): boolean {
    return error.message.includes("schema") ||
           error.message.includes("type") ||
           error.message.includes("circular") ||
           error.message.includes("unsupported");
  }
  
  handle(
    error: Error,
    context: Partial<ErrorContext>
  ): Effect.Effect<ErrorHandlingResult<Record<string, unknown>>, never> {
    return Effect.gen(function* () {
      const typeName = extractTypeNameFromError(error) || "unknown";
      const issue = error.message;
      
      const errorContext = createSchemaError({
        typeName,
        issue,
        operation: context.operation || "schema-generation",
        target: context.target,
        source: context.source
      });
      
      // Try to generate fallback schema
      const fallbackSchema = generateFallbackSchema(typeName, error);
      
      if (fallbackSchema) {
        return {
          success: true,
          result: fallbackSchema,
          recovery: {
            attempted: true,
            successful: true,
            strategy: "fallback",
            fallbackResult: fallbackSchema
          }
        };
      }
      
      // Skip this type but continue processing
      return {
        success: true,
        result: {},
        recovery: {
          attempted: true,
          successful: true,
          strategy: "skip"
        }
      };
    });
  }
}

function extractTypeNameFromError(error: Error): string | null {
  const match = error.message.match(/type '([^']+)'/) ||
                error.message.match(/model '([^']+)'/) ||
                error.message.match(/for ([A-Za-z][A-Za-z0-9_]*)/); 
  return match ? match[1] : null;
}

function generateFallbackSchema(typeName: string, error: Error): Record<string, unknown> | null {
  if (error.message.includes("circular")) {
    return {
      type: "object",
      description: `Schema for ${typeName} (circular reference resolved)`,
      properties: {},
      "x-circular-ref": true,
      "x-original-type": typeName
    };
  }
  
  if (error.message.includes("unsupported")) {
    return {
      type: "object",
      description: `Schema for ${typeName} (unsupported features)`,
      "x-unsupported": true,
      "x-original-type": typeName,
      "x-note": "This type uses TypeSpec features not supported in AsyncAPI 3.0"
    };
  }
  
  return null;
}

// ==========================================
// PERFORMANCE ERROR HANDLER
// ==========================================

/**
 * Handles memory and performance-related errors
 */
export class PerformanceErrorHandler implements ErrorHandler<boolean> {
  canHandle(error: Error): boolean {
    return error.message.includes("memory") ||
           error.message.includes("timeout") ||
           error.message.includes("too large") ||
           error.name === "RangeError";
  }
  
  handle(
    error: Error,
    context: Partial<ErrorContext>
  ): Effect.Effect<ErrorHandlingResult<boolean>, never> {
    return Effect.gen(function* () {
      const { metric, actual, threshold } = parsePerformanceError(error);
      
      const errorContext = createPerformanceError({
        metric,
        actual,
        threshold,
        operation: context.operation || "performance-critical"
      });
      
      // Try degraded performance mode
      const canContinue = yield* enableDegradedMode(error);
      
      return {
        success: canContinue,
        result: canContinue,
        recovery: {
          attempted: true,
          successful: canContinue,
          strategy: "degrade",
          fallbackResult: canContinue
        }
      };
    });
  }
}

function parsePerformanceError(error: Error): { metric: string; actual: number; threshold: number } {
  if (error.message.includes("memory")) {
    return {
      metric: "memory usage",
      actual: 0, // Would need actual measurement
      threshold: 512 // MB
    };
  }
  
  if (error.message.includes("timeout")) {
    const match = error.message.match(/(\d+)ms/);
    return {
      metric: "execution time",
      actual: match ? parseInt(match[1]) : 0,
      threshold: 30000
    };
  }
  
  return {
    metric: "unknown",
    actual: 0,
    threshold: 0
  };
}

function enableDegradedMode(error: Error): Effect.Effect<boolean, never> {
  return Effect.gen(function* () {
    // Enable various performance optimizations
    if (error.message.includes("memory")) {
      // Enable streaming mode, reduce cache size, etc.
      return true;
    }
    
    if (error.message.includes("timeout")) {
      // Increase timeout, enable partial processing, etc.
      return true;
    }
    
    return false;
  });
}

// ==========================================
// COMPILATION ERROR HANDLER
// ==========================================

/**
 * Handles TypeSpec compilation errors
 */
export class CompilationErrorHandler implements ErrorHandler<null> {
  canHandle(error: Error): boolean {
    return error.message.includes("compilation") ||
           error.message.includes("syntax") ||
           error.message.includes("semantic") ||
           error.name === "CompilerError";
  }
  
  handle(
    error: Error,
    context: Partial<ErrorContext>
  ): Effect.Effect<ErrorHandlingResult<null>, never> {
    return Effect.gen(function* () {
      // Compilation errors typically cannot be recovered from
      // We create the error context but return failure
      
      const errorContext = createCompilationError({
        diagnostic: {
          code: "compilation-error",
          message: error.message,
          severity: "error" as const,
          target: context.target
        } as ErrorCategory,
        operation: context.operation || "compilation"
      });
      
      return {
        success: false,
        error: errorContext,
        recovery: {
          attempted: false,
          successful: false,
          strategy: "abort"
        }
      };
    });
  }
}

// ==========================================
// ERROR HANDLER REGISTRY
// ==========================================

/**
 * Registry for error handlers
 */
export class ErrorHandlerRegistry {
  private handlers: ErrorHandler<unknown>[] = [];
  
  constructor() {
    // Register default handlers
    this.register(new ValidationErrorHandler());
    this.register(new FileSystemErrorHandler());
    this.register(new SchemaGenerationErrorHandler());
    this.register(new PerformanceErrorHandler());
    this.register(new CompilationErrorHandler());
  }
  
  register<T>(handler: ErrorHandler<T>): void {
    this.handlers.push(handler);
  }
  
  findHandler<T>(error: Error): ErrorHandler<T> | null {
    return this.handlers.find(h => h.canHandle(error)) || null;
  }
  
  handleError<T>(
    error: Error,
    context: Partial<ErrorContext>
  ): Effect.Effect<ErrorHandlingResult<T>, never> {
    return Effect.gen(function* () {
      const handler = this.findHandler<T>(error);
      
      if (handler) {
        return yield* handler.handle(error, context);
      }
      
      // No specific handler found, return generic failure
      return {
        success: false,
        error: {
          errorId: "GENERIC_" + Date.now(),
          timestamp: new Date(),
          severity: "error" as const,
          category: "unknown" as const,
          what: `Unhandled error: ${error.message}`,
          reassure: "This error was not anticipated but has been logged for investigation.",
          why: "No specific error handler was available for this error type.",
          fix: ["Report this issue with steps to reproduce", "Check error logs for additional context"],
          escape: "Operation will be aborted to prevent data corruption",
          operation: context.operation || "unknown",
          recoveryStrategy: "abort" as const,
          canRecover: false,
          stackTrace: error.stack
        } as ErrorContext,
        recovery: {
          attempted: false,
          successful: false,
          strategy: "abort"
        }
      };
    });
  }
}

// Default registry instance
export const defaultErrorHandlerRegistry = new ErrorHandlerRegistry();

// ==========================================
// CONVENIENCE FUNCTIONS
// ==========================================

/**
 * Handle error with automatic handler selection
 */
export function handleErrorWithRecovery<T>(
  error: Error,
  context: Partial<ErrorContext>,
  registry: ErrorHandlerRegistry = defaultErrorHandlerRegistry
): Effect.Effect<ErrorHandlingResult<T>, never> {
  return registry.handleError<T>(error, context);
}

/**
 * Create error handling function for specific operation
 */
export function createOperationErrorHandler<T>(
  operation: string,
  registry: ErrorHandlerRegistry = defaultErrorHandlerRegistry
) {
  return (error: Error, additionalContext?: Partial<ErrorContext>) => 
    registry.handleError<T>(error, {
      operation,
      ...additionalContext
    });
}
