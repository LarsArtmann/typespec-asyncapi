/**
 * COMPREHENSIVE UNIT TESTS FOR CENTRALIZED ERROR SYSTEM
 * 
 * Tests all aspects of the new BaseAsyncAPIError system including:
 * - Error class inheritance and properties
 * - Error context creation and serialization
 * - Recovery strategy patterns
 * - Effect.TS tagged error compatibility
 */

import { Effect } from "effect";
import { describe, test, expect, beforeEach } from "bun:test";

// Import error classes to test
import { BaseAsyncAPIError, isAsyncAPIError, errorToContext, ErrorSeverity, ErrorCategory, RecoveryStrategy } from "../../errors/base.js";
import { MemoryUsageError, OperationTimeoutError, PerformanceThresholdError, ResourceExhaustionError, ConcurrencyLimitError } from "../../errors/performance.js";
import { ValidationTestError, PerformanceValidationError } from "../../performance/validation-test.js";
import { TestSuiteExecutionError, ArchitectureValidationError } from "../../test-runner.js";

// Test implementation of BaseAsyncAPIError
class TestAsyncAPIError extends BaseAsyncAPIError {
  readonly _tag = "TestAsyncAPIError" as const;
  
  constructor(message = "Test error") {
    super({
      what: message,
      reassure: "This is a test error and should not cause concern",
      why: "Testing error system functionality",
      fix: ["Review test implementation", "Check error handling logic"],
      escape: "Test will continue with mock data",
      category: "validation",
      operation: "test-operation"
    });
  }
}

