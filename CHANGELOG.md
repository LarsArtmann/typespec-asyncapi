# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Constraint decorator mapping** (`src/constraint-mapper.ts`) — 11 TypeSpec stdlib constraint/metadata decorators are now correctly mapped to JSON Schema keywords: `@minValue`→`minimum`, `@maxValue`→`maximum`, `@minValueExclusive`→`exclusiveMinimum`, `@maxValueExclusive`→`exclusiveMaximum`, `@minLength`→`minLength`, `@maxLength`→`maxLength`, `@pattern`→`pattern`, `@format`→`format`, `@minItems`→`minItems`, `@maxItems`→`maxItems`, `#deprecated`→`deprecated`. Validation keywords are applied to inline schemas only (skipped on `$ref` schemas where siblings are ignored). `deprecated` is applied at both property and model/enum level.
- **Constraint decorator compliance tests** (`test/compliance/constraint-decorators.test.ts`, 15 tests) — numeric constraints, string constraints, array constraints, deprecation directive (property + model level), multiple constraints, absent decorators. All AJV-validated against AsyncAPI 3.1.0 JSON Schema.
- **`@typespec/versioning` integration** — `src/document-builder.ts` reads `@versioned` enum values from `@typespec/versioning` for `info.version`. Precedence: emitter `version` option > `@apiVersion` decorator > `@versioned` latest enum value > `"1.0.0"`. Test infrastructure auto-detects versioning imports. (`test/integration/versioning.test.ts`, 5 tests)
- **AsyncAPI Studio compatibility tests** (`test/validation/studio-compatibility.test.ts`, 9 tests) — verifies emitter output parses cleanly via `@asyncapi/parser` (the same parser used by AsyncAPI Studio). Validates `$ref` resolution, channel/operation/message/schema accessibility, and zero-diagnostic parsing for servers, security, Kafka bindings, reply operations, and complex multi-feature documents.
- **Document structure constraint tests** (`test/validation/document-structure.test.ts`, 8 tests) — verifies structural requirements downstream tools depend on: `$ref` resolution, channel addresses, message payloads, operation actions, schema type definitions, server transport info, and multi-message operations. (Renamed from `generator-compatibility.test.ts`.)
- **Type mapping completeness suite** (`test/compliance/type-mapping-completeness.test.ts`, 35 tests) — every TypeSpec scalar type now has a dedicated compilation test asserting correct JSON Schema `type` and `format` output. Covers all integer subtypes, floats, decimals, date/time types, bytes, url, tuples, literals, records, and edge cases.
- **Shared builder utilities tests** (`test/unit/shared-utils.test.ts`, 33 tests) — direct unit tests for `inferActionFromName`, `operationAction`, `extractChannelParameters`, `normalizeOAuth2Scopes`, `buildProtocolBinding`, `escapeRefToken`, and `$ref` construction helpers.
- **Idempotency tests** (`test/integration/idempotency.test.ts`, 4 tests) — verifies deterministic output: same input always produces byte-identical JSON and YAML, with deterministic key ordering.
- **Model composition & documentation propagation tests** (`test/compliance/model-composition.test.ts`, 15 tests) — multi-level inheritance, `@doc` propagation to models/properties/enums, nested `$ref` chains, `Record<NamedModel>`, union of string literals.
- **Decorator negative tests** (`test/integration/decorator-negative.test.ts`, 12 tests) — diagnostic error paths for `invalid-security-scheme-type`, `invalid-server-url`, `server-url-required`, `server-protocol-required`, `missing-channel-path`, `unsupported-protocol`, and emitter `description` option.
- **`splitSchemas` unit tests** (14 tests) — empty components, single schema extraction, `$ref` rewriting (main doc + schema files), non-schema `$ref` preservation, YAML extension, immutability, nested refs inside arrays.
- **`extractValue` edge case tests** (5 tests) — `circular` kind, `code` kind, null/non-object values, complex nested schemas.
- **Binding protocol fix regression tests** (10 tests) — solace (priority validation, range/type checks, server target, misplaced binding), anypointmq normalization, ros2 normalization, binding-only protocol acceptance.
- **Tuple fix regression tests** (2 tests) — tuple of named models and mixed primitives + named models validated against AsyncAPI 3.1 JSON Schema.
- **Binding field validation extensions** (7 tests) — max/min constraint violations, protocol without rules, target kind without rules.
- **Decorator combination tests** (11 tests) — `@defaultContentType`, multiple `@server`, void operations, enum explicit values, `@channel` + `@doc`, `@operationId`, `@messageId`.
- **Shared module barrel public-API contract tests** (4 tests) — verifies all exports exist, no unexpected runtime leaks, prototype overrides present, type-only exports compile.
- **Zero-clone duplication baseline** — `jscpd` threshold lowered from 8% to **0%** after a four-phase structural deduplication campaign (68 clones / 7.67% → 0 clones / 0%). Future regressions fail the gate immediately.
- **Structural deduplication helpers** — `DocumentBody` interface, `DiagnosticContext` interface, `makeConfigDecorator<T>` factory, `makeStringIdDecorator<T>` factory, `messageDecorator<K>` factory, `checkBound` HOF, `validatedDecorator` HOF, `iterNamedTypes` generator, `BuilderFn` type alias, `refOrFallback` / `returnConst` / `returnNone` private methods on `AsyncAPISchemaEmitter`.
- **Diagnostic code count corrected to 22** — 17 error + 5 warning codes, all compile-time validated via `$lib.reportDiagnostic()`. (Was documented as 18; `invalid-operation-id`, `invalid-message-id`, `invalid-binding-field`, and `invalid-bindings-config` were undercounted.)

