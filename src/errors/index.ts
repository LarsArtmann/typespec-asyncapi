/**
 * CENTRALIZED ERROR HANDLING SYSTEM
 * 
 * Production-ready error handling that combines Error base class inheritance
 * with comprehensive What/Reassure/Why/Fix/Escape messaging patterns.
 * 
 * Compatible with:
 * - JavaScript Error base class (instanceof Error === true)
 * - TypeScript type system
 * - Effect.TS tagged error patterns
 * - Comprehensive error context and recovery strategies
 */

// Export base error class and types
export {
  BaseAsyncAPIError,
  type ErrorSeverity,
  type ErrorCategory,
  type RecoveryStrategy,
  type ErrorContext,
  isAsyncAPIError,
  errorToContext
} from "./base.js";

// Export validation errors
export {
  AsyncAPIValidationError,
  SchemaValidationError as ValidationSchemaValidationError,
  ConfigurationValidationError,
  DecoratorValidationError,
  TypeConstraintError
} from "./validation.js";

// Export compilation errors
export {
  TypeSpecCompilationError,
  TypeSpecSyntaxError,
  TypeSpecSemanticError,
  ImportResolutionError,
  CircularDependencyError
} from "./compilation.js";

// Export file system errors
export {
  FileSystemError,
  FileNotFoundError,
  PermissionDeniedError,
  DiskSpaceError,
  InvalidPathError,
  FileLockError
} from "./filesystem.js";

// Export schema generation errors
export {
  SchemaGenerationError,
  CircularReferenceError,
  UnsupportedTypeError,
  TypeResolutionError,
  SchemaValidationError,
  TypeSimplificationWarning
} from "./schema.js";

// Export performance errors
export {
  MemoryUsageError,
  OperationTimeoutError,
  PerformanceThresholdError,
  ResourceExhaustionError,
  ConcurrencyLimitError
} from "./performance.js";

// Export emitter errors
export {
  EmitterInitializationError,
  EmitterConfigurationError,
  OutputGenerationError,
  VersionCompatibilityError,
  DecoratorProcessingError,
  ProtocolBindingError
} from "./emitter.js";

// Re-export for convenience and backward compatibility
import { BaseAsyncAPIError } from "./base.js";

/**
 * Union type of all AsyncAPI error classes for type narrowing
 */
export type AsyncAPIError = 
  // Validation errors
  | import("./validation.js").AsyncAPIValidationError
  | import("./validation.js").SchemaValidationError
  | import("./validation.js").ConfigurationValidationError
  | import("./validation.js").DecoratorValidationError
  | import("./validation.js").TypeConstraintError
  // Compilation errors
  | import("./compilation.js").TypeSpecCompilationError
  | import("./compilation.js").TypeSpecSyntaxError
  | import("./compilation.js").TypeSpecSemanticError
  | import("./compilation.js").ImportResolutionError
  | import("./compilation.js").CircularDependencyError
  // File system errors
  | import("./filesystem.js").FileSystemError
  | import("./filesystem.js").FileNotFoundError
  | import("./filesystem.js").PermissionDeniedError
  | import("./filesystem.js").DiskSpaceError
  | import("./filesystem.js").InvalidPathError
  | import("./filesystem.js").FileLockError
  // Schema generation errors
  | import("./schema.js").SchemaGenerationError
  | import("./schema.js").CircularReferenceError
  | import("./schema.js").UnsupportedTypeError
  | import("./schema.js").TypeResolutionError
  | import("./schema.js").SchemaValidationError
  | import("./schema.js").TypeSimplificationWarning
  // Performance errors
  | import("./performance.js").MemoryUsageError
  | import("./performance.js").OperationTimeoutError
  | import("./performance.js").PerformanceThresholdError
  | import("./performance.js").ResourceExhaustionError
  | import("./performance.js").ConcurrencyLimitError
  // Emitter errors
  | import("./emitter.js").EmitterInitializationError
  | import("./emitter.js").EmitterConfigurationError
  | import("./emitter.js").OutputGenerationError
  | import("./emitter.js").VersionCompatibilityError
  | import("./emitter.js").DecoratorProcessingError
  | import("./emitter.js").ProtocolBindingError;

/**
 * Error factory functions for convenient error creation
 */
