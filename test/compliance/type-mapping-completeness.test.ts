/**
 * Comprehensive Type Mapping: All TypeSpec Scalar Types → JSON Schema
 *
 * Every scalar type in the TypeSpec standard library is compiled through the
 * emitter and the resulting JSON Schema type+format is asserted.
 * Also covers tuple types, literal types, and all-optional models.
 */

import { asJsonSchema } from "../utils/type-guards.js";
import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import type {
  ParsedAsyncAPIDocument,
  JsonSchema,
} from "../../src/domain/models/asyncapi-document.js";

function getSchema(doc: ParsedAsyncAPIDocument, name: string): JsonSchema {
  return doc.components!.schemas![name];
}

function getProp(
  doc: ParsedAsyncAPIDocument,
  model: string,
  field: string,
): JsonSchema {
  return getSchema(doc, model).properties![field];
}

async function compileField(field: string, type: string): Promise<JsonSchema> {
  const doc = await compileAndValidateOrThrow(`
    namespace Test;
    model Event {
      ${field}: ${type};
    }
    @channel("events")
    op publish(): Event;
  `);
  return getProp(doc, "Event", field);
}

describe("comprehensive type mapping through compilation", () => {
  describe("integer types", () => {
    it("maps int8 to integer with format", async () => {
      const s = await compileField("val", "int8");
      expect(s.type).toBe("integer");
      expect(s.format).toBe("int8");
    });

    it("maps int16 to integer with format", async () => {
      const s = await compileField("val", "int16");
      expect(s.type).toBe("integer");
      expect(s.format).toBe("int16");
    });

    it("maps int32 to integer with format", async () => {
      const s = await compileField("val", "int32");
      expect(s.type).toBe("integer");
      expect(s.format).toBe("int32");
    });

    it("maps int64 to integer with format", async () => {
      const s = await compileField("val", "int64");
      expect(s.type).toBe("integer");
      expect(s.format).toBe("int64");
    });

    it("maps uint8 to integer with format", async () => {
      const s = await compileField("val", "uint8");
      expect(s.type).toBe("integer");
      expect(s.format).toBe("uint8");
    });

    it("maps uint16 to integer with format", async () => {
      const s = await compileField("val", "uint16");
      expect(s.type).toBe("integer");
      expect(s.format).toBe("uint16");
    });

    it("maps uint32 to integer with format", async () => {
      const s = await compileField("val", "uint32");
      expect(s.type).toBe("integer");
      expect(s.format).toBe("uint32");
    });

    it("maps uint64 to integer with format", async () => {
      const s = await compileField("val", "uint64");
      expect(s.type).toBe("integer");
      expect(s.format).toBe("uint64");
    });

    it("maps safeint to integer with format", async () => {
      const s = await compileField("val", "safeint");
      expect(s.type).toBe("integer");
      expect(s.format).toBe("safeint");
    });
  });

  describe("floating point types", () => {
    it("maps float32 to number with float format", async () => {
      const s = await compileField("val", "float32");
      expect(s.type).toBe("number");
      expect(s.format).toBe("float");
    });

    it("maps float64 to number with double format", async () => {
      const s = await compileField("val", "float64");
      expect(s.type).toBe("number");
      expect(s.format).toBe("double");
    });
  });

  describe("decimal types", () => {
    it("maps decimal to string with decimal format", async () => {
      const s = await compileField("val", "decimal");
      expect(s.type).toBe("string");
      expect(s.format).toBe("decimal");
    });

    it("maps decimal128 to string with decimal format", async () => {
      const s = await compileField("val", "decimal128");
      expect(s.type).toBe("string");
      expect(s.format).toBe("decimal");
    });
  });

  describe("date/time types", () => {
    it("maps utcDateTime to string with date-time format", async () => {
      const s = await compileField("val", "utcDateTime");
      expect(s.type).toBe("string");
      expect(s.format).toBe("date-time");
    });

    it("maps offsetDateTime to string with date-time format", async () => {
      const s = await compileField("val", "offsetDateTime");
      expect(s.type).toBe("string");
      expect(s.format).toBe("date-time");
    });

    it("maps unixTimestamp32 to integer with unix-timestamp format", async () => {
      const s = await compileField("val", "unixTimestamp32");
      expect(s.type).toBe("integer");
      expect(s.format).toBe("unix-timestamp");
    });

    it("maps plainDate to string with date format", async () => {
      const s = await compileField("val", "plainDate");
      expect(s.type).toBe("string");
      expect(s.format).toBe("date");
    });

    it("maps plainTime to string with time format", async () => {
      const s = await compileField("val", "plainTime");
      expect(s.type).toBe("string");
      expect(s.format).toBe("time");
    });

    it("maps duration to string with duration format", async () => {
      const s = await compileField("val", "duration");
      expect(s.type).toBe("string");
      expect(s.format).toBe("duration");
    });
  });

  describe("other scalar types", () => {
    it("maps string", async () => {
      const s = await compileField("val", "string");
      expect(s.type).toBe("string");
      expect(s.format).toBeUndefined();
    });

    it("maps boolean", async () => {
      const s = await compileField("val", "boolean");
      expect(s.type).toBe("boolean");
    });

    it("maps bytes to string with byte format", async () => {
      const s = await compileField("val", "bytes");
      expect(s.type).toBe("string");
      expect(s.format).toBe("byte");
    });

    it("maps url to string with uri format", async () => {
      const s = await compileField("val", "url");
      expect(s.type).toBe("string");
      expect(s.format).toBe("uri");
    });
  });

  describe("intrinsic types", () => {
    it("maps unknown to the unconstrained schema, not string", async () => {
      const s = await compileField("val", "unknown");
      expect(s).toStrictEqual({});
    });

    it("maps null to type null", async () => {
      const s = await compileField("val", "null");
      expect(s.type).toBe("null");
    });

    it("maps nullable unions to anyOf with a null variant", async () => {
      const s = await compileField("val", "string | null");
      const variants = s.anyOf as JsonSchema[];
      expect(variants).toHaveLength(2);
      expect(variants[0]?.type).toBe("string");
      expect(variants[1]?.type).toBe("null");
    });

    it("maps Record<unknown> values to the unconstrained schema", async () => {
      const s = await compileField("val", "Record<unknown>");
      expect(s.type).toBe("object");
      expect(asJsonSchema(s.additionalProperties, "additionalProperties")).toStrictEqual({});
    });

    it("does not leak doc metadata across usages of unknown", async () => {
      // Regression: interned unknown schemas were shared by reference, leaking @doc across usages.
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @doc("Documented value")
          documented: unknown;
          plain: unknown;
        }
        @channel("events")
        op publish(): Event;
      `);
      const props = getSchema(doc, "Event").properties!;
      expect(props.documented!.description).toBe("Documented value");
      expect(props.plain!.description).toBeUndefined();
    });
  });

  describe("tuple types", () => {
    it("maps a tuple of primitives to array with per-position items", async () => {
      const s = await compileField("pair", "[string, int32]");
      expect(s.type).toBe("array");
      expect(Array.isArray(s.items)).toBe(true);
      const items = s.items as unknown[];
      expect(items).toHaveLength(2);
    });

    it("produces valid output for tuple of named models", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model A { x: string; }
        model B { y: int32; }
        model Event {
          pair: [A, B];
        }
        @channel("events")
        op publish(): Event;
      `);
      const pair = doc?.components?.schemas?.Event?.properties?.pair as Record<
        string,
        unknown
      >;
      expect(pair?.type).toBe("array");
      const items = pair?.items as Record<string, unknown>[];
      expect(Array.isArray(items)).toBe(true);
      expect(items).toHaveLength(2);
      expect(items[0]).toStrictEqual({ $ref: "#/components/schemas/A" });
      expect(items[1]).toStrictEqual({ $ref: "#/components/schemas/B" });
    });

    it("produces valid output for tuple of mixed primitives and named models", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Address { street: string; }
        model Event {
          triple: [string, int32, Address];
        }
        @channel("events")
        op publish(): Event;
      `);
      const triple = doc?.components?.schemas?.Event?.properties
        ?.triple as Record<string, unknown>;
      expect(triple?.type).toBe("array");
      const items = triple?.items as Record<string, unknown>[];
      expect(items).toHaveLength(3);
      expect(items[0]).toStrictEqual({ type: "string" });
      expect(items[1]).toStrictEqual({ format: "int32", type: "integer" });
      expect(items[2]).toStrictEqual({
        $ref: "#/components/schemas/Address",
      });
    });
  });

  describe("literal types", () => {
    it("maps string literal property to const", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        scalar Status extends string;
        model Event {
          status: "active";
        }
        @channel("events")
        op publish(): Event;
      `);
      const s = getProp(doc, "Event", "status");
      expect(s.const).toBe("active");
    });

    it("maps numeric literal property to const", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          count: 42;
        }
        @channel("events")
        op publish(): Event;
      `);
      const s = getProp(doc, "Event", "count");
      expect(s.const).toBe(42);
    });

    it("maps boolean literal property to const", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          active: true;
        }
        @channel("events")
        op publish(): Event;
      `);
      const s = getProp(doc, "Event", "active");
      expect(s.const).toBe(true);
    });
  });

  describe("all-optional model has no required array", () => {
    it("omits required when all properties are optional", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          name?: string;
          age?: int32;
        }
        @channel("events")
        op publish(): Event;
      `);
      const s = getSchema(doc, "Event");
      expect(s.required).toBeUndefined();
    });

    it("includes required when some properties are required", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          id: string;
          name?: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      const s = getSchema(doc, "Event");
      expect(s.required).toStrictEqual(["id"]);
    });
  });

  describe("array of primitive types", () => {
    it("maps string[] to array with string items", async () => {
      const s = await compileField("tags", "string[]");
      expect(s.type).toBe("array");
      expect(asJsonSchema(s.items, "items").type).toBe("string");
    });

    it("maps int32[] to array with integer items", async () => {
      const s = await compileField("nums", "int32[]");
      expect(s.type).toBe("array");
      expect(asJsonSchema(s.items, "items").type).toBe("integer");
    });

    it("maps boolean[] to array with boolean items", async () => {
      const s = await compileField("flags", "boolean[]");
      expect(s.type).toBe("array");
      expect(asJsonSchema(s.items, "items").type).toBe("boolean");
    });
  });

  describe("named model references", () => {
    it("maps nested model reference as $ref", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Address { street: string; city: string; }
        model User {
          name: string;
          address: Address;
        }
        @channel("users")
        op publish(): User;
      `);
      const schema = getSchema(doc, "User");
      const props = schema.properties!;
      expect(props.address.$ref).toBe("#/components/schemas/Address");
      expect(getSchema(doc, "Address").type).toBe("object");
    });

    it("maps array of named models with $ref items", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Item { sku: string; }
        model Order {
          items: Item[];
        }
        @channel("orders")
        op publish(): Order;
      `);
      const schema = getSchema(doc, "Order");
      const props = schema.properties!;
      expect(asJsonSchema(props.items, "items").type).toBe("array");
      expect(asJsonSchema(asJsonSchema(props.items, "items").items, "items.items").$ref).toBe("#/components/schemas/Item");
    });
  });

  describe("string-literal union", () => {
    it("maps string literal union to enum", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          status: "pending" | "active" | "closed";
        }
        @channel("events")
        op publish(): Event;
      `);
      const s = getProp(doc, "Event", "status");
      expect(s.enum).toStrictEqual(["pending", "active", "closed"]);
    });
  });
});