### Changed

- **BDD tests rewritten** — Dead Cucumber infrastructure removed. `user-behaviors.test.ts` rewritten with 23 real end-to-end behavior tests covering channels, protocol bindings, path templates, security, servers, messages, invalid config, document structure, and namespace bindings.
- **`@typespec/versioning`** added as a runtime dependency.
- **Shared module JSDoc rewritten** — honest two-tier split: protocol-neutral exports (`JsonSchema`, `SchemaRef`, `SchemaMap`, `extractValue`, `intrinsicToSchema`) vs AsyncAPI-bound convenience (`generateSchemas`, `AsyncAPISchemaEmitter`). Old doc falsely claimed "without pulling in AsyncAPI-specific types."
- **Test imports redirected through public barrel** — all shared-module test imports now go through `src/shared/index.js`, exercising the barrel rather than internal module paths.
- **`JsonSchema.items` type broadened** from `JsonSchema` to `JsonSchema | JsonSchema[]` to support JSON Schema tuple validation.
- **Builder architecture** — `buildAsyncAPIDocument()` split into 8 builder files under `src/builders/` (operation-discovery, message-builder, operation-builder, channel-builder, server-builder, security-builder, shared-utils, types). Was a 315-line monolith.

### Fixed

- **Binding protocol gap** (critical bug) — `normalizeBindingKey()` only checked `isSupportedProtocol()` (19 server protocols). Three binding-only protocols (`solace`, `anypointmq`, `ros2`) were rejected as `unknown-binding-protocol`. Added `hasProtocolBindings()` fallback check in `binding-validator.ts`. (`49b4241`)
- **Tuple of named models** (critical bug) — `tuple()` and `typeToSchema()` used `extractValue(emitTypeReference())` which returns identical `{ properties: {}, type: "object" }` objects for named models, producing invalid JSON Schema with duplicate enum entries. Both now use `refForNamedType()` for named model elements. (`0226deb`)

### Removed

- **`nullable` and `xml` fields from `JsonSchema`** — dead code. `nullable` is an OpenAPI 3.0 concept not in JSON Schema Draft-07 / AsyncAPI 3.1; `xml` was declared but never generated or read by any decorator.
- **Linter strategy verification test** (`test/unit/linter-strategy.test.ts`) — anti-pattern: nested `execSync` process spawning inside vitest, tautological (tests that the linter passes by running the linter), added 4.3s overhead.
- **Dead Cucumber BDD infrastructure** — `test/bdd/support/world.ts` (6 unimplemented stubs), `test/bdd/features/core-typespec-to-asyncapi.feature`, `test/bdd/package.json`, `test/bdd/tsconfig.json`. `@cucumber/cucumber` was never installed; all step definitions were stubs.
- **Dead test harness** — `test/core/unified-test-infrastructure.ts` (108 lines, zero imports). Abandoned migration artifact.

## [0.2.0-beta] - 2026-07-22

### Added

