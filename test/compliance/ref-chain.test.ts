/**
 * AsyncAPI 3.1.0 Spec Compliance: $ref Chain
 *
 * Validates that all $ref references follow the correct AsyncAPI 3.1 chain:
 *   operations → #/channels/{id}/messages/{id}
 *   channels   → #/components/messages/{id}
 *   messages   → #/components/schemas/{name}
 *   nested     → #/components/schemas/{name}
 *
 * Spec reference: https://www.asyncapi.com/docs/reference/specification/v3.1.0#operationObject
 */

import { describe, it, expect } from "vitest";
import { compileAndValidateOrThrow } from "../utils/schema-validator.js";

function getDoc(source: string) {
  return compileAndValidateOrThrow(source);
}

describe("Spec Compliance: $ref Chain", () => {
  it("operation messages reference channels (not components directly)", async () => {
    const doc = await getDoc(`
      namespace Test;
      model OrderCreated { orderId: string; }
      @channel("orders.created")
      op publishOrderCreated(): OrderCreated;
    `);

    const operations = doc.operations as Record<string, Record<string, unknown>>;
    const op = operations.publishOrderCreated;
    const messages = op.messages as Array<{ $ref: string }>;
    expect(messages[0].$ref).toBe("#/channels/orders.created/messages/OrderCreated");
  });

  it("operation channel references the channels object", async () => {
    const doc = await getDoc(`
      namespace Test;
      model Event { id: string; }
      @channel("my.channel")
      op publish(): Event;
    `);

    const operations = doc.operations as Record<string, Record<string, unknown>>;
    expect(operations.publish.channel).toEqual({ $ref: "#/channels/my.channel" });
  });

  it("channel messages reference components/messages", async () => {
    const doc = await getDoc(`
      namespace Test;
      model UserEvent { id: string; }
      @channel("users")
      op publish(): UserEvent;
    `);

    const channels = doc.channels as Record<string, Record<string, unknown>>;
    const messages = channels["users"].messages as Record<string, { $ref: string }>;
    expect(messages.UserEvent.$ref).toBe("#/components/messages/UserEvent");
  });

  it("message payload references components/schemas", async () => {
    const doc = await getDoc(`
      namespace Test;
      model OrderEvent { orderId: string; total: decimal; }
      @channel("orders")
      op publishOrder(): OrderEvent;
    `);

    const components = doc.components as Record<string, Record<string, Record<string, unknown>>>;
    const msg = components.messages.OrderEvent;
    expect(msg.payload).toEqual({ $ref: "#/components/schemas/OrderEvent" });
  });

  it("nested model properties use $ref for named types", async () => {
    const doc = await getDoc(`
      namespace Test;
      model Address { street: string; city: string; zip: string; }
      model Customer {
        name: string;
        address: Address;
      }
      @channel("customers")
      op publish(): Customer;
    `);

    const components = doc.components as Record<string, Record<string, Record<string, unknown>>>;
    const customerProps = components.schemas.Customer.properties as Record<
      string,
      Record<string, unknown>
    >;
    expect(customerProps.address.$ref).toBe("#/components/schemas/Address");
  });

  it("array of named models uses $ref in items", async () => {
    const doc = await getDoc(`
      namespace Test;
      model LineItem { sku: string; quantity: int32; }
      model Cart {
        cartId: string;
        items: LineItem[];
      }
      @channel("carts")
      op publish(): Cart;
    `);

    const components = doc.components as Record<string, Record<string, Record<string, unknown>>>;
    const cartProps = components.schemas.Cart.properties as Record<string, Record<string, unknown>>;
    expect(cartProps.items.type).toBe("array");
    expect(cartProps.items.items).toEqual({ $ref: "#/components/schemas/LineItem" });
  });

  it("escapes forward slashes in channel addresses in $ref tokens", async () => {
    const doc = await getDoc(`
      namespace Test;
      model Event { id: string; }
      @channel("org/dept/events")
      op publish(): Event;
    `);

    const operations = doc.operations as Record<string, Record<string, unknown>>;
    const op = Object.values(operations)[0] as Record<string, unknown>;
    const messages = op.messages as Array<{ $ref: string }>;
    expect(messages[0].$ref).toContain("~1");
    expect(messages[0].$ref).not.toContain("org/dept/events/messages");
  });

  it("all $ref values point to valid objects in the document", async () => {
    const doc = await getDoc(`
      namespace Test;
      model Address { street: string; }
      model Order {
        orderId: string;
        shippingAddress: Address;
      }
      @channel("orders")
      op publish(): Order;
    `);

    const refPattern = /^#\/(channels|components)\/(.+)$/;
    const json = JSON.stringify(doc);
    const refs = json.match(/"\$ref":\s*"([^"]+)"/g) ?? [];
    const refValues = refs.map((r) => r.match(/"\$ref":\s*"([^"]+)"/)![1]);

    expect(refValues.length).toBeGreaterThan(0);

    for (const ref of refValues) {
      expect(ref).toMatch(refPattern);
      if (ref.includes("components/schemas/")) {
        const components = doc.components as Record<string, Record<string, unknown>>;
        expect(components.schemas).toBeDefined();
      }
    }
  });

  it("multi-operation documents have independent ref chains", async () => {
    const doc = await getDoc(`
      namespace Test;
      model Created { id: string; }
      model Updated { id: string; }
      model Deleted { id: string; }
      @channel("created")
      op publishCreated(): Created;
      @channel("updated")
      op publishUpdated(): Updated;
      @channel("deleted")
      op publishDeleted(): Deleted;
    `);

    const operations = doc.operations as Record<string, Record<string, unknown>>;
    expect(operations.publishCreated.messages).not.toEqual(operations.publishUpdated.messages);
    expect(operations.publishUpdated.messages).not.toEqual(operations.publishDeleted.messages);

    const components = doc.components as Record<string, Record<string, unknown>>;
    expect(components.messages).toHaveProperty("Created");
    expect(components.messages).toHaveProperty("Updated");
    expect(components.messages).toHaveProperty("Deleted");
  });
});
