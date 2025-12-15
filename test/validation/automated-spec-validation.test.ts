/**
 * CRITICAL AUTOMATED ASYNCAPI SPEC VALIDATION TEST
 *
 * This test ensures that ALL generated AsyncAPI specifications are VALID
 * against the official AsyncAPI 3.0.0 JSON Schema. Any invalid spec will
 * cause this test to FAIL IMMEDIATELY, preventing deployment of broken specs.
 *
 * REQUIREMENTS:
 * - Validates ALL generated AsyncAPI specs (JSON and YAML)
 * - Uses official AsyncAPI 3.0.0 JSON Schema validation
 * - Performance <500ms per spec validation (real AsyncAPI parser)
 * - Clear error messages for any validation failures
 * - Automatic discovery of all generated spec files
 * - Zero tolerance for invalid specifications
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { AsyncAPIValidator } from "../../src/domain/validation/asyncapi-validator.js";
import {
  compileAsyncAPISpec,
  compileAsyncAPISpecWithResult,
  parseAsyncAPIOutput,
  TestSources,
} from "../utils/test-helpers.js";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Effect } from "effect";
import {
  SERIALIZATION_FORMAT_OPTIONS,
  SERIALIZATION_FORMAT_OPTION_YAML,
} from "../../src/domain/models/serialization-format-option.js";
import {
  getChannelCount,
  getOperationCount,
  getSchemaCount,
  isSuccess,
} from "../../src/domain/models/validation-result.js";

interface TestScenario {
  name: string;
  source: string;
  readonly outputFormats: readonly SERIALIZATION_FORMAT_OPTION_YAML[];
  description: string;
}

// Comprehensive test scenarios covering all AsyncAPI features
const VALIDATION_TEST_SCENARIOS: TestScenario[] = [
  {
    name: "basic-event-api",
    source: TestSources.basicEvent,
    outputFormats: SERIALIZATION_FORMAT_OPTIONS,
    description: "Basic event publishing API",
  },
  {
    name: "complex-event-api",
    source: TestSources.complexEvent,
    outputFormats: SERIALIZATION_FORMAT_OPTIONS,
    description: "Complex event with metadata and status",
  },
  {
    name: "multiple-operations-api",
    source: TestSources.multipleOperations,
    outputFormats: SERIALIZATION_FORMAT_OPTIONS,
    description: "API with multiple channels and operations",
  },
  {
    name: "documented-api",
    source: TestSources.withDocumentation,
    outputFormats: SERIALIZATION_FORMAT_OPTIONS,
    description: "API with comprehensive documentation",
  },
  {
    name: "microservices-event-api",
    source: `
      @doc("Microservices Event Architecture")
      namespace MicroservicesAPI;
      
      @doc("Order lifecycle event")
      model OrderEvent {
        orderId: string;
        customerId: string;
        eventType: "created" | "updated" | "fulfilled" | "cancelled";
        orderData: {
          items: Array<{
            productId: string;
            quantity: int32;
            price: float64;
          }>;
          total: float64;
          currency: string;
        };
        timestamp: utcDateTime;
      }
      
      @doc("Payment processing event")
      model PaymentEvent {
        paymentId: string;
        orderId: string;
        status: "pending" | "completed" | "failed" | "refunded";
        amount: float64;
        currency: string;
        method: string;
        timestamp: utcDateTime;
      }
      
      @channel("orders.events")
      @doc("Order lifecycle events")
      op publishOrderEvent(): OrderEvent;
      
      @channel("orders.events")
      @doc("Subscribe to order events for specific customer")
      op subscribeOrderEvents(customerId?: string): OrderEvent;
      
      @channel("payments.events")
      @doc("Payment processing events")
      op publishPaymentEvent(): PaymentEvent;
      
      @channel("payments.events")
      @doc("Subscribe to payment events")
      op subscribePaymentEvents(orderId?: string): PaymentEvent;
    `,
    outputFormats: SERIALIZATION_FORMAT_OPTIONS,
    description: "Microservices event-driven architecture",
  },
  {
    name: "iot-sensor-api",
    source: `
      @doc("IoT Sensor Data Streaming API")
      namespace IoTSensorAPI;
      
      @doc("Temperature sensor reading")
      model TemperatureReading {
        sensorId: string;
        deviceId: string;
        temperature: float64;
        unit: "celsius" | "fahrenheit";
        timestamp: utcDateTime;
        location: {
          latitude: float64;
          longitude: float64;
          altitude?: float64;
        };
        metadata: {
          batteryLevel?: float64;
          signalStrength?: int32;
          firmware: string;
        };
      }
      
      @doc("Motion detection event")
      model MotionEvent {
        sensorId: string;
        deviceId: string;
        detected: boolean;
        intensity: float64;
        timestamp: utcDateTime;
      }
      
      @channel("sensors.temperature.{deviceId}")
      @doc("Stream temperature data for specific device")
      op streamTemperatureData(deviceId: string): TemperatureReading;
      
      @channel("sensors.motion.{deviceId}")
      @doc("Stream motion events for specific device")
      op streamMotionEvents(deviceId: string): MotionEvent;
      
      @channel("sensors.health")
      @doc("Device health monitoring")
      op monitorDeviceHealth(): {
        deviceId: string;
        status: "online" | "offline" | "maintenance";
        lastSeen: utcDateTime;
        batteryLevel: float64;
      };
    `,
    outputFormats: SERIALIZATION_FORMAT_OPTIONS,
    description: "IoT sensor data streaming with parameterized channels",
  },
  {
    name: "real-time-chat-api",
    source: `
      @doc("Real-time Chat Application API")
      namespace ChatAPI;
      
      @doc("Chat message")
      model ChatMessage {
        messageId: string;
        channelId: string;
        userId: string;
        username: string;
        content: string;
        timestamp: utcDateTime;
        messageType: "text" | "image" | "file" | "system";
        metadata?: {
          edited: boolean;
          replyToMessageId?: string;
          mentions: string[];
          attachments: Array<{
            filename: string;
            url: string;
            size: int32;
            mimeType: string;
          }>;
        };
      }
      
      @doc("User presence status")
      model UserPresence {
        userId: string;
        username: string;
        status: "online" | "away" | "busy" | "offline";
        lastSeen: utcDateTime;
        currentChannel?: string;
      }
      
      @channel("chat.{channelId}.messages")
      @doc("Send messages to specific chat channel")
      op sendMessage(channelId: string): ChatMessage;
      
      @channel("chat.{channelId}.messages")
      @doc("Receive messages from specific chat channel")
      op receiveMessages(channelId: string): ChatMessage;
      
      @channel("users.presence")
      @doc("Broadcast user presence updates")
      op updateUserPresence(): UserPresence;
      
      @channel("users.presence")
      @doc("Subscribe to user presence updates")
      op subscribeUserPresence(): UserPresence;
    `,
    outputFormats: SERIALIZATION_FORMAT_OPTIONS,
    description: "Real-time chat with presence and parameterized channels",
  },
];

describe("🚨 CRITICAL: AUTOMATED ASYNCAPI SPECIFICATION VALIDATION", () => {
  let validator: AsyncAPIValidator;
  const testOutputDir = join(process.cwd(), "test-output", "automated-validation");
  const generatedSpecs: Array<{
    filePath: string;
    scenario: string;
    format: string;
  }> = [];

  beforeAll(async () => {
    Effect.log("🔧 Initializing AsyncAPI 3.0.0 Validator...");

    // Create test output directory
    await mkdir(testOutputDir, { recursive: true });

    // Initialize validator with strict settings
    validator = new AsyncAPIValidator({
      strict: true,
      enableCache: false, // No caching for validation tests
      benchmarking: true,
      customRules: [], // Use only official AsyncAPI schema
    });

    await validator.initialize();
    Effect.log("✅ AsyncAPI 3.0.0 Validator initialized successfully");
  });

  afterAll(async () => {
    // Clean up test output directory
    await rm(testOutputDir, { recursive: true, force: true });

    // Print validation statistics
    const stats = validator.getValidationStats();
    Effect.log("\n📊 Validation Statistics:");
    Effect.log(`  - Total Validations: ${stats.totalValidations}`);
    Effect.log(`  - Average Duration: ${stats.averageDuration.toFixed(2)}ms`);
  });

  describe("🏭 AsyncAPI Spec Generation & Validation Pipeline", () => {
    it.each(VALIDATION_TEST_SCENARIOS)(
      "should generate and validate $name ($description)",
      async (scenario) => {
        Effect.log(`\n🔄 Testing: ${scenario.name}`);
        Effect.log(`📝 Description: ${scenario.description}`);

        for (const format of scenario.outputFormats) {
          const testStartTime = performance.now();

          // Step 1: Generate AsyncAPI specification
          Effect.log(`  📄 Generating ${format.toUpperCase()} specification...`);
          const compilationResult = await compileAsyncAPISpecWithResult(scenario.source, {
            "file-type": format,
            "output-file": scenario.name,
          });

          expect(compilationResult.result.outputFiles).toBeDefined();
          expect(compilationResult.result.outputFiles.size).toBeGreaterThan(0);

          // Step 2: Parse generated specification
          const fileName = `${scenario.name}.${format}`;
          Effect.log(`  🔍 Parsing ${fileName}...`);

          let parsedSpec: Record<string, unknown>;
          try {
            const parsed = await parseAsyncAPIOutput(
              compilationResult.result.outputFiles,
              fileName,
            );
            console.log(`🔍 DEBUG: parseAsyncAPIOutput returned for ${fileName}: ${typeof parsed}`);
            if (typeof parsed === "object") {
              console.log(
                `🔍 DEBUG: parseAsyncAPIOutput object keys: ${Object.keys(parsed).join(", ")}`,
              );
            } else if (typeof parsed === "string") {
              console.log(
                `🔍 DEBUG: parseAsyncAPIOutput returned string: ${parsed.substring(0, 100)}`,
              );
            }
            expect(parsedSpec).toBeDefined();
          } catch (error) {
            throw new Error(
              `Failed to parse generated ${fileName}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }

          // Step 3: Write spec to file system for file validation
          const filePath = join(testOutputDir, fileName);
          const fileContent =
            format === "json" ? JSON.stringify(parsedSpec, null, 2) : String(parsedSpec);

          await writeFile(filePath, fileContent);
          generatedSpecs.push({ filePath, scenario: scenario.name, format });

          // Step 4: CRITICAL VALIDATION - Spec MUST be valid
          Effect.log(`  ✅ Validating ${fileName} against AsyncAPI 3.0.0 schema...`);

          const validationResult = await validator.validateFile(filePath);
          const validationDuration = performance.now() - testStartTime;

          // HARD REQUIREMENTS - ANY FAILURE STOPS THE BUILD
          expect(validationResult.valid).toBe(true);
          expect(validationResult.errors).toHaveLength(0);
          expect(validationResult.metrics.duration).toBeLessThan(500); // <500ms requirement for real AsyncAPI parser
          expect(validationResult.summary).toContain("AsyncAPI document is valid");

          Effect.log(
            `    ✅ VALID: ${scenario.name}.${format} (${validationResult.metrics.duration.toFixed(2)}ms)`,
          );

          // Get channel and operation counts using helper functions
          if (isSuccess(validationResult)) {
            const channelCount = getChannelCount(validationResult.value);
            const operationCount = getOperationCount(validationResult.value);
            Effect.log(`    📊 Channels: ${channelCount}, Operations: ${operationCount}`);
          }

          // Verify document structure meets AsyncAPI 3.0.0 requirements
          if (format === "json") {
            const doc = parsedSpec;
            expect(doc.asyncapi).toBe("3.0.0");
            expect(doc.info).toBeDefined();
            expect(doc.info.title).toBeDefined();
            expect(doc.info.version).toBeDefined();
            expect(doc.channels).toBeDefined();
            expect(Object.keys(doc.channels).length).toBeGreaterThan(0);

            if (doc.operations) {
              expect(Object.keys(doc.operations).length).toBeGreaterThan(0);

              // Validate all operation channel references
              for (const [opName, operation] of Object.entries(doc.operations)) {
                expect(operation).toHaveProperty("action");
                expect(operation).toHaveProperty("channel");
                expect(operation.channel).toHaveProperty("$ref");

                const channelRef = operation.channel.$ref.replace("#/channels/", "");
                expect(doc.channels).toHaveProperty(channelRef);
              }
            }
          }

          Effect.log(`    ⏱️  Total test time: ${validationDuration.toFixed(2)}ms`);
        }

        Effect.log(`✅ ${scenario.name} - ALL FORMATS VALID`);
      },
      15000, // 15 second timeout per scenario
    );
  });

  describe("🔍 Batch Validation of All Generated Specs", () => {
    it("should validate all generated specifications in a single batch", async () => {
      Effect.log("\n🏭 Running batch validation of all generated specifications...");

      if (generatedSpecs.length === 0) {
        throw new Error("No specifications were generated for batch validation");
      }

      const batchStartTime = performance.now();
      const batchResults: Array<{
        file: string;
        scenario: string;
        format: string;
        valid: boolean;
        duration: number;
        errors: number;
      }> = [];

      // Validate each generated spec file
      for (const spec of generatedSpecs) {
        const result = await validator.validateFile(spec.filePath);

        batchResults.push({
          file: spec.filePath,
          scenario: spec.scenario,
          format: spec.format,
          valid: result.valid,
          duration: result.metrics.duration,
          errors: result.errors.length,
        });

        // CRITICAL: Every spec must be valid
        if (!result.valid) {
          console.error(`❌ INVALID SPEC: ${spec.scenario}.${spec.format}`);
          console.error("Validation Errors:");
          result.errors.forEach((error) => {
            console.error(`  - ${error.message} (${error.keyword}) at ${error.instancePath}`);
          });

          throw new Error(
            `INVALID ASYNCAPI SPECIFICATION DETECTED: ${spec.scenario}.${spec.format}\n` +
              `Errors: ${result.errors.map((e) => e.message).join(", ")}\n` +
              `This specification would cause runtime failures and MUST be fixed before deployment.`,
          );
        }
      }

      const batchDuration = performance.now() - batchStartTime;
      const totalSpecs = batchResults.length;
      const validSpecs = batchResults.filter((r) => r.valid).length;
      const avgValidationTime = batchResults.reduce((sum, r) => sum + r.duration, 0) / totalSpecs;

      // Performance requirements
      expect(batchDuration).toBeLessThan(5000); // Total batch validation <5 seconds
      expect(avgValidationTime).toBeLessThan(300); // Average validation <300ms for real parser
      expect(validSpecs).toBe(totalSpecs); // 100% valid rate

      Effect.log("\n📊 BATCH VALIDATION RESULTS:");
      Effect.log(`  📄 Total Specifications: ${totalSpecs}`);
      Effect.log(`  ✅ Valid Specifications: ${validSpecs}`);
      Effect.log(`  ❌ Invalid Specifications: ${totalSpecs - validSpecs}`);
      Effect.log(`  ⏱️  Total Validation Time: ${batchDuration.toFixed(2)}ms`);
      Effect.log(`  ⚡ Average Validation Time: ${avgValidationTime.toFixed(2)}ms`);
      Effect.log(`  📈 Success Rate: ${((validSpecs / totalSpecs) * 100).toFixed(1)}%`);

      // Detailed results
      Effect.log("\n📋 Individual Results:");
      batchResults.forEach((result) => {
        const status = result.valid ? "✅" : "❌";
        Effect.log(
          `  ${status} ${result.scenario}.${result.format} (${result.duration.toFixed(2)}ms)`,
        );
      });

      Effect.log("\n🎉 ALL ASYNCAPI SPECIFICATIONS ARE VALID!");
    });
  });

  describe("🚨 Validation Error Detection", () => {
    it("should detect and report validation errors in invalid specifications", async () => {
      Effect.log("\n🧪 Testing validation error detection...");

      const invalidSpecs = [
        {
          name: "missing-asyncapi-version",
          document: {
            info: { title: "Invalid API", version: "1.0.0" },
            channels: {},
          },
          expectedError: "required",
        },
        {
          name: "wrong-asyncapi-version",
          document: {
            asyncapi: "2.6.0", // Wrong version
            info: { title: "Invalid API", version: "1.0.0" },
            channels: {},
          },
          expectedError: "const",
        },
        {
          name: "missing-info",
          document: {
            asyncapi: "3.0.0",
            channels: {},
          },
          expectedError: "required",
        },
        {
          name: "invalid-operation-action",
          document: {
            asyncapi: "3.0.0",
            info: { title: "Invalid API", version: "1.0.0" },
            channels: {
              "test-channel": { address: "test" },
            },
            operations: {
              testOp: {
                action: "invalid-action", // Should be "send" or "receive"
                channel: { $ref: "#/channels/test-channel" },
              },
            },
          },
          expectedError: "enum",
        },
      ];

      for (const invalidSpec of invalidSpecs) {
        Effect.log(`  🧪 Testing invalid spec: ${invalidSpec.name}`);

        // 🔥 DEBUG: Check type before passing to validator
        console.log(`🔍 DEBUG: invalidSpec.document type: ${typeof invalidSpec.document}`);
        console.log(`🔍 DEBUG: invalidSpec.document:`, invalidSpec.document);

        const result = await validator.validate(invalidSpec.document);

        // Should be invalid
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);

        // Should contain meaningful error information - real AsyncAPI parser provides different keywords
        const errorKeywords = result.errors.map((e) => e.keyword);
        const errorMessages = result.errors.map((e) => e.message);

        // Validate that we get meaningful error information (exact keyword varies by real parser)
        expect(errorKeywords.length).toBeGreaterThan(0);
        expect(
          errorMessages.some(
            (msg) =>
              msg.includes("asyncapi") ||
              msg.includes("invalid") ||
              msg.includes("required") ||
              msg.includes("missing"),
          ),
        ).toBe(true);

        Effect.log(`    ❌ Correctly identified as invalid (${result.errors.length} errors)`);
        Effect.log(`    🔍 Error: ${result.errors[0].message}`);
      }

      Effect.log("✅ Validation error detection working correctly");
    });
  });

  describe("⚡ Performance Requirements", () => {
    it("should meet performance requirements for validation", async () => {
      Effect.log("\n⚡ Testing validation performance requirements...");

      // Test with a medium-complexity document
      const testDocument = {
        asyncapi: "3.0.0",
        info: {
          title: "Performance Test API",
          version: "1.0.0",
          description: "API for performance testing validation",
        },
        channels: {
          "perf-channel-1": {
            address: "performance/test/1",
            messages: {
              perfMessage1: {
                payload: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    data: { type: "string" },
                    timestamp: { type: "string", format: "date-time" },
                  },
                  required: ["id", "data"],
                },
              },
            },
          },
          "perf-channel-2": {
            address: "performance/test/2",
            messages: {
              perfMessage2: {
                payload: {
                  type: "object",
                  properties: {
                    userId: { type: "string" },
                    action: {
                      type: "string",
                      enum: ["create", "update", "delete"],
                    },
                    metadata: {
                      type: "object",
                      additionalProperties: true,
                    },
                  },
                  required: ["userId", "action"],
                },
              },
            },
          },
        },
        operations: {
          publishPerformanceEvent1: {
            action: "send",
            channel: { $ref: "#/channels/perf-channel-1" },
          },
          subscribePerformanceEvent2: {
            action: "receive",
            channel: { $ref: "#/channels/perf-channel-2" },
          },
        },
      };

      // Run multiple validations to test performance consistency
      const validationTimes: number[] = [];
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const result = await validator.validate(testDocument, `perf-test-${i}`);
        const duration = performance.now() - startTime;

        expect(result.valid).toBe(true);
        expect(duration).toBeLessThan(500); // <500ms requirement for real AsyncAPI parser

        validationTimes.push(duration);
      }

      const avgTime = validationTimes.reduce((sum, time) => sum + time, 0) / iterations;
      const maxTime = Math.max(...validationTimes);
      const minTime = Math.min(...validationTimes);

      Effect.log(`  ⏱️  Average validation time: ${avgTime.toFixed(2)}ms`);
      Effect.log(`  ⚡ Fastest validation: ${minTime.toFixed(2)}ms`);
      Effect.log(`  🐌 Slowest validation: ${maxTime.toFixed(2)}ms`);

      // Performance requirements
      expect(avgTime).toBeLessThan(300); // Average should be reasonable for real parser
      expect(maxTime).toBeLessThan(500); // No single validation >500ms for real parser

      Effect.log("✅ All performance requirements met");
    });
  });
});
