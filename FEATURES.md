# Feature Inventory

**Verified:** 2026-07-22 against actual code + test run (551 pass, 0 fail, 0 skip, 0 todo)
**Project:** `@lars-artmann/typespec-asyncapi` v0.2.0-beta
**Lint:** oxlint 0 errors / 0 warnings, ESLint 0 errors / 0 warnings
**Diagnostics:** 18 codes (15 error + 3 warning), all compile-time validated via `$lib.reportDiagnostic()`

---

## Core Emitter

| Feature                        | Status           | Evidence                                                                                                                          |
| ------------------------------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| AsyncAPI 3.1 YAML generation   | FULLY_FUNCTIONAL | `src/emitter.ts` — `yamlStringify(document)`                                                                                      |
| AsyncAPI 3.1 JSON generation   | FULLY_FUNCTIONAL | `src/emitter.ts` — `JSON.stringify(document, null, 2)`                                                                            |
| Spec-compliant `$ref` chain    | FULLY_FUNCTIONAL | Operations → `#/channels/{id}/messages/{id}` → `#/components/messages/{id}` → `#/components/schemas/{name}`                       |
| Nested model `$ref`            | FULLY_FUNCTIONAL | Named user models/enums/scalars use `$ref: "#/components/schemas/Name"`                                                           |
| AsyncAPI 3.1 schema validation | FULLY_FUNCTIONAL | `test/validation/schema-validation.test.ts` + `test/compliance/` — validates against official `@asyncapi/specs` 3.1.0 JSON schema |
| TypeSpec `$onEmit` integration | FULLY_FUNCTIONAL | `src/emitter.ts` — single `$onEmit` entry point                                                                                   |
| `emitFile` output              | FULLY_FUNCTIONAL | Respects `output-file` and `file-type` options                                                                                    |
| Strongly-typed document model  | FULLY_FUNCTIONAL | `src/domain/models/asyncapi-document.ts` — `AsyncAPIDocument`, `ChannelObject`, etc.                                              |
| Zero `any` types in emitter    | FULLY_FUNCTIONAL | All TypeEmitter methods use proper TypeSpec types                                                                                 |

## Schema Generation

| Feature                     | Status           | Evidence                                                        |
| --------------------------- | ---------------- | --------------------------------------------------------------- |
| Model → JSON Schema         | FULLY_FUNCTIONAL | `modelDeclaration()` handles properties, types, required        |
| Inheritance (base models)   | FULLY_FUNCTIONAL | `collectProperties()` walks `baseModel` chain                   |
| `@doc` → `description`      | FULLY_FUNCTIONAL | `getDoc()` on models and properties                             |
| Optional vs required fields | FULLY_FUNCTIONAL | `!prop.optional` → `required` array                             |
| Array types                 | FULLY_FUNCTIONAL | `{ type: "array", items: ... }`                                 |
| Union/enum types            | FULLY_FUNCTIONAL | String unions → `{ type: "string", enum: [...] }`               |
| Scalar type mapping         | FULLY_FUNCTIONAL | All TypeSpec scalars mapped (int32, float64, utcDateTime, etc.) |
| Nested model references     | FULLY_FUNCTIONAL | `$ref: "#/components/schemas/ModelName"` for named models       |
| Channel path parameters     | FULLY_FUNCTIONAL | `{var}` in address → `parameters` object on channel             |
| Server variables            | FULLY_FUNCTIONAL | `{var}` in host → `variables` object on server                  |

## Decorator System

| Decorator        | Status           | Evidence                                                                              |
| ---------------- | ---------------- | ------------------------------------------------------------------------------------- |
| `@channel`       | FULLY_FUNCTIONAL | Stores path; emitter creates channel with address                                     |
| `@publish`       | FULLY_FUNCTIONAL | Marks operation as `action: "send"`                                                   |
| `@subscribe`     | FULLY_FUNCTIONAL | Marks operation as `action: "receive"`                                                |
| `@server`        | FULLY_FUNCTIONAL | Emitted as server objects with host/protocol/description; URL validation              |
| `@message`       | FULLY_FUNCTIONAL | Stores title/description/contentType; merged into components.messages                 |
| `@protocol`      | FULLY_FUNCTIONAL | Stores protocol config; emitted as channel bindings with auto-versioning              |
| `@security`      | FULLY_FUNCTIONAL | Emitted as `components.securitySchemes`; multiple schemes per namespace               |
| `@tags`          | FULLY_FUNCTIONAL | Emitted as `Tag[]` arrays on operations and messages                                  |
| `@correlationId` | FULLY_FUNCTIONAL | Emitted as `correlationId` objects on all messages                                    |
| `@bindings`      | FULLY_FUNCTIONAL | Emitted as `bindings` on operations/messages; keys normalized, versions auto-injected |
| `@header`        | FULLY_FUNCTIONAL | Emitted as JSON Schema `headers` on messages                                          |

## Protocol Bindings

