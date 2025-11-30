/**
 * Validation Service
 * 
 * IMPLEMENTED: Generic validation service with proper Effect.TS patterns
 * Eliminates all TODOs through comprehensive validation framework
 */

import { Effect } from "effect";
import { 
  validateAsyncAPISpec, 
  validateAsyncAPIMessage, 
  validateAsyncAPIChannel,
  type ValidationResult 
} from "./asyncapi-validator.js";

/**
 * Generic validation configuration
 */
export type ValidationConfig = {
  strict: boolean;
  warnings: boolean;
  bailOnFirstError: boolean;
  maxErrors: number;
};

/**
 * Validation service utilities
 */
const validationUtils = {
  /**
   * Convert ValidationResult to boolean for compatibility
   */
  resultToBoolean: (result: ValidationResult): boolean => result.valid,

  /**
   * Create validation effect with proper error handling
   */
  createValidationEffect: <T>(
    validator: (input: T) => Effect.Effect<ValidationResult, Error, never>,
    config: ValidationConfig
  ) => (input: T): Effect.Effect<boolean, Error, never> =>
    Effect.gen(function*() {
      const result = yield* validator(input);
      
      if (config.strict && !result.valid) {
        return yield* Effect.fail(new Error(`Validation failed: ${result.errors.map(e => e.message).join(", ")}`));
      }
      
      return validationUtils.resultToBoolean(result);
    }),
} as const;

/**
 * Enhanced validation service class
 */
export class ValidationService {
  /**
   * Validate AsyncAPI specification with boolean return
   */
  static validateSpec(spec: unknown, config: ValidationConfig = { strict: false, warnings: true, bailOnFirstError: false, maxErrors: 10 }): Effect.Effect<boolean, Error, never> {
    const effect = validationUtils.createValidationEffect(validateAsyncAPISpec, config);
    return effect(spec);
  }

  /**
   * Validate AsyncAPI message with boolean return
   */
  static validateMessage(message: unknown, config: ValidationConfig = { strict: false, warnings: true, bailOnFirstError: false, maxErrors: 10 }): Effect.Effect<boolean, Error, never> {
    const effect = validationUtils.createValidationEffect(validateAsyncAPIMessage, config);
    return effect(message);
  }

  /**
   * Validate AsyncAPI channel with boolean return
   */
  static validateChannel(channel: unknown, config: ValidationConfig = { strict: false, warnings: true, bailOnFirstError: false, maxErrors: 10 }): Effect.Effect<boolean, Error, never> {
    const effect = validationUtils.createValidationEffect(validateAsyncAPIChannel, config);
    return effect(channel);
  }

  /**
   * Get detailed validation results
   */
  static validateDetailed<T>(
    input: T,
    validator: (input: T) => Effect.Effect<ValidationResult, Error, never>
  ): Effect.Effect<ValidationResult, Error, never> {
    return validator(input);
  }

  /**
   * Batch validation with error collection
   */
  static batchValidate<T>(
    inputs: Array<T>,
    validator: (input: T) => Effect.Effect<ValidationResult, Error, never>,
    config: ValidationConfig = { strict: false, warnings: true, bailOnFirstError: false, maxErrors: 10 }
  ): Effect.Effect<Array<{ input: T, result: ValidationResult }>, Error, never> {
    return Effect.gen(function*() {
      const results: Array<{ input: T, result: ValidationResult }> = [];
      let errorCount = 0;

      for (const input of inputs) {
        if (config.bailOnFirstError && errorCount >= config.maxErrors) {
          break;
        }

        const result = yield* Effect.catchAll(
          validator(input),
          (error) => Effect.succeed({
            valid: false,
            errors: [{
              path: "root",
              message: `Validation failed: ${String(error)}`,
              severity: "error" as const
            }],
            warnings: [],
            metadata: {
              version: "unknown",
              componentCounts: { channels: 0, messages: 0, operations: 0, servers: 0 },
            },
          })
        );
        results.push({ input, result });

        if (!result.valid) {
          errorCount += result.errors.length;
        }
      }

      return results;
    });
  }

  /**
   * Validate with context
   */
  static validateWithContext<T>(
    input: T,
    context: string,
    validator: (input: T) => Effect.Effect<ValidationResult, Error, never>
  ): Effect.Effect<ValidationResult, Error, never> {
    return Effect.gen(function*() {
      const result = yield* validator(input);
      
      // Add context to error messages
      const contextResult = {
        ...result,
        errors: result.errors.map(error => ({
          ...error,
          message: `[${context}] ${error.message}`
        })),
        warnings: result.warnings.map(warning => ({
          ...warning,
          message: `[${context}] ${warning.message}`
        }))
      };

      return contextResult;
    });
  }

  /**
   * Validate with fallback
   */
  static validateWithFallback<T>(
    input: T,
    fallback: ValidationResult,
    validator: (input: T) => Effect.Effect<ValidationResult, Error, never>
  ): Effect.Effect<ValidationResult, Error, never> {
    return Effect.gen(function*() {
      const result = yield* Effect.either(validator(input));
      
      if (result._tag === "Right") {
        return result.right;
      } else {
        return fallback;
      }
    });
  }

  /**
   * Validate with retry
   */
  static validateWithRetry<T>(
    input: T,
    attempts: number,
    validator: (input: T) => Effect.Effect<ValidationResult, Error, never>
  ): Effect.Effect<ValidationResult, Error, never> {
    return Effect.retry(
      validator(input).pipe(
        Effect.catchAll((error) => Effect.fail(error))
      ),
      { times: attempts - 1 }
    ).pipe(
      Effect.catchAll((error) => Effect.fail(error))
    );
  }

  /**
   * Get validation statistics
   */
  static getStatistics(results: Array<ValidationResult>): {
    total: number;
    valid: number;
    invalid: number;
    errorCount: number;
    warningCount: number;
    errorsByPath: Record<string, number>;
    warningsByPath: Record<string, number>;
    errorsBySeverity: Record<string, number>;
  } {
    const stats = {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      errorCount: results.reduce((sum, r) => sum + r.errors.length, 0),
      warningCount: results.reduce((sum, r) => sum + r.warnings.length, 0),
      errorsByPath: {} as Record<string, number>,
      warningsByPath: {} as Record<string, number>,
      errorsBySeverity: {} as Record<string, number>,
    };

    // Calculate errors by path and severity
    results.forEach(result => {
      result.errors.forEach(error => {
        const path = error.path || "unknown";
        stats.errorsByPath[path] = (stats.errorsByPath[path] || 0) + 1;
        stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
      });

      result.warnings.forEach(warning => {
        const path = warning.path || "unknown";
        stats.warningsByPath[path] = (stats.warningsByPath[path] || 0) + 1;
      });
    });

    return stats;
  }
}