# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## High Impact

| #   | Task                                                                                                                | Impact | Effort | Evidence                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ---------------------------------------------------------------------------------------------------------- |
| 1   | Add `allOf` support for model inheritance (declared in `JsonSchema` but never generated)                            | Medium | 1-2h   | `src/schema-emitter.ts` — `allOf` field exists in type but emitter never emits it                          |

## Medium Impact

| #   | Task                                                                                                            | Impact | Effort | Evidence                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------- | ------ | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 2   | Implement `oneOf` / `not` for union types — some unions should be `oneOf` instead of `anyOf`                    | Medium | 1-2h   | `src/schema-emitter.ts` — `union()` always emits `anyOf`                                                                          |
| 3   | Add `@discriminator` → `discriminator` mapping — polymorphic type handling                                      | Medium | 2-4h   | TypeSpec `getDiscriminator()` available; polymorphism infrastructure needed first                                                 |

## Low Impact / Long-term

| #   | Task                                                                                                                                                                         | Impact | Effort | Evidence                                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4   | OpenAPI 3.x cross-emitter type sharing — `src/shared/` module exports are complete and tested (25 tests, incl. barrel public-API contract). No external consumer exists yet. | Low    | 4-6h   | `src/shared/index.ts` exports `JsonSchema`, `SchemaMap`, `generateSchemas`, `extractValue`, `intrinsicToSchema`, `AsyncAPISchemaEmitter`. Building a separate OpenAPI emitter is out of scope. |
| 5   | Populate remaining `components.*` — parameters, correlationIds, tags, operationTraits, messageTraits, reusable bindings                                                       | Low    | 4-6h   | AsyncAPI 3.1 spec supports these; emitter doesn't populate them yet                                                                                                                            |
| 6   | Channel `summary` and `description` fields — currently only address is populated                                                                                              | Low    | 1h     | `src/builders/channel-builder.ts` — CommonMetadata fields not populated from `@doc`                                                                                                             |

> **Completed items (see CHANGELOG [Unreleased]):**
>
> - ~~Map 14 TypeSpec constraint/metadata decorators to JSON Schema keywords~~ — `src/constraint-mapper.ts` (@minValue, @maxValue, exclusive variants, @minLength/@maxLength, @pattern, @format, @minItems/@maxItems, #deprecated, @summary→title, @example→examples, @visibility→readOnly/writeOnly)
> - ~~Add info.contact, info.license, info.termsOfService, info.externalDocs~~ — emitter options wired
> - ~~Consolidate metadata application~~ — `applyMetadata()` in `constraint-mapper.ts`
> - ~~Fix protocol split-brain bug~~ — solace/anypointmq/ros2 added to `PROTOCOLS`
> - ~~Move @typespec/* to peerDependencies~~
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
