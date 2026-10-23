---
title: Architecture
description: How the emitter turns a TypeSpec type graph into an AsyncAPI 3.1 document — schema seam, document builders, state, and validation.
head:
  - tag: meta
    attrs:
      property: og:image
      content: "https://typespec-asyncapi.lars.software/og/reference/architecture.png"
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
      content: "Architecture — typespec-asyncapi"
  - tag: meta
    attrs:
      name: twitter:image
      content: "https://typespec-asyncapi.lars.software/og/reference/architecture.png"
---

This page is for contributors and for anyone deciding whether to depend on the internals. The public contract is the decorator surface and the emitted document; everything below is implementation.

## The pipeline

```text
api.tsp
  └─ tsp compile
       ├─ decorators (src/decorators.ts, src/minimal-decorators.ts)
       │    └─ state (src/state.ts)
       ├─ schema generation (src/schema-generator.ts)
       │    └─ AsyncAPISchemaEmitter (src/schema-emitter.ts)
       ├─ document assembly (src/document-builder.ts)
       │    └─ src/builders/* (channels, operations, messages, servers, …)
       └─ write output (src/emitter.ts, src/schema-splitter.ts)
```

1. **Decorators** validate their configuration at the boundary and write into a per-program state map. Validation failures become library diagnostics.
2. **Schema generation** walks the type graph through `@typespec/asset-emitter` and produces JSON Schema fragments plus `components.schemas` declarations.
3. **Document assembly** reads decorator state and schema results, then builds channels, operations, messages, servers, security schemes, tags, and reusable components.
4. **Output** serializes YAML or JSON. With `split-schemas`, each schema is written to its own file and every `$ref` is rewritten.

## Two boundaries that matter

**The schema seam.** `@typespec/asset-emitter` is imported by exactly three files: `src/schema-generator.ts`, `src/schema-emitter.ts`, and `src/extract-value.ts`. ESLint enforces that containment. The eleven document builders consume only `@typespec/compiler`. This is deliberate: it keeps an eventual direct-AST rewrite local instead of touching every builder.

**State, not global singletons.** Decorators communicate with the builder through `src/state.ts` and the TypeSpec state map (`src/state-compatibility.ts`). Multi-namespace programs rely on this isolation, so state keys are scoped per program.

## Schema generation

`AsyncAPISchemaEmitter` extends the framework's `TypeEmitter<JsonSchema, AsyncAPIEmitterOptions>`. Only methods that are actual asset-emitter dispatch keys are overridden — an override named after a non-key method is dead code.

Notable behaviors:

- Named models, enums, and unions become `components.schemas` declarations and are referenced with `$ref`.
- Inheritance uses `allOf`; the derived schema contains only its own properties.
- Unions of models use `oneOf`; mixed unions use `anyOf`; string-literal unions use `enum`.
- Generic instantiations get argument-derived names (`Page<User>` becomes `PageUser`); `Record<K, V>` inlines as `additionalProperties`.
- Constraints and metadata are table-driven in `src/constraint-mapper.ts`. Validation keywords are skipped on `$ref` schemas; annotation keywords are allowed as `$ref` siblings.
- Framework-interned values are never mutated in place. Property schemas are cloned before constraints are applied, because the asset-emitter may share one value object across every use of a type.

## Binding validation

`src/constants/generated-bindings.ts` is generated from `@asyncapi/specs/bindings/`. It feeds:

- valid versions per protocol, with a small override map for schema-restricted protocols;
- the placement matrix (channel, operation, message) per protocol;
- field-level value validation.

`src/validation/binding-validator.ts` normalizes binding keys, injects missing `bindingVersion`, checks placement, and warns on fields that cannot be placed. A binding is never emitted as a version-only shell.

## Testing layers

| Layer       | What it protects                                                                            |
| ----------- | ------------------------------------------------------------------------------------------- |
| Compliance  | AJV validation against the official AsyncAPI 3.1.0 schema, plus `$ref` and shape assertions |
| Golden      | Byte-level locks on representative documents                                                |
| Property    | fast-check invariants over generated specs                                                  |
| Integration | Mixed emitters, multi-namespace isolation, CLI behavior                                     |
| Examples    | Every repository example compiles clean and validates in CI                                 |

Coverage runs through Bun's native runtime coverage because the compiler loads `dist/` through a virtual filesystem that vitest's transform never sees.

## Where to go next

- [Contributing](/contributing/) — build, verify, and release workflow
- [Diagnostics](/reference/diagnostics/) — the full code list
- [Decorators](/guides/decorators/) — the public surface
