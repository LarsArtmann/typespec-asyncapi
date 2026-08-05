/**
 * Polymorphism & Schema Composition Compliance
 *
 * Tests allOf for model inheritance, discriminator on models,
 * oneOf for model-variant unions, and verification that mixed-type
 * unions and string-literal unions retain their existing behavior.
 *
 * All output validated against the official AsyncAPI 3.1.0 JSON Schema.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import type {
  ParsedAsyncAPIDocument,
  JsonSchema,
} from "../../src/domain/models/asyncapi-document.js";

function getSchema(doc: ParsedAsyncAPIDocument, name: string): JsonSchema {
  return doc.components!.schemas![name];
}

describe("allOf for model inheritance", () => {
  it("emits allOf for derived model with empty body", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Animal { name: string; }
      model Dog extends Animal {}
      @channel("events") op publish(): Dog;
    `);
    const dog = getSchema(doc, "Dog");
    expect(dog.allOf).toHaveLength(1);
    expect(dog.allOf![0].$ref).toBe("#/components/schemas/Animal");
    expect(dog.type).toBe("object");
  });

  it("property override: derived property narrows base type", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Base { kind: string; name: string; }
      model Derived extends Base { kind: "special"; extra: boolean; }
      @channel("events") op publish(): Derived;
    `);
    const derived = getSchema(doc, "Derived");
    expect(derived.allOf![0].$ref).toBe("#/components/schemas/Base");
    expect(derived.properties!.kind).toStrictEqual({ const: "special" });
    expect(derived.properties!.extra.type).toBe("boolean");
    const base = getSchema(doc, "Base");
    expect(base.properties!.kind.type).toBe("string");
  });

  it("allOf with deprecated and doc metadata on both models", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @doc("Base model description")
      model Base { id: string; }
      #deprecated "Use NewDerived instead"
      model Derived extends Base { name: string; }
      @channel("events") op publish(): Derived;
    `);
    const derived = getSchema(doc, "Derived");
    expect(derived.allOf).toBeDefined();
    expect(derived.deprecated).toBe(true);
    expect(derived.properties!.name).toBeDefined();
    const base = getSchema(doc, "Base");
    expect(base.description).toBe("Base model description");
  });

  it("deeply nested inheritance: 4-level chain produces linked allOf", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model A { a: string; }
      model B extends A { b: string; }
      model C extends B { c: string; }
      model D extends C { d: string; }
      @channel("events") op publish(): D;
    `);
    const d = getSchema(doc, "D");
    expect(d.allOf![0].$ref).toBe("#/components/schemas/C");
    expect(d.properties!.d).toBeDefined();
    expect(d.properties!.a).toBeUndefined();

    const c = getSchema(doc, "C");
    expect(c.allOf![0].$ref).toBe("#/components/schemas/B");

    const b = getSchema(doc, "B");
    expect(b.allOf![0].$ref).toBe("#/components/schemas/A");

    const a = getSchema(doc, "A");
    expect(a.allOf).toBeUndefined();
  });
});

describe("@discriminator on models", () => {
  it("emits discriminator keyword on model with @discriminator", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @discriminator("kind")
      model Animal {
        kind: string;
        name: string;
      }
      @channel("events") op publish(): Animal;
    `);
    const animal = getSchema(doc, "Animal");
    expect(animal.discriminator).toBe("kind");
    expect(animal.properties!.kind).toBeDefined();
    expect(animal.properties!.name).toBeDefined();
  });

  it("full polymorphic pattern: discriminator parent + allOf child", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @discriminator("kind")
      model Animal {
        kind: string;
        name: string;
      }
      model Dog extends Animal {
        kind: "dog";
        breed: string;
      }
      model Cat extends Animal {
        kind: "cat";
        whiskers: int32;
      }
      @channel("events") op publish(): Dog;
      @channel("events2") op publish2(): Cat;
    `);
    const animal = getSchema(doc, "Animal");
    expect(animal.discriminator).toBe("kind");

    const dog = getSchema(doc, "Dog");
    expect(dog.allOf![0].$ref).toBe("#/components/schemas/Animal");
    expect(dog.properties!.kind).toStrictEqual({ const: "dog" });
    expect(dog.properties!.breed).toBeDefined();

    const cat = getSchema(doc, "Cat");
    expect(cat.allOf![0].$ref).toBe("#/components/schemas/Animal");
    expect(cat.properties!.kind).toStrictEqual({ const: "cat" });
    expect(cat.properties!.whiskers).toBeDefined();
  });

  it("discriminator does not appear on models without @discriminator", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Plain { id: string; }
      @channel("events") op publish(): Plain;
    `);
    const plain = getSchema(doc, "Plain");
    expect(plain.discriminator).toBeUndefined();
  });
});

describe("oneOf for model-variant unions", () => {
  it("inline union of models emits oneOf with $ref", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Dog { breed: string; }
      model Cat { whiskers: int32; }
      model Owner { pet: Dog | Cat; }
      @channel("events") op publish(): Owner;
    `);
    const { pet } = getSchema(doc, "Owner").properties!;
    expect(pet.oneOf).toHaveLength(2);
    expect(pet.oneOf![0].$ref).toBe("#/components/schemas/Dog");
    expect(pet.oneOf![1].$ref).toBe("#/components/schemas/Cat");
    expect(pet.anyOf).toBeUndefined();
  });

  it("named union as property type emits oneOf with $ref", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Dog { breed: string; }
      model Cat { whiskers: int32; }
      union Pet { dog: Dog; cat: Cat; }
      model Owner { pet: Pet; }
      @channel("events") op publish(): Owner;
    `);
    const { pet } = getSchema(doc, "Owner").properties!;
    expect(pet.oneOf).toHaveLength(2);
    expect(pet.oneOf![0].$ref).toBe("#/components/schemas/Dog");
    expect(pet.oneOf![1].$ref).toBe("#/components/schemas/Cat");
  });

  it("mixed-type union (string | int32) stays anyOf", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { value: string | int32; }
      @channel("events") op publish(): Event;
    `);
    const { value } = getSchema(doc, "Event").properties!;
    expect(value.anyOf).toHaveLength(2);
    expect(value.oneOf).toBeUndefined();
  });

  it("string-literal union stays enum", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { status: "active" | "inactive" | "pending"; }
      @channel("events") op publish(): Event;
    `);
    const { status } = getSchema(doc, "Event").properties!;
    expect(status.enum).toStrictEqual(["active", "inactive", "pending"]);
    expect(status.type).toBe("string");
    expect(status.oneOf).toBeUndefined();
    expect(status.anyOf).toBeUndefined();
  });

  it("three-model union emits oneOf with three refs", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model A { a: string; }
      model B { b: string; }
      model C { c: string; }
      model Container { item: A | B | C; }
      @channel("events") op publish(): Container;
    `);
    const { item } = getSchema(doc, "Container").properties!;
    expect(item.oneOf).toHaveLength(3);
    expect(item.anyOf).toBeUndefined();
  });
});

describe("not keyword type availability", () => {
  it("jsonSchema type accepts not field", () => {
    const schema: JsonSchema = { not: { type: "null" } };
    expect(schema.not).toBeDefined();
    expect(schema.not!.type).toBe("null");
  });
});
