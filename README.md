# TypeSpec AsyncAPI Emitter

[![Build Status](https://img.shields.io/badge/Build-PASSING-green)](https://github.com/LarsArtmann/typespec-asyncapi)[![TypeScript](https://img.shields.io/badge/TypeScript-0%20Errors-green)](https://www.typescriptlang.org/)[![AsyncAPI](https://img.shields.io/badge/AsyncAPI-3.0-blue)](https://www.asyncapi.com/)

A TypeSpec emitter that transforms TypeSpec service definitions into [AsyncAPI 3.0](https://www.asyncapi.com/) specifications for event-driven architectures. Define your event schemas, channels, and operations in TypeSpec, then generate standards-compliant AsyncAPI YAML documentation automatically.

**Key capabilities:**
- Define event messages, channels, and operations using TypeSpec decorators
- Generate complete AsyncAPI 3.0 YAML specifications
- Support for publish/subscribe operations, message schemas, and server configurations
- Protocol bindings for Kafka, WebSocket, MQTT, and HTTP
- Security scheme definitions (OAuth2, API Key, etc.)
- TypeSpec model schemas converted to JSON Schema components

---

## Quick Start

```bash
# Install
bun add @lars-artmann/typespec-asyncapi

# Create a TypeSpec file (api.tsp)
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace MyAPI;

model Event {
  id: string;
  timestamp: utcDateTime;
}

@channel("events")
@publish
op publishEvent(): Event;

# Generate AsyncAPI
bunx tsp compile api.tsp --emit @lars-artmann/typespec-asyncapi
```

**Generated Output** (asyncapi.yaml):

```yaml
asyncapi: 3.0.0
info:
  title: MyAPI
  version: 1.0.0
channels:
  events:
    address: events
    messages:
      Event:
        $ref: "#/components/messages/Event"
operations:
  publishEvent:
    action: send
    channel:
      $ref: "#/channels/events"
components:
  messages:
    Event:
      name: Event
      contentType: application/json
      payload:
        $ref: "#/components/schemas/Event"
  schemas:
    Event:
      type: object
      properties:
        id:
          type: string
        timestamp:
          type: string
          format: date-time
      required:
        - id
        - timestamp
```

---

## Working Features

| Feature | Status |
|---------|--------|
| `@channel` decorator | Working |
| `@publish` decorator | Working |
| `@subscribe` decorator | Working |
| `@message` decorator | Working |
| Basic model schemas | Working |
| AsyncAPI 3.0 YAML output | Working |
| TypeScript compilation | 0 errors |

---

## Development

```bash
git clone https://github.com/LarsArtmann/typespec-asyncapi
cd typespec-asyncapi
bun install
just build          # Build TypeScript
just test           # Run tests
just lint           # ESLint validation
```

### Testing the Emitter Locally

```bash
# Compile smoke test example
cd examples/smoke
bunx tsp compile . --emit ../../

# View output
cat ../../tsp-test/@lars-artmann/typespec-asyncapi/asyncapi.yaml
```

---

## Decorators

### `@channel(path: string)`

Defines a channel address.

```typespec
@channel("user.events")
op publishUserEvent(): UserEvent;
```

### `@publish` / `@subscribe`

Defines operation direction.

```typespec
@channel("orders")
@publish
op publishOrder(order: Order): void;

@channel("notifications")
@subscribe
op subscribeToNotifications(): Notification;
```

### `@message(config)`

Configures message metadata.

```typespec
@message({
  name: "UserCreated",
  title: "User Created Event",
  description: "Emitted when a new user is created"
})
model UserCreatedMessage {
  user: User;
  timestamp: utcDateTime;
}
```

### `@server(name: string, config)`

Defines server configuration for the API.

```typespec
@server("production", {
  url: "mqtt://broker.example.com:1883",
  protocol: "mqtt",
  description: "Production MQTT broker"
})
namespace MyAPI;
```

### `@protocol(config)`

Applies protocol-specific bindings to operations or models.

```typespec
@channel("events")
@publish
@protocol({
  protocol: "kafka",
  partitions: 3,
  replicationFactor: 2
})
op publishEvent(): Event;
```

### `@security(config)`

Applies security scheme to operations or namespaces.

```typespec
@security({
  name: "oauth2",
  scheme: {
    type: "oauth2",
    flows: {
      clientCredentials: {
        tokenUrl: "https://auth.example.com/oauth/token"
      }
    }
  }
})
@server("secure", {
  url: "amqps://broker.example.com:5671",
  protocol: "amqp"
})
namespace SecureAPI;
```

### `@tags(value: string[])`

Applies tags for categorization.

```typespec
@tags(["orders", "critical"])
@message({
  name: "OrderPlaced",
  title: "Order Placed Event"
})
model OrderPlacedMessage {
  orderId: string;
  customerId: string;
  total: decimal;
}
```

### `@correlationId(location: string, property?: string)`

Specifies correlation ID location for message tracing.

```typespec
@correlationId("$message.header#/correlationId", "correlationId")
model EventWithCorrelation {
  payload: string;
}
```

### `@header(name: string, value: string | Model)`

Defines message headers.

```typespec
model EventHeaders {
  @header("X-Event-Type", "Content-Type")
  contentType: "application/json";

  @header("X-Trace-Id", "string")
  traceId: string;
}
```

### `@bindings(value: Model)`

Applies generic bindings configuration.

```typespec
@channel("payments")
@bindings({
  kafka: {
    partitions: 10,
    replicas: 3
  }
})
op processPayment(): PaymentResult;

---

## Known Limitations

- **Advanced schemas**: Arrays, enums, union types partially supported
- **Some advanced protocol configurations**: May require additional testing

---

## Status

**Version:** 0.0.1
**Build:** Passing (0 TypeScript errors)
**Core:** Working (generates valid AsyncAPI 3.0 YAML)
**Tests:** 129 passing, 314 failing (mostly advanced features)

---

_Last updated: 2026-03-23_
