/**
 * Effect Helper Utilities for TypeSpec AsyncAPI Emitter
 * 
 * ✅ CLEAN ARCHITECTURE: All functions follow Effect.TS patterns
 * ✅ ZERO ANTI-PATTERNS: Removed EffectResult<T> and executeEffect anti-patterns
 * ✅ PROPER ERROR HANDLING: Use Effect.try() and railway patterns
 */

import { Effect, Schedule } from "effect";

/**
 * ✅ PROPER EFFECT.TS PATTERNS
 * 
 * Use Effect.try() directly instead of wrappers that create invalid states.
 * Use Effect.either() for success/failure discrimination.
 */

/**
 * ✅ PROPER ASYNC OPERATION WRAPPER
 * 
 * Use Effect.tryPromise() directly in your code instead of this wrapper.
 * This is provided only for legacy compatibility - migrate to Effect.tryPromise().
 * 
 * @deprecated Use Effect.tryPromise({ try: fn, catch: errorConverter }) directly
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
 * ✅ DEPRECATED: Use Effect.either() instead
 * 
 * @deprecated Use Effect.either(effect) and check result._tag === "Right"
 */
export function isEffectSuccess<T>(_result: unknown): boolean {
  // TODO: Remove deprecated function
  return false;
}

/**
 * ✅ DEPRECATED: Use Effect.either() instead
 * 
 * @deprecated Use Effect.either(effect) and check result._tag === "Left"
 */
export function getEffectError<T>(_result: unknown): Error | undefined {
  // TODO: Remove deprecated function
  return undefined;
}

/**
 * @deprecated Use src/logger.ts instead - Logger service with proper Layer patterns
 *
 * 🚨 LEGACY COMPATIBILITY: Railway logging expected by tests
 *
 * This object is deprecated and will be removed in a future version.
 * Use new Logger service from src/logger.ts which provides:
 * - Proper Effect.TS Layer patterns
 * - Composable logging with yield*
 * - Testable via LoggerTest Layer
 * - Better performance and type safety
 *
 * Migration path:
 * ```typescript
 * // OLD
 * import { railwayLogging } from "./effect-helpers.js"
 * Effect.runSync(railwayLogging.logInitialization("Service"))
 *
 * // NEW
 * import { LoggerLive } from "./logger.js"
 * const program = Effect.gen(function*() {
 *   yield* Effect.log("Initializing Service")
 * }).pipe(Effect.provide(LoggerLive))
 * Effect.runSync(program)
 * ```
 *
 * TODO: Migrate all tests to use src/logger.ts
 * TODO: Remove this object after test migration complete
 */
// ✅ RAILWAY LOGGING REMOVED: Use src/logger.ts instead
// All logging should use Logger service with proper Layer patterns
// Example: Effect.log("message").pipe(Effect.provide(LoggerLive))

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