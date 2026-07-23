# Status Report: SchemaObject → JsonSchema Rename + Self-Inflicted Issue Cleanup

**Date:** 2026-07-23 05:09
**Session:** Type consolidation rename, dead code removal, file rename
**Previous report:** `docs/status/2026-07-23_03-52_PARETO-COMPLETE-SELF-REVIEW.md`

---

## Metrics Snapshot

| Metric              | Previous (Jul 23 03:52)           | Now (Jul 23 05:09) | Delta |
| ------------------- | --------------------------------- | ------------------ | ----- |
| Tests               | 679 passing                       | **679 passing**    | 0     |
| Test files          | 64                                | **64**             | 0     |
| Source files        | 36 (incl. generated)              | **36**             | 0     |
| Source lines        | ~4,625 (incl. gen)                | **~4,593**         | -32   |
| Avg coverage        | 95.2%                             | **95.2%**          | 0     |
| ESLint              | 0 errors, 0 warnings              | Clean              | —     |
| oxlint              | 0 errors, 0 warnings              | Clean              | —     |
| Build               | Clean                             | Clean              | —     |
| Dead code functions | 1 (`generateFixtureMultiFile`)    | **0**              | -1    |
| Duplicate types     | 1 (`SchemaObject` ≡ `JsonSchema`) | **0**              | -1    |
| Misnamed files      | 1 (`server-decorators.ts`)        | **0**              | -1    |

---

## a) FULLY DONE

### 1. SchemaObject → JsonSchema Rename (Split-Brain Fix)

**Problem:** Two structurally identical types existed — `SchemaObject` in `src/domain/models/asyncapi-document.ts` and `JsonSchema` in `src/shared/json-schema.ts`. Callers had to know which name to use in which context. Classic split-brain.

**Solution:** Single canonical `JsonSchema` type in the domain model. The shared module re-exports it.

| Change                           | Detail                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical definition             | `src/domain/models/asyncapi-document.ts` — renamed interface, merged 20 extra JSON Schema validation fields from the duplicate (`minimum`, `maximum`, `pattern`, `minLength`, `maxLength`, `minItems`, `maxItems`, `nullable`, `readOnly`, `writeOnly`, `deprecated`, `discriminator`, `xml`, `externalDocs`, `title`, `default`, `example`, `examples`, `exclusiveMinimum`, `exclusiveMaximum`, `uniqueItems`) |
| Files renamed (whole-word `sed`) | `schema-emitter.ts` (32 occ), `schema-generator.ts` (5), `extract-value.ts` (4), `schema-splitter.ts` (3), `intrinsic-mapping.ts` (2), `document-builder.ts` (2), `builders/types.ts` (2), `builders/message-builder.ts` (2), `test/compliance/schema-types.test.ts` (2), `test/compliance/edge-cases.test.ts` (2)                                                                                              |
| Duplicate eliminated             | `src/shared/json-schema.ts` — deleted 50-line duplicate interface, replaced with `import type` + `export type` re-export                                                                                                                                                                                                                                                                                        |
| Self-references updated          | `MessageObject.headers`, `MessageObject.payload`, `ParameterObject.schema`, `ComponentsObject.schemas` — all now use `JsonSchema`                                                                                                                                                                                                                                                                               |
| Verification                     | `rg '\bSchemaObject\b' --glob '*.ts' --glob '*.tsp'` → **zero matches** in code                                                                                                                                                                                                                                                                                                                                 |

### 2. Dead Code Removal

**`generateFixtureMultiFile()`** deleted from `test/benchmark/fixture-generator.ts` (31 lines removed). The function was created during the Pareto execution session but never called by any test, benchmark, or other code. `FixtureOptions` interface remains — it is still used by `generateFixture()` and `performance.test.ts`.

### 3. File Rename: server-decorators.ts → namespace-decorators.ts

**Problem:** The file `src/server-decorators.ts` contained `$server` AND `$defaultContentType`. The name implied server-only content, but `$defaultContentType` has nothing to do with servers. Both decorators target `Namespace`.

**Solution:** Renamed to `namespace-decorators.ts` via `git mv` (history preserved). Updated imports in `src/decorators.ts` and `src/index.ts`. Updated AGENTS.md.

### 4. AGENTS.md Updated

All `SchemaObject` references replaced with `JsonSchema`. Decorator implementation section updated to reflect the renamed file.

### Verification

```
bun run build         → 0 errors
bun run lint          → 0 errors, 0 warnings (ESLint + oxlint)
bun run test          → 679 passed (64 files)
test:coverage:gate    → PASSED (32 files, avg 95.2%, min 75% per file)
```

---

## b) PARTIALLY DONE

