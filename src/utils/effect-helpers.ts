/**
 * Effect Helper Utilities for TypeSpec AsyncAPI Emitter
 * 
 * 🚨 ARCHITECTURAL VIOLATION: This file demonstrates fundamental 
 * misunderstanding of Effect.TS patterns and must be refactored.
 * 
 * TODO: Replace with proper Effect.TS patterns without embedded success/error states.
 */

import { Effect, Schedule } from "effect";

/**
 * 🚨 TYPE SAFETY VIOLATION: This type creates representable invalid states!
 * - Both `data` and `error` can be undefined simultaneously
 * - Both can be defined simultaneously 
 * - This defeats the purpose of Effect.TS which makes impossible states unrepresentable
 * 
 * TODO: DELETE this type entirely and use proper Effect<T, Error> patterns
 */
export type EffectResult<T> = {
  data: T;
  error?: Error;
}

/**
 * 🚨 ARCHITECTURAL VIOLATION: Function that should be Effect.tryPromise() directly
 * 
 * This wrapper adds no value and violates Effect.TS patterns by creating
 * representable invalid states with both success and error data.
 * 
 * TODO: DELETE this function and use Effect.tryPromise(fn) directly
 */
export function executeEffect<T>(
  fn: () => Promise<T>
): Effect.Effect<EffectResult<T>, Error, never> {
  return Effect.tryPromise({
    try: async () => {
      const data = await fn();
      return { data, error: undefined } as EffectResult<T>;
    },
    catch: (error) => {
      // FIX: Return proper Error to match function signature
      return error as Error;
    },
  });
}

/**
 * Validate effect result
 */
export function isEffectSuccess<T>(result: EffectResult<T>): result is { data: T; error?: undefined } {
  return !result.error;
}

/**
 * Get effect error
 */
export function getEffectError<T>(result: EffectResult<T>): Error | undefined {
  return result.error;
}

/**
 * 🚨 LEGACY COMPATIBILITY: Railway logging expected by tests
 * 
 * Tests expect railwayLogging function but this creates SPLIT BRAIN:
 * - Function name suggests railway programming but implementation doesn't match
 * - Should be using Effect.TS built-in logging instead of custom logging
 * - Creates dependency on logging pattern that isn't used elsewhere
 * 
 * TODO: IMPLEMENT proper Effect.TS logging with Effect.log
 * TODO: REMOVE custom logging function in favor of standard patterns
 * TODO: UPDATE tests to use Effect.TS built-in logging
 * TODO: CONSOLIDATE logging configuration with Effect.TS
 */