- **AsyncAPI 3.1.0 spec target** — bumped from 3.0.0 (`ASYNCAPI_SPEC_VERSION` in `document-builder.ts`, type literal in `asyncapi-document.ts`). The 3.1.0 delta is purely additive (ROS 2 bindings); no breaking changes.
- **Full protocol binding support** (Kafka, AMQP, MQTT, WebSocket, HTTP) — typed binding version constants (`src/constants/binding-versions.ts`), `normalizeBindingProtocol()` mapping `wss`→`ws` for binding keys, `VALID_BINDING_VERSIONS` with validation.
- **Binding validation** (`src/validation/binding-validator.ts`) — `processBindings()` normalizes binding keys, validates versions, auto-injects `bindingVersion` when missing. Three warning diagnostics: `unknown-binding-protocol`, `invalid-binding-version`, `misplaced-binding`.
- **Binding placement validation** — `BINDING_PLACEMENT` matrix (5 protocols × 4 target kinds) warns when a binding is placed on a target kind the AsyncAPI spec doesn't define (e.g., `ws` on an Operation). `misplaced-binding` diagnostic. `supportsBindingPlacement()` and `getValidPlacements()` in `binding-versions.ts`.
- **Protocol alias normalization** — friendly aliases (`websocket`→`ws`, `websockets`→`wss`) accepted as input and normalized to canonical AsyncAPI binding keys via `normalizeProtocol()`. Resolves the `websocket`/`ws` split-brain.
- **`@protocol` decorator validation** — unknown protocols now emit an `unsupported-protocol` diagnostic instead of silently producing invalid output.
- **URL validation for `@server`** — `isValidUrl()` helper and `invalid-server-url` diagnostic. Pragmatic validation (rejects empty/whitespace/control chars; accepts AsyncAPI host-string format).
- **`@service` decorator compatibility** — emitter now reads `@service` title via `listServices()` for `info.title` (emitter options take precedence). Resolves UX trap for OpenAPI migrants.
- **OAuth2 `scopes`→`availableScopes` runtime transformation** — `normalizeOAuth2Scopes()` in `document-builder.ts` transforms legacy `scopes` input key to `availableScopes` at output time. Both keys accepted as input.
- **AsyncAPI 3.1 spec compliance test suite** (78 tests across 6 files in `test/compliance/`) — document structure, schema types, `$ref` chain, servers/security, protocol bindings, edge cases. All validated against official AsyncAPI 3.1.0 JSON Schema via AJV.
- **Reusable AJV schema validation harness** (`test/utils/schema-validator.ts`) — `compileAndValidateOrThrow()` validates emitter output against official AsyncAPI 3.1.0 JSON Schema.
- **External `.tsp` compilation tests** (16 patterns from 5 projects covering branded types, generics, spread, deep inheritance, enums, unions, multi-server).
- **Regression test suite** (`test/validation/schema-emitter-regression.test.ts`, 16 tests) covering `refForNamedType`, `Record<>` mapping, and every `typeToSchema` branch.
- **Semantic `$ref` resolution tests** (`test/validation/semantic-ref-resolution.test.ts`, 22 tests) verifying every `$ref` in every example resolves to a real target.
- **Binding placement tests** — `test/unit/binding-placement.test.ts` (29 unit tests), `test/integration/binding-placement.test.ts` (6 integration tests).
- **Oxlint integration** — `.oxlintrc.json` configured for strict-mode linting (`oxlint . --deny-warnings` passes with 0 errors, 0 warnings). Sensible thresholds for size-limit rules, test-scoped overrides.
- **Diagnostic registry unified** — all 18 codes declared in `src/lib.ts` via `$lib.reportDiagnostic()` with compile-time validation (`code: keyof typeof $lib.diagnostics`). Split-brain structurally impossible to reintroduce.
- **`OperationAction` named type** (`"send" | "receive"`) extracted from inline string literals.
- **`SecurityRequirement` type** (`Record<string, string[]>`) — distinguishes security scheme definitions from security requirements.
- **`$ref` construction helpers** centralized in domain model (`ref()`, `refSchema()`, `refMessage()`, `refChannel()`).
- **`nameOfType()` helper** — type-safe replacement for `as { name: string }` casts, using `"name" in type` narrowing.
- **`operationAction()` named function** — replaces inline `opData.type === "publish" ? "send" : "receive"` ternary.
- **`buildProtocolBinding()` helper** — properly consumes `ProtocolConfigData` discriminated union instead of generic bag access.
- **Domain Language glossary** (`docs/DOMAIN_LANGUAGE.md`).

