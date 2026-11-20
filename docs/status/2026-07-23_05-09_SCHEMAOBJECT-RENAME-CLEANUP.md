# Status Report: SchemaObject → JsonSchema Rename + Self-Inflicted Issue Cleanup

**Date:** 2026-07-23 05:09
**Session:** Type consolidation rename, dead code removal, file rename
**Previous report:** `docs/status/2026-07-23_03-52_PARETO-COMPLETE-SELF-REVIEW.md`

---

## Metrics Snapshot

| Metric              | Previous (Jul 23 03:52)           | Now (Jul 23 05:09) | Delta |
| ------------------- | --------------------------------- | ------------------ | ----- |
| ~~Tests~~ done — suite grew from 551 → 679 → 1000+ tests, still 0-fail (ROADMAP Current State) | ~~679 passing~~ | ~~**679 passing**~~ | ~~0~~ |
| ~~Test files~~ done — now 100+ test files (ROADMAP Current State) | ~~64~~ | ~~**64**~~ | ~~0~~ |
| ~~Source files~~ done — now 45 source files under the coverage gate (FEATURES.md header) | ~~36 (incl. generated)~~ | ~~**36**~~ | ~~0~~ |
| ~~Source lines~~ done — count grew with the codebase; the 0-clone duplicate gate holds (FEATURES.md §Duplication) | ~~~4,625 (incl. gen)~~ | ~~**~4,593**~~ | ~~-32~~ |
| ~~Avg coverage~~ done — rose to ~98% average with the 75% per-file gate (ROADMAP Current State) | ~~95.2%~~ | ~~**95.2%**~~ | ~~0~~ |
| ~~ESLint~~ done — still 0/0 under strict + strictTypeChecked (FEATURES.md §Build) | ~~0 errors, 0 warnings~~ | ~~Clean~~ | ~~—~~ |
| ~~oxlint~~ done — still 0/0 with deny-warnings (FEATURES.md §Build) | ~~0 errors, 0 warnings~~ | ~~Clean~~ | ~~—~~ |
| ~~Build~~ done — strict tsc remains a `pnpm run verify` stage (`package.json`) | ~~Clean~~ | ~~Clean~~ | ~~—~~ |
| ~~Dead code functions~~ done — holds — `generateFixtureMultiFile` is absent, `FixtureOptions` remains (`test/benchmark/fixture-generator.ts`) | ~~1 (`generateFixtureMultiFile`)~~ | ~~**0**~~ | ~~-1~~ |
| ~~Duplicate types~~ done — holds — `SchemaObject` has zero matches today (grep-verified) | ~~1 (`SchemaObject` ≡ `JsonSchema`)~~ | ~~**0**~~ | ~~-1~~ |
| ~~Misnamed files~~ done — holds — `src/namespace-decorators.ts` exists, `server-decorators.ts` is gone | ~~1 (`server-decorators.ts`)~~ | ~~**0**~~ | ~~-1~~ |

---

## a) FULLY DONE

### 1. SchemaObject → JsonSchema Rename (Split-Brain Fix)

**Problem:** Two structurally identical types existed — `SchemaObject` in `src/domain/models/asyncapi-document.ts` and `JsonSchema` in `src/shared/json-schema.ts`. Callers had to know which name to use in which context. Classic split-brain.

**Solution:** Single canonical `JsonSchema` type in the domain model. The shared module re-exports it.

