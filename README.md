# TypeSpec AsyncAPI Emitter

[![Build Status](https://img.shields.io/badge/Build-PASSING-green)](https://github.com/LarsArtmann/typespec-asyncapi)[![TypeScript](https://img.shields.io/badge/TypeScript-0%20Errors-green)](https://www.typescriptlang.org/)[![AsyncAPI](https://img.shields.io/badge/AsyncAPI-3.0-blue)](https://www.asyncapi.com/)

**TypeSpec-to-AsyncAPI 3.0 emitter with working core functionality.**

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

---

## Known Limitations

- **Protocol bindings**: Kafka, MQTT, WebSocket bindings not yet implemented
- **Security schemes**: OAuth2, API Key, SASL not yet implemented
- **Advanced schemas**: Arrays, enums, union types partially supported

---

## Status

**Version:** 0.0.1
**Build:** Passing (0 TypeScript errors)
**Core:** Working (generates valid AsyncAPI 3.0 YAML)
**Tests:** 129 passing, 314 failing (mostly advanced features)

---

_Last updated: 2026-03-20_
