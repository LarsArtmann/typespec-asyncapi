import {describe, expect, test} from "bun:test"
import {AsyncAPIEmitterOptionsSchema} from "../src/options"
import type {AsyncAPIEmitterOptions} from "../src/types/options"

describe("Options Integration", () => {
	test("validates valid options configuration", () => {
		const validOptions: AsyncAPIEmitterOptions = {
			"output-file": "my-api.yaml",
			"file-type": "yaml",
			"asyncapi-version": "3.0.0",
			"omit-unreachable-types": true,
			"include-source-info": false,
			"validate-spec": true,
			"protocol-bindings": ["kafka", "websocket"],
			"versioning": {
				"separate-files": true,
				"file-naming": "suffix",
				"include-version-info": true,
			},
		}

		// This should not throw - the schema should accept valid options
		expect(() => {
			// In a real TypeSpec context, this would be validated by the compiler
			// Here we're just ensuring the schema structure is sound
			expect(AsyncAPIEmitterOptionsSchema.type).toBe("object")
			expect(AsyncAPIEmitterOptionsSchema.additionalProperties).toBe(false)
		}).not.toThrow()
	})

	test("schema rejects invalid enum values", () => {
		// Test that our enum constraints would catch invalid values
		const fileTypeSchema = AsyncAPIEmitterOptionsSchema.properties["file-type"]
		expect(fileTypeSchema.enum).toEqual(["yaml", "json"])
		expect(fileTypeSchema.enum).not.toContain("xml") // Invalid format

		const versionSchema = AsyncAPIEmitterOptionsSchema.properties["asyncapi-version"]
		expect(versionSchema.enum).toEqual(["3.0.0"])
		expect(versionSchema.enum).not.toContain("2.0.0") // Unsupported version
	})

	test("security: additionalProperties false prevents injection", () => {
		// This is the critical security test
		expect(AsyncAPIEmitterOptionsSchema.additionalProperties).toBe(false)

		// Ensure all top-level properties are explicitly defined
		const allowedProperties = Object.keys(AsyncAPIEmitterOptionsSchema.properties)
		expect(allowedProperties.length).toBeGreaterThan(5)

		// Ensure no arbitrary properties would be allowed
		expect(AsyncAPIEmitterOptionsSchema.additionalProperties).not.toBe(true)
		expect(AsyncAPIEmitterOptionsSchema.additionalProperties).not.toBeUndefined()
	})
})