### Shared Module Cleanup

The `src/shared/` module was created to be a "cross-emitter shared schema API" that other TypeSpec emitters (OpenAPI, JSON Schema) could consume without pulling in AsyncAPI-specific types. The rename fixed the type split-brain, but the module still has design contradictions:

- **`src/shared/json-schema.ts`** imports `JsonSchema` from `../domain/models/asyncapi-document.ts` — this IS an AsyncAPI-specific module. The comment says "independent of AsyncAPI-specific concepts" but the dependency chain says otherwise. The re-export is correct for now (single source of truth), but the JsonSchema type should eventually live in the shared module and be imported BY the domain, not the other way around.
- **`src/shared/index.ts`** exports `AsyncAPISchemaEmitter` — literally named "AsyncAPI". This should not be in a module claiming cross-emitter neutrality.
- **Zero external consumers:** No file in the project (or any detected external package) imports from `@lars-artmann/typespec-asyncapi/shared`. The entire shared module is speculative infrastructure with no users.

---

## c) NOT STARTED

### Unit Tests for Extracted Modules

The previous session extracted 4 modules from the schema-emitter monolith. None have direct unit tests:

| Module                    | Lines | Direct Tests                          | Coverage Source                                            |
| ------------------------- | ----- | ------------------------------------- | ---------------------------------------------------------- |
| `namespace-decorators.ts` | 73    | **None**                              | Transitively via `test/decorators/server.test.ts`          |
| `schema-generator.ts`     | 47    | **None**                              | Transitively via integration tests                         |
| `stdlib-helpers.ts`       | 39    | **None**                              | Transitively via integration tests                         |
| `schema-splitter.ts`      | 85    | **None**                              | Via `test/integration/multi-file-output.test.ts` (9 tests) |
| `extract-value.ts`        | 26    | Partial (shared-schema-types.test.ts) | 19 tests in shared-schema-types                            |

The coverage gate passes at 95.2% because these modules are exercised transitively, but direct unit tests would catch regressions faster and document intent.

---

## d) TOTALLY FUCKED UP

### Nothing this session.

