---
title: Installation
description: Install the typespec-asyncapi emitter and wire it into your TypeSpec project.
---

**Who is this for?** Event-driven API architects, platform engineers, and backend teams already using TypeSpec who want a typed, validated AsyncAPI 3.1 source of truth instead of hand-written YAML.

## Requirements

- Node.js 20.11 or newer
- The [TypeSpec compiler](https://typespec.io/docs/) (`tsp` CLI)
- A package manager: pnpm, npm, yarn, or bun

## Install the emitter

```bash
pnpm add @lars-artmann/typespec-asyncapi @typespec/compiler
```

or with npm:

```bash
npm install @lars-artmann/typespec-asyncapi @typespec/compiler
```

## Wire it into tspconfig.yaml

The emitter is loaded by the `tsp` compiler via `tspconfig.yaml`:

```yaml
emit:
  - "@lars-artmann/typespec-asyncapi"
options:
  "@lars-artmann/typespec-asyncapi":
    file-type: yaml
```

See [Emitter Options](/reference/emitter-options/) for the full option list (output file, format, pretty-printing, `split-schemas`, `asyncapi-id`, and more).

## Verify the install

Create a minimal spec and compile it:

```bash
npx tsp compile api.tsp
```

The output lands in `tsp-output/@lars-artmann/typespec-asyncapi/asyncapi.yaml`.

:::tip
Every emitted document is validated against the official AsyncAPI 3.1.0 JSON Schema by the project's 270+-test compliance suite. If `tsp compile` succeeds, the output is spec-compliant.
:::

## Where to go next

- [Quick Start](/getting-started/quick-start/) — your first channel, operation, and message in 5 minutes
- [Decorators](/guides/decorators/) — all 30 decorators with targets and examples
- [Protocol Bindings](/guides/bindings/) — Kafka, MQTT, WebSocket, and 16 more
- [Related Tools](/related-tools/) — AsyncAPI Studio, Spectral, and sibling emitters
