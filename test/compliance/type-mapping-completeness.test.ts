/**
 * Comprehensive Type Mapping: All TypeSpec Scalar Types → JSON Schema
 *
 * Every scalar type in the TypeSpec standard library is compiled through the
 * emitter and the resulting JSON Schema type+format is asserted.
 * Also covers tuple types, literal types, and all-optional models.
 */

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

  describe("tuple types", () => {
    it("maps a tuple of primitives to array with enum items", async () => {
      const s = await compileField("pair", "[string, int32]");
      expect(s.type).toBe("array");
      expect(s.items).toBeDefined();
    });

    it("compiles a tuple of named models without compiler errors", async () => {
      const { compileAsyncAPI } = await import("../utils/test-helpers.js");
      const result = await compileAsyncAPI(`
        namespace Test;
        model A { x: string; }
        model B { y: int32; }
        model Event {
          pair: [A, B];
        }
        @channel("events")
        op publish(): Event;
      `);
      const errors = result.diagnostics.filter((d) => d.severity === "error");
      expect(errors).toHaveLength(0);
      const s =
        result.asyncApiDoc?.components?.schemas?.Event?.properties?.pair;
      expect(s?.type).toBe("array");
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
      expect(s.items!.type).toBe("string");
    });

    it("maps int32[] to array with integer items", async () => {
      const s = await compileField("nums", "int32[]");
      expect(s.type).toBe("array");
      expect(s.items!.type).toBe("integer");
    });

    it("maps boolean[] to array with boolean items", async () => {
      const s = await compileField("flags", "boolean[]");
      expect(s.type).toBe("array");
      expect(s.items!.type).toBe("boolean");
    });
  });

  describe("record types", () => {
    it("maps Record<string> to object with string additionalProperties", async () => {
      const s = await compileField("meta", "Record<string>");
      expect(s.type).toBe("object");
      expect(s.additionalProperties).toStrictEqual({ type: "string" });
    });

    it("maps Record<int32> to object with integer additionalProperties", async () => {
      const s = await compileField("counts", "Record<int32>");
      expect(s.type).toBe("object");
      expect(s.additionalProperties).toStrictEqual({
        format: "int32",
        type: "integer",
      });
    });
  });
});
