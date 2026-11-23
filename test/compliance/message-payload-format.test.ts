/**
 * Multi-format message payload compliance.
 *
 * `@message` accepts a raw `payload` object emitted verbatim, paired with
 * `schemaFormat`, so non-JSON-Schema payloads (Avro, Protobuf) can be
 * declared without fighting the JSON Schema emitter.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import { inlineObject } from "../utils/type-guards.js";

describe("multi-format message payloads", () => {
  it("emits an Avro payload verbatim alongside schemaFormat", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Demo;
      @channel("orders")
      @publish
      op placeOrder(): AvroOrder;

      @message(#{
        schemaFormat: "application/vnd.apache.avro+json;version=1.9.0",
        payload: #{
          type: "record",
          name: "Order",
          fields: #[
            #{ name: "id", type: "string" },
            #{ name: "qty", type: "int" }
          ]
        }
      })
      model AvroOrder {
        id: string;
        qty: int32;
      }
    `);

    const message = inlineObject(doc.components.messages.AvroOrder);
    expect(message.schemaFormat).toBe(
      "application/vnd.apache.avro+json;version=1.9.0",
    );
    expect(message.payload).toStrictEqual({
      type: "record",
      name: "Order",
      fields: [
        { name: "id", type: "string" },
        { name: "qty", type: "int" },
      ],
    });
  });

  it("keeps the JSON Schema payload when no raw payload is configured", async () => {
    const doc = await compileAndValidateOrThrow(`
      namespace Demo;
      @channel("orders")
      @publish
      op placeOrder(): JsonOrder;

      @message(#{ contentType: "application/json" })
      model JsonOrder {
        id: string;
      }
    `);

    const message = inlineObject(doc.components.messages.JsonOrder);
    expect(message.schemaFormat).toBeUndefined();
    expect(message.payload).toStrictEqual({
      $ref: "#/components/schemas/JsonOrder",
    });
  });
});
