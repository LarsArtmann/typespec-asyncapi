/**
 * Unit tests for DiscoveryService core service
 * 
 * Tests the extracted DiscoveryService that handles TypeSpec AST traversal
 * and discovery of operations, message models, and security configurations.
 */

import { describe, expect, it, beforeEach } from "bun:test"
import { Effect } from "effect"
import type { Model, Namespace, Operation, Program } from "@typespec/compiler"
import { DiscoveryService, type DiscoveryResult } from "../../../src/core/DiscoveryService.js"
import { $lib } from "../../../src/lib.js"

describe("DiscoveryService", () => {
	let discoveryService: DiscoveryService
	let mockProgram: Program

	beforeEach(() => {
		discoveryService = new DiscoveryService()
		
		// Create mock program with proper structure
		mockProgram = createMockProgram()
	})

	describe("discoverOperations", () => {
		it("should discover operations from global namespace", async () => {
			const mockOp1 = createMockOperation("testOp1")
			const mockOp2 = createMockOperation("testOp2")
			
			mockProgram = createMockProgram({
				operations: new Map([
					["testOp1", mockOp1],
					["testOp2", mockOp2]
				])
			})

			const result = await Effect.runPromise(discoveryService.discoverOperations(mockProgram))

			expect(result).toHaveLength(2)
			expect(result[0].name).toBe("testOp1")
			expect(result[1].name).toBe("testOp2")
		})

		it("should discover operations from nested namespaces", async () => {
			const nestedOp = createMockOperation("nestedOp")
			const childNamespace = createMockNamespace("ChildNS", {
				operations: new Map([["nestedOp", nestedOp]])
			})

			mockProgram = createMockProgram({
				namespaces: new Map([["child", childNamespace]])
			})

			const result = await Effect.runPromise(discoveryService.discoverOperations(mockProgram))

			expect(result).toHaveLength(1)
			expect(result[0].name).toBe("nestedOp")
		})

		it("should handle empty namespaces", async () => {
			mockProgram = createMockProgram() // Empty namespace

			const result = await Effect.runPromise(discoveryService.discoverOperations(mockProgram))

			expect(result).toHaveLength(0)
		})

		it("should handle program without getGlobalNamespaceType method", async () => {
			const programWithoutMethod = {} as Program

			const result = await Effect.runPromise(discoveryService.discoverOperations(programWithoutMethod))

			expect(result).toHaveLength(0)
		})

		it("should handle deeply nested namespaces", async () => {
			const deepOp = createMockOperation("deepOp")
			const deepNamespace = createMockNamespace("DeepNS", {
				operations: new Map([["deepOp", deepOp]])
			})
			const midNamespace = createMockNamespace("MidNS", {
				namespaces: new Map([["deep", deepNamespace]])
			})

			mockProgram = createMockProgram({
				namespaces: new Map([["mid", midNamespace]])
			})

			const result = await Effect.runPromise(discoveryService.discoverOperations(mockProgram))

			expect(result).toHaveLength(1)
			expect(result[0].name).toBe("deepOp")
		})

		it("should handle mixed operation locations", async () => {
			const rootOp = createMockOperation("rootOp")
			const nestedOp = createMockOperation("nestedOp")
			const childNamespace = createMockNamespace("ChildNS", {
				operations: new Map([["nestedOp", nestedOp]])
			})

			mockProgram = createMockProgram({
				operations: new Map([["rootOp", rootOp]]),
				namespaces: new Map([["child", childNamespace]])
			})

			const result = await Effect.runPromise(discoveryService.discoverOperations(mockProgram))

			expect(result).toHaveLength(2)
			expect(result.map(op => op.name)).toContain("rootOp")
			expect(result.map(op => op.name)).toContain("nestedOp")
		})
	})

	describe("discoverMessageModels", () => {
		it("should discover models with @message decorators", async () => {
			const mockModel1 = createMockModel("MessageModel1")
			const mockModel2 = createMockModel("MessageModel2")
			const normalModel = createMockModel("NormalModel")
			
			// Mock stateMap to indicate which models have @message decorator
			const messageConfigsMap = new Map()
			messageConfigsMap.set(mockModel1, { name: "MessageModel1" })
			messageConfigsMap.set(mockModel2, { name: "MessageModel2" })
			// normalModel deliberately not in map (no @message decorator)

			mockProgram = createMockProgram({
				models: new Map([
					["MessageModel1", mockModel1],
					["MessageModel2", mockModel2],
					["NormalModel", normalModel]
				]),
				stateMap: (key: string) => {
					if (key === $lib.stateKeys.messageConfigs) {
						return messageConfigsMap
					}
					return new Map()
				}
			})

			const result = await Effect.runPromise(discoveryService.discoverMessageModels(mockProgram))

			expect(result).toHaveLength(2)
			expect(result[0].name).toBe("MessageModel1")
			expect(result[1].name).toBe("MessageModel2")
		})

		it("should discover message models from nested namespaces", async () => {
			const nestedMessageModel = createMockModel("NestedMessage")
			const messageConfigsMap = new Map()
			messageConfigsMap.set(nestedMessageModel, { name: "NestedMessage" })

			const childNamespace = createMockNamespace("ChildNS", {
				models: new Map([["NestedMessage", nestedMessageModel]])
			})

			mockProgram = createMockProgram({
				namespaces: new Map([["child", childNamespace]]),
				stateMap: (key: string) => {
					if (key === $lib.stateKeys.messageConfigs) {
						return messageConfigsMap
					}
					return new Map()
				}
			})

			const result = await Effect.runPromise(discoveryService.discoverMessageModels(mockProgram))

			expect(result).toHaveLength(1)
			expect(result[0].name).toBe("NestedMessage")
		})

		it("should handle empty message configs", async () => {
			mockProgram = createMockProgram({
				stateMap: (key: string) => new Map() // Empty state map
			})

			const result = await Effect.runPromise(discoveryService.discoverMessageModels(mockProgram))

			expect(result).toHaveLength(0)
		})

		it("should ignore models without @message decorator", async () => {
			const modelWithoutDecorator = createMockModel("PlainModel")
			
			mockProgram = createMockProgram({
				models: new Map([["PlainModel", modelWithoutDecorator]]),
				stateMap: (key: string) => new Map() // Empty - no @message decorators
			})

			const result = await Effect.runPromise(discoveryService.discoverMessageModels(mockProgram))

			expect(result).toHaveLength(0)
		})
	})

	describe("discoverSecurityConfigs", () => {
		it("should discover security configs from operations", async () => {
			const secureOp = createMockOperation("secureOp")
			const securityConfig = { name: "apiKey", scheme: { type: "apiKey", in: "header" } }
			
			const securityConfigsMap = new Map()
			securityConfigsMap.set(secureOp, securityConfig)

			mockProgram = createMockProgram({
				operations: new Map([["secureOp", secureOp]]),
				stateMap: (key: string) => {
					if (key === $lib.stateKeys.securityConfigs) {
						return securityConfigsMap
					}
					return new Map()
				}
			})

			const result = await Effect.runPromise(discoveryService.discoverSecurityConfigs(mockProgram))

			expect(result).toHaveLength(1)
			expect(result[0]).toEqual(securityConfig)
		})

		it("should discover security configs from models", async () => {
			const secureModel = createMockModel("SecureModel")
			const securityConfig = { name: "oauth2", scheme: { type: "oauth2", flows: {} } }
			
			const securityConfigsMap = new Map()
			securityConfigsMap.set(secureModel, securityConfig)

			mockProgram = createMockProgram({
				models: new Map([["SecureModel", secureModel]]),
				stateMap: (key: string) => {
					if (key === $lib.stateKeys.securityConfigs) {
						return securityConfigsMap
					}
					return new Map()
				}
			})

			const result = await Effect.runPromise(discoveryService.discoverSecurityConfigs(mockProgram))

			expect(result).toHaveLength(1)
			expect(result[0]).toEqual(securityConfig)
		})

		it("should discover security configs from nested namespaces", async () => {
			const nestedOp = createMockOperation("nestedSecureOp")
			const securityConfig = { name: "http", scheme: { type: "http", scheme: "bearer" } }
			
			const securityConfigsMap = new Map()
			securityConfigsMap.set(nestedOp, securityConfig)

			const childNamespace = createMockNamespace("SecurityNS", {
				operations: new Map([["nestedSecureOp", nestedOp]])
			})

			mockProgram = createMockProgram({
				namespaces: new Map([["security", childNamespace]]),
				stateMap: (key: string) => {
					if (key === $lib.stateKeys.securityConfigs) {
						return securityConfigsMap
					}
					return new Map()
				}
			})

			const result = await Effect.runPromise(discoveryService.discoverSecurityConfigs(mockProgram))

			expect(result).toHaveLength(1)
			expect(result[0]).toEqual(securityConfig)
		})

		it("should handle empty security configs", async () => {
			mockProgram = createMockProgram({
				stateMap: (key: string) => new Map() // Empty state map
			})

			const result = await Effect.runPromise(discoveryService.discoverSecurityConfigs(mockProgram))

			expect(result).toHaveLength(0)
		})

		it("should discover mixed security configs from operations and models", async () => {
			const secureOp = createMockOperation("secureOp")
			const secureModel = createMockModel("SecureModel")
			
			const opSecurityConfig = { name: "apiKey", scheme: { type: "apiKey" } }
			const modelSecurityConfig = { name: "oauth2", scheme: { type: "oauth2" } }
			
			const securityConfigsMap = new Map()
			securityConfigsMap.set(secureOp, opSecurityConfig)
			securityConfigsMap.set(secureModel, modelSecurityConfig)

			mockProgram = createMockProgram({
				operations: new Map([["secureOp", secureOp]]),
				models: new Map([["SecureModel", secureModel]]),
				stateMap: (key: string) => {
					if (key === $lib.stateKeys.securityConfigs) {
						return securityConfigsMap
					}
					return new Map()
				}
			})

			const result = await Effect.runPromise(discoveryService.discoverSecurityConfigs(mockProgram))

			expect(result).toHaveLength(2)
			expect(result).toContainEqual(opSecurityConfig)
			expect(result).toContainEqual(modelSecurityConfig)
		})
	})

	describe("executeDiscovery", () => {
		it("should execute complete discovery process", async () => {
			const testOp = createMockOperation("testOp")
			const messageModel = createMockModel("MessageModel")
			const securityConfig = { name: "apiKey", scheme: { type: "apiKey" } }
			
			// Setup state maps
			const messageConfigsMap = new Map()
			messageConfigsMap.set(messageModel, { name: "MessageModel" })
			
			const securityConfigsMap = new Map()
			securityConfigsMap.set(testOp, securityConfig)

			mockProgram = createMockProgram({
				operations: new Map([["testOp", testOp]]),
				models: new Map([["MessageModel", messageModel]]),
				stateMap: (key: string) => {
					if (key === $lib.stateKeys.messageConfigs) {
						return messageConfigsMap
					}
					if (key === $lib.stateKeys.securityConfigs) {
						return securityConfigsMap
					}
					return new Map()
				}
			})

			const result: DiscoveryResult = await Effect.runPromise(discoveryService.executeDiscovery(mockProgram))

			expect(result.operations).toHaveLength(1)
			expect(result.operations[0].name).toBe("testOp")
			
			expect(result.messageModels).toHaveLength(1)
			expect(result.messageModels[0].name).toBe("MessageModel")
			
			expect(result.securityConfigs).toHaveLength(1)
			expect(result.securityConfigs[0]).toEqual(securityConfig)
		})

		it("should handle empty discovery results", async () => {
			mockProgram = createMockProgram({
				stateMap: (key: string) => new Map() // All empty
			})

			const result: DiscoveryResult = await Effect.runPromise(discoveryService.executeDiscovery(mockProgram))

			expect(result.operations).toHaveLength(0)
			expect(result.messageModels).toHaveLength(0)
			expect(result.securityConfigs).toHaveLength(0)
		})

		it("should handle large-scale discovery", async () => {
			const operations = Array.from({ length: 10 }, (_, i) => createMockOperation(`op${i}`))
			const messageModels = Array.from({ length: 5 }, (_, i) => createMockModel(`Message${i}`))
			
			const operationsMap = new Map(operations.map(op => [op.name, op]))
			const modelsMap = new Map(messageModels.map(model => [model.name, model]))
			
			const messageConfigsMap = new Map(messageModels.map(model => [model, { name: model.name }]))

			mockProgram = createMockProgram({
				operations: operationsMap,
				models: modelsMap,
				stateMap: (key: string) => {
					if (key === $lib.stateKeys.messageConfigs) {
						return messageConfigsMap
					}
					return new Map()
				}
			})

			const result: DiscoveryResult = await Effect.runPromise(discoveryService.executeDiscovery(mockProgram))

			expect(result.operations).toHaveLength(10)
			expect(result.messageModels).toHaveLength(5)
			expect(result.securityConfigs).toHaveLength(0)
		})
	})

	describe("error handling", () => {
		it("should handle program with null getGlobalNamespaceType", async () => {
			const programWithNullMethod = {
				getGlobalNamespaceType: () => null
			} as unknown as Program

			const result = await Effect.runPromise(discoveryService.discoverOperations(programWithNullMethod))
			expect(result).toHaveLength(0)
		})

		it("should handle corrupted namespace structure", async () => {
			const corruptedProgram = {
				getGlobalNamespaceType: () => ({
					// Missing required properties
					namespaces: null,
					operations: undefined
				})
			} as unknown as Program

			const result = await Effect.runPromise(discoveryService.discoverOperations(corruptedProgram))
			expect(result).toHaveLength(0)
		})

		it("should handle stateMap errors gracefully", async () => {
			const problematicProgram = {
				getGlobalNamespaceType: () => createMockNamespace("Test"),
				stateMap: (key: string) => {
					throw new Error(`StateMap error for ${key}`)
				}
			} as unknown as Program

			// Should throw an error because stateMap fails
			await expect(Effect.runPromise(discoveryService.discoverMessageModels(problematicProgram)))
				.rejects.toThrow() // Just expect any error, not specific message
		})
	})
})