| Change                           | Detail                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~Canonical definition~~ done — holds — canonical `JsonSchema` lives in `src/domain/models/asyncapi-document.ts` | ~~`src/domain/models/asyncapi-document.ts` — renamed interface, merged 20 extra JSON Schema validation fields from the duplicate (`minimum`, `maximum`, `pattern`, `minLength`, `maxLength`, `minItems`, `maxItems`, `nullable`, `readOnly`, `writeOnly`, `deprecated`, `discriminator`, `xml`, `externalDocs`, `title`, `default`, `example`, `examples`, `exclusiveMinimum`, `exclusiveMaximum`, `uniqueItems`)~~ |
| ~~Files renamed (whole-word `sed`)~~ done — holds — the listed files all reference `JsonSchema` today | ~~`schema-emitter.ts` (32 occ), `schema-generator.ts` (5), `extract-value.ts` (4), `schema-splitter.ts` (3), `intrinsic-mapping.ts` (2), `document-builder.ts` (2), `builders/types.ts` (2), `builders/message-builder.ts` (2), `test/compliance/schema-types.test.ts` (2), `test/compliance/edge-cases.test.ts` (2)~~ |
| ~~Duplicate eliminated~~ done — holds — `src/shared/json-schema.ts` remains a re-export of the domain type | ~~`src/shared/json-schema.ts` — deleted 50-line duplicate interface, replaced with `import type` + `export type` re-export~~ |
| ~~Self-references updated~~ done — holds — `MessageObject.headers`/`payload` are typed `JsonSchema` (`src/domain/models/asyncapi-document.ts`) | ~~`MessageObject.headers`, `MessageObject.payload`, `ParameterObject.schema`, `ComponentsObject.schemas` — all now use `JsonSchema`~~ |
| ~~Verification~~ done — holds — re-ran the rg check today: zero `SchemaObject` matches | ~~`rg '\bSchemaObject\b' --glob '*.ts' --glob '*.tsp'` → **zero matches** in code~~ |

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
| ~~`namespace-decorators.ts`~~ done — validation paths locked by `test/integration/decorator-negative.test.ts` (server url/protocol diagnostics) | ~~73~~ | ~~**None**~~ | ~~Transitively via `test/decorators/server.test.ts`~~ |
| ~~`schema-generator.ts`~~ **Won't implement — never given a dedicated unit file — `src/schema-generator.ts` stays exercised through golden + compliance suites.** | ~~47~~ | ~~**None**~~ | ~~Transitively via integration tests~~ |
| ~~`stdlib-helpers.ts`~~ done — direct tests exist now — `test/unit/stdlib-helpers.test.ts` | ~~39~~ | ~~**None**~~ | ~~Transitively via integration tests~~ |
| ~~`schema-splitter.ts`~~ done — direct tests exist now — `test/unit/schema-splitter.test.ts` (14 tests) | ~~85~~ | ~~**None**~~ | ~~Via `test/integration/multi-file-output.test.ts` (9 tests)~~ |
| ~~`extract-value.ts`~~ done — expanded — circular/`code`/none entity cases in `test/unit/shared-schema-types.test.ts` | ~~26~~ | ~~Partial (shared-schema-types.test.ts)~~ | ~~19 tests in shared-schema-types~~ |

The coverage gate passes at 95.2% because these modules are exercised transitively, but direct unit tests would catch regressions faster and document intent.

---

## d) TOTALLY FUCKED UP

### Nothing this session.

