# TypeSpec AsyncAPI Emitter - Agent Context

**Project:** Transform TypeSpec models into AsyncAPI 3.1 specifications
**Architecture:** AssetEmitter-based with custom TypeEmitter for schema generation

---

## Quick Start

```bash
pnpm install         # Install dependencies
pnpm run build       # Build TypeScript → JavaScript (0 errors)
pnpm run lint        # Run ESLint (0 errors, 0 warnings)
pnpm run test        # Run tests via vitest (969 pass, 0 fail)
pnpm run verify      # Full gate: build + lint + test + coverage:gate + duplicate

```

**Important:** Use `pnpm` for package management and scripts. Tests run via **vitest** (Node.js/V8). Coverage runs via `bun test --coverage` (Bun's native coverage is the only tool that captures dynamically-loaded `dist/*.js` files — see Coverage section below). Run all commands inside `nix develop .#default` to get the right toolchain.

## Critical Constraints

- **Use `pnpm` for package management and scripts**. TypeScript scripts run via `tsx`. Never use `npm` or `npx`.
- **Build-before-test policy:** Tests won't run if TypeScript compilation fails
- **Tests run via vitest** (`pnpm run test` executes `vitest run`). vitest uses Node.js/V8 GC which is stable under heavy compilation workloads.
- **Coverage runs via `bun test --coverage`** (NOT vitest or c8). The TypeSpec compiler loads the emitter from `dist/` through a virtual filesystem, bypassing vitest's module transform. Only Bun's native runtime-level coverage captures these dynamically-loaded `dist/*.js` files — vitest V8, istanbul, and c8 all fail to see them. The gate script (`scripts/coverage-gate.ts`) remaps `dist/src/*.js` back to `src/*.ts` paths and merges coverage, preferring the higher-coverage entry. **Bun is kept in `flake.nix` solely for this purpose.** Average: ~97.0%, gate at 75% per-file minimum.
- **git commit --no-verify:** Pre-commit hook requires bash (NixOS doesn't have /bin/bash)
- **All source files under 370 lines** (enforced, excluding auto-generated `generated-bindings.ts`)
- **Coverage gate at 75%** per-file minimum (scripts/coverage-gate.ts). Coverage runs via `bun test --coverage` (NOT vitest) because Bun's native coverage captures dynamically-loaded `dist/*.js` files that vitest/istanbul/c8 can't instrument (the TypeSpec compiler loads the emitter from `dist/` via its virtual filesystem, bypassing vitest's module transform and V8's script tracking). The gate script remaps `dist/src/*.js` back to `src/*.ts` paths and merges coverage, preferring the higher-coverage entry. Average: ~97.0%.
- **Duplication budget:** jscpd threshold ratcheted to 0% (`.jscpd.json`). Current baseline: **0 clones / 0% / 0% tokens** (Phase-4 end; down from Phase-3 end 10 / 1.00% / 1.05%, Phase-2 end 38 / 4.06%, Phase-1 44 / 4.61%). Zero-clone baseline reached through: `DocumentBody` extraction in `asyncapi-document.ts` (consumed via `extends DocumentBody` in `AsyncAPIDocument`), `AsyncAPIEmitterOptions` re-export via `asyncapi-document.ts`, `DiagnosticContext` interface shared between `decorator-helpers.ts` and `minimal-decorators.ts`, `makeStringIdDecorator<T>` factory replacing duplicated `$operationId`/`$messageId` boilerplate, `messageDecorator<K>` factory in `src/builders/message-builder.ts`, `applySecurity` options-object signature, `checkBound` HOF in `validation/binding-field-validator.ts`. Remaining structural patterns (e.g. `(context, target, config): void` decorator signatures) are intrinsic to TypeSpec's decorator API. Run `pnpm run duplicate` to verify zero clones. See `docs/status/2026-08-05_20-46_PHASE-3-DEDUPLICATION-FINAL.md` for the Phase-3 history.
- **Diagnostic system:** `reportDiagnostic()` in `decorator-helpers.ts` uses `$lib.reportDiagnostic()` (TypeSpec library API), NOT raw `program.reportDiagnostic()`. All codes are declared in `src/lib.ts` and compile-time validated via `keyof typeof $lib.diagnostics`. The library name is auto-prefixed to diagnostic codes by the TypeSpec runtime. **24 codes** declared (19 error + 5 warning). All actively referenced — no dead codes. No split-brain.
- **Zero `any` types in emitter.ts** (achieved)
- **ESLint config:** Uses `strict` + `strictTypeChecked` configs from typescript-eslint. All type-safety rules at `error` (no `any`, no unsafe operations, no floating promises, no misused promises, require-await, no unnecessary conditions/assertions). Ignores block at top of flat config for clarity. `noUncheckedIndexedAccess` in tsconfig makes indexed-access types honest, enabling effective `no-unnecessary-condition` checking.
- **Linting strategy (dual linter):** ESLint handles type-aware rules on `src/` only (strict + strictTypeChecked configs: no-unnecessary-condition, no-confusing-void-expression, no-misused-promises, require-await, floating promises, unsafe operations, unnecessary type assertions, consistent-type-imports). oxlint handles non-type-aware rules on ALL files (style, perf, complexity metrics, suspicious patterns, eqeqeq enforcement). Complexity thresholds: max-lines 400, max-lines-per-function 200, max-statements 80, complexity 50, max-params 5. Configs are complementary with zero rule conflicts. `pnpm run lint` runs both sequentially. Use `pnpm run lint:eslint` or `pnpm run lint:ox` individually for faster iteration.

## Architecture

- **Entry Point:** `src/index.ts` → exports `$onEmit` for TypeSpec compiler
- **Emitter (9 core files, split from original 831-line monolith):**
  - `src/emitter.ts` (68 lines) — `$onEmit` entry point, writes output file, handles `split-schemas` option
  - `src/schema-emitter.ts` (320 lines) — `AsyncAPISchemaEmitter` class extends `TypeEmitter<JsonSchema, AsyncAPIEmitterOptions>`, overrides `modelDeclaration` (emits `allOf` for inheritance, `discriminator` for polymorphic models), `union` (emits `oneOf` for all-Model variants, `anyOf` for mixed), `enum`, `intrinsic`, `scalar`, etc.
  - `src/schema-ref.ts` (43 lines) — `refForNamedType()` resolves named TypeSpec types to `$ref` pointers. Pure function, no instance dependencies.
  - `src/schema-generator.ts` (47 lines) — `generateSchemas()` entry point, creates asset emitter and collects declarations
  - `src/extract-value.ts` (24 lines) — `extractValue()` narrows `EmitEntity<T>` discriminated union, filters `Placeholder<T>` lazy values
  - `src/stdlib-helpers.ts` (39 lines) — `isStdlibType()` and `collectAllStdlibNames()` utilities
  - `src/constraint-mapper.ts` (173 lines) — `applyConstraints()`, `applyMetadata()`, `resolveEncode()`: maps 16 TypeSpec stdlib constraint/metadata mappings to JSON Schema keywords via table-driven `CONSTRAINT_TABLE` (10 validation entries) + inline metadata. Validation keywords skipped on `$ref` schemas. `resolveEncode()` safely passes `@encode` data to `serializeValueAsJson` for correct example/default serialization.
  - `src/document-builder.ts` (116 lines) — `buildAsyncAPIDocument()` entry point; delegates to `src/builders/` for assembly. Handles `$ref` chain construction
  - `src/intrinsic-mapping.ts` (82 lines) — `intrinsicToSchema()` maps TypeSpec scalar names to JSON Schema types (~30 cases)
  - `src/schema-splitter.ts` (79 lines) — `splitSchemas()` extracts schemas into individual files, rewrites `$ref` pointers to external paths
- **Document Builders (`src/builders/`, 8 files):**
  - `src/builders/operation-discovery.ts` (153 lines) — discovers channel-decorated operations from TypeSpec namespace
  - `src/builders/message-builder.ts` (156 lines) — builds message objects with `$ref` registration
  - `src/builders/shared-utils.ts` (154 lines) — shared helpers: `ref()`, `escapeRefToken()`, `registerMessage()`, `resolveReplyKey()`
  - `src/builders/operation-builder.ts` (94 lines) — builds operation objects with action, channel ref, messages, and reply
  - `src/builders/channel-builder.ts` (81 lines) — builds channel objects with address, messages, bindings
  - `src/builders/server-builder.ts` (41 lines) — builds server objects with host, protocol, variables, and namespace-scoped bindings
  - `src/builders/security-builder.ts` (23 lines) — builds `components.securitySchemes` from `@security` state
  - `src/builders/types.ts` (46 lines) — shared builder context and result types
- **Decorators:** `lib/main.tsp` declares all **25 decorators** + `EmitterOptions` model for IDE autocomplete. Decorator count: 16 core + 9 reusable-component (5 definition on Namespace + 4 reference on Operation/Model).
- **Decorator Implementations:** `src/decorators.ts` (72 lines, unified registry), `src/minimal-decorators.ts` (288 lines) and `src/namespace-decorators.ts` (201 lines) — thin wrappers with runtime validation, helpers in `src/decorator-helpers.ts`, state writing delegated to `src/state-writers.ts`. The namespace-decorators file contains `$server`, `$defaultContentType`, and 5 reusable-component definition decorators (`$operationTrait`, `$messageTrait`, `$parameter`, `$reusableCorrelationId`, `$reusableBinding`) via `namedConfigDecorator` factory. `src/use-decorators.ts` (61 lines) contains 4 reference decorators (`$useOperationTrait`, `$useMessageTrait`, `$useCorrelationId`, `$useBinding`) via `makeUseDecorator` factory. `$bindings` targets `Operation | Model | Namespace` (Namespace → server bindings via `bindingTargetKind`). `$operationId`, `$messageId`, and `$apiVersion` also implemented in `minimal-decorators.ts`.
- **Reusable Components:** 9 decorators populate `components.operationTraits`, `components.messageTraits`, `components.parameters`, `components.correlationIds`, `components.operationBindings`, and `components.messageBindings`. Definition decorators (`@operationTrait`, `@messageTrait`, `@parameter`, `@reusableCorrelationId`, `@reusableBinding`) target Namespace. Reference decorators (`@useOperationTrait`, `@useMessageTrait`, `@useCorrelationId`, `@useBinding`) target Operation/Model. Channel address parameters (`{paramName}`) auto-upgrade to `$ref` when a matching `@parameter` exists. Inline `@correlationId` still works without populating `components.correlationIds`.
- **State Management:** `src/state.ts` (consolidation), `src/state-compatibility.ts` (TypeSpec stateMap access)
- **Configuration:** `src/infrastructure/configuration/` — simplified to just types, no runtime validation
- **Protocols:** `src/constants/protocols.ts` — single source of truth for all AsyncAPI protocols (const array → derived type → runtime Set + type guard). **22 protocols** (HTTP, HTTPS, WS, WSS, MQTT, MQTT5, Kafka, AMQP, AMQP1, NATS, JMS, SNS, SQS, STOMP, Redis, GooglePubSub, Mercure, IBMMQ, Pulsar, Solace, AnypointMQ, ROS2). Accepts aliases (`websocket` → `ws`) via `normalizeProtocol()`. Canonical names only in `PROTOCOL_LIST`; `isSupportedProtocol()` narrows to `AcceptedProtocol` (canonical | alias).
- **Binding Versions:** `src/constants/binding-versions.ts` — single source of truth for binding versions per protocol. **19 binding protocols** with versions auto-generated from `@asyncapi/specs/bindings/` via `scripts/generate-binding-specs.ts`. `normalizeBindingProtocol()` maps `wss` → `ws` for binding keys (AsyncAPI schema uses `ws` for both). Auto-injects `bindingVersion` when missing. `BINDING_PLACEMENT` matrix is auto-generated from specs (`GENERATED_PLACEMENT`); `supportsBindingPlacement()` and `getValidPlacements()` consume it.
- **Binding Validation:** `src/validation/binding-validator.ts` (158 lines) and `src/validation/binding-field-validator.ts` (116 lines) — `processBindings()` accepts an optional `targetKind` parameter (mapped from TypeSpec target: `Operation` → `"operation"`, `Model` → `"message"`). Normalizes binding keys (websockets→ws), validates versions, auto-injects missing `bindingVersion`, and warns on misplaced bindings. Field-level validation via `validateBindingFields()` checks individual field values against spec-derived constraints (auto-generated field rules in `generated-bindings.ts`). Three diagnostics: `unknown-binding-protocol` (warning), `invalid-binding-version` (warning), `misplaced-binding` (warning). `BindingDiagnosticCode` union type replaces the previous `string` code field.
- **Security Scheme Types:** `src/domain/models/asyncapi-document.ts` — `SECURITY_SCHEME_TYPES` const array → `SecuritySchemeType` union → `isValidSchemeType` runtime guard. Matches AsyncAPI 3.1 spec exactly (no invalid types like `sasl`/`mutualTLS`/`external`/`oauthBearer`). Multi-security on one namespace supported (array accumulation). `SecurityScheme.in` only allows `"query" | "header" | "cookie"` (AsyncAPI 3.1 API key locations).
- **Document Model:** `src/domain/models/asyncapi-document.ts` — strongly-typed AsyncAPI 3.1 interfaces with `OAuth2Flows`, `ProtocolBindings`, `SecuritySchemeType` types. No index signatures except `JsonSchema` (standard JSON Schema extension pattern)
- **Cross-emitter Shared Module:** `src/shared/` — exports `JsonSchema`, `SchemaRef`, `SchemaMap` types and `generateSchemas`, `extractValue`, `intrinsicToSchema`, `AsyncAPISchemaEmitter` for reuse by other TypeSpec emitters (OpenAPI, JSON Schema). Accessible via `@lars-artmann/typespec-asyncapi/shared` subpath export.
- **Multi-file Output:** `split-schemas` emitter option splits schemas into individual files under `schemas/` directory. All `$ref` values rewritten from `#/components/schemas/Name` to `schemas/Name.{ext}`. Both main document and schema files have refs rewritten.
- **tsconfig:** `"types": ["node"]` added to make `structuredClone` available (used in `schema-splitter.ts`). Without this, `structuredClone` is unavailable because it's not in the ES2022 type library. `"noUncheckedIndexedAccess": true` enabled so all `array[i]` and `record[key]` accesses return `T | undefined` — makes types honest about possible missing keys/indices and enables the ESLint `no-unnecessary-condition` rule to correctly distinguish necessary from unnecessary defensive checks.

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

Model inheritance uses `allOf` with `$ref` to the base model:

```
components.schemas.Dog.allOf[0] → #/components/schemas/Animal
```

## TypeSpec Test Framework

Tests use **vitest** with the TypeSpec compiler testing API (`createTester`). All compilation is programmatic via `test/utils/test-helpers.ts` — no process spawning. Test files use vitest globals (no explicit import needed; `globals: true` in vitest config). `compileAsyncAPI()` now returns `allOutputFiles: Map<string, string>` for multi-file output testing. Test helpers auto-detect `@typespec/versioning` imports and add the library to the virtual filesystem.

### `@typespec/versioning` Integration

`src/document-builder.ts` imports `getVersion()` from `@typespec/versioning`. When a namespace is `@versioned`, the latest version enum value is used for `info.version` as a fallback (precedence: emitter `version` option > `@apiVersion` decorator > `@versioned` enum > `"1.0.0"`).

### Test Helpers (3 files, consolidated from 7)

- `test/utils/test-helpers.ts` — `compileAsyncAPI`, `compileAsyncAPISpecRaw`, `compileAsyncAPISpecWithoutErrors`
- `test/utils/cli-test-helpers.ts` — CLI-compatible wrapper
- `test/utils/type-guards.ts` — Type assertion utilities

### Key Tests

- `test/golden/golden-file.test.ts` — Locks verified-correct output (3 tests)
- `test/validation/schema-validation.test.ts` — Validates against AsyncAPI 3.1 JSON Schema via AJV
- `test/integration/decorator-output.test.ts` — Verifies @tags, @correlationId, @header, @bindings in output
- `test/integration/negative-tests.test.ts` — Error handling edge cases
- `test/compliance/` — **AsyncAPI 3.1.0 spec compliance suite** (~208 tests across 18 files): document structure, schema types, $ref chain, servers/security, protocol bindings (all 22 protocols), operation reply, multi-message operations, defaultContentType, @doc propagation, constraint decorators (38 tests), info object fields (6 tests), polymorphism/allOf/oneOf/discriminator (13 tests), reusable components (14 tests: operationTraits, messageTraits, parameters, correlationIds, operationBindings, messageBindings), edge cases. All validated against official AsyncAPI 3.1.0 JSON Schema via `compileAndValidateOrThrow()`.
- `test/utils/schema-validator.ts` — Reusable AJV harness: `compileAndValidate()`, `compileAndValidateOrThrow()`, `formatValidationErrors()`
- `test/integration/multi-file-output.test.ts` — Schema splitting tests (9 tests): multi-file output, $ref rewriting, nested refs in schema files
- `test/unit/shared-schema-types.test.ts` — Cross-emitter shared API tests (25 tests): JsonSchema, SchemaRef, SchemaMap types, extractValue, intrinsicToSchema, plus barrel public-API contract checks
- `test/benchmark/` — Performance benchmark suite: `fixture-generator.ts` generates 10-200 channel specs programmatically; `performance.test.ts` (5 tests) measures compilation time and reports scaling metrics

## Decorator Signatures

Decorators accept BOTH `{}` (Model expression types) AND `#{}` (value literals):

```typescript
extern dec security(target: Operation | Namespace, config: {} | valueof Record<unknown>);
extern dec message(target: Model, config: {} | valueof Record<unknown>);
extern dec protocol(target: Operation | Model, config: {} | valueof Record<unknown>);
extern dec bindings(target: Operation | Model | Namespace, value: {} | valueof Record<unknown>);
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
- **`#deprecated` is a compiler directive, NOT a decorator:** Use `#deprecated "message"` (hash prefix) before a declaration, NOT `@deprecated("message")`. There is no `@deprecated` decorator in TypeSpec stdlib. The compiler sets deprecation state internally; `isDeprecated(program, type)` checks it. The emitter calls `applyDeprecated()` in `constraint-mapper.ts` for both properties and model/enum declarations.
- **Constraint decorators target specific types:** `@pattern` only works on `string | ModelProperty` of string type. `@minValue`/`@maxValue` work on numeric scalars. `@minItems`/`@maxItems` work on arrays. TypeSpec compiler validates target types at compile time and errors on mismatch.
- **`$ref` constraint siblings:** Validation keywords (`minimum`, `pattern`, etc.) are only applied to inline schemas in `applyConstraints()` — when the schema is a `$ref`, these are skipped (Draft-07 ignores `$ref` siblings). Metadata (`deprecated`, `description`, `title`, `examples`, `readOnly`, `writeOnly`) IS applied as `$ref` siblings, which AJV accepts for AsyncAPI 3.1 validation.
- **`@summary`/`@example`/`@visibility` are stdlib decorators:** These are NOT declared in `lib/main.tsp` — they come from `@typespec/compiler`. `@summary` → `title` via `getSummary()`, `@example` → `examples` via `getExamples()` + `serializeValueAsJson()`, `@visibility` → `readOnly`/`writeOnly` via `getVisibilityForClass()` with Lifecycle enum. All applied as metadata in `constraint-mapper.ts`.
- **Default values use core `=` syntax, NOT `@default`:** TypeSpec has no `@default` decorator. Default values are set via `prop: Type = value` syntax (e.g. `name: string = "anonymous"`). The compiler stores the value on `prop.defaultValue` (a `Value` type). The emitter calls `applyDefault()` in `constraint-mapper.ts` which uses `serializeValueAsJson()` to convert to JSON Schema `default`. Applied as an annotation keyword (before the `$ref` skip), so it appears as a `$ref` sibling.
- **`@visibility` mapping is lossy (5 Lifecycle values → 2 JSON Schema booleans):** TypeSpec has 5 visibility values (Create, Read, Update, Delete, Query); JSON Schema has only `readOnly` and `writeOnly`. The emitter maps Read-only → `readOnly`, Create/Update-only → `writeOnly`. Both or neither → no keyword (fully visible). **Delete and Query are silently ignored** — JSON Schema has no equivalent for "visible only during delete" or "visible only during query". AsyncAPI 3.1 does not prescribe specific semantics for `readOnly`/`writeOnly` in message payloads.
- **Protocol count is 22 in `protocols.ts`:** The binding specs (`generated-bindings.ts`) have 19 binding protocols (no separate entries for https/wss/mqtt5). The protocol validation list (`protocols.ts`) has 22 entries (includes https, wss, mqtt5 as separate from http, ws, mqtt). This was a split-brain bug: solace/anypointmq/ros2 were in bindings but missing from protocols.
- **Model inheritance uses `allOf`:** `model Derived extends Base` emits `allOf: [{ $ref: "#/components/schemas/Base" }]` instead of flattening base properties. Each model only has its own `properties` and `required`. Multi-level chains produce linked refs (C → B → A). This is a breaking change from the previous flattening behavior.
- **`@discriminator` targets Model only:** The TypeSpec stdlib decorator `@discriminator("propertyName")` can only be applied to models, NOT unions. The compiler rejects it on unions with `decorator-wrong-target`. `getDiscriminator(program, type)` returns `{ propertyName: string }` or `undefined`. The emitter calls it in `modelDeclaration()` and `union()` (for future-proofing, but it always returns `undefined` for unions in this TypeSpec version).
- **`oneOf` vs `anyOf` for unions:** Unions where ALL variants are Model types emit `oneOf` (exclusive composition, matching TypeSpec's exclusive union semantics). Mixed-type unions (`string | int32`) still emit `anyOf`. String-literal unions still emit `enum`. The check is `(v.type as { kind: string }).kind === "Model"` for each variant.
- **Union variant `$ref` fix:** Named model variants in unions previously emitted empty `{ properties: {}, type: "object" }` objects. Fixed by calling `refForNamedType(v.type)` before `emitTypeReference` in `union()` and `typeToSchema()`. Now emits proper `{ $ref: "#/components/schemas/ModelName" }`.
- **Table-driven constraint mapping:** `applyConstraints()` in `constraint-mapper.ts` uses a `CONSTRAINT_TABLE` array of `{ getter, keyword }` entries (10 validation constraints) iterated in a single loop. Adding a new validation constraint requires one table entry, not a 4-line if-block. Metadata (doc, deprecated, summary, examples, default, visibility) is applied inline before the `$ref` skip.
- **`@encode` serialization:** `resolveEncode()` in `constraint-mapper.ts` safely wraps `getEncode()` to handle all target types. `getEncode()` only accepts `ModelProperty | Scalar`; `resolveEncode` returns `undefined` for `Model | Enum | Union`. The `encodeAs` parameter is passed to `serializeValueAsJson()` for both examples (in `applyMetadata`) and defaults (in `applyConstraints`).
- **Operation/channel `@summary`:** `@summary` on operations populates the operation's `summary` field (via `getSummary()` in `operation-builder.ts`). `@summary` on channel-decorated operations also populates the channel's `summary` field (via `channelSummaries` map in `DocumentBuildContext`, populated in `operation-discovery.ts`, applied in `channel-builder.ts`). `@doc` → `description` remains separate.
- **Message `title` from `@message`:** The `@message(#{title: "..."})` decorator's `title` value populates BOTH the message's `name` AND `title` fields. The `title` field (from `CommonMetadata`) was previously never set. The `MessageConfigData.title` always has a value (defaults to `target.name` in `extractMessageConfig`).
