/**
 * INTEGRATION BRIDGE FOR EXISTING ERROR HANDLING SYSTEM
 * 
 * Bridges the new Error-based classes with the existing error handling system
 * to ensure backward compatibility and seamless migration
 */

import { Effect } from "effect";
import type { Program, Diagnostic } from "@typespec/compiler";
import {
  BaseAsyncAPIError,
  isAsyncAPIError,
  errorToContext,
  type ErrorContext
} from "./base.js";

// Import existing error handling system types
import type {
  ErrorHandlingResult,
  ErrorHandlingConfig,
  ErrorHandler
} from "../error-handling/index.js";

// Note: existingWithErrorHandling import removed as it's not used in simplified implementation

// Import diagnostic utilities
import { reportErrorContext } from "../error-handling/diagnostics.js";

// Import logging utilities
import type { ErrorLogger } from "../error-handling/logging.js";

/**
 * Enhanced error handling that works with both old and new error systems
 */
export function withErrorHandling<T>(
  operation: () => Effect.Effect<T, Error>,
  operationName: string,
  _config: Partial<ErrorHandlingConfig> = {},
  logger?: ErrorLogger
): Effect.Effect<ErrorHandlingResult<T>, never> {
  return Effect.catchAll(
    Effect.map(operation(), (result) => ({
      success: true,
      result,
      error: undefined,
      recovery: undefined
    } as ErrorHandlingResult<T>)),
    (error: Error) => {
      // Convert to error context using new system
      const errorContext = convertErrorToContext(error, operationName);
      
      // Log using new system if logger provided
      if (logger) {
        logger.logError(errorContext);
      }
      
      // Check if error is recoverable using new system
      if (isAsyncAPIError(error) && error.canRecover) {
        return Effect.gen(function* () {
          const recoveryResult = yield* attemptRecoveryWithNewSystem<T>(error);
          if (recoveryResult.success) {
            return {
              success: true,
              result: recoveryResult.result!,
              error: undefined,
              recovery: {
                attempted: true,
                successful: true,
                strategy: error.recoveryStrategy,
                fallbackResult: recoveryResult.result
              }
            } as ErrorHandlingResult<T>;
          }
          
          return {
            success: false,
            result: undefined,
            error: errorContext,
            recovery: {
              attempted: true,
              successful: false,
              strategy: errorContext.recoveryStrategy,
              fallbackResult: undefined
            }
          } as ErrorHandlingResult<T>;
        });
      }
      
      return Effect.succeed({
        success: false,
        result: undefined,
        error: errorContext,
        recovery: {
          attempted: false,
          successful: false,
          strategy: errorContext.recoveryStrategy,
          fallbackResult: undefined
        }
      } as ErrorHandlingResult<T>);
    }
  );
}

/**
 * Convert any error to ErrorContext using new system first, falling back to existing
 */
