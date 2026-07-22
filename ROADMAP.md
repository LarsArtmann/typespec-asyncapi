# Roadmap

> Long-term direction and raw ideas. Items here are NOT actionable tasks.
> When an idea is refined into bounded work, it moves to TODO_LIST.md.
> See FEATURES.md for the honest feature inventory; CHANGELOG.md for release history.

## Current State

Pre-alpha (`0.1.0-alpha`). The emitter produces spec-compliant AsyncAPI 3.1 output validated against the official JSON Schema. 551 tests pass across 48 files. Oxlint and ESLint both clean (0 errors, 0 warnings). 17 diagnostic codes, all compile-time validated. Full protocol binding support (Kafka, AMQP, MQTT, WebSocket, HTTP) with auto-versioning and key normalization. Binding placement validation with `misplaced-binding` warnings.

## Themes

### 1. Spec Compliance Depth

Push toward complete AsyncAPI 3.1 coverage — every field, every binding, every edge case.

Raw ideas:

- Additional protocol bindings: Redis (#42), Google Cloud Pub/Sub (#43), AWS SNS (#44)
- Binding field-level validation against `@asyncapi/specs/bindings/` JSON Schemas at decorator time (not just structural key/version validation)
- Full `@doc` propagation to all AsyncAPI object types (channels currently silently dropped)
- Operation `reply` support (type exists in model, never populated)
- `defaultContentType` on document root
- Multi-message operations (one operation referencing multiple message types)
- Server binding support (`@server` currently emits host/protocol/description, no bindings)
- `@operationId` / `@messageId` decorators for explicit naming control

### 2. Developer Experience

Make the emitter a joy to use and maintain.

Raw ideas:

- AsyncAPI Studio compatibility verification (round-trip: emit → import → validate)
- `ParsedAsyncAPIDocument` type to eliminate `as any` in test assertions
- Coverage tooling that works with TypeSpec's `dist/*.js` loading pattern (vitest can't instrument opaque modules)
- Consolidate ESLint and oxlint configs (two linters with potentially contradictory rules)
- Performance profiling for large specifications (100+ channels)

### 3. Architecture

Keep the codebase honest as it grows.

Raw ideas:

- Refactor `buildAsyncAPIDocument()` (315 lines, complexity 84 — the single biggest maintenance liability)
- Protocol binding validation framework: derive `BINDING_PLACEMENT` matrix from `@asyncapi/specs` JSON Schema at build time instead of hand-maintaining
- `@bindings` support for `Namespace` target (enables server binding placement validation)
- Plugin/hook system for custom binding extensions (#32 RFC)
- Multi-file TypeSpec input support (`import` across `.tsp` files)

### 4. Ecosystem Integration

Connect to the broader TypeSpec and AsyncAPI ecosystems.

Raw ideas:

- AsyncAPI generator ecosystem compatibility (code generation from emitter output)
- `@typespec/versioning` support (#163)
- Multi-file output (#78)
- OpenAPI 3.x cross-emitter type sharing

## Non-Goals

- We do NOT aim to replace the AsyncAPI specification itself
- We do NOT generate code (use AsyncAPI generator for that)
- We do NOT support AsyncAPI 2.x output (3.1 only)
- We do NOT build a VS Code extension (the TypeSpec VS Code extension already provides IDE support)
- We do NOT convert AsyncAPI 2.x specs to 3.x (use the official AsyncAPI converter)
- We do NOT build a plugin architecture for community protocol bindings (protocol bindings are defined in code, not extensible at runtime)
