/**
 * Integration tests for TypeSpec decorator validation in AsyncAPI emitter
 */

import { compileAsyncAPISpec } from "../utils/test-helpers.js";

describe("asyncAPI Decorator Validation", () => {
  describe("@channel decorator", () => {
    it("should accept valid channel paths", async () => {
      const source = `
        namespace ChannelTest;
        
        model Event { id: string; }
        
        @channel("user.events")
        op validChannel1(): Event;
        
        @channel("system_alerts")
        op validChannel2(): Event;
        
        @channel("notifications-v2")
        op validChannel3(): Event;
        
        @channel("events.user.{userId}")
        op validChannelWithParam(): Event;
      `;

      const { diagnostics } = await compileAsyncAPISpec(source, {
        "file-type": "json",
        "output-file": "channel-valid",
      });

      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors).toHaveLength(0);
    });

    it("should report missing-channel-path for an empty channel path", async () => {
      const source = `
        namespace ChannelValidationTest;
        
        model Event { id: string; }
        
        @channel("")
        op emptyChannel(): Event;
        
        @channel("valid.channel")
        op validChannel(): Event;
      `;

      const { diagnostics } = await compileAsyncAPISpec(source, {
        "file-type": "json",
        "output-file": "channel-validation",
      });

      const channelErrors = diagnostics.filter(
        (d) =>
          d.code === "@lars-artmann/typespec-asyncapi/missing-channel-path",
      );
      expect(channelErrors).toHaveLength(1);
    });

    it("should compile operations without @channel without errors", async () => {
      const source = `
        namespace MissingChannelTest;
        
        model Event { id: string; }
        
        op missingChannelOp(): Event;
        
        @channel("valid.channel")
        op validOp(): Event;
      `;

      const { diagnostics } = await compileAsyncAPISpec(source, {
        "file-type": "json",
        "output-file": "missing-channel",
      });

      // Channel-less operations are emitted without a channel link, not rejected
      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors).toHaveLength(0);
    });
  });

  describe("operation type validation", () => {
    it("should handle @publish and @subscribe decorators", async () => {
      const source = `
        namespace OperationTypeTest;
        
        model Event { id: string; }
        
        @channel("publish.events")
        @publish
        op publishEvent(): Event;
        
        @channel("subscribe.events")  
        @subscribe
        op subscribeEvent(): Event;
        
        // Operation without explicit type (should work)
        @channel("default.events")
        op defaultTypeEvent(): Event;
      `;

      const { diagnostics, outputFiles } = await compileAsyncAPISpec(source, {
        "file-type": "json",
        "output-file": "operation-types",
      });

      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors).toHaveLength(0);

      // Should generate output for all valid operations
      expect(outputFiles.size).toBeGreaterThan(0);
    });

    it("should not error when both @publish and @subscribe are applied (outermost wins)", async () => {
      const source = `
        namespace ConflictTest;
        
        model Event { id: string; }
        
        @channel("conflicting.events")
        @publish
        @subscribe
        op conflictingOperation(): Event;
        
        @channel("valid.events")
        @publish
        op validOperation(): Event;
      `;

      const { diagnostics, outputFiles } = await compileAsyncAPISpec(source, {
        "file-type": "json",
        "output-file": "conflict-test",
      });

      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors).toHaveLength(0);

      // Decorators run bottom-up, so the outermost @publish executes last and wins
      const doc = JSON.parse(outputFiles.get("conflict-test.json")!);
      expect(doc.operations.conflictingOperation.action).toBe("send");
    });
  });

  describe("model validation", () => {
    it("should handle models with all supported field types", async () => {
      const source = `
        namespace ModelValidationTest;
        
        model CompleteEvent {
          // Basic types
          stringField: string;
          numberField: int32;
          booleanField: boolean;
          
          // DateTime
          timestamp: utcDateTime;
          
          // Optional fields
          optionalString?: string;
          optionalNumber?: int32;
          
          // Union types
          status: "pending" | "complete" | "failed";
          
          // Array types  
          tags: string[];
          
          // Nested objects
          metadata: {
            source: string;
            version: int32;
          };
        }
        
        @channel("complete.events")
        op publishCompleteEvent(): CompleteEvent;
      `;

      const { diagnostics, outputFiles } = await compileAsyncAPISpec(source, {
        "file-type": "json",
        "output-file": "model-validation",
      });

      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors).toHaveLength(0);

      // Should generate schema for complex model
      expect(outputFiles.size).toBeGreaterThan(0);

      const outputFile = outputFiles.get("model-validation.json");
      expect(outputFile).toBeDefined();
      const asyncapiDoc = JSON.parse(outputFile!);
      const schema = asyncapiDoc.components?.schemas?.CompleteEvent;
      expect(schema).toBeDefined();
      expect(schema.properties).toBeDefined();
      expect(schema.required).toBeDefined();
    });

    it("should handle recursive models appropriately", async () => {
      const source = `
        namespace RecursiveTest;
        
        model TreeNode {
          id: string;
          name: string;
          children: TreeNode[];
        }
        
        @channel("tree.events")
        op publishTreeEvent(): TreeNode;
      `;

      const { diagnostics, outputFiles } = await compileAsyncAPISpec(source, {
        "file-type": "json",
        "output-file": "recursive-test",
      });

      // Recursive models terminate and emit a self-referencing $ref
      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors).toHaveLength(0);

      const doc = JSON.parse(outputFiles.get("recursive-test.json")!);
      expect(doc.components.schemas.TreeNode.properties.children).toStrictEqual(
        {
          type: "array",
          items: { $ref: "#/components/schemas/TreeNode" },
        },
      );
    });
  });

  describe("documentation validation", () => {
    it("should preserve @doc decorations", async () => {
      const source = `
        @doc("Documentation test namespace")
        namespace DocValidationTest;
        
        @doc("Event model with comprehensive documentation")
        model DocumentedEvent {
          @doc("Unique event identifier")
          id: string;
          
          @doc("Human-readable event name")
          name: string;
          
          @doc("Event creation timestamp in UTC")
          createdAt: utcDateTime;
          
          @doc("Optional event description")
          description?: string;
        }
        
        @channel("documented.events")
        @doc("Channel for publishing well-documented events")
        op publishDocumentedEvent(): DocumentedEvent;
      `;

      const { diagnostics, outputFiles } = await compileAsyncAPISpec(source, {
        "file-type": "json",
        "output-file": "doc-validation",
      });

      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors).toHaveLength(0);

      const outputFile = outputFiles.get("doc-validation.json");
      expect(outputFile).toBeDefined();
      const asyncapiDoc = JSON.parse(outputFile!);

      // Validate documentation preservation
      const schema = asyncapiDoc.components?.schemas?.DocumentedEvent;
      expect(schema?.description).toContain(
        "Event model with comprehensive documentation",
      );
      expect(schema?.properties).toBeDefined();
      expect(schema!.properties!.id?.description).toContain(
        "Unique event identifier",
      );
      expect(schema!.properties!.name?.description).toContain(
        "Human-readable event name",
      );
      expect(schema!.properties!.createdAt?.description).toContain(
        "Event creation timestamp",
      );

      // Validate channel documentation
      const { channels } = asyncapiDoc;
      expect(channels).toBeDefined();
      const channelKeys = Object.keys(channels!);
      expect(channelKeys.length).toBeGreaterThan(0);
      const firstChannel = channels![channelKeys[0]];
      expect(firstChannel).toBeDefined();
      expect(firstChannel?.messages).toBeDefined();
    });
  });

  describe("parameter validation", () => {
    it("should handle operations with parameters", async () => {
      const source = `
        namespace ParameterTest;
        
        model UserEvent {
          action: string;
          timestamp: utcDateTime;
        }
        
        @channel("user.{userId}.events")
        op subscribeUserEvents(
          @doc("User identifier")
          userId: string
        ): UserEvent;
        
        @channel("system.events")
        op subscribeSystemEvents(
          @doc("Component name filter")
          component?: string,
          
          @doc("Minimum severity level")
          minLevel?: "info" | "warning" | "error"
        ): UserEvent;
      `;

      const { diagnostics, outputFiles } = await compileAsyncAPISpec(source, {
        "file-type": "json",
        "output-file": "parameter-test",
      });

      const errors = diagnostics.filter((d) => d.severity === "error");
      expect(errors).toHaveLength(0);

      // Should handle parameterized operations
      expect(outputFiles.size).toBeGreaterThan(0);
    });
  });
});
