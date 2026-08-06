# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## Medium Impact / Short-term

| # | Task | Impact | Effort | Evidence |
|---|------|--------|--------|----------|
| 1 | Populate `components.tags` from `@tag` state — collect unique tags into reusable `components.tags` map | Medium | 2-3h | `src/document-builder.ts` — `ComponentsObject` type supports `tags?: Record<string, Tag \| Ref>` but `assembleDocument()` doesn't populate it. `@tag` decorator state exists in `state.tags`. |

## Low Impact / Long-term

| # | Task | Impact | Effort | Evidence |
|---|------|--------|--------|----------|
| 2 | Populate remaining `components.*` — parameters, correlationIds, operationTraits, messageTraits, reusable bindings. Current inline approach (correlation IDs on messages, tags on operations) is valid AsyncAPI 3.1. Reusable components require new decorator infrastructure (e.g. `@trait`, `@reusableCorrelationId`) or an extraction strategy. | Low | 4-6h | AsyncAPI 3.1 spec supports these; emitter uses inline placement instead |
| 3 | OpenAPI 3.x cross-emitter type sharing — `src/shared/` module exports are complete and tested (25 tests, incl. barrel public-API contract). No external consumer exists yet. Building a separate OpenAPI emitter is out of scope. | Low | 4-6h+ | `src/shared/index.ts` exports `JsonSchema`, `SchemaMap`, `generateSchemas`, `extractValue`, `intrinsicToSchema`, `AsyncAPISchemaEmitter`. |

> **Completed items (see CHANGELOG [Unreleased]):**
>
> - ~~Table-driven constraint mapping~~ — 10 if-blocks → `CONSTRAINT_TABLE` + loop
> - ~~Pass `encodeAs` to `serializeValueAsJson`~~ — `resolveEncode()` helper in `applyMetadata` and `applyConstraints`
> - ~~Test `@default` with complex value types~~ — array, enum, and object defaults tested
> - ~~Populate message `title`~~ — from `@message` decorator's `title` field
> - ~~Populate operation `summary`~~ — from `@summary` decorator via `getSummary()`
> - ~~Channel `summary` and `description` fields~~ — `@summary` → channel `summary`, `@doc` already → channel `description`
> - ~~Update stale source file header comments~~ — constraint-mapper (11→16 mappings), test file (full decorator list)
> - ~~Add `bun run verify` alias~~ — build + lint + test + coverage:gate + duplicate in one command
> - ~~Duplication baseline restored to 0 clones~~ — 6 clones eliminated (5 in constraint-mapper, 1 in binding-field-validator)
> - ~~Add `allOf` support for model inheritance~~ — emits `allOf: [{ $ref: "..." }]` for `extends`
> - ~~Implement `oneOf` / `not` for union types~~ — model-variant unions emit `oneOf`; `not` field added to type
> - ~~Add `@discriminator` → `discriminator` mapping~~ — polymorphic type handling via `getDiscriminator()`
> - ~~Fix union variant `$ref` for named models~~ — was emitting empty `{}` objects instead of `$ref`
> - ~~Extract `refForNamedType` to `schema-ref.ts`~~ — schema-emitter.ts reduced from 386→359 lines
> - ~~Map 16 constraint/metadata mappings to JSON Schema keywords~~ — `src/constraint-mapper.ts` (@minValue, @maxValue, exclusive variants, @minLength/@maxLength, @pattern, @format, @minItems/@maxItems, #deprecated, @summary→title, @example→examples, @visibility→readOnly/writeOnly, default values→default, @doc→description)
> - ~~Fix `scalarDeclaration` metadata drop~~ — `@summary`/`#deprecated` on user-defined scalars were silently dropped; extracted `declareSchema()` helper
> - ~~Restore zero-clone duplication baseline~~ — multiple rounds of clone elimination
> - ~~Add info.contact, info.license, info.termsOfService, info.externalDocs~~ — emitter options wired
> - ~~Consolidate metadata application~~ — `applyMetadata()` in `constraint-mapper.ts`
> - ~~Fix protocol split-brain bug~~ — solace/anypointmq/ros2 added to `PROTOCOLS`
> - ~~Move @typespec/\* to peerDependencies~~
> - ~~Make `ParsedAsyncAPIDocument.asyncapi` a literal type~~
> - ~~Delete `linter-strategy.test.ts`~~ — anti-pattern removed
> - ~~Rename `generator-compatibility.test.ts` → `document-structure.test.ts`~~
> - ~~Remove dead `nullable` and `xml` from `JsonSchema`~~
> - ~~Fix misleading `stdlib-helpers.test.ts` comment~~
> - ~~TypeSpec `@versioned` integration~~ — `getVersion()` reads enum for `info.version`
> - ~~AsyncAPI Studio compatibility~~ — 9 tests via `@asyncapi/parser`
> - ~~BDD test step definitions~~ — Dead Cucumber removed; 23 real BDD tests
> - ~~ESLint/oxlint consolidation~~ — Verified zero conflicts
> - ~~Binding protocol gap fix~~ — solace/anypointmq/ros2 accepted
> - ~~Tuple of named models fix~~ — Valid JSON Schema with `$ref`
> - ~~Zero-clone duplication baseline~~ — 68→0 clones, 0% threshold