export const ErrorFactories = {
  /**
   * Create a validation error
   */
  validation: (params: {
    field: string;
    value: unknown;
    expected: string;
    operation: string;
    recoveryValue?: unknown;
  }) => {
    const { AsyncAPIValidationError } = require("./validation.js");
    return new AsyncAPIValidationError(params);
  },
  
  /**
   * Create a compilation error
   */
  compilation: (params: {
    diagnostic: import("@typespec/compiler").Diagnostic;
    operation: string;
  }) => {
    const { TypeSpecCompilationError } = require("./compilation.js");
    return new TypeSpecCompilationError(params);
  },
  
  /**
   * Create a file system error
   */
  fileSystem: (params: {
    path: string;
    operation: string;
    originalError: Error;
    fallbackPath?: string;
  }) => {
    const { FileSystemError } = require("./filesystem.js");
    return new FileSystemError(params);
  },
  
  /**
   * Create a schema generation error
   */
  schema: (params: {
    typeName: string;
    issue: string;
    operation: string;
    target?: import("@typespec/compiler").DiagnosticTarget;
    source?: import("@typespec/compiler").SourceLocation;
  }) => {
    const { SchemaGenerationError } = require("./schema.js");
    return new SchemaGenerationError(params);
  },
  
  /**
   * Create a performance error
   */
  performance: (params: {
    metric: string;
    actual: number;
    threshold: number;
    operation: string;
  }) => {
    const { PerformanceThresholdError } = require("./performance.js");
    return new PerformanceThresholdError(params);
  },
  
  /**
   * Create an emitter error
   */
  emitter: (params: {
    component: string;
    issue: string;
    operation: string;
    fallbackMode?: string;
  }) => {
    const { EmitterInitializationError } = require("./emitter.js");
    return new EmitterInitializationError(params);
  }
} as const;

/**
 * Error handling utilities for integration with existing systems
 */
export const ErrorHandlingUtils = {
  /**
   * Convert any error to AsyncAPI error context
   */
  toErrorContext: (error: unknown, operation: string): import("./base.js").ErrorContext => {
    if (error instanceof BaseAsyncAPIError) {
      return error.getErrorContext();
    }
    
    if (error instanceof Error) {
      return {
        errorId: `GENERIC_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
        timestamp: new Date(),
        severity: "error" as const,
        category: "unknown" as const,
        what: `Operation '${operation}' failed: ${error.message}`,
        reassure: "This is an unexpected error that will be logged for investigation.",
        why: "An unhandled exception occurred during processing.",
        fix: [
          "Check the error details for specific guidance",
          "Verify input data is valid and complete", 
          "Report this issue if it persists"
        ],
        escape: "Operation will be aborted to prevent data corruption",
        operation,
        recoveryStrategy: "abort" as const,
        canRecover: false,
        stackTrace: error.stack
      };
    }
    
    return {
      errorId: `UNKNOWN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
      timestamp: new Date(),
      severity: "error" as const,
      category: "unknown" as const,
      what: `Operation '${operation}' failed with unknown error: ${String(error)}`,
      reassure: "This is an unexpected error that will be logged for investigation.",
      why: "An unknown error occurred during processing.",
      fix: [
        "Check the operation parameters and input data",
        "Review the system logs for additional context",
        "Report this issue with reproduction steps"
      ],
      escape: "Operation will be aborted to prevent data corruption",
      operation,
      recoveryStrategy: "abort" as const,
      canRecover: false
    };
  },
  
  /**
   * Check if an error is recoverable
   */
  isRecoverable: (error: unknown): boolean => {
    if (error instanceof BaseAsyncAPIError) {
      return error.canRecover;
    }
    return false;
  },
  
  /**
   * Get user-friendly error message
   */
  getUserMessage: (error: unknown): string => {
    if (error instanceof BaseAsyncAPIError) {
      return error.getUserMessage();
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return String(error);
  },
  
  /**
   * Get technical error summary
   */
  getTechnicalSummary: (error: unknown, operation?: string): string => {
    if (error instanceof BaseAsyncAPIError) {
      return error.getTechnicalSummary();
    }
    
    if (error instanceof Error) {
      return `[GENERIC] ${error.name}: ${error.message}${operation ? ` (${operation})` : ''}`;
    }
    
    return `[UNKNOWN] ${String(error)}${operation ? ` (${operation})` : ''}`;
  }
} as const;