| Protocol          | Status           | Evidence                                                                                                                      |
| ----------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Kafka             | FULLY_FUNCTIONAL | Channel (topic, partitions, replicas), Operation (groupId, clientId), Message (key, schemaIdLocation). Binding version 0.5.0. |
| AMQP              | FULLY_FUNCTIONAL | Channel (exchange, queue), Operation (priority, deliveryMode), Message (contentEncoding). Binding version 0.3.0.              |
| MQTT              | FULLY_FUNCTIONAL | Server (clientId, cleanSession, lastWill), Operation (qos, retain), Message. Binding version 0.2.0.                           |
| WebSocket         | FULLY_FUNCTIONAL | Channel (method, query, headers). Binding version 0.1.0. `ws`/`wss` normalized to `ws` binding key.                           |
| HTTP              | FULLY_FUNCTIONAL | Operation (method, query), Message (headers). Binding version 0.3.0.                                                          |
| Auto-versioning   | FULLY_FUNCTIONAL | `bindingVersion` auto-injected when missing via `processBindings()` and document-builder                                      |
| Key normalization | FULLY_FUNCTIONAL | `websocket`→`ws`, `wss`→`ws` for binding keys. Server.protocol retains `wss`. `normalizeBindingProtocol()`                    |

## Binding Validation

| Feature                   | Status           | Evidence                                                                                                                                                                                    |
| ------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Binding key normalization | FULLY_FUNCTIONAL | `processBindings()` in `src/validation/binding-validator.ts`                                                                                                                                |
| Version validation        | FULLY_FUNCTIONAL | Warns on invalid binding versions via `invalid-binding-version` diagnostic                                                                                                                  |
| Unknown protocol warning  | FULLY_FUNCTIONAL | Warns on unrecognized binding keys via `unknown-binding-protocol` diagnostic                                                                                                                |
| Placement validation      | FULLY_FUNCTIONAL | Warns when a binding is placed on a target kind the spec doesn't define (e.g. `ws` on an Operation) via `misplaced-binding` diagnostic. `BINDING_PLACEMENT` matrix in `binding-versions.ts` |

## State Management

| Feature                          | Status           | Evidence                                                             |
| -------------------------------- | ---------------- | -------------------------------------------------------------------- |
| State persistence via `stateMap` | FULLY_FUNCTIONAL | `src/state-compatibility.ts` — `getStateMap()` handles StateMapView  |
| State consolidation              | FULLY_FUNCTIONAL | `src/state.ts` — `consolidateAsyncAPIState()` unifies all state maps |
| `protocolBindings` in state      | FULLY_FUNCTIONAL | Added to consolidated state; accessible by emitter                   |
| Multi-security accumulation      | FULLY_FUNCTIONAL | Multiple `@security` decorators accumulate via array state           |

## Configuration

| Feature                           | Status           | Evidence                                                      |
| --------------------------------- | ---------------- | ------------------------------------------------------------- |
| `output-file` option              | FULLY_FUNCTIONAL | Controls output filename                                      |
| `file-type` option (yaml/json)    | FULLY_FUNCTIONAL | Supports `"yaml"` and `"json"` with pretty/indent sub-options |
| `title` option                    | FULLY_FUNCTIONAL | Sets `info.title` on document                                 |
| `version` option                  | FULLY_FUNCTIONAL | Sets `info.version` on document                               |
| `description` option              | FULLY_FUNCTIONAL | Sets `info.description` on document                           |
| `output-dir` option               | FULLY_FUNCTIONAL | Sets emitter output directory                                 |
| `EmitterOptions` IDE autocomplete | FULLY_FUNCTIONAL | `lib/main.tsp` — `EmitterOptions` model for TypeSpec IDE      |

## Testing

| Feature                 | Status           | Evidence                                                                          |
| ----------------------- | ---------------- | --------------------------------------------------------------------------------- |
| vitest test runner      | FULLY_FUNCTIONAL | 551 tests across 48 files (0 skip, 0 todo)                                        |
| Golden file test        | FULLY_FUNCTIONAL | `test/golden/golden-file.test.ts`                                                 |
| Schema validation tests | FULLY_FUNCTIONAL | `test/validation/schema-validation.test.ts`                                       |
| Spec compliance suite   | FULLY_FUNCTIONAL | `test/compliance/` — 78 tests validated against official AsyncAPI 3.1 JSON Schema |
| Integration tests       | FULLY_FUNCTIONAL | `test/integration/` — decorator output, negative tests, binding placement         |
| E2E tests               | FULLY_FUNCTIONAL | `test/e2e/` — complex nested schemas                                              |
| BDD tests               | FULLY_FUNCTIONAL | `test/bdd/` — user behavior scenarios                                             |
| External spec tests     | FULLY_FUNCTIONAL | `test/external/` — 16 patterns from 5 external projects                           |
| Unit tests              | FULLY_FUNCTIONAL | `test/unit/` — binding placement, emitter tester verification                     |
| Negative tests          | FULLY_FUNCTIONAL | `test/integration/negative-tests.test.ts` — error handling                        |

## Build

| Feature                | Status           | Evidence                                               |
| ---------------------- | ---------------- | ------------------------------------------------------ |
| TypeScript compilation | FULLY_FUNCTIONAL | 0 errors, strict mode                                  |
| ESLint                 | FULLY_FUNCTIONAL | 0 errors, 0 warnings                                   |
| Oxlint                 | FULLY_FUNCTIONAL | 0 errors, 0 warnings (`oxlint . --deny-warnings`)      |
| GitHub Actions CI      | FULLY_FUNCTIONAL | `.github/workflows/ci.yml` — build + lint + test on PR |
