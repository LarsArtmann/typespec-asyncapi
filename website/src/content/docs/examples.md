---
title: Examples
description: 15 runnable TypeSpec projects covering Kafka, MQTT, WebSocket, reusable components, split schemas, and mixed REST/event systems.
head:
  - tag: meta
    attrs:
      property: og:image
      content: "https://typespec-asyncapi.lars.software/og/examples.png"
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
      content: "Examples — typespec-asyncapi"
  - tag: meta
    attrs:
      name: twitter:image
      content: "https://typespec-asyncapi.lars.software/og/examples.png"

---

Every example is a self-contained TypeSpec project. CI compiles all of them with zero diagnostics and validates each emitted document against the official AsyncAPI 3.1.0 JSON Schema.

## Featured examples

| Example                                                                                       | What it shows                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`streetlights-mqtt`](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/streetlights-mqtt)   | The canonical AsyncAPI Streetlights example: MQTT server with variables, channel address templating via `@parameter`, constraints, and enum payloads.                              |
| [`kafka-orders`](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/kafka-orders)             | Kafka bindings at spec-correct placements (`topic`/`partitions`/`replicas` on the channel, `groupId` on the operation), `scramSha512` security, and `@discriminator` polymorphism. |
| [`websocket-chat`](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/websocket-chat)         | WebSocket bindings (`method`/`query`), `@header`, `@correlationId`, `@reply` with a runtime-expression address, and generic `Page<T>` schema naming.                                |
| [`reusable-components`](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/reusable-components) | The `components.*` showcase: `@operationTrait`, `@messageTrait`, `@parameter`, `@reusableCorrelationId`, `@reusableBinding`, and `@useChannelServer`.                              |
| [`split-schemas`](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/split-schemas)           | Multi-file output: one file per schema, with every `$ref` rewritten to an external path.                                                                                           |

## More examples

| Example                                                                                                             | What it shows                                                    |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [`simple`](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/simple) / [`smoke`](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/smoke) / [`basic-events`](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/basic-events) | Minimal getting-started specs, including a custom `output-file`. |
| [`kafka`](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/kafka)                               | Kafka bindings with a schema-keyed payload.                      |
| [`multi-channel`](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/multi-channel)               | Multiple channels sharing models.                                |
| [`comprehensive-protocols`](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/comprehensive-protocols) | Many protocols in one document.                                  |
| [`advanced`](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/advanced)                         | Advanced decorator combinations.                                 |
| [`real-world`](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/real-world)                     | Four realistic multi-file event systems (HTTP, Kafka, WebSocket, multi-protocol). |
| [`mixed-rest-events`](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/mixed-rest-events)       | A REST namespace and an event namespace in one program, without phantom OpenAPI routes. |
| [`schema-extensions`](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/schema-extensions)       | `@jsonSchemaExtension` and `@extension` vendor keywords.         |

## Run them

```bash
git clone https://github.com/LarsArtmann/typespec-asyncapi
cd typespec-asyncapi
pnpm install
pnpm run build
pnpm run check-examples
```

Or compile one example by hand:

```bash
cd examples/streetlights-mqtt
pnpm exec tsp compile main.tsp
cat tsp-output/@lars-artmann/typespec-asyncapi/asyncapi.yaml
```

## Where to go next

- [Quick Start](/getting-started/quick-start/) — build your first spec from scratch
- [Protocol Bindings](/guides/bindings/) — placement and version rules for each protocol
- [Multi-File Output](/guides/split-schemas/) — the `split-schemas` option in depth
