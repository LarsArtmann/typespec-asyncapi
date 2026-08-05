# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## High Impact

| #   | Task                                                                                                                | Impact | Effort | Evidence                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ---------------------------------------------------------------------------------------------------------- |
| 1   | Add `allOf` support for model inheritance (declared in `JsonSchema` but never generated)                            | Medium | 1-2h   | `src/schema-emitter.ts` — `allOf` field exists in type but emitter never emits it                          |
| 2   | Audit `JsonSchema.items` consumers for array-form safety (tuple fix broadened type to `JsonSchema \| JsonSchema[]`) | Medium | 30min  | `src/domain/models/asyncapi-document.ts` — downstream code accessing `.items.type` may break on array form |

## Medium Impact

| #   | Task                                                                                                            | Impact | Effort | Evidence                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------- | ------ | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 3   | Check whether `@typespec/versioning` should be `peerDependency` instead of `dependency`                         | Medium | 15min  | `package.json` — TypeSpec plugins typically use peer deps for `@typespec/*` packages                                              |
| 4   | Write integration test: compile `@bindings(#{solace: #{priority: 5}})` through full TypeSpec → emitter pipeline | Medium | 30min  | Binding protocol fix only has unit tests calling `processBindings()` directly. No end-to-end test. `docs/status/2026-08-05_19-01` |

## Low Impact / Long-term

| #   | Task                                                                                                                                                                         | Impact | Effort | Evidence                                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | Verify whether `typeToSchema()` Tuple branch (line ~335) is reachable or dead code after `tuple()` override fix                                                              | Low    | 15min  | `src/schema-emitter.ts` — `tuple()` method override may make the `typeToSchema` Tuple branch unreachable                                                                                       |
| 6   | OpenAPI 3.x cross-emitter type sharing — `src/shared/` module exports are complete and tested (25 tests, incl. barrel public-API contract). No external consumer exists yet. | Low    | 4-6h   | `src/shared/index.ts` exports `JsonSchema`, `SchemaMap`, `generateSchemas`, `extractValue`, `intrinsicToSchema`, `AsyncAPISchemaEmitter`. Building a separate OpenAPI emitter is out of scope. |

> **Completed items (see CHANGELOG [Unreleased]):**
>
> - ~~Map 11 TypeSpec constraint decorators to JSON Schema keywords~~ — `src/constraint-mapper.ts`
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
