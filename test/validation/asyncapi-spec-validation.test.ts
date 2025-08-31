/**
 * Comprehensive AsyncAPI Specification Validation Tests
 *
 * Tests the AsyncAPI validation framework against the official
 * AsyncAPI 3.0.0 JSON Schema specification with complete coverage
 * of all AsyncAPI components and validation scenarios.
 */

import {afterAll, beforeAll, describe, expect, it} from "vitest"
import {
	AsyncAPIValidator,
	validateAsyncAPIObject,
} from "../../src/validation/asyncapi-validator"
import {compileAsyncAPISpec, parseAsyncAPIOutput} from "../utils/test-helpers"
import {mkdir, rm, writeFile} from "node:fs/promises"
import {join} from "node:path"

describe("AsyncAPI Specification Validation Framework", () => {
	let validator: AsyncAPIValidator
	const testOutputDir = join(process.cwd(), "test-output", "validation")

	beforeAll(async () => {
		// Initialize validator
		validator = new AsyncAPIValidator({
			strict: true,
			enableCache: true,
		})

		await validator.initialize()

		// Create test output directory
		await mkdir(testOutputDir, {recursive: true})
	})

	afterAll(async () => {
		// Clean up test output directory
		await rm(testOutputDir, {recursive: true, force: true})
	})

	describe("Core Validation Functionality", () => {
		it("should validate a basic valid AsyncAPI 3.0.0 document", async () => {
			const validDocument = {
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
										id: {type: "string"},
										timestamp: {type: "string", format: "date-time"},
									},
									required: ["id"],
								},
							},
						},
					},
				},
				operations: {
					publishTestEvent: {
						action: "send",
						channel: {$ref: "#/channels/test-channel"},
					},
				},
			}

			const result = await validator.validate(validDocument)

			expect(result.valid).toBe(true)
			expect(result.errors).toHaveLength(0)
			expect(result.summary).toContain("AsyncAPI document is valid")
			expect(result.metrics.duration).toBeGreaterThan(0)
			expect(result.metrics.channelCount).toBe(1)
			expect(result.metrics.operationCount).toBe(1)
		})

		it("should reject documents with missing required fields", async () => {
			const invalidDocument = {
				// Missing required 'asyncapi' field
				info: {
					title: "Test API",
					version: "1.0.0",
				},
				channels: {},
			}

			const result = await validator.validate(invalidDocument)

			expect(result.valid).toBe(false)
			expect(result.errors.length).toBeGreaterThan(0)
			expect(result.errors[0]?.keyword).toBe("required")
			expect(result.errors[0]?.message).toContain("asyncapi")
			expect(result.summary).toContain("invalid")
		})

		it("should reject documents with wrong AsyncAPI version", async () => {
			const invalidDocument = {
				asyncapi: "2.6.0", // Wrong version
				info: {
					title: "Test API",
					version: "1.0.0",
				},
				channels: {},
			}

			const result = await validator.validate(invalidDocument)

			expect(result.valid).toBe(false)
			expect(result.errors.length).toBeGreaterThan(0)
			expect(result.errors[0].keyword).toBe("const")
			expect(result.summary).toContain("invalid")
		})

		it("should validate complex AsyncAPI documents with all components", async () => {
			const complexDocument = {
				asyncapi: "3.0.0",
				info: {
					title: "Complex Event-Driven API",
					version: "2.1.0",
					description: "A comprehensive AsyncAPI specification",
					contact: {
						name: "API Support",
						email: "support@example.com",
					},
					license: {
						name: "MIT",
						url: "https://opensource.org/licenses/MIT",
					},
				},
				servers: {
					development: {
						host: "localhost:9092",
						protocol: "kafka",
						description: "Development Kafka server",
					},
					production: {
						host: "kafka.example.com:9092",
						protocol: "kafka",
						description: "Production Kafka server",
					},
				},
				channels: {
					"user-events": {
						address: "user.{userId}.events",
						description: "Channel for user-specific events",
						parameters: {
							userId: {
								description: "The user identifier",
								examples: ["123", "456"],
							},
						},
						messages: {
							userCreated: {
								$ref: "#/components/messages/UserCreatedEvent",
							},
							userUpdated: {
								$ref: "#/components/messages/UserUpdatedEvent",
							},
						},
					},
					"system-notifications": {
						address: "system/notifications",
						description: "System-wide notifications",
						messages: {
							systemAlert: {
								payload: {
									type: "object",
									properties: {
										alertType: {
											type: "string",
											enum: ["info", "warning", "error"],
										},
										message: {type: "string"},
										timestamp: {type: "string", format: "date-time"},
									},
									required: ["alertType", "message", "timestamp"],
								},
							},
						},
					},
				},
				operations: {
					publishUserEvent: {
						action: "send",
						channel: {$ref: "#/channels/user-events"},
						description: "Publish user-related events",
						messages: [
							{$ref: "#/components/messages/UserCreatedEvent"},
							{$ref: "#/components/messages/UserUpdatedEvent"},
						],
					},
					subscribeSystemNotifications: {
						action: "receive",
						channel: {$ref: "#/channels/system-notifications"},
						description: "Subscribe to system notifications",
					},
				},
				components: {
					messages: {
						UserCreatedEvent: {
							name: "UserCreated",
							title: "User Created Event",
							description: "Event emitted when a user is created",
							payload: {
								$ref: "#/components/schemas/UserEvent",
							},
							correlationId: {
								location: "$message.header#/correlationId",
								description: "Correlation ID for event tracking",
							},
						},
						UserUpdatedEvent: {
							name: "UserUpdated",
							title: "User Updated Event",
							description: "Event emitted when a user is updated",
							payload: {
								$ref: "#/components/schemas/UserEvent",
							},
						},
					},
					schemas: {
						UserEvent: {
							type: "object",
							description: "User event payload",
							properties: {
								userId: {
									type: "string",
									description: "Unique user identifier",
								},
								action: {
									type: "string",
									enum: ["created", "updated", "deleted"],
									description: "Action performed on user",
								},
								timestamp: {
									type: "string",
									format: "date-time",
									description: "Event timestamp",
								},
								userData: {
									$ref: "#/components/schemas/User",
								},
							},
							required: ["userId", "action", "timestamp"],
						},
						User: {
							type: "object",
							description: "User data structure",
							properties: {
								id: {
									type: "string",
									description: "User ID",
								},
								name: {
									type: "string",
									description: "Full name",
								},
								email: {
									type: "string",
									format: "email",
									description: "Email address",
								},
								profile: {
									type: "object",
									properties: {
										avatar: {type: "string", format: "uri"},
										bio: {type: "string"},
										preferences: {
											type: "object",
											additionalProperties: true,
										},
									},
								},
							},
							required: ["id", "name", "email"],
						},
					},
				},
			}

			const result = await validator.validate(complexDocument)

			expect(result.valid).toBe(true)
			expect(result.errors).toHaveLength(0)
			expect(result.metrics.channelCount).toBe(2)
			expect(result.metrics.operationCount).toBe(2)
			expect(result.metrics.schemaCount).toBe(0) // Not counted at root level
		})
	})

	describe("Custom Validation Rules", () => {
		it("should detect invalid channel references in operations", async () => {
			const documentWithInvalidRef = {
				asyncapi: "3.0.0",
				info: {
					title: "Test API",
					version: "1.0.0",
				},
				channels: {
					"valid-channel": {
						address: "valid/events",
					},
				},
				operations: {
					testOperation: {
						action: "send",
						channel: {$ref: "#/channels/invalid-channel"}, // Non-existent channel
					},
				},
			}

			const result = await validator.validate(documentWithInvalidRef)

			expect(result.valid).toBe(false)
			const referenceError = result.errors.find(e => e.keyword === "reference")
			expect(referenceError).toBeDefined()
			expect(referenceError?.message).toContain("invalid-channel")
		})

		it("should detect invalid message references in channels", async () => {
			const documentWithInvalidMessageRef = {
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
								$ref: "#/components/messages/NonExistentMessage", // Invalid reference
							},
						},
					},
				},
				operations: {
					testOperation: {
						action: "send",
						channel: {$ref: "#/channels/test-channel"},
					},
				},
				components: {
					messages: {
						// NonExistentMessage is not defined here
						ValidMessage: {
							payload: {type: "string"},
						},
					},
				},
			}

			const result = await validator.validate(documentWithInvalidMessageRef)

			expect(result.valid).toBe(false)
			const referenceError = result.errors.find(e => e.keyword === "reference")
			expect(referenceError).toBeDefined()
			expect(referenceError?.message).toContain("NonExistentMessage")
		})
	})

	describe("File Validation", () => {
		it("should validate JSON AsyncAPI files", async () => {
			const validDocument = {
				asyncapi: "3.0.0",
				info: {
					title: "File Test API",
					version: "1.0.0",
				},
				channels: {
					"file-channel": {
						address: "file/events",
						messages: {
							fileMessage: {
								payload: {type: "string"},
							},
						},
					},
				},
				operations: {
					publishFileEvent: {
						action: "send",
						channel: {$ref: "#/channels/file-channel"},
					},
				},
			}

			const filePath = join(testOutputDir, "valid-document.json")
			await writeFile(filePath, JSON.stringify(validDocument, null, 2))

			const result = await validator.validateFile(filePath)

			expect(result.valid).toBe(true)
			expect(result.errors).toHaveLength(0)
			expect(result.metrics.channelCount).toBe(1)
		})

		it("should validate YAML AsyncAPI files", async () => {
			const yamlContent = `
asyncapi: "3.0.0"
info:
  title: "YAML Test API"
  version: "1.0.0"
channels:
  yaml-channel:
    address: "yaml/events"
    messages:
      yamlMessage:
        payload:
          type: "object"
          properties:
            id:
              type: "string"
operations:
  publishYamlEvent:
    action: "send"
    channel:
      $ref: "#/channels/yaml-channel"
      `

			const filePath = join(testOutputDir, "valid-document.yaml")
			await writeFile(filePath, yamlContent)

			const result = await validator.validateFile(filePath)

			expect(result.valid).toBe(true)
			expect(result.errors).toHaveLength(0)
		})

		it("should handle file parsing errors gracefully", async () => {
			const invalidJsonPath = join(testOutputDir, "invalid.json")
			await writeFile(invalidJsonPath, "{ invalid json")

			const result = await validator.validateFile(invalidJsonPath)

			expect(result.valid).toBe(false)
			expect(result.errors.length).toBeGreaterThan(0)
			expect(result.errors[0]?.message).toContain("parsing failed")
		})
	})

	describe("Integration with TypeSpec Emitter", () => {
		it("should validate AsyncAPI documents generated by TypeSpec emitter", async () => {
			const typeSpecSource = `
        namespace TestService;
        
        model UserCreatedEvent {
          @doc("User identifier")
          userId: string;
          
          @doc("User display name")
          name: string;
          
          @doc("Event timestamp")
          timestamp: utcDateTime;
          
          @doc("User email address")
          email?: string;
        }
        
        @channel("user.events")
        @doc("Publishes user creation events")
        op publishUserCreated(): UserCreatedEvent;
      `

			// Compile TypeSpec to AsyncAPI
			const compilationResult = await compileAsyncAPISpec(typeSpecSource, {
				"file-type": "json",
				"output-file": "typespec-generated",
			})

			// Parse the generated AsyncAPI document
			const asyncApiDoc = parseAsyncAPIOutput(compilationResult.outputFiles, "typespec-generated.json")

			// Validate the generated document
			const validationResult = await validator.validate(asyncApiDoc)

			expect(validationResult.valid).toBe(true)
			expect(validationResult.errors).toHaveLength(0)
			expect(validationResult.metrics.channelCount).toBeGreaterThan(0)
			expect(validationResult.metrics.operationCount).toBeGreaterThan(0)
		})

		it("should validate complex TypeSpec-generated AsyncAPI with multiple operations", async () => {
			const typeSpecSource = `
        namespace EventDrivenService;
        
        @doc("User management events")
        model UserEvent {
          @doc("Unique user identifier")
          userId: string;
          
          @doc("Event type")
          eventType: "created" | "updated" | "deleted";
          
          @doc("Event timestamp")
          timestamp: utcDateTime;
          
          @doc("Additional event data")
          metadata?: Record<unknown>;
        }
        
        @doc("System notification event")
        model SystemNotification {
          @doc("Notification level")
          level: "info" | "warning" | "error";
          
          @doc("Notification message")
          message: string;
          
          @doc("Notification timestamp")  
          timestamp: utcDateTime;
        }
        
        @channel("user.events")
        @doc("Channel for user-related events")
        op publishUserEvent(): UserEvent;
        
        @channel("system.notifications")  
        @doc("Channel for system notifications")
        op publishSystemNotification(): SystemNotification;
        
        @channel("user.events")
        @doc("Subscribe to user events for a specific user")
        op subscribeUserEvents(userId: string): UserEvent;
      `

			const compilationResult = await compileAsyncAPISpec(typeSpecSource, {
				"file-type": "json",
				"output-file": "complex-typespec",
			})

			const asyncApiDoc = parseAsyncAPIOutput(compilationResult.outputFiles, "complex-typespec.json")
			const validationResult = await validator.validate(asyncApiDoc)

			expect(validationResult.valid).toBe(true)
			expect(validationResult.errors).toHaveLength(0)
			expect(validationResult.summary).toContain("valid")
		})
	})

	describe("Batch Validation", () => {
		it("should validate multiple AsyncAPI documents in batch", async () => {
			const documents = [
				{
					name: "valid-doc-1",
					document: {
						asyncapi: "3.0.0",
						info: {title: "API 1", version: "1.0.0"},
						channels: {"ch1": {address: "events/1"}},
						operations: {"op1": {action: "send", channel: {$ref: "#/channels/ch1"}}},
					},
				},
				{
					name: "valid-doc-2",
					document: {
						asyncapi: "3.0.0",
						info: {title: "API 2", version: "1.0.0"},
						channels: {"ch2": {address: "events/2"}},
						operations: {"op2": {action: "receive", channel: {$ref: "#/channels/ch2"}}},
					},
				},
				{
					name: "invalid-doc",
					document: {
						// Missing asyncapi version
						info: {title: "Invalid API", version: "1.0.0"},
						channels: {},
					},
				},
			]

			const results = await validator.validateBatch(documents)

			expect(results.size).toBe(3)
			expect(results.get("valid-doc-1")?.valid).toBe(true)
			expect(results.get("valid-doc-2")?.valid).toBe(true)
			expect(results.get("invalid-doc")?.valid).toBe(false)
		})
	})

	describe("Performance and Caching", () => {
		it("should cache validation results for better performance", async () => {
			const document = {
				asyncapi: "3.0.0",
				info: {title: "Cache Test API", version: "1.0.0"},
				channels: {"cache-channel": {address: "cache/events"}},
				operations: {"cacheOp": {action: "send", channel: {$ref: "#/channels/cache-channel"}}},
			}

			// First validation (should be cached)
			const result1 = await validator.validate(document, "cache-test")
			expect(result1.valid).toBe(true)
			expect(result1.metrics.duration).toBeGreaterThan(0)

			// Second validation (should use cache)
			const result2 = await validator.validate(document, "cache-test")
			expect(result2.valid).toBe(true)
			expect(result2.metrics.duration).toBe(0) // Cached result
		})

		it("should provide validation statistics", () => {
			const stats = validator.getValidationStats()

			expect(stats).toHaveProperty("cacheHits")
			expect(stats).toHaveProperty("totalValidations")
			expect(stats).toHaveProperty("averageDuration")
			expect(typeof stats.cacheHits).toBe("number")
			expect(typeof stats.totalValidations).toBe("number")
			expect(typeof stats.averageDuration).toBe("number")
		})
	})
})