### Changed

- **`ProtocolConfigData` is now a discriminated union** (`KafkaConfigData | WebSocketConfigData | MqttConfigData | GenericProtocolConfigData`) on `protocol`, making impossible states (e.g., `qos` on a Kafka config) unrepresentable.
- **Document model type-tightened:** `ServerObject.protocol: string` → `AsyncAPIProtocol`, `OperationObject.bindings: Record<string, unknown>` → `ProtocolBindings`.
- **Security scheme types corrected** to match AsyncAPI 3.1 spec exactly: removed 4 invalid types (`sasl`, `mutualTLS`, `external`, `oauthBearer`); added 4 valid types (`httpApiKey`, `userPassword`, `symmetricEncryption`, `asymmetricEncryption`).
- **`SecurityScheme.in` type tightened** from `"user" | "password" | "query" | "header" | "cookie"` to `"query" | "header" | "cookie"` per AsyncAPI 3.1 spec (API key locations only).
- **`OAuth2Flow.scopes` renamed to `availableScopes`** per AsyncAPI 3.1 spec.
- **`ServerObject.security` and `OperationObject.security`** changed from `SecurityScheme[]` to `SecurityRequirement[]`.
- **`intrinsicToSchema()` now emits `format`** for all integer subtypes (`uint8`–`uint64`, `safeint`) for consistency with `int8`–`int64`.
- **`normalizeProtocol()` and `SUPPORTED_PROTOCOLS`** typed as `AsyncAPIProtocol` (was `string`).
- **`TagData` consolidated** with `Tag[]` from the domain model (eliminates duplicate type).
- **`engines.node` set to `>=20.11`** (requires `import.meta.dirname`).
- **Test runner migrated** from `bun:test` to `vitest` (Bun OOM crashes with large test suites — documented memory leaks).
- **Test count grew** from 301 to 551 (78 compliance tests + 16 external spec tests + 37 binding placement tests + 19 regression/semantic tests).
- **`extractValue` uses discriminated union narrowing** on `EmitEntity.kind` instead of unsafe casts.
- **Regex unicode safety** — all regexes use `/u` flag and named capture groups.
- **Explicit return types** added to all `storeXxx` functions and `collectProperties`.
- **Import-then-re-export** replaced with direct `export ... from` in `index.ts` and `tsp-index.ts`.
- **`buildAsyncAPIDocument()` flattened** — reduced nesting depth in `generateSchemas()` via guard clauses.

### Fixed

- **Multi-security overwrite bug** — `storeSecurityConfig` was overwriting on second `@security` call; changed to array accumulation so multiple security schemes on one namespace work correctly.
- **Arrays of named models** (`Item[]`) now emit `items: { $ref: "#/components/schemas/Item" }` instead of `items: { type: "string" }`.
- **`Record<string>`** now emits `{ type: "object", additionalProperties: { type: "string" } }` instead of `{ type: "array" }`.
- **`Record<Item>`** now emits `{ $ref: "..." }` in `additionalProperties`.
- **`test/e2e/realworld-ecommerce.test.ts`** inline spec corrected: removed Kafka channel-binding fields in wrong location, `websocket`→`ws`, `apiKey`→`httpApiKey`, `location`→`in`, `scopes`→`availableScopes`, added AsyncAPI 3.1 JSON Schema validation.
- **`compileAsyncAPI` test helper** now extracts actual output filename from virtual FS instead of hardcoding "asyncapi.yaml".
- **`storeTags` data model** — was storing as comma-separated string, now stores as proper `Tag[]`.
- **Silent error swallowing** — `generateSchemas()` catch block now logs errors via `console.error` instead of bare `catch {}`.
- **13 failing tests fixed** — multiple-blockless-namespace errors in external specs, `outputFiles` map key access patterns, `compileAsyncAPIWithoutErrors` error handling.

### Removed

