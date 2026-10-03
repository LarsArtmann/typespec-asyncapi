---
title: Mixing with OpenAPI (REST + Events)
description: Serve REST and event contracts from one TypeSpec program — @typespec/openapi3 owns routed operations, this emitter owns events, and ownership never collides.
---

One TypeSpec program can produce both contracts: `@typespec/http` + `@typespec/openapi3` emit the REST document, and this emitter emits the event document. Ownership of every operation is decided by `@typespec/http`'s resolved route table, so the two emitters never claim the same operation.

## Prerequisites

`@typespec/http` must be importable when you compile:

```bash
pnpm add -D @typespec/http
```

Keep it a **devDependency**. This emitter only reads http's route table at compile time — moving it to `dependencies` or `peerDependencies` adds a runtime requirement your consumers don't need.

## Recommended layout

The pattern that always works: **REST operations under the `@service` namespace, event operations outside it** (full example in `examples/mixed-rest-events`):

```typespec
import "@typespec/http";
import "@lars-artmann/typespec-asyncapi";

using TypeSpec.Http;
using TypeSpec.AsyncAPI;

namespace Service.Backend;

model HealthcheckPong {
  status: string;
  latencyMs: int32;
}

// REST branch: everything inside @service is routed by http and published
// by openapi3. This emitter keeps it out of the event document.
@service(#{title: "Backend"})
@route("/api/v1")
namespace Rest {
  @get op getHealth(): HealthcheckPong;
}

// Events branch: sibling namespace OUTSIDE the @service subtree.
// The AsyncAPI server lives here.
@TypeSpec.AsyncAPI.server("Production", #{
  url: "my.service.io",
  protocol: "wss",
})
namespace Events {
  @subscribe
  @channel("health/pong")
  op receivePing(): HealthcheckPong;
}
```

Compile both contracts from one `tspconfig.yaml`:

```yaml
emit:
  - "@typespec/openapi3"
  - "@lars-artmann/typespec-asyncapi"
options:
  "@typespec/openapi3":
    emitter-output-dir: "{output-dir}/rest"
  "@lars-artmann/typespec-asyncapi":
    emitter-output-dir: "{output-dir}/websocket"
    output-file: "asyncapi"
    file-type: "yaml"
```

## Ownership rules

The emitter consults http's route table for every operation it discovers:

| Operation | Owner | Diagnostic |
| ------------------------------- | ------------------------ | ------------------------------- |
| Explicit `@publish`/`@subscribe`/`@channel` | AsyncAPI, always | none, never suppressed by routing |
| Bare operation with an http route | REST (excluded from events) | `bare-op-assumed-rest`, cites the exact `VERB /path` |
| Bare operation inside `@service`, event-decorated | AsyncAPI (warned) | `event-op-in-service-namespace`, cites the phantom REST route |
| AsyncAPI operation under a server with `http`/`https` protocol | AsyncAPI (deliberate webhooks) | none — intentional AsyncAPI-over-HTTP stays silent |

Verb-less operations default to `GET` (or `POST` when they take a `@body`), matching http's own inference — so a bare `op ping(): Pong` under `@service` is reported as `GET` by the exclusion warning.

## Overriding a classification

When a bare routed operation really is an event channel, suppress the warning per operation:

```typespec
#suppress "@lars-artmann/typespec-asyncapi/bare-op-assumed-rest" "intentional event channel"
op orderUpserted(): OrderUpserted;
```

The `event-op-in-service-namespace` warning is deduplicated per namespace — if several event operations share one misplaced namespace, the report says `N more operation(s) in this namespace are also affected` instead of firing once per operation.

## The duplicate-operation pitfall

Declaring two operations on the same route inside `@service` makes **http itself** fail with duplicate-operation errors — and then *neither* emitter produces output ([#252](https://github.com/LarsArtmann/typespec-asyncapi/issues/252)). This is an upstream `@typespec/http` behavior, not something this emitter can bypass. If a mixed program compiles to nothing at all, look for two verb-less operations sharing an implicit route.

## Fallback inference is deprecated

If the route table cannot be read (http not importable at compile time), ownership of bare operations falls back to namespace geometry: a bare operation inside the `@service` namespace is assumed REST. This still works, but emits `bare-op-inference-deprecated` once per program — the inference is removed in 2.0. Explicit decoration (`@publish`/`@subscribe`/`@channel`) never depends on the route table and never warns.

## Where to go next

- [Diagnostics](/reference/diagnostics/) — the mixed-program warnings in detail
- [Decorators](/guides/decorators/) — `@publish`, `@subscribe`, `@channel`
- [Emitter Options](/reference/emitter-options/) — per-emitter output configuration
