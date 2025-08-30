/**
 * AsyncAPI Validation Module
 * 
 * FINALLY using the asyncapi-validator library we installed!
 * This module provides proper validation for generated AsyncAPI 3.0 specifications.
 */

import { fromFile, fromString } from "asyncapi-validator";
import { Effect } from "effect";
import type { ValidationError } from "asyncapi-validator";

/**
 * Validation result type with detailed error information
 */
export type AsyncAPIValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
};

/**
 * Validate an AsyncAPI document from a file path
 * Uses the OFFICIAL asyncapi-validator library
 */
export async function validateAsyncAPIFile(filePath: string): Promise<AsyncAPIValidationResult> {
  try {
    console.log(`🔍 Validating AsyncAPI file: ${filePath}`);
    
    // Use the ACTUAL asyncapi-validator library!
    const result = await fromFile(filePath, {
      msgIdentifier: "name", // Use message name as identifier
      path: {
        v2_0_0: "asyncapi", // Path to AsyncAPI version field
        v2_1_0: "asyncapi",
        v2_2_0: "asyncapi",
        v2_3_0: "asyncapi",
        v2_4_0: "asyncapi",
        v2_5_0: "asyncapi",
        v2_6_0: "asyncapi",
        v3_0_0: "asyncapi", // AsyncAPI 3.0 support
      }
    });
    
    if (result.valid) {
      console.log(`✅ AsyncAPI document is VALID according to official validator!`);
      return {
        valid: true,
        errors: [],
        warnings: []
      };
    } else {
      console.error(`❌ AsyncAPI document validation FAILED:`);
      result.errors.forEach(err => {
        console.error(`  - ${err.title}: ${err.detail}`);
        console.error(`    Location: ${err.location}`);
      });
      
      return {
        valid: false,
        errors: result.errors,
        warnings: []
      };
    }
  } catch (error) {
    console.error(`💥 Validation error: ${error}`);
    throw error;
  }
}

/**
 * Validate an AsyncAPI document from a string
 * Uses the OFFICIAL asyncapi-validator library
 */
export async function validateAsyncAPIString(content: string): Promise<AsyncAPIValidationResult> {
  try {
    console.log(`🔍 Validating AsyncAPI content (${content.length} bytes)`);
    
    // Use the ACTUAL asyncapi-validator library!
    const result = await fromString(content, {
      msgIdentifier: "name",
      path: {
        v3_0_0: "asyncapi", // Focus on AsyncAPI 3.0
      }
    });
    
    if (result.valid) {
      console.log(`✅ AsyncAPI content is VALID!`);
      return {
        valid: true,
        errors: [],
        warnings: []
      };
    } else {
      console.error(`❌ AsyncAPI content validation FAILED:`);
      result.errors.forEach(err => {
        console.error(`  - ${err.title}: ${err.detail}`);
      });
      
      return {
        valid: false,
        errors: result.errors,
        warnings: []
      };
    }
  } catch (error) {
    console.error(`💥 Validation error: ${error}`);
    throw error;
  }
}

/**
 * Effect.TS wrapper for AsyncAPI validation
 * Integrates with our Effect-based architecture
 */
export const validateAsyncAPIEffect = (content: string): Effect.Effect<AsyncAPIValidationResult, Error> =>
  Effect.tryPromise({
    try: () => validateAsyncAPIString(content),
    catch: (error) => new Error(`AsyncAPI validation failed: ${error}`)
  });

/**
 * Validate AsyncAPI document with detailed diagnostics
 */
export async function validateWithDiagnostics(content: string): Promise<{
  valid: boolean;
  diagnostics: Array<{
    severity: "error" | "warning" | "info";
    message: string;
    path?: string;
  }>;
}> {
  const result = await validateAsyncAPIString(content);
  
  const diagnostics = result.errors.map(err => ({
    severity: "error" as const,
    message: `${err.title}: ${err.detail}`,
    path: err.location
  }));
  
  result.warnings.forEach(warn => {
    diagnostics.push({
      severity: "warning" as const,
      message: warn
    });
  });
  
  return {
    valid: result.valid,
    diagnostics
  };
}

/**
 * Quick validation check - returns boolean only
 */
export async function isValidAsyncAPI(content: string): Promise<boolean> {
  try {
    const result = await validateAsyncAPIString(content);
    return result.valid;
  } catch {
    return false;
  }
}

// Export validation error type for external use
export type { ValidationError } from "asyncapi-validator";