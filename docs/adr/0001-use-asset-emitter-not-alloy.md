# ADR: Use AssetEmitter (TypeEmitter) Instead of Alloy

**Status:** Accepted
**Date:** 2026-07-14

## Context

The TypeSpec ecosystem offers two approaches for building emitters:

1. **`@typespec/asset-emitter`** (TypeEmitter) — The legacy framework used by `@typespec/openapi3`, `@typespec/json-schema`, and all first-party TypeSpec emitters. Provides a class-based `TypeEmitter` with overridable methods for each type kind.

2. **`@typespec/emitter-framework`** (Alloy) — The newer framework designed primarily for code generation (producing TypeScript, Python, etc. source code). Uses a declarative template/matcher approach.

This project went through multiple framework changes: starting with AssetEmitter, then migrating to Alloy, then to Effect.TS + Alloy, then back to AssetEmitter after all alternatives failed.

## Decision

Use **`@typespec/asset-emitter`** (TypeEmitter) as the sole emitter framework.

## Rationale

1. **Same approach as `@typespec/openapi3`** — The most mature TypeSpec emitter uses TypeEmitter. AsyncAPI is structurally similar to OpenAPI (specification format, not code). Following the reference implementation is the lowest-risk path.

2. **Alloy is for code generation** — Alloy's strengths (declarative templates, structured output blocks) are designed for generating source code files, not specification documents. The impedance mismatch caused significant friction.

3. **Effect.TS adds complexity without value** — The project tried wrapping emitter logic in Effect.TS for "railway-oriented error handling." In practice, the emitter either succeeds or produces diagnostics — a simpler model that doesn't benefit from Effect's error channel.

4. **Community alignment** — Third-party TypeSpec emitters (AsyncAPI, gRPC, etc.) all use TypeEmitter. Using Alloy would make this project an outlier.

## Consequences

- The emitter class extends `TypeEmitter` from `@typespec/asset-emitter`
- Schema generation uses `AssetEmitter.emitTypeModel()` and related APIs
- Output assembly is done manually in `$onEmit()` (not via declarative templates)
- `@alloy-js/core` and `@typespec/emitter-framework` are NOT dependencies
