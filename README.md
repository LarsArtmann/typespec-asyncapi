<h1 align="center">TypeSpec AsyncAPI Emitter</h1>

<p align="center"><strong>Define your event-driven API in TypeSpec. Generate validated AsyncAPI 3.1 specifications.</strong></p>

<p align="center">
<a href="https://github.com/LarsArtmann/typespec-asyncapi/actions/workflows/ci.yml"><img src="https://github.com/LarsArtmann/typespec-asyncapi/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
<a href="https://www.npmjs.com/package/@lars-artmann/typespec-asyncapi"><img src="https://img.shields.io/npm/v/@lars-artmann/typespec-asyncapi" alt="npm"></a>
<a href="https://www.npmjs.com/package/@lars-artmann/typespec-asyncapi"><img src="https://img.shields.io/bundlephobia/minzip/@lars-artmann/typespec-asyncapi" alt="npm bundle size"></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT"></a>
</p>

<p align="center">
<a href="https://img.shields.io/badge/AsyncAPI-3.1.0-blue"><img src="https://img.shields.io/badge/AsyncAPI-3.1.0-blue" alt="AsyncAPI 3.1"></a>
<a href="https://img.shields.io/badge/Protocols-22-blue"><img src="https://img.shields.io/badge/Protocols-22-blue" alt="Protocols"></a>
</p>

<p align="center">
<a href="https://typespec-asyncapi.lars.software">Documentation</a> · <a href="https://www.npmjs.com/package/@lars-artmann/typespec-asyncapi">npm Package</a>
</p>

---

