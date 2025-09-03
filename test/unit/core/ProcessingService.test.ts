/**
 * Unit tests for ProcessingService core service
 * 
 * Tests the extracted ProcessingService that handles TypeSpec to AsyncAPI
 * transformation of discovered elements into AsyncAPI structures.
 */

import { describe, expect, it, beforeEach } from "bun:test"
import { Effect } from "effect"
import type { Model, Operation, Program } from "@typespec/compiler"
import { ProcessingService } from "../../../src/core/ProcessingService.js"
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"
import { $lib } from "../../../src/lib.js"
import {SecurityConfig} from "../../../src/decorators/securityConfig"

describe("ProcessingService", () => {
	let processingService: ProcessingService
	let mockProgram: Program
	let baseAsyncApiDoc: AsyncAPIObject

	beforeEach(() => {
		processingService = new ProcessingService()
		mockProgram = createMockProgram()
		baseAsyncApiDoc = createBaseAsyncApiDoc()
	})

	describe("processOperations", () => {
		it("should process operations and update AsyncAPI document", async () => {
			const testOp1 = createMockOperation("publishUserEvent")
			const testOp2 = createMockOperation("subscribeNotifications")
			const operations = [testOp1, testOp2]

			const result = await Effect.runPromise(
				processingService.processOperations(operations, baseAsyncApiDoc, mockProgram)
			)

			expect(result).toBe(2) // Should return count of processed operations

			// Verify channels were created
			expect(baseAsyncApiDoc.channels).toBeDefined()
			expect(baseAsyncApiDoc.channels["channel_publishUserEvent"]).toBeDefined()
			expect(baseAsyncApiDoc.channels["channel_subscribeNotifications"]).toBeDefined()

			// Verify operations were created
			expect(baseAsyncApiDoc.operations).toBeDefined()
			expect(baseAsyncApiDoc.operations["publishUserEvent"]).toBeDefined()
			expect(baseAsyncApiDoc.operations["subscribeNotifications"]).toBeDefined()

			// Verify messages were created
			expect(baseAsyncApiDoc.components?.messages).toBeDefined()
			expect(baseAsyncApiDoc.components?.messages?.["publishUserEventMessage"]).toBeDefined()
			expect(baseAsyncApiDoc.components?.messages?.["subscribeNotificationsMessage"]).toBeDefined()
		})

		it("should handle empty operations array", async () => {
			const result = await Effect.runPromise(
				processingService.processOperations([], baseAsyncApiDoc, mockProgram)
			)

			expect(result).toBe(0)
			expect(Object.keys(baseAsyncApiDoc.channels || {})).toHaveLength(0)
			expect(Object.keys(baseAsyncApiDoc.operations || {})).toHaveLength(0)
		})

		it("should create proper channel structure", async () => {
			const testOp = createMockOperation("testOperation")
			setupMockProgramWithChannelPath(mockProgram, testOp, "/test/channel")

			await Effect.runPromise(
				processingService.processOperations([testOp], baseAsyncApiDoc, mockProgram)
			)

			const channel = baseAsyncApiDoc.channels["channel_testOperation"]
			expect(channel).toBeDefined()
			expect(channel.address).toBe("/test/channel")
			expect(channel.description).toBe("Channel for testOperation")
			expect(channel.messages).toBeDefined()
			expect(channel.messages["testOperationMessage"]).toEqual({
				$ref: "#/components/messages/testOperationMessage"
			})
		})

		it("should create proper operation structure", async () => {
			const publishOp = createMockOperation("publishEvent")
			const subscribeOp = createMockOperation("subscribeEvent")
			
			// Mock operation types
			setupMockProgramWithOperationType(mockProgram, publishOp, "publish")
			setupMockProgramWithOperationType(mockProgram, subscribeOp, "subscribe")

			await Effect.runPromise(
				processingService.processOperations([publishOp, subscribeOp], baseAsyncApiDoc, mockProgram)
			)

			const publishOperation = baseAsyncApiDoc.operations["publishEvent"]
			expect(publishOperation.action).toBe("send")
			expect(publishOperation.channel).toEqual({ $ref: "#/channels/channel_publishEvent" })

			const subscribeOperation = baseAsyncApiDoc.operations["subscribeEvent"]
			expect(subscribeOperation.action).toBe("receive")
			expect(subscribeOperation.channel).toEqual({ $ref: "#/channels/channel_subscribeEvent" })
		})

		it("should create proper message structure", async () => {
			const testOp = createMockOperation("testOp")
			testOp.parameters = { properties: new Map([["param1", {}], ["param2", {}]]) }

			await Effect.runPromise(
				processingService.processOperations([testOp], baseAsyncApiDoc, mockProgram)
			)

			const message = baseAsyncApiDoc.components?.messages?.["testOpMessage"]
			expect(message).toBeDefined()
			expect(message.name).toBe("testOpMessage")
			expect(message.title).toBe("testOp Message")
			expect(message.summary).toBe("Message for testOp operation")
			expect(message.contentType).toBe("application/json")
		})
	})

	describe("processMessageModels", () => {
		it("should process message models and update AsyncAPI document", async () => {
			const messageModel1 = createMockModel("UserEvent")
			const messageModel2 = createMockModel("SystemAlert")
			
			// Setup message configs
			const messageConfig1 = {
				name: "UserEvent",
				title: "User Event Message",
				description: "User-related events",
				contentType: "application/json"
			}
			const messageConfig2 = {
				name: "SystemAlert", 
				title: "System Alert",
				summary: "System alerts and notifications"
			}
			
			setupMockProgramWithMessageConfig(mockProgram, messageModel1, messageConfig1)
			setupMockProgramWithMessageConfig(mockProgram, messageModel2, messageConfig2)

			const result = await Effect.runPromise(
				processingService.processMessageModels([messageModel1, messageModel2], baseAsyncApiDoc, mockProgram)
			)

			expect(result).toBe(2)

			// Verify messages were created
			const userEventMessage = baseAsyncApiDoc.components?.messages?.["UserEvent"]
			expect(userEventMessage).toBeDefined()
			expect(userEventMessage.name).toBe("UserEvent")
			expect(userEventMessage.title).toBe("User Event Message")
			expect(userEventMessage.description).toBe("User-related events")
			expect(userEventMessage.contentType).toBe("application/json")
			expect(userEventMessage.payload).toEqual({ $ref: "#/components/schemas/UserEvent" })

			const systemAlertMessage = baseAsyncApiDoc.components?.messages?.["SystemAlert"]
			expect(systemAlertMessage).toBeDefined()
			expect(systemAlertMessage.name).toBe("SystemAlert")
			expect(systemAlertMessage.title).toBe("System Alert")
			expect(systemAlertMessage.summary).toBe("System alerts and notifications")
		})

		it("should handle models without message configs", async () => {
			const modelWithoutConfig = createMockModel("PlainModel")

			const result = await Effect.runPromise(
				processingService.processMessageModels([modelWithoutConfig], baseAsyncApiDoc, mockProgram)
			)

			expect(result).toBe(1) // Still counts as processed
			// Should not add message to components (no config found)
			expect(Object.keys(baseAsyncApiDoc.components?.messages || {})).toHaveLength(0)
		})

		it("should handle empty message models array", async () => {
			const result = await Effect.runPromise(
				processingService.processMessageModels([], baseAsyncApiDoc, mockProgram)
			)

			expect(result).toBe(0)
			expect(Object.keys(baseAsyncApiDoc.components?.messages || {})).toHaveLength(0)
		})

		it("should create components.messages if not exists", async () => {
			const messageModel = createMockModel("TestMessage")
			const messageConfig = { name: "TestMessage", title: "Test" }
			setupMockProgramWithMessageConfig(mockProgram, messageModel, messageConfig)

			// Start with document without components.messages
			const docWithoutMessages = { 
				...baseAsyncApiDoc, 
				components: { schemas: {}, securitySchemes: {} } 
			}

			await Effect.runPromise(
				processingService.processMessageModels([messageModel], docWithoutMessages, mockProgram)
			)

			expect(docWithoutMessages.components.messages).toBeDefined()
			expect(docWithoutMessages.components.messages["TestMessage"]).toBeDefined()
		})
	})

	describe("processSecurityConfigs", () => {
		it("should process security configurations", async () => {
			const securityConfigs: SecurityConfig[] = [
				{
					name: "apiKeyAuth",
					scheme: {
						type: "apiKey",
						in: "header",
						description: "API Key authentication"
					}
				},
				{
					name: "oauth2Auth",
					scheme: {
						type: "oauth2",
						flows: {
							implicit: {
								authorizationUrl: "https://auth.example.com",
								scopes: { read: "Read access" }
							}
						},
						description: "OAuth2 authentication"
					}
				}
			]

			const result = await Effect.runPromise(
				processingService.processSecurityConfigs(securityConfigs, baseAsyncApiDoc)
			)

			expect(result).toBe(2)

			// Verify security schemes were created
			const apiKeyScheme = baseAsyncApiDoc.components?.securitySchemes?.["apiKeyAuth"]
			expect(apiKeyScheme).toBeDefined()
			expect(apiKeyScheme.type).toBe("apiKey")
			expect(apiKeyScheme.description).toBe("API Key authentication")

			const oauth2Scheme = baseAsyncApiDoc.components?.securitySchemes?.["oauth2Auth"]
			expect(oauth2Scheme).toBeDefined()
			expect(oauth2Scheme.type).toBe("oauth2")
			expect(oauth2Scheme.flows).toBeDefined()
		})

		it("should handle HTTP security schemes", async () => {
			const httpSecurityConfig: SecurityConfig = {
				name: "bearerAuth",
				scheme: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
					description: "Bearer token authentication"
				}
			}

			await Effect.runPromise(
				processingService.processSecurityConfigs([httpSecurityConfig], baseAsyncApiDoc)
			)

			const bearerScheme = baseAsyncApiDoc.components?.securitySchemes?.["bearerAuth"]
			expect(bearerScheme).toBeDefined()
			expect(bearerScheme.type).toBe("http")
			expect(bearerScheme.scheme).toBe("bearer")
			expect(bearerScheme.bearerFormat).toBe("JWT")
		})

		it("should handle unknown security scheme types", async () => {
			const unknownSecurityConfig: SecurityConfig = {
				name: "unknownAuth",
				scheme: {
					type: "unknown" as any,
					description: "Unknown auth type"
				}
			}

			await Effect.runPromise(
				processingService.processSecurityConfigs([unknownSecurityConfig], baseAsyncApiDoc)
			)

			// Should fallback to apiKey
			const scheme = baseAsyncApiDoc.components?.securitySchemes?.["unknownAuth"]
			expect(scheme).toBeDefined()
			expect(scheme.type).toBe("apiKey")
			expect(scheme.in).toBe("user")
		})

		it("should create components.securitySchemes if not exists", async () => {
			const securityConfig: SecurityConfig = {
				name: "testAuth",
				scheme: { type: "apiKey", in: "header" }
			}

			// Start with document without components.securitySchemes
			const docWithoutSecurity = { 
				...baseAsyncApiDoc, 
				components: { schemas: {}, messages: {} } 
			}

			await Effect.runPromise(
				processingService.processSecurityConfigs([securityConfig], docWithoutSecurity)
			)

			expect(docWithoutSecurity.components.securitySchemes).toBeDefined()
			expect(docWithoutSecurity.components.securitySchemes["testAuth"]).toBeDefined()
		})

		it("should handle empty security configs array", async () => {
			const result = await Effect.runPromise(
				processingService.processSecurityConfigs([], baseAsyncApiDoc)
			)

			expect(result).toBe(0)
			expect(Object.keys(baseAsyncApiDoc.components?.securitySchemes || {})).toHaveLength(0)
		})
	})

	describe("executeProcessing", () => {
		it("should execute complete processing pipeline", async () => {
			const operation = createMockOperation("testOp")
			const messageModel = createMockModel("TestMessage")
			const securityConfig: SecurityConfig = {
				name: "testAuth",
				scheme: { type: "apiKey", in: "header" }
			}

			// Setup message config
			setupMockProgramWithMessageConfig(mockProgram, messageModel, {
				name: "TestMessage",
				title: "Test Message"
			})

			const result = await Effect.runPromise(
				processingService.executeProcessing(
					[operation],
					[messageModel],
					[securityConfig],
					baseAsyncApiDoc,
					mockProgram
				)
			)

			expect(result.operationsProcessed).toBe(1)
			expect(result.messageModelsProcessed).toBe(1)
			expect(result.securityConfigsProcessed).toBe(1)
			expect(result.totalProcessed).toBe(3)

			// Verify all elements were processed
			expect(baseAsyncApiDoc.operations["testOp"]).toBeDefined()
			expect(baseAsyncApiDoc.components?.messages?.["TestMessage"]).toBeDefined()
			expect(baseAsyncApiDoc.components?.securitySchemes?.["testAuth"]).toBeDefined()
		})

		it("should handle empty processing inputs", async () => {
			const result = await Effect.runPromise(
				processingService.executeProcessing([], [], [], baseAsyncApiDoc, mockProgram)
			)

			expect(result.operationsProcessed).toBe(0)
			expect(result.messageModelsProcessed).toBe(0)
			expect(result.securityConfigsProcessed).toBe(0)
			expect(result.totalProcessed).toBe(0)
		})

		it("should handle large-scale processing", async () => {
			const operations = Array.from({ length: 20 }, (_, i) => createMockOperation(`op${i}`))
			const messageModels = Array.from({ length: 10 }, (_, i) => createMockModel(`Message${i}`))
			const securityConfigs: SecurityConfig[] = Array.from({ length: 5 }, (_, i) => ({
				name: `auth${i}`,
				scheme: { type: "apiKey", in: "header" }
			}))

			// Setup message configs
			messageModels.forEach(model => {
				setupMockProgramWithMessageConfig(mockProgram, model, {
					name: model.name,
					title: model.name
				})
			})

			const result = await Effect.runPromise(
				processingService.executeProcessing(
					operations,
					messageModels,
					securityConfigs,
					baseAsyncApiDoc,
					mockProgram
				)
			)

			expect(result.operationsProcessed).toBe(20)
			expect(result.messageModelsProcessed).toBe(10)
			expect(result.securityConfigsProcessed).toBe(5)
			expect(result.totalProcessed).toBe(35)
		})
	})

	describe("error handling", () => {
		it("should handle operations with missing metadata gracefully", async () => {
			const operationWithoutMetadata = createMockOperation("missingMetadataOp")

			const result = await Effect.runPromise(
				processingService.processOperations([operationWithoutMetadata], baseAsyncApiDoc, mockProgram)
			)

			expect(result).toBe(1) // Should still process
			
			// Should create default channel path
			const channel = baseAsyncApiDoc.channels["channel_missingMetadataOp"]
			expect(channel).toBeDefined()
			expect(channel.address).toBe("/missingmetadataop") // Default path
		})

		it("should handle models without message configs", async () => {
			const modelWithoutConfig = createMockModel("NoConfigModel")

			const result = await Effect.runPromise(
				processingService.processMessageModels([modelWithoutConfig], baseAsyncApiDoc, mockProgram)
			)

			expect(result).toBe(1) // Still counts as processed
			expect(Object.keys(baseAsyncApiDoc.components?.messages || {})).toHaveLength(0)
		})

		it("should handle document without components", async () => {
			const docWithoutComponents = {
				asyncapi: "3.0.0",
				info: { title: "Test", version: "1.0.0" },
				channels: {},
				operations: {}
			} as AsyncAPIObject

			const securityConfig: SecurityConfig = {
				name: "testAuth",
				scheme: { type: "apiKey", in: "header" }
			}

			await Effect.runPromise(
				processingService.processSecurityConfigs([securityConfig], docWithoutComponents)
			)

			expect(docWithoutComponents.components).toBeDefined()
			expect(docWithoutComponents.components.securitySchemes).toBeDefined()
		})
	})
})

