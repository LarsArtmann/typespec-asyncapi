/**
 * TypeSpec AsyncAPI Decorator Usage Examples
 *
 * This file demonstrates all available decorators and their usage patterns
 * for generating AsyncAPI 3.0 specifications from TypeSpec definitions.
 */

import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

// =============================================================================
// BASIC EXAMPLE - Simple publish/subscribe with channel
// =============================================================================

namespace BasicExample {
  @message({
    title: "User Event",
    description: "User lifecycle event",
    contentType: "application/json",
  })
  model UserEvent {
    userId: string;
    eventType: string;
    timestamp: utcDateTime;
  }

  @channel("users/{userId}/events")
  @publish
  op publishUserEvent(): UserEvent;

  @channel("users/{userId}/events")
  @subscribe
  op subscribeUserEvents(): UserEvent;
}

// =============================================================================
// SERVER CONFIGURATION EXAMPLE
// =============================================================================

namespace ServerExample {
  @server({
    name: "production",
    url: "kafka.prod.example.com:9092",
    protocol: "kafka",
    description: "Production Kafka cluster",
  })
  namespace ProductionService {
    @message({
      title: "Order Event",
      description: "Order lifecycle event",
    })
    model OrderEvent {
      orderId: string;
      status: "created" | "updated" | "cancelled";
      amount: decimal;
    }

    @channel("orders/{orderId}")
    @publish
    op publishOrderEvent(): OrderEvent;
  }
}

// =============================================================================
// SECURITY CONFIGURATION EXAMPLE
// =============================================================================

namespace SecurityExample {
  @message({
    title: "Payment Event",
    description: "Payment processing event",
  })
  model PaymentEvent {
    paymentId: string;
    amount: decimal;
    currency: string;
  }

  @channel("payments/{paymentId}")
  @security({
    name: "bearerAuth",
    scheme: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  })
  @publish
  op publishPaymentEvent(): PaymentEvent;
}

// =============================================================================
// PROTOCOL BINDINGS EXAMPLE
// =============================================================================

namespace ProtocolExample {
  @protocol({
    protocol: "kafka",
    partitions: 6,
    replicationFactor: 3,
    consumerGroup: "inventory-service",
  })
  @message({
    title: "Inventory Event",
    description: "Inventory update event",
  })
  model InventoryEvent {
    productId: string;
    quantity: int32;
    warehouse: string;
  }

  @channel("inventory/{productId}")
  @publish
  op publishInventoryEvent(): InventoryEvent;
}

// =============================================================================
// TAGS AND METADATA EXAMPLE
// =============================================================================

namespace TagsExample {
  @tags(#["analytics", "user-behavior"])
  @message({
    title: "Page View Event",
    description: "User page view analytics event",
  })
  model PageViewEvent {
    pageUrl: string;
    userId: string;
    sessionId: string;
    timestamp: utcDateTime;
  }

  @channel("analytics/page-views")
  @publish
  op publishPageView(): PageViewEvent;
}

// =============================================================================
// CORRELATION ID EXAMPLE
// =============================================================================

namespace CorrelationExample {
  @correlationId("$message.header#/correlation-id")
  @message({
    title: "Transaction Event",
    description: "Financial transaction event",
  })
  model TransactionEvent {
    transactionId: string;
    @header("X-Correlation-ID", "Correlation ID for tracing")
    correlationId: string;
    amount: decimal;
    status: "pending" | "completed" | "failed";
  }

  @channel("transactions/{transactionId}")
  @publish
  op publishTransaction(): TransactionEvent;
}

// =============================================================================
// COMPLETE EXAMPLE - All features combined
// =============================================================================

namespace CompleteExample {
  @server({
    name: "production",
    url: "kafka.prod.example.com:9092",
    protocol: "kafka",
    description: "Production Kafka cluster",
  })
  namespace EcommerceService {
    @protocol({
      protocol: "kafka",
      partitions: 12,
      replicationFactor: 3,
    })
    @correlationId("$message.header#/correlation-id")
    @tags(#["ecommerce", "orders", "critical"])
    @message({
      title: "Order Created Event",
      description: "Order created event with full order details",
      contentType: "application/json",
    })
    model OrderCreatedEvent {
      orderId: string;
      @header("X-Correlation-ID", "Correlation ID for request tracing")
      correlationId: string;
      @header("X-Request-ID", "Unique request identifier")
      requestId: string;
      customerId: string;
      items: OrderItem[];
      totalAmount: decimal;
      currency: string;
      createdAt: utcDateTime;
    }

    model OrderItem {
      productId: string;
      quantity: int32;
      unitPrice: decimal;
    }

    @channel("ecommerce/orders/{orderId}")
    @security({
      name: "apiKeyAuth",
      scheme: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
      },
    })
    @publish
    op publishOrderCreated(): OrderCreatedEvent;
  }
}

// =============================================================================
// MQTT PROTOCOL EXAMPLE
// =============================================================================

namespace MqttExample {
  @protocol({
    protocol: "mqtt",
    qos: 1,
    retain: false,
  })
  @message({
    title: "Sensor Reading",
    description: "IoT sensor reading event",
  })
  model SensorReading {
    sensorId: string;
    temperature: float64;
    humidity: float64;
    timestamp: utcDateTime;
  }

  @channel("sensors/{sensorId}/readings")
  @publish
  op publishSensorReading(): SensorReading;
}

// =============================================================================
// WEBSOCKET PROTOCOL EXAMPLE
// =============================================================================

namespace WebSocketExample {
  @protocol({
    protocol: "ws",
    subprotocol: "asyncapi",
  })
  @message({
    title: "Chat Message",
    description: "Real-time chat message",
  })
  model ChatMessage {
    messageId: string;
    roomId: string;
    userId: string;
    content: string;
    timestamp: utcDateTime;
  }

  @channel("chat/{roomId}/messages")
  @publish
  op sendChatMessage(): ChatMessage;
}
