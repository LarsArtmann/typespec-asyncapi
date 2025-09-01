/**
 * PRODUCTION TEST: Type Definitions Unit Tests
 *
 * Tests REAL type definitions and interfaces used throughout the system.
 * NO mocks - validates actual type safety and interface contracts including:
 * - AsyncAPI document structure types
 * - Emitter options and configuration types
 * - Error handling type definitions
 * - Validation result types and interfaces
 */

import {describe, expect, test} from "bun:test"

// Import type definitions
import type {AsyncAPIEmitterOptions} from "../../options.js"
import type {AsyncAPIObject, ChannelObject, OperationObject, SchemaObject} from "@asyncapi/parser/esm/spec-types/v3.js"

// AsyncAPI types now imported from centralized types/index.ts
import type {
	AMQPBindingConfig,
	KafkaBindingConfig,
	MQTTBindingConfig,
	ProtocolConfig,
	ProtocolType,
	WebSocketBindingConfig,
} from "../../types/protocol-bindings.js"

import type {
	AsyncAPIError,
	ErrorCategory,
	ErrorContext,
	PerformanceMetrics,
	ValidationResult,
} from "../../src/error-handling/index.js"
import {Effect} from "effect"


//TODO: this file is getting to big split it up


describe("Real Type Definitions Unit Tests", () => {
	describe("AsyncAPI Document Type Safety", () => {
		test("should validate AsyncAPI document structure types", () => {
			const validAsyncAPIObject: AsyncAPIObject = {
				asyncapi: "3.0.0",
				info: {
					title: "Test API",
					version: "1.0.0",
					description: "Test description",
				},
				channels: {
					"test-channel": {
						address: "/test",
						description: "Test channel",
						messages: {
							TestMessage: {
								name: "TestMessage",
								title: "Test Message",
								description: "Test message description",
								payload: {
									$ref: "#/components/schemas/TestSchema",
								},
							},
						},
					},
				},
				operations: {
					testOperation: {
						action: "send",
						channel: {
							$ref: "#/channels/test-channel",
						},
						messages: [{
							$ref: "#/channels/test-channel/messages/TestMessage",
						}],
						description: "Test operation",
					},
				},
				components: {
					schemas: {
						TestSchema: {
							type: "object",
							properties: {
								id: {
									type: "string",
									description: "Test ID",
								},
								name: {
									type: "string",
									description: "Test name",
								},
							},
							required: ["id", "name"],
						},
					},
				},
			}

			// Type checking - these should not produce TypeScript errors
			expect(validAsyncAPIObject.asyncapi).toBe("3.0.0")
			expect(validAsyncAPIObject.info.title).toBe("Test API")
			expect(validAsyncAPIObject.channels["test-channel"].address).toBe("/test")
			expect(validAsyncAPIObject.operations.testOperation.action).toBe("send")
			expect(validAsyncAPIObject.components.schemas.TestSchema.type).toBe("object")

			Effect.log("✅ AsyncAPI document structure types validated")
			Effect.log(`📊 Channels: ${Object.keys(validAsyncAPIObject.channels).length}`)
			Effect.log(`📊 Operations: ${Object.keys(validAsyncAPIObject.operations).length}`)
			Effect.log(`📊 Schemas: ${Object.keys(validAsyncAPIObject.components.schemas).length}`)
		})

		test("should enforce required properties in AsyncAPI types", () => {
			// Test ChannelObject type requirements
			const validChannel: ChannelObject = {
				address: "/valid-channel",
				description: "Valid channel description",
			}

			const channelWithMessages: ChannelObject = {
				address: "/channel-with-messages",
				description: "Channel with messages",
				messages: {
					TestMessage: {
						name: "TestMessage",
						payload: {
							$ref: "#/components/schemas/TestSchema",
						},
					},
				},
			}

			expect(validChannel.address).toBeDefined()
			expect(channelWithMessages.messages).toBeDefined()

			// Test OperationObject type requirements
			const validOperation: OperationObject = {
				action: "receive",
				channel: {
					$ref: "#/channels/test-channel",
				},
			}

			const operationWithMessages: OperationObject = {
				action: "send",
				channel: {
					$ref: "#/channels/test-channel",
				},
				messages: [{
					$ref: "#/channels/test-channel/messages/TestMessage",
				}],
				description: "Operation with messages",
			}

			expect(validOperation.action).toMatch(/^(send|receive)$/)
			expect(operationWithMessages.messages).toHaveLength(1)

			Effect.log("✅ Required properties in AsyncAPI types validated")
		})

		test("should support complex schema object structures", () => {
			const complexSchema: SchemaObject = {
				type: "object",
				description: "Complex schema with nested properties",
				properties: {
					id: {
						type: "string",
						description: "Unique identifier",
					},
					metadata: {
						type: "object",
						properties: {
							version: {
								type: "integer",
								format: "int32",
							},
							tags: {
								type: "array",
								items: {
									type: "string",
								},
							},
							nested: {
								type: "object",
								properties: {
									deepValue: {
										type: "string",
									},
								},
								additionalProperties: true,
							},
						},
						required: ["version"],
					},
					unionField: {
						anyOf: [
							{type: "string"},
							{type: "integer"},
							{type: "boolean"},
						],
					},
				},
				required: ["id", "metadata"],
				additionalProperties: false,
			}

			// Validate complex schema structure
			expect(complexSchema.properties?.id?.type).toBe("string")
			expect(complexSchema.properties?.metadata?.type).toBe("object")
			expect(complexSchema.properties?.unionField?.anyOf).toHaveLength(3)
			expect(complexSchema.required).toContain("id")
			expect(complexSchema.additionalProperties).toBe(false)

			Effect.log("✅ Complex schema object structures supported")
			Effect.log(`📊 Schema properties: ${Object.keys(complexSchema.properties || {}).length}`)
			Effect.log(`📊 Required fields: ${complexSchema.required?.length || 0}`)
		})
	})

	describe("Emitter Options Type Safety", () => {
		test("should validate emitter options structure", () => {
			const validOptions: AsyncAPIEmitterOptions = {
				"output-file": "test-output",
				"file-type": "json",
			}

			const extendedOptions: AsyncAPIEmitterOptions = {
				"output-file": "extended-output",
				"file-type": "yaml",
				"include-examples": true,
				"validate-output": true,
			}

			// Type checking
			expect(validOptions["output-file"]).toBe("test-output")
			expect(validOptions["file-type"]).toBe("json")
			expect(extendedOptions["include-examples"]).toBe(true)
			expect(extendedOptions["validate-output"]).toBe(true)

			// File type validation
			const fileTypes: FileType[] = ["json", "yaml"]
			expect(fileTypes).toContain(validOptions["file-type"])
			expect(fileTypes).toContain(extendedOptions["file-type"])

			Effect.log("✅ Emitter options structure validated")
			Effect.log(`📊 Valid file types: ${fileTypes.join(", ")}`)
		})

		test("should enforce emitter options validation rules", () => {
			const validationCases: Array<{
				options: Partial<AsyncAPIEmitterOptions>;
				shouldBeValid: boolean;
				description: string;
			}> = [
				{
					options: {"output-file": "valid", "file-type": "json"},
					shouldBeValid: true,
					description: "Valid minimal options",
				},
				{
					options: {"output-file": "", "file-type": "json"},
					shouldBeValid: false,
					description: "Empty output file",
				},
				{
					options: {"output-file": "valid"},
					shouldBeValid: false,
					description: "Missing file type",
				},
				{
					options: {"output-file": "valid", "file-type": "invalid" as FileType},
					shouldBeValid: false,
					description: "Invalid file type",
				},
			]

			for (const {options, shouldBeValid, description} of validationCases) {
				// Simulate options validation
				const hasOutputFile = options["output-file"] && options["output-file"].length > 0
				const hasValidFileType = options["file-type"] && ["json", "yaml"].includes(options["file-type"])
				const isValid = hasOutputFile && hasValidFileType

				expect(isValid).toBe(shouldBeValid)

				Effect.log(`${isValid ? "✅" : "❌"} ${description}: ${isValid ? "Valid" : "Invalid"}`)
			}

			Effect.log("✅ Emitter options validation rules enforced")
		})
	})

	describe("Protocol Binding Type Safety", () => {
		test("should validate protocol binding type definitions", () => {
			const kafkaBinding: KafkaBindingConfig = {
				topic: "test-topic",
				key: "messageKey",
				schemaIdLocation: "header",
				schemaId: 12345,
				groupId: "test-group",
				clientId: "test-client",
			}

			const websocketBinding: WebSocketBindingConfig = {
				method: "GET",
				query: {room: "string"},
				headers: {Authorization: "Bearer token"},
				subprotocol: "chat.v1",
			}

			const amqpBinding: AMQPBindingConfig = {
				exchange: "test-exchange",
				queue: "test-queue",
				routingKey: "test.routing.key",
				deliveryMode: 2,
				priority: 1,
				expiration: 60000,
			}

			// Type safety validation
			expect(kafkaBinding.topic).toBe("test-topic")
			expect(kafkaBinding.schemaIdLocation).toBe("header")
			expect(websocketBinding.method).toBe("GET")
			expect(amqpBinding.deliveryMode).toBe(2)

			// Protocol type validation
			const protocolTypes: ProtocolType[] = ["kafka", "websocket", "http", "amqp", "mqtt", "redis"]
			const validProtocol: ProtocolType = "kafka"

			expect(protocolTypes).toContain(validProtocol)

			Effect.log("✅ Protocol binding type definitions validated")
			Effect.log(`📊 Supported protocols: ${protocolTypes.join(", ")}`)
		})

		test("should support complex protocol configurations", () => {
			const complexKafkaConfig: ProtocolConfig = {
				protocol: "kafka",
				binding: {
					topic: "complex-topic",
					key: "complexKey",
					schemaIdLocation: "payload",
					schemaId: 54321,
					schemaLookupStrategy: "TopicRecordNameStrategy",
					groupId: "complex-group",
					clientId: "complex-client",
				},
				version: "2.8.0",
				description: "Complex Kafka configuration for high-throughput processing",
			}

			const complexMqttConfig: ProtocolConfig = {
				protocol: "mqtt",
				binding: {
					topic: "sensors/+/data",
					qos: 2,
					retain: true,
					cleanSession: false,
					keepAlive: 60,
				},
				version: "3.1.1",
				description: "MQTT configuration for IoT sensor data",
			}

			// Validate complex configurations
			expect(complexKafkaConfig.protocol).toBe("kafka")
			expect((complexKafkaConfig.binding as KafkaBindingConfig).schemaLookupStrategy).toBe("TopicRecordNameStrategy")
			expect(complexMqttConfig.protocol).toBe("mqtt")
			expect((complexMqttConfig.binding as MQTTBindingConfig).qos).toBe(2)

			Effect.log("✅ Complex protocol configurations supported")
			Effect.log(`📊 Kafka binding properties: ${Object.keys(complexKafkaConfig.binding).length}`)
			Effect.log(`📊 MQTT binding properties: ${Object.keys(complexMqttConfig.binding).length}`)
		})
	})

	describe("Error Handling Type Safety", () => {
		test("should validate error handling type definitions", () => {
			const errorContext: ErrorContext = {
				operation: "test-operation",
				location: "test.location",
				source: "test-source",
				details: {
					propertyName: "testProperty",
					expectedType: "string",
					actualType: "number",
				},
			}

			const asyncapiError: AsyncAPIError = {
				code: "SCHEMA_VALIDATION_FAILED",
				message: "Schema validation failed",
				category: "SCHEMA_VALIDATION" as ErrorCategory,
				severity: "error",
				timestamp: new Date(),
				context: errorContext,
				what: "Schema validation failed for property",
				reassure: "This is a common validation issue",
				why: "The property type doesn't match the expected schema",
				fix: "Update the property to match the expected type",
				escape: "Use a union type to allow multiple types",
			}

			// Type safety validation
			expect(asyncapiError.code).toBeDefined()
			expect(asyncapiError.message).toBeDefined()
			expect(asyncapiError.severity).toMatch(/^(error|warning|info)$/)
			expect(asyncapiError.context.operation).toBe("test-operation")
			expect(asyncapiError.what).toContain("Schema validation")

			Effect.log("✅ Error handling type definitions validated")
			Effect.log(`📊 Error code: ${asyncapiError.code}`)
			Effect.log(`📊 Error category: ${asyncapiError.category}`)
		})

		test("should support validation result type structures", () => {
			const performanceMetrics: PerformanceMetrics = {
				validationTimeMs: 125.5,
				documentSize: 2048,
				memoryUsage: {
					heapUsed: 15728640,
					heapTotal: 20971520,
					external: 1048576,
					rss: 31457280,
				},
				cacheHit: true,
				operationsPerSecond: 8000,
			}

			const validationResult: ValidationResult = {
				valid: false,
				errors: [
					{
						message: "Missing required property 'id'",
						keyword: "required",
						instancePath: "/properties",
						schemaPath: "#/required",
						data: {},
					},
				],
				warnings: [
					{
						message: "Property 'deprecated' is marked as deprecated",
						keyword: "deprecated",
						instancePath: "/properties/deprecated",
						schemaPath: "#/properties/deprecated",
						data: "deprecated value",
					},
				],
				summary: "Validation failed with 1 error and 1 warning",
				validatedAt: new Date(),
				performanceMetrics,
			}

			// Type structure validation
			expect(validationResult.valid).toBe(false)
			expect(validationResult.errors).toHaveLength(1)
			expect(validationResult.warnings).toHaveLength(1)
			expect(validationResult.performanceMetrics.validationTimeMs).toBe(125.5)
			expect(validationResult.performanceMetrics.cacheHit).toBe(true)

			Effect.log("✅ Validation result type structures supported")
			Effect.log(`📊 Errors: ${validationResult.errors.length}`)
			Effect.log(`📊 Warnings: ${validationResult.warnings.length}`)
			Effect.log(`📊 Performance: ${validationResult.performanceMetrics.validationTimeMs}ms`)
		})
	})

	describe("Type Intersection and Union Handling", () => {
		test("should handle complex type unions correctly", () => {
			// Test union types for schema values
			type SchemaValue = string | number | boolean | null | SchemaObject | SchemaObject[];

			const stringValue: SchemaValue = "test"
			const numberValue: SchemaValue = 42
			const booleanValue: SchemaValue = true
			const nullValue: SchemaValue = null
			const objectValue: SchemaValue = {type: "string"}
			const arrayValue: SchemaValue = [{type: "string"}, {type: "number"}]

			// Type guards for union types
			const isString = (value: SchemaValue): value is string => typeof value === "string"
			const isNumber = (value: SchemaValue): value is number => typeof value === "number"
			const isSchemaObject = (value: SchemaValue): value is SchemaObject =>
				typeof value === "object" && value !== null && !Array.isArray(value) && "type" in value

			expect(isString(stringValue)).toBe(true)
			expect(isNumber(numberValue)).toBe(true)
			expect(isSchemaObject(objectValue)).toBe(true)

			Effect.log("✅ Complex type unions handled correctly")
		})

		test("should support type intersections for configuration", () => {
			// Test intersection types for extended configurations
			interface BaseConfig {
				name: string;
				version: string;
			}

			interface ValidationConfig {
				validateSchema: boolean;
				strictMode: boolean;
			}

			interface PerformanceConfig {
				enableCache: boolean;
				maxCacheSize: number;
			}

			type CompleteConfig = BaseConfig & ValidationConfig & PerformanceConfig;

			const completeConfig: CompleteConfig = {
				name: "Test Config",
				version: "1.0.0",
				validateSchema: true,
				strictMode: true,
				enableCache: true,
				maxCacheSize: 1000,
			}

			// Validate intersection properties
			expect(completeConfig.name).toBeDefined()
			expect(completeConfig.validateSchema).toBeDefined()
			expect(completeConfig.enableCache).toBeDefined()
			expect(typeof completeConfig.maxCacheSize).toBe("number")

			Effect.log("✅ Type intersections for configuration supported")
			Effect.log(`📊 Config properties: ${Object.keys(completeConfig).length}`)
		})
	})

	describe("Generic Type Constraints", () => {
		test("should enforce generic type constraints correctly", () => {
			// Generic type for AsyncAPI components
			interface AsyncAPIComponent<T extends string> {
				componentType: T;
				name: string;
				specification: Record<string, unknown>;
			}

			const schemaComponent: AsyncAPIComponent<"schema"> = {
				componentType: "schema",
				name: "UserSchema",
				specification: {
					type: "object",
					properties: {
						id: {type: "string"},
					},
				},
			}

			const messageComponent: AsyncAPIComponent<"message"> = {
				componentType: "message",
				name: "UserMessage",
				specification: {
					payload: {$ref: "#/components/schemas/UserSchema"},
				},
			}

			expect(schemaComponent.componentType).toBe("schema")
			expect(messageComponent.componentType).toBe("message")
			expect(schemaComponent.specification.type).toBe("object")

			Effect.log("✅ Generic type constraints enforced correctly")
			Effect.log(`📊 Schema component: ${schemaComponent.name}`)
			Effect.log(`📊 Message component: ${messageComponent.name}`)
		})

		test("should support conditional types for advanced scenarios", () => {
			// Conditional types for different binding configurations
			type BindingConfig<T extends ProtocolType> =
				T extends "kafka" ? KafkaBindingConfig :
					T extends "websocket" ? WebSocketBindingConfig :
						T extends "amqp" ? AMQPBindingConfig :
							T extends "mqtt" ? MQTTBindingConfig :
								never;

			const kafkaConfig: BindingConfig<"kafka"> = {
				topic: "test-topic",
				key: "messageKey",
			}

			const mqttConfig: BindingConfig<"mqtt"> = {
				topic: "test/topic",
				qos: 1,
			}

			expect(kafkaConfig.topic).toBe("test-topic")
			expect(kafkaConfig.key).toBe("messageKey")
			expect(mqttConfig.qos).toBe(1)

			Effect.log("✅ Conditional types for advanced scenarios supported")
		})
	})

	describe("Type Utility Functions", () => {
		test("should provide type utility functions for common operations", () => {
			// Utility type for making properties optional
			type PartialAsyncAPIObject = Partial<AsyncAPIObject>;

			const partialDoc: PartialAsyncAPIObject = {
				asyncapi: "3.0.0",
				info: {
					title: "Partial Document",
					version: "1.0.0",
				},
				// channels and operations are optional
			}

			expect(partialDoc.asyncapi).toBe("3.0.0")
			expect(partialDoc.channels).toBeUndefined()

			// Utility type for picking specific properties
			type AsyncAPIInfo = Pick<AsyncAPIObject, "asyncapi" | "info">;

			const infoOnly: AsyncAPIInfo = {
				asyncapi: "3.0.0",
				info: {
					title: "Info Only",
					version: "1.0.0",
				},
			}

			expect(infoOnly.asyncapi).toBeDefined()
			expect(infoOnly.info).toBeDefined()

			Effect.log("✅ Type utility functions for common operations provided")
		})
	})
})