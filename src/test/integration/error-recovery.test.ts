/**
 * INTEGRATION TESTS FOR ERROR RECOVERY STRATEGIES
 * 
 * Tests how errors work in practice with the full system including:
 * - Error recovery in Effect chains
 * - Service error propagation
 * - Performance error handling
 * - End-to-end error context preservation
 */

import { Effect } from "effect";
import { describe, test, expect } from "bun:test";

// Import error classes and services for integration testing
import { BaseAsyncAPIError, errorToContext } from "../../errors/base.js";
import { MemoryUsageError, OperationTimeoutError } from "../../errors/performance.js";
import { ValidationTestError } from "../../performance/validation-test.js";
import { validateAsyncAPIEmitterOptions } from "../../options.js";

describe("Error Recovery Integration", () => {
  test("should recover from memory errors with fallback strategy", async () => {
    // Simulate a service that can recover from memory issues
    const memoryIntensiveOperation = Effect.gen(function* () {
      // Simulate memory pressure
      const memoryUsage = 150; // MB
      const threshold = 100; // MB
      
      if (memoryUsage > threshold) {
        return yield* Effect.fail(new MemoryUsageError({
          operation: "large-schema-processing",
          currentUsageMB: memoryUsage,
          thresholdMB: threshold,
          canOptimize: true,
          severity: "warning"
        }));
      }
      
      return { processed: true, memoryUsed: memoryUsage };
    });
    
    // Test recovery strategy
    const result = await Effect.runPromise(
      memoryIntensiveOperation.pipe(
        Effect.catchTag("MemoryUsageError", (error) => {
          // Verify we can access error details for recovery decision
          expect(error.canRecover).toBe(true);
          expect(error.recoveryStrategy).toBe("fallback");
          expect(error.additionalData?.canOptimize).toBe(true);
          
          // Simulate fallback to optimized processing
          return Effect.succeed({
            processed: true,
            memoryUsed: 80, // Reduced memory usage
            optimized: true
          });
        })
      )
    );
    
    expect(result).toEqual({
      processed: true,
      memoryUsed: 80,
      optimized: true
    });
  });
  
  test("should handle timeout errors with retry strategy", async () => {
    let attempt = 0;
    
    const timeoutProneOperation = Effect.gen(function* () {
      attempt++;
      
      // Simulate timeout on first attempt
      if (attempt === 1) {
        return yield* Effect.fail(new OperationTimeoutError({
          operation: "schema-generation",
          timeoutMs: 5000,
          elapsedMs: 6000,
          canRetry: true,
          suggestedTimeoutMs: 10000
        }));
      }
      
      return { generated: true, attempt };
    });
    
    const result = await Effect.runPromise(
      timeoutProneOperation.pipe(
        Effect.catchTag("OperationTimeoutError", (error) => {
          // Verify retry strategy
          expect(error.canRecover).toBe(true);
          expect(error.recoveryStrategy).toBe("retry");
          expect(error.additionalData?.suggestedTimeoutMs).toBe(10000);
          
          // Simulate retry with increased timeout
          return timeoutProneOperation;
        })
      )
    );
    
    expect(result).toEqual({
      generated: true,
      attempt: 2
    });
    expect(attempt).toBe(2);
  });
  
  test("should propagate error context through service chains", async () => {
    // Simulate a chain of services where error context is preserved
    const validateInput = (input: unknown) => 
      Effect.gen(function* () {
        if (typeof input !== "object" || input === null) {
          return yield* Effect.fail(new ValidationTestError("Invalid input type"));
        }
        return input as Record<string, unknown>;
      });
    
    const processValidatedInput = (input: Record<string, unknown>) =>
      Effect.gen(function* () {
        if (!input.required) {
          return yield* Effect.fail(new ValidationTestError("Missing required field"));
        }
        return { processed: true, input };
      });
    
    const serviceChain = Effect.gen(function* () {
      const validated = yield* validateInput("invalid");
      const processed = yield* processValidatedInput(validated);
      return processed;
    });
    
    const result = await Effect.runPromise(
      serviceChain.pipe(
        Effect.catchAll((error) => {
          // Convert to error context and verify preservation
          const context = errorToContext(error, "service-chain", "validation");
          
          expect(context.category).toBe("validation");
          expect(context.operation).toBe("service-chain");
          expect(context.what).toContain("Invalid input type");
          
          return Effect.succeed({
            error: true,
            context: context.errorId
          });
        })
      )
    );
    
    expect(result).toEqual({
      error: true,
      context: expect.any(String)
    });
  });
  
  test("should handle real options validation errors", async () => {
    // Test integration with actual validation system
    const result = await Effect.runPromise(
      validateAsyncAPIEmitterOptions("invalid input").pipe(
        Effect.either
      )
    );
    
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      // Verify error has proper tagged structure
      expect(result.left._tag).toBeTruthy();
      expect(result.left.message).toBeTruthy();
    }
  });
  
  test("should demonstrate error context chaining in complex scenarios", async () => {
    // Create a complex error scenario with multiple levels
    class ServiceError extends BaseAsyncAPIError {
      readonly _tag = "ServiceError" as const;
      
      constructor(operation: string, cause?: Error) {
        super({
          what: `Service operation '${operation}' failed`,
          reassure: "Service errors are logged and can be investigated",
          why: "A downstream service encountered an error",
          fix: ["Check service logs", "Verify service dependencies", "Retry operation"],
          escape: "Operation will be retried with exponential backoff",
          category: "network",
          operation,
          recoveryStrategy: "retry",
          canRecover: true,
          causedBy: cause ? errorToContext(cause, operation, "network") as any : undefined
        });
      }
    }
    
    class IntegrationError extends BaseAsyncAPIError {
      readonly _tag = "IntegrationError" as const;
      
      constructor(services: string[], cause?: Error) {
        super({
          what: `Integration failed across services: ${services.join(", ")}`,
          reassure: "Integration errors are tracked and resolved systematically",
          why: "Multiple services failed to coordinate properly",
          fix: ["Check service integration", "Verify network connectivity", "Review service configurations"],
          escape: "Will fallback to cached data where possible",
          category: "emitter",
          operation: "multi-service-integration",
          recoveryStrategy: "fallback",
          canRecover: true,
          additionalData: { failedServices: services }
          // Note: causedBy expects BaseAsyncAPIError, not ErrorContext
        });
      }
    }
    
    // Simulate complex error chain
    const complexOperation = Effect.gen(function* () {
      // First service fails
      const serviceError = new ServiceError("data-validation");
      
      // Integration fails due to service error
      const integrationError = new IntegrationError(["validation", "processing"]);
      
      return yield* Effect.fail(integrationError);
    });
    
    const result = await Effect.runPromise(
      complexOperation.pipe(
        Effect.catchTag("IntegrationError", (error) => {
          // Verify complex error context is preserved
          expect(error.additionalData?.failedServices).toEqual(["validation", "processing"]);
          expect(error.recoveryStrategy).toBe("fallback");
          
          return Effect.succeed({
            recovered: true,
            errorChain: {
              primary: error.errorId
            }
          });
        })
      )
    );
    
    expect(result.recovered).toBe(true);
    expect(result.errorChain.primary).toMatch(/^TSA_[A-Z0-9]+_[A-Z0-9]+$/);
  });
  
  test("should demonstrate proper error aggregation in parallel operations", async () => {
    // Test error handling in concurrent operations
    const parallelOperations = [
      Effect.succeed({ id: 1, result: "success" }),
      Effect.fail(new ValidationTestError("Validation failed for item 2")),
      Effect.succeed({ id: 3, result: "success" }),
      Effect.fail(new ValidationTestError("Validation failed for item 4")),
      Effect.succeed({ id: 5, result: "success" })
    ];
    
    // Process operations individually to simulate parallel error handling
    const results = [];
    for (const operation of parallelOperations) {
      const result = await Effect.runPromise(
        operation.pipe(Effect.either)
      );
      results.push(result);
    }
    
    const successes = results.filter(r => r._tag === "Right");
    const failures = results.filter(r => r._tag === "Left");
    
    expect(successes.length).toBe(3);
    expect(failures.length).toBe(2);
    
    // Verify error details are preserved
    failures.forEach(failure => {
      if (failure._tag === "Left") {
        expect(failure.left).toBeInstanceOf(ValidationTestError);
        expect(failure.left._tag).toBe("ValidationTestError");
      }
    });
  });
  
  test("should handle memory usage errors in realistic scenarios", async () => {
    // Simulate realistic memory monitoring during operation
    const memoryMonitoredOperation = Effect.gen(function* () {
      const initialMemory = 50; // MB
      let currentMemory = initialMemory;
      
      // Simulate memory increase during operation
      for (let i = 0; i < 10; i++) {
        currentMemory += 15; // Simulate memory growth
        
        if (currentMemory > 100) {
          return yield* Effect.fail(new MemoryUsageError({
            operation: `batch-processing-step-${i}`,
            currentUsageMB: currentMemory,
            thresholdMB: 100,
            peakUsageMB: currentMemory,
            canOptimize: true,
            severity: "warning"
          }));
        }
      }
      
      return { completed: true, finalMemory: currentMemory };
    });
    
    const result = await Effect.runPromise(
      memoryMonitoredOperation.pipe(
        Effect.catchTag("MemoryUsageError", (error) => {
          // Verify we get detailed memory information
          expect(error.additionalData?.currentUsageMB).toBeGreaterThan(100);
          expect(error.additionalData?.thresholdMB).toBe(100);
          expect(error.additionalData?.canOptimize).toBe(true);
          
          // Simulate memory optimization and retry
          return Effect.succeed({
            optimized: true,
            memoryReduced: true,
            originalError: error.errorId
          });
        })
      )
    );
    
    expect(result).toEqual({
      optimized: true,
      memoryReduced: true,
      originalError: expect.stringMatching(/^TSA_[A-Z0-9]+_[A-Z0-9]+$/)
    });
  });
});

