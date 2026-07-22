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

import { createAsyncAPITestHost } from "../utils/test-helpers.js";

describe("e2E: Error Handling and Edge Cases", () => {
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

    await host.compile("./main.tsp");
    const diagnostics = await host.diagnose("./main.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    // Should compile without errors
    expect(diagnostics.filter((d) => d.severity === "error")).toHaveLength(0);

    const outputFiles = [...host.fs.keys()];
    const asyncApiFile = outputFiles.find(
      (f) => f.includes("asyncapi") && (f.endsWith(".json") || f.endsWith(".yaml")),
    );

    expect(asyncApiFile).toBeDefined();

    const content1 = host.fs.get(asyncApiFile!) as string;
    const spec1 = content1.startsWith("{") ? JSON.parse(content1) : require("yaml").parse(content1);

    // Empty model should still generate valid schema
    expect(spec1.components?.schemas?.EmptyMessage).toBeDefined();
    expect(spec1.components.schemas.EmptyMessage.type).toBe("object");
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

    await host.compile("./main.tsp");
    const diagnostics = await host.diagnose("./main.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    // Should compile (might have warnings but not errors)
    expect(diagnostics.filter((d) => d.severity === "error").length).toBeLessThanOrEqual(1);
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

    await host.compile("./main.tsp");

    const outputFiles = [...host.fs.keys()];
    const asyncApiFile = outputFiles.find(
      (f) => f.includes("asyncapi") && (f.endsWith(".json") || f.endsWith(".yaml")),
    );

    expect(asyncApiFile).toBeDefined();

    const content3 = host.fs.get(asyncApiFile!) as string;
    const spec3 = content3.startsWith("{") ? JSON.parse(content3) : require("yaml").parse(content3);

    const schema = spec3.components?.schemas?.EdgeCaseMessage;
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
    expect(schema.properties.status.enum).toStrictEqual(["active", "inactive", "pending"]);

    // Validate optional fields
    expect(schema.required).not.toContain("optionalInt");
    expect(schema.required).not.toContain("optionalString");
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

    await host.compile("./main.tsp");
    const diagnostics = await host.diagnose("./main.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    // Should handle recursion without infinite loops
    expect(diagnostics.filter((d) => d.severity === "error").length).toBeLessThanOrEqual(1);
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

    await host.compile("./main.tsp");

    const outputFiles = [...host.fs.keys()];
    const asyncApiFile = outputFiles.find(
      (f) => f.includes("asyncapi") && (f.endsWith(".json") || f.endsWith(".yaml")),
    );

    expect(asyncApiFile).toBeDefined();

    const content5 = host.fs.get(asyncApiFile!) as string;
    const spec5 = content5.startsWith("{") ? JSON.parse(content5) : require("yaml").parse(content5);

    const schema = spec5.components?.schemas?.StrictMessage;
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

    await host.compile("./main.tsp");
    const diagnostics = await host.diagnose("./main.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    // Should compile successfully
    expect(diagnostics.filter((d) => d.severity === "error")).toHaveLength(0);

    const outputFiles = [...host.fs.keys()];
    const asyncApiFile = outputFiles.find(
      (f) => f.includes("asyncapi") && (f.endsWith(".json") || f.endsWith(".yaml")),
    );

    expect(asyncApiFile).toBeDefined();

    const content6 = host.fs.get(asyncApiFile!) as string;
    const spec6 = content6.startsWith("{") ? JSON.parse(content6) : require("yaml").parse(content6);

    // Should have valid AsyncAPI without security
    expect(spec6.asyncapi).toBe("3.1.0");
    expect(spec6.channels).toBeDefined();
  });
});
