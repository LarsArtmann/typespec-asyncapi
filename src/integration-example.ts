/**
 * INTEGRATION EXAMPLE: Using Effect.TS Schema with TypeSpec Emitter
 * 
 * This file demonstrates how to integrate Effect.TS validation with TypeSpec's
 * emitter system while maintaining full compatibility and error handling.
 */

import { Effect, Console } from "effect";
import {
  AsyncAPIEmitterOptionsSchema,
  validateAsyncAPIEmitterOptions,
  createAsyncAPIEmitterOptions
} from "./options.js";
import type { AsyncAPIEmitterOptions } from "./types/options.js";

// TYPESPEC EMITTER INTEGRATION PATTERNS

/**
 * TypeSpec emitter function with Effect.TS validation
 * Shows how to integrate Effect validation in a TypeSpec emitter
 */
export async function onEmit(_context: any, options: unknown): Promise<void> {
  // EFFECT.TS VALIDATION PATTERN - Comprehensive error handling
  const validationResult = await Effect.runPromise(
    Effect.gen(function* () {
      // Step 1: Validate options using Effect.TS (includes type conversion)
      const validatedOptions = yield* validateAsyncAPIEmitterOptions(options);
      
      // Step 2: Apply defaults if needed
      const optionsWithDefaults = yield* createAsyncAPIEmitterOptions(validatedOptions);
      
      // Step 3: Log validation success
      yield* Console.log("AsyncAPI Emitter Options validated successfully");
      
      return optionsWithDefaults;
    }).pipe(
      Effect.mapError(error => new Error(`Invalid emitter options: ${error}`))
    )
  );

  // Use validated options for emitter logic
  await generateAsyncAPISpec(validationResult);
}

/**
 * Alternative integration using Promise-based validation
 * For teams preferring Promise-based APIs over Effect
 */
export async function onEmitWithPromiseAPI(_context: any, options: unknown): Promise<void> {
  try {
    // Convert Effect to Promise for easier integration
    const validatedOptions = await Effect.runPromise(
      validateAsyncAPIEmitterOptions(options)
    );
    
    console.log("Options validated:", validatedOptions);
    await generateAsyncAPISpec(validatedOptions);
    
  } catch (error) {
    throw new Error(`AsyncAPI Emitter validation failed: ${error}`);
  }
}

/**
 * Configuration validation utility for TypeSpec plugin registration
 * Used when registering the emitter with TypeSpec compiler
 */
export function validateEmitterConfiguration(config: unknown): AsyncAPIEmitterOptions {
  // Synchronous validation for plugin registration
  return Effect.runSync(
    Effect.gen(function* () {
      const validated = yield* validateAsyncAPIEmitterOptions(config);
      const withDefaults = yield* createAsyncAPIEmitterOptions(validated);
      return withDefaults;
    }).pipe(
      Effect.catchAll(error =>
        Effect.fail(new Error(`Invalid AsyncAPI emitter configuration: ${error}`))
      )
    )
  );
}

// EXAMPLE USAGE PATTERNS

/**
 * Example: Safe option parsing with comprehensive error handling
 */
export const parseOptionsExample = async () => {
  const userInput = {
    "output-file": "my-api",
    "file-type": "json" as const,
    "validate-spec": true,
    "protocol-bindings": ["kafka", "websocket"] as const,
    "versioning": {
      "separate-files": true,
      "file-naming": "suffix" as const
    }
  };

  return await Effect.runPromise(
    Effect.gen(function* () {
      // Parse and validate user input
      const parsed = yield* validateAsyncAPIEmitterOptions(userInput);
      
      // Apply any missing defaults
      const complete = yield* createAsyncAPIEmitterOptions(parsed);
      
      // Log success
      yield* Console.log("Configuration loaded successfully", complete);
      
      return complete;
    }).pipe(
      // Comprehensive error handling
      Effect.catchAll(error =>
        Effect.gen(function* () {
          yield* Console.error("Configuration validation failed:", error);
          
          // Return safe defaults on error
          return yield* createAsyncAPIEmitterOptions({});
        })
      )
    )
  );
};

/**
 * Example: Batch validation for multiple configurations
 */
export const validateMultipleConfigs = async (configs: unknown[]) => {
  return await Effect.runPromise(
    Effect.forEach(configs, config =>
      Effect.gen(function* () {
        const validated = yield* validateAsyncAPIEmitterOptions(config);
        return { config, validated, valid: true };
      }).pipe(
        Effect.catchAll(error =>
          Effect.succeed({ config, error: String(error), valid: false })
        )
      ),
      { concurrency: 5 } // Process up to 5 configs in parallel
    )
  );
};

