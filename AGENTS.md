# TypeSpec AsyncAPI Emitter - Agent Context

**Project:** Transform TypeSpec models into AsyncAPI 3.1 specifications
**Architecture:** AssetEmitter-based with custom TypeEmitter for schema generation

---

## Quick Start

```bash
pnpm install         # Install dependencies
pnpm run build       # Build TypeScript → JavaScript (0 errors)
pnpm run lint        # ESLint + oxlint (0 errors, 0 warnings)
pnpm run test        # Run tests via vitest
pnpm run verify      # Full gate: build + lint + typecheck:test + test + coverage:gate + duplicate
```

**Important:** Use `pnpm` for everything — never `npm`/`npx` or raw `bun` (details in Critical Constraints). Run commands inside `nix develop .#default`.

## Critical Constraints

- **Toolchain:** `pnpm` for package management and scripts. Tests via **vitest** (Node.js/V8, stable GC under heavy compilation). `.ts` scripts via `bun run` (NOT `tsx` — needs real Node.js, unavailable on NixOS where `node` is a Bun wrapper).
- **Build-before-test policy:** Tests won't run if TypeScript compilation fails. The compiler loads the emitter from `dist/` via a virtual filesystem — always build before testing emitter changes.
- **Test suite typechecked via `tsconfig.test.json`** (`pnpm run typecheck:test`, a `verify` stage): relaxed (`strict:false`, `noUncheckedIndexedAccess:false`, `types:["node","vitest/globals"]`). Keep it at 0 errors. vtsls/LSP diagnostics in `test/` are stale/unreliable — trust `tsc -p tsconfig.test.json` and vitest output instead. `test/tsconfig.json` scopes workspace-editor tsserver to the test config (the root tsconfig excludes `test/`, which caused inferred-project noise).
- **Coverage runs via `bun test --coverage`** (NOT vitest or c8). The TypeSpec compiler loads the emitter from `dist/` through a virtual filesystem, bypassing vitest's module transform. Only Bun's native runtime-level coverage captures these dynamically-loaded `dist/*.js` files — vitest V8, istanbul, and c8 all fail to see them. The gate script (`scripts/coverage-gate.ts`) remaps `dist/src/*.js` back to `src/*.ts` paths and merges coverage, preferring the higher-coverage entry. **Bun is kept in `flake.nix` solely for this purpose** and banned everywhere else. Gate: 75% per-file minimum.
- **git commit --no-verify:** The pre-commit hook (`.husky/pre-commit`, `#!/bin/sh`) runs the FULL verify gate (~2 min). The established convention: commit with `--no-verify` and run `pnpm run verify` manually before committing. Always run the full gate — "tests" ≠ "gate" (lint/duplication/coverage catch what vitest can't).
- **Lint/duplication tools are pinned devDependencies** (`oxlint`, `jscpd` in package.json), resolving from `node_modules/.bin` — NOT from system/Nix packages. Unpinned binaries broke GitHub CI (`command not found` on ubuntu-latest) and local gates on host drift.
- **All source files under 400 lines** (oxlint `max-lines`, excluding auto-generated `generated-bindings.ts`). When a file approaches the limit, extract (precedents: `store-protocol-config.ts`, `extension-decorators.ts`).
- **Duplication budget:** jscpd threshold 0% (`.jscpd.json`); baseline 0 clones / 0% tokens. Remaining structural patterns (e.g. `(context, target, config): void` decorator signatures) are intrinsic to TypeSpec's decorator API. Run `pnpm run duplicate` to verify. When duplication appears, extract shared interfaces/factories (precedents: `DocumentBody`, `DiagnosticContext`, `makeStringIdDecorator<T>`, `messageDecorator<K>`, `checkBound` HOF).
- **Diagnostic system:** `reportDiagnostic()` in `decorator-helpers.ts` uses `$lib.reportDiagnostic()` (TypeSpec library API), NOT raw `program.reportDiagnostic()`. All codes are declared in `src/lib.ts` and compile-time validated via `keyof typeof $lib.diagnostics` — count them there, never trust a hardcoded number in docs. The library name is auto-prefixed by the TypeSpec runtime. All codes actively referenced — no dead codes.
- **Zero `any` types in emitter.ts** (achieved).
- **ESLint config:** `strict` + `strictTypeChecked` from typescript-eslint, all rules at `error` (no `any`, no unsafe operations, no floating promises, no misused promises, require-await, no unnecessary conditions/assertions). `noUncheckedIndexedAccess` in tsconfig makes indexed-access types honest, enabling `no-unnecessary-condition`.
- **Linting strategy (dual linter):** ESLint handles type-aware rules on `src/` only. oxlint handles non-type-aware rules on ALL files (style, perf, complexity metrics, suspicious patterns, eqeqeq). Complexity thresholds: max-lines 400, max-lines-per-function 200, max-statements 80, complexity 50, max-params 5. Zero rule conflicts. `pnpm run lint` runs both; use `pnpm run lint:eslint` / `pnpm run lint:ox` for faster iteration.

## Architecture

- **Entry Point:** `src/index.ts` → exports `$onEmit` for TypeSpec compiler
- **Emitter (9 core files, split from the original 831-line monolith):**
  - `src/emitter.ts` — `$onEmit` entry point, writes output file, handles `split-schemas` option
  - `src/schema-emitter.ts` — `AsyncAPISchemaEmitter` extends `TypeEmitter<JsonSchema, AsyncAPIEmitterOptions>`; overrides `modelDeclaration` (`allOf` for inheritance, `discriminator` for polymorphic models), `modelInstantiation`/`unionInstantiation` (argument-derived declaration names), `unionDeclaration` (`oneOf` for all-Model variants, `anyOf` for mixed), `enumDeclaration`, `intrinsic`, `operationReturnType`, etc.
  - `src/schema-ref.ts` — `refForNamedType()` resolves named TypeSpec types to `$ref` pointers; `declarationNameOf()` mirrors the framework's instantiation naming; `schemaNameForType()` is the public API
  - `src/schema-generator.ts` — `generateSchemas()` entry point, creates asset emitter and collects declarations
  - `src/extract-value.ts` — `extractValue()` narrows `EmitEntity<T>` discriminated union, filters `Placeholder<T>` lazy values
  - `src/stdlib-helpers.ts` — `isStdlibType()` and `collectAllStdlibNames()` utilities
  - `src/constraint-mapper.ts` — `applyConstraints()`, `applyMetadata()`, `resolveEncode()`: maps 16 TypeSpec stdlib constraint/metadata mappings to JSON Schema keywords via table-driven `CONSTRAINT_TABLE` (10 validation entries) + inline metadata. Validation keywords skipped on `$ref` schemas
  - `src/document-builder.ts` — `buildAsyncAPIDocument()` entry point; delegates to `src/builders/` for assembly. Handles `$ref` chain construction
  - `src/intrinsic-mapping.ts` — `intrinsicToSchema()` maps TypeSpec scalar names to JSON Schema types (~30 cases)
  - `src/schema-splitter.ts` — `splitSchemas()` extracts schemas into individual files, rewrites `$ref` pointers to external paths
- **Document Builders (`src/builders/`, 11 files):**
  - `operation-discovery.ts` — discovers channel-decorated operations from a TypeSpec namespace
  - `message-builder.ts` — builds message objects with `$ref` registration
  - `shared-utils.ts` — shared helpers: `registerMessage()`, `resolveMessageKey()`, `inferActionFromName()`, `normalizeOAuth2Scopes()`, `buildProtocolBindings()`
  - `operation-builder.ts` — builds operation objects with action, channel ref, messages, and reply
  - `channel-builder.ts` — builds channel objects with address, messages, bindings
  - `server-builder.ts` — builds server objects with host, protocol, variables, and namespace-scoped bindings
  - `security-builder.ts` — builds `components.securitySchemes` from `@security` state
  - `tag-builder.ts` — collects `@tags` state into reusable `components.tags` map (dedup by name)
  - `components-builder.ts` — builds reusable `components.*` (operationTraits, messageTraits, parameters, correlationIds, operation/message/server/channel bindings) and applies `$ref` references via 3-way binding dispatch
  - `types.ts` — shared builder context and result types
  - `_imports.ts` — re-exports from `@typespec/compiler` for tree-shakeable imports across builders
- **Decorators:** `lib/main.tsp` declares all **30 decorators** (19 core + 11 reusable-component: 5 definition on Namespace + 6 reference) + the `EmitterOptions` model for IDE autocomplete.
- **Decorator Implementations:** `src/decorators.ts` (unified registry), `src/minimal-decorators.ts` and `src/namespace-decorators.ts` (thin wrappers with runtime validation, helpers in `src/decorator-helpers.ts`, state writing in `src/state-writers.ts`). `$server`, `$defaultContentType`, and the 5 reusable-component definition decorators use the `namedConfigDecorator` factory; reference decorators use `makeUseDecorator` (`src/use-decorators.ts`). `$bindings` targets `Operation | Model | Namespace` (Namespace → server bindings via `bindingTargetKind`). `@jsonSchemaExtension`/`@extension` live in `src/extension-decorators.ts`.
- **Reusable Components:** 11 decorators populate `components.operationTraits`, `messageTraits`, `parameters`, `correlationIds`, `operationBindings`, `messageBindings`, `channelBindings`. Definition decorators (`@operationTrait`, `@messageTrait`, `@parameter`, `@reusableCorrelationId`, `@reusableBinding`) target Namespace. Reference decorators (`@useOperationTrait`, `@useMessageTrait`, `@useCorrelationId`, `@useBinding`, `@useChannelBinding`, `@useChannelServer`) target Operation/Model. Channel address parameters (`{paramName}`) auto-upgrade to `$ref` when a matching `@parameter` exists. Inline `@correlationId` still works without populating `components.correlationIds`.
- **State Management:** `src/state.ts` (consolidation), `src/state-compatibility.ts` (TypeSpec stateMap access)
- **Configuration:** `src/infrastructure/configuration/` — types only, no runtime validation
- **Protocols:** `src/constants/protocols.ts` — single source of truth (const array → derived type → runtime Set + type guard). **22 protocols** (HTTP, HTTPS, WS, WSS, MQTT, MQTT5, Kafka, AMQP, AMQP1, NATS, JMS, SNS, SQS, STOMP, Redis, GooglePubSub, Mercure, IBMMQ, Pulsar, Solace, AnypointMQ, ROS2). Aliases accepted (`websocket` → `ws`) via `normalizeProtocol()`. Canonical names only in `PROTOCOL_LIST`; `isSupportedProtocol()` narrows to `AcceptedProtocol`.
- **Binding Versions:** `src/constants/binding-versions.ts` — single source of truth per protocol. **19 binding protocols**, versions auto-generated from `@asyncapi/specs/bindings/` via `scripts/generate-binding-specs.ts`. `normalizeBindingProtocol()` maps `wss` → `ws` for binding keys (the AsyncAPI schema uses `ws` for both). Auto-injects `bindingVersion` when missing. The `BINDING_PLACEMENT` matrix is auto-generated; `supportsBindingPlacement()`/`getValidPlacements()` consume it.
- **Binding Validation:** `src/validation/binding-validator.ts` + `src/validation/binding-field-validator.ts` — `processBindings()` takes an optional `targetKind` (`Operation` → `"operation"`, `Model` → `"message"`). Normalizes binding keys, validates versions, auto-injects missing `bindingVersion`, warns on misplaced bindings. `validateBindingFields()` checks field values against spec-derived rules (auto-generated in `generated-bindings.ts`). `BindingDiagnosticCode` union replaces the old `string` code field.
- **Security Scheme Types:** `src/domain/models/asyncapi-document.ts` — `SECURITY_SCHEME_TYPES` const array → `SecuritySchemeType` union → `isValidSchemeType` runtime guard. Matches AsyncAPI 3.1 exactly (no `sasl`/`mutualTLS`/`external`/`oauthBearer`). Multi-security per namespace via array accumulation.
- **Document Model:** `src/domain/models/asyncapi-document.ts` — strongly-typed AsyncAPI 3.1 interfaces (`OAuth2Flows`, `ProtocolBindings`, `SecuritySchemeType`) plus one-line `ref*` constructors (`ref()`, `refSchema()`, `refMessage()`, `refChannel()`, …) over a shared `ref(pointer)`. No index signatures except `JsonSchema` (standard JSON Schema extension pattern).
- **Cross-emitter Shared Module:** `src/shared/` — exports `JsonSchema`, `SchemaRef`, `SchemaMap` and `generateSchemas`, `extractValue`, `intrinsicToSchema`, `AsyncAPISchemaEmitter` for reuse by other TypeSpec emitters. Subpath export: `@lars-artmann/typespec-asyncapi/shared`.
- **Multi-file Output:** `split-schemas` option splits schemas into individual files under `schemas/`; all `$ref` values rewritten from `#/components/schemas/Name` to `schemas/Name.{ext}` in both main document and schema files.
- **`asyncapi-id` option:** sets the root document `id` (e.g. `"urn:com:example:api"`); omitted when unset.
- **`@protocol` field placement mapping:** config fields emit at spec-correct placements, not where they're written: kafka `partitions`/`replicationFactor` → channel binding `partitions`/`replicas`; kafka `consumerGroup` → operation binding `groupId` as a `{ type: "string", const: ... }` schema (AsyncAPI 3.1 requires schema|boolean — plain strings fail AJV); mqtt `qos`/`retain` → operation binding (mqtt has NO channel binding); ws `headers`/`queryParams` → channel binding `headers`/`query`. Unknown top-level keys and the nested `binding:` map pass through to the channel binding (or operation binding when the protocol defines no channel binding, e.g. http). On a MODEL target, the `binding:` passthrough becomes the model's MESSAGE binding (bindingVersion auto-injected; explicit `@bindings` fields win per protocol key); channel/operation-only fields, binding fields for protocols without message bindings, and bindings on models no operation references emit the `protocol-model-fields-unplaced` warning (messageId `no-message` for the last case). No defaults fabricated; version-only binding shells never emitted; `mqtt5` normalizes to the `mqtt` binding key.
- **tsconfig:** `"types": ["node"]` for `structuredClone` (used in `schema-splitter.ts`); `"noUncheckedIndexedAccess": true` for honest indexed access.

## AsyncAPI 3.1 `$ref` Chain

The document MUST follow this reference chain:

```
operations → #/channels/{id}/messages/{id}
channels → #/components/messages/{id}
components.messages → #/components/schemas/{name}
```

Nested model properties use `$ref` for named user-defined models; model inheritance uses `allOf` with `$ref` to the base model.

## TypeSpec Test Framework

Tests use **vitest** with the TypeSpec compiler testing API (`createTester`). All compilation is programmatic via `test/utils/test-helpers.ts` — no process spawning. Test files use vitest globals (`globals: true` in vitest config). `compileAsyncAPI()` returns `allOutputFiles: Map<string, string>` for multi-file output testing. Test helpers auto-detect `@typespec/versioning` imports and add the library to the virtual filesystem. `compileAsyncAPI` uses `tester.compileAndDiagnose()` — all compilation APIs consistently surface decorator-reported diagnostics.

### `@typespec/versioning` Integration

`src/document-builder.ts` imports `getVersion()` from `@typespec/versioning`. When a namespace is `@versioned`, the latest enum value is the `info.version` fallback (precedence: emitter `version` option > `@apiVersion` > `@versioned` enum > `"1.0.0"`).

### Test Helpers

- `test/utils/test-helpers.ts` — `compileAsyncAPI`, `compileAsyncAPISpecRaw`, `compileAsyncAPISpecWithoutErrors` (all return `diagnostics`)
- `test/utils/cli-test-helpers.ts` — CLI-compatible wrapper
- `test/utils/type-guards.ts` — `inlineObject<T>(value, label?)` (narrows `Ref | T`, throws on surprise `$ref`) and `asJsonSchema(value, label?)` (narrows `items`/`additionalProperties` unions) — prefer these over `as` casts so a surprise `$ref` fails loudly
- `test/utils/schema-validator.ts` — reusable AJV harness: `compileAndValidate()`, `compileAndValidateOrThrow()`, `validateAsyncAPIDocument(doc)` (validates an already-parsed document, throws with formatted errors), `formatValidationErrors()`
- **Emitter diagnostic codes are library-prefixed** in test assertions: filter with `d.code?.endsWith("<code>")` or the full `"@lars-artmann/typespec-asyncapi/<code>"` string — a bare `d.code === "<code>"` never matches.
- **Two blockless namespaces in one file are invalid** (`asyncApiDoc` becomes null). For multi-namespace tests use nested `namespace Root;` + `namespace First { ... }` blocks (see `test/integration/multi-namespace-isolation.test.ts`).
- **AsyncAPI 3.1 root schema is `additionalProperties: false`** — never AJV-validate a document object decorated with test extras (`compileAsyncAPISpec` returns the doc with `diagnostics`/`outputFiles` merged in); parse from `outputFiles` or strip extras first.

### Key Tests

- `test/golden/` — golden-file locks (livesession-xyd, channel-bindings, polymorphism, reusable-components, server-security, plus `lock-fixtures.test.ts` byte-locking named-union `oneOf`, template-instantiation `PageUser` output, and `@protocol` kafka/http/ws bindings). Regenerate via `bun run scripts/regenerate-golden.ts` after intentional fixture/output changes
- `test/compliance/` — AsyncAPI 3.1.0 spec compliance suite (~270 tests, 18+ files), all AJV-validated via `compileAndValidateOrThrow()`
- `test/property/emitter-properties.test.ts` — fast-check invariants over randomly generated specs
- `test/realworld/` — external repo patterns + canonical AsyncAPI spec ports + golden regression guard
- `test/integration/`, `test/e2e/`, `test/external/`, `test/bdd/`, `test/benchmark/`, `test/domain/`, `test/unit/`, `test/decorators/` — see FEATURES.md for the inventory
- `examples/` — 14 runnable pnpm-workspace examples; `pnpm run check-examples` compiles all with 0 diagnostics and AJV-validates each (enforced in CI)

## Decorator Signatures

Decorators accept BOTH `{}` (Model expression types) AND `#{}` (value literals); targets vary per decorator:

```typescript
extern dec security(target: Operation | Namespace, config: {} | valueof Record<unknown>);
extern dec bindings(target: Operation | Model | Namespace, value: {} | valueof Record<unknown>);
```

## `EmitEntity<T>` Pattern

`@typespec/asset-emitter` returns `EmitEntity<T>` objects that must be narrowed by `entity.kind` (`"declaration"`, `"code"`, `"none"`, `"circular"` — only the first two carry `.value`). `Placeholder<T>` lazy values are detected by duck-typing an `onValue` function and must NOT be treated as final values. `extractValue()` in `src/extract-value.ts` is the single authoritative implementation.

## Gotchas

- **Intrinsic mappings:** `unknown`/`void`/`never` → `{}` (unconstrained schema, NOT `{type:"string"}`); `null` → `{type:"null"}` (so `string | null` → `anyOf: [{type:"string"},{type:"null"}]`). Locked by `test/compliance/type-mapping-completeness.test.ts` "intrinsic types".
- **Framework-interned schema values must not be mutated:** the asset-emitter treats intrinsics as declarations and shares ONE value object across every usage of that type. `applyConstraints`/`applyMetadata` mutate in place — mutating a shared value leaks metadata onto unrelated usages (e.g. stdlib `OperationExample`'s doc appearing on every `unknown`). `propertyToSchema` clones (`{ ...schema }`) before applying constraints; keep that clone when touching the property path.
- **Diagnostic severity enums differ by library:** TypeSpec's `DiagnosticSeverity` is a string union (`"error" | "warning"` — `String(d.severity) === "error"` works). Spectral's `@stoplight/types` `DiagnosticSeverity` is a NUMERIC enum (`Error = 0`) — comparing `d.severity === "error"` is a silent no-op; import `DiagnosticSeverity` from `@asyncapi/parser` and compare `DiagnosticSeverity.Error`.
- **Root config is `tspconfig.yaml` only.** TypeSpec resolves the yaml first; a `tspconfig.json` alongside it is a split-brain. Do not recreate the json.
- Use `#{ url: "...", protocol: "..." }` syntax for `@server` (comma-separated, not semicolons)
- `SERIALIZATION_FORMAT_OPTION_JSON` is an object `{format, pretty, indent}`, not a string
- `emitFile` needs the `emitterOutputDir` prefix or crashes in CLI mode
- **Channel addresses with `/` are JSON-pointer-escaped:** `$ref` tokens use `~1` for `/` and `~0` for `~` per RFC 6901. Object keys stay raw.
- `file-type` option can be string `"json"`/`"yaml"`/`"yml"` or object `{ format: "json", pretty: true, indent: 2 }` — all honored
- **Arrays/Records of named models:** `Item[]` must emit `items: { $ref: "#/components/schemas/Item" }`; `Record<Item>` must emit `additionalProperties: { $ref }`; `Record<string>` maps to `{ type: "object", additionalProperties: { type: "string" } }` (NOT `type: "array"`). Fix pattern: call `refForNamedType()` BEFORE `emitTypeReference` (which returns NoEmit for declaration refs, causing `extractValue` → `{}` → wrong intrinsic fallback).
- **AsyncAPI 3.1 binding key names:** the binding object key MUST match the official schema — `ws` (not `websocket`/`websockets`), `kafka`, `http`, `amqp`, etc.
- **Kafka binding placement:** channel bindings allow `topic`, `partitions`, `replicas`, `topicConfiguration`, `bindingVersion`; operation bindings allow `groupId`, `clientId`, `bindingVersion`; message bindings allow `key`, `schemaIdLocation`, `schemaIdPayloadEncoding`, `schemaLookupStrategy`, `bindingVersion`. All require `bindingVersion` for schema validation.
- **OAuth2 scopes:** AsyncAPI 3.1 uses `availableScopes` (not `scopes`) — a map `{scopeName: "description"}`, not an array. The emitter accepts both input keys, always outputs `availableScopes` via `normalizeOAuth2Scopes()`.
- **TypeSpec value literals (`#{}`):** property names must be valid identifiers. Reserved words (`const`, `enum`, `default`, `export`, `function`, `model`, `op`, …) cannot be keys — including as MODEL PROPERTY NAMES (the parser treats them as keywords; `model: string` fails with `token-expected`). Quoted keys (`"retention.ms"`, `"x-custom-field"`) are not supported — use camelCase/PascalCase. `#{}` members require COMMAS (newline-separated is a parse error, unlike model properties).
- **Protocol alias normalization:** `websocket` is accepted as INPUT but normalized to `ws` via `normalizeProtocol()`; never emit `websocket` as a binding key (schema accepts only `ws`/`wss`).
- **ProtocolConfigData is a discriminated union** on `protocol` (`KafkaConfigData | WebSocketConfigData | MqttConfigData | GenericProtocolConfigData`) — protocol-specific fields can only exist on their owning variant.
- **Security scheme types match AsyncAPI 3.1 exactly:** valid: `apiKey`, `asymmetricEncryption`, `gssapi`, `http`, `httpApiKey`, `oauth2`, `openIdConnect`, `plain`, `scramSha256`, `scramSha512`, `symmetricEncryption`, `userPassword`, `X509`. NOT valid: `sasl` (use the specific mechanism as the type), `mutualTLS`, `external`, `oauthBearer`. **`apiKey` vs `httpApiKey` (from the AsyncAPI 3.1 schema itself):** `apiKey` = `{type, in}` with `in` ∈ `"user"|"password"` ONLY (SASL-style, NO `name`, additionalProperties false); `httpApiKey` = `{type, name, in}` all REQUIRED, `in` ∈ `"header"|"query"|"cookie"`. SASL schemes (`plain`/`scramSha256`/`scramSha512`/`gssapi`) accept `{type, description?}` only. Locked by `test/domain/security-schemes.test.ts`.
- **WS binding version:** ws channel bindings require `bindingVersion: "0.1.0"` (NOT Kafka's `"0.5.0"`) — each protocol has its own constant. Auto-injected when missing.
- **WSS binding key:** the binding schema uses `ws` for BOTH ws and wss. `normalizeBindingProtocol()` maps `wss` → `ws` for binding keys; `server.protocol` retains the distinction.
- **`@asyncapi/parser` Bun incompatibility:** the parser fails under Bun (AJV `new Function()` codegen in its Spectral ruleset). Parser-based tests run under vitest/Node; use manual `$ref` resolution elsewhere (`test/validation/semantic-ref-resolution.test.ts`).
- **`@service` is core TypeSpec** (in the `TypeSpec` namespace, not `TypeSpec.AsyncAPI`): requires `#{}` value-literal syntax (`@service(#{title: "My API"})`), NOT `{}` (compiler `expect-value` error). Accepts only `title` — use `@apiVersion` for `info.version`. Title is read via `listServices(program)` as the `info.title` fallback (emitter options take precedence).
- **`#deprecated` is a compiler directive, NOT a decorator:** use `#deprecated "message"` (hash prefix); there is no `@deprecated` in stdlib. `isDeprecated(program, type)` checks it; `applyDeprecated()` in `constraint-mapper.ts` applies it to properties and model/enum declarations.
- **Constraint decorators target specific types:** `@pattern` only on `string | ModelProperty` of string type; `@minValue`/`@maxValue` on numeric scalars; `@minItems`/`@maxItems` on arrays. The compiler validates targets at compile time.
- **`$ref` constraint siblings:** validation keywords (`minimum`, `pattern`, …) apply to inline schemas only — skipped on `$ref` (Draft-07 ignores siblings). Metadata (`deprecated`, `description`, `title`, `examples`, `readOnly`, `writeOnly`, `default`, `@jsonSchemaExtension` keywords) IS applied as `$ref` siblings, which AJV accepts.
- **`@summary`/`@example`/`@visibility`/`@encodedName` are stdlib** (from `@typespec/compiler`, NOT declared in `lib/main.tsp`): `@summary` → `title` via `getSummary()`; `@example` → `examples` via `getExamples()` + `serializeValueAsJson()`; `@visibility` → `readOnly`/`writeOnly` via `getVisibilityForClass()`; `@encodedName("application/json", "wire")` → wire-format `properties` keys, `required` entries, and `discriminator` values via `resolveEncodedName()` (components schemas always use the `application/json` encoding; MIME-subtype resolution is inside `resolveEncodedName`).
- **Default values use core `=` syntax, NOT `@default`:** `prop: Type = value` (the compiler stores it on `prop.defaultValue`). Enum defaults require an enum member reference (`MyEnum.value`, not `"value"`); string-literal unions allow literal defaults. Applied as an annotation keyword (a valid `$ref` sibling).
- **`@visibility` mapping is lossy** (5 Lifecycle values → 2 booleans): Read-only → `readOnly`, Create/Update-only → `writeOnly`, both/neither → nothing; Delete and Query silently ignored. Requires enum members in current TypeSpec: `@visibility(Lifecycle.Read)`, NOT `@visibility("read")`.
- **Protocol count is 22; binding protocols are 19** (no separate https/wss/mqtt5 binding entries). Different concerns, not a split-brain.
- **Model inheritance uses `allOf`:** `model Derived extends Base` emits `allOf: [{ $ref }]` — each model has only its own `properties`/`required`; multi-level chains produce linked refs. Inherited properties are NOT in the derived model's `properties`.
- **`@discriminator` targets Model only** (compiler rejects on unions). `getDiscriminator()` returns `{ propertyName }` or `undefined`; the discriminator property is auto-added to `required`.
- **`oneOf` vs `anyOf` for unions:** all-Model variants → `oneOf` (exclusive); mixed (`string | int32`) → `anyOf`; string-literal → `enum`. Named model variants must emit `$ref` — call `refForNamedType()` before `emitTypeReference` (else empty `{}` objects).
- **Template instantiations (`Page<User>` → `PageUser`):** the asset-emitter's namespace walk NEVER declares instantiations; any `$ref` to them dangles without explicit `emitTypeReference`. Naming mirrors the framework's `declarationName`: base name + each argument's recursively-resolved name, first letter capitalized (`PageUser`, `BoxInt32`, `PagePageUser`); anonymous/literal/union args → inline. Anonymous models have `name === ""` (empty string, NOT undefined) — guard with falsiness. `refOrFallback()` short-circuits on hand-built refs ONLY for non-instantiations. `operationReturnType` must stay overridden (framework default returns none). Indexed instantiations (`Record<K,V>`) inline as `additionalProperties` to avoid junk declarations. Unspeakable bases (`extends BaseEvent<{...}>`) compose via INLINE `allOf`. Collisions (explicit `model PageUser` + `Page<User>`) emit `duplicate-schema-name` warning (last declaration wins). Locked by `test/compliance/template-instantiations.test.ts`.
- **TypeEmitter overrides dispatch by exact method name** (`modelInstantiation`, `unionDeclaration`, `enumDeclaration`, `scalarDeclaration`, `operationReturnType`, …) from `typeEmitterKey` in asset-emitter. Overrides named `union`, `enum`, `scalar`, `namespace`, `modelProperty`, etc. are DEAD CODE — verify the method name matches a dispatch key before adding overrides.
- **Examples are a pnpm workspace:** `pnpm-workspace.yaml` lists `examples/*`; each example links the emitter via `workspace:*` (directory symlink). Any tool walking `examples/` MUST skip `node_modules` and `tsp-output` (symlink cycle → ELOOP). `@operationSecurity(#{name})` only attaches a `$ref` — the scheme must ALSO be declared via `@security` or the ref dangles. `@reply`'s second arg is a runtime expression (`"$message.header#/replyTo"`), not a channel address.
- **fast-check property suite:** seed pinned via `FC_SEED` env; reproduce failures with `FC_SEED=<seed> pnpm exec vitest run test/property`. Generator gotchas: filter lowercase identifiers against TypeSpec reserved words (reserved words cause parse-error throws, not assertion failures); pass `{ nil: null }` to `fc.option` when the type says `| null`.
- **EFv1 containment guard:** eslint `no-restricted-imports` bans `@typespec/asset-emitter` for all of `src/` EXCEPT the three-file schema seam (`schema-generator.ts`, `schema-emitter.ts`, `extract-value.ts`). The 11 document builders consume only `@typespec/compiler`. Needing asset-emitter elsewhere means widening the seam — reconsider (ROADMAP.md "EFv1 containment" documents the v0.4.0 direct-AST exit plan).
- **`@extension("x-...", value)`:** AsyncAPI spec extensions. Namespace → document root, Operation → operation object, Model → message object (keyed via `resolveMessageKey`). Keys MUST start `x-` (else `invalid-extension-key` warning); repeatable with merge (outermost same-key wins). AJV ignores `x-` keys, so output still validates.
- **`@jsonSchemaExtension(key, value)`:** arbitrary JSON Schema keywords on Model/ModelProperty/Union/Enum/Scalar. Impl in `src/extension-decorators.ts`; applied in `applyMetadata()` inline AND as `$ref` siblings. Merge: decorators execute bottom-up, so the OUTERMOST same-key wins. Key validation `/^[A-Za-z_][A-Za-z0-9_.-]*$/u` → `invalid-json-schema-extension-key` warning.
- **Table-driven constraint mapping:** adding a validation constraint = one `CONSTRAINT_TABLE` entry, not a 4-line if-block.
- **`@encode` serialization:** `resolveEncode()` wraps `getEncode()` (which only accepts `ModelProperty | Scalar`; returns `undefined` for Model/Enum/Union). The `encodeAs` goes to `serializeValueAsJson()` for examples and defaults.
- **`@summary` on operations/channels** populates `summary` (via `getSummary()`, separate from `@doc` → `description`). Channel summaries flow through the `channelSummaries` map (populated in operation-discovery, applied in channel-builder).
- **`@message` `title` populates BOTH the message `name` AND `title` fields** (always set; defaults to `target.name`).
- **`@tags` accepts rich tag objects:** arrays of strings AND/OR `#{name, description?, externalDocs?}`. Objects without `name`, empty strings, and `name: ""` all trigger `invalid-tags-config`. `storeTags()` accepts pre-normalized `Tag[]` only.
- **`@parameter` location validation:** `location` (if present) must start with `$message.` and contain a `#` JSON-pointer separator, else `invalid-parameter-location` warning.
- **Traits extract rich fields** via `extraPicker` callbacks in `namespace-decorators.ts`: `@operationTrait` extracts `security`, `tags`, `bindings` (+ summary/description); `@messageTrait` extracts `headers`, `correlationId`, `summary`, `tags`, `bindings` (+ name/description).
- **`enum` is reserved in `#{}` value literals:** the server builder maps config `values` → output `enum` — use `values: #["a", "b"]` in config to get `enum: ["a", "b"]` in output.
- **AsyncAPI 3.1 security format:** `security` on operations/servers contains `$ref` pointers to `components.securitySchemes` (or inline schemes), NOT OpenAPI-style `{ schemeName: [scopes] }` maps. `@operationSecurity(#{name: "jwt"})` → `{ $ref: "#/components/securitySchemes/jwt" }`. `SecurityRequirement` is `Ref | Partial<SecurityScheme>`.
- **Blockless namespace ordering:** `namespace Foo;` MUST appear before any other declarations, else `blockless-namespace-first` errors.
- **Decorator execution is bottom-up:** decorators closest to the declaration execute first. `@useChannelServer("a")` above `@useChannelServer("b")` above `op foo()` stores `[b, a]`. Affects ordering of server refs, security requirements, and other multi-value state.
- **Build pipeline ordering:** `buildServers` must run BEFORE `attachChannelServerRefs` in `document-builder.ts`, else `ctx.servers` is empty and `channel.servers` is silently omitted.
- **`storeMessageConfig` stores the full config** (including `schemaFormat` and `examples`), not just contentType/description/title.
- **`storeProtocolConfig` lives in `src/store-protocol-config.ts`** (extracted to keep `state-writers.ts` under 400 lines); re-exported from `state-writers.ts` for compatibility.
- **Property override narrowing:** a derived model can narrow `eventType: "specific.literal"` only if the base property is `string` (not another literal); overriding one literal with another causes `override-property-mismatch`.
- **`decimal` renders as `type: "string"` + `format: "decimal"`** — correct by design (JSON floats lose precision; string representation is the JSON Schema convention).
- **Generic model instantiation:** `model Foo<T extends string>` with spread `...Bar<"value">` resolves at compile time; derived `extends BaseEvent<{...}>` produce `allOf` with `$ref` to the base schema (inherited properties NOT in the derived model).
- **Named unions:** emit `oneOf`; the union itself is declared in `components.schemas` and receives `@doc`/`@summary` as `description`/`title` (public contract, locked by `test/compliance/polymorphism.test.ts`). Properties typed by the union inline the `oneOf` directly rather than `$ref`-ing the union schema.
- **asset-emitter (EFv1) is terminal but slow to die:** its own description says "to be replaced by the new emitter framework", but Microsoft's `openapi3`/`json-schema` emitters still use it. EFv2 (alloy-js/tree-sitter) targets source-code emitters, not data documents — never adopt it here. Our usage is confined to schema generation (3 files import it, 480 lines; `schema-ref.ts` mirrors its naming without importing); `generateSchemas()` is the sole seam. Plan: contain → monitor openapi3 migration → direct-AST rewrite in v0.4.0 (ROADMAP.md).
- **Competing emitter `tsp-asyncapi` (npm, marvin-hsu):** direct-AST, AsyncAPI 3.0-schema-validated. We lead on 3.1 validation, reusable components/traits, split-schemas output, `@typespec/versioning`, spec-generated binding validation, property-based tests, npm distribution with provenance. They lead on: docs site. Remaining competitive plan items live in TODO_LIST/ROADMAP.
- **`@typespec/compiler` ^1.15.0** — check `package.json` for the current pin.
- **pnpm 11 ignores `pnpm.overrides` in package.json** (warns "no longer read"); transitive-dependency overrides live in `pnpm-workspace.yaml` as a top-level `overrides:` map. npm-style top-level `overrides` in package.json is ALSO ignored by pnpm (the root's existing `overrides` block is inert npm compat; `website/video` uses npm where it does apply). Security pin precedent: `fast-uri ^3.1.6` + `js-yaml ^4.3.2` in BOTH `pnpm-workspace.yaml` files (root + website) silence the Dependabot alerts Dependabot itself cannot bump (`security_update_not_possible` for transitive deps).
- **pnpm 11 enforces `minimumReleaseAge` (~24h publish cutoff) on every lockfile entry** — a Dependabot bump that pulls too-fresh transitive versions makes `pnpm install`/`pnpm clean --lockfile` fail with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` (verification runs before clean can act). Fix: `trash <pnpm-lock.yaml> && pnpm install` — fresh resolution picks age-compliant older versions.
