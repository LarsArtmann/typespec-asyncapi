---
title: Quick Start
description: Define a channel and operation in TypeSpec, then compile a validated AsyncAPI 3.1 document.
---

This page walks the shortest path from zero to a validated AsyncAPI 3.1 document.

## 1. Create a TypeSpec file

Create `api.tsp`:

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

What this declares:

- `model Event` — the message payload schema, emitted to `components.schemas.Event`
- `@channel("events")` — a channel with address `events`
- `op publishEvent(): Event` — a send operation whose return type is the message payload

## 2. Compile

```bash
npx tsp compile api.tsp
```

## 3. Read the output

`tsp-output/@lars-artmann/typespec-asyncapi/asyncapi.yaml`:

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

The reference chain is spec-correct: operations point at `#/channels/{id}/messages/{id}`, channels at `#/components/messages/{id}`, and messages at `#/components/schemas/{name}`.

## 4. Add a server and protocol

```typespec
@server("production", #{
  url: "broker.example.com:9092"
  protocol: "kafka"
  description: "Production Kafka broker"
})
@channel("events")
@protocol(#{ protocol: "kafka", partitions: 3, replicationFactor: 2 })
@publish
op publishEvent(): Event;
```

The Kafka binding is auto-versioned (`bindingVersion: 0.5.0`), field-validated, and placed at its spec-correct location — `partitions` lands in the channel binding, not wherever you wrote it.

## Where to go next

- [Decorators](/guides/decorators/) — the full 30-decorator reference
- [Schema Generation](/guides/schemas/) — scalars, constraints, unions, generics
- [Security](/guides/security/) — OAuth2, API keys, SASL schemes
- [Examples in the repo](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples) — 13 runnable examples, all CI-validated