// Helper functions for creating mock objects

function createMockProgram(): Program {
	const stateMapStorage = new Map<string, Map<any, any>>()

	return {
		stateMap: (key: string) => {
			if (!stateMapStorage.has(key)) {
				stateMapStorage.set(key, new Map())
			}
			return stateMapStorage.get(key)!
		}
	} as unknown as Program
}

function createBaseAsyncApiDoc(): AsyncAPIObject {
	return {
		asyncapi: "3.0.0",
		info: {
			title: "Test API",
			version: "1.0.0"
		},
		channels: {},
		operations: {},
		components: {
			schemas: {},
			messages: {},
			securitySchemes: {}
		}
	}
}

function createMockOperation(name: string): Operation {
	return {
		name,
		kind: "Operation",
		parameters: { 
			properties: new Map() 
		}
	} as unknown as Operation
}

function createMockModel(name: string): Model {
	return {
		name,
		kind: "Model",
		properties: new Map()
	} as unknown as Model
}

function setupMockProgramWithChannelPath(program: Program, operation: Operation, path: string) {
	const channelPathsMap = program.stateMap($lib.stateKeys.channelPaths)
	channelPathsMap.set(operation, path)
}

function setupMockProgramWithOperationType(program: Program, operation: Operation, type: string) {
	const operationTypesMap = program.stateMap($lib.stateKeys.operationTypes)
	operationTypesMap.set(operation, type)
}

function setupMockProgramWithMessageConfig(program: Program, model: Model, config: any) {
	const messageConfigsMap = program.stateMap($lib.stateKeys.messageConfigs)
	messageConfigsMap.set(model, config)
}