# Feature Inventory

**Verified:** 2026-07-14 against actual code + test run (348 pass, 0 fail)
**Project:** `@lars-artmann/typespec-asyncapi` v0.0.1

---

## Core Emitter

| Feature | Status | Evidence |
|---|---|---|
| AsyncAPI 3.0 YAML generation | FULLY_FUNCTIONAL | `src/emitter.ts:688-697` — `yamlStringify(document)` |
| AsyncAPI 3.0 JSON generation | FULLY_FUNCTIONAL | `src/emitter.ts:695-696` — `JSON.stringify(document, null, 2)` |
| Spec-compliant `$ref` chain | FULLY_FUNCTIONAL | Operations → `#/channels/{id}/messages/{id}` → `#/components/messages/{id}` → `#/components/schemas/{name}` |
| AsyncAPI 3.0 schema validation | FULLY_FUNCTIONAL | `test/validation/schema-validation.test.ts` — validates output against official `@asyncapi/specs` 3.0.0 JSON schema |
| TypeSpec `$onEmit` integration | FULLY_FUNCTIONAL | `src/emitter.ts:680` — single `$onEmit` entry point |
| `emitFile` output | FULLY_FUNCTIONAL | Respects `output-file` and `file-type` options |
| Strongly-typed document model | FULLY_FUNCTIONAL | `src/domain/models/asyncapi-document.ts` — `AsyncAPIDocument`, `ChannelObject`, etc. |

## Schema Generation

| Feature | Status | Evidence |
|---|---|---|
| Model → JSON Schema | FULLY_FUNCTIONAL | `src/emitter.ts:47-78` — `modelDeclaration()` handles properties, types, required |
| Inheritance (base models) | FULLY_FUNCTIONAL | `src/emitter.ts:52-68` — `collectProperties()` walks `baseModel` chain |
| `@doc` → `description` | FULLY_FUNCTIONAL | `src/emitter.ts:74-75` — `getDoc()` on models and properties |
| Optional vs required fields | FULLY_FUNCTIONAL | `src/emitter.ts:61-66` — `!prop.optional` → `required` array |
| Array types | FULLY_FUNCTIONAL | `src/emitter.ts:251-253` — `{ type: "array", items: ... }` |
| Union/enum types | FULLY_FUNCTIONAL | `src/emitter.ts:232-247` — string unions → `{ type: "string", enum: [...] }` |
| Scalar type mapping | FULLY_FUNCTIONAL | `src/emitter.ts:269-321` — all TypeSpec scalars mapped (int32, float64, utcDateTime, etc.) |
| Nested model references | PARTIALLY_FUNCTIONAL | Inlined, not `$ref`-ed — works but produces verbose output for deep nesting |
| Channel path parameters | PARTIALLY_FUNCTIONAL | `storeChannelState` parses `{var}` but emitter doesn't emit `parameters` on channels |

## Decorator System

| Decorator | Status | Evidence |
|---|---|---|
| `@channel` | FULLY_FUNCTIONAL | Stores path; emitter creates channel with address |
| `@publish` | FULLY_FUNCTIONAL | Marks operation as `action: "send"` |
| `@subscribe` | FULLY_FUNCTIONAL | Marks operation as `action: "receive"` |
| `@server` | FULLY_FUNCTIONAL | `src/emitter.ts:631-647` — emitted as server objects with host/protocol/description |
| `@message` | FULLY_FUNCTIONAL | Stores title/description/contentType; merged into components.messages |
| `@protocol` | FULLY_FUNCTIONAL | Stores protocol config; emitted as channel bindings |
| `@security` | FULLY_FUNCTIONAL | `src/emitter.ts:649-652` — emitted as `components.securitySchemes` |
| `@tags` | FULLY_FUNCTIONAL | Emitted as `Tag[]` arrays on operations |
| `@correlationId` | FULLY_FUNCTIONAL | Emitted as `correlationId` objects on messages |
| `@bindings` | FULLY_FUNCTIONAL | Emitted as `bindings` objects on operations and messages |
| `@header` | FULLY_FUNCTIONAL | Emitted as JSON Schema `headers` on messages |

## State Management

| Feature | Status | Evidence |
|---|---|---|
| State persistence via `stateMap` | FULLY_FUNCTIONAL | `src/state-compatibility.ts` — `getStateMap()` handles StateMapView |
| State consolidation | FULLY_FUNCTIONAL | `src/state.ts:139-174` — `consolidateAsyncAPIState()` unifies all state maps |
| `protocolBindings` in state | FULLY_FUNCTIONAL | Added to consolidated state; accessible by emitter |

## Configuration

| Feature | Status | Evidence |
|---|---|---|
| `output-file` option | FULLY_FUNCTIONAL | `src/emitter.ts:691` |
| `file-type` option (yaml/json) | FULLY_FUNCTIONAL | `src/emitter.ts:686-694` |
| `title` option | FULLY_FUNCTIONAL | `src/emitter.ts:664` |
| `version` option | FULLY_FUNCTIONAL | `src/emitter.ts:665` |
| `description` option | FULLY_FUNCTIONAL | `src/emitter.ts:666` |
| `asyncapi-version` option | FULLY_FUNCTIONAL | Hardcoded to `"3.0.0"` (only supported version) |
| `protocol-bindings` option | NOT_IMPLEMENTED | Accepted but ignored |
| `versioning` option | NOT_IMPLEMENTED | Accepted but ignored |
| `security-schemes` option | NOT_IMPLEMENTED | Accepted but ignored |
| `validate-spec` option | NOT_IMPLEMENTED | Accepted but ignored |
| `omit-unreachable-types` option | NOT_IMPLEMENTED | Accepted but ignored |

## Testing

| Feature | Status | Evidence |
|---|---|---|
| Bun test runner | FULLY_FUNCTIONAL | 348 tests across 30 files |
| Golden file test | FULLY_FUNCTIONAL | `test/golden/golden-file.test.ts` |
| Schema validation tests | FULLY_FUNCTIONAL | `test/validation/schema-validation.test.ts` |
| Integration tests | FULLY_FUNCTIONAL | `test/integration/` — 30 test files using programmatic API |
| E2E tests | PARTIALLY_FUNCTIONAL | `test/e2e/` — 4 files, some use `Effect.TS` |

## Build

| Feature | Status | Evidence |
|---|---|---|
| TypeScript compilation | FULLY_FUNCTIONAL | 0 errors |
| ESLint | FULLY_FUNCTIONAL | `bun run lint` passes on `src/` |
