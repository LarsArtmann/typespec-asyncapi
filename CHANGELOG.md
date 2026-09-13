# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Released

- **`0.3.0-beta.1` is live on npm** (tag `v0.3.0-beta.1`, CI run with provenance attestation). Verified from a clean registry install: `pnpm add @lars-artmann/typespec-asyncapi@0.3.0-beta.1` in a fresh project, spec compiles and emits a valid AsyncAPI 3.1 document. Tarball contains only `dist/`, `lib/main.tsp`, README, LICENSE, CHANGELOG (181 files). `dist-tag: latest` points at `0.3.0-beta.1`; the stale `beta` tag still points at `0.2.1-beta`.

### Fixed

- **`@protocol` on a Model now routes to the model's message bindings** — the
  decorator accepts `Operation | Model` targets, but a Model target was
  silently dropped: `attachChannelBindings` looked the name up in the channel
  and operation maps (both miss for models). The `binding:` passthrough now
  becomes the message binding (with `bindingVersion` auto-injected, same
  merge semantics as `@bindings` — explicit fields win per protocol key), and
  config that cannot attach to a message emits the new
  `protocol-model-fields-unplaced` warning instead of disappearing:
  channel/operation-only fields (e.g. kafka `partitions`), binding fields for
  protocols without message bindings (e.g. ws), and bindings for models not
  referenced by any operation (messageId `no-message`). Locked by
  `test/domain/protocol-model-bindings.test.ts` (5 AJV-validated tests).

- **`unknown` and `null` no longer emit `type: "string"` schemas** — the intrinsic mapping's fallback branch over-narrowed both: `prop: unknown` (and `Record<unknown>` values) emitted `{ type: "string" }` even though `unknown` accepts any value, and `T | null` unions emitted a duplicated `{ type: "string" }` variant that could never validate `null`. Now `unknown`/`void`/`never` emit the unconstrained schema `{}` and `null` emits `{ type: "null" }`, so `string | null` correctly composes `anyOf: [{ type: "string" }, { type: "null" }]`. Locked by `test/compliance/type-mapping-completeness.test.ts` (intrinsic types) and `test/external/external-specs.test.ts`.

