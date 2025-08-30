/**
 * Test Integration for AsyncAPI Validation Framework
 * 
 * Provides seamless integration with existing test infrastructure
 * for automated validation testing and CI/CD pipeline integration.
 */

import { AsyncAPIValidator, type ValidationResult, type AsyncAPIValidatorOptions } from "./asyncapi-validator.js";

export interface ValidationTestCase {
  /** Test case name */
  name: string;
  /** AsyncAPI document to validate */
  document: unknown;
  /** Expected validation result */
  expectValid: boolean;
  /** Expected error keywords (for invalid documents) */
  expectedErrors?: string[];
  /** Test description */
  description?: string;
  /** Test tags for categorization */
  tags?: string[];
}

export interface ValidationTestSuite {
  /** Test suite name */
  name: string;
  /** Test cases */
  cases: ValidationTestCase[];
  /** Suite-level validator options */
  validatorOptions: AsyncAPIValidatorOptions;
  /** Setup function */
  setup?: () => Promise<void>;
  /** Teardown function */
  teardown?: () => Promise<void>;
}

export interface ValidationTestResult {
  /** Test case name */
  testName: string;
  /** Whether test passed */
  passed: boolean;
  /** Validation result */
  validationResult: ValidationResult;
  /** Error message if test failed */
  error: string;
  /** Test duration */
  duration: number;
}

export interface ValidationTestOptions {
  /** Enable performance benchmarking */
  benchmark?: boolean;
  /** Enable verbose output */
  verbose?: boolean;
  /** Stop on first failure */
  failFast?: boolean;
  /** Filter tests by tags */
  tags?: string[];
}

/**
 * Test runner for AsyncAPI validation
 */
export class ValidationTestRunner {
  private validator: AsyncAPIValidator;

  constructor(private options: ValidationTestOptions = {}) {
    this.validator = new AsyncAPIValidator({
      enableCache: true,
      benchmarking: options.benchmark ?? false,
      strict: true,
    });
  }

  /**
   * Run a complete validation test suite
   */
  async runSuite(suite: ValidationTestSuite): Promise<ValidationTestResult[]> {
    const results: ValidationTestResult[] = [];

    try {
      // Setup
      if (suite.setup) {
        await suite.setup();
      }

      // Initialize validator
      await this.validator.initialize();

      // Filter test cases by tags
      const testCases = this.filterTestCases(suite.cases);

      if (this.options.verbose) {
        console.log(`\n🧪 Running validation test suite: ${suite.name}`);
        console.log(`📋 Test cases: ${testCases.length}`);
      }

      // Run test cases
      for (const testCase of testCases) {
        const result = await this.runTestCase(testCase, suite.validatorOptions);
        results.push(result);

        if (this.options.verbose) {
          const status = result.passed ? "✅" : "❌";
          console.log(`   ${status} ${result.testName} (${result.duration.toFixed(2)}ms)`);
          if (!result.passed && result.error) {
            console.log(`     Error: ${result.error}`);
          }
        }

        // Fail fast if enabled
        if (!result.passed && this.options.failFast) {
          break;
        }
      }

      // Summary
      const passedCount = results.filter(r => r.passed).length;
      const failedCount = results.length - passedCount;

      if (this.options.verbose) {
        console.log(`\n📊 Test Suite Results: ${passedCount} passed, ${failedCount} failed`);
      }

    } finally {
      // Teardown
      if (suite.teardown) {
        await suite.teardown();
      }
    }

    return results;
  }

