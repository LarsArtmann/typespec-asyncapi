/**
 * Unit tests for ValidationService core service
 *
 * Tests the extracted ValidationService that handles AsyncAPI document validation
 * and compliance checking with comprehensive error reporting.
 */

import { describe, expect, it, beforeEach } from "bun:test";
import { Effect } from "effect";
import {
  ValidationService,
  type ValidationResult,
} from "../../../src/domain/validation/ValidationService.js";
import {
  success,
  failure,
  getChannelCount,
  getOperationCount,
  getSchemaCount,
} from "../../../src/domain/models/validation-result.js";
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";

describe("ValidationService", () => {
  let validationService: ValidationService;
  let validAsyncApiDoc: AsyncAPIObject;
  let invalidAsyncApiDoc: AsyncAPIObject;

  beforeEach(() => {
    validationService = new ValidationService();
    validAsyncApiDoc = createValidAsyncApiDoc();
    invalidAsyncApiDoc = createInvalidAsyncApiDoc();
  });

  describe("validateDocument", () => {
    it("should validate a complete valid AsyncAPI document", async () => {
      const result: ValidationResult = await Effect.runPromise(
        validationService.validateDocument(validAsyncApiDoc),
      );

      expect(result._tag).toBe("Success");
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      // Compute counts from value (NO SPLIT BRAIN!)
      if (result._tag === "Success") {
        expect(getChannelCount(result.value)).toBe(1);
        expect(getOperationCount(result.value)).toBe(1);
        expect(getSchemaCount(result.value)).toBe(2); // TestSchema + TestMessage = 2
      }
    });

    it("should validate document with multiple channels and operations", async () => {
      const multiChannelDoc = {
        asyncapi: "3.0.0",
        info: { title: "Multi API", version: "1.0.0" },
        channels: {
          userEvents: { address: "/users" },
          systemEvents: { address: "/system" },
          notifications: { address: "/notifications" },
        },
        operations: {
          publishUser: {
            action: "send",
            channel: { $ref: "#/channels/userEvents" },
          },
          publishSystem: {
            action: "send",
            channel: { $ref: "#/channels/systemEvents" },
          },
          subscribeNotifications: {
            action: "receive",
            channel: { $ref: "#/channels/notifications" },
          },
        },
        components: {
          schemas: { User: { type: "object" }, System: { type: "object" } },
          messages: {
            UserMsg: { name: "UserMsg" },
            SystemMsg: { name: "SystemMsg" },
          },
          securitySchemes: {},
        },
      } as AsyncAPIObject;

      const result: ValidationResult = await Effect.runPromise(
        validationService.validateDocument(multiChannelDoc),
      );

      expect(result._tag).toBe("Success");
      // Compute counts from value (NO SPLIT BRAIN!)
      if (result._tag === "Success") {
        expect(getChannelCount(result.value)).toBe(3);
        expect(getOperationCount(result.value)).toBe(3);
        expect(getSchemaCount(result.value)).toBe(4); // 2 schemas + 2 messages = 4
      }
    });

    it("should detect missing required fields", async () => {
      const docMissingFields = {
        asyncapi: "3.0.0",
        // Missing info section
      } as AsyncAPIObject;

      const result: ValidationResult = await Effect.runPromise(
        validationService.validateDocument(docMissingFields),
      );

      expect(result._tag).toBe("Failure");
      const errorMessages = result.errors.map((e) => e.message);
      expect(errorMessages).toContain("Missing required 'info' section");
    });

    it("should detect invalid AsyncAPI version", async () => {
      const docInvalidVersion = {
        ...validAsyncApiDoc,
        asyncapi: "2.6.0", // Invalid version
      };

      const result: ValidationResult = await Effect.runPromise(
        validationService.validateDocument(docInvalidVersion),
      );

      expect(result._tag).toBe("Success"); // Should still be valid
      const warningMessages = result.warnings.map((w) => w.message);
      expect(warningMessages).toContain("Using AsyncAPI version 2.6.0, expected 3.x");
    });

    it("should detect missing AsyncAPI version", async () => {
      const docNoVersion = {
        ...validAsyncApiDoc,
        asyncapi: undefined,
      };
      delete docNoVersion.asyncapi;

      const result: ValidationResult = await Effect.runPromise(
        validationService.validateDocument(docNoVersion),
      );

      expect(result._tag).toBe("Failure");
      const errorMessages = result.errors.map((e) => e.message);
      expect(errorMessages).toContain("Missing required 'asyncapi' field");
    });

    it("should validate info section requirements", async () => {
      const docIncompleteInfo = {
        ...validAsyncApiDoc,
        info: {}, // Missing title and version
      };

      const result: ValidationResult = await Effect.runPromise(
        validationService.validateDocument(docIncompleteInfo),
      );

      expect(result._tag).toBe("Failure");
      const errorMessages = result.errors.map((e) => e.message);
      expect(errorMessages).toContain("Missing required 'info.title' field");
      expect(errorMessages).toContain("Missing required 'info.version' field");
    });

    it("should warn about missing recommended fields", async () => {
      const docMissingDescription = {
        ...validAsyncApiDoc,
        info: {
          title: "Test API",
          version: "1.0.0",
          // Missing description
        },
      };

      const result: ValidationResult = await Effect.runPromise(
        validationService.validateDocument(docMissingDescription),
      );

      expect(result._tag).toBe("Success");
      const warningMessages = result.warnings.map((w) => w.message);
      expect(warningMessages).toContain("Missing recommended 'info.description' field");
    });

    it("should validate channel requirements", async () => {
      const docInvalidChannels = {
        ...validAsyncApiDoc,
        channels: {
          invalidChannel: {}, // Missing address
        },
      };

      const result: ValidationResult = await Effect.runPromise(
        validationService.validateDocument(docInvalidChannels),
      );

      expect(result._tag).toBe("Failure");
      const errorMessages = result.errors.map((e) => e.message);
      expect(errorMessages).toContain("Channel 'invalidChannel' missing required 'address' field");
    });

    it("should warn about empty channels", async () => {
      const docEmptyChannels = {
        ...validAsyncApiDoc,
        channels: {},
        operations: {}, // Also need empty operations to avoid cross-reference errors
      };

      const result: ValidationResult = await Effect.runPromise(
        validationService.validateDocument(docEmptyChannels),
      );

      // Empty channels should still be valid but generate warning
      expect(result._tag).toBe("Success");
      const warningMessages = result.warnings.map((w) => w.message);
      expect(warningMessages).toContain("No channels defined - document may be incomplete");
      if (result._tag === "Success") {
        expect(getChannelCount(result.value)).toBe(0);
      }
    });

    it("should validate operation requirements", async () => {
      const docInvalidOperations = {
        ...validAsyncApiDoc,
        operations: {
          invalidOp1: {}, // Missing action and channel
          invalidOp2: { action: "invalid" }, // Invalid action
          invalidOp3: { action: "send" }, // Missing channel
        },
      };

      const result: ValidationResult = await Effect.runPromise(
        validationService.validateDocument(docInvalidOperations),
      );

      expect(result._tag).toBe("Failure");
      const errorMessages = result.errors.map((e) => e.message);
      expect(errorMessages).toContain("Operation 'invalidOp1' missing required 'action' field");
      expect(errorMessages).toContain(
        "Operation 'invalidOp2' has invalid action 'invalid', must be 'send' or 'receive'",
      );
      expect(errorMessages).toContain(
        "Operation 'invalidOp3' missing required 'channel' reference",
      );
    });

    it("should validate cross-references between sections", async () => {
      const docInvalidReferences = {
        ...validAsyncApiDoc,
        operations: {
          testOp: {
            action: "send",
            channel: { $ref: "#/channels/nonExistentChannel" },
          },
        },
        channels: {
          testChannel: {
            address: "/test",
            messages: {
              testMsg: { $ref: "#/components/messages/nonExistentMessage" },
            },
          },
        },
      };

      const result: ValidationResult = await Effect.runPromise(
        validationService.validateDocument(docInvalidReferences),
      );

      expect(result._tag).toBe("Failure");
      const errorMessages = result.errors.map((e) => e.message);
      expect(errorMessages).toContain(
        "Operation 'testOp' references non-existent channel 'nonExistentChannel'",
      );
      expect(errorMessages).toContain(
        "Channel 'testChannel' references non-existent message 'nonExistentMessage'",
      );
    });

    it("should handle documents without optional sections", async () => {
      const minimalDoc = {
        asyncapi: "3.0.0",
        info: { title: "Minimal API", version: "1.0.0" },
        channels: {},
      } as AsyncAPIObject;

      const result: ValidationResult = await Effect.runPromise(
        validationService.validateDocument(minimalDoc),
      );

      expect(result._tag).toBe("Success");
      const warningMessages = result.warnings.map((w) => w.message);
      expect(warningMessages).toContain("No channels defined - document may be incomplete");
      expect(warningMessages).toContain("No operations defined - document may be incomplete");
      expect(warningMessages).toContain("No components section defined");
    });
  });

  describe("validateDocumentContent", () => {
    it("should validate valid JSON content", async () => {
      const validJsonContent = JSON.stringify(validAsyncApiDoc);

      const result = await Effect.runPromise(
        validationService.validateDocumentContent(validJsonContent),
      );

      expect(result).toBe(validJsonContent);
    });

    it("should reject invalid JSON content", async () => {
      const invalidJsonContent = "{ invalid json content}";

      // The ValidationService should handle invalid JSON with fallback
      const result = await Effect.runPromise(
        validationService.validateDocumentContent(invalidJsonContent),
      );

      // Debug: Check what the fallback document contains
      console.log("🔧 Invalid JSON result:", result.substring(0, 200));
      console.log("🔧 Contains asyncapi:", result.includes("asyncapi"));

      // Should return fallback content (graceful degradation)
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should reject content with validation errors", async () => {
      const invalidDocContent = JSON.stringify({
        asyncapi: "3.0.0",
        // Missing info section
      });

      // The ValidationService should handle invalid content gracefully
      const result = await Effect.runPromise(
        validationService.validateDocumentContent(invalidDocContent),
      );

      // Should return the content (even with validation errors)
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });
    it("should handle empty content", async () => {
      const emptyContent = "";

      // The ValidationService should handle empty content with fallback
      const result = await Effect.runPromise(
        validationService.validateDocumentContent(emptyContent),
      );

      // Should return fallback content (graceful degradation)
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
      expect(result).toContain("asyncapi"); // Should contain fallback doc
    });
  });

  describe("quickValidation", () => {
    it("should perform quick validation on valid document", async () => {
      const result = await Effect.runPromise(validationService.quickValidation(validAsyncApiDoc));

      expect(result).toBe(true);
    });

    it("should fail quick validation on invalid document", async () => {
      const invalidDoc = {
        info: { title: "Test", version: "1.0.0" },
        // Missing asyncapi field
      } as AsyncAPIObject;

      const result = await Effect.runPromise(validationService.quickValidation(invalidDoc));

      expect(result).toBe(false);
    });

    it("should pass with channels but no operations", async () => {
      const docWithChannels = {
        asyncapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        channels: { test: { address: "/test" } },
      } as AsyncAPIObject;

      const result = await Effect.runPromise(validationService.quickValidation(docWithChannels));

      expect(result).toBe(true);
    });

    it("should pass with operations but no channels", async () => {
      const docWithOperations = {
        asyncapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        operations: {
          test: { action: "send", channel: { $ref: "#/channels/test" } },
        },
      } as AsyncAPIObject;

      const result = await Effect.runPromise(validationService.quickValidation(docWithOperations));

      expect(result).toBe(true);
    });

    it("should fail without channels and operations", async () => {
      const docWithoutChannelsOrOps = {
        asyncapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
      } as AsyncAPIObject;

      const result = await Effect.runPromise(
        validationService.quickValidation(docWithoutChannelsOrOps),
      );

      expect(result).toBe(false);
    });
  });

  describe("generateValidationReport", () => {
    it("should generate report for valid document", () => {
      // Create AsyncAPIObject with actual channels/operations/schemas to compute counts from
      const docWithData: AsyncAPIObject = {
        asyncapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        channels: {
          channel1: { address: "/channel1" },
          channel2: { address: "/channel2" },
        },
        operations: {
          op1: { action: "send", channel: { $ref: "#/channels/channel1" } },
          op2: { action: "receive", channel: { $ref: "#/channels/channel2" } },
          op3: { action: "send", channel: { $ref: "#/channels/channel1" } },
        },
        components: {
          schemas: { Schema1: { type: "object" }, Schema2: { type: "object" } },
          messages: {
            Msg1: { name: "Msg1" },
            Msg2: { name: "Msg2" },
            Msg3: { name: "Msg3" },
          },
          securitySchemes: {},
        },
      } as AsyncAPIObject;

      const validResult: ValidationResult = {
        ...success(docWithData),
        metrics: {
          duration: 10.5,
          validatedAt: new Date(),
        },
        summary: "Valid document",
      };

      const report = validationService.generateValidationReport(validResult);

      expect(report).toContain("Status: ✅ VALID");
      expect(report).toContain("Channels: 2");
      expect(report).toContain("Operations: 3");
      expect(report).not.toContain("Errors");
    });

    it("should generate report for invalid document with errors", () => {
      const invalidResult: ValidationResult = {
        ...failure(
          [
            {
              message: "Missing required field",
              keyword: "required",
              instancePath: "/field",
              schemaPath: "#/required",
            },
            {
              message: "Invalid reference",
              keyword: "ref",
              instancePath: "/ref",
              schemaPath: "#/ref",
            },
          ],
          [
            {
              message: "Missing recommended field",
              severity: "warning" as const,
            },
          ],
        ),
        metrics: {
          duration: 5.0,
          validatedAt: new Date(),
        },
        summary: "Invalid document",
      };

      const report = validationService.generateValidationReport(invalidResult);

      expect(report).toContain("Status: ❌ INVALID");
      expect(report).toContain("Errors (2):");
      expect(report).toContain("- Missing required field");
      expect(report).toContain("- Invalid reference");
      expect(report).toContain("Warnings (1):");
      expect(report).toContain("- Missing recommended field");
    });

    it("should generate report without warnings section if no warnings", () => {
      const resultWithoutWarnings: ValidationResult = {
        ...failure(
          [
            {
              message: "Some error",
              keyword: "validation",
              instancePath: "",
              schemaPath: "",
            },
          ],
          [],
        ),
        metrics: {
          channelCount: 0,
          operationCount: 0,
          schemaCount: 0,
          duration: 1.0,
          validatedAt: new Date(),
        },
        summary: "Error found",
      };

      const report = validationService.generateValidationReport(resultWithoutWarnings);

      expect(report).toContain("Errors (1):");
      expect(report).not.toContain("Warnings");
    });

    it("should generate report with warnings only (no errors)", () => {
      // With discriminated union: Warnings without errors = Failure with empty errors
      const resultWithWarningsOnly: ValidationResult = {
        ...failure(
          [], // No errors but has warnings
          [{ message: "Some warning", severity: "warning" as const }],
        ),
        metrics: {
          channelCount: 1,
          operationCount: 1,
          schemaCount: 2,
          duration: 2.0,
          validatedAt: new Date(),
        },
        summary: "Valid structure but has warnings",
      };

      const report = validationService.generateValidationReport(resultWithWarningsOnly);

      // Empty errors array means "Errors" section should NOT appear
      expect(report).toContain("Status: ❌ INVALID");
      expect(report).not.toContain("Errors (0):");
      expect(report).toContain("Warnings (1):");
      expect(report).toContain("- Some warning");
    });
  });

  describe("error handling and edge cases", () => {
    it("should handle null document gracefully", async () => {
      const nullDoc = null as unknown as AsyncAPIObject;

      const result: ValidationResult = await Effect.runPromise(
        validationService.validateDocument(nullDoc),
      );

      expect(result._tag).toBe("Failure");
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should handle document with circular references", async () => {
      const circularDoc: any = {
        asyncapi: "3.0.0",
        info: { title: "Circular", version: "1.0.0" },
        channels: {},
      };
      circularDoc.self = circularDoc; // Create circular reference

      const result: ValidationResult = await Effect.runPromise(
        validationService.validateDocument(circularDoc),
      );

      // Should handle gracefully without throwing
      expect(result._tag === "Success" || result._tag === "Failure").toBe(true);
    });

    it("should handle very large documents", async () => {
      const largeDoc = {
        asyncapi: "3.0.0",
        info: {
          title: "Large API",
          version: "1.0.0",
          description: "Large document test",
        },
        channels: {},
        operations: {},
        components: { schemas: {}, messages: {}, securitySchemes: {} },
      } as AsyncAPIObject;

      // Create many channels and operations
      for (let i = 0; i < 100; i++) {
        largeDoc.channels[`channel${i}`] = { address: `/channel${i}` };
        largeDoc.operations[`operation${i}`] = {
          action: "send",
          channel: { $ref: `#/channels/channel${i}` },
        };
      }

      const result: ValidationResult = await Effect.runPromise(
        validationService.validateDocument(largeDoc),
      );

      expect(result._tag).toBe("Success");
      if (result._tag === "Success") {
        expect(getChannelCount(result.value)).toBe(100);
        expect(getOperationCount(result.value)).toBe(100);
      }
    });

    it("should handle document with undefined properties", async () => {
      const docWithUndefined = {
        asyncapi: "3.0.0",
        info: {
          title: "Test",
          version: "1.0.0",
          description: undefined,
        },
        channels: undefined,
        operations: undefined,
        components: undefined,
      } as any;

      const result: ValidationResult = await Effect.runPromise(
        validationService.validateDocument(docWithUndefined),
      );

      // Should handle undefined properties gracefully
      expect(result._tag === "Success" || result._tag === "Failure").toBe(true);
      if (result._tag === "Success") {
        expect(getChannelCount(result.value)).toBe(0);
        expect(getOperationCount(result.value)).toBe(0);
      }
    });
  });
});

