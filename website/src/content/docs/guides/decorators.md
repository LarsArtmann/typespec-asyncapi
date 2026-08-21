---
title: Decorators
description: All 30 decorators — channels, messages, servers, security, bindings, and reusable components.
---

Every AsyncAPI-specific decorator is declared in `lib/main.tsp` and accepts both `{}` (model expression) and `#{}` (value literal) syntax. Decorators that misconfigure emit compile-time diagnostics — see [Diagnostics](/reference/diagnostics/).

:::note
Reserved words cannot be keys in `#{}` literals (`model`, `enum`, `default`, ...). Use camelCase keys, and remember `#{}` members need commas.
:::

## Core messaging

| Decorator | Target | Purpose |
| --- | --- | --- |
| `@channel(address, description?)` | Operation | Defines a channel address |
| `@publish` / `@subscribe` | Operation | Marks operation as send / receive |
| `@reply(replyModel, address?)` | Operation | Operation reply with message reference |

## Servers

| Decorator | Target | Purpose |
| --- | --- | --- |
| `@server(name, config)` | Namespace | Defines server (url, protocol, description, variables) |
| `@useChannelServer(name)` | Operation | Binds a channel to a specific server |

## Messages

| Decorator | Target | Purpose |
| --- | --- | --- |
| `@message(config)` | Model | Message metadata (title, contentType, description, examples) |
| `@messageId(id)` | Model | Overrides auto-generated message key |
| `@header(name, value?)` | Model / ModelProperty | Defines message headers |
| `@correlationId(location)` | Model | Correlation ID runtime expression for message tracing |

## Protocols and bindings

| Decorator | Target | Purpose |
| --- | --- | --- |
| `@protocol(config)` | Operation / Model | Protocol-specific config at spec-correct placements |
| `@bindings(config)` | Operation / Model / Namespace | Generic protocol bindings (auto-versioned, placement-checked) |
| `@reusableBinding(name, config)` | Namespace | Declares a reusable binding |
| `@useBinding(name)` | Operation / Model / Namespace | References a reusable binding |
| `@useChannelBinding(name)` | Operation | References a reusable channel binding |

See [Protocol Bindings](/guides/bindings/) for per-protocol placement rules.

## Security

| Decorator | Target | Purpose |
| --- | --- | --- |
| `@security(config)` | Operation / Namespace | Declares security schemes (oauth2, httpApiKey, scramSha512, ...) |
| `@operationSecurity(config)` | Operation | Attaches security requirements to one operation |

See [Security](/guides/security/) for scheme details.

## Document metadata

| Decorator | Target | Purpose |
| --- | --- | --- |
| `@apiVersion(version)` | Namespace | Sets `info.version` |
| `@defaultContentType(type)` | Namespace | Sets `defaultContentType` on document root |
| `@operationId(id)` | Operation | Overrides auto-generated operation key |
| `@jsonSchemaExtension(key, value)` | Model / ModelProperty / Union / Enum / Scalar | Arbitrary JSON Schema keywords, repeatable |
| `@extension(key, value)` | Namespace / Operation / Model | AsyncAPI `x-` spec extensions (root / operation / message objects) |
| `@tags(value)` | Model / Operation / Namespace | Tags (strings or rich objects) |

## Reusable components

| Decorator | Target | Purpose |
| --- | --- | --- |
| `@operationTrait(name, config)` | Namespace | Declares `components.operationTraits` entry |
| `@useOperationTrait(name)` | Operation | References an operation trait |
| `@messageTrait(name, config)` | Namespace | Declares `components.messageTraits` entry |
| `@useMessageTrait(name)` | Model | References a message trait |
| `@parameter(name, config)` | Namespace | Declares `components.parameters` for channel address templating |
| `@reusableCorrelationId(name, location)` | Namespace | Declares `components.correlationIds` entry |
| `@useCorrelationId(name)` | Model | References a reusable correlation ID |

See [Reusable Components](/guides/reusable-components/) for worked examples.

## Standard TypeSpec decorators

These come from `@typespec/compiler` and are fully supported: `@pattern`, `@minValue`, `@maxValue`, `@minLength`, `@maxLength`, `@format`, `@minItems`, `@maxItems`, `@doc`, `@summary` (maps to `title`), `@example` (maps to `examples`), `@visibility` (maps to `readOnly`/`writeOnly`), `@encodedName`, `@encode`, `#deprecated`, and default values via `prop: Type = value`.

## Where to go next

- [Schema Generation](/guides/schemas/) — how models and constraints become JSON Schema
- [Security](/guides/security/) — the 13 valid scheme types
- [Emitter Options](/reference/emitter-options/) — output format and file layout
