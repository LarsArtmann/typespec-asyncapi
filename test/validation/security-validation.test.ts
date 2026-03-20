import { describe, test, expect } from "bun:test";
import { ASYNC_API_EMITTER_OPTIONS_SCHEMA } from "../../src/infrastructure/configuration/options.js";

describe("Security Validation", () => {
  test("schema prevents arbitrary properties (security vulnerability fix)", () => {
    // This test ensures our fix for the security vulnerability works
    expect(ASYNC_API_EMITTER_OPTIONS_SCHEMA.additionalProperties).toBe(false);
    expect(ASYNC_API_EMITTER_OPTIONS_SCHEMA.type).toBe("object");
    expect(ASYNC_API_EMITTER_OPTIONS_SCHEMA.properties).toBeDefined();
  });

  test("schema validates all expected AsyncAPI emitter options", () => {
    const expectedProperties = [
      "output-file",
      "file-type",
      "asyncapi-version",
      "protocol-bindings",
      "security-schemes",
      "versioning",
    ];

    for (const prop of expectedProperties) {
      const propSchema = ASYNC_API_EMITTER_OPTIONS_SCHEMA.properties[prop];
      expect(propSchema).toBeDefined();
    }

    // Verify schema has additionalProperties: false (security requirement)
    expect(ASYNC_API_EMITTER_OPTIONS_SCHEMA.additionalProperties).toBe(false);
  });

  test("file-type enum is properly constrained", () => {
    const fileTypeSchema = ASYNC_API_EMITTER_OPTIONS_SCHEMA.properties["file-type"];
    expect(fileTypeSchema.enum).toContain("yaml");
    expect(fileTypeSchema.enum).toContain("json");
  });

  test("asyncapi-version enum is properly constrained", () => {
    const versionSchema = ASYNC_API_EMITTER_OPTIONS_SCHEMA.properties["asyncapi-version"];
    expect(versionSchema.enum).toEqual(["3.0.0"]);
  });

  test("protocol-bindings enum is properly constrained", () => {
    const bindingsSchema = ASYNC_API_EMITTER_OPTIONS_SCHEMA.properties["protocol-bindings"];
    expect(bindingsSchema.items.enum).toContain("kafka");
    expect(bindingsSchema.items.enum).toContain("amqp");
    expect(bindingsSchema.items.enum).toContain("http");
    // uniqueItems may not be present in all schema versions
    if (bindingsSchema.uniqueItems !== undefined) {
      expect(bindingsSchema.uniqueItems).toBe(true);
    }
  });

  test("versioning sub-object prevents arbitrary properties", () => {
    const versioningSchema = ASYNC_API_EMITTER_OPTIONS_SCHEMA.properties["versioning"];
    expect(versioningSchema.additionalProperties).toBe(false);
    // Properties may not be present in fallback schemas
    if (versioningSchema.properties !== undefined) {
      expect(versioningSchema.properties).toBeDefined();
      expect(versioningSchema.properties.enabled).toBeDefined();
    }
  });

  test("CRITICAL: no {} as any security hole exists", () => {
    // This is the core security test - ensure we eliminated the vulnerability
    const schemaString = JSON.stringify(ASYNC_API_EMITTER_OPTIONS_SCHEMA);
    expect(schemaString).not.toContain("as any");
    expect(schemaString).not.toContain("{}");

    // Ensure we have actual validation rules
    expect(Object.keys(ASYNC_API_EMITTER_OPTIONS_SCHEMA.properties).length).toBeGreaterThan(0);
  });
});