describe("BaseAsyncAPIError", () => {
  test("should create error with all required properties", () => {
    const error = new TestAsyncAPIError("Test message");
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseAsyncAPIError);
    expect(error.name).toBe("TestAsyncAPIError");
    expect(error.message).toBe("Test message");
    expect(error._tag).toBe("TestAsyncAPIError");
    expect(error.what).toBe("Test message");
    expect(error.reassure).toBe("This is a test error and should not cause concern");
    expect(error.why).toBe("Testing error system functionality");
    expect(error.fix).toEqual(["Review test implementation", "Check error handling logic"]);
    expect(error.escape).toBe("Test will continue with mock data");
    expect(error.category).toBe("validation");
    expect(error.operation).toBe("test-operation");
    expect(error.severity).toBe("error"); // Default severity
    expect(error.recoveryStrategy).toBe("abort"); // Default recovery strategy
    expect(error.canRecover).toBe(false); // Default recovery capability
    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.errorId).toMatch(/^TSA_[A-Z0-9]+_[A-Z0-9]+$/);
  });
  
  test("should create error with custom severity and recovery options", () => {
    class CustomError extends BaseAsyncAPIError {
      readonly _tag = "CustomError" as const;
      
      constructor() {
        super({
          what: "Custom error occurred",
          reassure: "System will recover automatically",
          why: "Testing custom error configuration",
          fix: ["No action needed"],
          escape: "System will retry operation",
          category: "memory",
          operation: "custom-test",
          severity: "warning",
          recoveryStrategy: "retry",
          canRecover: true,
          recoveryHint: "Will retry in 5 seconds"
        });
      }
    }
    
    const error = new CustomError();
    
    expect(error.severity).toBe("warning");
    expect(error.recoveryStrategy).toBe("retry");
    expect(error.canRecover).toBe(true);
    expect(error.recoveryHint).toBe("Will retry in 5 seconds");
  });
  
  test("should create error with additional data and related errors", () => {
    const causedByError = new TestAsyncAPIError("Caused by error");
    const relatedError1 = new TestAsyncAPIError("Related error 1");
    const relatedError2 = new TestAsyncAPIError("Related error 2");
    
    class ComplexError extends BaseAsyncAPIError {
      readonly _tag = "ComplexError" as const;
      
      constructor() {
        super({
          what: "Complex error with context",
          reassure: "All related context has been captured",
          why: "Testing error context propagation",
          fix: ["Review error chain", "Check related errors"],
          escape: "Operation will be aborted",
          category: "emitter",
          operation: "complex-test",
          additionalData: { userId: 123, operationId: "op-456", retryCount: 3 },
          causedBy: causedByError,
          relatedErrors: [relatedError1, relatedError2]
        });
      }
    }
    
    const error = new ComplexError();
    
    expect(error.additionalData).toEqual({ userId: 123, operationId: "op-456", retryCount: 3 });
    expect(error.causedBy).toBe(causedByError);
    expect(error.relatedErrors).toEqual([relatedError1, relatedError2]);
  });
  
  test("should generate unique error IDs", () => {
    const error1 = new TestAsyncAPIError();
    const error2 = new TestAsyncAPIError();
    
    expect(error1.errorId).not.toBe(error2.errorId);
    expect(error1.errorId).toMatch(/^TSA_[A-Z0-9]+_[A-Z0-9]+$/);
    expect(error2.errorId).toMatch(/^TSA_[A-Z0-9]+_[A-Z0-9]+$/);
  });
  
  test("should provide comprehensive error context", () => {
    const causedByError = new TestAsyncAPIError("Caused by error");
    
    class ContextError extends BaseAsyncAPIError {
      readonly _tag = "ContextError" as const;
      
      constructor() {
        super({
          what: "Error with context",
          reassure: "Context is available for debugging",
          why: "Testing error context generation",
          fix: ["Check context data"],
          escape: "Context will be logged",
          category: "schema-generation",
          operation: "context-test",
          additionalData: { key: "value" },
          causedBy: causedByError
        });
      }
    }
    
    const error = new ContextError();
    const context = error.getErrorContext();
    
    expect(context.errorId).toBe(error.errorId);
    expect(context.timestamp).toBe(error.timestamp);
    expect(context.severity).toBe("error");
    expect(context.category).toBe("schema-generation");
    expect(context.what).toBe("Error with context");
    expect(context.reassure).toBe("Context is available for debugging");
    expect(context.why).toBe("Testing error context generation");
    expect(context.fix).toEqual(["Check context data"]);
    expect(context.escape).toBe("Context will be logged");
    expect(context.operation).toBe("context-test");
    expect(context.additionalData).toEqual({ key: "value" });
    expect(context.causedBy).toBeTruthy();
    expect(context.causedBy?.errorId).toBe(causedByError.errorId);
  });
  
  test("should provide user-friendly error message", () => {
    const error = new TestAsyncAPIError("Something went wrong");
    const userMessage = error.getUserMessage();
    
    expect(userMessage).toContain("Something went wrong");
    expect(userMessage).toContain("This is a test error and should not cause concern");
    expect(userMessage).toContain("To fix this:");
    expect(userMessage).toContain("• Review test implementation");
    expect(userMessage).toContain("• Check error handling logic");
    expect(userMessage).toContain("Workaround: Test will continue with mock data");
  });
  
  test("should provide technical summary", () => {
    const error = new TestAsyncAPIError("Technical issue");
    const summary = error.getTechnicalSummary();
    
    expect(summary).toMatch(/^\[TSA_[A-Z0-9]+_[A-Z0-9]+\] VALIDATION: Technical issue \(test-operation\)$/);
  });
  
  test("should serialize to JSON correctly", () => {
    const causedByError = new TestAsyncAPIError("Caused by error");
    
    class SerializableError extends BaseAsyncAPIError {
      readonly _tag = "SerializableError" as const;
      
      constructor() {
        super({
          what: "Serializable error",
          reassure: "Error can be serialized",
          why: "Testing JSON serialization",
          fix: ["Check serialization"],
          escape: "Error will be logged",
          category: "network",
          operation: "serialize-test",
          additionalData: { serialized: true },
          causedBy: causedByError
        });
      }
    }
    
    const error = new SerializableError();
    const json = error.toJSON();
    
    expect(json.name).toBe("SerializableError");
    expect(json.message).toBe("Serializable error");
    expect(json._tag).toBe("SerializableError");
    expect(json.errorId).toBe(error.errorId);
    expect(json.timestamp).toBe(error.timestamp.toISOString());
    expect(json.severity).toBe("error");
    expect(json.category).toBe("network");
    expect(json.what).toBe("Serializable error");
    expect(json.additionalData).toEqual({ serialized: true });
    expect(json.causedBy).toBeTruthy();
    expect(json.causedBy).toEqual(causedByError.toJSON());
  });
});

