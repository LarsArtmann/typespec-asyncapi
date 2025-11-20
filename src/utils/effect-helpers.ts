/**
 * Effect Helper Utilities for TypeSpec AsyncAPI Emitter
 * 
 * 🚨 ARCHITECTURAL VIOLATION: This file demonstrates fundamental 
 * misunderstanding of Effect.TS patterns and must be refactored.
 * 
 * TODO: Replace with proper Effect.TS patterns without embedded success/error states.
 */

import { Effect } from "effect";

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
    // TODO: Replace with Effect.log for proper effect composition
    // TODO: Add proper error handling for logging failures
    // TODO: Use structured logging instead of string concatenation
    // eslint-disable-next-line no-console
    console.log(`[DEBUG] ${message}`, data);
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
    // eslint-disable-next-line no-console
    console.log(`[INFO] ${message}`, data);
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
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${message}`, data);
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
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}`, error);
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
    return Effect.sync(() => {
      // eslint-disable-next-line no-console
      console.log(`[INIT] Initializing ${serviceName}`);
      // eslint-disable-next-line no-console
      console.log(`[INIT] Service: ${serviceName}`);
      // eslint-disable-next-line no-console
      console.log(`[INIT] Status: Starting`);
      // eslint-disable-next-line no-console
      console.log(`[INIT] Dependencies: Loaded`);
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
    return Effect.sync(() => {
      // eslint-disable-next-line no-console
      console.log(`[SUCCESS] ${serviceName} initialized successfully`);
      // eslint-disable-next-line no-console
      console.log(`[SUCCESS] Service: ${serviceName}`);
      // eslint-disable-next-line no-console
      console.log(`[SUCCESS] Status: Ready`);
      // eslint-disable-next-line no-console
      console.log(`[SUCCESS] Dependencies: Verified`);
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
    // eslint-disable-next-line no-console
    console.log(`[SUCCESS] ${operation}`, result);
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
    // eslint-disable-next-line no-console
    console.error(`[FAILURE] ${operation}`, error);
  },
} as const;