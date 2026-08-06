# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## Medium Impact / Short-term

| #   | Task                                                                                                                    | Impact | Effort | Evidence                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | Table-driven constraint mapping — reduce `applyConstraints()` 10 if-blocks to a loop over `{ getter, keyword }[]` table | Medium | 1-2h   | `src/constraint-mapper.ts:140-191` — 10 structurally identical `getXxx → if (!==undefined) → schema.xxx = val` blocks     |
| 2   | Pass `encodeAs` to `serializeValueAsJson` in `applyDefault` and `applyExamples`                                         | Medium | 30min  | `src/constraint-mapper.ts:81,91` — optional `encodeAs` param dropped; `@encode`-decorated types may serialize incorrectly |
| 3   | Test `@default` with complex value types — objects, arrays, enums                                                       | Medium | 1h     | Only scalar defaults (string/int/boolean) tested. `Config = #{...}` and `string[] = #[...]` paths untested                |
| 4   | Populate message `title` — from `@message` decorator or model name                                                      | Medium | 1h     | `src/builders/message-builder.ts` — `title` field never set                                                               |
| 5   | Populate operation `summary` — `@doc` goes to `description` but `summary` is never set                                  | Medium | 1h     | `src/builders/operation-builder.ts` — `summary` field absent                                                              |

## Low Impact / Long-term

| #   | Task                                                                                                                                                                         | Impact | Effort | Evidence                                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | Update stale source file header comments — `constraint-mapper.ts` says "11 decorators" (actually 15), test file header lists old decorator set                               | Low    | 15min  | `src/constraint-mapper.ts:1-14`, `test/compliance/constraint-decorators.test.ts:1-14`                                                                                                          |
| 7   | Add `bun run verify` alias — `build + lint + test + coverage:gate + duplicate` in one command                                                                                | Low    | 15min  | `package.json` — no unified verify script. Duplication gate was red for multiple commits because it wasn't part of the default verification cycle                                              |
| 8   | OpenAPI 3.x cross-emitter type sharing — `src/shared/` module exports are complete and tested (25 tests, incl. barrel public-API contract). No external consumer exists yet. | Low    | 4-6h   | `src/shared/index.ts` exports `JsonSchema`, `SchemaMap`, `generateSchemas`, `extractValue`, `intrinsicToSchema`, `AsyncAPISchemaEmitter`. Building a separate OpenAPI emitter is out of scope. |
| 9   | Populate remaining `components.*` — parameters, correlationIds, tags, operationTraits, messageTraits, reusable bindings                                                      | Low    | 4-6h   | AsyncAPI 3.1 spec supports these; emitter doesn't populate them yet                                                                                                                            |
| 10  | Channel `summary` and `description` fields — currently only address is populated                                                                                             | Low    | 1h     | `src/builders/channel-builder.ts` — CommonMetadata fields not populated from `@doc`                                                                                                            |

> **Completed items (see CHANGELOG [Unreleased]):**
>
> - ~~Add `allOf` support for model inheritance~~ — emits `allOf: [{ $ref: "..." }]` for `extends`
> - ~~Implement `oneOf` / `not` for union types~~ — model-variant unions emit `oneOf`; `not` field added to type
> - ~~Add `@discriminator` → `discriminator` mapping~~ — polymorphic type handling via `getDiscriminator()`
> - ~~Fix union variant `$ref` for named models~~ — was emitting empty `{}` objects instead of `$ref`
> - ~~Extract `refForNamedType` to `schema-ref.ts`~~ — schema-emitter.ts reduced from 386→359 lines
> - ~~Map 15 TypeSpec constraint/metadata decorators to JSON Schema keywords~~ — `src/constraint-mapper.ts` (@minValue, @maxValue, exclusive variants, @minLength/@maxLength, @pattern, @format, @minItems/@maxItems, #deprecated, @summary→title, @example→examples, @visibility→readOnly/writeOnly, default values→default)
> - ~~Fix `scalarDeclaration` metadata drop~~ — `@summary`/`#deprecated` on user-defined scalars were silently dropped; extracted `declareSchema()` helper
> - ~~Restore zero-clone duplication baseline~~ — 3 clones from allOf/oneOf/discriminator work fixed via `composeUnionVariants()` extraction and `.filter()` pre-filtering
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
