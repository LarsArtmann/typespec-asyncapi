/**
 * Model Composition & Documentation Propagation
 *
 * Tests model inheritance chains, property override behavior,
 * @doc propagation on models, properties, and enums, deeply
 * nested model references, and enum $ref patterns.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import type {
  ParsedAsyncAPIDocument,
  JsonSchema,
} from "../../src/domain/models/asyncapi-document.js";

function getSchema(doc: ParsedAsyncAPIDocument, name: string): JsonSchema {
  return doc.components!.schemas![name];
}

describe("model inheritance and composition", () => {
  it("emits allOf for base model inheritance", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Base { id: string; createdAt: utcDateTime; }
      model Derived extends Base { name: string; }
      @channel("events") op publish(): Derived;
    `);
    const s = getSchema(doc, "Derived");
    expect(s.allOf).toHaveLength(1);
    expect(s.allOf![0].$ref).toBe("#/components/schemas/Base");
    expect(s.properties!.name).toBeDefined();
    expect(s.properties!.id).toBeUndefined();
    expect(s.properties!.createdAt).toBeUndefined();
    expect(s.type).toBe("object");
    const base = getSchema(doc, "Base");
    expect(base.properties!.id).toBeDefined();
    expect(base.properties!.createdAt).toBeDefined();
  });

  it("separates required fields: base in base, derived in derived", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Base { id: string; }
      model Derived extends Base { name: string; optional?: string; }
      @channel("events") op publish(): Derived;
    `);
    const s = getSchema(doc, "Derived");
    expect(s.allOf).toBeDefined();
    expect(s.required).toContain("name");
    expect(s.required).not.toContain("id");
    expect(s.required).not.toContain("optional");
    const base = getSchema(doc, "Base");
    expect(base.required).toContain("id");
  });

  it("supports multi-level inheritance chain with chained allOf", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model A { a: string; }
      model B extends A { b: int32; }
      model C extends B { c: boolean; }
      @channel("events") op publish(): C;
    `);
    const c = getSchema(doc, "C");
    expect(c.allOf![0].$ref).toBe("#/components/schemas/B");
    expect(c.properties!.c).toBeDefined();
    expect(c.properties!.a).toBeUndefined();
    expect(c.properties!.b).toBeUndefined();

    const b = getSchema(doc, "B");
    expect(b.allOf![0].$ref).toBe("#/components/schemas/A");
    expect(b.properties!.b).toBeDefined();

    const a = getSchema(doc, "A");
    expect(a.allOf).toBeUndefined();
    expect(a.properties!.a).toBeDefined();
  });

  it("base model property @doc is preserved in base schema", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Base {
        @doc("Base value")
        value: string;
      }
      model Derived extends Base { extra: int32; }
      @channel("events") op publish(): Derived;
    `);
    const base = getSchema(doc, "Base");
    expect(base.properties!.value.description).toBe("Base value");
    const s = getSchema(doc, "Derived");
    expect(s.allOf![0].$ref).toBe("#/components/schemas/Base");
    expect(s.properties!.extra).toBeDefined();
    expect(s.properties!.value).toBeUndefined();
  });

  it("references base model schema when used as property type", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Address { street: string; city: string; }
      model Company { name: string; hq: Address; }
      model Employee { name: string; company: Company; }
      @channel("events") op publish(): Employee;
    `);
    const employee = getSchema(doc, "Employee");
    expect(employee.properties!.company.$ref).toBe(
      "#/components/schemas/Company",
    );

    const company = getSchema(doc, "Company");
    expect(company.properties!.hq.$ref).toBe("#/components/schemas/Address");

    expect(getSchema(doc, "Address")).toBeDefined();
  });

  it("emits both base and derived models as separate schemas", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Animal { name: string; }
      model Dog extends Animal { breed: string; }
      @channel("events") op publish(): Dog;
    `);
    expect(doc.components!.schemas!.Animal).toBeDefined();
    expect(doc.components!.schemas!.Dog).toBeDefined();
  });
});

describe("documentation propagation", () => {
  it("applies @doc to model declaration as description", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @doc("A user account record")
      model User { id: string; }
      @channel("events") op publish(): User;
    `);
    const s = getSchema(doc, "User");
    expect(s.description).toBe("A user account record");
  });

  it("applies @doc to model properties as description", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model User {
        @doc("Unique identifier")
        id: string;
        @doc("Display name")
        name: string;
      }
      @channel("events") op publish(): User;
    `);
    const s = getSchema(doc, "User");
    expect(s.properties!.id.description).toBe("Unique identifier");
    expect(s.properties!.name.description).toBe("Display name");
  });

  it("applies @doc to enum declaration as description", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @doc("Order status values")
      enum OrderStatus { Pending, Shipped, Delivered, Cancelled }
      model Event { status: OrderStatus; }
      @channel("events") op publish(): Event;
    `);
    const s = getSchema(doc, "OrderStatus");
    expect(s.description).toBe("Order status values");
    expect(s.enum).toStrictEqual([
      "Pending",
      "Shipped",
      "Delivered",
      "Cancelled",
    ]);
  });

  it("combines model-level and property-level @doc", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      @doc("Product catalog item")
      model Product {
        @doc("Stock keeping unit")
        sku: string;
        @doc("Retail price in USD")
        price: float64;
      }
      @channel("events") op publish(): Product;
    `);
    const s = getSchema(doc, "Product");
    expect(s.description).toBe("Product catalog item");
    expect(s.properties!.sku.description).toBe("Stock keeping unit");
    expect(s.properties!.price.description).toBe("Retail price in USD");
  });

  it("references named enum as $ref in property", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      enum Color { Red, Green, Blue }
      model Product { color: Color; }
      @channel("events") op publish(): Product;
    `);
    const s = getSchema(doc, "Product");
    expect(s.properties!.color.$ref).toBe("#/components/schemas/Color");
    const colorSchema = getSchema(doc, "Color");
    expect(colorSchema.enum).toStrictEqual(["Red", "Green", "Blue"]);
  });
});

describe("complex model patterns", () => {
  it("handles array of arrays (nested arrays)", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Matrix { grid: string[][]; }
      @channel("events") op publish(): Matrix;
    `);
    const s = getSchema(doc, "Matrix");
    expect(s.properties!.grid.type).toBe("array");
    expect(s.properties!.grid.items!.type).toBe("array");
  });

  it("handles Record of named models as additionalProperties $ref", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Item { sku: string; }
      model Store { inventory: Record<Item>; }
      @channel("events") op publish(): Store;
    `);
    const s = getSchema(doc, "Store");
    expect(s.properties!.inventory.type).toBe("object");
    expect(s.properties!.inventory.additionalProperties).toStrictEqual({
      $ref: "#/components/schemas/Item",
    });
  });

  it("handles union of string literals as enum in property", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { priority: "low" | "medium" | "high"; }
      @channel("events") op publish(): Event;
    `);
    const s = getSchema(doc, "Event");
    expect(s.properties!.priority.enum).toStrictEqual([
      "low",
      "medium",
      "high",
    ]);
    expect(s.properties!.priority.type).toBe("string");
  });

  it("handles optional enum property", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      enum Status { Active, Inactive }
      model Event { status?: Status; }
      @channel("events") op publish(): Event;
    `);
    const s = getSchema(doc, "Event");
    expect(s.required).toBeUndefined();
    expect(s.properties!.status.$ref).toBe("#/components/schemas/Status");
  });
});
