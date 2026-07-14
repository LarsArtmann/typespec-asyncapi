# Comprehensive Protocols Example

Demonstrates all 5 supported protocols (Kafka, WebSocket, MQTT, AMQP, HTTP) with servers, channels, operations, messages, bindings, and tags.

## Usage

```bash
tsp compile examples/comprehensive-protocols/main.tsp
```

Output is written to `tsp-output/@lars-artmann/typespec-asyncapi/asyncapi.yaml`.

## What's Covered

- **Kafka**: topic bindings (partitions, replication factor), consumer group, message metadata
- **WebSocket**: bidirectional publish/subscribe on a relay server
- **MQTT**: IoT device telemetry with temperature/humidity/battery schemas
- **AMQP**: enterprise message queue with processing tasks
- **HTTP**: webhook event delivery

Each protocol uses a block namespace with its own `@server` declaration, shared message models via spread (`...BaseEvent`), and correct `#{}` value literal syntax for all decorator configurations.
