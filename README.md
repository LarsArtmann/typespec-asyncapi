# TypeSpec AsyncAPI Emitter

[![Build Status](https://img.shields.io/badge/Build-PASSING-green)](https://github.com/LarsArtmann/typespec-asyncapi)

[![AsyncAPI](https://img.shields.io/badge/AsyncAPI-3.1.0-blue)](https://www.asyncapi.com/)
[![Protocols](https://img.shields.io/badge/Protocols-22-blue)](https://www.asyncapi.com/)

A TypeSpec emitter that transforms TypeSpec service definitions into [AsyncAPI 3.1](https://www.asyncapi.com/) specifications. Define your event schemas, channels, and operations in TypeSpec, then generate standards-compliant AsyncAPI YAML or JSON.

Every byte of output is validated against the official AsyncAPI 3.1.0 JSON Schema (AJV). All 19 AsyncAPI protocol bindings are auto-generated from `@asyncapi/specs` with version auto-injection, field-level validation, and placement checking. Model inheritance emits `allOf`, unions of models emit `oneOf`, and `@discriminator` enables polymorphic type patterns.

## Quick Start

```bash
npm install @lars-artmann/typespec-asyncapi
# or: pnpm add @lars-artmann/typespec-asyncapi
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

## Features

### 16 Decorators

| Decorator                         | Target                        | Purpose                                            |
| --------------------------------- | ----------------------------- | -------------------------------------------------- |
| `@channel(address, description?)` | Operation                     | Defines a channel address                          |
| `@publish` / `@subscribe`         | Operation                     | Marks operation as send / receive                  |
| `@server(name, config)`           | Namespace                     | Defines server (host, protocol, description)       |
| `@message(config)`                | Model                         | Configures message metadata (title, contentType)   |
| `@protocol(config)`               | Operation / Model             | Applies protocol-specific channel bindings         |
| `@security(config)`               | Operation / Namespace         | Applies security schemes                           |
| `@bindings(config)`               | Operation / Model / Namespace | Applies generic protocol bindings (auto-versioned) |
| `@tags(value)`                    | Model / Operation / Namespace | Categorizes with tag arrays                        |
| `@correlationId(location)`        | Model                         | Specifies correlation ID for message tracing       |
| `@header(name, value?)`           | Model / ModelProperty         | Defines message headers                            |
| `@reply(replyModel, address?)`    | Operation                     | Operation reply with message reference             |
| `@defaultContentType(type)`       | Namespace                     | Sets `defaultContentType` on document root         |
| `@operationId(id)`                | Operation                     | Overrides auto-generated operation key             |
| `@messageId(id)`                  | Model                         | Overrides auto-generated message key               |
| `@apiVersion(version)`            | Namespace                     | Sets `info.version` on document root               |

Decorators accept both `{}` (model expression) and `#{}` (value literal) syntax.

### 19 Protocol Bindings

All protocols auto-generated from `@asyncapi/specs/bindings/`:

| Protocol                                                                                                 | Binding Version | Highlights                                                                          |
| -------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------- |
| Kafka                                                                                                    | 0.5.0           | Channel (topic, partitions, replicas), Operation (groupId, clientId), Message (key) |
| AMQP                                                                                                     | 0.3.0           | Channel (exchange, queue), Operation (priority, deliveryMode), Message              |
| MQTT                                                                                                     | 0.2.0           | Server (clientId, cleanSession, lastWill), Operation (qos, retain)                  |
| HTTP                                                                                                     | 0.3.0           | Operation (method, query), Message (headers)                                        |
| WebSocket                                                                                                | 0.1.0           | Channel (method, query, headers). `ws`/`wss` normalized                             |
| AMQP1, AnypointMQ, GooglePubSub, IBMMQ, JMS, Mercure, NATS, Pulsar, Redis, ROS2, SNS, Solace, SQS, STOMP | Per spec        | All auto-generated with field-level validation                                      |

Binding versions are auto-injected when omitted. Protocol aliases (`websocket`→`ws`) are normalized automatically. Binding placement is validated against the spec (e.g., Kafka channel bindings on a message trigger a `misplaced-binding` warning).

### Schema Generation

Every TypeSpec scalar maps to the correct JSON Schema type and format (int8-64, uint8-64, float32/64, decimal, dateTime, duration, bytes, url, and more). Named models, enums, and scalars use `$ref` for clean component reuse. Inheritance, unions, tuples, records, and multi-message operations are all supported.

**Constraint decorators** are fully mapped: `@minValue`, `@maxValue`, `@minValueExclusive`, `@maxValueExclusive`, `@minLength`, `@maxLength`, `@pattern`, `@format`, `@minItems`, `@maxItems`, `#deprecated`, `@summary` (→`title`), `@example` (→`examples`), and `@visibility` (→`readOnly`/`writeOnly`) all produce the correct JSON Schema keywords.

### Multi-File Output

```bash
npx tsp compile api.tsp --emit @lars-artmann/typespec-asyncapi --option @lars-artmann/typespec-asyncapi.split-schemas=true
```

Splits schemas into individual files under `schemas/` with all `$ref` pointers rewritten to external paths.

### Versioning

Integrates with [`@typespec/versioning`](https://typespec.io/docs/libraries/versioning/overview/):

```typespec
import "@typespec/versioning";
using TypeSpec.Versioning;

@versioned(Versions)
namespace MyAPI;

enum Versions { v1: "1.0.0", v2: "2.0.0"; }
```

The emitter reads the latest version enum value for `info.version`. Precedence: emitter `version` option > `@apiVersion` decorator > `@versioned` enum > `"1.0.0"`.

### Validation

The emitter provides 22 compile-time diagnostics (17 error + 5 warning) that catch invalid configurations before they reach your AsyncAPI output — unsupported protocols, invalid binding versions, missing channel paths, malformed server URLs, and more.

## Examples

### Kafka with Bindings

```typespec
@server("production", #{
  url: "broker.example.com:9092",
  protocol: "kafka",
  description: "Production Kafka broker"
})
@channel("orders")
@protocol(#{
  protocol: "kafka",
  partitions: 3,
  replicationFactor: 2
})
@publish
op publishOrder(): Order;
```

### Security

```typespec
@security(#{
  name: "oauth2",
  scheme: #{
    type: "oauth2",
    flows: #{
      clientCredentials: #{
        tokenUrl: "https://auth.example.com/oauth/token",
        availableScopes: #{ read: "Read access", write: "Write access" }
      }
    }
  }
})
namespace SecureAPI;
```

### Reply Pattern

```typespec
@channel("orders")
@publish
@reply(OrderConfirmation, "orders/replies")
op placeOrder(order: Order): OrderConfirmation;
```

## Development

```bash
git clone https://github.com/LarsArtmann/typespec-asyncapi
cd typespec-asyncapi
pnpm install
pnpm run build     # Build TypeScript (0 errors)

pnpm run lint      # ESLint + oxlint (0 errors, 0 warnings)
```

Run all commands inside `nix develop .#default` to get the right toolchain (pnpm + bun + Node.js). Use `pnpm` for package management and scripts. Coverage runs via `bun test --coverage` (only Bun's native coverage captures dynamically-loaded `dist/*.js` files).

## Status

| Metric      | Value                                                 |
| ----------- | ----------------------------------------------------- |
| Version     | 0.2.0-beta                                            |

| Build       | 0 TypeScript errors (strict mode)                     |
| Lint        | 0 errors, 0 warnings (ESLint + oxlint)                |
| Diagnostics | 22 codes (17 error + 5 warning)                       |
| Protocols   | 22 (auto-generated from `@asyncapi/specs`)            |
| Duplication | 0% (jscpd, 0% threshold)                              |
| Output      | Validates against official AsyncAPI 3.1.0 JSON Schema |

## License

MIT
