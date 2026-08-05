# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## Low Impact / Long-term

| #   | Task                                                                                                                                                       | Impact | Effort | Evidence                                                                                                                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | OpenAPI 3.x cross-emitter type sharing — `src/shared/` module exports are complete and tested (25 tests, incl. barrel public-API contract). No external OpenAPI emitter consumer exists yet. | Low    | 4-6h   | `src/shared/index.ts` exports `JsonSchema`, `SchemaMap`, `generateSchemas`, `extractValue`, `intrinsicToSchema`, `AsyncAPISchemaEmitter`. Tested in `test/unit/shared-schema-types.test.ts`. Building a separate OpenAPI emitter that consumes this module is out of scope for this project. |

> **Completed items (see CHANGELOG [Unreleased]):**
>
> - ~~AsyncAPI Studio compatibility~~ — `test/validation/studio-compatibility.test.ts` (9 tests using `@asyncapi/parser`)
> - ~~BDD test step definitions~~ — Dead Cucumber infrastructure removed; `test/bdd/user-behaviors.test.ts` rewritten with 23 real end-to-end BDD tests
> - ~~ESLint/oxlint consolidation~~ — Verified zero conflicts, documented in `test/unit/linter-strategy.test.ts` (3 tests)
> - ~~AsyncAPI generator compatibility~~ — `test/validation/generator-compatibility.test.ts` (8 tests for structural requirements)
> - ~~`@typespec/versioning` integration~~ — `getVersion()` reads `@versioned` enum for `info.version`, `test/integration/versioning.test.ts` (5 tests)
> - ~~Plugin/hook system~~ — Removed (Non-Goal in ROADMAP)
