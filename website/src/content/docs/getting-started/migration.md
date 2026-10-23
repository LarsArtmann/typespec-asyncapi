---
title: Migration Guide
description: Move from hand-written AsyncAPI YAML or another TypeSpec emitter to typespec-asyncapi without losing channel semantics.
head:
  - tag: meta
    attrs:
      property: og:image
      content: "https://typespec-asyncapi.lars.software/og/getting-started/migration.png"
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
      content: "Migration Guide — typespec-asyncapi"
  - tag: meta
    attrs:
      name: twitter:image
      content: "https://typespec-asyncapi.lars.software/og/getting-started/migration.png"
---

There is no YAML importer. Migration is a modeling exercise: describe the same channels, operations, messages, and servers in TypeSpec, then diff the emitted document against the one you have today. The diff is the review artifact.

## From hand-written YAML

1. **Inventory the document.** List every `channels`, `operations`, `components.messages`, and `components.schemas` entry. Most real documents have far fewer distinct parts than they appear to.
2. **Model payloads first.** Each message payload becomes a TypeSpec `model`; shared schemas become named models so they land in `components.schemas` as reusable entries.
3. **Add channels and operations.** `@channel("address")` on an operation creates the channel. Use `@publish` or `@subscribe` to state the action explicitly; the emitter can otherwise infer it from the operation name.
4. **Move servers to the namespace.** `@server("production", #{ url: "...", protocol: "kafka" })` targets a namespace, not an operation.
5. **Port bindings.** Replace hand-written binding YAML with `@protocol(...)` or `@bindings(...)`. Versions are injected automatically, and fields are placed where the protocol expects them.
6. **Port security.** Declare schemes with `@security(...)` and attach requirements with `@operationSecurity(...)`. AsyncAPI 3.1 uses `availableScopes`, which the emitter normalizes for you.
7. **Compile and diff.** Compare channel addresses, operation actions, `$ref` chains, and binding objects — not YAML formatting. Run the result through AsyncAPI Studio or the parser before deleting the old file.

## From another TypeSpec emitter

1. Swap the package and the `emit` entry in `tspconfig.yaml`.
2. Replace its import with `import "@lars-artmann/typespec-asyncapi";` and add `using TypeSpec.AsyncAPI;`.
3. Recompile. Expect diagnostics for anything the previous emitter accepted silently: unknown protocols, misplaced bindings, malformed server URLs, invalid security scheme types.
4. Reconcile decorator differences against [Decorators](/guides/decorators/). This emitter's surface is documented there; do not assume another emitter's decorator names or targets carry over.
5. Update consumers for AsyncAPI **3.1** differences. If the previous output was 3.0, check `availableScopes`, security requirement shapes, and component references.

## Checklist

| Step                 | Done when                                                              |
| -------------------- | ---------------------------------------------------------------------- |
| Payloads modeled     | Every message payload is a named model or an explicit inline schema    |
| Channels mapped      | Every channel address appears exactly once in the output               |
| Actions explicit     | Every operation has `@publish` or `@subscribe`                         |
| Servers on namespace | `@server` decorates the namespace, and `protocol` is supported         |
| Bindings placed      | No `misplaced-binding` warning; `bindingVersion` is present            |
| Security declared    | Schemes exist in `components.securitySchemes` and requirements resolve |
| Validation clean     | `tsp compile` emits no errors and no unexpected warnings               |
| Consumer verified    | AsyncAPI Studio or the parser accepts the document                     |

## Common pitfalls

- `@server` cannot decorate an operation. Put it above the namespace declaration.
- `#{}` value literals are comma-separated. Model properties are not.
- A blockless `namespace Foo;` must be the first declaration in its file.
- Reserved words (`model`, `enum`, `default`, …) cannot be keys inside `#{}`.
- `@deprecated` does not exist in the standard library. Use the `#deprecated "reason"` compiler directive.
- `@visibility` is lossy: read-only maps to `readOnly`, create/update-only maps to `writeOnly`, and delete/query are ignored.

## Where to go next

- [Examples](/examples/) — working specs for Kafka, MQTT, WebSocket, and reusable components
- [Decorators](/guides/decorators/) — targets and configuration for all 30 decorators
- [Diagnostics](/reference/diagnostics/) — every code and how to resolve it