function convertErrorToContext(error: unknown, operationName: string): ErrorContext {
  if (isAsyncAPIError(error)) {
    return error.getErrorContext();
  }
  
  if (error instanceof Error) {
    return errorToContext(error, operationName);
  }
  
  // Fallback to existing system conversion
  return {
    errorId: `BRIDGE_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
    timestamp: new Date(),
    severity: "error" as const,
    category: "unknown" as const,
    what: `Operation '${operationName}' failed with unknown error: ${String(error)}`,
    reassure: "This is an unexpected error that will be logged for investigation.",
    why: "An unknown error occurred during processing.",
    fix: [
      "Check the operation parameters and input data",
      "Review the system logs for additional context",
      "Report this issue with reproduction steps"
    ],
    escape: "Operation will be aborted to prevent data corruption",
    operation: operationName,
    recoveryStrategy: "abort" as const,
    canRecover: false
  };
}

/**
 * Attempt recovery using new error system
 */
function attemptRecoveryWithNewSystem<T>(error: BaseAsyncAPIError): Effect.Effect<ErrorHandlingResult<T>, never> {
  return Effect.gen(function* () {
    switch (error.recoveryStrategy) {
      case "default":
        if (error.additionalData && 'recoveryValue' in error.additionalData && error.additionalData['recoveryValue'] !== undefined) {
          return {
            success: true,
            result: error.additionalData['recoveryValue'] as T
          };
        }
        break;
        
      case "skip":
        return {
          success: true,
          result: undefined as T
        };
        
      case "degrade":
        return {
          success: true,
          result: undefined as T
        };
        
      default:
        break;
    }
    
    return {
      success: false,
      error: error.getErrorContext()
    };
  });
}

/**
 * Error handler that works with both old and new systems
 */
export class BridgeErrorHandler<T> implements ErrorHandler<T> {
  constructor(private readonly logger?: ErrorLogger) {}
  
  canHandle(_error: Error): boolean {
    return true; // Handle all errors as a fallback
  }
  
  handle(error: Error, context: Partial<ErrorContext>): Effect.Effect<ErrorHandlingResult<T>, never> {
    return Effect.gen((function* (this: BridgeErrorHandler<T>) {
      const errorContext = isAsyncAPIError(error) 
        ? error.getErrorContext() 
        : convertErrorToContext(error, context.operation || "unknown");
      
      // Log if logger available
      if (this.logger) {
        this.logger.logError(errorContext);
      }
      
      // Try recovery if it's an AsyncAPI error
      if (isAsyncAPIError(error) && error.canRecover) {
        const recoveryResult = yield* attemptRecoveryWithNewSystem<T>(error);
        if (recoveryResult.success) {
          return {
            success: true,
            result: recoveryResult.result!,
            recovery: {
              attempted: true,
              successful: true,
              strategy: error.recoveryStrategy,
              fallbackResult: recoveryResult.result
            }
          };
        }
      }
      
      return {
        success: false,
        error: errorContext,
        recovery: {
          attempted: isAsyncAPIError(error) && error.canRecover,
          successful: false,
          strategy: errorContext.recoveryStrategy,
          fallbackResult: undefined
        }
      };
    }).bind(this));
  }
}

/**
 * Report AsyncAPI errors to TypeSpec diagnostic system
 */
export function reportAsyncAPIError(program: Program, error: BaseAsyncAPIError): void {
  reportErrorContext(program, error.getErrorContext());
}

/**
 * Convert TypeSpec diagnostic to AsyncAPI error
 */
export async function diagnosticToAsyncAPIError(diagnostic: Diagnostic, operation: string): Promise<BaseAsyncAPIError> {
  // Import the compilation error here to avoid circular dependencies
  const CompilationModule = await import("./compilation.js");
  return new CompilationModule.TypeSpecCompilationError({ diagnostic, operation });
}

/**
 * Utility functions for migration from existing error handling
 */
export const migrationUtils = {
  /**
   * Convert existing error context to new AsyncAPI error
   */
  contextToAsyncAPIError: (context: ErrorContext): BaseAsyncAPIError => {
    // Create a generic AsyncAPI error that matches the context
    class GenericAsyncAPIError extends BaseAsyncAPIError {
      readonly _tag = "GenericAsyncAPIError" as const;
      
      constructor(ctx: ErrorContext) {
        super({
          what: ctx.what,
          reassure: ctx.reassure,
          why: ctx.why,
          fix: ctx.fix,
          escape: ctx.escape,
          severity: ctx.severity,
          category: ctx.category,
          operation: ctx.operation,
          recoveryStrategy: ctx.recoveryStrategy,
          canRecover: ctx.canRecover,
          additionalData: ctx.additionalData
        });
        
        // Override generated ID with existing one for consistency
        Object.defineProperties(this, {
          errorId: { value: ctx.errorId, writable: false, enumerable: true },
          timestamp: { value: ctx.timestamp, writable: false, enumerable: true }
        });
      }
    }
    
    return new GenericAsyncAPIError(context);
  },
  
  /**
   * Wrap existing error handlers to work with new system
   */
  wrapHandler: <TResult>(_handler: ErrorHandler<TResult>, logger?: ErrorLogger) => {
    return new BridgeErrorHandler<TResult>(logger);
  },
  
  /**
   * Create error factory from existing error creation functions
   */
  createErrorFromExisting: (errorType: string, params: Record<string, unknown>, operation: string): BaseAsyncAPIError => {
    class MigratedAsyncAPIError extends BaseAsyncAPIError {
      readonly _tag = `Migrated${errorType}` as const;
      
      constructor() {
        super({
          what: `Migrated ${errorType}: ${JSON.stringify(params)}`,
          reassure: "This error was created using the existing error handling system and migrated to the new format.",
          why: "Error migration from legacy error handling system.",
          fix: ["Review the error parameters for specific guidance"],
          escape: "Error context preserved during migration",
          severity: "error" as const,
          category: "unknown" as const,
          operation,
          recoveryStrategy: "abort" as const,
          canRecover: false,
          additionalData: { errorType, originalParams: params }
        });
      }
    }
    
    return new MigratedAsyncAPIError();
  }
} as const;

/**
 * Type guards for error system migration
 */
export const typeGuards = {
  isNewAsyncAPIError: isAsyncAPIError,
  isLegacyErrorContext: (error: unknown): error is ErrorContext => {
    return (
      typeof error === 'object' &&
      error !== null &&
      'errorId' in error &&
      'what' in error &&
      'reassure' in error &&
      'why' in error &&
      'fix' in error &&
      'escape' in error
    );
  }
} as const;
