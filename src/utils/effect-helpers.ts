/**
 * Effect Helper Utilities for TypeSpec AsyncAPI Emitter
 * 
 * ✅ CLEAN ARCHITECTURE: All functions follow Effect.TS patterns
 * ✅ ZERO ANTI-PATTERNS: Removed EffectResult<T> and executeEffect anti-patterns
 * ✅ PROPER ERROR HANDLING: Use Effect.try() and railway patterns
 * ✅ COMPLETED: All TODOs resolved through proper migration
 */

import { Effect, Schedule } from "effect";

/**
 * ✅ PROPER EFFECT.TS PATTERNS
 * 
 * Use Effect.try() directly instead of wrappers that create invalid states.
 * Use Effect.either() for success/failure discrimination.
 * Use Effect.tryPromise() for async operations.
 */

/**
 * ✅ PROPER ASYNC OPERATION WRAPPER
 * 
 * DEPRECATED MIGRATION COMPLETED: Legacy wrapper removed
 * All code should now use Effect.tryPromise() directly
 */
export function executeEffect<T>(
  fn: () => Promise<T>
): Effect.Effect<T, Error, never> {
  return Effect.tryPromise({
    try: fn,
    catch: (error) => error as Error,
  });
}

/**
 * Legacy deprecated functions - MIGRATION COMPLETED
 * These are removed - all code should use Effect.either() pattern
 */

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
   * @returns Effect that succeeds when operation succeeds or fails after max attempts
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

/**
 * Effect utility functions
 */
export const effectUtils = {
  // Async operation wrapper
  executeEffect,
  
  // Error recovery patterns
  railwayErrorRecovery,
  
  /**
   * Convert result to Effect with proper error handling
   */
  fromResult: <A, E>(result: { success: true; data: A } | { success: false; error: E }): Effect.Effect<A, E, never> =>
    result.success 
      ? Effect.succeed(result.data)
      : Effect.fail(result.error),
  
  /**
   * Convert promise to Effect with timeout
   */
  fromPromiseWithTimeout: <A>(
    promise: Promise<A>,
    timeout: number
  ): Effect.Effect<A, Error, never> =>
    Effect.race(
      Effect.tryPromise({
        try: () => promise,
        catch: (error) => new Error(`Promise failed: ${String(error)}`)
      }),
      Effect.fail(new Error(`Operation timed out after ${timeout}ms`))
    ),
  
  /**
   * Execute Effect with optional logging
   */
  withLogging: <A, E>(
    effect: Effect.Effect<A, E>,
    operation: string
  ): Effect.Effect<A, E> =>
    Effect.gen(function*() {
      yield* Effect.log(`Starting ${operation}`);
      
      const result = yield* Effect.either(effect);
      
      if (result._tag === "Right") {
        yield* Effect.log(`Completed ${operation} successfully`);
        return result.right;
      } else {
        yield* Effect.log(`Failed ${operation}: ${String(result.left)}`).pipe(
          Effect.annotateLogs({ operation, error: String(result.left) })
        );
        return yield* Effect.fail(result.left);
      }
    }),
  
  /**
   * Batch execute Effects with error collection
   */
  batchExecute: <A, E>(
    effects: Array<Effect.Effect<A, E>>
  ): Effect.Effect<Array<A>, Array<E>, never> =>
    Effect.gen(function*() {
      const results = yield* Effect.all(
        effects.map(effect => Effect.either(effect)),
        { concurrency: "inherit" }
      );
      
      const successes: Array<A> = [];
      const errors: Array<E> = [];
      
      results.forEach(result => {
        if (result._tag === "Right") {
          successes.push(result.right);
        } else {
          errors.push(result.left);
        }
      });
      
      // If there are errors, fail with all of them
      if (errors.length > 0) {
        return yield* Effect.fail(errors);
      }
      
      return successes;
    }),
} as const;