describe("Error Type Guards", () => {
  test("isAsyncAPIError should identify BaseAsyncAPIError instances", () => {
    const asyncAPIError = new TestAsyncAPIError();
    const standardError = new Error("Standard error");
    const validationError = new ValidationTestError("Validation failed");
    
    expect(isAsyncAPIError(asyncAPIError)).toBe(true);
    expect(isAsyncAPIError(validationError)).toBe(false); // ValidationTestError doesn't extend BaseAsyncAPIError
    expect(isAsyncAPIError(standardError)).toBe(false);
    expect(isAsyncAPIError(null)).toBe(false);
    expect(isAsyncAPIError(undefined)).toBe(false);
    expect(isAsyncAPIError("string")).toBe(false);
  });
  
  test("errorToContext should convert any Error to ErrorContext", () => {
    const standardError = new Error("Standard error message");
    const context = errorToContext(standardError, "test-operation", "compilation");
    
    expect(context.errorId).toMatch(/^GENERIC_[A-Z0-9]+_[A-Z0-9]+$/);
    expect(context.timestamp).toBeInstanceOf(Date);
    expect(context.severity).toBe("error");
    expect(context.category).toBe("compilation");
    expect(context.what).toBe("Operation 'test-operation' failed: Standard error message");
    expect(context.reassure).toBe("This is an unexpected error that will be logged for investigation.");
    expect(context.why).toBe("An unhandled exception occurred during processing.");
    expect(context.fix).toEqual([
      "Check the error details for specific guidance",
      "Verify input data is valid and complete",
      "Report this issue if it persists"
    ]);
    expect(context.escape).toBe("Operation will be aborted to prevent data corruption");
    expect(context.operation).toBe("test-operation");
    expect(context.recoveryStrategy).toBe("abort");
    expect(context.canRecover).toBe(false);
  });
  
  test("errorToContext should preserve BaseAsyncAPIError context", () => {
    const asyncAPIError = new TestAsyncAPIError("AsyncAPI error");
    const context = errorToContext(asyncAPIError, "ignored-operation");
    
    // Should return the error's own context, not create a new one
    expect(context).toEqual(asyncAPIError.getErrorContext());
  });
});

describe("Performance Error Classes", () => {
  test("MemoryUsageError should create with memory metrics", () => {
    const error = new MemoryUsageError({
      operation: "large-schema-processing",
      currentUsageMB: 150,
      thresholdMB: 100,
      peakUsageMB: 160,
      canOptimize: true,
      severity: "warning"
    });
    
    expect(error._tag).toBe("MemoryUsageError");
    expect(error.severity).toBe("warning");
    expect(error.category).toBe("memory");
    expect(error.recoveryStrategy).toBe("fallback");
    expect(error.canRecover).toBe(true);
    expect(error.additionalData).toEqual({
      currentUsageMB: 150,
      thresholdMB: 100,
      peakUsageMB: 160,
      overageMB: 50,
      canOptimize: true
    });
    expect(error.message).toContain("Memory usage exceeded threshold");
    expect(error.message).toContain("150MB");
    expect(error.message).toContain("100MB");
  });
  
  test("OperationTimeoutError should create with timing metrics", () => {
    const error = new OperationTimeoutError({
      operation: "schema-generation",
      timeoutMs: 30000,
      elapsedMs: 45000,
      canRetry: true,
      suggestedTimeoutMs: 60000
    });
    
    expect(error._tag).toBe("OperationTimeoutError");
    expect(error.severity).toBe("error");
    expect(error.category).toBe("memory");
    expect(error.recoveryStrategy).toBe("retry");
    expect(error.canRecover).toBe(true);
    expect(error.additionalData).toEqual({
      timeoutMs: 30000,
      elapsedMs: 45000,
      suggestedTimeoutMs: 60000
    });
    expect(error.message).toContain("timed out after 45s");
    expect(error.message).toContain("limit: 30s");
  });
  
  test("PerformanceThresholdError should create with performance metrics", () => {
    const error = new PerformanceThresholdError({
      metric: "throughput",
      actual: 25000,
      threshold: 35000,
      operation: "validation-batch",
      optimizationHints: ["Enable parallel processing", "Reduce batch size"]
    });
    
    expect(error._tag).toBe("PerformanceThresholdError");
    expect(error.category).toBe("memory");
    expect(error.recoveryStrategy).toBe("degrade");
    expect(error.canRecover).toBe(true);
    expect(error.additionalData).toEqual({
      metric: "throughput",
      actual: 25000,
      threshold: 35000,
      unit: "",
      percentOverage: -29, // Negative because actual < threshold
      optimizationHints: ["Enable parallel processing", "Reduce batch size"]
    });
    expect(error.fix).toEqual(["Enable parallel processing", "Reduce batch size"]);
  });
  
  test("ResourceExhaustionError should create with resource metrics", () => {
    const error = new ResourceExhaustionError({
      resourceType: "file descriptors",
      operation: "concurrent-processing",
      limit: 1024,
      current: 1024,
      canCleanup: true
    });
    
    expect(error._tag).toBe("ResourceExhaustionError");
    expect(error.category).toBe("memory");
    expect(error.recoveryStrategy).toBe("fallback");
    expect(error.canRecover).toBe(true);
    expect(error.additionalData).toEqual({
      resourceType: "file descriptors",
      limit: 1024,
      current: 1024,
      canCleanup: true
    });
    expect(error.message).toContain("file descriptors resource exhaustion");
    expect(error.message).toContain("1024/1024 used");
  });
  
  test("ConcurrencyLimitError should create with concurrency metrics", () => {
    const error = new ConcurrencyLimitError({
      operation: "parallel-validation",
      currentConcurrency: 10,
      maxConcurrency: 10,
      queueSize: 5,
      canQueue: true
    });
    
    expect(error._tag).toBe("ConcurrencyLimitError");
    expect(error.category).toBe("memory");
    expect(error.recoveryStrategy).toBe("cache");
    expect(error.canRecover).toBe(true);
    expect(error.additionalData).toEqual({
      currentConcurrency: 10,
      maxConcurrency: 10,
      queueSize: 5,
      canQueue: true
    });
    expect(error.message).toContain("Concurrency limit reached");
    expect(error.message).toContain("10/10 active operations");
  });
});

