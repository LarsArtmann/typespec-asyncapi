# Examples

Each directory is a self-contained TypeSpec project that compiles with the local emitter (linked via pnpm workspace). CI compiles every example with zero diagnostics and validates its output against the official AsyncAPI 3.1.0 JSON Schema (`pnpm run check-examples`).

## Featured examples

| Example | What it shows |
| --- | --- |
| [`streetlights-mqtt`](./streetlights-mqtt/) | The canonical AsyncAPI Streetlights example ported to TypeSpec: MQTT server with variables, channel address templating via `@parameter`, constraint decorators, enum payloads |
| [`kafka-orders`](./kafka-orders/) | Kafka bindings at spec-correct placements (`topic`/`partitions`/`replicas` channel, `groupId` operation), `scramSha512` security, `@discriminator` polymorphism with `allOf`/`oneOf` |
| [`websocket-chat`](./websocket-chat/) | WebSocket channel bindings (`method`/`query`), `@header`, `@correlationId`, `@reply` with runtime-expression address, generic `Page<T>` schema naming |
| [`reusable-components`](./reusable-components/) | The `components.*` showcase: `@operationTrait`, `@messageTrait`, `@parameter`, `@reusableCorrelationId`, `@reusableBinding`, `@useChannelServer`, and their `@use*` references |
| [`split-schemas`](./split-schemas/) | Multi-file output: `split-schemas: true` writes one file per schema with `$ref` pointers rewritten to external paths |

## More examples

| Example | What it shows |
| --- | --- |
| [`simple`](./simple/) / [`smoke`](./smoke/) / [`basic-events`](./basic-events/) | Minimal getting-started specs (custom `output-file`, `include-source-info`) |
| [`kafka`](./kafka/) | Kafka bindings with a schema-keyed payload |
| [`multi-channel`](./multi-channel/) | Multiple channels sharing models |
| [`comprehensive-protocols`](./comprehensive-protocols/) | Many protocols in one document |
| [`advanced`](./advanced/) | Advanced decorator combinations |
| [`real-world`](./real-world/) | Four realistic multi-file event systems (HTTP, Kafka, WebSocket, multi-protocol) |

## Run the examples

```bash
pnpm install
pnpm run check-examples

# or manually:
cd examples/streetlights-mqtt
pnpm exec tsp compile main.tsp
cat tsp-output/@lars-artmann/typespec-asyncapi/asyncapi.yaml
```

The emitted output lands in `tsp-output/@lars-artmann/typespec-asyncapi/` inside each example directory.