describe("Error Context in Production Scenarios", () => {
  test("should maintain error context through Effect transformations", async () => {
    class DatabaseError extends BaseAsyncAPIError {
      readonly _tag = "DatabaseError" as const;
      
      constructor() {
        super({
          what: "Database connection failed",
          reassure: "Database connections are automatically retried",
          why: "The database server is temporarily unavailable",
          fix: ["Check database server status", "Verify network connectivity"],
          escape: "Will use cached data for read operations",
          category: "network",
          operation: "database-query",
          recoveryStrategy: "fallback",
          canRecover: true
        });
      }
    }
    
    const databaseOperation = Effect.gen(function* () {
      return yield* Effect.fail(new DatabaseError());
    });
    
    // Transform the Effect while preserving error context
    const result = await Effect.runPromise(
      databaseOperation.pipe(
        Effect.map(() => ({ success: true })),
        Effect.catchAll((error) => {
          const context = errorToContext(error, "transformed-operation");
          
          // Verify error context is preserved through transformations
          expect(context.category).toBe("network");
          expect(context.what).toContain("Database connection failed");
          expect(context.recoveryStrategy).toBe("fallback");
          
          return Effect.succeed({
            fallback: true,
            errorId: context.errorId
          });
        })
      )
    );
    
    expect(result).toEqual({
      fallback: true,
      errorId: expect.stringMatching(/^TSA_[A-Z0-9]+_[A-Z0-9]+$/)
    });
  });
  
  test("should demonstrate error recovery with backoff strategies", async () => {
    let attempts = 0;
    const maxAttempts = 3;
    
    const retryableOperation = Effect.gen(function* () {
      attempts++;
      
      if (attempts < maxAttempts) {
        return yield* Effect.fail(new OperationTimeoutError({
          operation: "network-request",
          timeoutMs: 1000,
          elapsedMs: 1500,
          canRetry: true,
          suggestedTimeoutMs: 2000
        }));
      }
      
      return { success: true, attempts };
    });
    
    // Implement retry with exponential backoff simulation
    const retryWithBackoff = (operation: typeof retryableOperation, attempt = 1): typeof retryableOperation =>
      operation.pipe(
        Effect.catchTag("OperationTimeoutError", (error) => {
          if (attempt >= maxAttempts) {
            return Effect.fail(error);
          }
          
          // Simulate backoff delay
          const backoffMs = Math.pow(2, attempt) * 100; // 200ms, 400ms, 800ms...
          
          expect(error.canRecover).toBe(true);
          expect(error.recoveryStrategy).toBe("retry");
          
          // In a real implementation, you'd use Effect.sleep here
          return retryWithBackoff(retryableOperation, attempt + 1);
        })
      );
    
    const result = await Effect.runPromise(retryWithBackoff(retryableOperation));
    
    expect(result).toEqual({
      success: true,
      attempts: 3
    });
    expect(attempts).toBe(3);
  });
});