# Status Report — Shared Module Hardening & Self-Review
> **Live remainder:** none — every item resolved in the 2026-11-19/20 corpus sweep (verdicts inline; routed work lives in TODO_LIST.md / ROADMAP.md).

**Date:** 2026-08-05 18:14
**Session scope:** `src/shared/` cross-emitter module verification + hardening (TODO_LIST item #1)
**Commit:** `4445c06` — `test(shared): add barrel public API contract tests and refine shared module docs`
**Verified at report time:** 717 tests pass / 0 fail, lint 0/0, build 0 errors, coverage gate PASSED (95.3% avg line, 33 files, min 75% per file)

> **Update (later sessions same day):** Test count grew to 869. The shared module barrel remains as-is — `SchemaRef`/`SchemaMap` kept as forward-looking public API (TODO_LIST item #13). The `./shared` subpath split into neutral/bound entry points remains a ROADMAP raw idea.

---

## What triggered this session

A task table (TODO_LIST item #1) claimed the `src/shared/` cross-emitter module was "complete and tested (21 tests)" with evidence listing six exports. The instruction was: READ, UNDERSTAND, RESEARCH, REFLECT, break it down, execute, verify.

---

## a) FULLY DONE

~~1. **Verified all six claimed exports exist** in `src/shared/index.ts`: `JsonSchema`, `SchemaRef`, `SchemaMap` (types), `generateSchemas`, `extractValue`, `intrinsicToSchema`, `AsyncAPISchemaEmitter` (runtime). Confirmed the `./shared` subpath export is wired in `package.json` `exports` map (types + default).~~ done — all exports present in `src/shared/index.ts` today; `./shared` subpath wired in `package.json`
~~2. **Fixed stale doc drift in `AGENTS.md`**: "19 tests" → "25 tests" for `shared-schema-types.test.ts`; Quick Start block "713 pass" → "717 pass".~~ done — AGENTS.md carries audit-verified counts from the 2026-10-03 audit
~~3. **Rewrote `src/shared/index.ts` JSDoc** to stop lying. The old comment claimed the module let other emitters reuse the pipeline "without pulling in AsyncAPI-specific types" — false, because `generateSchemas` and `AsyncAPISchemaEmitter` are bound to `AsyncAPIEmitterOptions` and the AsyncAPI `$lib`. New doc honestly splits exports into two tiers: **Protocol-neutral** (`JsonSchema`/`SchemaRef`/`SchemaMap`/`extractValue`/`intrinsicToSchema`) vs **AsyncAPI-bound convenience** (`generateSchemas`/`AsyncAPISchemaEmitter`).~~ done — two-tier JSDoc present in `src/shared/index.ts`
~~4. **Added 4 barrel public-API contract tests** in a new `shared barrel public API surface` describe block: (a) all four runtime members are functions, (b) no unexpected runtime leaks via `Object.keys()`, (c) `AsyncAPISchemaEmitter.prototype` exposes expected `TypeEmitter` overrides, (d) type-only exports compile.~~ done — `test/unit/shared-schema-types.test.ts` describe block `shared module exports`
~~5. **Redirected all test imports through the public barrel** (`../../src/shared/index.js`) — previously tests imported each symbol from its internal module path, so deleting a barrel re-export would have left every test green. The barrel is now actually exercised.~~ done — tests import via the barrel at `src/shared/index.ts`
~~6. **Updated `TODO_LIST.md`** item #1 to 25 tests incl. barrel contract, with revised scope guidance.~~ **Superseded — ROADMAP.md Current State section.**
~~7. **Verified dist output** carries the new honest JSDoc and the barrel resolves at the built path.~~ done — built barrel resolves at `dist/src/shared/index.js` — dist present today
~~8. **Full suite green**: 717/717, lint clean, coverage gate passed.~~ **NOT-DO — point-in-time gate result; today's gate is `pnpm run verify`.**

---

## b) PARTIALLY DONE

~~1. **Barrel contract test depth.** The four new tests lock the _surface_ (keys exist, no extras, prototype overrides present) but do NOT exercise the AsyncAPI-bound tier end-to-end through the barrel. There is no test that calls `generateSchemas` via the barrel import in a real TypeSpec compilation. The neutral-tier functions (`extractValue`, `intrinsicToSchema`) ARE behavior-tested through the barrel now, which is good.~~ **Won't implement — neutral tier is behavior-tested via `test/unit/shared-schema-types.test.ts`; the bound tier folds into the harvested dist subpath test.**
~~2. **Neutrality claim verification.** The new JSDoc labels `extractValue`/`intrinsicToSchema` as protocol-neutral. I asserted this by reading their source (they depend only on `JsonSchema` type + `@typespec/asset-emitter` types, both type-only/erased). I did NOT run a tool to prove the transitive runtime dependency graph contains zero AsyncAPI-specific code. The claim is very likely true but is not machine-verified.~~ **Won't implement — neutrality documented in JSDoc tiers only; never machine-checked.**
~~3. **`SchemaRef` / `SchemaMap` judgment.** These two types still have **zero production consumers** — only the test file references them. Prior status report `2026-07-23_05-09` flagged them as potential dead code. I added a compile-time smoke test for them (better than nothing) but deferred the real decision: keep as legitimate shared API surface, or delete as YAGNI.~~ done — kept — still exported from `src/shared/index.ts` and exercised by `test/unit/shared-schema-types.test.ts`

---

## c) NOT STARTED

~~1. **End-to-end `./shared` subpath import test from built `dist/`.** No test imports `@lars-artmann/typespec-asyncapi/shared` as a real external consumer would (resolved through `dist/src/shared/index.js` via the package `exports` map). All tests import from `src/` source.~~ **NOT-DO — duplicate of item 1 in section f — harvested as a TODO_LIST row.**
2. **OpenAPI emitter skeleton that consumes the neutral tier.** Explicitly out of scope for this project (correctly), but it remains the only real proof that the shared module is useful to anyone. **→ ROADMAP §Ecosystem Integration — OpenAPI 3.x cross-emitter type sharing**
3. **Splitting the barrel into two entry points** (`./shared` for neutral, `./asyncapi` for bound) so consumers can import only the neutral tier without pulling AsyncAPI runtime deps. Discussed in the new JSDoc as guidance; not implemented. **→ ROADMAP §Developer Experience — split `./shared` subpath raw idea**

---

## d) TOTALLY FUCKED UP

Nothing irreversible. Two process mistakes worth naming:

~~1. **Updated `AGENTS.md` test count TWICE** (19 → 21 → 25). I edited the doc after the first test run, then had to edit it _again_ after adding the 4 contract tests. Should have added tests first, run once, then updated docs a single time. Wasted a round trip and created a transiently-inaccurate doc state.~~ **NOT-DO — process lesson — no work product.**
~~2. **Did not run the coverage gate during the work.** I only ran it when preparing this status report. If my new tests had somehow lowered coverage on a touched file, I would have shipped a gate failure. Got lucky; process was wrong.~~ **NOT-DO — process lesson — no work product.**

---

## e) WHAT WE SHOULD IMPROVE

~~1. **Order of operations for doc+test changes:** implement → test → update docs once. Never update a count doc before the final test count is known.~~ **NOT-DO — process lesson — no work product.**
~~2. **Always run the coverage gate** (`bun run test:coverage:gate`) after adding tests, not just `bun run test`. The gate is the real quality bar; bare test runs don't catch per-file coverage regressions.~~ done — `test:coverage:gate` runs inside `verify` and `.husky/pre-commit`
~~3. **The barrel contract test should assert the neutral tier has no runtime dependency on AsyncAPI code.** A static import-graph check (or a test that imports the neutral symbols and asserts no `$lib`/`document-builder`/`schema-generator` modules are in the loaded module cache) would make the neutrality claim machine-verifiable.~~ **Won't implement — never added; neutrality claim rests on the JSDoc tier split.**
~~4. **Decide `SchemaRef`/`SchemaMap` fate.** Either delete them (YAGNI, zero consumers) or document why they must stay (forward-looking public API). Keeping them in limbo is the worst option.~~ done — decided — kept as forward-looking API; ROADMAP rewrite plan preserves `src/shared/`
~~5. **The compile-time type test is contrived** (`{ ...ref, ...map.X }`). Replace with something that asserts a real property of the type (e.g., that `JsonSchema` accepts `$ref` + `type` simultaneously, or that `SchemaMap` is assignable to `Record<string, JsonSchema>`).~~ **Won't implement — compile-time smoke test remains; assignability assertion never added.**

---

## f) Up to 50 things we should get done next

> **Resolution:** Items 1–5 (high value) — barrel contract tests added, SchemaRef/SchemaMap kept as forward-looking API (TODO_LIST #13). Items 6–12 (medium value) — barrel split remains a ROADMAP raw idea. Items 13–20 (low value/process) — partially addressed.

Scoped to the shared module + immediate surroundings (this session's area).

### High value

1. Add an end-to-end test importing `generateSchemas` through the **built** `dist/src/shared/index.js` (not `src/`), proving the published subpath works. **→ TODO_LIST §Test-Suite Integrity (dist/ shared-subpath e2e import row)**
~~2. Add a test that calls `generateSchemas` via the barrel on a minimal TypeSpec program and asserts schemas are produced — closes the "AsyncAPI-bound tier not tested through barrel" gap.~~ **Won't implement — folded into the harvested dist subpath test — item 1.**
~~3. Replace the contrived compile-time type test with a meaningful `SchemaMap` assignability assertion.~~ **Won't implement — assignability assertion never replaced.**
~~4. Run a static analysis (e.g., `madge` or a custom trace) to prove the neutral-tier transitive runtime graph excludes `document-builder.ts`, `schema-generator.ts`, `$lib`, and `lib.ts`.~~ **Won't implement — no import-graph proof was added.**
~~5. Decide and act: keep or delete `SchemaRef` and `SchemaMap`.~~ done — decided — kept; still exported and tested today

### Medium value

6. Consider splitting the barrel: `./shared` (neutral) vs keeping AsyncAPI-bound symbols on the main barrel, so neutral consumers pay zero AsyncAPI runtime cost. **→ ROADMAP §Developer Experience — split `./shared` subpath raw idea**
~~7. Add a JSDoc `@example` tag on `extractValue` and `intrinsicToSchema` (currently only the module has an example).~~ **Won't implement — no `@example` tags on `extractValue` or `intrinsicToSchema` today.**
~~8. Document the `EmitEntity<T>` discriminated-union contract in the shared module (it's in AGENTS.md but not near the exported `extractValue`).~~ **Won't implement — never added to the shared module; `AGENTS.md` §EmitEntity remains the documentation.**
~~9. Add a negative test: `extractValue` on a `circular` kind returns `{}`.~~ done — circular-kind case — `test/unit/shared-schema-types.test.ts` line 127
~~10. Add a negative test: `intrinsicToSchema` on an empty/undefined name defaults safely.~~ done — unknown-name default — same file line 212
~~11. Audit whether `AsyncAPISchemaEmitter` should be renamed to `JsonSchemaEmitter` when exported from the shared module (the "AsyncAPI" prefix contradicts the cross-emitter framing). Prior report `2026-07-23_05-09` raised this; still unresolved.~~ **Won't implement — still exported as `AsyncAPISchemaEmitter`; name frozen under semver.**
~~12. Add a test that the `./shared` subpath resolves under Node ESM `exports` resolution (not just the source path).~~ **Won't implement — folded into the harvested dist subpath test — item 1.**

### Low value / polish

~~13. Standardize the barrel's runtime-member ordering (alphabetical vs grouped-by-tier) and enforce via the contract test's `toStrictEqual`.~~ **Won't implement — ordering unchanged; contract tests assert key sets.**
~~14. Add `@since` JSDoc tags to shared exports now that the module has a documented tier split.~~ **Won't implement — never added.**
~~15. Consider exporting `isStdlibType` / `collectAllStdlibNames` from `stdlib-helpers.ts` if neutral consumers need to filter stdlib (currently internal).~~ **Won't implement — `stdlib-helpers.ts` remains internal.**
~~16. The `tuple` emitter path produces `{ items: { enum: [...], type: "array" }, type: "array" }` — verify this is valid JSON Schema for tuples (looks suspicious; `enum` inside `items` is odd). Not session-introduced but noticed.~~ done — tuple output locked by `test/compliance/type-mapping-completeness.test.ts` per-position items tests
~~17. Add a shared-module README snippet usable verbatim in the package's main README "Consumers" section.~~ **Won't implement — README has no shared-module section; the subpath is documented in `AGENTS.md`.**
~~18. Track the prior status-report drift: `docs/status/archived/2026-08-05_18-01_TODO-EXECUTION-SESSION.md` line 47 says "21 tests" — correctly left as a point-in-time snapshot, but a one-line annotation noting the current count is 25 would help future readers.~~ **NOT-DO — status reports are point-in-time snapshots; this sweep annotates them instead.**

### Process (whole session, not just shared module)

19. Add a pre-commit or CI check that fails when AGENTS.md test-count lines diverge from `vitest run` output by >0. **→ ROADMAP §Developer Experience — docs-entropy CI guard raw idea**
~~20. Add the coverage gate to the default `validate` script path so it can't be skipped accidentally.~~ **Won't implement — gate wired into `verify`, the CI and pre-commit path; `validate` intentionally lighter.**

(20 concrete items. The remaining 30 slots in "up to 50" are intentionally left empty — padding this list with speculative work outside this session's scope would violate the "report based on this session" instruction.)

---

## g) Questions I cannot figure out myself

~~1. **`SchemaRef` / `SchemaMap` — keep or delete?** They have zero production consumers. I cannot determine from code alone whether they exist as a deliberate forward-looking public API contract (for the hypothetical OpenAPI emitter) or are leftover scaffolding from the module's creation. Your intent decides; the code is neutral.~~ done — decided — kept as public API, still exported and tested

2. **Should the AsyncAPI-bound tier (`generateSchemas`, `AsyncAPISchemaEmitter`) stay in the `./shared` barrel at all?** The new JSDoc frames them as "convenience", but a purist would argue a module named "shared" should only contain neutral exports and the bound symbols belong on the main barrel. This is a public-API design decision with publish-cost implications; I will not make it unilaterally. **→ ROADMAP §Developer Experience — split `./shared` subpath raw idea**

~~3. **Is the `./shared` subpath export considered published/stable (`0.2.0-beta`) or still experimental?** The package is `0.2.0-beta` and `private: false`. If the subpath is considered public, the neutrality split and any rename have semver consequences I should not impose without your call.~~ done — frozen under semver with the 1.0.0 public-API freeze — TODO_LIST Release section

---

## Verdict

The shared module is in a strictly better state than before this session: honest docs, barrel actually tested, stale counts corrected, full suite + coverage green. The work is **fully done against the original task** (verify exports + fix drift). The remaining gaps (end-to-end dist import test, neutrality machine-proof, `SchemaRef`/`SchemaMap` fate, barrel split) are improvements, not regressions.
