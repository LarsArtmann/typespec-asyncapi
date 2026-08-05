/**
 * Tests: Schema Splitter (splitSchemas)
 *
 * Unit tests for the multi-file schema splitting functionality.
 * Verifies $ref rewriting, component cleanup, and edge cases.
 */

import { splitSchemas } from "../../src/schema-splitter.js";
import type { AsyncAPIDocument } from "../../src/domain/models/asyncapi-document.js";

function makeDoc(schemas: Record<string, unknown>): AsyncAPIDocument {
  return {
    asyncapi: "3.1.0",
    info: { title: "Test", version: "1.0.0" },
    components: { schemas },
  } as unknown as AsyncAPIDocument;
}

describe("splitSchemas", () => {
  it("returns empty schemaFiles when components.schemas is missing", () => {
    const doc = {
      asyncapi: "3.1.0",
      info: { title: "T", version: "1" },
    } as unknown as AsyncAPIDocument;
    const result = splitSchemas(doc, "json");
    expect(result.schemaFiles.size).toBe(0);
    expect(result.mainDocument).toBe(doc);
  });

  it("returns empty schemaFiles when components is missing entirely", () => {
    const doc = {
      asyncapi: "3.1.0",
      info: { title: "T", version: "1" },
    } as unknown as AsyncAPIDocument;
    const result = splitSchemas(doc, "json");
    expect(result.schemaFiles.size).toBe(0);
  });

  it("extracts single schema to a separate file", () => {
    const doc = makeDoc({
      User: { type: "object", properties: { name: { type: "string" } } },
    });
    const result = splitSchemas(doc, "json");
    expect(result.schemaFiles.size).toBe(1);
    expect(result.schemaFiles.has("User.json")).toBe(true);
    const userSchema = result.schemaFiles.get("User.json");
    expect(userSchema?.type).toBe("object");
    expect(userSchema?.properties?.name).toBeDefined();
  });

  it("removes schemas from main document components", () => {
    const doc = makeDoc({
      User: { type: "object", properties: { name: { type: "string" } } },
    });
    const result = splitSchemas(doc, "json");
    expect(result.mainDocument.components?.schemas).toBeUndefined();
  });

  it("deletes components entirely when only schemas existed", () => {
    const doc = makeDoc({
      User: { type: "object", properties: {} },
    });
    const result = splitSchemas(doc, "json");
    expect(result.mainDocument.components).toBeUndefined();
  });

  it("preserves components when messages or securitySchemes remain", () => {
    const doc = {
      asyncapi: "3.1.0",
      info: { title: "T", version: "1" },
      components: {
        schemas: { User: { type: "object" } },
        messages: {
          UserMessage: { $ref: "#/components/schemas/User" },
        },
      },
    } as unknown as AsyncAPIDocument;
    const result = splitSchemas(doc, "json");
    expect(result.mainDocument.components).toBeDefined();
    expect(result.mainDocument.components?.messages).toBeDefined();
    expect(result.mainDocument.components?.schemas).toBeUndefined();
  });

  it("rewrites $ref pointers in main document from internal to external", () => {
    const doc = {
      asyncapi: "3.1.0",
      info: { title: "T", version: "1" },
      components: {
        schemas: { User: { type: "object" } },
        messages: {
          UserMessage: {
            payload: { $ref: "#/components/schemas/User" },
          },
        },
      },
    } as unknown as AsyncAPIDocument;
    const result = splitSchemas(doc, "json");
    const msg = result.mainDocument.components?.messages?.UserMessage as Record<string, unknown>;
    expect(msg?.payload).toStrictEqual({ $ref: "schemas/User.json" });
  });

  it("rewrites $ref pointers in extracted schema files", () => {
    const doc = makeDoc({
      User: {
        type: "object",
        properties: {
          address: { $ref: "#/components/schemas/Address" },
        },
      },
      Address: { type: "object", properties: { street: { type: "string" } } },
    });
    const result = splitSchemas(doc, "json");
    const userSchema = result.schemaFiles.get("User.json") as Record<string, unknown>;
    const props = userSchema?.properties as Record<string, unknown>;
    expect(props?.address).toStrictEqual({ $ref: "schemas/Address.json" });
  });

  it("does not rewrite non-schema $ref pointers", () => {
    const doc = {
      asyncapi: "3.1.0",
      info: { title: "T", version: "1" },
      components: {
        schemas: { User: { type: "object" } },
        messages: {
          UserMessage: {
            payload: { $ref: "#/components/messages/OtherMessage" },
          },
        },
      },
    } as unknown as AsyncAPIDocument;
    const result = splitSchemas(doc, "json");
    const msg = result.mainDocument.components?.messages?.UserMessage as Record<string, unknown>;
    expect(msg?.payload).toStrictEqual({
      $ref: "#/components/messages/OtherMessage",
    });
  });

  it("supports yaml file extension", () => {
    const doc = makeDoc({
      User: { type: "object" },
    });
    const result = splitSchemas(doc, "yaml");
    expect(result.schemaFiles.has("User.yaml")).toBe(true);
  });

  it("does not mutate the original document", () => {
    const doc = makeDoc({
      User: { type: "object", properties: { name: { type: "string" } } },
    });
    splitSchemas(doc, "json");
    expect(doc.components?.schemas?.User).toBeDefined();
    expect(doc.components?.schemas?.User?.type).toBe("object");
  });

  it("handles multiple schemas", () => {
    const doc = makeDoc({
      A: { type: "object" },
      B: { type: "object" },
      C: { type: "string" },
    });
    const result = splitSchemas(doc, "json");
    expect(result.schemaFiles.size).toBe(3);
    expect([...result.schemaFiles.keys()].toSorted()).toStrictEqual(["A.json", "B.json", "C.json"]);
  });

  it("rewrites $ref inside arrays (anyOf, oneOf)", () => {
    const doc = {
      asyncapi: "3.1.0",
      info: { title: "T", version: "1" },
      components: {
        schemas: { User: { type: "object" } },
        messages: {
          MultiMessage: {
            payload: {
              anyOf: [{ $ref: "#/components/schemas/User" }, { type: "string" }],
            },
          },
        },
      },
    } as unknown as AsyncAPIDocument;
    const result = splitSchemas(doc, "json");
    const msg = result.mainDocument.components?.messages?.MultiMessage as Record<string, unknown>;
    const payload = msg?.payload as Record<string, unknown[]>;
    const anyOf = payload?.anyOf;
    expect(anyOf?.[0]).toStrictEqual({ $ref: "schemas/User.json" });
  });

  it("handles empty schemas object", () => {
    const doc = makeDoc({});
    const result = splitSchemas(doc, "json");
    expect(result.schemaFiles.size).toBe(0);
  });
});
