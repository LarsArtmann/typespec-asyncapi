/**
 * Unit tests for DocumentBuilder core service
 *
 * Tests the extracted DocumentBuilder service that handles AsyncAPI document
 * construction, initialization, and component setup.
 *
 * NOTE: All methods return NEW documents (immutable pattern) - tests must capture return values.
 */

import { describe, expect, it, beforeEach } from "bun:test";
import type { Program } from "@typespec/compiler";
import { DocumentBuilder } from "../../../src/domain/emitter/DocumentBuilder.js";
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";
import { Effect } from "effect";
import { stateSymbols } from "../../../src/lib.js";

describe("DocumentBuilder", () => {
  let documentBuilder: DocumentBuilder;
  let mockProgram: Program;

  beforeEach(() => {
    documentBuilder = new DocumentBuilder();

    // Mock TypeSpec Program for testing
    mockProgram = {
      getGlobalNamespaceType: () => ({
        name: "TestNamespace",
        operations: new Map(),
        models: new Map(),
        namespaces: new Map(),
      }),
    } as unknown as Program;
  });

  describe("createInitialDocument", () => {
    it("should create valid AsyncAPI 3.0 document structure", () => {
      const documentEffect = documentBuilder.createInitialDocument(mockProgram);
      const document = Effect.runSync(documentEffect);

      // Verify AsyncAPI version
      expect(document.asyncapi).toBe("3.0.0");

      // Verify info section
      expect(document.info).toBeDefined();
      expect(document.info.title).toBe("AsyncAPI Specification");
      expect(document.info.version).toBe("1.0.0");
      expect(document.info.description).toBe(
        "Generated from TypeSpec with @lars-artmann/typespec-asyncapi",
      );

      // Verify document structure
      expect(document.channels).toEqual({});
      expect(document.operations).toEqual({});

      // Verify components structure
      expect(document.components).toBeDefined();
      expect(document.components!.schemas).toEqual({});
      expect(document.components!.messages).toEqual({});
      expect(document.components!.securitySchemes).toEqual({});
    });

    it("should handle program without getGlobalNamespaceType", () => {
      const programWithoutMethod = {} as Program;

      const documentEffect = documentBuilder.createInitialDocument(programWithoutMethod);
      const document = Effect.runSync(documentEffect);

      // Should still create valid document structure
      expect(document.asyncapi).toBe("3.0.0");
      expect(document.info).toBeDefined();
      expect(document.components).toBeDefined();
    });

    it("should include servers from namespace processing", () => {
      const mockServerConfig = {
        url: "kafka://localhost:9092",
        protocol: "kafka",
        description: "Test Kafka server",
      };

      // Create a proper stateMap that returns a Map with server configs
      const serverConfigsMap = new Map();
      serverConfigsMap.set({ name: "testServer" }, mockServerConfig);

      const mockProgramWithServers = {
        getGlobalNamespaceType: () => ({
          name: "TestNamespace",
          operations: new Map(),
          models: new Map(),
          namespaces: new Map(),
        }),
        stateMap: (key: symbol) => {
          // Only return the server configs when the right symbol is used
          if (key === stateSymbols.serverConfigs) {
            return serverConfigsMap;
          }
          return new Map();
        },
      } as unknown as Program;

      const documentEffect = documentBuilder.createInitialDocument(mockProgramWithServers);
      const document = Effect.runSync(documentEffect);

      // Servers should be processed
      expect(document.servers).toBeDefined();
      expect(document.servers).toHaveProperty("testServer");
    });
  });

  describe("updateDocumentInfo", () => {
    let baseDocument: AsyncAPIObject;

    beforeEach(() => {
      const baseDocumentEffect = documentBuilder.createInitialDocument(mockProgram);
      baseDocument = Effect.runSync(baseDocumentEffect);
    });

    it("should update document info with partial configuration", () => {
      const customInfo = {
        title: "Custom API Title",
        description: "Custom description",
      };

      const updateEffect = documentBuilder.updateDocumentInfo(baseDocument, customInfo);
      const updatedDocument = Effect.runSync(updateEffect);

      expect(updatedDocument.info.title).toBe("Custom API Title");
      expect(updatedDocument.info.version).toBe("1.0.0"); // Should preserve original
      expect(updatedDocument.info.description).toBe("Custom description");
    });

    it("should merge custom info with existing info", () => {
      const customInfo = {
        version: "2.1.0",
      };

      const updateEffect = documentBuilder.updateDocumentInfo(baseDocument, customInfo);
      const updatedDocument = Effect.runSync(updateEffect);

      expect(updatedDocument.info.title).toBe("AsyncAPI Specification"); // Should preserve
      expect(updatedDocument.info.version).toBe("2.1.0");
      expect(updatedDocument.info.description).toBe(
        "Generated from TypeSpec with @lars-artmann/typespec-asyncapi",
      );
    });

    it("should handle empty info updates", () => {
      const originalInfo = { ...baseDocument.info };

      const updateEffect = documentBuilder.updateDocumentInfo(baseDocument, {});
      const updatedDocument = Effect.runSync(updateEffect);

      expect(updatedDocument.info).toEqual(originalInfo);
    });

    it("should handle complete info replacement", () => {
      const completeInfo = {
        title: "New Title",
        version: "3.0.0",
        description: "New description",
      };

      const updateEffect = documentBuilder.updateDocumentInfo(baseDocument, completeInfo);
      const updatedDocument = Effect.runSync(updateEffect);

      expect(updatedDocument.info.title).toBe("New Title");
      expect(updatedDocument.info.version).toBe("3.0.0");
      expect(updatedDocument.info.description).toBe("New description");
    });
  });

  describe("initializeComponents", () => {
    it("should initialize empty components section", () => {
      const document = {
        asyncapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
      } as AsyncAPIObject;

      const effect = documentBuilder.initializeComponents(document);
      const result = Effect.runSync(effect);

      expect(result.components).toBeDefined();
      expect(result.components!.schemas).toEqual({});
      expect(result.components!.messages).toEqual({});
      expect(result.components!.securitySchemes).toEqual({});
    });

    it("should preserve existing components", () => {
      const document = {
        asyncapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        components: {
          schemas: { ExistingSchema: { type: "string" } },
          messages: { ExistingMessage: { name: "test" } },
        },
      } as AsyncAPIObject;

      const effect = documentBuilder.initializeComponents(document);
      const result = Effect.runSync(effect);

      expect(result.components!.schemas).toEqual({
        ExistingSchema: { type: "string" },
      });
      expect(result.components!.messages).toEqual({
        ExistingMessage: { name: "test" },
      });
      expect(result.components!.securitySchemes).toEqual({}); // Should be added
    });

    it("should initialize missing component sections individually", () => {
      const document = {
        asyncapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        components: {
          schemas: { ExistingSchema: { type: "string" } },
          // Missing messages and securitySchemes
        },
      } as AsyncAPIObject;

      const effect = documentBuilder.initializeComponents(document);
      const result = Effect.runSync(effect);

      expect(result.components!.schemas).toEqual({
        ExistingSchema: { type: "string" },
      });
      expect(result.components!.messages).toEqual({});
      expect(result.components!.securitySchemes).toEqual({});
    });

    it("should handle document without components", () => {
      const document = {
        asyncapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
      } as AsyncAPIObject;

      const effect = documentBuilder.initializeComponents(document);
      const result = Effect.runSync(effect);

      expect(result.components).toBeDefined();
      expect(result.components!.schemas).toEqual({});
      expect(result.components!.messages).toEqual({});
      expect(result.components!.securitySchemes).toEqual({});
    });
  });

  describe("initializeDocumentStructure", () => {
    it("should initialize complete document structure", () => {
      const document = {
        asyncapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
      } as AsyncAPIObject;

      const effect = documentBuilder.initializeDocumentStructure(document);
      const result = Effect.runSync(effect);

      expect(result.channels).toEqual({});
      expect(result.operations).toEqual({});
      expect(result.components).toBeDefined();
      expect(result.components!.schemas).toEqual({});
      expect(result.components!.messages).toEqual({});
      expect(result.components!.securitySchemes).toEqual({});
    });

    it("should preserve existing document structure", () => {
      const document = {
        asyncapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
        channels: { existingChannel: { address: "/existing" } },
        operations: {
          existingOp: { action: "send", channel: { $ref: "#/channels/test" } },
        },
      } as AsyncAPIObject;

      const effect = documentBuilder.initializeDocumentStructure(document);
      const result = Effect.runSync(effect);

      expect(result.channels).toEqual({
        existingChannel: { address: "/existing" },
      });
      expect(result.operations).toEqual({
        existingOp: { action: "send", channel: { $ref: "#/channels/test" } },
      });
      expect(result.components).toBeDefined();
    });

    it("should call initializeComponents internally", () => {
      const document = {
        asyncapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
      } as AsyncAPIObject;

      const effect = documentBuilder.initializeDocumentStructure(document);
      const result = Effect.runSync(effect);

      // Verify components were initialized (tested in initializeComponents tests)
      expect(result.components).toBeDefined();
      expect(result.components!.schemas).toEqual({});
      expect(result.components!.messages).toEqual({});
      expect(result.components!.securitySchemes).toEqual({});
    });
  });

  describe("integration scenarios", () => {
    it("should support complete document lifecycle", () => {
      // Step 1: Create initial document
      const documentEffect = documentBuilder.createInitialDocument(mockProgram);
      let document = Effect.runSync(documentEffect);

      // Step 2: Update info
      const updateEffect = documentBuilder.updateDocumentInfo(document, {
        title: "Production API",
        version: "1.0.0",
        description: "Production-ready AsyncAPI specification",
      });
      document = Effect.runSync(updateEffect);

      // Step 3: Initialize full structure
      const structureEffect = documentBuilder.initializeDocumentStructure(document);
      document = Effect.runSync(structureEffect);

      // Verify complete document
      expect(document.asyncapi).toBe("3.0.0");
      expect(document.info.title).toBe("Production API");
      expect(document.channels).toEqual({});
      expect(document.operations).toEqual({});
      expect(document.components!.schemas).toEqual({});
      expect(document.components!.messages).toEqual({});
      expect(document.components!.securitySchemes).toEqual({});
    });

    it("should handle multiple initialization calls safely", () => {
      const documentEffect = documentBuilder.createInitialDocument(mockProgram);
      let document = Effect.runSync(documentEffect);

      // Multiple calls should be safe - each returns a new document
      document = Effect.runSync(documentBuilder.initializeComponents(document));
      document = Effect.runSync(documentBuilder.initializeComponents(document));
      document = Effect.runSync(documentBuilder.initializeDocumentStructure(document));
      document = Effect.runSync(documentBuilder.initializeDocumentStructure(document));

      // Should still have valid structure
      expect(document.channels).toEqual({});
      expect(document.operations).toEqual({});
      expect(document.components!.schemas).toEqual({});
      expect(document.components!.messages).toEqual({});
      expect(document.components!.securitySchemes).toEqual({});
    });
  });

  describe("error handling", () => {
    it("should handle null program gracefully", () => {
      const nullProgram = null as unknown as Program;

      expect(() => {
        documentBuilder.createInitialDocument(nullProgram);
      }).not.toThrow();
    });

    it("should handle undefined document sections", () => {
      const partialDocument = {
        asyncapi: "3.0.0",
        info: { title: "Test", version: "1.0.0" },
      } as AsyncAPIObject;

      const structureEffect = documentBuilder.initializeDocumentStructure(partialDocument);
      const result = Effect.runSync(structureEffect);

      expect(result.channels).toEqual({});
      expect(result.operations).toEqual({});
    });
  });
});
