/**
 * Unit tests for DocumentBuilder core service
 * 
 * Tests the extracted DocumentBuilder service that handles AsyncAPI document
 * construction, initialization, and component setup.
 */

import { describe, expect, it, beforeEach } from "bun:test"
import type { Program } from "@typespec/compiler"
import { DocumentBuilder } from "../../../src/domain/emitter/DocumentBuilder.js"
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"

describe("DocumentBuilder", () => {
	let documentBuilder: DocumentBuilder
	let mockProgram: Program

	beforeEach(() => {
		documentBuilder = new DocumentBuilder()
		
		// Mock TypeSpec Program for testing
		mockProgram = {
			getGlobalNamespaceType: () => ({
				name: "TestNamespace",
				operations: new Map(),
				models: new Map(),
				namespaces: new Map(),
			}),
			// Add other Program properties as needed for tests
		} as unknown as Program
	})

	describe("createInitialDocument", () => {
		it("should create valid AsyncAPI 3.0 document structure", () => {
			const document = documentBuilder.createInitialDocument(mockProgram)

			// Verify AsyncAPI version
			expect(document.asyncapi).toBe("3.0.0")
			
			// Verify info section
			expect(document.info).toBeDefined()
			expect(document.info.title).toBe("AsyncAPI Specification")
			expect(document.info.version).toBe("1.0.0")
			expect(document.info.description).toBe("Generated from TypeSpec with Effect.TS integration")

			// Verify document structure
			expect(document.channels).toEqual({})
			expect(document.operations).toEqual({})
			
			// Verify components structure
			expect(document.components).toBeDefined()
			expect(document.components.schemas).toEqual({})
			expect(document.components.messages).toEqual({})
			expect(document.components.securitySchemes).toEqual({})
		})

		it("should handle program without getGlobalNamespaceType", () => {
			const programWithoutMethod = {} as Program

			const document = documentBuilder.createInitialDocument(programWithoutMethod)

			// Should still create valid document structure
			expect(document.asyncapi).toBe("3.0.0")
			expect(document.info).toBeDefined()
			expect(document.components).toBeDefined()
		})

		it("should include servers from namespace processing", () => {
			const mockProgramWithServers = {
				getGlobalNamespaceType: () => ({
					name: "TestNamespace",
					operations: new Map(),
					models: new Map(),
					namespaces: new Map([
						["servers", {
							name: "servers",
							operations: new Map(),
							models: new Map(),
							namespaces: new Map()
						}]
					]),
				}),
			} as unknown as Program

			const document = documentBuilder.createInitialDocument(mockProgramWithServers)
			
			// Servers should be processed (even if empty)
			expect(document.servers).toBeDefined()
		})
	})

	describe("updateDocumentInfo", () => {
		let baseDocument: AsyncAPIObject

		beforeEach(() => {
			baseDocument = documentBuilder.createInitialDocument(mockProgram)
		})

		it("should update document info with partial configuration", () => {
			const customInfo = {
				title: "Custom API Title",
				description: "Custom description"
			}

			documentBuilder.updateDocumentInfo(baseDocument, customInfo)

			expect(baseDocument.info.title).toBe("Custom API Title")
			expect(baseDocument.info.version).toBe("1.0.0") // Should preserve original
			expect(baseDocument.info.description).toBe("Custom description")
		})

		it("should merge custom info with existing info", () => {
			const customInfo = {
				version: "2.1.0"
			}

			documentBuilder.updateDocumentInfo(baseDocument, customInfo)

			expect(baseDocument.info.title).toBe("AsyncAPI Specification") // Should preserve
			expect(baseDocument.info.version).toBe("2.1.0")
			expect(baseDocument.info.description).toBe("Generated from TypeSpec with Effect.TS integration")
		})

		it("should handle empty info updates", () => {
			const originalInfo = { ...baseDocument.info }

			documentBuilder.updateDocumentInfo(baseDocument, {})

			expect(baseDocument.info).toEqual(originalInfo)
		})

		it("should handle complete info replacement", () => {
			const completeInfo = {
				title: "New Title",
				version: "3.0.0",
				description: "New description",
				contact: {
					name: "API Team",
					email: "api@example.com"
				}
			}

			documentBuilder.updateDocumentInfo(baseDocument, completeInfo)

			expect(baseDocument.info.title).toBe("New Title")
			expect(baseDocument.info.version).toBe("3.0.0")
			expect(baseDocument.info.description).toBe("New description")
			expect(baseDocument.info.contact).toEqual(completeInfo.contact)
		})
	})

	describe("initializeComponents", () => {
		it("should initialize empty components section", () => {
			const document = { asyncapi: "3.0.0", info: { title: "Test", version: "1.0.0" } } as AsyncAPIObject

			documentBuilder.initializeComponents(document)

			expect(document.components).toBeDefined()
			expect(document.components.schemas).toEqual({})
			expect(document.components.messages).toEqual({})
			expect(document.components.securitySchemes).toEqual({})
		})

		it("should preserve existing components", () => {
			const document = {
				asyncapi: "3.0.0",
				info: { title: "Test", version: "1.0.0" },
				components: {
					schemas: { "ExistingSchema": { type: "string" } },
					messages: { "ExistingMessage": { name: "test" } }
				}
			} as AsyncAPIObject

			documentBuilder.initializeComponents(document)

			expect(document.components.schemas).toEqual({ "ExistingSchema": { type: "string" } })
			expect(document.components.messages).toEqual({ "ExistingMessage": { name: "test" } })
			expect(document.components.securitySchemes).toEqual({}) // Should be added
		})

		it("should initialize missing component sections individually", () => {
			const document = {
				asyncapi: "3.0.0",
				info: { title: "Test", version: "1.0.0" },
				components: {
					schemas: { "ExistingSchema": { type: "string" } }
					// Missing messages and securitySchemes
				}
			} as AsyncAPIObject

			documentBuilder.initializeComponents(document)

			expect(document.components.schemas).toEqual({ "ExistingSchema": { type: "string" } })
			expect(document.components.messages).toEqual({})
			expect(document.components.securitySchemes).toEqual({})
		})

		it("should handle document without components", () => {
			const document = {
				asyncapi: "3.0.0",
				info: { title: "Test", version: "1.0.0" }
			} as AsyncAPIObject

			documentBuilder.initializeComponents(document)

			expect(document.components).toBeDefined()
			expect(document.components.schemas).toEqual({})
			expect(document.components.messages).toEqual({})
			expect(document.components.securitySchemes).toEqual({})
		})
	})

	describe("initializeDocumentStructure", () => {
		it("should initialize complete document structure", () => {
			const document = { asyncapi: "3.0.0", info: { title: "Test", version: "1.0.0" } } as AsyncAPIObject

			documentBuilder.initializeDocumentStructure(document)

			expect(document.channels).toEqual({})
			expect(document.operations).toEqual({})
			expect(document.components).toBeDefined()
			expect(document.components.schemas).toEqual({})
			expect(document.components.messages).toEqual({})
			expect(document.components.securitySchemes).toEqual({})
		})

		it("should preserve existing document structure", () => {
			const document = {
				asyncapi: "3.0.0",
				info: { title: "Test", version: "1.0.0" },
				channels: { "existingChannel": { address: "/existing" } },
				operations: { "existingOp": { action: "send", channel: { $ref: "#/channels/test" } } }
			} as AsyncAPIObject

			documentBuilder.initializeDocumentStructure(document)

			expect(document.channels).toEqual({ "existingChannel": { address: "/existing" } })
			expect(document.operations).toEqual({ "existingOp": { action: "send", channel: { $ref: "#/channels/test" } } })
			expect(document.components).toBeDefined()
		})

		it("should call initializeComponents internally", () => {
			const document = { asyncapi: "3.0.0", info: { title: "Test", version: "1.0.0" } } as AsyncAPIObject

			documentBuilder.initializeDocumentStructure(document)

			// Verify components were initialized (tested in initializeComponents tests)
			expect(document.components).toBeDefined()
			expect(document.components.schemas).toEqual({})
			expect(document.components.messages).toEqual({})
			expect(document.components.securitySchemes).toEqual({})
		})
	})

	describe("integration scenarios", () => {
		it("should support complete document lifecycle", () => {
			// Step 1: Create initial document
			const document = documentBuilder.createInitialDocument(mockProgram)

			// Step 2: Update info
			documentBuilder.updateDocumentInfo(document, {
				title: "Production API",
				version: "1.0.0",
				description: "Production-ready AsyncAPI specification"
			})

			// Step 3: Initialize full structure
			documentBuilder.initializeDocumentStructure(document)

			// Verify complete document
			expect(document.asyncapi).toBe("3.0.0")
			expect(document.info.title).toBe("Production API")
			expect(document.channels).toEqual({})
			expect(document.operations).toEqual({})
			expect(document.components.schemas).toEqual({})
			expect(document.components.messages).toEqual({})
			expect(document.components.securitySchemes).toEqual({})
		})

		it("should handle multiple initialization calls safely", () => {
			const document = documentBuilder.createInitialDocument(mockProgram)

			// Multiple calls should be safe
			documentBuilder.initializeComponents(document)
			documentBuilder.initializeComponents(document)
			documentBuilder.initializeDocumentStructure(document)
			documentBuilder.initializeDocumentStructure(document)

			// Should still have valid structure
			expect(document.channels).toEqual({})
			expect(document.operations).toEqual({})
			expect(document.components.schemas).toEqual({})
			expect(document.components.messages).toEqual({})
			expect(document.components.securitySchemes).toEqual({})
		})
	})

	describe("error handling", () => {
		it("should handle null program gracefully", () => {
			const nullProgram = null as unknown as Program

			expect(() => {
				documentBuilder.createInitialDocument(nullProgram)
			}).not.toThrow()
		})

		it("should handle undefined document sections", () => {
			const partialDocument = {
				asyncapi: "3.0.0",
				info: { title: "Test", version: "1.0.0" }
			} as AsyncAPIObject

			expect(() => {
				documentBuilder.initializeDocumentStructure(partialDocument)
			}).not.toThrow()

			expect(partialDocument.channels).toEqual({})
			expect(partialDocument.operations).toEqual({})
		})
	})
})