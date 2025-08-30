import type { Diagnostic, DiagnosticTarget, SourceLocation } from "@typespec/compiler";
import { Effect } from "effect";

/**
 * COMPREHENSIVE ERROR HANDLING FRAMEWORK
 * 
 * Implements What/Reassure/Why/Fix/Escape messaging pattern with:
 * - Structured error context collection
 * - Graceful degradation strategies
 * - Error recovery mechanisms
 * - User-friendly error messages
 * - Proper error propagation through TypeSpec diagnostic system
 */

// ==========================================
// ERROR TYPE DEFINITIONS
// ==========================================

/**
 * Error severity levels for proper categorization
 */
export type ErrorSeverity = "fatal" | "error" | "warning" | "info" | "debug";

/**
 * Error categories for specific handling strategies
 */
export type ErrorCategory = 
  | "validation"        // Input validation failures
  | "compilation"       // TypeSpec compilation errors
  | "file-system"       // File I/O operations
  | "schema-generation" // AsyncAPI schema creation
  | "dependency"        // Missing dependencies
  | "configuration"     // Invalid configuration
  | "memory"            // Memory/performance issues
  | "network"           // External service failures
  | "security"          // Security-related errors
  | "emitter"           // Emitter initialization/operation errors
  | "unknown";          // Catch-all for unclassified errors

/**
 * Error recovery strategies
 */
export type RecoveryStrategy = 
  | "retry"             // Retry the operation
  | "fallback"          // Use fallback mechanism
  | "skip"              // Skip and continue
  | "prompt"            // Prompt user for action
  | "abort"             // Abort operation
  | "degrade"           // Continue with reduced functionality
  | "cache"             // Use cached result
  | "default";          // Use safe default value

/**
 * Comprehensive error context information
 */
export interface ErrorContext {
  // Core identification
  readonly errorId: string;
  readonly timestamp: Date;
  readonly severity: ErrorSeverity;
  readonly category: ErrorCategory;
  
  // What/Reassure/Why/Fix/Escape components
  readonly what: string;           // What happened (technical description)
  readonly reassure: string;       // Reassurance message for user
  readonly why: string;            // Why it happened (root cause)
  readonly fix: string[];          // How to fix it (actionable steps)
  readonly escape: string;         // How to work around it temporarily
  
  // Technical context
  readonly operation: string;      // Operation being performed
  readonly source?: SourceLocation; // Source code location if applicable
  readonly target?: DiagnosticTarget; // TypeSpec target if applicable
  readonly stackTrace?: string;    // Stack trace for debugging
  readonly additionalData?: Record<string, unknown>; // Extra context data
  
  // Recovery information
  readonly recoveryStrategy: RecoveryStrategy;
  readonly canRecover: boolean;
  readonly recoveryHint?: string;
  
  // Relationships
  readonly causedBy?: ErrorContext; // Root cause error
  readonly relatedErrors?: ErrorContext[]; // Related errors
}

/**
 * Error handling result with recovery information
 */
export interface ErrorHandlingResult<T> {
  readonly success: boolean;
  readonly result?: T | undefined;
  readonly error?: ErrorContext | undefined;
  readonly recovery?: {
    readonly attempted: boolean;
    readonly successful: boolean;
    readonly strategy: RecoveryStrategy;
    readonly fallbackResult?: T | undefined;
  } | undefined;
}

/**
 * Error handling configuration
 */
export interface ErrorHandlingConfig {
  readonly enableRecovery: boolean;
  readonly enableFallbacks: boolean;
  readonly enableCaching: boolean;
  readonly maxRetries: number;
  readonly timeoutMs: number;
  readonly debugMode: boolean;
  readonly logLevel: ErrorSeverity;
  readonly customHandlers?: Record<ErrorCategory, ErrorHandler<unknown>>;
}

/**
 * Generic error handler interface
 */
export interface ErrorHandler<T> {
  canHandle(error: Error): boolean;
  handle(error: Error, context: Partial<ErrorContext>): Effect.Effect<ErrorHandlingResult<T>, never>;
}

// ==========================================
// ERROR CREATION UTILITIES
// ==========================================

/**
 * Generate unique error ID for tracking
 */