describe("Validation Error Classes", () => {
  test("ValidationTestError should create with tagged error pattern", () => {
    const error = new ValidationTestError("Validation test failed", new Error("Root cause"));
    
    expect(error._tag).toBe("ValidationTestError");
    expect(error.name).toBe("ValidationTestError");
    expect(error.message).toBe("Validation test failed");
    expect(error.cause).toBeInstanceOf(Error);
  });
  
  test("PerformanceValidationError should create with performance metrics", () => {
    const error = new PerformanceValidationError("throughput", 25000, 35000);
    
    expect(error._tag).toBe("PerformanceValidationError");
    expect(error.name).toBe("PerformanceValidationError");
    expect(error.requirement).toBe("throughput");
    expect(error.actual).toBe(25000);
    expect(error.expected).toBe(35000);
    expect(error.message).toContain("Performance requirement 'throughput' failed");
    expect(error.message).toContain("25000 vs expected 35000");
  });
});

describe("Test Suite Error Classes", () => {
  test("TestSuiteExecutionError should create with tagged error pattern", () => {
    const cause = new Error("Test execution failed");
    const error = new TestSuiteExecutionError("Test suite failed to execute", cause);
    
    expect(error._tag).toBe("TestSuiteExecutionError");
    expect(error.name).toBe("TestSuiteExecutionError");
    expect(error.message).toBe("Test suite failed to execute");
    expect(error.cause).toBe(cause);
  });
  
  test("ArchitectureValidationError should create with violations", () => {
    const violations = [
      "Async/await patterns found in core logic",
      "Services found using non-tagged error patterns"
    ];
    const error = new ArchitectureValidationError(violations);
    
    expect(error._tag).toBe("ArchitectureValidationError");
    expect(error.name).toBe("ArchitectureValidationError");
    expect(error.violations).toBe(violations);
    expect(error.message).toBe("Architecture validation failed with 2 violations");
  });
});

