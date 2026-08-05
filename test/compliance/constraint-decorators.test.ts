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
        scalar MyId extends int32;
        model Event {
          @minValue(0)
          @maxValue(999)
          id: MyId;
        }
        @channel("events")
        op publish(): Event;
      `);
      const id = propSchema(doc, "Event", "id");
      expect(id.$ref).toBe("#/components/schemas/MyId");
      expect(id.minimum).toBeUndefined();
      expect(id.maximum).toBeUndefined();
    });

    it("applies deprecated as a $ref sibling on model-typed property", async () => {
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

    it("applies deprecated on scalar $ref property but skips validation constraints", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        scalar MyId extends int32;
        model Event {
          #deprecated "old field"
          @minValue(0)
          @maxValue(999)
          id: MyId;
        }
        @channel("events")
        op publish(): Event;
      `);
      const id = propSchema(doc, "Event", "id");
      expect(id.$ref).toBe("#/components/schemas/MyId");
      expect(id.deprecated).toBe(true);
      expect(id.minimum).toBeUndefined();
      expect(id.maximum).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("handles negative numeric constraint values", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @minValue(-100)
          @maxValue(-1)
          temperature: int32;
        }
        @channel("events")
        op publish(): Event;
      `);
      const temp = propSchema(doc, "Event", "temperature");
      expect(temp.minimum).toBe(-100);
      expect(temp.maximum).toBe(-1);
    });

    it("handles exclusive constraints with negative values", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @minValueExclusive(-0.5)
          @maxValueExclusive(0.5)
          offset: float32;
        }
        @channel("events")
        op publish(): Event;
      `);
      const offset = propSchema(doc, "Event", "offset");
      expect(offset.exclusiveMinimum).toBe(-0.5);
      expect(offset.exclusiveMaximum).toBe(0.5);
    });

    it("handles @pattern with special regex characters", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @pattern("^[a-z]{1,3}/[0-9]+$")
          code: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "code").pattern).toBe("^[a-z]{1,3}/[0-9]+$");
    });

    it("handles @format override on uri type", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @format("uuid")
          resourceId: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "resourceId").format).toBe("uuid");
    });

    it("sets deprecated: true on an enum schema", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        #deprecated "use StatusV2"
        enum Status {
          Active: "active";
          Inactive: "inactive";
        }
        model Event {
          status: Status;
        }
        @channel("events")
        op publish(): Event;
      `);
      const schema = (doc.components as { schemas: Record<string, JsonSchema> }).schemas.Status;
      expect(schema.deprecated).toBe(true);
    });

    it("does not cross-contaminate deprecated state between models", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        #deprecated "old model"
        model OldEvent {
          name: string;
        }
        model NewEvent {
          name: string;
        }
        @channel("events")
        op publish(): OldEvent;
        @channel("events2")
        op publish2(): NewEvent;
      `);
      const { schemas } = doc.components as { schemas: Record<string, JsonSchema> };
      expect(schemas.OldEvent.deprecated).toBe(true);
      expect(schemas.NewEvent.deprecated).toBeUndefined();
    });
  });

  describe("@summary → title", () => {
    it("maps @summary on a property to title", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @summary("User Name")
          name: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "name").title).toBe("User Name");
    });

    it("maps @summary on a model to title", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        @summary("Event Schema")
        model Event {
          name: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      const schema = (doc.components as { schemas: Record<string, JsonSchema> }).schemas.Event;
      expect(schema.title).toBe("Event Schema");
    });

    it("maps @summary on an enum to title", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        @summary("Status Codes")
        enum Status {
          Active: "active";
          Inactive: "inactive";
        }
        model Event {
          status: Status;
        }
        @channel("events")
        op publish(): Event;
      `);
      const schema = (doc.components as { schemas: Record<string, JsonSchema> }).schemas.Status;
      expect(schema.title).toBe("Status Codes");
    });

    it("applies title as a $ref sibling", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Address {
          street: string;
        }
        model Event {
          @summary("Mailing Address")
          address: Address;
        }
        @channel("events")
        op publish(): Event;
      `);
      const address = propSchema(doc, "Event", "address");
      expect(address.$ref).toBe("#/components/schemas/Address");
      expect(address.title).toBe("Mailing Address");
    });
  });

  describe("@example → examples", () => {
    it("maps @example on a string property to examples array", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @example("hello world")
          message: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "message").examples).toStrictEqual(["hello world"]);
    });

    it("maps @example on a numeric property to examples array", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @example(42)
          count: int32;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "count").examples).toStrictEqual([42]);
    });

    it("maps @example with object value", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          name: string;
          @example(#{name: "Alice", age: 30})
          data: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "data").examples).toStrictEqual([{ name: "Alice", age: 30 }]);
    });

    it("maps multiple @example decorators", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @example("first")
          @example("second")
          name: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "name").examples).toStrictEqual(["first", "second"]);
    });

    it("maps @example on a model to examples on the schema", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        @example(#{name: "Test Event"})
        model Event {
          name: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      const schema = (doc.components as { schemas: Record<string, JsonSchema> }).schemas.Event;
      expect(schema.examples).toStrictEqual([{ name: "Test Event" }]);
    });
  });
});
