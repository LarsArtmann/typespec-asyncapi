/**
 * Validation Service
 * 
 * Provides comprehensive validation for AsyncAPI documents and components
 */

import { Effect } from "effect";
import { validateAsyncAPISpec, validateAsyncAPIMessage, validateAsyncAPIChannel } from "./asyncapi-validator.js";

/**
 * Validation result interface
 */
export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validation Service class
 */
export class ValidationService {
  /**
   * Generic validation method to eliminate duplication
   */
  private static validateWith<T>(
    validator: (input: unknown) => Effect.Effect<boolean, Error, never>,
    errorMessage: string,
    input: T
  ): Effect.Effect<ValidationResult, Error, never> {
    return Effect.gen(function*() {
      const isValid = yield* validator(input);
      
      if (!isValid) {
        return {
          isValid: false,
          errors: [errorMessage],
          warnings: []
        };
      }
      
      return {
        isValid: true,
        errors: [],
        warnings: []
      };
    });
  }

  /**
   * Validate complete AsyncAPI specification
   */
  static validateSpec(spec: unknown): Effect.Effect<ValidationResult, Error, never> {
    return this.validateWith(
      validateAsyncAPISpec,
      "Invalid AsyncAPI specification structure",
      spec
    );
  }
  
  /**
   * Validate AsyncAPI message
   */
  static validateMessage(message: unknown): Effect.Effect<ValidationResult, Error, never> {
    return this.validateWith(
      validateAsyncAPIMessage,
      "Invalid message structure",
      message
    );
  }
  
  /**
   * Validate AsyncAPI channel
   */
  static validateChannel(channel: unknown): Effect.Effect<ValidationResult, Error, never> {
    return this.validateWith(
      validateAsyncAPIChannel,
      "Invalid channel structure",
      channel
    );
  }
}