// TODO: ValidationTestRunner and createValidationTestSuite are not implemented yet
// describe("Validation Test Runner Integration", () => {
// 	let testRunner: ValidationTestRunner

// 	beforeAll(() => {
// 		testRunner = new ValidationTestRunner({
// 			verbose: false,
// 			benchmark: false,
// 		})
// 	})

// 	it("should run validation test suite successfully", async () => {
// 		const testSuite = createValidationTestSuite("Integration Tests")
// 		const results = await testRunner.runSuite(testSuite)

// 		expect(results.length).toBeGreaterThan(0)

// 		// Check that basic valid document test passed
// 		const validTest = results.find(r => r.testName === "valid-basic-document")
// 		expect(validTest?.passed).toBe(true)

// 		// Check that invalid document tests failed appropriately
// 		const invalidTest = results.find(r => r.testName === "invalid-missing-asyncapi-version")
// 		expect(invalidTest?.passed).toBe(true) // Should pass because it correctly identifies invalid document
// 	})

// 	it("should generate comprehensive test report", async () => {
// 		const testSuite = createValidationTestSuite("Report Tests")
// 		const results = await testRunner.runSuite(testSuite)
// 		const report = testRunner.generateReport(results)

// 		expect(report).toContain("AsyncAPI Validation Test Report")
// 		expect(report).toContain("Summary")
// 		expect(report).toContain("Total Tests:")
// 		expect(report).toContain("Success Rate:")
// 		expect(typeof report).toBe("string")
// 		expect(report.length).toBeGreaterThan(100)
// 	})
// })

describe("Convenience Functions", () => {
	it("should validate document using convenience function", async () => {
		const document = {
			asyncapi: "3.0.0",
			info: {title: "Convenience Test", version: "1.0.0"},
			channels: {"test": {address: "test/events"}},
			operations: {"testOp": {action: "send", channel: {$ref: "#/channels/test"}}},
		}

		const result = await validateAsyncAPIObject(document)

		expect(result.valid).toBe(true)
		expect(result.errors).toHaveLength(0)
	})

	it("should validate file using convenience function", async () => {
		const validDocument = {
			asyncapi: "3.0.0",
			info: {title: "File Convenience Test", version: "1.0.0"},
			channels: {"file-test": {address: "file/test"}},
			operations: {"fileOp": {action: "send", channel: {$ref: "#/channels/file-test"}}},
		}

		const filePath = join(testOutputDir, "convenience-test.json")
		await writeFile(filePath, JSON.stringify(validDocument, null, 2))

		const fileValidator = new AsyncAPIValidator({strict: false})
		fileValidator.initialize()
		const result = await fileValidator.validateFile(filePath)

		expect(result.valid).toBe(true)
		expect(result.errors).toHaveLength(0)
	})
})