- **Dead coverage devDependencies** — `@vitest/coverage-v8`, `@vitest/coverage-istanbul`, `c8` (non-functional — TypeSpec loads emitter from `dist/*.js` as opaque modules).
- **`src/domain/models/bindings.ts`** deleted (177 lines, zero imports) — dead code, runtime uses `ProtocolBindings` type alias.
- **`src/constants/index.ts`** deleted entirely — all exports (`ASYNCAPI_VERSION`, `ASYNCAPI_VERSIONS`, `DEFAULT_CONFIG`, etc.) had zero importers. Single version source of truth: `ASYNCAPI_SPEC_VERSION` in `document-builder.ts`.
- **Dead state fields removed** — `CorrelationIdData.property`, `OperationTypeData.tags`, `OperationTypeData.description` (never read by the emitter).
- **`@correlationId` decorator `property` parameter** removed (dead — only `location` is used in output).
- **Dead test harness** (`test/integration/harness.ts`) — `IntegrationTestHarness` class that ignored its parameter and returned hardcoded mock objects. Never imported.

### Closed

- GitHub #54: Error type hierarchy — closed as YAGNI (2 throw calls, 14 diagnostics, 5-class hierarchy is overengineering)
- GitHub #160: Bun-Compatible Test Patterns — moot after vitest migration
- GitHub #229: RFC 3986 URL Validation — partially addressed via pragmatic `isValidUrl()`

## [0.1.0-alpha] - 2026-07-14

First alpha release. Full Pareto recovery from analysis paralysis.

### Added

- Nested model `$ref`: named user models/enums/scalars use `$ref: "#/components/schemas/Name"` instead of inlining
- Channel parameters: `{var}` expressions in channel addresses emit `parameters` objects
- Server variables: `{var}` expressions in server hosts emit `variables` objects
- `EmitterOptions` model in `lib/main.tsp` for IDE autocomplete
- Decorator output tests (`test/integration/decorator-output.test.ts` — 8 tests)
- Negative tests (`test/integration/negative-tests.test.ts` — 6 tests)
- Architecture Decision Record: `docs/adr/0001-use-asset-emitter-not-alloy.md`
- Domain Language glossary: `docs/DOMAIN_LANGUAGE.md`
- Roadmap: `ROADMAP.md` with near/mid/long-term vision
- Working examples: `examples/simple/`, `examples/kafka/`, `examples/multi-channel/`
- GitHub Actions CI: clean build + lint + test workflow

### Changed

- Version bumped from `0.0.1` to `0.1.0-alpha`
- Zero `any` types in `emitter.ts` (was 36 explicit `any`)
- `extractValue` uses discriminated union narrowing on `EmitEntity.kind` instead of unsafe casts
- `collectAllStdlibNames` uses `program.getGlobalNamespaceType()` instead of `as any` cast
- `lib.ts` trimmed from 273 to 90 lines — removed dead diagnostics, dead state entries, excessive JSDoc
- `options.ts` simplified from 244 to 4 lines (pure re-export) — all AJV validation removed
- ESLint config rewritten — removed Effect.TS rules that banned throw/try/catch/Promise
- All Effect.TS imports removed from test files
- `@tags`, `@correlationId`, `@header`, `@bindings` now applied to ALL registered messages

### Removed

- Dependencies: `@alloy-js/core`, `@effect/schema`, `@typespec/emitter-framework`, `@typespec/rest`, `asyncapi-validator`, `@types/js-yaml`, `@typespec/versioning`
- `effect`, `vitest`, `@vitest/coverage-v8` from devDependencies (nothing imports them)
- `vitest.config.ts` (tests use `bun:test`)
- 417 stale docs archived to `docs/_archive/`
- Dead test helpers: `clean-test-helper.ts`, `library-test-helper.ts`, `simple-test-helper.ts`, `emitter-test-helpers.ts`
- Dead test files: `options.test.ts`, `security-validation.test.ts`, `options-integration.test.ts`
- 9 dead loose test scripts (non-`.test.ts` files)
- `scripts/` directory (13 dead files)
- `test/fixtures/`, `test/scratch/`, dead `.tsp` files in `test/`
- 14 loose `.tsp` files in `examples/`
- Dead config: `.effect-arch-lint.yml`, `test-baselines.json`, `test-regression-baselines.json`, `test-metrics-history.json`
- 3 bloated GitHub Actions workflows replaced by single clean workflow

### Fixed

- `compileAsyncAPI` test helper now extracts actual output filename from virtual FS instead of hardcoding "asyncapi.yaml"
- `clean:test` script uses `trash` instead of `rm`
- All 5 lint warnings resolved (0 errors, 0 warnings)
