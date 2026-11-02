/**
 * The landing-page before/after pair.
 *
 * `heroTypeSpec` is compiled by the real emitter in
 * `test/unit/hero-fixture.test.ts`, which asserts `heroAsyncAPI` is byte-for-byte
 * what the emitter produces and that the result validates against the official
 * AsyncAPI 3.1.0 JSON Schema. Never hand-edit `heroAsyncAPI`: run the test and
 * copy the diff it reports.
 */

export const heroTypeSpec = `import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@service(#{ title: "Orders" })
namespace Orders;

model OrderPlaced {
  orderId: string;
  total: decimal;
  placedAt: utcDateTime;
}

@channel("orders.placed")
@publish
@protocol(#{ protocol: "kafka", topic: "orders.placed", partitions: 6 })
op publishOrderPlaced(): OrderPlaced;
`;

export const heroAsyncAPI = `asyncapi: 3.1.0
info:
  title: Orders
  version: 1.0.0
channels:
  orders.placed:
    address: orders.placed
    messages:
      OrderPlaced:
        $ref: "#/components/messages/OrderPlaced"
    bindings:
      kafka:
        partitions: 6
        topic: orders.placed
        bindingVersion: 0.5.0
operations:
  publishOrderPlaced:
    action: send
    channel:
      $ref: "#/channels/orders.placed"
    messages:
      - $ref: "#/channels/orders.placed/messages/OrderPlaced"
components:
  messages:
    OrderPlaced:
      name: OrderPlaced
      contentType: application/json
      title: OrderPlaced
      payload:
        $ref: "#/components/schemas/OrderPlaced"
  schemas:
    OrderPlaced:
      properties:
        orderId:
          type: string
        total:
          format: decimal
          type: string
        placedAt:
          format: date-time
          type: string
      type: object
      required:
        - orderId
        - total
        - placedAt
`;
