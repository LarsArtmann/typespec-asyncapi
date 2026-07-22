/**
 * Unit tests for AsyncAPI emitter core functionality - TypeSpec 1.4.0 API
 *
 * This is a MIGRATION from the old createTestWrapper API to the new
 * EmitterTester API that properly passes options.
 */

import { compileAsyncAPIWithoutErrors } from "../utils/test-helpers.js";
import { AsyncAPIAssertions, TestSources } from "../utils/test-helpers.js";
import {
  SERIALIZATION_FORMAT_OPTION_JSON,
  SERIALIZATION_FORMAT_OPTION_YAML,
} from "../utils/serialization-format-option.js";

describe("asyncAPI Emitter Core (NEW API)", () => {
  describe("basic Compilation", () => {
    it("should compile simple TypeSpec model to AsyncAPI", async () => {
      const result = await compileAsyncAPIWithoutErrors(TestSources.basicEvent, {
        "file-type": "json",
        "output-file": "basic",
      });

      // With new API, we get direct access to the document
      const asyncapiDoc = result.asyncApiDoc;

      expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBeTruthy();
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "BasicEvent")).toBeTruthy();
      expect(AsyncAPIAssertions.hasChannel(asyncapiDoc, "test.basic")).toBeTruthy();
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "publishBasicEvent")).toBeTruthy();
    });

    it("should handle complex nested models", async () => {
      const result = await compileAsyncAPIWithoutErrors(TestSources.complexEvent, {
        "file-type": "json",
        "output-file": "complex",
      });

      const asyncapiDoc = result.asyncApiDoc;

      expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBeTruthy();
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "ComplexEvent")).toBeTruthy();
      expect(AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "ComplexEvent", "id")).toBeTruthy();
      expect(
        AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "ComplexEvent", "metadata"),
      ).toBeTruthy();
      expect(
        AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "ComplexEvent", "status"),
      ).toBeTruthy();
    });

    it("should preserve TypeSpec documentation", async () => {
      const result = await compileAsyncAPIWithoutErrors(TestSources.withDocumentation, {
        "file-type": "json",
        "output-file": "documented",
      });

      const asyncapiDoc = result.asyncApiDoc;

      expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBeTruthy();

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

  describe("output Formats", () => {
    it("should generate valid JSON output", async () => {
      const result = await compileAsyncAPIWithoutErrors(TestSources.basicEvent, {
        "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
        "output-file": "json-test",
      });

      // Verify correct filename
      expect(result.outputFile).toBe("json-test.json");

      // Verify JSON content
      const content = result.outputs["json-test.json"];
      expect(content).toBeDefined();
      expect(() => JSON.parse(content)).not.toThrow();

      // Verify AsyncAPI structure
      expect(result.asyncApiDoc.asyncapi).toBe("3.1.0");
    });

    it("should generate valid YAML output", async () => {
      const result = await compileAsyncAPIWithoutErrors(TestSources.basicEvent, {
        "file-type": SERIALIZATION_FORMAT_OPTION_YAML,
        "output-file": "yaml-test",
      });

      // Verify correct filename
      expect(result.outputFile).toBe("yaml-test.yaml");

      // Verify YAML content
      const content = result.outputs["yaml-test.yaml"];
      expect(content).toBeDefined();
      expect(content).toContain("asyncapi: 3.1.0");
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

  describe("multiple Operations", () => {
    it("should handle multiple operations in single namespace", async () => {
      const result = await compileAsyncAPIWithoutErrors(TestSources.multipleOperations, {
        "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
        "output-file": "multi",
      });

      const asyncapiDoc = result.asyncApiDoc;

      expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBeTruthy();
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "UserEvent")).toBeTruthy();
      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "SystemEvent")).toBeTruthy();
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "publishUserEvent")).toBeTruthy();
      expect(AsyncAPIAssertions.hasOperation(asyncapiDoc, "publishSystemEvent")).toBeTruthy();
      expect(
        AsyncAPIAssertions.hasOperation(asyncapiDoc, "subscribeUserNotifications"),
      ).toBeTruthy();
    });

    it("should create unique channels for each operation", async () => {
      const result = await compileAsyncAPIWithoutErrors(TestSources.multipleOperations, {
        "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
        "output-file": "channels",
      });

      const asyncapiDoc = result.asyncApiDoc;

      expect(AsyncAPIAssertions.hasChannel(asyncapiDoc, "user.events")).toBeTruthy();
      expect(AsyncAPIAssertions.hasChannel(asyncapiDoc, "system.events")).toBeTruthy();
      expect(AsyncAPIAssertions.hasChannel(asyncapiDoc, "user.notifications")).toBeTruthy();

      // Test channel uniqueness
      const channelKeys = Object.keys(asyncapiDoc.channels);
      const uniqueChannels = new Set(channelKeys);
      expect(channelKeys).toHaveLength(uniqueChannels.size);
    });
  });

  describe("schema Generation", () => {
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
        "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
        "output-file": "required",
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
        "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
        "output-file": "union",
      });

      const asyncapiDoc = result.asyncApiDoc;

      expect(AsyncAPIAssertions.hasSchema(asyncapiDoc, "EventWithStatus")).toBeTruthy();
      expect(
        AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "EventWithStatus", "status"),
      ).toBeTruthy();
      expect(
        AsyncAPIAssertions.schemaHasProperty(asyncapiDoc, "EventWithStatus", "priority"),
      ).toBeTruthy();
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
        "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
        "output-file": "datetime",
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

  describe("error Handling", () => {
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
        "file-type": SERIALIZATION_FORMAT_OPTION_JSON,
        "output-file": "warning",
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
        "file-type": "json",
        "output-file": "empty",
      });

      const asyncapiDoc = result.asyncApiDoc;

      expect(AsyncAPIAssertions.hasValidStructure(asyncapiDoc)).toBeTruthy();
      expect(Object.keys(asyncapiDoc.channels || {})).toHaveLength(0);
      expect(Object.keys(asyncapiDoc.operations || {})).toHaveLength(0);
    });
  });
});