A TypeSpec emitter that transforms TypeSpec service definitions into [AsyncAPI 3.1](https://www.asyncapi.com/) specifications. Define your event schemas, channels, and operations in TypeSpec, then generate standards-compliant AsyncAPI YAML or JSON.

For teams building event-driven APIs who want a **typed, validated, protocol-aware** AsyncAPI source of truth instead of hand-written YAML. Every byte of output is validated against the official AsyncAPI 3.1.0 JSON Schema (AJV) across a 270+-test compliance suite; all 19 protocol bindings are auto-generated from `@asyncapi/specs` with version auto-injection, field-level validation, and placement checking.

## Why this emitter

| Capability | This emitter | `tsp-asyncapi` (as of 2026-08) |
| --- | --- | --- |
| AsyncAPI version | 3.1.0 (latest), AJV-validated | 3.0.0 |
| Protocols | 22, bindings auto-generated from official specs | 13, hand-written |
| Reusable components | 7 `components.*` slots via 11 decorators (traits, parameters, correlationIds, bindings) | Not supported |
| Multi-file output | `split-schemas` with `$ref` rewriting | Not supported |
| `@typespec/versioning` | Integrated (`info.version` from versioned enums) | Deferred |
| Generic models | Stable argument-derived schema names (`Page<User>` → `PageUser`) | — |
| `x-` spec extensions | `@extension("x-…", value)` on root/operations/messages | Planned |
| Output validation | 270+ compliance tests against the official AsyncAPI 3.1.0 JSON Schema | 15 property tests |

## Who is this for?

- **Event-driven API architects** who maintain AsyncAPI documents across Kafka, MQTT, and WebSocket fleets and watch hand-written YAML drift from the real schemas within a week.
- **Platform engineers** who need spec compliance enforced in CI — output validated against the official AsyncAPI 3.1.0 JSON Schema on every build, not eyeballed in review.
- **Backend teams already using TypeSpec** for OpenAPI/REST who want one modeling language and one `tsp compile` for the async half of their system.
- **Tech leads fighting documentation rot** — schemas, examples, security schemes, and protocol bindings that regenerate from source instead of aging in a wiki.

## When NOT to use this

Skip this emitter if:

- You need **AsyncAPI 2.x output** — this emitter targets AsyncAPI 3.x only. Tooling locked to 2.6 (older AsyncAPI Studio releases, some code generators) cannot consume 3.1 documents; reach for a 2.6-targeted authoring workflow instead.
- You want **runtime broker administration** — this generates specification documents; it does not create topics or queues, deploy brokers, or validate live traffic. Use infrastructure-as-code tools for that.
- Your team will not adopt **TypeSpec as the source of truth** — a generator whose input is maintained separately from the code it describes just adds a second document to drift. Keep a linter (Spectral) on hand-written YAML instead.
- You need **a stable public API surface today** — the project is 0.x beta; decorator signatures and emitter options can change before 1.0 (see the [roadmap](ROADMAP.md)).

## Installation

```bash
pnpm add @lars-artmann/typespec-asyncapi @typespec/compiler
```

`@lars-artmann/typespec-asyncapi` is the scoped npm package; the emitter is loaded by the `tsp` compiler via `tspconfig.yaml`:

```yaml
emit:
  - "@lars-artmann/typespec-asyncapi"
options:
  "@lars-artmann/typespec-asyncapi":
    file-type: yaml
```

## Quick Start

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
npx tsp compile api.tsp
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

### 30 Decorators

**Core messaging**

| Decorator | Target | Purpose |
| --- | --- | --- |
| `@channel(address, description?)` | Operation | Defines a channel address |
| `@publish` / `@subscribe` | Operation | Marks operation as send / receive |
| `@reply(replyModel, address?)` | Operation | Operation reply with message reference |

**Servers**

| Decorator | Target | Purpose |
| --- | --- | --- |
| `@server(name, config)` | Namespace | Defines server (url, protocol, description, variables) |
| `@useChannelServer(name)` | Operation | Binds a channel to a specific server |

**Messages**

| Decorator | Target | Purpose |
| --- | --- | --- |
| `@message(config)` | Model | Message metadata (title, contentType, description, examples) |
| `@messageId(id)` | Model | Overrides auto-generated message key |
| `@header(name, value?)` | Model / ModelProperty | Defines message headers |
| `@correlationId(location)` | Model | Correlation ID runtime expression for message tracing |

**Protocols & bindings**

| Decorator | Target | Purpose |
| --- | --- | --- |
| `@protocol(config)` | Operation / Model | Protocol-specific config at spec-correct placements |
| `@bindings(config)` | Operation / Model / Namespace | Generic protocol bindings (auto-versioned, placement-checked) |
| `@reusableBinding(name, config)` | Namespace | Declares a reusable binding |
| `@useBinding(name)` | Operation / Model / Namespace | References a reusable binding |
| `@useChannelBinding(name)` | Operation | References a reusable channel binding |

**Security**

| Decorator | Target | Purpose |
| --- | --- | --- |
| `@security(config)` | Operation / Namespace | Declares security schemes (`oauth2`, `httpApiKey`, `scramSha512`, …) |
| `@operationSecurity(config)` | Operation | Attaches security requirements to one operation |

**Document metadata**

| Decorator | Target | Purpose |
| --- | --- | --- |
| `@apiVersion(version)` | Namespace | Sets `info.version` |
| `@defaultContentType(type)` | Namespace | Sets `defaultContentType` on document root |
| `@operationId(id)` | Operation | Overrides auto-generated operation key |
| `@jsonSchemaExtension(key, value)` | Model / ModelProperty / Union / Enum / Scalar | Arbitrary JSON Schema keywords, repeatable |
| `@extension(key, value)` | Namespace / Operation / Model | AsyncAPI `x-` spec extensions (root / operation / message objects) |
| `@tags(value)` | Model / Operation / Namespace | Tags (strings or rich `#{name, description, externalDocs}` objects) |

**Reusable components** (`components.*` slots — traits, parameters, correlation IDs)

| Decorator | Target | Purpose |
| --- | --- | --- |
| `@operationTrait(name, config)` | Namespace | Declares `components.operationTraits` entry |
| `@useOperationTrait(name)` | Operation | References an operation trait |
| `@messageTrait(name, config)` | Namespace | Declares `components.messageTraits` entry |
| `@useMessageTrait(name)` | Model | References a message trait |
| `@parameter(name, config)` | Namespace | Declares `components.parameters` for channel address templating |
| `@reusableCorrelationId(name, location)` | Namespace | Declares `components.correlationIds` entry |
| `@useCorrelationId(name)` | Model | References a reusable correlation ID |

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

**`@jsonSchemaExtension(key, value)`** attaches arbitrary JSON Schema keywords (`x-` extensions, `multipleOf`, vendor keywords) to any Model, ModelProperty, Union, Enum, or Scalar — inline and as `$ref` siblings. Repeatable; the outermost same-key application wins; object/array values use `#{}` / `#[]` literals.

**`@extension("x-...", value)`** attaches AsyncAPI specification extensions: namespace targets extend the document root, operations the operation object, models the message object. Keys must start with `x-`.

**`@encodedName("application/json", "wireName")`** (core TypeSpec decorator) renames properties on the wire: `properties` keys, `required` entries, and `discriminator` values all use the encoded name, with MIME-subtype resolution handled by the compiler.

**Generic models** get stable, argument-derived schema names: `Page<User>` becomes `components.schemas.PageUser`, `Box<int32>` becomes `BoxInt32`, and `Page<Page<User>>` becomes `PagePageUser` (each argument's name with its first letter capitalized, applied recursively). Unspeakable instantiations — anonymous or literal arguments like `Box<{ x: string }>` — are inlined instead of referenced, and `Record<string, T>` maps to `{ type: "object", additionalProperties }`. A model named `PageUser` colliding with an instantiation `Page<User>` triggers a `duplicate-schema-name` warning.

### Multi-File Output

```bash
pnpm dlx tsp compile api.tsp --emit @lars-artmann/typespec-asyncapi --option @lars-artmann/typespec-asyncapi.split-schemas=true
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

The emitter provides 32 compile-time diagnostics (20 error + 12 warning) that catch invalid configurations before they reach your AsyncAPI output — unsupported protocols, invalid binding versions, missing channel paths, malformed server URLs, and more.

### Rigor

- **1259 tests** (vitest), including a **270+ test AsyncAPI 3.1.0 compliance suite** that validates every output against the official AsyncAPI 3.1.0 JSON Schema via AJV
- **98% line coverage** (gated at 75% minimum per file in CI)
- **Zero code clones** (jscpd, 0% threshold enforced in CI)
- **Strict TypeScript** — zero `any`, `noUncheckedIndexedAccess`, type-aware ESLint (`strictTypeChecked`) with zero errors and zero warnings
- Real-world regression guards: canonical AsyncAPI specs (Streetlights MQTT, WebSocket Chat, Sensor IoT, Enterprise Notifications) and adapted model patterns from real GitHub projects compile and validate on every CI run

## Architecture

This emitter is built on the official `@typespec/asset-emitter` framework ("EFv1"). That framework gives us declaration scoping, reference resolution, and cycle handling for free — but it is intentionally thin: schema assembly happens in our own table-driven pipeline.

**Honest trade-off:** the asset-emitter is an undocumented internal API of the TypeSpec compiler. Major compiler releases can change it. We contain this risk in three ways:

1. `generateSchemas()` in `src/schema-generator.ts` is the single `@typespec/asset-emitter` import seam — everything downstream is plain compiler AST types.
2. The compliance suite + golden files pin exact output, so any framework drift breaks CI loudly, not silently.
3. A direct-AST emitter (framework-free) is the v0.4.0 roadmap item; the schema-emitter surface is small enough that the migration is bounded.

If you evaluate emitters on architecture, the deciding fact is output: every document this emitter ships validates against the AsyncAPI 3.1.0 JSON Schema.

## Examples

Thirteen runnable examples live in [`examples/`](./examples/) — every one compiles with zero diagnostics and its output validates against the official AsyncAPI 3.1.0 JSON Schema in CI. Start with [`streetlights-mqtt`](./examples/streetlights-mqtt/) (the canonical AsyncAPI example), then see [`kafka-orders`](./examples/kafka-orders/) (bindings + security), [`websocket-chat`](./examples/websocket-chat/) (headers + correlation), [`reusable-components`](./examples/reusable-components/) (traits, parameters, reusable bindings), and [`split-schemas`](./examples/split-schemas/) (multi-file output).

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

### Releasing

Releases are published automatically by [`.github/workflows/release.yml`](.github/workflows/release.yml): pushing a `v*` tag runs the full `pnpm run verify` gate (build, lint, 1250+ tests, coverage ≥ 75%/file, zero code clones) and then publishes to npm with [provenance](https://docs.npmjs.com/generating-provenance-statements) attestation.

```bash
# bump version in package.json and update CHANGELOG.md first
git tag -m "v0.3.0" v0.3.0
git push origin v0.3.0
```

The workflow also supports `workflow_dispatch` for dry runs (verify + `npm publish --dry-run`, no upload). The `NPM_TOKEN` secret must be a granular access token with publish rights for this package.

## Status

| Metric | Value |
| --- | --- |
| Version | 0.3.0-beta.1 (npm, `latest`) |
| Tests | 1259 passing (vitest) |
| Coverage | 98.1% average line coverage (gated at 75% per file) |
| Build | 0 TypeScript errors (strict mode) |
| Lint | 0 errors, 0 warnings (ESLint + oxlint) |
| Decorators | 30 |
| Diagnostics | 32 codes (20 error + 12 warning) |
| Protocols | 22 (auto-generated from `@asyncapi/specs`) |
| Duplication | 0% (jscpd, 0% threshold) |
| Output | Validates against official AsyncAPI 3.1.0 JSON Schema |

## License

MIT
