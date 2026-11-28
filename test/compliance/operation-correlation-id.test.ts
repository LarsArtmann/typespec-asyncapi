/**
 * Operation-level `@correlationId` compliance.
 *
 * `@correlationId` accepts an Operation target and applies the correlation
 * to every message that operation references. Explicit model-level
 * correlationIds win (skipExisting semantics).
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import { inlineObject } from "../utils/type-guards.js";

describe("operation-level correlationId", () => {
  it("applies the correlationId to all messages of the operation", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Demo;

      model OrderPlaced {
        orderId: string;
      }

      model OrderShipped {
        shipmentId: string;
      }

      @channel("orders", "placed-channel")
      @correlationId("$message.header#/correlationId")
      @publish
      op placeOrder(): OrderPlaced;

      @channel("orders", "shipped-channel")
      @correlationId("$message.header#/correlationId")
      @publish
      op shipOrder(): OrderShipped;
    `);

    const placed = inlineObject(doc.components.messages.OrderPlaced);
    expect(placed.correlationId).toStrictEqual({
      location: "$message.header#/correlationId",
    });
    const shipped = inlineObject(doc.components.messages.OrderShipped);
    expect(shipped.correlationId).toStrictEqual({
      location: "$message.header#/correlationId",
    });
  });

  it("lets an explicit model-level correlationId win over the operation's", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Demo;

      @correlationId("$message.header#/modelId")
      model OrderPlaced {
        orderId: string;
      }

      @channel("orders")
      @correlationId("$message.header#/opId")
      @publish
      op placeOrder(): OrderPlaced;
    `);

    const placed = inlineObject(doc.components.messages.OrderPlaced);
    expect(placed.correlationId).toStrictEqual({
      location: "$message.header#/modelId",
    });
  });
});
