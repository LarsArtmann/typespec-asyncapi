/**
 * 🏗️ GENERIC VALIDATION PIPELINE
 * 
 * Sophisticated but easy-to-use validation system
 * Uses proper generics for compile-time type safety
 * Eliminates duplicate validation code throughout system
 */

import { Effect, Schema } from "effect";
import type { AsyncAPIDocument } from "../types/domain/asyncapi-domain-types.js";
import type { UnifiedAsyncAPIConfiguration } from "./discriminated-config.js";

/**
 * === GENERIC VALIDATION RESULT ===
 * Type-safe validation result with discriminated union
 * Eliminates optional property invalid states
 */
export type ValidationResult<T> = 
  | { readonly _tag: "Success"; readonly data: T }
  | { 
      readonly _tag: "Failure"; 
      readonly errors: readonly ValidationError[];
      readonly severity: "error" | "warning" | "info";
    };

/**
 * Type-safe validation error with structured data
 */
export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly path: readonly string[];
  readonly severity: "error" | "warning" | "info";
  readonly context?: Record<string, unknown>;
}

/**
 * === GENERIC VALIDATION INTERFACE ===
 * Type-safe validation with proper generics usage
 */
export interface Validator<TInput, TOutput = TInput> {
  readonly name: string;
  readonly validate: (input: TInput) => Effect.Effect<TOutput, ValidationError[]>;
}

/**
 * === GENERIC PIPELINE COMPOSER ===
 * Sophisticated validation pipeline with proper type inference
 */
export class ValidationPipeline<TInput, TOutput> {
  private readonly validators: Validator<any, any>[];

  constructor() {
    this.validators = [];
  }

  /**
   * Add typed validator to pipeline
   * Maintains type safety throughout composition
   */
  add<T, R>(validator: Validator<T, R>): this {
    this.validators.push(validator as Validator<any, any>);
    return this;
  }

  /**
   * Execute validation pipeline with effect composition
   * Returns properly typed validation result
   */
  execute(input: TInput): Effect.Effect<TOutput, ValidationError[]> {
    return Effect.gen(function*() {
      let currentValue = input;
      
      for (const validator of this.validators) {
        const result = yield* validator.validate(currentValue);
        currentValue = result; // Type inference maintained
      }
      
      return currentValue as TOutput;
    });
  }
}

/**
 * === DOMAIN-SPECIFIC VALIDATORS ===
 * Strongly typed validators for AsyncAPI domain
 */

// Generic schema validator
export function createSchemaValidator<T>(
  schema: Schema.Schema<T>,
  name: string
): Validator<T, T> {
  return {
    name,
    validate: (input: T) => 
      Effect.tryPromise({
        try: () => Schema.decode(schema)(input).pipe(Effect.runPromise),
        catch: (error) => [{
          code: "schema-validation-failed",
          message: `Schema validation failed for ${name}`,
          path: [],
          severity: "error" as const,
          context: { error, input }
        }] as ValidationError[]
      })
  };
}

// AsyncAPI document validator
export const AsyncAPIValidator: Validator<AsyncAPIDocument, AsyncAPIDocument> = {
  name: "AsyncAPI document validation",
  validate: (doc: AsyncAPIDocument) => 
    Effect.gen(function*() {
      // Validate required fields
      if (!doc.asyncapi) {
        return yield* Effect.fail([{
          code: "missing-asyncapi-version",
          message: "AsyncAPI version is required",
          path: ["asyncapi"],
          severity: "error" as const
        }]);
      }

      if (!doc.info) {
        return yield* Effect.fail([{
          code: "missing-info",
          message: "Info section is required",
          path: ["info"],
          severity: "error" as const
        }]);
      }

      if (!doc.info.title) {
        return yield* Effect.fail([{
          code: "missing-title",
          message: "API title is required",
          path: ["info", "title"],
          severity: "error" as const
        }]);
      }

      if (!doc.info.version) {
        return yield* Effect.fail([{
          code: "missing-version",
          message: "API version is required",
          path: ["info", "version"],
          severity: "error" as const
        }]);
      }

      // Validate channels structure
      if (doc.channels && Object.keys(doc.channels).length === 0) {
        return yield* Effect.fail([{
          code: "empty-channels",
          message: "At least one channel is required",
          path: ["channels"],
          severity: "warning" as const
        }]);
      }

      return doc;
    })
};

// Configuration validator
export const ConfigurationValidator: Validator<UnifiedAsyncAPIConfiguration, UnifiedAsyncAPIConfiguration> = {
  name: "Configuration validation",
  validate: (config: UnifiedAsyncAPIConfiguration) => 
    Effect.gen(function*() {
      // Validate output configuration
      if (!config.output) {
        return yield* Effect.fail([{
          code: "missing-output-config",
          message: "Output configuration is required",
          path: ["output"],
          severity: "error" as const
        }]);
      }

      // Validate metadata
      if (!config.metadata?.title) {
        return yield* Effect.fail([{
          code: "missing-title",
          message: "API title is required in metadata",
          path: ["metadata", "title"],
          severity: "error" as const
        }]);
      }

      if (!config.metadata?.version) {
        return yield* Effect.fail([{
          code: "missing-version",
          message: "API version is required in metadata",
          path: ["metadata", "version"],
          severity: "error" as const
        }]);
      }

      return config;
    })
};

/**
 * === PIPELINE FACTORY FUNCTIONS ===
 * Easy-to-use pipeline creators with proper typing
 */
export function createDocumentValidationPipeline(): ValidationPipeline<AsyncAPIDocument, AsyncAPIDocument> {
  return new ValidationPipeline<AsyncAPIDocument, AsyncAPIDocument>()
    .add(AsyncAPIValidator);
}

export function createConfigurationValidationPipeline(): ValidationPipeline<UnifiedAsyncAPIConfiguration, UnifiedAsyncAPIConfiguration> {
  return new ValidationPipeline<UnifiedAsyncAPIConfiguration, UnifiedAsyncAPIConfiguration>()
    .add(ConfigurationValidator);
}

/**
 * === HELPER FUNCTIONS ===
 * Utility functions for validation result handling
 */
export function success<T>(data: T): ValidationResult<T> {
  return { _tag: "Success", data };
}

export function failure(errors: ValidationError[]): ValidationResult<never> {
  const severity = errors.some(e => e.severity === "error") ? "error" :
                  errors.some(e => e.severity === "warning") ? "warning" : "info";
  
  return { _tag: "Failure", errors, severity };
}

/**
 * Execute validation with proper error handling
 * Returns typed validation result
 */
export async function validateDocument(document: AsyncAPIDocument): Promise<ValidationResult<AsyncAPIDocument>> {
  const pipeline = createDocumentValidationPipeline();
  
  const result = await pipeline.execute(document).pipe(
    Effect.runPromise
  );
  
  return result.pipe(
    Effect.match({
      onSuccess: success,
      onFailure: failure
    })
  );
}

export async function validateConfiguration(config: UnifiedAsyncAPIConfiguration): Promise<ValidationResult<UnifiedAsyncAPIConfiguration>> {
  const pipeline = createConfigurationValidationPipeline();
  
  const result = await pipeline.execute(config).pipe(
    Effect.runPromise
  );
  
  return result.pipe(
    Effect.match({
      onSuccess: success,
      onFailure: failure
    })
  );
}