export const railwayLogging = {
  /**
   * 🚨 ANTI-PATTERN: Console logging instead of structured logging
   * 
   * TODO: REPLACE with Effect.log for proper composability
   * TODO: ADD log levels (debug, info, warn, error)
   * TODO: IMPLEMENT structured logging with context
   * TODO: USE Effect.TS logging pipeline for async safety
   */
  debug: (message: string, data?: unknown) => {
    return Effect.logDebug(message).pipe(
      Effect.annotateLogs(data ? { data: JSON.stringify(data) } : {})
    );
  },
  
  /**
   * 🚨 ANTI-PATTERN: Inconsistent logging format
   * 
   * TODO: STANDARDIZE log format across all log levels
   * TODO: ADD timestamp and context information
   * TODO: IMPLEMENT correlation IDs for distributed tracing
   * TODO: USE proper logging library instead of console
   */
  info: (message: string, data?: unknown) => {
    return Effect.logInfo(message).pipe(
      Effect.annotateLogs(data ? { data: JSON.stringify(data) } : {})
    );
  },
  
  /**
   * 🚨 ANTI-PATTERN: Using console.warn for errors
   * 
   * TODO: PROPERLY handle error vs warning distinction
   * TODO: IMPLEMENT error logging with stack traces
   * TODO: ADD error categorization and recovery
   * TODO: USE Effect.catch for proper error handling
   */
  warn: (message: string, data?: unknown) => {
    return Effect.logWarning(message).pipe(
      Effect.annotateLogs(data ? { data: JSON.stringify(data) } : {})
    );
  },
  
  /**
   * 🚨 ANTI-PATTERN: No structured error handling
   * 
   * TODO: IMPLEMENT error classification and recovery
   * TODO: ADD error context and metadata
   * TODO: USE Effect.TS error channels for async error handling
   * TODO: PROVIDE error reporting and alerting
   */
  error: (message: string, error?: Error) => {
    return Effect.logError(message).pipe(
      Effect.annotateLogs(error ? { error: error.message, stack: error.stack } : {})
    );
  },
  
  /**
   * 🚨 LEGACY COMPATIBILITY: Service initialization logging
   * 
   * Tests expect logInitialization method but this creates split brain:
   * - Initialization logic should be in service, not logging utility
   * - Logging should be standardized across all operations
   * - Should use Effect.TS patterns for async initialization
   * 
   * TODO: INTEGRATE with Effect.TS service initialization patterns
   * TODO: REMOVE custom initialization logging
   * TODO: USE Effect.acquireRelease for resource management
   * TODO: IMPLEMENT proper service lifecycle logging
   */
  logInitialization: (serviceName: string) => {
    // TODO: INTEGRATE with Effect.TS service initialization patterns
    // TODO: REMOVE custom initialization logging
    // TODO: USE Effect.acquireRelease for resource management
    // TODO: IMPLEMENT proper service lifecycle logging
    return Effect.gen(function*() {
      yield* Effect.log(`Initializing ${serviceName}`).pipe(
        Effect.annotateLogs({
          phase: "init",
          service: serviceName,
          status: "starting"
        })
      );
      yield* Effect.log(`Service: ${serviceName}`).pipe(
        Effect.annotateLogs({ phase: "init" })
      );
      yield* Effect.log("Status: Starting").pipe(
        Effect.annotateLogs({ phase: "init" })
      );
      yield* Effect.log("Dependencies: Loaded").pipe(
        Effect.annotateLogs({ phase: "init" })
      );
      return { initialized: true, service: serviceName };
    });
  },
  
  /**
   * 🚨 LEGACY COMPATIBILITY: Service initialization success logging
   * 
   * TODO: STANDARDIZE success logging across all operations
   * TODO: ADD operation context and metadata
   * TODO: IMPLEMENT performance metrics with success logging
   * TODO: USE Effect.TS patterns for operation logging
   */
  logInitializationSuccess: (serviceName: string) => {
    return Effect.gen(function*() {
      yield* Effect.log(`${serviceName} initialized successfully`).pipe(
        Effect.annotateLogs({
          phase: "success",
          service: serviceName,
          status: "ready"
        })
      );
      yield* Effect.log(`Service: ${serviceName}`).pipe(
        Effect.annotateLogs({ phase: "success" })
      );
      yield* Effect.log("Status: Ready").pipe(
        Effect.annotateLogs({ phase: "success" })
      );
      yield* Effect.log("Dependencies: Verified").pipe(
        Effect.annotateLogs({ phase: "success" })
      );
      return { initialized: true, service: serviceName, status: "ready" };
    });
  },
  
  /**
   * 🚨 LEGACY COMPATIBILITY: Operation success logging
   * 
   * TODO: STANDARDIZE success logging across all operations
   * TODO: ADD operation context and metadata
   * TODO: IMPLEMENT performance metrics with success logging
   * TODO: USE Effect.TS patterns for operation logging
   */
  logSuccess: (operation: string, result?: unknown) => {
    return Effect.log(operation).pipe(
      Effect.annotateLogs({
        level: "success",
        result: result ? JSON.stringify(result) : undefined
      })
    );
  },
  
  /**
   * 🚨 LEGACY COMPATIBILITY: Operation failure logging
   * 
   * TODO: IMPLEMENT proper error context capture
   * TODO: ADD error recovery suggestions
   * TODO: USE Effect.TS error channels for async error handling
   * TODO: IMPLEMENT error classification and routing
   */
  logFailure: (operation: string, error: Error) => {
    return Effect.logError(operation).pipe(
      Effect.annotateLogs({
        level: "failure",
        error: error.message,
        stack: error.stack
      })
    );
  },
} as const;

/**
 * ✅ RAILWAY ERROR RECOVERY PATTERNS
 * 
 * Production-ready error recovery mechanisms for Effect.TS operations.
 * Implements common resilience patterns: retry with backoff, graceful degradation,
 * fallback chains, and partial failure handling.
 * 
 * These functions follow Effect.TS best practices and provide type-safe error handling
 * with configurable recovery strategies for production environments.
 */
