# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## High Impact

| #  | Task                                                                                                            | Impact | Effort | Evidence                                                                                                                                  |
| -- | --------------------------------------------------------------------------------------------------------------- | ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | Map TypeSpec constraint decorators to JSON Schema validation keywords (`@pattern`→`pattern`, `@minValue`→`minimum`, `@maxLength`→`maxLength`, etc.) | High   | 2-3h   | 16 TypeSpec stdlib decorators (`getPattern()`, `getMinValue()`, etc.) exist but are never called. `JsonSchema` declares these fields but never generates them. `src/schema-emitter.ts` |
| 2  | Delete `linter-strategy.test.ts` — anti-pattern (nested `execSync` process spawning inside vitest, 4.3s, CI already checks `bun run lint`)     | Medium | 5min   | `test/unit/linter-strategy.test.ts` — flagged in `docs/status/2026-08-05_18-01_TODO-EXECUTION-SESSION.md`                                |
| 3  | Rename `generator-compatibility.test.ts` → `document-structure.test.ts` — name overpromises what it delivers    | Medium | 5min   | `test/validation/generator-compatibility.test.ts` — tests structural properties, not the actual generator                                  |
| 4  | Remove dead `nullable` field from `JsonSchema` — AsyncAPI 3.1 uses JSON Schema Draft-07 which has no `nullable`  | Medium | 10min  | `src/domain/models/asyncapi-document.ts` — declared but never generated; OpenAPI 3.0 concept. Flagged in gap analysis                     |
| 5  | Remove dead `xml` field from `JsonSchema` — declared but never generated, no decorator reads it, no test covers it | Low    | 5min   | `src/domain/models/asyncapi-document.ts` — dead code that misleads                                                                        |
| 6  | Check whether `@typespec/versioning` should be `peerDependency` instead of `dependency`                        | Medium | 15min  | `package.json` — TypeSpec plugins typically use peer deps for `@typespec/*` packages                                                      |

## Medium Impact

| #  | Task                                                                                                            | Impact | Effort | Evidence                                                                                                                                  |
| -- | --------------------------------------------------------------------------------------------------------------- | ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 7  | Add `@deprecated` → `deprecated: true` mapping in schema emitter                                                | Medium | 30min  | TypeSpec `isDeprecated()` exists; never called. `JsonSchema` declares `deprecated` field                                                  |
| 8  | Add `allOf` support for model inheritance (declared in `JsonSchema` but never generated)                        | Medium | 1-2h   | `src/schema-emitter.ts` — `allOf` field exists in type but emitter never emits it                                                         |
| 9  | Audit `JsonSchema.items` consumers for array-form safety (tuple fix broadened type to `JsonSchema \| JsonSchema[]`) | Medium | 30min  | `src/domain/models/asyncapi-document.ts` — downstream code accessing `.items.type` may break on array form                                 |
| 10 | Write integration test: compile `@bindings(#{solace: #{priority: 5}})` through full TypeSpec → emitter pipeline | Medium | 30min  | Binding protocol fix (T1) only has unit tests calling `processBindings()` directly. No end-to-end test. `docs/status/2026-08-05_19-01`    |
| 11 | Fix misleading comment in `test/unit/stdlib-helpers.test.ts` (claims to test `collectAllStdlibNames`, never calls it) | Low    | 5min   | `test/unit/stdlib-helpers.test.ts:4`                                                                                                      |
| 12 | Verify whether `typeToSchema()` Tuple branch (line ~335) is reachable or dead code after `tuple()` override fix | Low    | 15min  | `src/schema-emitter.ts` — `tuple()` method override may make the `typeToSchema` Tuple branch unreachable                                  |

## Low Impact / Long-term

| #  | Task                                                                                                                                                         | Impact | Effort | Evidence                                                                                                                                                                |
| -- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13 | OpenAPI 3.x cross-emitter type sharing — `src/shared/` module exports are complete and tested (25 tests, incl. barrel public-API contract). No external consumer exists yet. | Low    | 4-6h   | `src/shared/index.ts` exports `JsonSchema`, `SchemaMap`, `generateSchemas`, `extractValue`, `intrinsicToSchema`, `AsyncAPISchemaEmitter`. Building a separate OpenAPI emitter is out of scope. |

> **Completed items (see CHANGELOG [Unreleased]):**
>
> - ~~TypeSpec `@versioned` integration~~ — `getVersion()` reads enum for `info.version`
> - ~~AsyncAPI Studio compatibility~~ — 9 tests via `@asyncapi/parser`
> - ~~BDD test step definitions~~ — Dead Cucumber removed; 23 real BDD tests
> - ~~ESLint/oxlint consolidation~~ — Verified zero conflicts
> - ~~AsyncAPI generator compatibility~~ — 8 structural requirement tests
> - ~~Plugin/hook system~~ — Removed (Non-Goal in ROADMAP)
> - ~~Binding protocol gap fix~~ — solace/anypointmq/ros2 accepted
> - ~~Tuple of named models fix~~ — Valid JSON Schema with `$ref`
> - ~~Zero-clone duplication baseline~~ — 68→0 clones, 0% threshold
