# TypeSpec AsyncAPI Emitter - Agent Context

**Project:** Transform TypeSpec models into AsyncAPI 3.1 specifications
**Architecture:** AssetEmitter-based with custom TypeEmitter for schema generation

---

## Quick Start

```bash
bun install           # Install dependencies
bun run build         # Build TypeScript → JavaScript (0 errors)
bun run lint          # Run ESLint (0 errors, 0 warnings)
bun run test          # Run tests via vitest (555 pass, 0 fail)
```

**Important:** Use `bun` and `bunx` for install/build, never `npm` or `npx`. Tests run via **vitest** (Node.js/V8) — not `bun test` — because Bun has documented memory leaks that cause OOM crashes with heavy test suites.

## Critical Constraints

- **Use `bun`/`bunx` for install/build**, never `npm` or `npx`
- **Build-before-test policy:** Tests won't run if TypeScript compilation fails
- **Tests run via vitest** (not `bun test`): `bun run test` executes `vitest run`. Bun's test runner has documented OOM crashes — vitest uses Node.js/V8 GC which is stable under heavy compilation workloads.
- **git commit --no-verify:** Pre-commit hook requires bash (NixOS doesn't have /bin/bash)
- **All source files under 370 lines** (enforced, excluding auto-generated `generated-bindings.ts`)
- **Coverage gate at 75%** per-file minimum (scripts/coverage-gate.ts). Coverage runs via `bun test --coverage` (NOT vitest) because Bun's native coverage captures dynamically-loaded `dist/*.js` files that vitest/istanbul can't instrument (the TypeSpec compiler loads the emitter from `dist/`, bypassing vitest's module transform). The gate script remaps `dist/src/*.js` back to `src/*.ts` paths and merges coverage, preferring the higher-coverage entry. Average: ~96%.
- **Diagnostic system:** `reportDiagnostic()` in `decorator-helpers.ts` uses `$lib.reportDiagnostic()` (TypeSpec library API), NOT raw `program.reportDiagnostic()`. All codes are declared in `src/lib.ts` and compile-time validated via `keyof typeof $lib.diagnostics`. The library name is auto-prefixed to diagnostic codes by the TypeSpec runtime. **18 codes** declared (15 error + 3 warning). No split-brain.
- **Zero `any` types in emitter.ts** (achieved)
- **ESLint config:** Clean, no Effect.TS-era rules (throw/try/catch/Promise allowed)
- **Linting strategy (dual linter):** ESLint handles type-aware rules on `src/` only (floating promises, unsafe operations, unnecessary type assertions, consistent-type-imports). oxlint handles non-type-aware rules on ALL files (style, perf, complexity metrics, suspicious patterns). Configs are complementary with zero rule conflicts. `bun run lint` runs both sequentially. Use `bun run lint:eslint` or `bun run lint:ox` individually for faster iteration.

## Architecture

- **Entry Point:** `src/index.ts` → exports `$onEmit` for TypeSpec compiler
- **Emitter (7 files, split from original 831-line monolith):**
  - `src/emitter.ts` (91 lines) — `$onEmit` entry point, writes output file, handles `split-schemas` option
  - `src/schema-emitter.ts` (349 lines) — `AsyncAPISchemaEmitter` class extends `TypeEmitter<JsonSchema, AsyncAPIEmitterOptions>`, overrides `modelDeclaration`, `union`, `enum`, `intrinsic`, `scalar`, etc.
  - `src/schema-generator.ts` (46 lines) — `generateSchemas()` entry point, creates asset emitter and collects declarations
  - `src/extract-value.ts` (26 lines) — `extractValue()` narrows `EmitEntity<T>` discriminated union, filters `Placeholder<T>` lazy values
  - `src/stdlib-helpers.ts` (39 lines) — `isStdlibType()` and `collectAllStdlibNames()` utilities
  - `src/document-builder.ts` (122 lines) — `buildAsyncAPIDocument()` assembles channels, operations, messages, schemas, security from TypeSpec state. Handles `$ref` chain construction
  - `src/intrinsic-mapping.ts` (82 lines) — `intrinsicToSchema()` maps TypeSpec scalar names to JSON Schema types (~30 cases)
  - `src/schema-splitter.ts` (83 lines) — `splitSchemas()` extracts schemas into individual files, rewrites `$ref` pointers to external paths
- **Decorators:** `lib/main.tsp` declares all decorators + `EmitterOptions` model for IDE autocomplete
- **Decorator Implementations:** `src/minimal-decorators.ts` (351 lines) and `src/namespace-decorators.ts` (73 lines) — thin wrappers with runtime validation, helpers in `src/decorator-helpers.ts`, state writing delegated to `src/state-writers.ts`. The namespace-decorators file contains `$server` and `$defaultContentType` (both target `Namespace`).
- **State Management:** `src/state.ts` (consolidation), `src/state-compatibility.ts` (TypeSpec stateMap access)
- **Configuration:** `src/infrastructure/configuration/` — simplified to just types, no runtime validation
- **Protocols:** `src/constants/protocols.ts` — single source of truth for all AsyncAPI protocols (const array → derived type → runtime Set + type guard). Accepts aliases (`websocket` → `ws`) via `normalizeProtocol()`. Canonical names only in `PROTOCOL_LIST`; `isSupportedProtocol()` narrows to `AcceptedProtocol` (canonical | alias).
- **Binding Versions:** `src/constants/binding-versions.ts` — single source of truth for binding versions per protocol (Kafka 0.5.0, AMQP 0.3.0, MQTT 0.2.0, HTTP 0.3.0, WS 0.1.0). `normalizeBindingProtocol()` maps `wss` → `ws` for binding keys (AsyncAPI schema uses `ws` for both). Auto-injects `bindingVersion` when missing. `BINDING_PLACEMENT` matrix maps each protocol to which target kinds (channel/operation/message/server) have binding definitions. `supportsBindingPlacement()` and `getValidPlacements()` consume the matrix.
- **Binding Validation:** `src/validation/binding-validator.ts` — `processBindings()` accepts an optional `targetKind` parameter (mapped from TypeSpec target: `Operation` → `"operation"`, `Model` → `"message"`). Normalizes binding keys (websockets→ws), validates versions, auto-injects missing `bindingVersion`, and warns on misplaced bindings. Three diagnostics: `unknown-binding-protocol` (warning), `invalid-binding-version` (warning), `misplaced-binding` (warning). `BindingDiagnosticCode` union type replaces the previous `string` code field.
- **Security Scheme Types:** `src/domain/models/asyncapi-document.ts` — `SECURITY_SCHEME_TYPES` const array → `SecuritySchemeType` union → `isValidSchemeType` runtime guard. Matches AsyncAPI 3.1 spec exactly (no invalid types like `sasl`/`mutualTLS`/`external`/`oauthBearer`). Multi-security on one namespace supported (array accumulation). `SecurityScheme.in` only allows `"query" | "header" | "cookie"` (AsyncAPI 3.1 API key locations).
- **Document Model:** `src/domain/models/asyncapi-document.ts` — strongly-typed AsyncAPI 3.1 interfaces with `OAuth2Flows`, `ProtocolBindings`, `SecuritySchemeType` types. No index signatures except `JsonSchema` (standard JSON Schema extension pattern)
- **Cross-emitter Shared Module:** `src/shared/` — exports `JsonSchema`, `SchemaRef`, `SchemaMap` types and `generateSchemas`, `extractValue`, `intrinsicToSchema`, `AsyncAPISchemaEmitter` for reuse by other TypeSpec emitters (OpenAPI, JSON Schema). Accessible via `@lars-artmann/typespec-asyncapi/shared` subpath export.
- **Multi-file Output:** `split-schemas` emitter option splits schemas into individual files under `schemas/` directory. All `$ref` values rewritten from `#/components/schemas/Name` to `schemas/Name.{ext}`. Both main document and schema files have refs rewritten.
- **tsconfig:** `"types": ["node"]` added to make `structuredClone` available (used in `schema-splitter.ts`). Without this, `structuredClone` is unavailable because it's not in the ES2022 type library.

## AsyncAPI 3.1 `$ref` Chain

The document MUST follow this reference chain:

```
operations → #/channels/{id}/messages/{id}
channels → #/components/messages/{id}
components.messages → #/components/schemas/{name}
```

Nested model properties also use `$ref` for named user-defined models:

```
components.schemas.User.properties.address → #/components/schemas/Address
```

## TypeSpec Test Framework

Tests use **vitest** with the TypeSpec compiler testing API (`createTester`). All compilation is programmatic via `test/utils/test-helpers.ts` — no process spawning. Test files use vitest globals (no explicit import needed; `globals: true` in vitest config). `compileAsyncAPI()` now returns `allOutputFiles: Map<string, string>` for multi-file output testing.

### Test Helpers (3 files, consolidated from 7)

- `test/utils/test-helpers.ts` — `compileAsyncAPI`, `compileAsyncAPISpecRaw`, `compileAsyncAPISpecWithoutErrors`
- `test/utils/cli-test-helpers.ts` — CLI-compatible wrapper
- `test/utils/type-guards.ts` — Type assertion utilities

### Key Tests

- `test/golden/golden-file.test.ts` — Locks verified-correct output (3 tests)
- `test/validation/schema-validation.test.ts` — Validates against AsyncAPI 3.1 JSON Schema via AJV
- `test/integration/decorator-output.test.ts` — Verifies @tags, @correlationId, @header, @bindings in output
- `test/integration/negative-tests.test.ts` — Error handling edge cases
- `test/compliance/` — **AsyncAPI 3.1.0 spec compliance suite** (78 tests across 6 files): document structure, schema types, $ref chain, servers/security, protocol bindings (Kafka/AMQP/MQTT/WS/HTTP), edge cases. All validated against official AsyncAPI 3.1.0 JSON Schema via `compileAndValidateOrThrow()`.
- `test/utils/schema-validator.ts` — Reusable AJV harness: `compileAndValidate()`, `compileAndValidateOrThrow()`, `formatValidationErrors()`
- `test/integration/multi-file-output.test.ts` — Schema splitting tests (9 tests): multi-file output, $ref rewriting, nested refs in schema files
- `test/unit/shared-schema-types.test.ts` — Cross-emitter shared API tests (19 tests): JsonSchema type, SchemaMap, extractValue, intrinsicToSchema
- `test/benchmark/` — Performance benchmark suite: `fixture-generator.ts` generates 10-200 channel specs programmatically; `performance.test.ts` (5 tests) measures compilation time and reports scaling metrics

## Decorator Signatures

Decorators accept BOTH `{}` (Model expression types) AND `#{}` (value literals):

```typescript
extern dec security(target: Operation | Namespace, config: {} | valueof Record<unknown>);
extern dec message(target: Model, config: {} | valueof Record<unknown>);
extern dec protocol(target: Operation | Model, config: {} | valueof Record<unknown>);
extern dec bindings(target: Operation | Model, value: {} | valueof Record<unknown>);
```

## `EmitEntity<T>` Discriminated Union Pattern

The `@typespec/asset-emitter` API returns `EmitEntity<T>` objects that must be narrowed before extracting values. The `extractValue()` function in `src/extract-value.ts` handles this:

```typescript
export function extractValue(entity: EmitEntity<JsonSchema> | undefined): JsonSchema {
  if (!entity) return {};
  switch (entity.kind) {
    case "declaration":
    case "code": {
      const v = entity.value;
      // Must filter out Placeholder<T> — detected via duck-typing onValue
      if (!v || typeof v !== "object") return {};
      if (typeof (v as { onValue?: unknown }).onValue === "function") return {};
      return v as JsonSchema;
    }
    default:
      return {};
  }
}
```

Key points:

- `entity.kind` narrows the discriminated union: `"declaration"`, `"code"`, `"none"`, `"circular"`
- Only `"declaration"` and `"code"` have a `.value` property
- `Placeholder<T>` objects (lazy values) are detected by checking for an `onValue` function — they must NOT be treated as final values
- `"none"` and `"circular"` kinds return empty objects

## Gotchas

- Use `#{ url: "...", protocol: "..." }` syntax for `@server` (comma-separated, not semicolons)
- `SERIALIZATION_FORMAT_OPTION_JSON` is an object `{format, pretty, indent}`, not a string
- `emitFile` needs `emitterOutputDir` prefix or crashes in CLI mode
- `Placeholder<T>` values are detected by checking for `onValue` method (see `EmitEntity<T>` pattern above)
- **Two compilation APIs unified:** `compileAsyncAPI` now uses `tester.compileAndDiagnose()` (same as `compileRaw`). All compilation APIs consistently surface decorator-reported diagnostics. No more split-brain.
- **Channel addresses with `/` are JSON-pointer-escaped:** `$ref` tokens use `~1` for `/` and `~0` for `~` per RFC 6901. Object keys stay raw.
- `file-type` option can be string `"json"` or object `{ format: "json", pretty: true, indent: 2 }`
- **Arrays of named models:** `Item[]` must emit `items: { $ref: "#/components/schemas/Item" }`, not `items: { type: "string" }`. Fixed via `refForNamedType()` helper in `schema-emitter.ts`. The root cause was `emitTypeReference` returning `NoEmit` for declaration refs, and `extractValue` returning `{}`, causing fallback to `intrinsicToSchema(modelName)` → `{type:"string"}`.
- **`Record<string>` maps to `{ type: "object", additionalProperties: { type: "string" } }`**, NOT `type: "array"`. The indexed-model case in `typeToSchema()` was incorrectly producing arrays.
- **AsyncAPI 3.1 binding key names:** The binding object key MUST match the official schema — `ws` (not `websocket`/`websockets`), `kafka`, `http`, `amqp`, etc. The emitter uses the `protocol:` value from `@protocol` as the binding key.
- **Kafka binding placement:** Channel bindings allow `topic`, `partitions`, `replicas`, `topicConfiguration`, `bindingVersion`. Operation bindings allow only `groupId`, `clientId`, `bindingVersion`. Message bindings allow `key`, `schemaIdLocation`, `schemaIdPayloadEncoding`, `schemaLookupStrategy`, `bindingVersion`. All require `bindingVersion` for schema validation.
- **OAuth2 scopes:** AsyncAPI 3.1 uses `availableScopes` (not `scopes`) in OAuth2 flow objects. Must be a map `{scopeName: "description"}`, not an array. The emitter accepts both `scopes` and `availableScopes` as input keys and always outputs `availableScopes` via `normalizeOAuth2Scopes()` in `document-builder.ts`.
- **TypeSpec value literals (`#{}`):** Property names must be valid identifiers — `const` is reserved (can't use as key), and quoted keys like `"retention.ms"` are not supported.
- **Protocol alias normalization:** `websocket` is accepted as INPUT but normalized to `ws` (the canonical AsyncAPI 3.1 binding key) via `normalizeProtocol()` in `constants/protocols.ts`. Never emit `websocket` as a binding key — the AsyncAPI schema only accepts `ws`/`wss`. The `@protocol` decorator validates protocols with `isSupportedProtocol()` before storing.
- **ProtocolConfigData is a discriminated union:** `state.ts` defines `ProtocolConfigData` as a discriminated union on `protocol` — `KafkaConfigData | WebSocketConfigData | MqttConfigData | GenericProtocolConfigData`. Protocol-specific fields (e.g. `qos`, `partitions`) can only exist on their owning variant, making impossible states unrepresentable.
- **Security scheme types match AsyncAPI 3.1 spec exactly:** Valid types are `apiKey`, `asymmetricEncryption`, `gssapi`, `http`, `httpApiKey`, `oauth2`, `openIdConnect`, `plain`, `scramSha256`, `scramSha512`, `symmetricEncryption`, `userPassword`, `X509`. NOT valid: `sasl` (use the specific mechanism as type: `plain`, `scramSha256`, etc.), `mutualTLS`, `external`, `oauthBearer`. HTTP API keys use `type: "httpApiKey"` with `in: "header"|"query"|"cookie"`, NOT `type: "apiKey"`.
- **WS binding version:** AsyncAPI 3.1 ws channel bindings require `bindingVersion: "0.1.0"`, NOT `"0.5.0"` (which is Kafka's version). Each protocol has its own binding version constant in the schema. Auto-injected by `processBindings()` when missing.
- **WSS binding key normalization:** The AsyncAPI binding schema uses `ws` for BOTH WebSocket and secure WebSocket. `normalizeBindingProtocol()` in `binding-versions.ts` maps `wss` → `ws` for binding keys. Server.protocol retains the distinction (`ws` vs `wss`).
- **Binding auto-versioning:** Both `@bindings` decorator (via `processBindings()`) and `@protocol` in document-builder auto-inject `bindingVersion` to the latest version when the user omits it. This ensures all output validates against the AsyncAPI 3.1 JSON Schema.
- **`@asyncapi/parser` Bun incompatibility:** The `@asyncapi/parser` package (v3.6.0) fails under Bun due to AJV `new Function()` codegen issues in its Spectral ruleset. Use manual `$ref` resolution tests instead (see `test/validation/semantic-ref-resolution.test.ts`).
- **Record of named models:** `Record<Item>` must emit `{ type: "object", additionalProperties: { $ref: "#/components/schemas/Item" } }`. The `typeToSchema()` indexed-model branch calls `refForNamedType()` on the indexer value before falling back to inline schema.
- **`@service` decorator (core TypeSpec):** `@service` is a built-in TypeSpec decorator (in the `TypeSpec` namespace, not `TypeSpec.AsyncAPI`). It requires value-literal syntax: `@service(#{title: "My API"})`, NOT model-expression syntax `@service({title: "My API"})` (which produces a compiler `expect-value` error). The emitter reads the `@service` title via `listServices(program)` and uses it for `info.title` as a fallback (emitter options take precedence). OpenAPI migrants should use `#{}` not `{}`.