// TYPESPEC COMPATIBILITY HELPERS

/**
 * Convert Effect.TS validation to TypeSpec-compatible format
 * Maintains the JSONSchemaType interface that TypeSpec expects
 */
export function getTypeSpecCompatibleSchema() {
  // The AsyncAPIEmitterOptionsSchema is already compatible with TypeSpec
  // This function shows how to access it programmatically
  return AsyncAPIEmitterOptionsSchema;
}

/**
 * Validate options in TypeSpec-compatible way
 * Returns boolean result for TypeSpec integration
 */
export function isValidEmitterOptions(options: unknown): options is AsyncAPIEmitterOptions {
  try {
    Effect.runSync(validateAsyncAPIEmitterOptions(options));
    return true;
  } catch {
    return false;
  }
}

// MOCK IMPLEMENTATION FOR EXAMPLE

async function generateAsyncAPISpec(options: AsyncAPIEmitterOptions): Promise<void> {
  console.log("Generating AsyncAPI spec with options:", options);
  
  // Mock implementation - replace with actual emitter logic
  const outputFile = options["output-file"] || "asyncapi";
  const fileType = options["file-type"] || "yaml";
  
  console.log(`Would generate: ${outputFile}.${fileType}`);
  
  if (options["validate-spec"]) {
    console.log("Validating generated specification...");
  }
  
  if (options["protocol-bindings"]?.length) {
    console.log("Including protocol bindings:", options["protocol-bindings"]);
  }
}

// ADVANCED USAGE EXAMPLES

/**
 * Example: Custom validation with additional business rules
 */
export const validateWithBusinessRules = (input: unknown) =>
  Effect.gen(function* () {
    // Step 1: Standard Effect.TS schema validation
    const options = yield* validateAsyncAPIEmitterOptions(input);
    
    // Step 2: Custom business rule validation
    if (options["file-type"] === "json" && options["include-source-info"]) {
      yield* Effect.fail(new Error("Source info not supported in JSON format"));
    }
    
    if (options["protocol-bindings"]?.includes("kafka") && !options["security-schemes"]) {
      yield* Effect.fail(new Error("Kafka protocol requires security schemes"));
    }
    
    // Step 3: Return validated and business-rule-compliant options
    return options;
  });

/**
 * Example: Options transformation pipeline
 */
export const processOptionsWithTransformation = (input: unknown) =>
  Effect.gen(function* () {
    // Parse and validate
    const validated = yield* validateAsyncAPIEmitterOptions(input);
    
    // Transform based on environment
    const environment = process.env["NODE_ENV"] || "development";
    const transformed: Partial<AsyncAPIEmitterOptions> = {};
    
    // Copy existing properties (excluding undefined values)
    Object.entries(validated).forEach(([key, value]) => {
      if (value !== undefined) {
        (transformed as any)[key] = value;
      }
    });
    
    // Apply environment-specific transformations
    if (environment === "production") {
      transformed["validate-spec"] = true;
    }
    if (environment === "development") {
      transformed["include-source-info"] = true;
    }
    
    // Re-validate transformed options
    const finalValidated = yield* createAsyncAPIEmitterOptions(transformed);
    
    yield* Console.log(`Options processed for ${environment} environment`);
    
    return finalValidated;
  });

/**
 * Example: Resource management with validated options
 */
export const processWithManagedResources = (options: unknown) =>
  Effect.gen(function* () {
    // Validate options first
    const validatedOptions = yield* validateAsyncAPIEmitterOptions(options);
    
    // Use options in resource-managed operation
    return yield* Effect.acquireUseRelease(
      // Acquire: Setup resources based on validated options
      Effect.gen(function* () {
        yield* Console.log("Setting up resources with validated options");
        return { connection: "mock-connection", options: validatedOptions };
      }),
      // Use: Process with guaranteed valid options
      ({ connection, options }) =>
        Effect.gen(function* () {
          yield* Console.log("Processing with connection:", connection);
          yield* Console.log("Using validated options:", options);
          return `Processed with ${options["file-type"]} format`;
        }),
      // Release: Cleanup resources
      ({ connection }) =>
        Effect.gen(function* () {
          yield* Console.log("Cleaning up connection:", connection);
        })
    );
  });