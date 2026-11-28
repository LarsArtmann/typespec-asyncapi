---
title: Quick Start
description: Define a channel and operation in TypeSpec, then compile a validated AsyncAPI 3.1 document.
head:
  - tag: meta
    attrs:
      property: og:image
      content: "https://typespec-asyncapi.lars.software/og/getting-started/quick-start.png"
  - tag: meta
    attrs:
      property: og:image:width
      content: "1200"
  - tag: meta
    attrs:
      property: og:image:height
      content: "630"
  - tag: meta
    attrs:
      property: og:image:alt
      content: "Quick Start — typespec-asyncapi"
  - tag: meta
    attrs:
      name: twitter:image
      content: "https://typespec-asyncapi.lars.software/og/getting-started/quick-start.png"
  - tag: script
    attrs:
      type: application/ld+json
    content: '{"@context": "https://schema.org", "@type": "HowTo", "name": "Generate an AsyncAPI 3.1 document from TypeSpec", "description": "Install the emitter, describe an event channel in TypeSpec, compile, and read the emitted AsyncAPI YAML.", "step": [{"@type": "HowToStep", "position": 1, "name": "Install the emitter", "text": "Add @lars-artmann/typespec-asyncapi to the project and reference it from the TypeSpec file."}, {"@type": "HowToStep", "position": 2, "name": "Create a TypeSpec file", "text": "Import the emitter, define a model for the message payload, and decorate a publish operation with a channel address."}, {"@type": "HowToStep", "position": 3, "name": "Compile", "text": "Run the tsp CLI with the emitter configured in tspconfig.yaml."}, {"@type": "HowToStep", "position": 4, "name": "Read the output", "text": "The emitted AsyncAPI 3.1 YAML document appears under tsp-output with the channel, operation, message, and schema wired through the required $ref chain."}]}'
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

`@server` targets a **namespace**, so it goes above `namespace MyAPI;` (replace the plain namespace line from step 1). Remember that `#{}` value literals are comma-separated:

```typespec
@server("production", #{
  url: "broker.example.com:9092",
  protocol: "kafka",
  description: "Production Kafka broker",
})
namespace MyAPI;

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
- [Examples in the repo](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples) — 15 runnable examples, all CI-validated
