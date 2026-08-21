---
title: Versioning
description: Drive info.version from @typespec/versioning versioned enums.
---

The emitter integrates with [`@typespec/versioning`](https://typespec.io/docs/libraries/versioning/overview/):

```typespec
import "@typespec/versioning";
using TypeSpec.Versioning;

@versioned(Versions)
namespace MyAPI;

enum Versions {
  v1: "1.0.0";
  v2: "2.0.0";
}
```

## Precedence

`info.version` resolves in this order:

1. The emitter `version` option
2. `@apiVersion` decorator
3. The latest `@versioned` enum value
4. `"1.0.0"` (fallback)

## Versioned libraries

When your spec imports a `@versioned` library, the latest enum value of the importing namespace wins — so a spec that consumes `MyLib@v2` emits `info.version: 2.0.0` unless overridden.

:::tip
Use `@service(#{ title: "My API" })` (core TypeSpec) to set `info.title`; the emitter reads it via `listServices`. Emitter options take precedence over both.
:::

## Where to go next

- [Emitter Options](/reference/emitter-options/) — the `version` option
- [Security](/guides/security/) — scheme declarations
- [Quick Start](/getting-started/quick-start/) — the basics
