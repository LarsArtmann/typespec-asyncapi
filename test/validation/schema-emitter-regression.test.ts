/**
 * Schema Emitter Regression Tests
 *
 * Permanent regression tests for the three most critical schema-emitter fixes:
 * 1. refForNamedType() — arrays of named models emit $ref, not {type:"string"}
 * 2. Record<string> maps to {type:"object", additionalProperties:{...}}, not array
 * 3. typeToSchema() — every branch produces correct JSON Schema
 *
 * These were originally verified manually in /tmp during the initial fix session
 * but never committed as permanent regression tests.
 */

import { compileAsyncAPIWithoutErrors } from "../utils/test-helpers.js";

describe("refForNamedType: arrays of named models", () => {
  it("item[] emits items: { $ref: #/components/schemas/Item }", async () => {
    const source = `
      model Item { id: string; name: string; }
      model Cart { items: Item[]; }
    `;
    const result = await compileAsyncAPIWithoutErrors(source);
    const schemas = result.asyncApiDoc?.components?.schemas;
    expect(schemas?.Cart?.properties?.items).toStrictEqual({
      items: { $ref: "#/components/schemas/Item" },
      type: "array",
    });
  });

  it("nested arrays of named models (Item[][]) emit correct items chain", async () => {
    const source = `
      model Item { id: string; }
      model Matrix { grid: Item[][]; }
    `;
    const result = await compileAsyncAPIWithoutErrors(source);
    const grid =
      result.asyncApiDoc?.components?.schemas?.Matrix?.properties?.grid;
    expect(grid?.type).toBe("array");
    expect(grid?.items?.type).toBe("array");
    expect(grid?.items?.items?.$ref).toBe("#/components/schemas/Item");
  });

  it("named model property emits $ref, not inline schema", async () => {
    const source = `
      model Address { street: string; city: string; }
      model User { name: string; address: Address; }
    `;
    const result = await compileAsyncAPIWithoutErrors(source);
    const addr =
      result.asyncApiDoc?.components?.schemas?.User?.properties?.address;
    expect(addr).toStrictEqual({ $ref: "#/components/schemas/Address" });
  });
});

describe("record<string> mapping", () => {
  it("record<string> emits { type: object, additionalProperties: { type: string } }", async () => {
    const source = `
      model Config { values: Record<string>; }
    `;
    const result = await compileAsyncAPIWithoutErrors(source);
    const values =
      result.asyncApiDoc?.components?.schemas?.Config?.properties?.values;
    expect(values).toStrictEqual({
      additionalProperties: { type: "string" },
      type: "object",
    });
  });

  it("record<int32> emits additionalProperties with int32 mapping", async () => {
    const source = `
      model Counts { data: Record<int32>; }
    `;
    const result = await compileAsyncAPIWithoutErrors(source);
    const data =
      result.asyncApiDoc?.components?.schemas?.Counts?.properties?.data;
    expect(data?.type).toBe("object");
    expect(data?.additionalProperties?.type).toBe("integer");
  });

  it("record of named model emits $ref in additionalProperties", async () => {
    const source = `
      model Item { id: string; }
      model Store { inventory: Record<Item>; }
    `;
    const result = await compileAsyncAPIWithoutErrors(source);
    const inv =
      result.asyncApiDoc?.components?.schemas?.Store?.properties?.inventory;
    expect(inv?.type).toBe("object");
    expect(inv?.additionalProperties?.$ref).toBe("#/components/schemas/Item");
  });
});

