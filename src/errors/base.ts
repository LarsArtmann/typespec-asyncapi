/**
 * BASE ERROR CLASS WITH WHAT/REASSURE/WHY/FIX/ESCAPE PATTERNS
 * 
 * Extends JavaScript Error base class while maintaining comprehensive error context
 * Compatible with Effect.TS tagged error patterns and TypeScript/JavaScript ecosystems
 */

export type ErrorSeverity = "fatal" | "error" | "warning" | "info" | "debug";

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
 * Base error class that extends Error and includes What/Reassure/Why/Fix/Escape fields
 * 
 * Provides:
 * - JavaScript Error compatibility (instanceof Error === true)
 * - TypeScript type safety
 * - Effect.TS tagged error compatibility
 * - Comprehensive error context
 * - Recovery strategy information
 */
export abstract class BaseAsyncAPIError extends Error {
  // Effect.TS tagged error compatibility
  abstract readonly _tag: string;
  
  // What/Reassure/Why/Fix/Escape pattern
  readonly what: string;
  readonly reassure: string;
  readonly why: string;
  readonly fix: string[];
  readonly escape: string;
  
  // Error categorization and metadata
  readonly severity: ErrorSeverity;
  readonly category: ErrorCategory;
  readonly operation: string;
  readonly recoveryStrategy: RecoveryStrategy;
  readonly canRecover: boolean;
  readonly errorId: string;
  readonly timestamp: Date;
  
  // Optional context data
  readonly additionalData?: Record<string, unknown>;
  readonly recoveryHint?: string;
  readonly causedBy?: BaseAsyncAPIError;
  readonly relatedErrors?: BaseAsyncAPIError[];
  
  constructor({
    what,
    reassure,
    why,
    fix,
    escape,
    severity = "error",
    category,
    operation,
    recoveryStrategy = "abort",
    canRecover = false,
    additionalData,
    recoveryHint,
    causedBy,
    relatedErrors
  }: {
    what: string;
    reassure: string;
    why: string;
    fix: string[];
    escape: string;
    severity?: ErrorSeverity;
    category: ErrorCategory;
    operation: string;
    recoveryStrategy?: RecoveryStrategy;
    canRecover?: boolean;
    additionalData?: Record<string, unknown>;
    recoveryHint?: string;
    causedBy?: BaseAsyncAPIError;
    relatedErrors?: BaseAsyncAPIError[];
  }) {
    // Call Error constructor with the "what" message for Error base class compatibility
    super(what);
    
    // Set error name for JavaScript Error compatibility
    this.name = this.constructor.name;
    
    // Ensure proper prototype chain in TypeScript
    Object.setPrototypeOf(this, new.target.prototype);
    
    // Set What/Reassure/Why/Fix/Escape fields
    this.what = what;
    this.reassure = reassure;
    this.why = why;
    this.fix = [...fix]; // Defensive copy
    this.escape = escape;
    
    // Set categorization and metadata
    this.severity = severity;
    this.category = category;
    this.operation = operation;
    this.recoveryStrategy = recoveryStrategy;
    this.canRecover = canRecover;
    this.errorId = this.generateErrorId();
    this.timestamp = new Date();
    
    // Set optional context  
    if (additionalData) {
      this.additionalData = { ...additionalData };
    }
    if (recoveryHint) {
      this.recoveryHint = recoveryHint;
    }
    if (causedBy) {
      this.causedBy = causedBy;
    }
    if (relatedErrors) {
      this.relatedErrors = [...relatedErrors];
    }
    
    // Capture stack trace if available (V8 specific)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Generate unique error ID for tracking
   */
  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `TSA_${timestamp}_${random}`.toUpperCase();
  }
  
  /**
   * Get comprehensive error context for logging/debugging
   */
  getErrorContext(): ErrorContext {
    const context: Partial<ErrorContext> & Pick<ErrorContext, 'errorId' | 'timestamp' | 'severity' | 'category' | 'what' | 'reassure' | 'why' | 'fix' | 'escape' | 'operation' | 'recoveryStrategy' | 'canRecover'> = {
      errorId: this.errorId,
      timestamp: this.timestamp,
      severity: this.severity,
      category: this.category,
      what: this.what,
      reassure: this.reassure,
      why: this.why,
      fix: this.fix,
      escape: this.escape,
      operation: this.operation,
      recoveryStrategy: this.recoveryStrategy,
      canRecover: this.canRecover
    };
    
    // Add optional fields only if they exist
    if (this.stack) {
      context.stackTrace = this.stack;
    }
    if (this.additionalData) {
      context.additionalData = this.additionalData;
    }
    if (this.recoveryHint) {
      context.recoveryHint = this.recoveryHint;
    }
    if (this.causedBy) {
      context.causedBy = this.causedBy.getErrorContext();
    }
    if (this.relatedErrors) {
      context.relatedErrors = this.relatedErrors.map(e => e.getErrorContext());
    }
    
    return context as ErrorContext;
  }
  
  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    return `${this.what}\n\n${this.reassure}\n\nTo fix this:\n${this.fix.map(f => `• ${f}`).join('\n')}\n\nWorkaround: ${this.escape}`;
  }
  
  /**
   * Get technical error summary
   */
  getTechnicalSummary(): string {
    return `[${this.errorId}] ${this.category.toUpperCase()}: ${this.what} (${this.operation})`;
  }
  
  /**
   * Convert to JSON for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      _tag: (this as any)._tag,
      errorId: this.errorId,
      timestamp: this.timestamp.toISOString(),
      severity: this.severity,
      category: this.category,
      what: this.what,
      reassure: this.reassure,
      why: this.why,
      fix: this.fix,
      escape: this.escape,
      operation: this.operation,
      recoveryStrategy: this.recoveryStrategy,
      canRecover: this.canRecover,
      stack: this.stack,
      additionalData: this.additionalData,
      recoveryHint: this.recoveryHint,
      causedBy: this.causedBy?.toJSON(),
      relatedErrors: this.relatedErrors?.map(e => e.toJSON())
    };
  }
}

/**
 * Error context interface for compatibility with existing error handling system
 */
export interface ErrorContext {
  readonly errorId: string;
  readonly timestamp: Date;
  readonly severity: ErrorSeverity;
  readonly category: ErrorCategory;
  readonly what: string;
  readonly reassure: string;
  readonly why: string;
  readonly fix: string[];
  readonly escape: string;
  readonly operation: string;
  readonly recoveryStrategy: RecoveryStrategy;
  readonly canRecover: boolean;
  readonly stackTrace?: string;
  readonly additionalData?: Record<string, unknown>;
  readonly recoveryHint?: string;
  readonly causedBy?: ErrorContext;
  readonly relatedErrors?: ErrorContext[];
}

/**
 * Type guard to check if an error is a BaseAsyncAPIError
 */
export function isAsyncAPIError(error: unknown): error is BaseAsyncAPIError {
  return error instanceof BaseAsyncAPIError;
}

/**
 * Convert any Error to ErrorContext
 */
export function errorToContext(error: Error, operation: string, category: ErrorCategory = "unknown"): ErrorContext {
  if (isAsyncAPIError(error)) {
    return error.getErrorContext();
  }
  
  return {
    errorId: `GENERIC_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`.toUpperCase(),
    timestamp: new Date(),
    severity: "error" as const,
    category,
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