All changes compiled, linted, and passed 679 tests on the first try after each step. The one hiccup was `SchemaMap` referencing `JsonSchema` without importing it (the re-export alone didn't make the name available for local use) — fixed in one edit by adding `import type` alongside the `export type`.

### What I Should Have Caught Earlier (Self-Criticism)

1. **I didn't question the shared module's existence.** I was told to "consolidate the duplicate" and I did — but I should have flagged that the entire `src/shared/` module is speculative infrastructure with zero consumers. The right move might have been to delete it entirely rather than fix the re-export. Instead I made the turd shinier.

2. **I committed nothing.** The git working tree is clean because commits `323dd01` and `8e034da` (by a concurrent/previous Crush session using MiniMax-M3) already included these changes. My edits were applied on top of an already-modified tree. I didn't notice this because I didn't check `git log` before starting work. **I should have verified the working tree state before acting.**

3. **I didn't run the coverage gate until the status report prompted it.** The session brief said "Verify build + lint + 679 tests pass" — I treated coverage as optional. It's not. The project has a 75% per-file gate (`scripts/coverage-gate.ts`). I got lucky it passed.

---

## e) WHAT WE SHOULD IMPROVE

### Architecture

1. **The `src/shared/` module is YAGNI.** Zero consumers. Exports AsyncAPI-specific types from a module claiming cross-emitter neutrality. Either delete it entirely, or move `JsonSchema` into it and have the domain import FROM shared (inverting the dependency). The current direction (shared → domain) is backwards.

2. **`AsyncAPISchemaEmitter` is exported from shared/index.ts.** A class with "AsyncAPI" in its name has no business in a "cross-emitter" module. If the shared module survives, this export should move to the main barrel.

3. **The barrel export chain is convoluted.** `src/index.ts` exports `JsonSchema` from `./shared/json-schema.js`, which imports from `../domain/models/asyncapi-document.js`. Three hops for one type. The main index should export directly from the domain model.

### Testing

4. **No direct unit tests for extracted modules.** The whole point of extracting modules from the 831-line monolith was testability. We extracted them but didn't test them directly. The coverage is transitively adequate but the intent documentation is missing.

5. **Test count discrepancy.** Vitest reports 679 tests, but `grep -c '\bit('` finds 598. The difference (~81 tests) comes from `test()` calls, parameterized tests, or `describe.each`. Not a bug, but the metrics in status reports should clarify what they measure.

### Process

6. **I didn't check git state before acting.** The working tree already had all changes from a concurrent session. I re-did work that was already done. Always `git log` + `git diff` before starting.

7. **The commit message for `323dd01` says "555 vitest tests" but the actual count is 679.** Stale number in the commit message. Whoever wrote it used the AGENTS.md number, not the actual test run.

---

## f) Up to 50 Things We Should Get Done Next

#### Critical (Architecture Correctness)

1. **Decide: delete `src/shared/` or fix its dependency direction.** It has zero consumers and exports AsyncAPI-specific types from a "cross-emitter" module.
2. **Move `JsonSchema` definition to `src/shared/json-schema.ts`** (if shared survives) and have domain import FROM shared, not the reverse.
3. **Remove `AsyncAPISchemaEmitter` from `src/shared/index.ts`** — it's AsyncAPI-specific.
4. **Flatten the barrel export chain** — `src/index.ts` should export `JsonSchema` directly from domain, not through shared.
5. **Remove the `"./shared"` subpath from `package.json` exports** if the module is deleted.

#### High Priority (Testing)

6. **Add direct unit tests for `namespace-decorators.ts`** — test `$server` validation paths (missing url, invalid url, unsupported protocol, non-namespace target).
7. **Add direct unit tests for `schema-generator.ts`** — test `generateSchemas()` with empty input, single model, multiple models, circular refs.
8. **Add direct unit tests for `stdlib-helpers.ts`** — test `isStdlibType()` and `collectAllStdlibNames()`.
9. **Add direct unit tests for `schema-splitter.ts`** — test `splitSchemas()` with zero schemas, one schema, nested `$ref` rewriting, file extension variants.
10. **Add direct unit tests for `extract-value.ts`** — test all `EmitEntity` kinds: `declaration`, `code`, `none`, `circular`, `undefined`, and `Placeholder<T>` detection.

#### Medium Priority (Code Quality)

11. **Audit `SchemaRef` and `SchemaMap` usage** — they're only used in `test/unit/shared-schema-types.test.ts`. If shared module is deleted, these types may be dead code.
12. **Check if `Ref` interface in `asyncapi-document.ts` duplicates `SchemaRef` in shared** — both are `{ $ref: string }`. Potential split-brain.
13. **Review whether `JsonSchema` needs ALL 20 merged fields.** Some (`xml`, `externalDocs`) are OpenAPI-specific, not AsyncAPI 3.1. Verify against the AsyncAPI 3.1 JSON Schema.
14. **Add JSDoc to `JsonSchema` fields** — especially the merged validation fields. Document which are AsyncAPI 3.1 vs JSON Schema draft-07 vs OpenAPI extensions.
15. **Consider making `JsonSchema` a branded type** or using `satisfies` to prevent accidental structural matches with unrelated objects.

#### Medium Priority (Documentation)

16. **Update AGENTS.md emitter file list** — now 7 files, with correct line counts after rename.
17. **Add `JsonSchema` to the Domain Language glossary** in `docs/DOMAIN_LANGUAGE.md`.
18. **Document the `EmitEntity<T>` discriminated union pattern** in a reference doc, not just AGENTS.md.
19. **Add a CONTRIBUTING.md section on the decorator registration 6-step pipeline.**
20. **Update FEATURES.md** — does it mention the shared module? Multi-file output? Schema splitting?

#### Medium Priority (Technical Debt)

21. **Investigate the `src/builders/channel-builder.ts` diff** — it was modified (26 lines changed) but I didn't touch it this session. Was it part of the concurrent commit? Verify intent.
22. **Investigate `src/constants/binding-versions.ts` diff** — 27 lines changed, not by me. Same concern.
23. **Check `src/constants/protocols.ts`** — 8 lines changed in the concurrent commit. Verify no behavioral change.
24. **Run a full code deduplication scan** — the previous self-review identified shared-utils patterns that may have further consolidation potential.
25. **Review `src/emitter.ts` (90 lines)** — does it still need all its imports after the extraction? Check for dead imports.

#### Lower Priority (Polish)

26. **Add error message tests for `JsonSchema` type assertion helpers** (if any are added).
27. **Consider extracting `intrinsicToSchema()` mapping table** into a data file (YAML/JSON) for easier maintenance.
28. **Add a snapshot test for `JsonSchema` type shape** — lock the interface to prevent accidental field removal.
29. **Benchmark `JsonSchema` object creation** — ensure the 20 extra fields don't impact emitter performance.
30. **Add ESLint rule to prevent re-introducing `SchemaObject` as a name.**
31. **Review all `as JsonSchema` casts** — are any unsafe? Should they be validated?
32. **Check if `[key: string]: unknown` index signature on `JsonSchema` hides type errors.**
33. **Consider splitting `JsonSchema` into `JsonSchemaCore` (draft-07) and `AsyncAPISchemaObject` (extends with AsyncAPI-specific fields).**
34. **Add integration test: compile a spec, parse output, verify `JsonSchema` round-trips correctly through JSON serialization.**
35. **Review the `sourceFile` method in `schema-emitter.ts` — does it handle `JsonSchema` correctly in multi-file mode?**

#### Lower Priority (Infrastructure)

36. **Add a pre-push hook that runs the coverage gate** (currently only pre-commit).
37. **Set up CI matrix testing** — Bun + Node.js (if available) to catch runtime-specific issues.
38. **Add a `bun run check` composite command** — build + lint + test + coverage gate in one step.
39. **Consider migrating from vitest to Bun's test runner** — but only after Bun fixes the OOM issue documented in AGENTS.md.
40. **Add a `docs/generated/` section with auto-generated API docs from TSDoc comments.**

#### Lower Priority (Future-Proofing)

41. **Evaluate whether the TypeSpec compiler API will change `EmitEntity` in upcoming versions.**
42. **Track AsyncAPI 3.2 spec changes** — may introduce new schema fields or deprecate existing ones.
43. **Consider adding JSON Schema draft 2020-12 support** alongside draft-07.
44. **Evaluate `zod` or `@sinclair/typebox` for runtime validation of `JsonSchema` objects.**
45. **Add a migration guide for users upgrading from `SchemaObject` to `JsonSchema`** (if any external consumers exist).
46. **Review whether the `Ref` / `SchemaRef` / `ref()` / `refSchema()` helper functions can be consolidated.**
47. **Add property-based testing (fast-check) for `JsonSchema` generation** — generate random TypeSpec specs, verify output is always valid JSON Schema.
48. **Consider a `JsonSchemaBuilder` fluent API** for programmatic schema construction in tests.
49. **Evaluate whether `TypeEmitter<JsonSchema, AsyncAPIEmitterOptions>` should use a narrower type than `JsonSchema` for the generic parameter.**
50. **Review the entire `src/domain/models/asyncapi-document.ts` file** — at 288 lines with 20+ interfaces, consider splitting by concern (channels, operations, messages, security, schemas).

---

## g) Questions I Cannot Answer Myself

### 1. Should `src/shared/` continue to exist?

The module has **zero consumers** (no file imports from `@lars-artmann/typespec-asyncapi/shared`). Its stated purpose — enabling other TypeSpec emitters to reuse the schema pipeline — is speculative. Should I:

- **(A)** Delete it entirely (YAGNI — remove `src/shared/`, remove the `package.json` `"./shared"` export, move `SchemaRef`/`SchemaMap` to domain if needed)
- **(B)** Keep it but fix the dependency direction (move `JsonSchema` INTO shared, have domain import from shared)
- **(C)** Leave as-is (it's harmless and might be used someday)

I cannot decide this because it depends on your roadmap: do you actually plan to build other TypeSpec emitters (OpenAPI, JSON Schema) that would consume this?

### 2. Are the concurrent commits (`323dd01`, `8e034da`) intentional?

The git log shows two commits by `Assisted-by: Crush:MiniMax-M3` that include ALL the changes I made in this session, plus changes to files I didn't touch (`channel-builder.ts`, `server-builder.ts`, `binding-versions.ts`, `protocols.ts`). The commit message says "555 tests" but the actual count is 679. Was this work done by another session/person concurrently? Should I treat these commits as authoritative, or do they contain changes I should review?

### 3. Should the merged `JsonSchema` fields be trimmed?

I merged all 20 fields from the duplicate `JsonSchema` into the canonical type. Some of these (`xml`, `externalDocs`, `discriminator`, `nullable`, `readOnly`, `writeOnly`) are OpenAPI extensions that aren't part of the AsyncAPI 3.1 JSON Schema spec. Should I:

- **(A)** Keep all fields (maximally compatible with OpenAPI consumers)
- **(B)** Trim to only AsyncAPI 3.1 spec fields (strict correctness)
- **(C)** Split into `JsonSchema` (core draft-07) and `AsyncAPISchema` (extends with AsyncAPI-specific fields)

I cannot decide because I don't know whether any downstream consumer actually uses these OpenAPI-specific fields.

---

## Session Summary

**Verdict:** The split-brain is fixed, dead code is gone, the misnamed file has an honest name. Build is green, lint is clean, 679 tests pass, coverage gate passes at 95.2%. The work itself was straightforward and error-free.

**The real issue:** I spent a session polishing speculative infrastructure (the shared module) that nobody uses, re-doing work a concurrent session already committed, and not questioning whether the architecture I was "fixing" should exist at all. The rename was correct and necessary, but the bigger question — "should this shared module exist?" — went unasked.
