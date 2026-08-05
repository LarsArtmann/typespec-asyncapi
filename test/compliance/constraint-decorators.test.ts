/**
 * AsyncAPI 3.1.0 Spec Compliance: Constraint Decorators
 *
 * Verifies that TypeSpec stdlib constraint/metadata decorators are correctly
 * mapped to JSON Schema keywords in the emitter output. All output is validated
 * against the official AsyncAPI 3.1.0 JSON Schema via AJV.
 *
 * Decorators tested:
 *   @minValue → minimum          @maxValue → maximum
 *   @minValueExclusive → exclusiveMinimum   @maxValueExclusive → exclusiveMaximum
 *   @minLength → minLength       @maxLength → maxLength
 *   @pattern → pattern           @format → format
 *   #deprecated → deprecated     @minItems → minItems     @maxItems → maxItems
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import type { JsonSchema } from "../../src/domain/models/asyncapi-document.js";

function propSchema(doc: Record<string, unknown>, model: string, prop: string): JsonSchema {
  const { schemas } = doc.components as {
    schemas: Record<string, { properties: Record<string, JsonSchema> }>;
  };
  return schemas[model].properties[prop];
}

describe("spec Compliance: Constraint Decorators", () => {
  describe("numeric constraints", () => {
    it("@minValue maps to minimum", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @minValue(0)
          age: int32;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "age").minimum).toBe(0);
    });

    it("@maxValue maps to maximum", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @maxValue(100)
          age: int32;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "age").maximum).toBe(100);
    });

    it("@minValueExclusive maps to exclusiveMinimum", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @minValueExclusive(0)
          age: int32;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "age").exclusiveMinimum).toBe(0);
    });

    it("@maxValueExclusive maps to exclusiveMaximum", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @maxValueExclusive(100)
          age: int32;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "age").exclusiveMaximum).toBe(100);
    });
  });

  describe("string constraints", () => {
    it("@minLength maps to minLength", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @minLength(3)
          name: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "name").minLength).toBe(3);
    });

    it("@maxLength maps to maxLength", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @maxLength(50)
          name: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "name").maxLength).toBe(50);
    });

    it("@pattern maps to pattern", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @pattern("^[A-Z][a-z]+$")
          name: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "name").pattern).toBe("^[A-Z][a-z]+$");
    });

    it("@format overrides the default format", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @format("uuid")
          id: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "id").format).toBe("uuid");
    });
  });

  describe("array constraints", () => {
    it("@minItems maps to minItems", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @minItems(1)
          tags: string[];
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "tags").minItems).toBe(1);
    });

    it("@maxItems maps to maxItems", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @maxItems(10)
          tags: string[];
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "tags").maxItems).toBe(10);
    });
  });

  describe("deprecation directive", () => {
    it("#deprecated on a property sets deprecated: true", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          #deprecated "use newName instead"
          oldName: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "oldName").deprecated).toBe(true);
    });

    it("#deprecated on a model sets deprecated: true on the schema", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        #deprecated "use EventV2 instead"
        model Event {
          name: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      const schema = (doc.components as { schemas: Record<string, JsonSchema> }).schemas.Event;
      expect(schema.deprecated).toBe(true);
    });
  });

  describe("multiple constraints on a single property", () => {
    it("applies all string constraints simultaneously", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @minLength(1)
          @maxLength(3)
          @pattern("^[0-9]+$")
          @format("code")
          code: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      const code = propSchema(doc, "Event", "code");
      expect(code.minLength).toBe(1);
      expect(code.maxLength).toBe(3);
      expect(code.pattern).toBe("^[0-9]+$");
      expect(code.format).toBe("code");
    });

    it("applies deprecated alongside validation constraints", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          #deprecated "migrating to v2"
          @minLength(2)
          @maxLength(20)
          @pattern("^[A-Z]")
          oldLabel: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      const oldLabel = propSchema(doc, "Event", "oldLabel");
      expect(oldLabel.deprecated).toBe(true);
      expect(oldLabel.minLength).toBe(2);
      expect(oldLabel.maxLength).toBe(20);
      expect(oldLabel.pattern).toBe("^[A-Z]");
    });
  });

  describe("constraints without decorators", () => {
    it("does not add constraint keywords when decorators are absent", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          age: int32;
          name: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      const age = propSchema(doc, "Event", "age");
      expect(age.minimum).toBeUndefined();
      expect(age.maximum).toBeUndefined();
      expect(age.deprecated).toBeUndefined();

      const name = propSchema(doc, "Event", "name");
      expect(name.minLength).toBeUndefined();
      expect(name.maxLength).toBeUndefined();
      expect(name.pattern).toBeUndefined();
    });
  });

  describe("$ref property edge cases", () => {
    it("skips validation constraints on $ref properties (Draft-07 ignores $ref siblings)", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Address {
          street: string;
        }
        model Event {
          @minValue(0)
          @maxValue(100)
          @minLength(1)
          @pattern(".*")
          address: Address;
        }
        @channel("events")
        op publish(): Event;
      `);
      const address = propSchema(doc, "Event", "address");
      expect(address.$ref).toBe("#/components/schemas/Address");
      expect(address.minimum).toBeUndefined();
      expect(address.maximum).toBeUndefined();
      expect(address.minLength).toBeUndefined();
      expect(address.pattern).toBeUndefined();
    });

    it("applies deprecated as a $ref sibling", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Address {
          street: string;
        }
        model Event {
          #deprecated "use newAddress instead"
          address: Address;
        }
        @channel("events")
        op publish(): Event;
      `);
      const address = propSchema(doc, "Event", "address");
      expect(address.$ref).toBe("#/components/schemas/Address");
      expect(address.deprecated).toBe(true);
    });

    it("applies deprecated on $ref property but skips validation constraints", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Address {
          street: string;
        }
        model Event {
          #deprecated "old field"
          @minValue(0)
          @maxLength(10)
          address: Address;
        }
        @channel("events")
        op publish(): Event;
      `);
      const address = propSchema(doc, "Event", "address");
      expect(address.$ref).toBe("#/components/schemas/Address");
      expect(address.deprecated).toBe(true);
      expect(address.minimum).toBeUndefined();
      expect(address.maxLength).toBeUndefined();
    });
  });
});
