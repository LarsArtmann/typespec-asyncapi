import "typespec-asyncapi";
using AsyncAPI;

/**
 * Order-processing event API for a Kafka-backed order pipeline.
 *
 * Publishes order lifecycle events (placed, status updates) and order
 * cancellation events onto a Kafka broker for downstream consumers such as
 * fulfillment, billing, and notifications. Also registers a Confluent Schema
 * Registry for the pipeline's Avro/JSON schemas -- since the `main` server
 * below has protocol `"kafka-secure"`, it still picks up a matching server
 * binding (Kafka bindings are orthogonal to security). The broker requires
 * SASL/SCRAM-SHA-256 authentication, declared via `@securityScheme` and
 * attached to `main` via `@serverSecurity`.
 */
@service(#{ title: "Order Events API" })
@server(
  "main",
  "broker.example.com:9092",
  "kafka-secure",
  "Primary Kafka broker for order events"
)
@Kafka.schemaRegistry("https://schema-registry.example.com", "confluent")
@securityScheme(
  "saslScram",
  #{ type: "scramSha256", description: "SASL/SCRAM-SHA-256 authentication for the Kafka broker." }
)
@serverSecurity("main", #["saslScram"])
namespace OrderEvents {
  /** A line item within an order. */
  model OrderItem {
    /** Stock-keeping unit identifying the ordered product. */
    sku: string;

    /** Number of units ordered. */
    quantity: int32;

    /** Unit price in the order's currency, at time of purchase. */
    unitPrice: float32;
  }

  /** Postal shipping address for an order. */
  model ShippingAddress {
    /** Street address, including number and unit. */
    street: string;

    /** City name. */
    city: string;

    /** Postal or ZIP code. */
    postalCode: string;

    /** ISO 3166-1 alpha-2 country code. */
    country: string;
  }

  /** Lifecycle status of an order. */
  enum OrderStatus {
    Placed,
    Confirmed,
    Shipped,
    Delivered,
    Cancelled,
  }

  /** Emitted when a new order is placed by a customer. */
  model OrderPlaced {
    /** Order identifier; also used to correlate downstream events. */
    @header
    @correlationId
    orderId: string;

    /** Identifier of the customer who placed the order; also the Kafka message key. */
    @Kafka.key
    customerId: string;

    /** Items included in the order. */
    items: OrderItem[];

    /** Where the order should be shipped. */
    shippingAddress: ShippingAddress;

    /** Timestamp the order was placed. */
    placedAt: utcDateTime;

    /** Optional free-text notes from the customer. */
    notes?: string;
  }

  /** Emitted whenever an order's lifecycle status changes. */
  model OrderStatusUpdated {
    /** Order identifier; also used to correlate downstream events. */
    @header
    @correlationId
    orderId: string;

    /** The order's new status. */
    status: OrderStatus;

    /** Timestamp the status changed. */
    updatedAt: utcDateTime;
  }

  /**
   * Emitted when an order is cancelled, either by the customer or by an
   * operator. Named `order.cancelled` on the wire rather than the model name.
   */
  @message("order.cancelled")
  model OrderCancellation {
    /** Order identifier; also used to correlate downstream events. */
    @header
    @correlationId
    orderId: string;

    /** Optional human-readable cancellation reason. */
    reason?: string;

    /** Timestamp the cancellation was recorded. */
    cancelledAt: utcDateTime;
  }

  /**
   * Publishes an order-placed event onto the order lifecycle channel.
   * Declares the topic's Kafka configuration (6 partitions, replication
   * factor 3) via `@Kafka.topicConfig`.
   */
  @channel("orders.lifecycle")
  @publish
  @Kafka.topicConfig(6, 3)
  op publishOrderPlaced(payload: OrderPlaced): void;

  /**
   * Consumes order status-change events from the order lifecycle channel,
   * as part of the `order-status-consumers` Kafka consumer group.
   */
  @channel("orders.lifecycle")
  @subscribe
  @Kafka.groupId("order-status-consumers")
  op consumeOrderStatusUpdated(payload: OrderStatusUpdated): void;

  /** Publishes an order-cancellation event for a specific order. */
  @channel("orders.{orderId}.cancellations")
  @publish
  op publishOrderCancellation(payload: OrderCancellation): void;

  /**
   * Consumes order-cancellation events for a specific order, e.g. a
   * fulfillment service reacting to a late cancellation.
   */
  @channel("orders.{orderId}.cancellations")
  @subscribe
  op consumeOrderCancellation(payload: OrderCancellation): void;
}
