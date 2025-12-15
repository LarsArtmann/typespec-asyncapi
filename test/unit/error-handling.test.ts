/**
 * Comprehensive Error Handling Tests (M021)
 *
 * Tests for standardized error handling, Railway programming patterns,
 * error recovery mechanisms, and What/Reassure/Why/Fix/Escape messaging.
 *
 * VALIDATES CURRENT ERROR EXCELLENCE ARCHITECTURE:
 * - Standardized error types and patterns
 * - Effect.TS railway programming utilities
 * - Error recovery mechanisms
 * - Error formatting and logging
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import {
  createError,
  failWith,
  Railway,
  EmitterErrors,
  ErrorFormatters,
  Validators,
  type StandardizedError,
} from "../../src/utils/standardized-errors.js";
import { railwayErrorRecovery } from "../../src/utils/effect-helpers.js";

import type { Program } from "@typespec/compiler";
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";

describe("Error Handling Excellence", () => {
  describe("Standardized Error Creation", () => {
    it("should create error with What/Reassure/Why/Fix/Escape pattern", () => {
      const error = createError({
        what: "Test operation failed",
        reassure: "This is expected in test scenarios",
        why: "Test validation detected invalid input",
        fix: "Provide valid test data",
        escape: "Use mock data for testing",
        severity: "error",
        code: "TEST_ERROR",
        context: { testValue: "invalid" },
      });

      expect(error.what).toBe("Test operation failed");
      expect(error.reassure).toBe("This is expected in test scenarios");
      expect(error.why).toBe("Test validation detected invalid input");
      expect(error.fix).toBe("Provide valid test data");
      expect(error.escape).toBe("Use mock data for testing");
      expect(error.severity).toBe("error");
      expect(error.code).toBe("TEST_ERROR");
      expect(error.context?.testValue).toBe("invalid");
    });

    it("should create EmitterErrors with proper structure", () => {
      const error = EmitterErrors.compilationFailed("Type error", "test.tsp");

      expect(error.what).toBe("TypeSpec compilation failed");
      expect(error.code).toBe("TYPESPEC_COMPILATION_FAILED");
      expect(error.context?.reason).toBe("Type error");
      expect(error.context?.source).toBe("test.tsp");
    });
  });

  describe("Error Formatting", () => {
    let testError: StandardizedError;

    beforeEach(() => {
      testError = createError({
        what: "Database connection failed",
        reassure: "This is a temporary network issue",
        why: "Connection timeout after 5000ms",
        fix: "Check database server status and network connectivity",
        escape: "Use cached data or fallback to read-only mode",
        severity: "error",
        code: "DATABASE_CONNECTION_FAILED",
        context: { timeout: 5000, server: "localhost" },
      });
    });

    it("should format error for user display", () => {
      const formatted = ErrorFormatters.forUser(testError);
      expect(formatted).toBe("Database connection failed. This is a temporary network issue");
    });

    it("should format error for developer display", () => {
      const formatted = ErrorFormatters.forDeveloper(testError);
      expect(formatted).toBe(
        "Connection timeout after 5000ms. Check database server status and network connectivity",
      );
    });

    it("should format error for logging", () => {
      const formatted = ErrorFormatters.forLogging(testError);
      expect(formatted).toContain("[DATABASE_CONNECTION_FAILED]");
      expect(formatted).toContain("Database connection failed");
      expect(formatted).toContain('"timeout":5000');
    });

    it("should create structured log entry", () => {
      const logEntry = ErrorFormatters.toLogEntry(testError);

      expect(logEntry.level).toBe("error");
      expect(logEntry.code).toBe("DATABASE_CONNECTION_FAILED");
      expect(logEntry.what).toBe("Database connection failed");
      expect(logEntry.context?.timeout).toBe(5000);
      expect(typeof logEntry.timestamp).toBe("string");
    });
  });

  describe("Railway Programming Utilities", () => {
    it("should safely execute synchronous operations", async () => {
      // Test successful operation
      const successResult = await Effect.runPromise(
        Railway.trySync(() => "success", { context: { test: "sync" } }),
      );
      expect(successResult).toBe("success");
    });

    it("should handle synchronous operation failures", async () => {
      const failureResult = Effect.runPromise(
        Railway.trySync(
          () => {
            throw new Error("Test error");
          },
          { context: { test: "sync-error" } },
        ).pipe(Effect.either),
      );

      const result = await failureResult;
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.what).toBe("An unexpected error occurred");
        expect(result.left.code).toBe("UNEXPECTED_ERROR");
      }
    });

    it("should chain operations properly", async () => {
      const chainedResult = await Effect.runPromise(
        Railway.chain(Effect.succeed(5), (n) => Effect.succeed(n * 2)),
      );
      expect(chainedResult).toBe(10);
    });

    it("should provide fallback for failed operations", async () => {
      const fallbackResult = await Effect.runPromise(
        Railway.fallback(
          Effect.fail(
            createError({
              what: "Test failure",
              reassure: "Expected",
              why: "Testing fallback",
              fix: "No fix needed",
              escape: "Use fallback",
              severity: "error",
              code: "TEST_FALLBACK",
            }),
          ),
          "fallback-value",
        ),
      );
      expect(fallbackResult).toBe("fallback-value");
    });
  });

  describe("Validator Utilities", () => {
    it("should validate required strings", async () => {
      const validResult = await Effect.runPromise(
        Validators.requiredString("valid-string", "testField"),
      );
      expect(validResult).toBe("valid-string");
    });

    it("should fail on empty required string", async () => {
      const invalidResult = await Effect.runPromise(
        Validators.requiredString("", "testField").pipe(Effect.either),
      );

      expect(invalidResult._tag).toBe("Left");
      if (invalidResult._tag === "Left") {
        expect(invalidResult.left.code).toBe("REQUIRED_FIELD_MISSING");
        expect(invalidResult.left.context?.fieldName).toBe("testField");
      }
    });

    it("should validate optional strings", async () => {
      const undefinedResult = await Effect.runPromise(
        Validators.optionalString(undefined, "testField"),
      );
      expect(undefinedResult).toBe(undefined);

      const validResult = await Effect.runPromise(Validators.optionalString("valid", "testField"));
      expect(validResult).toBe("valid");
    });

    it("should validate arrays with element validation", async () => {
      const arrayResult = await Effect.runPromise(
        Validators.arrayOf(["item1", "item2"], "testArray", (item, index) =>
          Effect.succeed(`validated-${item}-${index}`),
        ),
      );
      expect(arrayResult).toEqual(["validated-item1-0", "validated-item2-1"]);
    });
  });

  describe("Error Recovery Mechanisms", () => {
    it("should retry operations with exponential backoff", async () => {
      let attemptCount = 0;
      const operation = Effect.gen(function* () {
        attemptCount++;
        if (attemptCount < 3) {
          return yield* Effect.fail(new Error("Temporary failure"));
        }
        return "success";
      });

      const result = await Effect.runPromise(
        railwayErrorRecovery.retryWithBackoff(operation, 3, 10, 100),
      );

      expect(result).toBe("success");
      expect(attemptCount).toBe(3);
    });

    it("should provide graceful degradation", async () => {
      const failingOperation = Effect.fail(new Error("Primary failed"));
      const fallbackValue = "degraded-mode";

      const result = await Effect.runPromise(
        railwayErrorRecovery.gracefulDegrade(
          failingOperation,
          fallbackValue,
          "Switching to degraded mode due to primary failure",
        ),
      );

      expect(result).toBe(fallbackValue);
    });

    it("should handle fallback chains", async () => {
      const operations = [
        Effect.fail(new Error("First failed")),
        Effect.fail(new Error("Second failed")),
        Effect.succeed("third-success"),
      ];

      const result = await Effect.runPromise(
        railwayErrorRecovery.fallbackChain(operations, "final-fallback"),
      );

      expect(result).toBe("third-success");
    });

    it("should handle partial failures", async () => {
      const operations = [
        Effect.succeed("success1"),
        Effect.fail(new Error("failure1")),
        Effect.succeed("success2"),
        Effect.fail(new Error("failure2")),
      ];

      const result = await Effect.runPromise(
        railwayErrorRecovery.partialFailureHandling(operations, 2),
      );

      expect(result.successes).toEqual(["success1", "success2"]);
      expect(result.failures.length).toBe(2);
    });
  });

  describe("Integration Tests", () => {
    it("should demonstrate complete error handling pipeline", async () => {
      // Test complete pipeline with error recovery
      const operations = [
        Effect.fail(EmitterErrors.compilationFailed("Syntax error", "test.tsp")),
        Effect.fail(EmitterErrors.invalidAsyncAPI(["Missing title"], {})),
        Effect.succeed("recovered-successfully"),
      ];

      const result = await Effect.runPromise(
        railwayErrorRecovery.fallbackChain(operations, "final-fallback"),
      );

      expect(result).toBe("recovered-successfully");
    });

    it("should handle multi-level error scenarios", async () => {
      // Test error recovery across multiple components
      const operations = [
        // Simulate different failure modes
        Effect.fail(EmitterErrors.compilationFailed("Syntax error", "test.tsp")),
        Effect.fail(EmitterErrors.invalidAsyncAPI(["Missing title"], {})),
        Effect.succeed("recovered-successfully"),
      ];

      const result = await Effect.runPromise(
        railwayErrorRecovery.fallbackChain(operations, "final-fallback"),
      );

      expect(result).toBe("recovered-successfully");
    });
  });
});

/**
 * Test Utilities for Error Handling
 */
export const errorTestHelpers = {
  /**
   * Create a mock StandardizedError for testing
   */
  createMockError: (overrides: Partial<StandardizedError> = {}): StandardizedError => ({
    what: "Mock error occurred",
    reassure: "This is just a test error",
    why: "Testing error handling functionality",
    fix: "No action needed for test errors",
    escape: "Tests will continue normally",
    severity: "error" as const,
    code: "MOCK_TEST_ERROR",
    ...overrides,
  }),

  /**
   * Assert that an Effect operation fails with expected error
   */
  asyncAssertFailure: async <E>(operation: Effect.Effect<any, E>, expectCode?: string) => {
    const result = await Effect.runPromise(operation.pipe(Effect.either));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left" && expectCode) {
      const error = result.left as StandardizedError;
      expect(error.code).toBe(expectCode);
    }
    return result._tag === "Left" ? result.left : null;
  },
};
