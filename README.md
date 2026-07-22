# TypeSpec AsyncAPI Emitter

[![Build Status](https://img.shields.io/badge/Build-PASSING-green)](https://github.com/LarsArtmann/typespec-asyncapi)
[![Tests](https://img.shields.io/badge/Tests-510%20pass%2C%200%20fail-green)](https://github.com/LarsArtmann/typespec-asyncapi)
[![AsyncAPI](https://img.shields.io/badge/AsyncAPI-3.1.0-blue)](https://www.asyncapi.com/)

A TypeSpec emitter that transforms TypeSpec service definitions into [AsyncAPI 3.1](https://www.asyncapi.com/) specifications. Define your event schemas, channels, and operations in TypeSpec, then generate standards-compliant AsyncAPI YAML.

## Quick Start

```bash
bun add @lars-artmann/typespec-asyncapi
```

Create a TypeSpec file (`api.tsp`):

```typespec
import "@lars-artmann/typespec-asyncapi";
using TypeSpec.AsyncAPI;

namespace MyAPI;

model Event {
  id: string;
  timestamp: utcDateTime;
}

@channel("events")
op publishEvent(): Event;
```

Generate AsyncAPI:

```bash
bunx tsp compile api.tsp --emit @lars-artmann/typespec-asyncapi
```

Output (`tsp-output/@lars-artmann/typespec-asyncapi/asyncapi.yaml`):

```yaml
asyncapi: 3.1.0
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
    messages:
      - $ref: "#/channels/events/messages/Event"
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

## Decorators

### `@channel(address: string)`

Defines a channel address for an operation.

```typespec
@channel("user.events")
op publishUserEvent(): UserEvent;
```

### `@publish` / `@subscribe`

Marks an operation as sending (publish) or receiving (subscribe).

```typespec
@channel("orders")
@publish
op publishOrder(): Order;

@channel("notifications")
@subscribe
op subscribeToNotifications(): Notification;
```

### `@server(name: string, config)`

Defines server configuration on a namespace. Config accepts `#{}` (value literal).

```typespec
@server("production", #{
  url: "broker.example.com:9092",
  protocol: "kafka",
  description: "Production Kafka broker"
})
namespace MyAPI;
```

### `@message(config)`

Configures message metadata on a model.

```typespec
@message(#{
  title: "User Created Event",
  description: "Emitted when a new user is created",
  contentType: "application/json"
})
model UserCreated {
  user: User;
  timestamp: utcDateTime;
}
```

### `@protocol(config)`

Applies protocol-specific bindings.

```typespec
@channel("events")
@protocol(#{
  protocol: "kafka",
  partitions: 3,
  replicationFactor: 2
})
op publishEvent(): Event;
```

### `@security(config)`

Applies security schemes to operations or namespaces.

```typespec
@security(#{
  name: "oauth2",
  scheme: #{
    type: "oauth2",
    flows: #{
      clientCredentials: #{
        tokenUrl: "https://auth.example.com/oauth/token"
      }
    }
  }
})
namespace SecureAPI;
```

### `@tags(value: string[])`

Categorizes operations, models, or namespaces.

```typespec
@channel("orders")
@publish
@tags(["orders", "critical"])
op publishOrder(): Order;
```

### `@correlationId(location: string, property?: string)`

Specifies correlation ID for message tracing on a model.

```typespec
@correlationId("$message.header#/correlationId")
model EventWithCorrelation {
  payload: string;
}
```

### `@header(name: string, value?: string)`

Defines message headers on a model property.

```typespec
model EventWithHeaders {
  @header("X-Trace-Id")
  traceId: string;
}
```

### `@bindings(config)`

Applies generic protocol bindings to operations or models. Binding keys are normalized (`websocket`→`ws`) and `bindingVersion` is auto-injected.

```typespec
@channel("payments")
@bindings(#{
  kafka: #{
    partitions: 10,
    replicas: 3
  }
})
op processPayment(): PaymentResult;
```

Supported protocols for bindings: Kafka (0.5.0), AMQP (0.3.0), MQTT (0.2.0), HTTP (0.3.0), WebSocket (0.1.0).

## Supported Protocols

| Protocol  | Server | Channel Bindings                  | Operation Bindings           | Message Bindings            |
| --------- | ------ | --------------------------------- | ---------------------------- | --------------------------- |
| Kafka     | Yes    | Yes (topic, partitions, replicas) | Yes (groupId, clientId)      | Yes (key, schemaIdLocation) |
| AMQP      | —      | Yes (exchange, queue)             | Yes (priority, deliveryMode) | Yes (contentEncoding)       |
| MQTT      | Yes    | —                                 | Yes (qos, retain)            | Yes                         |
| WebSocket | Yes    | Yes (method, query, headers)      | —                            | —                           |
| HTTP      | —      | —                                 | Yes (method, query)          | Yes (headers)               |

Binding versions are auto-injected when omitted. Protocol aliases (`websocket`→`ws`, `websockets`→`ws`) are normalized automatically.

## Development

```bash
git clone https://github.com/LarsArtmann/typespec-asyncapi
cd typespec-asyncapi
bun install
bun run build     # Build TypeScript (0 errors)
bun run test      # Run tests via vitest (510 pass, 0 fail)
bun run lint      # ESLint
```

## Status

**Version:** 0.1.0-alpha
**Build:** 0 TypeScript errors
**Lint:** 0 errors, 0 warnings
**Tests:** 510 pass, 0 fail (0 skip, 0 todo)
**Output:** Validates against AsyncAPI 3.1.0 JSON schema (78 compliance tests)
**Bindings:** Full support for Kafka, AMQP, MQTT, WebSocket, HTTP with auto-versioning

## License

MIT
