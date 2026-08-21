---
title: Reusable Components
description: Traits, parameters, correlation IDs, and reusable bindings via 11 decorators across 7 components.* slots.
---

AsyncAPI 3.1's `components.*` slots let you define an operation trait, message trait, parameter, correlation ID, or binding once and reference it everywhere. The emitter populates all of them.

## Operation and message traits

```typespec
namespace MyAPI;

@operationTrait("standardHeaders", #{
  bindings: #{ http: #{ method: "POST" } }
  description: "Standard HTTP operation behavior"
})
@messageTrait("commonHeaders", #{
  headers: #{
    type: "object"
    properties: #{ traceId: #{ type: "string" } }
  }
})
@channel("orders")
@useOperationTrait("standardHeaders")
@publish
op placeOrder(): Order;
```

`@operationTrait` extracts `security`, `tags`, `bindings` (plus summary/description); `@messageTrait` extracts `headers`, `correlationId`, `summary`, `tags`, `bindings` (plus name/description). The `@use*` reference decorators attach them via `$ref`.

## Channel address parameters

```typespec
@parameter("tenantId", #{
  location: "$message.payload#/tenantId"
  description: "Tenant identifier"
})
@channel("{tenantId}/events")
@subscribe
op onEvent(): Event;
```

A channel address parameter (`{tenantId}`) auto-upgrades to a `$ref` under `channels.address` when a matching `@parameter` exists. The `location`, when present, must start with `$message.` and contain a `#` JSON-pointer separator.

## Correlation IDs

```typespec
@reusableCorrelationId("traceId", "$message.header#/traceid")
namespace MyAPI;

@useCorrelationId("traceId")
model Event { id: string; }
```

Inline `@correlationId(location)` on a model still works without populating `components.correlationIds`.

## Reusable bindings

```typespec
@reusableBinding("prodKafka", #{
  kafka: #{ topic: "orders", partitions: 6 }
})
namespace MyAPI;

@channel("orders")
@useChannelBinding("prodKafka")
@publish
op publishOrder(): Order;
```

## The 7 slots

| Slot | Definition decorator | Reference decorator |
| --- | --- | --- |
| `components.operationTraits` | `@operationTrait` (Namespace) | `@useOperationTrait` (Operation) |
| `components.messageTraits` | `@messageTrait` (Namespace) | `@useMessageTrait` (Model) |
| `components.parameters` | `@parameter` (Namespace) | channel address `{param}` |
| `components.correlationIds` | `@reusableCorrelationId` (Namespace) | `@useCorrelationId` (Model) |
| `components.operationBindings` | `@reusableBinding` (Namespace) | `@useBinding` (Operation/Model/Namespace) |
| `components.messageBindings` | `@reusableBinding` (Namespace) | `@useBinding` |
| `components.channelBindings` | `@reusableBinding` (Namespace) | `@useChannelBinding` (Operation) |

## Where to go next

- [reusable-components example](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/reusable-components) — traits, parameters, and bindings together
- [Decorators](/guides/decorators/) — full reference
- [Protocol Bindings](/guides/bindings/) — binding validation rules