All changes compiled, linted, and passed 679 tests on the first try after each step. The one hiccup was `SchemaMap` referencing `JsonSchema` without importing it (the re-export alone didn't make the name available for local use) — fixed in one edit by adding `import type` alongside the `export type`.

### What I Should Have Caught Earlier (Self-Criticism)

~~1. **I didn't question the shared module's existence.** I was told to "consolidate the duplicate" and I did — but I should have flagged that the entire `src/shared/` module is speculative infrastructure with zero consumers. The right move might have been to delete it entirely rather than fix the re-export. Instead I made the turd shinier.~~ **NOT-DO — process note; the decision was later taken — keep `./shared` as frozen public subpath (ROADMAP §Ecosystem, CHANGELOG 1.0.0).**

~~2. **I committed nothing.** The git working tree is clean because commits `323dd01` and `8e034da` (by a concurrent/previous Crush session using MiniMax-M3) already included these changes. My edits were applied on top of an already-modified tree. I didn't notice this because I didn't check `git log` before starting work. **I should have verified the working tree state before acting.**~~ **NOT-DO — explained — `323dd014` (the rename) and `8e034da8` (binding regen) were the concurrent MiniMax session's commits; history accepted them.**

~~3. **I didn't run the coverage gate until the status report prompted it.** The session brief said "Verify build + lint + 679 tests pass" — I treated coverage as optional. It's not. The project has a 75% per-file gate (`scripts/coverage-gate.ts`). I got lucky it passed.~~ **NOT-DO — process note; the coverage gate is now a mandatory `pnpm run verify` stage (`package.json`).**

---

## e) WHAT WE SHOULD IMPROVE

### Architecture

~~1. **The `src/shared/` module is YAGNI.** Zero consumers. Exports AsyncAPI-specific types from a module claiming cross-emitter neutrality. Either delete it entirely, or move `JsonSchema` into it and have the domain import FROM shared (inverting the dependency). The current direction (shared → domain) is backwards.~~ **Won't implement — decision: keep — `./shared` ships as a semver-frozen subpath; ROADMAP §Ecosystem still records zero external consumers.**

~~2. **`AsyncAPISchemaEmitter` is exported from shared/index.ts.** A class with "AsyncAPI" in its name has no business in a "cross-emitter" module. If the shared module survives, this export should move to the main barrel.~~ **Won't implement — kept deliberately — the JSDoc was rewritten into an honest two-tier split (CHANGELOG 0.2.1-beta) and the export froze at 1.0.0.**

~~3. **The barrel export chain is convoluted.** `src/index.ts` exports `JsonSchema` from `./shared/json-schema.js`, which imports from `../domain/models/asyncapi-document.js`. Three hops for one type. The main index should export directly from the domain model.~~ **Won't implement — chain unchanged by decision — `src/index.ts` re-exports `JsonSchema` via `./shared/json-schema.js`; contract frozen (CHANGELOG 1.0.0).**

### Testing

~~4. **No direct unit tests for extracted modules.** The whole point of extracting modules from the 831-line monolith was testability. We extracted them but didn't test them directly. The coverage is transitively adequate but the intent documentation is missing.~~ done — false today — `test/unit/schema-splitter.test.ts`, `test/unit/stdlib-helpers.test.ts`, `test/unit/extract-nested-config.test.ts` are direct unit files

~~5. **Test count discrepancy.** Vitest reports 679 tests, but `grep -c '\bit('` finds 598. The difference (~81 tests) comes from `test()` calls, parameterized tests, or `describe.each`. Not a bug, but the metrics in status reports should clarify what they measure.~~ **NOT-DO — metrics note; later practice quotes runner-reported counts (FEATURES.md verified-audit header, ROADMAP Current State).**

### Process

~~6. **I didn't check git state before acting.** The working tree already had all changes from a concurrent session. I re-did work that was already done. Always `git log` + `git diff` before starting.~~ **NOT-DO — process note; later docs-health passes re-verified TODO items against code before removal (TODO_LIST preamble).**

~~7. **The commit message for `323dd01` says "555 vitest tests" but the actual count is 679.** Stale number in the commit message. Whoever wrote it used the AGENTS.md number, not the actual test run.~~ **NOT-DO — historical commit-message typo; release counts now live in CHANGELOG per-release entries.**

---

## f) Up to 50 Things We Should Get Done Next

#### Critical (Architecture Correctness)

~~1. **Decide: delete `src/shared/` or fix its dependency direction.** It has zero consumers and exports AsyncAPI-specific types from a "cross-emitter" module.~~ **Won't implement — decision: keep — `./shared` remains a shipped, semver-frozen subpath (`package.json` exports).**
~~2. **Move `JsonSchema` definition to `src/shared/json-schema.ts`** (if shared survives) and have domain import FROM shared, not the reverse.~~ **Won't implement — direction kept as-is — shared re-exports the domain type; inverting it would break the frozen `./shared` API (CHANGELOG 1.0.0).**
~~3. **Remove `AsyncAPISchemaEmitter` from `src/shared/index.ts`** — it's AsyncAPI-specific.~~ **Won't implement — kept — the two-tier JSDoc split documents the AsyncAPI-bound exports honestly (CHANGELOG 0.2.1-beta).**
~~4. **Flatten the barrel export chain** — `src/index.ts` should export `JsonSchema` directly from domain, not through shared.~~ **Won't implement — same decision as the e-3 note above — chain kept, `JsonSchema` re-export unchanged, contract frozen.**
~~5. **Remove the `"./shared"` subpath from `package.json` exports** if the module is deleted.~~ **Won't implement — not removed — `"./shared"` still ships in `package.json` exports.**

#### High Priority (Testing)

~~6. **Add direct unit tests for `namespace-decorators.ts`** — test `$server` validation paths (missing url, invalid url, unsupported protocol, non-namespace target).~~ done — server validation paths locked by `test/integration/decorator-negative.test.ts`
~~7. **Add direct unit tests for `schema-generator.ts`** — test `generateSchemas()` with empty input, single model, multiple models, circular refs.~~ **Won't implement — never added as a dedicated unit file — `src/schema-generator.ts` is covered via `test/golden/` and compliance suites.**
~~8. **Add direct unit tests for `stdlib-helpers.ts`** — test `isStdlibType()` and `collectAllStdlibNames()`.~~ done — `test/unit/stdlib-helpers.test.ts` covers `isStdlibType`
~~9. **Add direct unit tests for `schema-splitter.ts`** — test `splitSchemas()` with zero schemas, one schema, nested `$ref` rewriting, file extension variants.~~ done — `test/unit/schema-splitter.test.ts` (14 tests: rewriting, extension variants)
~~10. **Add direct unit tests for `extract-value.ts`** — test all `EmitEntity` kinds: `declaration`, `code`, `none`, `circular`, `undefined`, and `Placeholder<T>` detection.~~ done — `circular`/`code`/`none` entity cases in `test/unit/shared-schema-types.test.ts`

#### Medium Priority (Code Quality)

~~11. **Audit `SchemaRef` and `SchemaMap` usage** — they're only used in `test/unit/shared-schema-types.test.ts`. If shared module is deleted, these types may be dead code.~~ **Won't implement — moot — shared kept, so `SchemaRef`/`SchemaMap` still ship as public API (`src/shared/json-schema.ts`).**
~~12. **Check if `Ref` interface in `asyncapi-document.ts` duplicates `SchemaRef` in shared** — both are `{ $ref: string }`. Potential split-brain.~~ **Won't implement — both remain — `Ref` for document refs in the domain model vs `SchemaRef` in shared serve distinct consumers.**
~~13. **Review whether `JsonSchema` needs ALL 20 merged fields.** Some (`xml`, `externalDocs`) are OpenAPI-specific, not AsyncAPI 3.1. Verify against the AsyncAPI 3.1 JSON Schema.~~ done — trimmed — `nullable`/`xml` removed from `JsonSchema` (CHANGELOG 0.2.1-beta removals), the rest kept for Draft-07 compat
~~14. **Add JSDoc to `JsonSchema` fields** — especially the merged validation fields. Document which are AsyncAPI 3.1 vs JSON Schema draft-07 vs OpenAPI extensions.~~ **Won't implement — no per-field JSDoc was added; the interface stays lean (`src/domain/models/asyncapi-document.ts`).**
~~15. **Consider making `JsonSchema` a branded type** or using `satisfies` to prevent accidental structural matches with unrelated objects.~~ **Won't implement — never branded — the `[key: string]: unknown` index signature is deliberate for `x-*` extension keys.**

#### Medium Priority (Documentation)

~~16. **Update AGENTS.md emitter file list** — now 7 files, with correct line counts after rename.~~ done — AGENTS.md has since been rewritten repeatedly and references today's module layout
~~17. **Add `JsonSchema` to the Domain Language glossary** in `docs/DOMAIN_LANGUAGE.md`.~~ **Won't implement — never added — `docs/DOMAIN_LANGUAGE.md` still has no `JsonSchema` entry.**
~~18. **Document the `EmitEntity<T>` discriminated union pattern** in a reference doc, not just AGENTS.md.~~ **Won't implement — no dedicated reference doc — the EFv1 section of ROADMAP.md documents the `EmitEntity` seam instead.**
~~19. **Add a CONTRIBUTING.md section on the decorator registration 6-step pipeline.**~~ **Won't implement — never added — CONTRIBUTING.md has no decorator-registration section; AGENTS.md owns those notes.**
~~20. **Update FEATURES.md** — does it mention the shared module? Multi-file output? Schema splitting?~~ done — in substance — FEATURES.md §Configuration documents `split-schemas`; the shared subpath is covered by the CHANGELOG 1.0.0 API freeze

#### Medium Priority (Technical Debt)

~~21. **Investigate the `src/builders/channel-builder.ts` diff** — it was modified (26 lines changed) but I didn't touch it this session. Was it part of the concurrent commit? Verify intent.~~ **NOT-DO — resolved by history — later sessions rewrote the builders wholesale (CHANGELOG 0.2.1-beta builder architecture); the 26-line diff question is moot.**
~~22. **Investigate `src/constants/binding-versions.ts` diff** — 27 lines changed, not by me. Same concern.~~ **NOT-DO — explained — `8e034da8` was the binding-spec regeneration (commit message on record); no mystery change.**
~~23. **Check `src/constants/protocols.ts`** — 8 lines changed in the concurrent commit. Verify no behavioral change.~~ **NOT-DO — explained — protocol-list changes in that window came with `solace`/`anypointmq`/`ros2` (CHANGELOG 0.2.1-beta protocol split-brain fix).**
~~24. **Run a full code deduplication scan** — the previous self-review identified shared-utils patterns that may have further consolidation potential.~~ done — jscpd enforces a 0% threshold with 0 clones (FEATURES.md §Duplication)
~~25. **Review `src/emitter.ts` (90 lines)** — does it still need all its imports after the extraction? Check for dead imports.~~ **NOT-DO — stale pointer — `src/emitter.ts` was touched many times since; unused-import rules keep it clean.**

#### Lower Priority (Polish)

~~26. **Add error message tests for `JsonSchema` type assertion helpers** (if any are added).~~ **Won't implement — contingent — no `JsonSchema` assertion helpers were ever added, so there is nothing to test.**
~~27. **Consider extracting `intrinsicToSchema()` mapping table** into a data file (YAML/JSON) for easier maintenance.~~ **Won't implement — kept as code — `src/intrinsic-mapping.ts` remains the single mapping source; no external data file.**
~~28. **Add a snapshot test for `JsonSchema` type shape** — lock the interface to prevent accidental field removal.~~ **Won't implement — no field-shape snapshot — `test/unit/shared-schema-types.test.ts` locks the barrel's public-API exports instead.**
~~29. **Benchmark `JsonSchema` object creation** — ensure the 20 extra fields don't impact emitter performance.~~ **Won't implement — never isolated — the benchmark suite emits overall compile-time budgets (15s/30s tiers, `test/benchmark/`).**
~~30. **Add ESLint rule to prevent re-introducing `SchemaObject` as a name.**~~ **Won't implement — no rule added — the rename stuck by convention (zero `SchemaObject` matches today, grep-verified).**
~~31. **Review all `as JsonSchema` casts** — are any unsafe? Should they be validated?~~ **Won't implement — casts survive where pragmatic; the zero-any contract governs src (FEATURES.md §Core Emitter).**
~~32. **Check if `[key: string]: unknown` index signature on `JsonSchema` hides type errors.**~~ **Won't implement — index signature kept deliberately for `x-*` extension keys; no change made.**
~~33. **Consider splitting `JsonSchema` into `JsonSchemaCore` (draft-07) and `AsyncAPISchemaObject` (extends with AsyncAPI-specific fields).**~~ **Won't implement — single interface kept — structurally compatible with Draft-07 and OpenAPI per its JSDoc (`src/domain/models/asyncapi-document.ts`).**
~~34. **Add integration test: compile a spec, parse output, verify `JsonSchema` round-trips correctly through JSON serialization.**~~ done — `test/integration/round-trip-verification.test.ts`
~~35. **Review the `sourceFile` method in `schema-emitter.ts` — does it handle `JsonSchema` correctly in multi-file mode?**~~ done — covered — `test/integration/multi-file-output.test.ts` plus split-schemas graph invariants (`test/property/`)

#### Lower Priority (Infrastructure)

~~36. **Add a pre-push hook that runs the coverage gate** (currently only pre-commit).~~ **Won't implement — never added — pre-commit already runs the full verify including the coverage gate (`.husky/pre-commit`).**
~~37. **Set up CI matrix testing** — Bun + Node.js (if available) to catch runtime-specific issues.~~ done — in substance — CI runs Node for pnpm steps and Bun for native coverage in the same job (`.github/workflows/ci.yml`)
~~38. **Add a `bun run check` composite command** — build + lint + test + coverage gate in one step.~~ done — `pnpm run verify` is the composite gate (`package.json`)
~~39. **Consider migrating from vitest to Bun's test runner** — but only after Bun fixes the OOM issue documented in AGENTS.md.~~ **Won't implement — priority reversed — Bun is retained only for coverage; vitest stayed the runner (CHANGELOG 0.2.1-beta pnpm migration).**
~~40. **Add a `docs/generated/` section with auto-generated API docs from TSDoc comments.**~~ **Won't implement — never built — the API surface is documented via FEATURES.md, AGENTS.md and `docs/guides/` instead.**

#### Lower Priority (Future-Proofing)

~~41. **Evaluate whether the TypeSpec compiler API will change `EmitEntity` in upcoming versions.**~~ **Won't implement — absorbed — ROADMAP §EFv1 monitors `@typespec/asset-emitter` changes quarterly instead.**
~~42. **Track AsyncAPI 3.2 spec changes** — may introduce new schema fields or deprecate existing ones.~~ **Won't implement — no 3.2 tracker — output is pinned AsyncAPI 3.1-only (ROADMAP §Non-Goals).**
~~43. **Consider adding JSON Schema draft 2020-12 support** alongside draft-07.~~ **Won't implement — not pursued — Draft-07 stays the output format under the 3.1-only scope (ROADMAP §Non-Goals).**
~~44. **Evaluate `zod` or `@sinclair/typebox` for runtime validation of `JsonSchema` objects.**~~ **Won't implement — rejected in practice — AJV validates against the official AsyncAPI 3.1 schema (`test/utils/schema-validator.ts`).**
~~45. **Add a migration guide for users upgrading from `SchemaObject` to `JsonSchema`** (if any external consumers exist).~~ **Won't implement — never needed — no external consumers exist (ROADMAP §Ecosystem).**
~~46. **Review whether the `Ref` / `SchemaRef` / `ref()` / `refSchema()` helper functions can be consolidated.**~~ done — each `ref*` helper is now a one-line wrapper over `ref()` in `src/domain/models/asyncapi-document.ts`
~~47. **Add property-based testing (fast-check) for `JsonSchema` generation** — generate random TypeSpec specs, verify output is always valid JSON Schema.~~ done — `test/property/emitter-properties.test.ts`, 6 seeded fast-check invariants (ROADMAP §Architecture DONE note)
~~48. **Consider a `JsonSchemaBuilder` fluent API** for programmatic schema construction in tests.~~ **Won't implement — never built — tests construct documents through compile helpers (`test/utils/test-helpers.ts`).**
~~49. **Evaluate whether `TypeEmitter<JsonSchema, AsyncAPIEmitterOptions>` should use a narrower type than `JsonSchema` for the generic parameter.**~~ **Won't implement — signature untouched — the EFv1 rewrite plan keeps that judgment pending (ROADMAP §EFv1).**
~~50. **Review the entire `src/domain/models/asyncapi-document.ts` file** — at 288 lines with 20+ interfaces, consider splitting by concern (channels, operations, messages, security, schemas).~~ **Won't implement — file grew to 400 lines and was never split — it is the self-contained domain model.**

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
