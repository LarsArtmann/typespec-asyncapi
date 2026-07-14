/**
 * Unit tests for AsyncAPI emitter core functionality - TypeSpec 1.4.0 API
 *
 * This is a MIGRATION from the old createTestWrapper API to the new
 * EmitterTester API that properly passes options.
 */

import { describe, expect, it } from "bun:test";
import { compileAsyncAPIWithoutErrors } from "../utils/emitter-test-helpers.js";
import { AsyncAPIAssertions, TestSources } from "../utils/test-helpers.js";
import {
  SERIALIZATION_FORMAT_OPTION_JSON,
  SERIALIZATION_FORMAT_OPTION_YAML,
} from "../../src/domain/models/serialization-format-option.js";

describe("AsyncAPI Emitter Core (NEW API)", () => {
  describe("Basic Compilation", () => {
    it("should compile simple TypeSpec model to AsyncAPI", async () => {
      const result = await compileAsyncAPIWithoutErrors(TestSources.basicEvent, {
        "output-file": "basic",
        "file-type": "json",
      });

      // With new API, we get direct access to the document
      const asyncapiDoc = result.asyncApiDoc;

      expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "BasicEvent")).toBe(true);
      expect(AsyncAPIAssertions.hasChannel(asyncapiDoc, "test.basic")).toBe(true);
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "publishBasicEvent")).toBe(true);
    });

    it("should handle complex nested models", async () => {
      const result = await compileAsyncAPIWithoutErrors(TestSources.complexEvent, {
        "output-file": "complex",
        "file-type": "json",
      });

      const asyncapiDoc = result.asyncApiDoc;

      expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "ComplexEvent")).toBe(true);
      expect(AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "ComplexEvent", "id")).toBe(true);
      expect(AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "ComplexEvent", "metadata")).toBe(
        true,
      );
      expect(AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "ComplexEvent", "status")).toBe(
        true,
      );
    });

    it("should preserve TypeSpec documentation", async () => {
      const result = await compileAsyncAPIWithoutErrors(TestSources.withDocumentation, {
        "output-file": "documented",
        "file-type": "json",
      });

      const asyncapiDoc = result.asyncApiDoc;

      expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBe(true);

      if (AsyncAPIAssertions.hasSchema(asyncapiDoc, "DocumentedEvent")) {
        const schema = asyncapiDoc.components.schemas.DocumentedEvent;

        // Test documentation
        AsyncAPIAssertions.hasDocumentation(schema, "Fully documented event model");

        // Test property documentation
        if (schema?.properties?.id) {
          AsyncAPIAssertions.hasDocumentation(schema.properties.id, "Primary identifier");
        }
      }
    });
  });

  describe("Output Formats", () => {
    it("should generate valid JSON output", async () => {
      const result = await compileAsyncAPIWithoutErrors(TestSources.basicEvent, {
        "output-file": "json-test",
        "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
      });

      // Verify correct filename
      expect(result.outputFile).toBe("json-test.json");

      // Verify JSON content
      const content = result.outputs["json-test.json"];
      expect(content).toBeDefined();
      expect(() => JSON.parse(content)).not.toThrow();

      // Verify AsyncAPI structure
      expect(result.asyncApiDoc.asyncapi).toBe("3.0.0");
    });

    it("should generate valid YAML output", async () => {
      const result = await compileAsyncAPIWithoutErrors(TestSources.basicEvent, {
        "output-file": "yaml-test",
        "file-type": SERIALIZATION_FORMAT_OPTION_YAML,
      });

      // Verify correct filename
      expect(result.outputFile).toBe("yaml-test.yaml");

      // Verify YAML content
      const content = result.outputs["yaml-test.yaml"];
      expect(content).toBeDefined();
      expect(content).toContain("asyncapi: 3.0.0");
      expect(content).toContain("channels:");
      expect(content).toContain("operations:");
    });

    it("should default to YAML when no file-type specified", async () => {
      const result = await compileAsyncAPIWithoutErrors(TestSources.basicEvent, {
        "output-file": "default-format",
      });

      // Should generate YAML by default
      expect(result.outputFile).toBe("default-format.yaml");
    });

    it("should default filename when no output-file specified", async () => {
      const result = await compileAsyncAPIWithoutErrors(TestSources.basicEvent, {
        "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
      });

      // Should use default filename "asyncapi"
      expect(result.outputFile).toBe("asyncapi.json");
    });
  });

  describe("Multiple Operations", () => {
    it("should handle multiple operations in single namespace", async () => {
      const result = await compileAsyncAPIWithoutErrors(TestSources.multipleOperations, {
        "output-file": "multi",
        "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
      });

      const asyncapiDoc = result.asyncApiDoc;

      expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "UserEvent")).toBe(true);
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "SystemEvent")).toBe(true);
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "publishUserEvent")).toBe(true);
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "publishSystemEvent")).toBe(true);
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "subscribeUserNotifications")).toBe(true);
    });

    it("should create unique channels for each operation", async () => {
      const result = await compileAsyncAPIWithoutErrors(TestSources.multipleOperations, {
        "output-file": "channels",
        "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
      });

      const asyncapiDoc = result.asyncApiDoc;

      expect(AsyncAPIAssertions.hasChannel(asyncapiDoc, "user.events")).toBe(true);
      expect(AsyncAPIAssertions.hasChannel(asyncapiDoc, "system.events")).toBe(true);
      expect(AsyncAPIAssertions.hasChannel(asyncapiDoc, "user.notifications")).toBe(true);

      // Test channel uniqueness
      const channelKeys = Object.keys(asyncapiDoc.channels);
      const uniqueChannels = new Set(channelKeys);
      expect(channelKeys.length).toBe(uniqueChannels.size);
    });
  });

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
      `;

      const result = await compileAsyncAPIWithoutErrors(source, {
        "output-file": "required",
        "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
      });

      const asyncapiDoc = result.asyncApiDoc;

      if (AsyncAPIAssertions.hasSchema(asyncapiDoc, "TestModel")) {
        const schema = asyncapiDoc.components.schemas.TestModel;

        expect(schema.required).toContain("requiredField");
        expect(schema.required).toContain("alsoRequired");
        expect(schema.required).not.toContain("optionalField");
      }
    });

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
      `;

      const result = await compileAsyncAPIWithoutErrors(source, {
        "output-file": "union",
        "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
      });

      const asyncapiDoc = result.asyncApiDoc;

      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "EventWithStatus")).toBe(true);
      expect(AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "EventWithStatus", "status")).toBe(
        true,
      );
      expect(AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "EventWithStatus", "priority")).toBe(
        true,
      );
    });

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
      `;

      const result = await compileAsyncAPIWithoutErrors(source, {
        "output-file": "datetime",
        "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
      });

      const asyncapiDoc = result.asyncApiDoc;

      if (AsyncAPIAssertions.hasSchema(asyncapiDoc, "TimedEvent")) {
        const schema = asyncapiDoc.components.schemas.TimedEvent;

        if (schema?.properties?.createdAt) {
          expect(schema.properties.createdAt.type).toBe("string");
          expect(schema.properties.createdAt.format).toBe("date-time");
        }

        if (schema?.properties?.updatedAt) {
          expect(schema.properties.updatedAt.type).toBe("string");
          expect(schema.properties.updatedAt.format).toBe("date-time");
        }
      }
    });
  });

  describe("Error Handling", () => {
    it("should compile successfully with warnings", async () => {
      const source = `
        namespace WarningTest;

        model SimpleEvent {
          id: string;
        }

        @channel("warning-test")
        op publishSimpleEvent(): SimpleEvent;
      `;

      const result = await compileAsyncAPIWithoutErrors(source, {
        "output-file": "warning",
        "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
      });

      // Should have output even with warnings
      expect(Object.keys(result.outputs).length).toBeGreaterThan(0);

      // Diagnostics are available if needed
      const errors = result.diagnostics.filter((d) => d.severity === "error");
      expect(errors).toHaveLength(0);
    });

    it("should handle empty operations gracefully", async () => {
      const source = `
        namespace EmptyTest;

        model EmptyModel {
          id: string;
        }

        // No operations defined - should still generate valid AsyncAPI
      `;

      const result = await compileAsyncAPIWithoutErrors(source, {
        "output-file": "empty",
        "file-type": "json",
      });

      const asyncapiDoc = result.asyncApiDoc;

      expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBe(true);
      expect(Object.keys(asyncapiDoc.channels || {})).toHaveLength(0);
      expect(Object.keys(asyncapiDoc.operations || {})).toHaveLength(0);
    });
  });
});
