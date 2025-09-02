/**
 * Unit tests for AsyncAPI emitter core functionality
 */

import {describe, expect, it} from "vitest"
import {
	AsyncAPIAssertions,
	compileAsyncAPISpecWithoutErrors,
	parseAsyncAPIOutput,
	TestSources,
} from "../utils/test-helpers"
import {
	SERIALIZATION_FORMAT_OPTION_JSON,
	SERIALIZATION_FORMAT_OPTION_YAML,
} from "../../src/core/serialization-format-options"

describe("AsyncAPI Emitter Core", () => {
	describe("Basic Compilation", () => {
		it("should compile simple TypeSpec model to AsyncAPI", async () => {
			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(
				TestSources.basicEvent,
				{"output-file": "basic", "file-type": "json"},
			)

			// Test shows emitter generates asyncapi.yaml by default
			const asyncapiDoc = await parseAsyncAPIOutput(outputFiles, "asyncapi.yaml")

			// Debug: Let's see what we actually generated
			Effect.log("Generated AsyncAPI document:", JSON.stringify(asyncapiDoc, null, 2))
			Effect.log("Document type:", typeof asyncapiDoc)
			Effect.log("Document keys:", asyncapiDoc && typeof asyncapiDoc === 'object' ? Object.keys(asyncapiDoc) : 'N/A')

			expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBe(true)
			expect(AsyncAPIAssertions.hasChannel(asyncapiDoc, "channel_publishBasicEvent")).toBe(true)
			expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "publishBasicEvent")).toBe(true)
			expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "BasicEvent")).toBe(true)
		})

		it("should handle complex nested models", async () => {
			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(
				TestSources.complexEvent,
				{"output-file": "complex", "file-type": "json"},
			)

			const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "complex.json")

			expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBe(true)
			expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "ComplexEvent")).toBe(true)
			expect(AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "ComplexEvent", "id")).toBe(true)
			expect(AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "ComplexEvent", "metadata")).toBe(true)
			expect(AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "ComplexEvent", "status")).toBe(true)
		})

		it("should preserve TypeSpec documentation", async () => {
			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(
				TestSources.withDocumentation,
				{"output-file": "documented", "file-type": "json"},
			)

			const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "documented.json")

			expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBe(true)

			const schema = asyncapiDoc.components.schemas.DocumentedEvent
			expect(AsyncAPIAssertions.hasDocumentation(schema, "Fully documented event model")).toBe(true)
			expect(AsyncAPIAssertions.hasDocumentation(schema.properties.id, "Primary identifier")).toBe(true)
			expect(AsyncAPIAssertions.hasDocumentation(schema.properties.name, "Human-readable name")).toBe(true)
		})
	})

	describe("Output Formats", () => {
		it("should generate valid JSON output", async () => {
			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(
				TestSources.basicEvent,
				{"output-file": "json-test", "file-type": "json"},
			)

			const jsonFile = outputFiles.get("/json-test.json")
			expect(jsonFile).toBeDefined()
			expect(() => JSON.parse(jsonFile!.content)).not.toThrow()
		})

		it("should generate valid YAML output", async () => {
			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(
				TestSources.basicEvent,
				{"output-file": "yaml-test", "file-type": SERIALIZATION_FORMAT_OPTION_YAML},
			)

			const yamlFile = outputFiles.get("/yaml-test.yaml")
			expect(yamlFile).toBeDefined()
			expect(yamlFile!.content).toContain("asyncapi: 3.0.0")
			expect(yamlFile!.content).toContain("channels:")
			expect(yamlFile!.content).toContain("operations:")
		})

		it("should default to YAML when no file-type specified", async () => {
			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(
				TestSources.basicEvent,
				{"output-file": "default-format"},
			)

			const defaultFile = outputFiles.get("/default-format.yaml")
			expect(defaultFile).toBeDefined()
		})

		it("should default filename when no output-file specified", async () => {
			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(
				TestSources.basicEvent,
				{"file-type": SERIALIZATION_FORMAT_OPTION_JSON},
			)

			const defaultFile = outputFiles.get("/asyncapi.json")
			expect(defaultFile).toBeDefined()
		})
	})

	describe("Multiple Operations", () => {
		it("should handle multiple operations in single namespace", async () => {
			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(
				TestSources.multipleOperations,
				{"output-file": "multi", "file-type": SERIALIZATION_FORMAT_OPTION_JSON},
			)

			const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "multi.json")

			expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBe(true)
			expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "publishUserEvent")).toBe(true)
			expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "publishSystemEvent")).toBe(true)
			expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "subscribeUserNotifications")).toBe(true)

			expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "UserEvent")).toBe(true)
			expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "SystemEvent")).toBe(true)
		})

		it("should create unique channels for each operation", async () => {
			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(
				TestSources.multipleOperations,
				{"output-file": "channels", "file-type": SERIALIZATION_FORMAT_OPTION_JSON},
			)

			const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "channels.json")

			expect(AsyncAPIAssertions.hasChannel(asyncapiDoc, "channel_publishUserEvent")).toBe(true)
			expect(AsyncAPIAssertions.hasChannel(asyncapiDoc, "channel_publishSystemEvent")).toBe(true)
			expect(AsyncAPIAssertions.hasChannel(asyncapiDoc, "channel_subscribeUserNotifications")).toBe(true)

			// Ensure channels are unique
			const channelKeys = Object.keys(asyncapiDoc.channels)
			const uniqueChannels = new Set(channelKeys)
			expect(channelKeys.length).toBe(uniqueChannels.size)
		})
	})

	describe("Schema Generation", () => {
		it("should handle required vs optional fields", async () => {
			const source = `
        namespace RequiredTest;
        
        model TestModel {
          requiredField: string;
          optionalField?: string;
          alsoRequired: int32;
        }
        
        @channel("test")
        op testOp(): TestModel;
      `

			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(
				source,
				{"output-file": "required", "file-type": SERIALIZATION_FORMAT_OPTION_JSON},
			)

			const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "required.json")
			const schema = asyncapiDoc.components.schemas.TestModel

			expect(schema.required).toContain("requiredField")
			expect(schema.required).toContain("alsoRequired")
			expect(schema.required).not.toContain("optionalField")
		})

		it("should handle union types", async () => {
			const source = `
        namespace UnionTest;
        
        model EventWithStatus {
          id: string;
          status: "pending" | "complete" | "failed";
          priority: "low" | "medium" | "high";
        }
        
        @channel("union-test")
        op publishEvent(): EventWithStatus;
      `

			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(
				source,
				{"output-file": "union", "file-type": SERIALIZATION_FORMAT_OPTION_JSON},
			)

			const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "union.json")

			expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "EventWithStatus")).toBe(true)
			expect(AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "EventWithStatus", "status")).toBe(true)
			expect(AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "EventWithStatus", "priority")).toBe(true)
		})

		it("should handle utcDateTime types", async () => {
			const source = `
        namespace DateTimeTest;
        
        model TimedEvent {
          id: string;
          createdAt: utcDateTime;
          updatedAt: utcDateTime;
        }
        
        @channel("datetime-test")
        op publishTimedEvent(): TimedEvent;
      `

			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(
				source,
				{"output-file": "datetime", "file-type": SERIALIZATION_FORMAT_OPTION_JSON},
			)

			const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "datetime.json")
			const schema = asyncapiDoc.components.schemas.TimedEvent

			expect(schema.properties.createdAt.type).toBe("string")
			expect(schema.properties.createdAt.format).toBe("date-time")
			expect(schema.properties.updatedAt.type).toBe("string")
			expect(schema.properties.updatedAt.format).toBe("date-time")
		})
	})

	describe("Error Handling", () => {
		it("should compile successfully with warnings", async () => {
			const source = `
        namespace WarningTest;
        
        model SimpleEvent {
          id: string;
        }
        
        @channel("warning-test")
        op publishSimpleEvent(): SimpleEvent;
      `

			const {outputFiles, diagnostics} = await compileAsyncAPISpecWithoutErrors(
				source,
				{"output-file": "warning", "file-type": SERIALIZATION_FORMAT_OPTION_JSON},
			)

			// Should have output even with warnings
			expect(outputFiles.size).toBeGreaterThan(0)

			// Warnings are okay, errors are not
			const errors = diagnostics.filter((d: { severity: string }) => d.severity === "error")
			expect(errors).toHaveLength(0)
		})

		it("should handle empty operations gracefully", async () => {
			const source = `
        namespace EmptyTest;
        
        model EmptyModel {
          id: string;
        }
        
        // No operations defined - should still generate valid AsyncAPI
      `

			const {outputFiles} = await compileAsyncAPISpecWithoutErrors(
				source,
				{"output-file": "empty", "file-type": "json"},
			)

			const asyncapiDoc = parseAsyncAPIOutput(outputFiles, "empty.json")

			expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBe(true)
			expect(Object.keys(asyncapiDoc.channels || {})).toHaveLength(0)
			expect(Object.keys(asyncapiDoc.operations || {})).toHaveLength(0)
		})
	})
})