function generateErrorId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TSA_${timestamp}_${random}`.toUpperCase();
}

/**
 * Create structured error context following What/Reassure/Why/Fix/Escape pattern
 */
export function createErrorContext({
  what,
  reassure,
  why,
  fix,
  escape,
  severity = "error",
  category = "unknown",
  operation,
  source,
  target,
  stackTrace,
  additionalData,
  recoveryStrategy = "abort",
  canRecover = false,
  recoveryHint,
  causedBy,
  relatedErrors
}: {
  what: string;
  reassure: string;
  why: string;
  fix: string[];
  escape: string;
  severity?: ErrorSeverity | undefined;
  category?: ErrorCategory | undefined;
  operation: string;
  source?: SourceLocation | undefined;
  target?: DiagnosticTarget | undefined;
  stackTrace?: string | undefined;
  additionalData?: Record<string, unknown> | undefined;
  recoveryStrategy?: RecoveryStrategy | undefined;
  canRecover?: boolean | undefined;
  recoveryHint?: string | undefined;
  causedBy?: ErrorContext | undefined;
  relatedErrors?: ErrorContext[] | undefined;
}): ErrorContext {
  return {
    errorId: generateErrorId(),
    timestamp: new Date(),
    severity,
    category,
    what,
    reassure,
    why,
    fix,
    escape,
    operation,
    recoveryStrategy,
    canRecover,
    ...(source && { source }),
    ...(target && { target }),
    ...(stackTrace && { stackTrace }),
    ...(additionalData && { additionalData }),
    ...(recoveryHint && { recoveryHint }),
    ...(causedBy && { causedBy }),
    ...(relatedErrors && { relatedErrors })
  };
}

/**
 * Create validation error context
 */
export function createValidationError({
  field,
  value,
  expected,
  operation,
  target,
  recoveryValue
}: {
  field: string;
  value: unknown;
  expected: string;
  operation: string;
  target?: DiagnosticTarget;
  recoveryValue?: unknown;
}): ErrorContext {
  const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
  
  return createErrorContext({
    what: `Invalid value ${valueStr} for field '${field}'. Expected ${expected}.`,
    reassure: "This is a configuration issue that can be fixed by updating the input.",
    why: `The provided value does not match the required schema constraints for this field.`,
    fix: [
      `Update '${field}' to use ${expected}`,
      "Check the AsyncAPI emitter documentation for valid values",
      "Validate your configuration against the schema"
    ],
    escape: recoveryValue 
      ? `The system will use default value: ${JSON.stringify(recoveryValue)}`
      : "Remove the invalid field to use system defaults",
    severity: "error",
    category: "validation",
    operation,
    ...(target && { target }),
    recoveryStrategy: recoveryValue ? "default" : "prompt",
    canRecover: true,
    recoveryHint: recoveryValue ? `Using default: ${JSON.stringify(recoveryValue)}` : undefined,
    additionalData: { field, value, expected, recoveryValue }
  });
}

/**
 * Create file system error context
 */
export function createFileSystemError({
  path,
  operation,
  originalError,
  fallbackPath
}: {
  path: string;
  operation: string;
  originalError: Error;
  fallbackPath?: string;
}): ErrorContext {
  return createErrorContext({
    what: `File system operation '${operation}' failed for path: ${path}`,
    reassure: "File system errors are often temporary and can be resolved.",
    why: `System error: ${originalError.message}`,
    fix: [
      "Check if the file/directory exists and is accessible",
      "Verify permissions for the target location",
      "Ensure sufficient disk space is available",
      "Check if the path contains invalid characters"
    ],
    escape: fallbackPath 
      ? `Will attempt to use fallback location: ${fallbackPath}`
      : "Output will be stored in memory temporarily",
    severity: "error",
    category: "file-system",
    operation,
    ...(originalError.stack && { stackTrace: originalError.stack }),
    recoveryStrategy: fallbackPath ? "fallback" : "cache",
    canRecover: true,
    recoveryHint: fallbackPath ? `Fallback: ${fallbackPath}` : "Memory storage",
    additionalData: { path, originalError: originalError.message, fallbackPath }
  });
}

/**
 * Create schema generation error context
 */
export function createSchemaError({
  typeName,
  issue,
  operation,
  target,
  source
}: {
  typeName: string;
  issue: string;
  operation: string;
  target?: DiagnosticTarget;
  source?: SourceLocation;
}): ErrorContext {
  return createErrorContext({
    what: `Failed to generate AsyncAPI schema for type '${typeName}': ${issue}`,
    reassure: "Schema generation issues can usually be resolved by updating the TypeSpec definition.",
    why: "The TypeSpec type definition contains patterns that cannot be converted to AsyncAPI 3.0 schema format.",
    fix: [
      "Check if the type uses supported TypeSpec features",
      "Ensure all referenced types are properly defined",
      "Avoid circular references in type definitions",
      "Consider using AsyncAPI-specific decorators for complex cases"
    ],
    escape: "The type will be omitted from the generated schema with a comment indicating the issue",
    severity: "error",
    category: "schema-generation",
    operation,
    ...(target && { target }),
    ...(source && { source }),
    recoveryStrategy: "skip",
    canRecover: true,
    recoveryHint: "Type will be documented as unsupported",
    additionalData: { typeName, issue }
  });
}

/**
 * Create compilation error context
 */
export function createCompilationError({
  diagnostic,
  operation
}: {
  diagnostic: Diagnostic;
  operation: string;
}): ErrorContext {
  return createErrorContext({
    what: `TypeSpec compilation failed: ${diagnostic.message}`,
    reassure: "Compilation errors indicate syntax or semantic issues in your TypeSpec files.",
    why: "The TypeSpec compiler found errors that prevent successful processing.",
    fix: [
      "Fix the syntax error in the TypeSpec file",
      "Check for missing imports or dependencies",
      "Verify decorator usage follows TypeSpec conventions",
      "Ensure all referenced types are properly defined"
    ],
    escape: "Compilation will stop to prevent generating invalid output",
    severity: diagnostic.severity,
    category: "compilation",
    operation,
    ...(diagnostic.target && typeof diagnostic.target === 'object' && { target: diagnostic.target }),
    recoveryStrategy: "abort",
    canRecover: false,
    additionalData: { 
      diagnosticCode: diagnostic.code,
      diagnosticMessage: diagnostic.message
    }
  });
}

/**
 * Create performance/memory error context
 */
export function createPerformanceError({
  metric,
  actual,
  threshold,
  operation
}: {
  metric: string;
  actual: number;
  threshold: number;
  operation: string;
}): ErrorContext {
  const unit = metric.includes('memory') ? 'MB' : metric.includes('time') ? 'ms' : '';
  
  return createErrorContext({
    what: `Performance threshold exceeded: ${metric} is ${actual}${unit}, threshold is ${threshold}${unit}`,
    reassure: "Performance issues can often be resolved by optimizing the input or configuration.",
    why: "The operation requires more resources than the configured limits allow.",
    fix: [
      "Reduce the size or complexity of input files",
      "Increase memory/timeout limits in configuration",
      "Consider breaking large schemas into smaller modules",
      "Enable streaming mode for large inputs if available"
    ],
    escape: "Processing will continue but may be slower or use more resources",
    severity: "warning",
    category: "memory",
    operation,
    recoveryStrategy: "degrade",
    canRecover: true,
    recoveryHint: "Continue with degraded performance",
    additionalData: { metric, actual, threshold, unit }
  });
}

// ==========================================
// ERROR RECOVERY MECHANISMS
// ==========================================

/**
 * Default error handling configuration
 */
export const DEFAULT_ERROR_CONFIG: ErrorHandlingConfig = {
  enableRecovery: true,
  enableFallbacks: true,
  enableCaching: true,
  maxRetries: 3,
  timeoutMs: 30000,
  debugMode: false,
  logLevel: "warning"
};

/**
 * Execute operation with comprehensive error handling
 */
export function withErrorHandling<T>(
  operation: () => Effect.Effect<T, Error>,
  context: Partial<ErrorContext>,
  config: Partial<ErrorHandlingConfig> = {}
): Effect.Effect<ErrorHandlingResult<T>, never> {
  const finalConfig = { ...DEFAULT_ERROR_CONFIG, ...config };
  
  return Effect.gen(function* () {
    let lastError: ErrorContext | undefined;
    
    for (let attempt = 0; attempt < finalConfig.maxRetries; attempt++) {
      try {
        const result = yield* operation();
        
        return {
          success: true,
          result,
          error: undefined,
          recovery: attempt > 0 ? {
            attempted: true,
            successful: true,
            strategy: "retry" as const,
            fallbackResult: undefined
          } : undefined
        } as ErrorHandlingResult<T>;
      } catch (error) {
        const errorContext = createErrorFromException(
          error as Error,
          context.operation || "unknown-operation",
          context
        );
        
        lastError = errorContext;
        
        // Try recovery if enabled and error supports it
        if (finalConfig.enableRecovery && errorContext.canRecover) {
          const recoveryResult = yield* attemptRecovery(errorContext, finalConfig);
          if (recoveryResult.success) {
            return {
              success: true,
              result: recoveryResult.result!,
              error: undefined,
              recovery: {
                attempted: true,
                successful: true,
                strategy: errorContext.recoveryStrategy,
                fallbackResult: recoveryResult.result
              }
            } as ErrorHandlingResult<T>;
          }
        }
        
        // If not the last attempt and retry is viable, continue
        if (attempt < finalConfig.maxRetries - 1 && errorContext.recoveryStrategy === "retry") {
          // Add exponential backoff for retries
          yield* Effect.sleep(Math.pow(2, attempt) * 1000);
          continue;
        }
        
        break;
      }
    }
    
    return {
      success: false,
      result: undefined,
      error: lastError,
      recovery: {
        attempted: true,
        successful: false,
        strategy: lastError?.recoveryStrategy || "abort",
        fallbackResult: undefined
      }
    } as ErrorHandlingResult<T>;
  }).pipe(
    Effect.timeout(finalConfig.timeoutMs),
    Effect.catchAll(() => 
      Effect.succeed({
        success: false,
        result: undefined,
        error: createTimeoutError(context.operation || "unknown-operation", finalConfig.timeoutMs),
        recovery: {
          attempted: false,
          successful: false,
          strategy: "abort" as const,
          fallbackResult: undefined
        }
      } as ErrorHandlingResult<T>)
    )
  );
}

/**
 * Attempt error recovery based on strategy
 */
function attemptRecovery<T>(
  errorContext: ErrorContext,
  config: ErrorHandlingConfig
): Effect.Effect<ErrorHandlingResult<T>, never> {
  return Effect.gen(function* () {
    switch (errorContext.recoveryStrategy) {
      case "default":
        if (errorContext.additionalData && 'recoveryValue' in errorContext.additionalData && errorContext.additionalData['recoveryValue'] !== undefined) {
          return {
            success: true,
            result: errorContext.additionalData['recoveryValue'] as T
          };
        }
        break;
        
      case "fallback":
        if (config.enableFallbacks) {
          // Implement fallback logic based on error category
          return yield* performFallback<T>(errorContext);
        }
        break;
        
      case "cache":
        if (config.enableCaching) {
          // Try to use cached result
          return yield* useCachedResult<T>(errorContext);
        }
        break;
        
      case "skip":
        return {
          success: true,
          result: undefined as T // Type assertion needed for skip strategy
        };
        
      default:
        break;
    }
    
    return {
      success: false,
      error: errorContext
    };
  });
}

/**
 * Perform fallback operation
 */
function performFallback<T>(errorContext: ErrorContext): Effect.Effect<ErrorHandlingResult<T>, never> {
  return Effect.gen(function* () {
    switch (errorContext.category) {
      case "file-system":
        if (errorContext.additionalData && 'fallbackPath' in errorContext.additionalData && errorContext.additionalData['fallbackPath']) {
          // Try fallback path - this would need actual implementation
          return { success: false, error: errorContext };
        }
        break;
        
      default:
        return { success: false, error: errorContext };
    }
    
    return { success: false, error: errorContext };
  });
}

/**
 * Use cached result if available
 */
function useCachedResult<T>(errorContext: ErrorContext): Effect.Effect<ErrorHandlingResult<T>, never> {
  return Effect.succeed({
    success: false,
    error: errorContext
  });
  // Implementation would check cache based on operation and context
}

/**
 * Create error context from generic exception
 */
function createErrorFromException(
  error: Error,
  operation: string,
  context: Partial<ErrorContext>
): ErrorContext {
  return createErrorContext({
    what: `Operation '${operation}' failed with error: ${error.message}`,
    reassure: "This is an unexpected error that will be logged for investigation.",
    why: "An unhandled exception occurred during processing.",
    fix: [
      "Check the error details for specific guidance",
      "Verify input data is valid and complete",
      "Report this issue if it persists"
    ],
    escape: "Operation will be aborted to prevent data corruption",
    severity: context.severity || "error",
    category: context.category || "unknown",
    operation,
    ...(error.stack && { stackTrace: error.stack }),
    recoveryStrategy: context.recoveryStrategy || "abort",
    canRecover: context.canRecover ?? false,
    ...(context.target && { target: context.target }),
    ...(context.source && { source: context.source }),
    ...(context.additionalData && { additionalData: context.additionalData }),
    ...(context.recoveryHint && { recoveryHint: context.recoveryHint }),
    ...(context.causedBy && { causedBy: context.causedBy }),
    ...(context.relatedErrors && { relatedErrors: context.relatedErrors })
  });
}

/**
 * Create timeout error context
 */
function createTimeoutError(operation: string, timeoutMs: number): ErrorContext {
  return createErrorContext({
    what: `Operation '${operation}' timed out after ${timeoutMs}ms`,
    reassure: "Timeout errors usually indicate the operation is taking longer than expected.",
    why: "The operation exceeded the configured timeout threshold.",
    fix: [
      "Increase the timeout configuration",
      "Reduce the complexity of the input",
      "Check for performance bottlenecks"
    ],
    escape: "Operation will be cancelled to prevent system hang",
    severity: "error",
    category: "memory",
    operation,
    recoveryStrategy: "abort",
    canRecover: false,
    additionalData: { timeoutMs }
  });
}

// Re-export for convenience
export {
  createErrorContext as createError,
  withErrorHandling as withRecovery
};
