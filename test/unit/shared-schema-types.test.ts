import type {
  JsonSchema,
  SchemaMap,
  SchemaRef,
} from "../../src/shared/json-schema.js";
import { extractValue } from "../../src/extract-value.js";
import { intrinsicToSchema } from "../../src/intrinsic-mapping.js";
import type { EmitEntity } from "@typespec/asset-emitter";

describe("jsonSchema type", () => {
  it("accepts standard JSON Schema properties", () => {
    const schema: JsonSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        count: { type: "integer", minimum: 0 },
      },
      required: ["id"],
    };
    expect(schema.type).toBe("object");
    expect(schema.properties?.id?.type).toBe("string");
  });

  it("allows extension keys via index signature", () => {
    const schema: JsonSchema = {
      type: "string",
      "x-custom-extension": "value",
    };
    expect(schema["x-custom-extension"]).toBe("value");
  });

  it("supports $ref pointers", () => {
    const schema: SchemaRef = { $ref: "#/components/schemas/User" };
    expect(schema.$ref).toBe("#/components/schemas/User");
  });

  it("supports nested schema structures", () => {
    const schema: JsonSchema = {
      type: "object",
      properties: {
        address: {
          type: "object",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
          },
          required: ["street", "city"],
        },
      },
    };
    expect(schema.properties?.address?.properties?.street?.type).toBe("string");
  });

  it("supports array schemas with items", () => {
    const schema: JsonSchema = {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 100,
    };
    expect(schema.type).toBe("array");
    expect(schema.items?.type).toBe("string");
  });

  it("supports union types via anyOf", () => {
    const schema: JsonSchema = {
      anyOf: [{ type: "string" }, { type: "number" }],
    };
    expect(schema.anyOf).toHaveLength(2);
  });
});

describe("schemaMap type", () => {
  it("represents a collection of named schemas", () => {
    const schemas: SchemaMap = {
      User: { type: "object", properties: { id: { type: "string" } } },
      Order: { type: "object", properties: { total: { type: "number" } } },
    };
    expect(Object.keys(schemas)).toHaveLength(2);
    expect(schemas.User.type).toBe("object");
  });
});

describe("extractValue", () => {
  it("returns empty object for missing entity", () => {
    expect(extractValue()).toStrictEqual({});
  });

  it("extracts value from declaration entity", () => {
    const entity = {
      kind: "declaration" as const,
      value: { type: "string" },
    };
    expect(extractValue(entity as EmitEntity<JsonSchema>)).toStrictEqual({
      type: "string",
    });
  });

  it("returns empty object for none kind", () => {
    const entity = { kind: "none" as const };
    expect(extractValue(entity as EmitEntity<JsonSchema>)).toStrictEqual({});
  });

  it("filters out Placeholder values with onValue", () => {
    const entity = {
      kind: "declaration" as const,
      value: { onValue: () => {} },
    };
    expect(extractValue(entity as EmitEntity<JsonSchema>)).toStrictEqual({});
  });
});

describe("intrinsicToSchema", () => {
  it("maps string to JSON Schema", () => {
    expect(intrinsicToSchema("string")).toStrictEqual({ type: "string" });
  });

  it("maps integer types", () => {
    const result = intrinsicToSchema("int32");
    expect(result.type).toBe("integer");
    expect(result.format).toBe("int32");
  });

  it("maps decimal to string with format", () => {
    const result = intrinsicToSchema("decimal");
    expect(result.type).toBe("string");
    expect(result.format).toBe("decimal");
  });

  it("maps utcDateTime to date-time format", () => {
    const result = intrinsicToSchema("utcDateTime");
    expect(result.type).toBe("string");
    expect(result.format).toBe("date-time");
  });

  it("maps boolean", () => {
    expect(intrinsicToSchema("boolean")).toStrictEqual({ type: "boolean" });
  });

  it("defaults unknown types to string", () => {
    expect(intrinsicToSchema("unknownType")).toStrictEqual({
      type: "string",
    });
  });

  it("maps all numeric scalar types", () => {
    const int64 = intrinsicToSchema("int64");
    expect(int64.type).toBe("integer");
    expect(int64.format).toBe("int64");

    const float = intrinsicToSchema("float");
    expect(float.type).toBe("number");

    const uint64 = intrinsicToSchema("uint64");
    expect(uint64.type).toBe("integer");
    expect(uint64.format).toBe("uint64");
  });

  it("maps bytes and url", () => {
    const bytes = intrinsicToSchema("bytes");
    expect(bytes.type).toBe("string");
    expect(bytes.format).toBe("byte");

    const url = intrinsicToSchema("url");
    expect(url.type).toBe("string");
    expect(url.format).toBe("uri");
  });
});