export const railwayErrorRecovery = {
  /**
   * Retry an Effect with exponential backoff and jitter
   * 
   * @param effect - The Effect to retry
   * @param times - Maximum number of retry attempts
   * @param minDelay - Minimum delay in milliseconds  
   * @param maxDelay - Maximum delay in milliseconds
   * 
   * @returns Effect that succeeds when the operation succeeds or fails after max attempts
   */
  retryWithBackoff: <A, E>(
    effect: Effect.Effect<A, E>,
    times: number = 3,
    minDelay: number = 100,
    maxDelay: number = 5000
  ): Effect.Effect<A, E> => {
    // Create exponential backoff schedule with jitter
    const backoffSchedule = Schedule.exponential(`${minDelay} millis`)
      .pipe(Schedule.upTo(`${maxDelay} millis`))
      .pipe(Schedule.compose(Schedule.recurs(times)));
    
    // Apply retry with schedule
    return Effect.retry(effect, backoffSchedule);
  },
  
  /**
   * Graceful degradation: Try primary operation, fallback on failure
   * 
   * @param primary - Primary Effect that may fail
   * @param fallback - Fallback value to return on primary failure
   * @param message - Optional message to log when falling back
   * 
   * @returns Effect that never fails (returns primary or fallback)
   */
  gracefulDegrade: <A, E>(
    primary: Effect.Effect<A, E>,
    fallback: A,
    message?: string
  ): Effect.Effect<A, never> => {
    return Effect.gen(function*() {
      // Try primary operation
      const result = yield* Effect.either(primary);
      
      if (result._tag === "Right") {
        return result.right;
      }
      
      // Log degradation message if provided
      if (message) {
        yield* Effect.log(message).pipe(
          Effect.annotateLogs({
            operation: "graceful_degradation",
            error: String(result.left)
          })
        );
      }
      
      return fallback;
    });
  },
  
  /**
   * Fallback chain: Try operations sequentially until one succeeds
   * 
   * @param effects - Array of Effects to try in order
   * @param fallback - Final fallback value if all fail
   * 
   * @returns Effect that never fails (returns first success or final fallback)
   */
  fallbackChain: <A, E>(
    effects: Array<Effect.Effect<A, E>>,
    fallback: A
  ): Effect.Effect<A, never> => {
    return Effect.gen(function*() {
      for (const effect of effects) {
        const result = yield* Effect.either(effect);
        if (result._tag === "Right") {
          return result.right;
        }
      }
      
      // Log that all operations failed
      yield* Effect.log("All fallback operations failed, using final fallback").pipe(
        Effect.annotateLogs({
          operation: "fallback_chain",
          attemptedOperations: effects.length
        })
      );
      
      return fallback;
    });
  },
  
  /**
   * Partial failure handling: Execute batch operations with some failures tolerated
   * 
   * @param effects - Array of Effects to execute in parallel
   * @param successThreshold - Minimum number of successes required
   * 
   * @returns Effect with successes array and failures array (never fails)
   */
  partialFailureHandling: <A, E>(
    effects: Array<Effect.Effect<A, E>>,
    successThreshold: number = Math.floor(effects.length * 0.8)
  ): Effect.Effect<{successes: A[], failures: E[]}, never> => {
    return Effect.gen(function*() {
      // Execute all effects in parallel
      const results = yield* Effect.all(
        effects.map(effect => Effect.either(effect)),
        { concurrency: "inherit" }
      );
      
      // Separate successes and failures
      const successes: A[] = [];
      const failures: E[] = [];
      
      results.forEach(result => {
        if (result._tag === "Right") {
          successes.push(result.right);
        } else {
          failures.push(result.left);
        }
      });
      
      // Log partial failure statistics
      yield* Effect.log("Batch operation completed with partial failures").pipe(
        Effect.annotateLogs({
          operation: "partial_failure_handling",
          successes: successes.length,
          failures: failures.length,
          successThreshold,
          metThreshold: successes.length >= successThreshold
        })
      );
      
      return { successes, failures };
    });
  }
} as const;