- **Constraint metadata no longer leaks across usages of the same type** — the asset-emitter interns one shared schema value per declaration (intrinsics included), and the emitter applied `@doc`/constraints to that shared object in place. A doc on any `unknown`-typed property (e.g. the stdlib's `OperationExample.returnType`, "Example response body.") contaminated every other `unknown` in the document. Property schemas are now cloned before constraints are applied.

- **Template instantiations no longer emit dangling `$ref`s** — `Page<User>` in a property, array, union variant, or operation return type previously emitted an unresolvable `$ref: "#/components/schemas/Page"` (the generic template declaration is never a schema). Speakable instantiations are now declared under stable argument-derived names mirroring the asset-emitter's `declarationName`: `Page<User>` → `PageUser`, `Box<int32>` → `BoxInt32`, `Page<Page<User>>` → `PagePageUser`. Unspeakable instantiations (`Box<{ ... }>`, literal/union arguments) are inlined. `Record<K, V>` instantiations inline as `{ type: "object", additionalProperties }` (no junk `RecordStringUser` declarations). `model X extends Base<{ ... }>` with an unspeakable base now composes via an inline `allOf` schema instead of a dangling `$ref` to the template declaration. Operation returns are now emitted, so `op list(): Page<User>` registers message `PageUser` with `payload: { $ref: "#/components/schemas/PageUser" }`. A named model colliding with an instantiation name (e.g. `model PageUser` + `Page<User>`) emits the new `duplicate-schema-name` warning (last declaration wins). Locked by `test/compliance/template-instantiations.test.ts` (8 tests, all validated against the official AsyncAPI 3.1 JSON Schema).

- **`@protocol` config fields now emitted at spec-correct placements** — `partitions`/`replicationFactor` (kafka channel binding, as `partitions`/`replicas`), `consumerGroup` (kafka operation binding `groupId`, emitted as a schema `{ type: "string", const: ... }` per AsyncAPI 3.1), `qos`/`retain` (mqtt operation binding), and `headers`/`queryParams` (ws channel binding, as `headers`/`query`) were previously stored but never emitted. The emitter no longer fabricates default values (partitions=1, consumerGroup="default", sasl credentials) that users never wrote, no longer emits version-only binding shells, and no longer emits bindings at placements the protocol does not define (mqtt/http channel bindings). Raw `binding:` passthrough and unknown top-level config keys route to the operation binding when the protocol has no channel binding (e.g. HTTP). `mqtt5` now normalizes to the `mqtt` binding key.

### Added

- **Golden-file locks for named unions, template instantiations, and protocol bindings** — `test/golden/lock-fixtures.test.ts` byte-locks three outputs that previously had no golden: `oneOf` over all-Model union variants (`TextContent | ImageContent`), argument-derived instantiation declarations (`Page<User>` → `PageUser` with `$ref` chain), and `@protocol`-derived channel/operation bindings across kafka (partitions/replicas), http (operation `method` passthrough), and ws (channel `query`). Complements the existing `server-security` golden.

- **`examples/schema-extensions` (14th example)** — runnable showcase for `@jsonSchemaExtension` (pattern/minimum/multipleOf/examples/additionalProperties on models and properties), `@encodedName` (wire-format key `Payment-Id`), and `@extension` at the document root, operation, and message levels. Exercised by `pnpm run check-examples`.

- **`@extension("x-...", value)` decorator (30th) — AsyncAPI spec extensions** — namespaces extend the document root, operations extend the operation object, models extend the message object. Mirrors `@typespec/openapi` syntax; keys must start with `x-` (else `invalid-extension-key` warning); repeatable with merge semantics. The AsyncAPI 3.1 schema ignores `x-` keys, so extended documents still validate. 5 AJV-validated compliance tests.

- **`@encodedName` wire-format property renaming** — the core TypeSpec decorator `@encodedName("application/json", "wireName")` now drives `properties` keys, `required` entries, and `discriminator` values in emitted schemas. MIME-subtype resolution (e.g. `application/merge-patch+json`) is handled by the compiler's `resolveEncodedName`. 5 AJV-validated compliance tests.

- **`@jsonSchemaExtension(key, value)` decorator (29th)** — attaches arbitrary JSON Schema keywords (`x-` extensions, `multipleOf`, vendor keywords) to Model, ModelProperty, Union, Enum, and Scalar schemas. Repeatable with merge semantics (outermost same-key application wins); applied inline and as `$ref` siblings; object/array values via `#{}`/`#[]` literals. Invalid keys (empty, spaces) emit `invalid-json-schema-extension-key` and are skipped. 7 compliance tests, all AJV-validated.

- **Thirteen runnable examples with a CI example gate** — five new examples (`streetlights-mqtt`, `kafka-orders` with Kafka binding placements + scramSha512 security, `websocket-chat` with headers/correlation/reply, `reusable-components` showcasing all `components.*` slots, `split-schemas` multi-file output) join the eight existing ones as pnpm workspace projects. `pnpm run check-examples` compiles every example with zero diagnostics and validates each emitted document against the official AsyncAPI 3.1.0 JSON Schema; CI enforces it on every push.

- **`asyncapi-id` emitter option** — sets the AsyncAPI 3.1 root `id` identifier (typically a URN) from tspconfig.yaml; omitted when unset.

### Changed

- **Test suite: remaining hardcoded binding-version strings replaced with `LATEST_BINDING_VERSIONS`** — the ~34 leftover fixture/assertion sites across 9 files (compliance reusable-components and protocol-bindings, integration new-protocol-bindings / multi-namespace-isolation / reusable-components-negative, golden reusable-components, e2e realworld-ecommerce and multi-protocol-comprehensive, unit binding-placement and binding-field-validation) now derive versions from the generated registry, eliminating version-string drift. Deliberate older-than-latest passthrough fixtures (e.g. kafka `0.4.0` explicit-version preservation tests) are kept as literals on purpose.

- **`decorator-functionality.test.ts` now asserts decorator OUTPUT, not just presence** — the multi-`@protocol` test locks amqp channel-binding passthrough (exchange/routingKey/deliveryMode + bindingVersion) and mqtt operation-binding passthrough (topic/qos/retain) with placement routing; the JWT and OAuth2 `@security` tests assert `components.securitySchemes` shape (bearerFormat, per-flow `tokenUrl`/`authorizationUrl`, normalized `availableScopes`) plus the `@operationSecurity` `$ref` on the operation.

- **`protocol-binding-integration.test.ts` headline tests deliver their promise** — the Kafka/WebSocket/HTTP "with bindings" tests now configure `@protocol` on their fixtures and assert the emitted binding objects (spec-correct placements, registry-sourced `bindingVersion`) instead of only checking server/channel presence.

- **Property suite P2/P5 now assert what their names claim** — P2 verifies the exact emitted constraint values and their ordering (minimum/maximum, minLength/maxLength, and — previously generated but never rendered — minItems/maxItems on array fields); P5 verifies the split-schemas rewrite itself: no unrewritten `#/components/schemas/*` refs in the main document, every `schemas/<Name>` ref resolves to an emitted file, and every ref inside a split file resolves within it. Generators now produce model→model `$ref` graphs and array fields, so P1/P3/P5/P6 exercise multi-model documents.

- **Editor tsserver scoping for `test/`** — new `test/tsconfig.json` (extends `tsconfig.test.json`) stops editors from inferring a default project for test files (the source of ~1,400 stale `Cannot find name 'describe'` diagnostics; `one-var` was already off in `.oxlintrc.json`). Removed the unused `test/utils/cli-test-helpers.ts` (its only consumer, the fake-CLI test, was deleted in the previous cleanup).

- **Test suite typechecked and hardened** — new `tsconfig.test.json` + `pnpm run typecheck:test` (now a `verify` gate stage) took the test suite from never-typechecked to 0 errors, surfacing real bugs: a fake `validateAsyncAPIObjectComprehensive` validator (checked only `asyncapi`+`info` presence) replaced by real AJV via `validateAsyncAPIDocument()`; a no-op severity filter in `studio-compatibility.test.ts` (spectral's `DiagnosticSeverity` is a numeric enum — `=== "error"` never matched); spec-invalid kafka/ws binding fixtures repaired to placement-correct shapes. `protocol-binding-integration.test.ts` now zero-error-diagnostics + whole-document-AJV-validates every spec; `external-specs.test.ts` bare `not.toBeNull()` checks replaced with structural assertions (inheritance `allOf` chains, enum values, union `oneOf` refs, defaults, `Record` mappings); `server.test.ts` protocol coverage derived from `PROTOCOL_LIST` (all 22) plus alias-normalization cases; conflict diagnostics (`conflicting-default-content-type`, `conflicting-api-version`) locked by tests; dead `modelsPerChannel` benchmark option removed.

- **WebSocket/MQTT suite rewritten with real assertions** — `test/domain/protocol-websocket-mqtt.test.ts`: 1515 lines / 50 fake tests (every assertion was only `asyncapi === "3.1.0"`) → 14 real tests locking `websocket`/`wss`/`mqtt5` normalization, exact auto-injected bindingVersions (ws 0.1.0, mqtt 0.2.0), mqtt `qos`/`retain`/`clientId`/`cleanSession`/`keepAlive`, and the ws-channel-only vs mqtt-server/operation/message placement matrix, including the misplacement warning (−1272 lines). (`fded21d`)
- **Security suites consolidated to spec-exact checks** — five fantasy suites (3208 lines, 81 tests: HOBA/VAPID/AWS-SigV4/MAC/risk-based-auth bearer clones) → 13 AJV-validated tests in `test/domain/security-schemes.test.ts` asserting `in`/`name`/`scheme`/`bearerFormat`/`availableScopes` maps across all four OAuth2 flows, `openIdConnectUrl`, SASL types, X509, and `@operationSecurity` `$ref`s. Also corrected the AGENTS.md claim about `apiKey` locations (AsyncAPI 3.1 `apiKey` allows `in: user|password` only; header/query/cookie is `httpApiKey`). (`c816637`)
- **fast-check property suite** — 6 invariants × 20 seeded runs over randomly generated specs: AJV always passes, consistent constraints, `~1`/`~0`-aware `$ref` resolution, type/const shape, split-schemas graph validity, byte-identical determinism. `FC_SEED` env reproduces counterexamples exactly. (`b2c2a5c`)
- **asset-emitter containment enforced** — ESLint `no-restricted-imports` bans `@typespec/asset-emitter` in all of `src/` except the three-file schema seam (`schema-generator.ts`, `schema-emitter.ts`, `extract-value.ts`); the 11 document builders are compiler-only by construction. (`8669e9b`)

## [0.2.1-beta] - 2026-08-21

### Added

- **Named-union metadata as public contract** — Named unions now emit `@doc`/`@summary` as `description`/`title`, consistent with enums/scalars via the shared `declareSchema` path. Locked in by the "named union metadata propagation" compliance suite in `test/compliance/polymorphism.test.ts` (2 tests). Previously silently dropped; no test pinned the old behavior. (`7f6c9b1`, `2e2ef0b`)
- **`scripts/regenerate-golden.ts`** — one-command golden-file regeneration for all golden fixtures; documented in AGENTS.md gotchas. (`7f6c9b1`)
- **`test/unit/extract-nested-config.test.ts`** (9 tests) — closes the coverage-gate gap on `extract-nested-config.ts` (63.6% → gate-passing). (`b6da64c`)
- **Benchmark time budget** — `test/benchmark/performance.test.ts` now fails on compile-time regressions (15s/30s tiers) instead of running unbounded. (`b6da64c`)
- **Split-schemas regression tests** — 2 tests locking that `split-schemas` keeps `components.tags`/`operationTraits`/`bindings` when extracting schemas. (`7f6c9b1`)
- **Review artifacts** — `docs/reviews/2026-08-14_full-code-review.html`, `docs/planning/2026-08-14_21-20_POST-REVIEW-PARETO-PLAN.html`, rewritten `TODO_LIST.md` (33 ranked items). (`2e2ef0b`)
- **`normalizeTagItem` empty-string rejection** — `normalizeTagItem("")` and `normalizeTagItem(#{ name: "" })` now return `null` (producing `invalid-tags-config` diagnostic) instead of silently emitting `{ name: "" }` in AsyncAPI output. 2 negative tests.
- **Golden file for channel binding output** — `test/golden/channel-bindings.test.ts` + `channel-bindings.expected.yaml` — locks the output format for `@useChannelBinding` `$ref` chains and `components.channelBindings` population.
- **Golden file for polymorphism output** — `test/golden/polymorphism.test.ts` + `polymorphism.expected.yaml` — locks `allOf` inheritance, `discriminator`, and `oneOf` union output format.
- **`@useChannelBinding` JSDoc documentation** — Decorator now has inline documentation for IDE tooltip display. — New decorator (`target: Operation, name: valueof string`) applies a reusable binding to an operation's channel, populating `components.channelBindings` and setting `channel.bindings` to a `$ref`. Designed for the AsyncAPI 3.1 `components.channelBindings` map. 3 tests (basic population, undefined reference safety, multiple channels).
- **Richer trait field extraction** — `@operationTrait` now extracts `security`, `tags`, and `bindings` (in addition to existing string fields). `@messageTrait` now extracts `summary`, `tags`, `bindings`, `headers`, and `correlationId`. All fields use the existing `extraPicker` pattern via `pickDefined()`. 4 tests.
- **`@parameter` location validation** — New diagnostic code `invalid-parameter-location` (warning) when `location` doesn't follow the `$message.{header|payload}#/...` runtime-expression pattern. `$parameter` refactored from `namedConfigDecorator` to a standalone function to add validation without exceeding max-params. 2 tests (valid expression accepted, malformed warned).
- **`@tags` rich tag objects** — `@tags` now accepts mixed arrays of strings and tag objects (`#{ name, description?, externalDocs? }`). The decorator declaration broadened from `valueof string[]` to `valueof (string | Record<unknown>)[]`. `storeTags` refactored to merge `Tag[]` by name instead of deduplicating string arrays. 3 tests (tag with description, tag with externalDocs, mixed array).
- **Diagnostic codes increased to 25** (19 error + 6 warning) — added `invalid-parameter-location` for `@parameter` runtime-expression validation.
- **Decorator count increased to 26** — `@useChannelBinding` joins the 25 existing decorators declared in `lib/main.tsp`.
- **`info.tags` population** — All unique tags from `@tags` decorator state are now collected into `info.tags` as a `Tag[]` array (deduplicated by name). Root-level document `tags` removed from `DocumentBody` — AsyncAPI 3.1 schema does NOT allow tags at the root level (only on `info`, `components`, channels, operations, messages, servers, and traits). 3 tests.
- **`@discriminator` auto-required enforcement** — The discriminator property name is now automatically added to the `required` array when `@discriminator` is present, per AsyncAPI 3.1 spec: "the property name MUST be in the required property list." Uses `??=` pattern to initialize `required` if needed. 2 tests (required already present, optional property auto-added).
- **Channel and server tags** — `@tags` on operations now propagates to channels via new `channelTags` context map. `@tags` on namespaces propagates to servers. Both follow the existing `channelDocs`/`channelSummaries` plumbing pattern. 2 tests.
- **`MessageObject.examples` population** — `@example` on `@message`-decorated models now populates the message-level `examples` field as `{ payload: serializedValue }[]`, in addition to the existing schema-level `examples`. Uses `serializeValueAsJson()` for correct serialization. 1 test.
- **`Tag.externalDocs` field** — Added `externalDocs?: ExternalDocumentationObject` to the `Tag` interface per AsyncAPI 3.1 spec. Ready for future `@tags` decorator enrichment.
- **Message `title` normalization** — Both message population paths (`mergeExplicitMessages` and `registerMessage`) now consistently set `title: msgData?.title ?? messageName`. Previously `registerMessage` only set `title` conditionally. 1 test for auto-registered messages.
- **Build fix: tsx → bun for .ts scripts** — `tsx` requires a real Node.js runtime but this system has Bun masquerading as `node`. Changed `package.json` scripts to use `bun run scripts/*.ts` (handles TypeScript natively) while keeping `pnpm exec tsc` for compilation.
- **Golden file test for reusable components** — `test/golden/reusable-components.test.ts` (3 tests) + `reusable-components.expected.yaml` — locks the output format for operationTraits, messageTraits, correlationIds, operationBindings, and tags.
- **`@useBinding` on Namespace with no servers** — Verified no crash when `@useBinding` targets a namespace with no servers; `components.serverBindings` still populated. 1 test.
- **Channel propagation verified for all discovery paths** — Confirmed `discoverDecoratedOps` iterates ALL `state.channels` entries, covering both `@publish`/`@subscribe` and channel-only operations. 2 tests for channel-only and bare operations.
- **Reusable AsyncAPI 3.1 components (`components.*`)** — 9 new decorators for reusable component definitions and references: `@operationTrait`, `@messageTrait`, `@useOperationTrait`, `@useMessageTrait`, `@parameter`, `@reusableCorrelationId`, `@useCorrelationId`, `@reusableBinding`, `@useBinding`. Populates `components.operationTraits`, `components.messageTraits`, `components.parameters`, `components.correlationIds`, `components.operationBindings`, `components.messageBindings`, and `components.serverBindings`. Inline approaches (e.g. `@correlationId` on a model) continue to work unchanged. New `src/builders/components-builder.ts` (`buildReusableComponents` + `applyReusableRefs`) and `src/use-decorators.ts` (`makeUseDecorator` factory). 14 compliance tests + 11 negative tests, all AJV-validated against the official AsyncAPI 3.1 JSON Schema.
- **`components.tags` population** — `@tags` decorator state is now collected into a reusable `components.tags` map (deduplicated by name) via new `src/builders/tag-builder.ts`. 6 compliance tests.
- **Parameter `enum`/`default`/`examples` extraction** — `@parameter` now extracts these fields in addition to `description`/`location`. `schema` is intentionally NOT supported (AsyncAPI 3.1 `parameter.json` has `additionalProperties: false`). `ParameterConfigData extends ParameterObject` eliminates field duplication.
- **Server bindings via `@useBinding` on Namespace** — `@useBinding` target broadened from `Operation | Model` to `Operation | Model | Namespace`. A Namespace target applies the binding `$ref` to all servers defined on that namespace, populating `components.serverBindings`.
- **Bun → pnpm migration** — Package management and script running migrated from Bun to pnpm. `tsx` added for `.ts` script execution. `pnpm-lock.yaml` replaces `bun.lock`. `pnpm run verify` runs the full gate (`build + lint + test + coverage:gate + duplicate`). `bun test --coverage` is retained as the sole Bun dependency — the TypeSpec compiler loads the emitter from `dist/` via a virtual filesystem that only Bun's native runtime-level coverage can instrument (vitest V8, istanbul, and c8 all fail to see these files).
- **Strict lint configuration** — ESLint upgraded from `recommended` to `strict` + `strictTypeChecked` (typescript-eslint); all `warn` rules promoted to `error`; added `no-misused-promises` and `require-await`. tsconfig `noUncheckedIndexedAccess: true` enabled (array/record accesses now return `T | undefined`). oxlint complexity thresholds ratcheted down (max-lines 500→400, max-lines-per-function 350→200, max-statements 150→80, complexity 100→50) and `eqeqeq` enforced. Pre-commit `--max-warnings` ratcheted from 105 to 0.
- **Diagnostic codes increased to 24** (19 error + 5 warning) — added `invalid-trait-config` and `invalid-parameter-config` for reusable-component validation. All compile-time validated via `$lib.reportDiagnostic()` with `keyof typeof $lib.diagnostics`.
- **Decorator count increased to 25** — the 9 reusable-component decorators join the 16 existing emitter decorators declared in `lib/main.tsp`.
- **Table-driven constraint mapping** — Replaced 10 structurally identical `if (val !== undefined) schema.xxx = val` blocks in `applyConstraints()` with a single `CONSTRAINT_TABLE` array + loop. Adding a new validation constraint now requires one table entry instead of a 4-line if-block. Also eliminated the last duplication clone source.
- **`encodeAs` parameter wired** — `serializeValueAsJson()` now receives `@encode` data via `resolveEncode()` helper in both `applyMetadata` (examples) and `applyConstraints` (defaults). Ensures correct serialization for `@encode`-decorated types. 3 smoke tests.
- **Operation `summary` from `@summary`** — `getSummary()` on operation types now maps to the operation's `summary` field (previously only `description` was set from `@doc`). 1 test.
- **Channel `summary` from `@summary`** — `@summary` on channel-decorated operations now populates the channel's `summary` field via a new `channelSummaries` context map. 1 test.
- **Message `title` from `@message` decorator** — The `@message(#{title: "..."})` decorator's `title` value now populates the message's `title` field (in addition to `name`). 2 tests.
- **Complex default value tests** — `@default` now tested with array (`#["a", "b"]`), enum member (`Status.Active`), and object (`#{ key: "val" }`) defaults. 3 tests.
- **`pnpm run verify` alias** — Single command runs `build + lint + test + coverage:gate + duplicate` in sequence. Prevents the duplication-gate-was-red problem.
- **@encode serialization smoke tests** — 3 tests verifying `@encode(string)` on numeric types doesn't break example/default serialization.
- **Duplication gate restored to 0 clones** — Fixed 6 jscpd clones: 5 in `constraint-mapper.ts` (function signature duplication from `apply*` helpers — eliminated by consolidating into `applyMetadata`/`applyConstraints` with table-driven validation), 1 in `binding-field-validator.ts` (`.filter()` pattern — replaced with `for...of` + `continue`).
- **Default value (`=` syntax) → `default` mapping** — TypeSpec core `=` syntax (`prop: Type = value`) now maps to JSON Schema `default` keyword via `applyDefault()` in `constraint-mapper.ts`. Uses `serializeValueAsJson()` for correct serialization. Applied as an annotation keyword (before the `$ref` skip), so it appears as a `$ref` sibling. 5 tests.
- **`scalarDeclaration` metadata support** — `@summary`, `#deprecated`, `@doc`, `@example` now correctly applied to user-defined scalar declarations (`scalar UserId extends int32`). Extracted `declareSchema()` helper to eliminate duplication between `scalarDeclaration` and `enumDeclaration`. 2 tests.
- **`@visibility` edge-case tests** — `Lifecycle.Delete` and `Lifecycle.Query` confirmed silently ignored (no JSON Schema equivalent). `@visibility(Lifecycle.Create, Lifecycle.Update)` confirmed maps to `writeOnly`. 3 tests.
- **Duplication baseline restored to 0 clones** — Fixed 3 jscpd clones introduced by allOf/oneOf/discriminator work: extracted `composeUnionVariants()` helper (union ↔ typeToSchema duplication), refactored `union()` to use `refOrFallback()` (variant mapping duplication), used `.filter()` pattern in binding-field-validator and generate-binding-specs (bindingVersion skip duplication).
- **`allOf` for model inheritance** — `model Derived extends Base` now emits `allOf: [{ $ref: "#/components/schemas/Base" }]` instead of flattening base properties into the derived model. Each model only has its own `properties` and `required` fields. Multi-level chains produce linked `allOf` refs (A → B → C). Enables proper polymorphic inheritance patterns.
- **`@discriminator` → `discriminator` mapping** — `getDiscriminator()` from TypeSpec compiler mapped to JSON Schema `discriminator` keyword on models. Full polymorphic pattern supported: `@discriminator("kind")` on base model + `allOf` on subtypes with discriminator value override (`kind: "dog"` → `{ const: "dog" }`).
- **`oneOf` for model-variant unions** — Unions where all variants are Model types now emit `oneOf` instead of `anyOf` (exclusive composition, matching TypeSpec's exclusive union semantics). Mixed-type unions (`string | int32`) and string-literal unions retain `anyOf` and `enum` respectively. Named model variants now emit proper `$ref` pointers (was a pre-existing bug emitting empty `{}` objects).
- **`not` keyword** — Added `not?: JsonSchema` to the `JsonSchema` interface for JSON Schema negation support.
- **Polymorphism compliance tests** (`test/compliance/polymorphism.test.ts`, 13 tests) — allOf inheritance (empty body, property override, metadata, 4-level chain), discriminator models (basic, full polymorphic pattern, absence verification), oneOf unions (inline, named, mixed stays anyOf, string-literal stays enum, 3-model), `not` type availability. All AJV-validated.
- **Schema reference resolver extracted** (`src/schema-ref.ts`, 43 lines) — `refForNamedType()` moved from private method in `schema-emitter.ts` to standalone module. Resolves named TypeSpec types to `$ref` pointers.
- **`@summary` → `title` mapping** — `getSummary()` from TypeSpec compiler mapped to JSON Schema `title` keyword. Works on properties, models, and enums.
- **`@example` → `examples` mapping** — `getExamples()` + `serializeValueAsJson()` from TypeSpec compiler mapped to JSON Schema `examples` array. Handles string, numeric, boolean, array, and object example values.
- **`@visibility` → `readOnly`/`writeOnly` mapping** — `getVisibilityForClass()` with Lifecycle enum mapped to JSON Schema: `Read` only → `readOnly: true`, `Create`/`Update` only → `writeOnly: true`, both or neither → no keyword.
- **Info object spec compliance fields** — `info.contact`, `info.license`, `info.termsOfService`, `info.externalDocs` now supported via emitter options. Added `ContactObject`, `LicenseObject`, `ExternalDocumentationObject` types.
- **Constraint decorator tests expanded** (`test/compliance/constraint-decorators.test.ts`, 38 tests total, was 15) — added `$ref` constraint-skipping tests, `#deprecated` on `$ref` properties, negative constraint values, `@format` override, enum deprecation, pattern with special regex chars, multiple deprecated models cross-contamination, `@summary` (4 tests), `@example` (5 tests), `@visibility` (5 tests).
- **Info object compliance tests** (`test/compliance/info-object.test.ts`, 6 tests) — contact, license, termsOfService, externalDocs, absent fields, all-fields-simultaneously.
- **New protocol bindings integration tests** (`test/integration/new-protocol-bindings.test.ts`, 5 tests) — solace, anypointmq, ros2 bindings compiled through the full emitter pipeline.
- **`compileAndValidate` and `compileAndValidateOrThrow` accept emitter options** — enables testing emitter-option-driven features.
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

- **Lint tools pinned as devDependencies** — oxlint 1.78.0 and jscpd 4.0.9 now resolve from `node_modules/.bin`, not unpinned system binaries. GitHub CI (`ubuntu-latest`) previously failed `pnpm run verify` with `command not found`; local gates were exposed to host tool drift. (`b6da64c`)
- **`file-type` emitter option narrowed** — accepts `"json" | "yaml" | "yml"` string or `{ format, pretty, indent }` object; `pretty`/`indent` are now honored instead of silently ignored. (`7f6c9b1`)
- **Dead code remediation** — `src/state-writers.ts` reduced from 434→329 lines (removed 5 never-called `store*Trait`/`store*Parameter` wrappers; `storeMulti` is used directly) and `src/minimal-decorators.ts` from 409→328 lines (inlined `applyStringIdDecorator` into `makeStringIdDecorator`). 5 unused type imports cleaned.
- **BREAKING: Model inheritance uses `allOf` instead of property flattening** — `model Derived extends Base` previously flattened all base properties into the derived schema. Now emits `allOf: [{ $ref: "#/components/schemas/Base" }]` with only the derived model's own properties. Consumers parsing flattened output must update to resolve `allOf` refs.
- **BREAKING: Union of model types emits `oneOf` instead of `anyOf`** — TypeSpec unions are exclusive; `oneOf` correctly reflects this. Mixed-type unions (`string | int32`) still use `anyOf`.
- **`@typespec/*` moved to `peerDependencies`** — `@typespec/compiler`, `@typespec/asset-emitter`, `@typespec/versioning` are now peer dependencies (matching TypeSpec emitter convention). Only `yaml` remains as a regular dependency. All three are also in `devDependencies` for local development.
- **Metadata application consolidated** — `applyDocDescription` moved from `schema-emitter.ts` to `constraint-mapper.ts`. New `applyMetadata()` convenience function calls doc, deprecated, summary, and examples in one call. `modelDeclaration` and `enumDeclaration` now use single `applyMetadata` call instead of 4 separate calls. `collectModelProperties` inline doc code removed (handled by `applyConstraints`). `schema-emitter.ts` reduced from 335 to 314 lines.
- **`ParsedAsyncAPIDocument.asyncapi` tightened** from `string` to `"3.1.0"` literal type — makes impossible states unrepresentable.
- **Protocol count updated to 22** — `solace`, `anypointmq`, `ros2` added to `PROTOCOLS` array in `constants/protocols.ts` (were already in `generated-bindings.ts` but missing from the protocol validation list).
- **BDD tests rewritten** — Dead Cucumber infrastructure removed. `user-behaviors.test.ts` rewritten with 23 real end-to-end behavior tests covering channels, protocol bindings, path templates, security, servers, messages, invalid config, document structure, and namespace bindings.
- **`@typespec/versioning`** added as a runtime dependency.
- **Shared module JSDoc rewritten** — honest two-tier split: protocol-neutral exports (`JsonSchema`, `SchemaRef`, `SchemaMap`, `extractValue`, `intrinsicToSchema`) vs AsyncAPI-bound convenience (`generateSchemas`, `AsyncAPISchemaEmitter`). Old doc falsely claimed "without pulling in AsyncAPI-specific types."
- **Test imports redirected through public barrel** — all shared-module test imports now go through `src/shared/index.js`, exercising the barrel rather than internal module paths.
- **`JsonSchema.items` type broadened** from `JsonSchema` to `JsonSchema | JsonSchema[]` to support JSON Schema tuple validation.
- **Builder architecture** — `buildAsyncAPIDocument()` split into 8 builder files under `src/builders/` (operation-discovery, message-builder, operation-builder, channel-builder, server-builder, security-builder, shared-utils, types). Was a 315-line monolith.

### Fixed

- **Split-schemas no longer drops non-schema components** — `splitSchemas()` deleted the whole `components` object when only `schemas` was extracted, losing `tags`/`operationTraits`/`bindings` from split output. (`7f6c9b1`)
- **Stale livesession/xyd golden file** — fixture was synced with an upstream rename but the golden never regenerated; test had failed since Aug 6. Regenerated via new `scripts/regenerate-golden.ts`. (`7f6c9b1`)
- **Schema `$ref` RFC 6901 escaping** — `refForNamedType()` reuses `refSchema()` so `~` and `/` in names escape consistently (`~0`/`~1`). (`7f6c9b1`)
- **5 tautological tests + 1 tautological suite** — `test/validation/protocol-bindings.test.ts` deleted (tested its own helper with factually wrong claims: `bindingVersion "0.5.0 standard"` on all protocols, invalid `websocket` binding key); remaining tautologies rewritten with real, empirically verified assertions. (`b6da64c`)
- **Security scheme format corrected to AsyncAPI 3.1** — `components.securitySchemes` entries now use the 3.1 format (`type` field with correct scheme types) instead of the deprecated 2.x format.
- **CI workflow broken by pnpm migration** — `.github/workflows/ci.yml` still used `bun install`/`bun run`/`bun test` after the project migrated to pnpm and deleted `bun.lock`, so every CI run failed at `bun install --frozen-lockfile`. Rewritten to install via pnpm, run `build`/`lint`/`test`/`coverage:gate`/`duplicate` through pnpm, and keep Bun only for the coverage step (which requires Bun's native runtime coverage). Added `pnpm/action-setup` + `actions/setup-node` (cache: pnpm) alongside the existing `oven-sh/setup-bun`.
- **Protocol split-brain bug** (critical) — `solace`, `anypointmq`, `ros2` existed in `generated-bindings.ts` (binding specs) but were missing from `PROTOCOLS` in `constants/protocols.ts`. The `@protocol` decorator rejected them as `unsupported-protocol` while the binding validator accepted them. Fixed by adding all three to the `PROTOCOLS` array.
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