describe("typeToSchema: every branch", () => {
  it("union of string literals → { type: string, enum: [...] }", async () => {
    const source = `
      model Event { status: "pending" | "active" | "closed"; }
    `;
    const result = await compileAsyncAPIWithoutErrors(source);
    const status =
      result.asyncApiDoc?.components?.schemas?.Event?.properties?.status;
    expect(status).toStrictEqual({
      enum: ["pending", "active", "closed"],
      type: "string",
    });
  });

  it("union of mixed types → { anyOf: [...] }", async () => {
    const source = `
      model Event { value: string | int32; }
    `;
    const result = await compileAsyncAPIWithoutErrors(source);
    const value =
      result.asyncApiDoc?.components?.schemas?.Event?.properties?.value;
    expect(value?.anyOf).toBeDefined();
    expect(value?.anyOf).toHaveLength(2);
  });

  it("scalar types map correctly (string, int32, float64, boolean)", async () => {
    const source = `
      model Types {
        s: string;
        i: int32;
        f: float64;
        b: boolean;
      }
    `;
    const result = await compileAsyncAPIWithoutErrors(source);
    const props = result.asyncApiDoc?.components?.schemas?.Types?.properties;
    expect(props?.s?.type).toBe("string");
    expect(props?.i?.type).toBe("integer");
    expect(props?.f?.type).toBe("number");
    expect(props?.b?.type).toBe("boolean");
  });

  it("anonymous nested model → inline object schema", async () => {
    const source = `
      model Outer {
        inner: { x: string; y: int32; };
      }
    `;
    const result = await compileAsyncAPIWithoutErrors(source);
    const inner =
      result.asyncApiDoc?.components?.schemas?.Outer?.properties?.inner;
    expect(inner?.type).toBe("object");
    expect(inner?.properties?.x?.type).toBe("string");
    expect(inner?.properties?.y?.type).toBe("integer");
  });

  it("array of anonymous models → inline array with object items", async () => {
    const source = `
      model Outer {
        items: { sku: string; qty: int32; }[];
      }
    `;
    const result = await compileAsyncAPIWithoutErrors(source);
    const items =
      result.asyncApiDoc?.components?.schemas?.Outer?.properties?.items;
    expect(items?.type).toBe("array");
    expect(items?.items?.type).toBe("object");
    expect(items?.items?.properties?.sku?.type).toBe("string");
  });

  it("array of scalar (string[]) → { type: array, items: { type: string } }", async () => {
    const source = `
      model List { tags: string[]; }
    `;
    const result = await compileAsyncAPIWithoutErrors(source);
    const tags =
      result.asyncApiDoc?.components?.schemas?.List?.properties?.tags;
    expect(tags).toStrictEqual({ items: { type: "string" }, type: "array" });
  });

  it("optional properties are excluded from required[]", async () => {
    const source = `
      model Partial {
        required1: string;
        optional1?: string;
      }
    `;
    const result = await compileAsyncAPIWithoutErrors(source);
    const schema = result.asyncApiDoc?.components?.schemas?.Partial;
    expect(schema?.required).toStrictEqual(["required1"]);
    expect(schema?.properties?.optional1?.type).toBe("string");
  });

  it("enum declaration → { type: string, enum: [...] }", async () => {
    const source = `
      enum Color { Red, Green, Blue }
      model Item { color: Color; }
    `;
    const result = await compileAsyncAPIWithoutErrors(source);
    const color =
      result.asyncApiDoc?.components?.schemas?.Item?.properties?.color;
    expect(color?.$ref).toBe("#/components/schemas/Color");
    const colorSchema = result.asyncApiDoc?.components?.schemas?.Color;
    expect(colorSchema?.enum).toStrictEqual(["Red", "Green", "Blue"]);
  });

  it("bytes scalar → { type: string, format: byte }", async () => {
    const source = `
      model Binary { data: bytes; }
    `;
    const result = await compileAsyncAPIWithoutErrors(source);
    const data =
      result.asyncApiDoc?.components?.schemas?.Binary?.properties?.data;
    expect(data?.type).toBe("string");
    expect(data?.format).toBe("byte");
  });

  it("utcDateTime → { type: string, format: date-time }", async () => {
    const source = `
      model Event { timestamp: utcDateTime; }
    `;
    const result = await compileAsyncAPIWithoutErrors(source);
    const ts =
      result.asyncApiDoc?.components?.schemas?.Event?.properties?.timestamp;
    expect(ts?.type).toBe("string");
    expect(ts?.format).toBe("date-time");
  });
});