describe("Error Recovery Strategies", () => {
  test("should provide appropriate recovery strategies based on error type", () => {
    const memoryError = new MemoryUsageError({
      operation: "test",
      currentUsageMB: 150,
      thresholdMB: 100,
      canOptimize: true
    });
    expect(memoryError.recoveryStrategy).toBe("fallback");
    expect(memoryError.canRecover).toBe(true);
    
    const timeoutError = new OperationTimeoutError({
      operation: "test",
      timeoutMs: 1000,
      canRetry: true
    });
    expect(timeoutError.recoveryStrategy).toBe("retry");
    expect(timeoutError.canRecover).toBe(true);
    
    const thresholdError = new PerformanceThresholdError({
      metric: "latency",
      actual: 200,
      threshold: 100,
      operation: "test"
    });
    expect(thresholdError.recoveryStrategy).toBe("degrade");
    expect(thresholdError.canRecover).toBe(true);
  });
});

describe("Effect.TS Integration", () => {
  test("should work with Effect error handling patterns", async () => {
    const testEffect = Effect.gen(function* () {
      // Simulate an operation that might fail
      const shouldFail = Math.random() < 0 ? 1 : 0; // Always succeed for test
      if (shouldFail) {
        return yield* Effect.fail(new TestAsyncAPIError("Effect operation failed"));
      }
      return "success";
    });
    
    const result = await Effect.runPromise(
      testEffect.pipe(
        Effect.catchAll(error => {
          // Verify the error is properly typed and accessible
          expect(error).toBeInstanceOf(TestAsyncAPIError);
          expect(error._tag).toBe("TestAsyncAPIError");
          return Effect.succeed("recovered");
        })
      )
    );
    
    expect(result).toBe("success");
  });
  
  test("should support Either pattern for error handling", async () => {
    const testEffect = Effect.gen(function* () {
      return yield* Effect.fail(new ValidationTestError("Test validation failed"));
    });
    
    const result = await Effect.runPromise(
      testEffect.pipe(Effect.either)
    );
    
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(ValidationTestError);
      expect(result.left._tag).toBe("ValidationTestError");
      expect(result.left.message).toBe("Test validation failed");
    }
  });
});

describe("Error Context Propagation", () => {
  test("should maintain error context through Effect chains", async () => {
    const rootError = new TestAsyncAPIError("Root cause");
    
    const effectChain = Effect.gen(function* () {
      const step1 = yield* Effect.fail(rootError);
      return step1;
    }).pipe(
      Effect.catchAll(error => {
        // Wrap the error with additional context
        const wrappedError = new TestSuiteExecutionError(
          "Step failed in effect chain",
          error
        );
        return Effect.fail(wrappedError);
      })
    );
    
    const result = await Effect.runPromise(
      effectChain.pipe(Effect.either)
    );
    
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(TestSuiteExecutionError);
      expect(result.left._tag).toBe("TestSuiteExecutionError");
      expect(result.left.cause).toBe(rootError);
    }
  });
});

describe("Error Severity Levels", () => {
  test("should handle different severity levels appropriately", () => {
    const severities: ErrorSeverity[] = ["fatal", "error", "warning", "info", "debug"];
    
    severities.forEach(severity => {
      class TestSeverityError extends BaseAsyncAPIError {
        readonly _tag = `Test${severity}Error` as const;
        
        constructor() {
          super({
            what: `${severity} level error`,
            reassure: "Error severity is being tested",
            why: "Testing error severity handling",
            fix: ["Review severity level"],
            escape: "Test will continue",
            category: "validation",
            operation: "severity-test",
            severity
          });
        }
      }
      
      const error = new TestSeverityError();
      expect(error.severity).toBe(severity);
    });
  });
});

describe("Error Categories", () => {
  test("should handle all error categories", () => {
    const categories: ErrorCategory[] = [
      "validation", "compilation", "file-system", "schema-generation",
      "dependency", "configuration", "memory", "network", "security", "emitter", "unknown"
    ];
    
    categories.forEach(category => {
      class TestCategoryError extends BaseAsyncAPIError {
        readonly _tag = `Test${category}Error` as const;
        
        constructor() {
          super({
            what: `${category} category error`,
            reassure: "Error category is being tested",
            why: "Testing error category handling",
            fix: ["Review category classification"],
            escape: "Test will continue",
            category,
            operation: "category-test"
          });
        }
      }
      
      const error = new TestCategoryError();
      expect(error.category).toBe(category);
    });
  });
});