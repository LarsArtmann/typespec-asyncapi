/**
 * USAGE EXAMPLES FOR CENTRALIZED ERROR HANDLING SYSTEM
 * 
 * Demonstrates how to use the new Error-based classes with
 * What/Reassure/Why/Fix/Escape patterns in practical scenarios
 */

import { Effect } from "effect";
import {
  AsyncAPIValidationError,
  FileSystemError,
  SchemaGenerationError,
  EmitterInitializationError,
  MemoryUsageError,
  isAsyncAPIError,
  ErrorHandlingUtils
} from "./index.js";
import { withErrorHandling } from "./integration.js";

/**
 * Example 1: Validation Error Usage
 */
export function validateAsyncAPIOptions(options: Record<string, unknown>): void {
  const fileType = options["file-type"];
  if (fileType && !['yaml', 'json'].includes(fileType as string)) {
    throw new AsyncAPIValidationError({
      field: "file-type",
      value: fileType,
      expected: "'yaml' or 'json'",
      operation: "validateAsyncAPIOptions",
      recoveryValue: "yaml"
    });
  }
}

/**
 * Example 2: File System Error with Fallback
 */
export function writeAsyncAPISpec(filePath: string, _content: string): void {
  try {
    // Simulate file write that fails
    throw new Error("ENOENT: no such file or directory");
  } catch (error) {
    if (error instanceof Error) {
      throw new FileSystemError({
        path: filePath,
        operation: "writeAsyncAPISpec",
        originalError: error,
        fallbackPath: "/tmp/asyncapi-fallback.yaml"
      });
    }
    throw error;
  }
}

/**
 * Example 3: Schema Generation Error
 */
export function generateTypeSchema(typeName: string): Record<string, unknown> {
  if (typeName.includes("Circular")) {
    throw new SchemaGenerationError({
      typeName,
      issue: "Circular reference detected in type definition",
      operation: "generateTypeSchema",
      fallbackSchema: {
        type: "object",
        description: `Schema for ${typeName} (circular reference resolved)`,
        "x-circular-ref": true
      }
    });
  }
  
  return { type: "object", properties: {} };
}

/**
 * Example 4: Emitter Error with Fallback Mode
 */
export function initializeEmitter(config: Record<string, unknown>): void {
  if (!config['version']) {
    throw new EmitterInitializationError({
      component: "AsyncAPI Emitter",
      issue: "Missing required 'version' configuration",
      operation: "initializeEmitter",
      fallbackMode: "default-3.0.0"
    });
  }
}

/**
 * Example 5: Memory Usage Error with Optimization
 */
export function processLargeSchema(schemaSize: number): void {
  const memoryThreshold = 512; // 512MB
  const currentMemory = schemaSize * 2; // Simulate memory usage
  
  if (currentMemory > memoryThreshold) {
    throw new MemoryUsageError({
      operation: "processLargeSchema",
      currentUsageMB: currentMemory,
      thresholdMB: memoryThreshold,
      canOptimize: true
    });
  }
}

/**
 * Example 6: Using Error Handling with Effect.TS
 */
export function processAsyncAPIWithErrorHandling(
  options: Record<string, unknown>
): Effect.Effect<string, never> {
  const operation = () => Effect.gen(function* () {
    // Validate options (may throw AsyncAPIValidationError)
    validateAsyncAPIOptions(options);
    
    // Generate schema (may throw SchemaGenerationError)
    const schema = generateTypeSchema("UserType");
    
    // Write output (may throw FileSystemError)
    writeAsyncAPISpec("/output/api.yaml", JSON.stringify(schema));
    
    return "AsyncAPI specification generated successfully";
  });
  
  return withErrorHandling(
    operation,
    "processAsyncAPIWithErrorHandling"
  ).pipe(
    Effect.map(result => {
      if (result.success) {
        return (result.result as string) || "Operation completed with recovery";
      }
      
      if (result.error) {
        return `Operation failed: ${result.error.what}`;
      }
      
      return "Operation failed with unknown error";
    })
  );
}

/**
 * Example 7: Error Type Checking and Handling
 */
export function handleError(error: unknown): string {
  if (isAsyncAPIError(error)) {
    // Use specific AsyncAPI error handling
    const context = error.getErrorContext();
    
    if (error.canRecover) {
      return `Recoverable error: ${error.what}. Escape: ${error.escape}`;
    }
    
    return `Fatal error [${context.errorId}]: ${error.what}`;
  }
  
  if (error instanceof Error) {
    // Convert regular Error to error context
    const context = ErrorHandlingUtils.toErrorContext(error, "handleError");
    return `Unhandled error: ${context.what}`;
  }
  
  return `Unknown error: ${String(error)}`;
}

/**
 * Example 8: Error Recovery Demonstration
 */
export function demonstrateErrorRecovery(): Effect.Effect<string, never> {
  return Effect.gen(function* () {
    try {
      // This will throw a recoverable validation error
      validateAsyncAPIOptions({ "file-type": "xml" });
      return "No error occurred";
    } catch (error) {
      if (isAsyncAPIError(error) && error.canRecover) {
        // Demonstrate recovery using the error's recovery information
        const recoveryData = error.additionalData?.['recoveryValue'];
        return `Recovered with value: ${JSON.stringify(recoveryData)}`;
      }
      
      throw error; // Re-throw non-recoverable errors
    }
  }).pipe(
    Effect.catchAll((error: unknown) => 
      Effect.succeed(`Unrecoverable error: ${handleError(error)}`)
    )
  );
}

/**
 * Example 9: Chaining Error Contexts
 */
export function chainedErrorExample(): void {
  try {
    // First level error
    validateAsyncAPIOptions({ "file-type": "invalid" });
  } catch (validationError) {
    try {
      // Second level error that references the first
      writeAsyncAPISpec("/invalid/path.yaml", "content");
    } catch (fileError) {
      if (fileError instanceof FileSystemError && isAsyncAPIError(validationError)) {
        // Create a new error that chains the previous errors
        throw new EmitterInitializationError({
          component: "File Writer",
          issue: "Failed to write output due to validation and file system errors",
          operation: "chainedErrorExample"
        });
      }
      throw fileError;
    }
  }
}

/**
 * Example 10: Using Error Factories
 */
export function useErrorFactories(typeName: string): void {
  // Using factory methods for consistent error creation
  if (typeName.startsWith("Invalid")) {
    const validationError = new AsyncAPIValidationError({
      field: "typeName",
      value: typeName,
      expected: "valid TypeSpec type name",
      operation: "useErrorFactories",
      recoveryValue: "DefaultType"
    });
    
    console.log("Error ID:", validationError.errorId);
    console.log("User Message:", validationError.getUserMessage());
    console.log("Technical Summary:", validationError.getTechnicalSummary());
    console.log("Can Recover:", validationError.canRecover);
    console.log("Recovery Strategy:", validationError.recoveryStrategy);
    
    throw validationError;
  }
}
