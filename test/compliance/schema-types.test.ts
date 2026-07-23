/**
 * AsyncAPI 3.1.0 Spec Compliance: Schema Types
 *
 * Validates that all TypeSpec scalar types produce correct JSON Schema
 * output and that the document validates against the AsyncAPI 3.1.0 schema.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import type {
  ParsedAsyncAPIDocument,
  JsonSchema,
} from "../../src/domain/models/asyncapi-document.js";

function getSchema(doc: ParsedAsyncAPIDocument, name: string): JsonSchema {
  return doc.components!.schemas![name];
}

describe("spec Compliance: Schema Types", () => {
  it("maps string type correctly", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { value: string; }
      @channel("events")
      op publish(): Event;
    `);
    const schema = getSchema(doc, "Event");
    const props = schema.properties!;
    expect(props.value.type).toBe("string");
  });

  it("maps boolean type correctly", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { active: boolean; }
      @channel("events")
      op publish(): Event;
    `);
    const schema = getSchema(doc, "Event");
    const props = schema.properties!;
    expect(props.active.type).toBe("boolean");
  });

  it("maps int32 type correctly", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { count: int32; }
      @channel("events")
      op publish(): Event;
    `);
    const schema = getSchema(doc, "Event");
    const props = schema.properties!;
    expect(props.count.type).toBe("integer");
  });

  it("maps int64 type correctly with format", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { timestamp: int64; }
      @channel("events")
      op publish(): Event;
    `);
    const schema = getSchema(doc, "Event");
    const props = schema.properties!;
    expect(props.count?.type ?? props.timestamp.type).toBe("integer");
    expect(props.timestamp.format).toBe("int64");
  });

  it("maps float32 to number with float format", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { score: float32; }
      @channel("events")
      op publish(): Event;
    `);
    const schema = getSchema(doc, "Event");
    const props = schema.properties!;
    expect(props.score.type).toBe("number");
    expect(props.score.format).toBe("float");
  });

  it("maps float64 to number with double format", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { value: float64; }
      @channel("events")
      op publish(): Event;
    `);
    const schema = getSchema(doc, "Event");
    const props = schema.properties!;
    expect(props.value.type).toBe("number");
    expect(props.value.format).toBe("double");
  });

  it("maps decimal to string with decimal format", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { amount: decimal; }
      @channel("events")
      op publish(): Event;
    `);
    const schema = getSchema(doc, "Event");
    const props = schema.properties!;
    expect(props.amount.type).toBe("string");
    expect(props.amount.format).toBe("decimal");
  });

  it("maps bytes to string with byte format", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { data: bytes; }
      @channel("events")
      op publish(): Event;
    `);
    const schema = getSchema(doc, "Event");
    const props = schema.properties!;
    expect(props.data.type).toBe("string");
    expect(props.data.format).toBe("byte");
  });

  it("maps utcDateTime to string with date-time format", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { createdAt: utcDateTime; }
      @channel("events")
      op publish(): Event;
    `);
    const schema = getSchema(doc, "Event");
    const props = schema.properties!;
    expect(props.createdAt.type).toBe("string");
    expect(props.createdAt.format).toBe("date-time");
  });

  it("maps url to string with uri format", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { link: url; }
      @channel("events")
      op publish(): Event;
    `);
    const schema = getSchema(doc, "Event");
    const props = schema.properties!;
    expect(props.link.type).toBe("string");
    expect(props.link.format).toBe("uri");
  });

  it("maps array types correctly with items", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event { tags: string[]; }
      @channel("events")
      op publish(): Event;
    `);
    const schema = getSchema(doc, "Event");
    const props = schema.properties!;
    expect(props.tags.type).toBe("array");
    expect(props.tags.items!.type).toBe("string");
  });

  it("maps enum unions correctly", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event {
        status: "pending" | "active" | "closed";
      }
      @channel("events")
      op publish(): Event;
    `);
    const schema = getSchema(doc, "Event");
    const props = schema.properties!;
    expect(props.status.enum).toStrictEqual(["pending", "active", "closed"]);
  });

  it("maps optional fields correctly with required array", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Test;
      model Event {
        id: string;
        name?: string;
      }
      @channel("events")
      op publish(): Event;
    `);
    const schema = getSchema(doc, "Event");
    expect(schema.required).toStrictEqual(["id"]);
  });

  it("maps nested model references as $ref", async () => {
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

    const addressSchema = getSchema(doc, "Address");
    expect(addressSchema.type).toBe("object");
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
    expect(props.items.type).toBe("array");
    expect(props.items.items!.$ref).toBe("#/components/schemas/Item");
  });
});
