/**
 * Source: milehimikey/typespec-asyncapi (examples/kafka-orders/main.tsp, 153 lines)
 * Repo:   https://github.com/milehimikey/typespec-asyncapi
 *
 * Another TypeSpec AsyncAPI emitter (for AsyncAPI 3.0). This fixture tests
 * whether model definitions from a DIFFERENT AsyncAPI emitter's examples
 * compile correctly through THIS emitter.
 *
 * STRIPPED: Custom Kafka decorators (@Kafka.key, @Kafka.topicConfig, @Kafka.schemaRegistry),
 *           @securityScheme/@serverSecurity (different emitter's API), "kafka-secure" protocol
 *
 * KEPT (verbatim): OrderItem, ShippingAddress, OrderStatus enum, OrderPlaced,
 *                  OrderStatusUpdated, OrderCancellation models, @header, @correlationId,
 *                  @message decorators
 */
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

@service(#{ title: "Order Events API" })
@apiVersion("1.0.0")
@server("main", "broker.example.com:9092", "kafka", "Primary Kafka broker for order events")
namespace OrderEvents;

model OrderItem {
  sku: string;
  quantity: int32;
  unitPrice: float32;
}

model ShippingAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

enum OrderStatus {
  Placed,
  Confirmed,
  Shipped,
  Delivered,
  Cancelled,
}

model OrderPlaced {
  @header
  @correlationId
  orderId: string;

  customerId: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  placedAt: utcDateTime;
  notes?: string;
}

model OrderStatusUpdated {
  @header
  @correlationId
  orderId: string;

  status: OrderStatus;
  updatedAt: utcDateTime;
}

@message("order.cancelled")
model OrderCancellation {
  @header
  @correlationId
  orderId: string;

  reason?: string;
  cancelledAt: utcDateTime;
}

@channel("orders.lifecycle")
@publish
op publishOrderPlaced(payload: OrderPlaced): void;

@channel("orders.lifecycle")
@subscribe
op consumeOrderStatusUpdated(payload: OrderStatusUpdated): void;

@channel("orders.{orderId}.cancellations")
@publish
op publishOrderCancellation(payload: OrderCancellation): void;

@channel("orders.{orderId}.cancellations")
@subscribe
op consumeOrderCancellation(payload: OrderCancellation): void;