// Helper functions for creating mock TypeSpec objects

function createMockProgram(overrides: {
	operations?: Map<string, Operation>
	models?: Map<string, Model>
	namespaces?: Map<string, Namespace>
	stateMap?: (key: string) => Map<any, any>
} = {}): Program {
	const defaultNamespace = createMockNamespace("GlobalNamespace", {
		operations: overrides.operations || new Map(),
		models: overrides.models || new Map(),
		namespaces: overrides.namespaces || new Map()
	})

	return {
		getGlobalNamespaceType: () => defaultNamespace,
		stateMap: overrides.stateMap || (() => new Map())
	} as unknown as Program
}

function createMockNamespace(name: string, overrides: {
	operations?: Map<string, Operation>
	models?: Map<string, Model>
	namespaces?: Map<string, Namespace>
} = {}): Namespace {
	return {
		name,
		operations: overrides.operations || new Map(),
		models: overrides.models || new Map(),
		namespaces: overrides.namespaces || new Map(),
		kind: "Namespace"
	} as unknown as Namespace
}

function createMockOperation(name: string): Operation {
	return {
		name,
		kind: "Operation",
		parameters: { properties: new Map() }
	} as unknown as Operation
}

function createMockModel(name: string): Model {
	return {
		name,
		kind: "Model",
		properties: new Map()
	} as unknown as Model
}