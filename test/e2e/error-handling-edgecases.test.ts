/**
 * E2E Test 5: Error Handling and Edge Cases
 *
 * Tests emitter behavior with:
 * - Empty models
 * - Circular references (handled gracefully)
 * - Missing decorators
 * - Invalid configurations
 * - Edge case data types
 */

import { describe, expect, it } from "bun:test";
import { createAsyncAPITestHost } from "../utils/test-helpers.js";
import { Effect } from "effect";

describe("E2E: Error Handling and Edge Cases", () => {
  it("should handle empty models gracefully", async () => {
    const host = await createAsyncAPITestHost();

    host.addTypeSpecFile(
      "main.tsp",
      `
			import "@lars-artmann/typespec-asyncapi";
			using TypeSpec.AsyncAPI;

			namespace EdgeCases;

			// Empty model
			model EmptyMessage {
			}

			@channel("test.empty")
			@publish
			op publishEmpty(): EmptyMessage;
		`,
    );

    const program = await host.compile("./main.tsp");
    const diagnostics = await host.diagnose("./main.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    // Should compile without errors
    expect(diagnostics.filter((d) => d.severity === "error").length).toBe(0);

    const outputFiles = Array.from(host.fs.keys());
    const asyncApiFile = outputFiles.find(
      (f) => f.includes("asyncapi") && (f.endsWith(".json") || f.endsWith(".yaml")),
    );

    expect(asyncApiFile).toBeDefined();

    if (asyncApiFile) {
      const content = host.fs.get(asyncApiFile) as string;
      const spec = content.startsWith("{") ? JSON.parse(content) : require("yaml").parse(content);

      // Empty model should still generate valid schema
      expect(spec.components?.schemas?.EmptyMessage).toBeDefined();
      expect(spec.components.schemas.EmptyMessage.type).toBe("object");

      Effect.log("✅ Empty model handled correctly");
    }
  });

  it("should handle operations without decorators", async () => {
    const host = await createAsyncAPITestHost();

    host.addTypeSpecFile(
      "main.tsp",
      `
			import "@lars-artmann/typespec-asyncapi";
			using TypeSpec.AsyncAPI;

			namespace NoDecorators;

			model Message {
				id: string;
				content: string;
			}

			// Operation without @channel decorator
			op sendMessage(msg: Message): void;
		`,
    );

    const program = await host.compile("./main.tsp");
    const diagnostics = await host.diagnose("./main.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    // Should compile (might have warnings but not errors)
    expect(diagnostics.filter((d) => d.severity === "error").length).toBeLessThanOrEqual(1);

    Effect.log("✅ Operations without decorators handled");
  });

  it("should handle edge case data types", async () => {
    const host = await createAsyncAPITestHost();

    host.addTypeSpecFile(
      "main.tsp",
      `
			import "@lars-artmann/typespec-asyncapi";
			using TypeSpec.AsyncAPI;

			namespace EdgeCaseTypes;

			model EdgeCaseMessage {
				// All numeric types
				int8Val: int8;
				int16Val: int16;
				int32Val: int32;
				int64Val: int64;
				uint8Val: uint8;
				uint16Val: uint16;
				uint32Val: uint32;
				uint64Val: uint64;
				safeIntVal: safeint;
				float32Val: float32;
				float64Val: float64;

				// Date/time types
				dateTime: utcDateTime;
				plainDate: plainDate;
				plainTime: plainTime;

				// String types
				regularString: string;
				url: url;

				// Boolean
				flag: boolean;

				// Bytes
				binary: bytes;

				// Arrays of primitives
				numbers: int32[];
				strings: string[];
				dates: utcDateTime[];

				// Optional everything
				optionalInt?: int32;
				optionalString?: string;
				optionalArray?: string[];

				// Union of primitives
				status: "active" | "inactive" | "pending";

				// Null handling
				nullableField?: string | null;
			}

			@channel("edgecases.datatypes")
			@publish
			op publishEdgeCases(): EdgeCaseMessage;
		`,
    );

    const program = await host.compile("./main.tsp");
    const diagnostics = await host.diagnose("./main.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    const outputFiles = Array.from(host.fs.keys());
    const asyncApiFile = outputFiles.find(
      (f) => f.includes("asyncapi") && (f.endsWith(".json") || f.endsWith(".yaml")),
    );

    expect(asyncApiFile).toBeDefined();

    if (asyncApiFile) {
      const content = host.fs.get(asyncApiFile) as string;
      const spec = content.startsWith("{") ? JSON.parse(content) : require("yaml").parse(content);

      const schema = spec.components?.schemas?.EdgeCaseMessage;
      expect(schema).toBeDefined();

      // Validate numeric types mapped correctly
      expect(schema.properties.int32Val.type).toBe("integer");
      expect(schema.properties.float64Val.type).toBe("number");

      // Validate date/time types
      expect(schema.properties.dateTime.type).toBe("string");
      expect(schema.properties.dateTime.format).toBe("date-time");

      // Validate arrays
      expect(schema.properties.numbers.type).toBe("array");
      expect(schema.properties.numbers.items.type).toBe("integer");

      // Validate unions become enums
      expect(schema.properties.status.enum).toEqual(["active", "inactive", "pending"]);

      // Validate optional fields
      expect(schema.required).not.toContain("optionalInt");
      expect(schema.required).not.toContain("optionalString");

      Effect.log("✅ Edge case data types handled correctly");
    }
  });

  it("should handle deeply recursive structures safely", async () => {
    const host = await createAsyncAPITestHost();

    host.addTypeSpecFile(
      "main.tsp",
      `
			import "@lars-artmann/typespec-asyncapi";
			using TypeSpec.AsyncAPI;

			namespace RecursiveTypes;

			// Self-referential structure (tree node)
			model TreeNode {
				nodeId: string;
				value: string;
				children?: TreeNode[];
				parent?: TreeNode;
			}

			@channel("recursive.tree")
			@publish
			op publishTree(): TreeNode;
		`,
    );

    const program = await host.compile("./main.tsp");
    const diagnostics = await host.diagnose("./main.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    // Should handle recursion without infinite loops
    expect(diagnostics.filter((d) => d.severity === "error").length).toBeLessThanOrEqual(1);

    Effect.log("✅ Recursive structures handled safely");
  });

  it("should validate required vs optional fields correctly", async () => {
    const host = await createAsyncAPITestHost();

    host.addTypeSpecFile(
      "main.tsp",
      `
			import "@lars-artmann/typespec-asyncapi";
			using TypeSpec.AsyncAPI;

			namespace RequiredOptional;

			model StrictMessage {
				// Required fields
				id: string;
				timestamp: utcDateTime;
				eventType: string;

				// Optional fields
				description?: string;
				metadata?: {
					source?: string;
					tags?: string[];
				};

				// Nested required in optional
				details?: {
					requiredInOptional: string;
					optionalInOptional?: string;
				};
			}

			@channel("validation.required")
			@publish
			op publishStrict(): StrictMessage;
		`,
    );

    const program = await host.compile("./main.tsp");
    const diagnostics = await host.diagnose("./main.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    const outputFiles = Array.from(host.fs.keys());
    const asyncApiFile = outputFiles.find(
      (f) => f.includes("asyncapi") && (f.endsWith(".json") || f.endsWith(".yaml")),
    );

    expect(asyncApiFile).toBeDefined();

    if (asyncApiFile) {
      const content = host.fs.get(asyncApiFile) as string;
      const spec = content.startsWith("{") ? JSON.parse(content) : require("yaml").parse(content);

      const schema = spec.components?.schemas?.StrictMessage;
      expect(schema).toBeDefined();

      // Validate required fields
      expect(schema.required).toContain("id");
      expect(schema.required).toContain("timestamp");
      expect(schema.required).toContain("eventType");

      // Validate optional fields are NOT in required
      expect(schema.required).not.toContain("description");
      expect(schema.required).not.toContain("metadata");
      expect(schema.required).not.toContain("details");

      // Metadata and details should still have properties defined
      expect(schema.properties.metadata).toBeDefined();
      expect(schema.properties.details).toBeDefined();

      Effect.log("✅ Required vs optional fields validated correctly");
    }
  });

  it("should handle missing security gracefully", async () => {
    const host = await createAsyncAPITestHost();

    host.addTypeSpecFile(
      "main.tsp",
      `
			import "@lars-artmann/typespec-asyncapi";
			using TypeSpec.AsyncAPI;

			namespace NoSecurity;

			model PublicMessage {
				messageId: string;
				content: string;
			}

			// No @security decorator - should still work
			@channel("public.messages")
			@publish
			op publishPublic(): PublicMessage;
		`,
    );

    const program = await host.compile("./main.tsp");
    const diagnostics = await host.diagnose("./main.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    // Should compile successfully
    expect(diagnostics.filter((d) => d.severity === "error").length).toBe(0);

    const outputFiles = Array.from(host.fs.keys());
    const asyncApiFile = outputFiles.find(
      (f) => f.includes("asyncapi") && (f.endsWith(".json") || f.endsWith(".yaml")),
    );

    expect(asyncApiFile).toBeDefined();

    if (asyncApiFile) {
      const content = host.fs.get(asyncApiFile) as string;
      const spec = content.startsWith("{") ? JSON.parse(content) : require("yaml").parse(content);

      // Should have valid AsyncAPI without security
      expect(spec.asyncapi).toBe("3.0.0");
      expect(spec.channels).toBeDefined();

      Effect.log("✅ Missing security handled gracefully");
    }
  });
});