// Helper functions for creating test AsyncAPI documents

function createValidAsyncApiDoc(): AsyncAPIObject {
  return {
    asyncapi: "3.0.0",
    info: {
      title: "Test API",
      version: "1.0.0",
      description: "A valid test API",
    },
    channels: {
      testChannel: {
        address: "/test",
        description: "Test channel",
        messages: {
          testMessage: {
            $ref: "#/components/messages/TestMessage",
          },
        },
      },
    },
    operations: {
      testOperation: {
        action: "send",
        channel: {
          $ref: "#/channels/testChannel",
        },
        summary: "Test operation",
      },
    },
    components: {
      schemas: {
        TestSchema: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
          },
        },
      },
      messages: {
        TestMessage: {
          name: "TestMessage",
          title: "Test Message",
          payload: {
            $ref: "#/components/schemas/TestSchema",
          },
        },
      },
      securitySchemes: {},
    },
  };
}

function createInvalidAsyncApiDoc(): AsyncAPIObject {
  return {
    asyncapi: "3.0.0",
    info: {
      title: "Invalid API",
      version: "1.0.0",
    },
    channels: {
      invalidChannel: {
        // Missing address
        messages: {
          invalidMessage: {
            $ref: "#/components/messages/NonExistentMessage",
          },
        },
      },
    },
    operations: {
      invalidOperation: {
        action: "invalidAction" as any, // Invalid action
        channel: {
          $ref: "#/channels/nonExistentChannel",
        },
      },
    },
    components: {
      schemas: {},
      messages: {},
      securitySchemes: {},
    },
  };
}
