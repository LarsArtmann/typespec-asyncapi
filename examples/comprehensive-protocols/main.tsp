import "@lars-artmann/typespec-asyncapi";

using TypeSpec.AsyncAPI;

/**
 * Comprehensive Protocol Example
 *
 * Demonstrates all supported protocols with correct decorator usage:
 * Kafka, WebSocket, MQTT, AMQP, and HTTP.
 */

// === SHARED MODELS ===

model BaseEvent {
  eventId: string;
  timestamp: utcDateTime;
  source: string;
}

model UserRegistered {
  ...BaseEvent;
  userId: string;
  email: string;
  name: string;
}

model OrderPlaced {
  ...BaseEvent;
  orderId: string;
  customerId: string;
  totalAmount: decimal;
  currency: string;
}

model DeviceTelemetry {
  ...BaseEvent;
  deviceId: string;
  temperature: float32;
  humidity: float32;
  batteryLevel: int32;
}

// === KAFKA ===

@server("kafka-prod", #{
  url: "kafka://broker1:9092",
  protocol: "kafka",
  description: "Production Kafka cluster"
})
namespace KafkaShop {
  @message(#{
    title: "User Registered Event",
    description: "Emitted when a new user registers"
  })
  model UserRegisteredMessage {
    ...UserRegistered;
  }

  @bindings(#{
    kafka: #{
      bindingVersion: "0.5.0"
    }
  })
  @channel("users.registered")
  @publish
  op publishUserRegistered(): UserRegisteredMessage;

  @bindings(#{
    kafka: #{
      bindingVersion: "0.5.0"
    }
  })
  @channel("users.registered")
  @subscribe
  op subscribeUserRegistered(): UserRegisteredMessage;

  @tags(#["orders", "high-priority"])
  @channel("orders.placed")
  @publish
  op publishOrderPlaced(): OrderPlaced;

  @channel("orders.placed")
  @subscribe
  op subscribeOrderPlaced(): OrderPlaced;
}

// === WEBSOCKET ===

@server("ws-relay", #{
  url: "ws://relay.example.com:8080",
  protocol: "ws",
  description: "WebSocket relay server"
})
namespace WebSocketEvents {
  @channel("ws.events")
  @publish
  op publishWsEvent(): BaseEvent;

  @channel("ws.events")
  @subscribe
  op subscribeWsEvent(): BaseEvent;
}

// === MQTT ===

@server("mqtt-broker", #{
  url: "mqtt://broker.example.com:1883",
  protocol: "mqtt",
  description: "MQTT broker for IoT devices"
})
namespace IoTSensors {
  @channel("sensors.telemetry")
  @publish
  op publishTelemetry(): DeviceTelemetry;

  @channel("sensors.telemetry")
  @subscribe
  op subscribeTelemetry(): DeviceTelemetry;

  @channel("sensors.alerts")
  @publish
  op publishAlert(): BaseEvent;
}

// === AMQP ===

@server("amqp-broker", #{
  url: "amqp://mq.example.com:5672",
  protocol: "amqp",
  description: "AMQP message broker"
})
namespace AmqpQueue {
  @channel("queue.processing")
  @publish
  op publishProcessingTask(): OrderPlaced;

  @channel("queue.processing")
  @subscribe
  op subscribeProcessingTask(): OrderPlaced;
}

// === HTTP ===

@server("http-api", #{
  url: "https://api.example.com",
  protocol: "http",
  description: "HTTP API for webhook events"
})
namespace HttpEvents {
  @channel("webhooks/events")
  @publish
  op publishWebhookEvent(): BaseEvent;
}