  /**
   * Run a single validation test case
   */
  async runTestCase(testCase: ValidationTestCase, validatorOptions?: AsyncAPIValidatorOptions): Promise<ValidationTestResult> {
    const startTime = performance.now();

    try {
      // Override validator options if provided
      if (validatorOptions) {
        this.validator = new AsyncAPIValidator(validatorOptions);
        await this.validator.initialize();
      }

      const validationResult = await this.validator.validate(testCase.document, `test-${testCase.name}`);
      const duration = performance.now() - startTime;

      // Check if result matches expectation
      const passed = this.validateTestExpectations(testCase, validationResult);

      return {
        testName: testCase.name,
        passed,
        validationResult,
        duration,
        error: passed ? "" : this.getTestFailureReason(testCase, validationResult),
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName: testCase.name,
        passed: false,
        validationResult: {
          valid: false,
          errors: [],
          metrics: {
            duration,
            documentSize: 0,
            channelCount: 0,
            operationCount: 0,
            schemaCount: 0,
          },
          summary: `Test execution failed: ${error instanceof Error ? error.message : String(error)}`,
        },
        duration,
        error: `Test execution failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Generate test report
   */
  generateReport(results: ValidationTestResult[]): string {
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.length - passedCount;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = totalDuration / results.length;

    let report = `# AsyncAPI Validation Test Report\n\n`;
    report += `## Summary\n`;
    report += `- **Total Tests:** ${results.length}\n`;
    report += `- **Passed:** ${passedCount}\n`;
    report += `- **Failed:** ${failedCount}\n`;
    report += `- **Success Rate:** ${((passedCount / results.length) * 100).toFixed(1)}%\n`;
    report += `- **Total Duration:** ${totalDuration.toFixed(2)}ms\n`;
    report += `- **Average Duration:** ${avgDuration.toFixed(2)}ms\n\n`;

    if (failedCount > 0) {
      report += `## Failed Tests\n\n`;
      for (const result of results.filter(r => !r.passed)) {
        report += `### ${result.testName}\n`;
        report += `- **Error:** ${result.error}\n`;
        report += `- **Duration:** ${result.duration.toFixed(2)}ms\n`;
        if (result.validationResult.errors.length > 0) {
          report += `- **Validation Errors:**\n`;
          for (const error of result.validationResult.errors) {
            report += `  - ${error.message} (${error.keyword})\n`;
          }
        }
        report += `\n`;
      }
    }

    return report;
  }

  /**
   * Filter test cases by tags
   */
  private filterTestCases(cases: ValidationTestCase[]): ValidationTestCase[] {
    if (!this.options.tags || this.options.tags.length === 0) {
      return cases;
    }

    return cases.filter(testCase => {
      if (!testCase.tags || testCase.tags.length === 0) {
        return false;
      }
      return this.options.tags!.some(tag => testCase.tags!.includes(tag));
    });
  }

  /**
   * Validate test expectations against validation result
   */
  private validateTestExpectations(testCase: ValidationTestCase, result: ValidationResult): boolean {
    // Check validity expectation
    if (testCase.expectValid !== result.valid) {
      return false;
    }

    // Check expected errors
    if (testCase.expectedErrors && testCase.expectedErrors.length > 0) {
      const actualKeywords = result.errors.map(e => e.keyword);
      return testCase.expectedErrors.every(expectedKeyword => 
        actualKeywords.includes(expectedKeyword)
      );
    }

    return true;
  }

  /**
   * Get test failure reason
   */
  private getTestFailureReason(testCase: ValidationTestCase, result: ValidationResult): string {
    const reasons: string[] = [];

    if (testCase.expectValid !== result.valid) {
      reasons.push(`Expected valid: ${testCase.expectValid}, got: ${result.valid}`);
    }

    if (testCase.expectedErrors && testCase.expectedErrors.length > 0) {
      const actualKeywords = result.errors.map(e => e.keyword);
      const missingKeywords = testCase.expectedErrors.filter(k => !actualKeywords.includes(k));
      if (missingKeywords.length > 0) {
        reasons.push(`Missing expected error keywords: ${missingKeywords.join(", ")}`);
      }
    }

    return reasons.join("; ");
  }
}

/**
 * Create a validation test suite from common scenarios
 */
export function createValidationTestSuite(name: string, options?: AsyncAPIValidatorOptions): ValidationTestSuite {
  return {
    name,
    validatorOptions: options ?? {},
    cases: [
      {
        name: "valid-basic-document",
        expectValid: true,
        description: "Valid basic AsyncAPI 3.0.0 document",
        tags: ["basic", "valid"],
        document: {
          asyncapi: "3.0.0",
          info: {
            title: "Test API",
            version: "1.0.0",
          },
          channels: {
            "test-channel": {
              address: "test/events",
              messages: {
                testMessage: {
                  payload: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                    },
                  },
                },
              },
            },
          },
          operations: {
            testOperation: {
              action: "send",
              channel: { $ref: "#/channels/test-channel" },
            },
          },
        },
      },
      {
        name: "invalid-missing-asyncapi-version",
        expectValid: false,
        expectedErrors: ["required"],
        description: "Document missing required asyncapi version",
        tags: ["invalid", "required"],
        document: {
          info: {
            title: "Test API",
            version: "1.0.0",
          },
          channels: {},
        },
      },
      {
        name: "invalid-wrong-asyncapi-version",
        expectValid: false,
        expectedErrors: ["const"],
        description: "Document with wrong asyncapi version",
        tags: ["invalid", "version"],
        document: {
          asyncapi: "2.6.0",
          info: {
            title: "Test API",
            version: "1.0.0",
          },
          channels: {},
        },
      },
      {
        name: "invalid-missing-info",
        expectValid: false,
        expectedErrors: ["required"],
        description: "Document missing required info object",
        tags: ["invalid", "required"],
        document: {
          asyncapi: "3.0.0",
          channels: {},
        },
      },
      {
        name: "invalid-operation-action",
        expectValid: false,
        expectedErrors: ["enum"],
        description: "Operation with invalid action",
        tags: ["invalid", "operation"],
        document: {
          asyncapi: "3.0.0",
          info: {
            title: "Test API",
            version: "1.0.0",
          },
          channels: {
            "test-channel": {
              address: "test/events",
            },
          },
          operations: {
            testOperation: {
              action: "invalid-action", // Should be "send" or "receive"
              channel: { $ref: "#/channels/test-channel" },
            },
          },
        },
      },
      {
        name: "valid-complex-document",
        expectValid: true,
        description: "Complex valid AsyncAPI document with all components",
        tags: ["complex", "valid"],
        document: {
          asyncapi: "3.0.0",
          info: {
            title: "Complex Test API",
            version: "1.0.0",
            description: "A complex AsyncAPI for testing",
          },
          servers: {
            development: {
              host: "localhost:9092",
              protocol: "kafka",
              description: "Development server",
            },
          },
          channels: {
            "user-events": {
              address: "user.{userId}.events",
              parameters: {
                userId: {
                  description: "User identifier",
                  examples: ["123", "456"],
                },
              },
              messages: {
                userCreated: {
                  $ref: "#/components/messages/UserCreated",
                },
              },
            },
          },
          operations: {
            publishUserEvent: {
              action: "send",
              channel: { $ref: "#/channels/user-events" },
              messages: [
                { $ref: "#/components/messages/UserCreated" },
              ],
            },
          },
          components: {
            messages: {
              UserCreated: {
                payload: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
            schemas: {
              User: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  createdAt: { type: "string", format: "date-time" },
                },
                required: ["id", "name", "email"],
              },
            },
          },
        },
      },
    ],
  };
}

/**
 * Integration with Vitest/Jest test frameworks
 */
export function createValidationTest(testCase: ValidationTestCase, _validator?: AsyncAPIValidator) {
  return async () => {
    const runner = new ValidationTestRunner();
    const result = await runner.runTestCase(testCase);
    
    if (!result.passed) {
      throw new Error(result.error || "Validation test failed");
    }

    // Additional assertions can be added here
    // Note: Assuming expect is available in test environment
    const validationResult = result.validationResult;
    if (validationResult.valid !== testCase.expectValid) {
      throw new Error(`Expected valid: ${testCase.expectValid}, got: ${validationResult.valid}`);
    }
    
    if (testCase.expectedErrors && testCase.expectedErrors.length > 0) {
      const actualKeywords = validationResult.errors.map(e => e.keyword);
      for (const expectedKeyword of testCase.expectedErrors) {
        if (!actualKeywords.includes(expectedKeyword)) {
          throw new Error(`Expected error keyword '${expectedKeyword}' not found. Found: ${actualKeywords.join(", ")}`);
        }
      }
    }
  };
}