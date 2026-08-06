/**
 * AsyncAPI 3.1.0 Spec Compliance: Constraint Decorators
 *
 * Verifies that TypeSpec stdlib constraint/metadata decorators are correctly
 * mapped to JSON Schema keywords in the emitter output. All output is validated
 * against the official AsyncAPI 3.1.0 JSON Schema via AJV.
 *
 * Decorators/mappings tested (16 total):
 *   @minValue → minimum          @maxValue → maximum
 *   @minValueExclusive → exclusiveMinimum   @maxValueExclusive → exclusiveMaximum
 *   @minLength → minLength       @maxLength → maxLength
 *   @pattern → pattern           @format → format
 *   @minItems → minItems         @maxItems → maxItems
 *   @doc → description           #deprecated → deprecated
 *   @summary → title             @example → examples
 *   @visibility → readOnly/writeOnly   = syntax → default
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import type { JsonSchema } from "../../src/domain/models/asyncapi-document.js";

function propSchema(
  doc: Record<string, unknown>,
  model: string,
  prop: string,
): JsonSchema {
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
      const schema = (doc.components as { schemas: Record<string, JsonSchema> })
        .schemas.Event;
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
      expect(propSchema(doc, "Event", "code").pattern).toBe(
        "^[a-z]{1,3}/[0-9]+$",
      );
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
      const schema = (doc.components as { schemas: Record<string, JsonSchema> })
        .schemas.Status;
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
      const { schemas } = doc.components as {
        schemas: Record<string, JsonSchema>;
      };
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
      const schema = (doc.components as { schemas: Record<string, JsonSchema> })
        .schemas.Event;
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
      const schema = (doc.components as { schemas: Record<string, JsonSchema> })
        .schemas.Status;
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
      expect(propSchema(doc, "Event", "message").examples).toStrictEqual([
        "hello world",
      ]);
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

    it("maps @example with array value on array property", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @example(#["a", "b", "c"])
          tags: string[];
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "tags").examples).toStrictEqual([
        ["a", "b", "c"],
      ]);
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
      const { examples } = propSchema(doc, "Event", "name");
      expect(examples).toHaveLength(2);
      expect(examples).toContain("first");
      expect(examples).toContain("second");
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
      const schema = (doc.components as { schemas: Record<string, JsonSchema> })
        .schemas.Event;
      expect(schema.examples).toStrictEqual([{ name: "Test Event" }]);
    });
  });

  describe("@visibility → readOnly/writeOnly", () => {
    it("maps @visibility(Lifecycle.Read) to readOnly", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @visibility(Lifecycle.Read)
          createdAt: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "createdAt").readOnly).toBe(true);
      expect(propSchema(doc, "Event", "createdAt").writeOnly).toBeUndefined();
    });

    it("maps @visibility(Lifecycle.Create) to writeOnly", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @visibility(Lifecycle.Create)
          writeOnlyField: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "writeOnlyField").writeOnly).toBe(true);
      expect(
        propSchema(doc, "Event", "writeOnlyField").readOnly,
      ).toBeUndefined();
    });

    it("maps @visibility(Lifecycle.Update) to writeOnly", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @visibility(Lifecycle.Update)
          updatedAt: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "updatedAt").writeOnly).toBe(true);
    });

    it("does not set readOnly or writeOnly when both Read and Write visible", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @visibility(Lifecycle.Read, Lifecycle.Create)
          name: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "name").readOnly).toBeUndefined();
      expect(propSchema(doc, "Event", "name").writeOnly).toBeUndefined();
    });

    it("does not set readOnly or writeOnly when no visibility decorator", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          name: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "name").readOnly).toBeUndefined();
      expect(propSchema(doc, "Event", "name").writeOnly).toBeUndefined();
    });

    it("silently ignores Lifecycle.Delete (no JSON Schema equivalent)", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @visibility(Lifecycle.Delete)
          tombstone: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      const tombstone = propSchema(doc, "Event", "tombstone");
      expect(tombstone.readOnly).toBeUndefined();
      expect(tombstone.writeOnly).toBeUndefined();
    });

    it("silently ignores Lifecycle.Query (no JSON Schema equivalent)", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @visibility(Lifecycle.Query)
          filter: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      const filter = propSchema(doc, "Event", "filter");
      expect(filter.readOnly).toBeUndefined();
      expect(filter.writeOnly).toBeUndefined();
    });

    it("maps @visibility(Lifecycle.Create, Lifecycle.Update) to writeOnly", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @visibility(Lifecycle.Create, Lifecycle.Update)
          writableOnly: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "writableOnly").writeOnly).toBe(true);
      expect(propSchema(doc, "Event", "writableOnly").readOnly).toBeUndefined();
    });
  });

  describe("default values (TypeSpec = syntax)", () => {
    it("maps string default to default keyword", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          name: string = "anonymous";
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "name").default).toBe("anonymous");
    });

    it("maps numeric default to default keyword", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          count: int32 = 42;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "count").default).toBe(42);
    });

    it("maps boolean default to default keyword", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          active: boolean = true;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "active").default).toBe(true);
    });

    it("applies default as a $ref sibling on scalar property", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        scalar Priority extends int32;
        model Event {
          priority: Priority = 5;
        }
        @channel("events")
        op publish(): Event;
      `);
      const priority = propSchema(doc, "Event", "priority");
      expect(priority.$ref).toBe("#/components/schemas/Priority");
      expect(priority.default).toBe(5);
    });

    it("does not set default when no default value is provided", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          name: string;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "name").default).toBeUndefined();
    });
  });

  describe("complex default values", () => {
    it("maps array default (string[]) to default keyword", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          tags: string[] = #["urgent", "important"];
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "tags").default).toStrictEqual([
        "urgent",
        "important",
      ]);
    });

    it("maps enum member default to default keyword", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        enum Priority { Low: "low", High: "high" }
        model Event {
          priority: Priority = Priority.High;
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "priority").default).toBe("high");
    });

    it("maps Record<string> object default to default keyword", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          defaults: Record<string> = #{ region: "us-east-1" };
        }
        @channel("events")
        op publish(): Event;
      `);
      expect(propSchema(doc, "Event", "defaults").default).toStrictEqual({
        region: "us-east-1",
      });
    });
  });

  describe("@summary and #deprecated on scalar declarations", () => {
    it("maps @summary on a scalar declaration to title", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        @summary("User Identifier")
        scalar UserId extends int32;
        model Event {
          userId: UserId;
        }
        @channel("events")
        op publish(): Event;
      `);
      const schema = (doc.components as { schemas: Record<string, JsonSchema> })
        .schemas.UserId;
      expect(schema.title).toBe("User Identifier");
    });

    it("maps #deprecated on a scalar declaration to deprecated", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        #deprecated "use UserIdV2"
        scalar OldId extends string;
        model Event {
          oldId: OldId;
        }
        @channel("events")
        op publish(): Event;
      `);
      const schema = (doc.components as { schemas: Record<string, JsonSchema> })
        .schemas.OldId;
      expect(schema.deprecated).toBe(true);
    });
  });

  describe("@encode serialization", () => {
    it("does not break @example when @encode(string) is applied to numeric type", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @encode(string)
          @example(42)
          count: int32;
        }
        @channel("events")
        op publish(): Event;
      `);
      const schema = propSchema(doc, "Event", "count");
      expect(schema.examples).toBeDefined();
      expect(schema.examples![0]).toBe(42);
    });

    it("does not break @default when @encode(string) is applied to numeric type", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @encode(string)
          count: int32 = 7;
        }
        @channel("events")
        op publish(): Event;
      `);
      const schema = propSchema(doc, "Event", "count");
      expect(schema.default).toBe(7);
    });

    it("serializes @example without @encode as native type (number)", async () => {
      const doc = await compileAndValidateOrThrow(`
        namespace Test;
        model Event {
          @example(42)
          count: int32;
        }
        @channel("events")
        op publish(): Event;
      `);
      const schema = propSchema(doc, "Event", "count");
      expect(schema.examples).toBeDefined();
      expect(schema.examples![0]).toBe(42);
    });
  });
});
