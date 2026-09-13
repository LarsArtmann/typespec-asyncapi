---
title: Protocol Bindings
description: 19 protocol bindings auto-generated from @asyncapi/specs, with version auto-injection and placement checking.
---

All 19 bindings are auto-generated from `@asyncapi/specs/bindings/` — the same source the AsyncAPI project publishes. That gives you field-level validation, correct binding versions, and placement checks without any hand-written protocol tables.

## Supported protocols

22 protocols are accepted on servers: HTTP, HTTPS, WS, WSS, MQTT, MQTT5, Kafka, AMQP, AMQP1, NATS, JMS, SNS, SQS, STOMP, Redis, GooglePubSub, Mercure, IBMMQ, Pulsar, Solace, AnypointMQ, ROS2.

19 have dedicated binding validation (HTTPS, MQTT5, and WSS share binding schemas with their base protocols).

| Protocol                                                                                                 | Binding Version | Highlights                                                                          |
| -------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------- |
| Kafka                                                                                                    | 0.5.0           | Channel (topic, partitions, replicas), Operation (groupId, clientId), Message (key) |
| AMQP                                                                                                     | 0.3.0           | Channel (exchange, queue), Operation (priority, deliveryMode), Message              |
| MQTT                                                                                                     | 0.2.0           | Server (clientId, cleanSession, lastWill), Operation (qos, retain)                  |
| HTTP                                                                                                     | 0.3.0           | Operation (method, query), Message (headers)                                        |
| WebSocket                                                                                                | 0.1.0           | Channel (method, query, headers); `ws`/`wss` normalized                             |
| AMQP1, AnypointMQ, GooglePubSub, IBMMQ, JMS, Mercure, NATS, Pulsar, Redis, ROS2, SNS, Solace, SQS, STOMP | Per spec        | All auto-generated with field-level validation                                      |

## How placement works

`@protocol` config fields emit at spec-correct placements, not where you write them:

- Kafka `partitions` / `replicationFactor` → channel binding `partitions` / `replicas`
- Kafka `consumerGroup` → operation binding `groupId` as a `{ type: "string", const: ... }` schema (AsyncAPI 3.1 requires schema or boolean)
- MQTT `qos` / `retain` → operation binding (MQTT has no channel binding)
- WebSocket `headers` / `queryParams` → channel binding `headers` / `query`

Unknown top-level keys and a nested `binding:` map pass through to the channel binding (or the operation binding when the protocol defines no channel binding, e.g. HTTP).

## Kafka example

```typespec
@server("production", #{
  url: "broker.example.com:9092"
  protocol: "kafka"
})
@channel("orders")
@protocol(#{
  protocol: "kafka"
  partitions: 3
  replicationFactor: 2
})
@publish
op publishOrder(): Order;
```

Emits a channel binding with `topic`, `partitions: 3`, `replicas: 2`, and `bindingVersion: "0.5.0"` (auto-injected).

## Validation you get for free

- **Version auto-injection** — omit `bindingVersion` and the correct constant is added per protocol
- **Field validation** — field values are checked against spec-derived rules (auto-generated)
- **Placement checks** — a Kafka channel binding on a message triggers a `misplaced-binding` warning
- **Alias normalization** — `websocket` normalizes to `ws`; `wss` uses the `ws` binding key

:::caution
Never emit `websocket` as a binding key yourself — the AsyncAPI 3.1 schema accepts only `ws`/`wss`. The emitter normalizes input aliases automatically.
:::

## Where to go next

- [Diagnostics](/reference/diagnostics/) — binding warnings and errors
- [Quick Start](/getting-started/quick-start/) — a full Kafka example
- [kafka-orders example](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/kafka-orders) — bindings + security in one file
