/**
 * External documentation compliance.
 *
 * `@externalDocs` targets Operation (operation.externalDocs), Model
 * (message.externalDocs), and Namespace (root document externalDocs).
 * Non-absolute URLs produce the invalid-external-docs-config warning and
 * are not stored.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import { compileAsyncAPI } from "../utils/test-helpers.js";
import { inlineObject } from "../utils/type-guards.js";

describe("externalDocs decorator", () => {
  it("emits externalDocs on the operation, the message, and the document root", async () => {
    const doc = await compileAndValidateOrThrow(`
      @externalDocs("https://example.com/api-docs", "API-wide documentation")
      namespace Demo;

      @externalDocs("https://example.com/message-docs")
      model OrderPlaced {
        orderId: string;
      }

      @channel("orders")
      @externalDocs("https://example.com/order-flow", "Order lifecycle")
      @publish
      op placeOrder(): OrderPlaced;
    `);

    expect(doc.info.externalDocs).toStrictEqual({
      url: "https://example.com/api-docs",
      description: "API-wide documentation",
    });
    const op = doc.operations.placeOrder;
    expect(op?.externalDocs).toStrictEqual({
      url: "https://example.com/order-flow",
      description: "Order lifecycle",
    });
    const message = inlineObject(doc.components.messages.OrderPlaced);
    expect(message.externalDocs).toStrictEqual({
      url: "https://example.com/message-docs",
    });
  });

  it("warns and skips a relative URL", async () => {
    const { asyncApiDoc, diagnostics } = await compileAsyncAPI(`
      namespace Demo;

      @externalDocs("not-absolute")
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    expect(
      diagnostics.some((d) => d.code?.endsWith("invalid-external-docs-config")),
    ).toBeTruthy();
    expect(
      inlineObject(asyncApiDoc?.components?.messages?.Event).externalDocs,
    ).toBeUndefined();
  });
});
