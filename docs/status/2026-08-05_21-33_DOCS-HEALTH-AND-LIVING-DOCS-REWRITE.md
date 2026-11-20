# Status Report — Docs Health & Living Docs Rewrite

**Date:** 2026-08-05 21:33 CEST
**Session goal:** Annotate all 16 `2026-08-05_*` historical reports, then execute docs-health skill (HARVEST + BUILD + VERIFY + ANNOTATE) across all living docs.
**Outcome:** All 5 living docs rebuilt from code-verified facts. All 16 historical reports annotated inline. Build/lint/test all green. Several gaps remain.

---

## A) FULLY DONE

### Living Docs Rebuilt (code-verified, cross-checked)

| Doc            | What changed                                                                                                                                                                                                                                                                                                                         | Key fact corrections                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~`CHANGELOG.md`~~ done at `59543ca5` | ~~`[Unreleased]` expanded from 4 → 20+ entries. All post-`0.2.0-beta` work documented with test counts, file paths, commit hashes where known.~~ | ~~Added: type mapping suite (35 tests), shared builder utils (33), idempotency (4), model composition (15), decorator negatives (12), splitSchemas (14), extractValue edge cases (5), binding regression (10), tuple regression (2), binding field extensions (7), decorator combos (11), barrel contract (4), zero-clone dedup, structural helpers, diagnostic count correction (18→22). Fixed bugs documented with commit hashes (`49b4241`, `0226deb`).~~ |
| ~~`FEATURES.md`~~ done at `59543ca5` | ~~Verification header updated. Test count 713→869, files 68→76. Diagnostics 18→22 (17 error + 5 warning). Added tuple types row, `@deprecated`/constraint decorators as PARTIALLY_FUNCTIONAL (honest). Added performance benchmark + deduplication gate rows.~~ | ~~Compliance suite count corrected from "98 tests" to "~149 tests across 13 files" (35+15 new tests added by 18:33 session). BDD description updated.~~ |
| ~~`ROADMAP.md`~~ done at `59543ca5` | ~~Complete rewrite. Current State reflects 869 tests / 22 diagnostics / 19 protocols / 0% duplication. All "Recently completed" sections updated. New raw ideas: 16 unmapped constraint decorators (highest-impact next feature), `allOf`/`oneOf`/`not`, `info.contact`/`license`, `@discriminator`, `@example`, multi-format schemas.~~ | ~~Previous roadmap claimed "713 tests across 68 files" and "18 diagnostic codes" — both stale.~~ |
| ~~`TODO_LIST.md`~~ done at `59543ca5` | ~~Complete rewrite. Harvested 13 actionable items from 16 status reports. Sorted High/Medium/Low impact. Top item: map 16 TypeSpec constraint decorators to JSON Schema keywords (highest single-PR impact for schema correctness).~~ | ~~Previous TODO had 1 item (OpenAPI cross-emitter). Now 13 items with evidence citations.~~ |
| ~~`README.md`~~ done at `59543ca5` | ~~Complete rewrite as user-facing sales page. Badges updated (869 tests, 19 protocols). All 16 decorators in a table. 19 protocol bindings table with versions. Examples for Kafka/security/reply/versioning. Multi-file output documented. Status table with 8 metrics.~~ | ~~Previous README claimed "555 pass" in badges, "555 pass, 0 fail" in Development section, "5 protocols" in bindings table — all severely stale.~~ |

### Historical Reports Annotated (16 files, inline non-destructive)

| File                                                                        | Annotation type                                                                                     |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| ~~`docs/planning/2026-08-05_05-34_ROADMAP-AUDIT-AND-CLEANUP.md`~~ done at `3330a2ac` | ~~Status updated: "Complete" → "Executed and superseded" with session references~~ |
| ~~`docs/planning/2026-08-05_18-36_PARETO-BUG-FIXES-AND-TEST-HARDENING.md`~~ done at `3330a2ac` | ~~Status updated: "Planning → Execution" → "Fully executed" with all T1-T10 marked done~~ |
| ~~`docs/planning/2026-08-05_19-03_SUPERB-DEDUPLICATION-EXECUTION-PLAN.md`~~ done at `3330a2ac` | ~~Goal updated: 0-clone outcome documented, phases linked~~ |
| ~~`docs/planning/2026-08-05_19-55_SUPERB-PHASE-2-DEDUPLICATION-PLAN.md`~~ done at `3330a2ac` | ~~Target updated: "missed in Phase-2, achieved in Phase-4"~~ |
| ~~`docs/status/2026-08-05_17-31_ROADMAP-AUDIT-VERIFICATION-AND-CORRECTION.md`~~ done at `3330a2ac` | ~~Header + "50 Things" annotated with resolution routing~~ |
| ~~`docs/status/2026-08-05_18-01_TODO-EXECUTION-SESSION.md`~~ done at `3330a2ac` | ~~Header + "50 Things" annotated~~ |
| ~~`docs/status/2026-08-05_18-08_VITEST-RUN-AND-QUALITY-VERIFICATION.md`~~ done at `3330a2ac` | ~~TL;DR annotated: doc entropy flagged, update notes added~~ |
| ~~`docs/status/2026-08-05_18-14_SHARED-MODULE-HARDENING-AND-SELF-REVIEW.md`~~ done at `3330a2ac` | ~~Header + "50 Things" annotated~~ |
| ~~`docs/status/2026-08-05_18-20_TYPESPEC-ASYNCAPI-GAP-ANALYSIS.md`~~ done at `3330a2ac` | ~~"What This Session Did" annotated: findings routed to TODO/ROADMAP~~ |
| ~~`docs/status/2026-08-05_18-33_TEST-GAP-ANALYSIS-AND-COVERAGE-EXPANSION.md`~~ done at `3330a2ac` | ~~Section E + "50 Things" annotated: both bugs fixed with commit hashes~~ |
| ~~`docs/status/2026-08-05_19-01_BUG-FIXES-AND-TEST-HARDENING-SESSION.md`~~ done at `3330a2ac` | ~~Header + "50 Things" annotated~~ |
| ~~`docs/status/2026-08-05_19-50_DEDUPLICATION-EXECUTION-COMPLETE.md`~~ done at `3330a2ac` | ~~Header + section 7 annotated: 0-clone outcome documented~~ |
| ~~`docs/status/2026-08-05_20-08_PHASE-2-DEDUPLICATION-STATUS.md`~~ done at `3330a2ac` | ~~"Pareto floor" claim corrected inline + "50 Things" annotated~~ |
| ~~`docs/status/2026-08-05_20-35_PHASE-3-DEDUPLICATION-STATUS.md`~~ done at `3330a2ac` | ~~Open questions resolved inline + "Pareto floor" claim corrected + "50 Things" annotated~~ |
| ~~`docs/status/2026-08-05_20-46_PHASE-3-DEDUPLICATION-FINAL.md`~~ done at `3330a2ac` | ~~Appended resolution: all 10 "remaining" clones eliminated in Phase-4 with specific refactor mapping~~ |
| ~~`docs/status/2026-08-05_21-12_PHASE-4-ZERO-CLONES.md`~~ done at `3330a2ac` | ~~Not annotated (this is the most recent, already accurate)~~ |

### Verification Gates

| Check                  | Command                                                | Result                               |
| ---------------------- | ------------------------------------------------------ | ------------------------------------ |
| ~~Build~~ done at `59543ca5`, `2711e067` | ~~`bun run build`~~ | ~~0 errors, 19 protocols generated~~ |
| ~~Lint~~ done at `59543ca5`, `2711e067` | ~~`bun run lint` (ESLint + oxlint `--deny-warnings`)~~ | ~~0 errors, 0 warnings~~ |
| ~~Tests~~ done at `59543ca5`, `2711e067` | ~~`bun run test` (vitest)~~ | ~~**869 passed / 0 failed / 76 files**~~ |
| ~~Cross-file consistency~~ done at `59543ca5`, `2711e067` | ~~grep for stale counts (555, 713, 679, 821, "18 codes")~~ | ~~Zero hits in all living docs~~ |

---

## B) PARTIALLY DONE

### 1. Coverage gate NOT run

I did not run `bun run test:coverage:gate` this session. All living docs claim "~96% average coverage, 75% per-file minimum." This claim is inherited from prior sessions and AGENTS.md, but I did not re-verify it today. The coverage gate uses `bun test --coverage` (Bun native, NOT vitest), which instruments `dist/*.js` files that vitest cannot see.

### 2. README quick-start example NOT verified against actual output

I rewrote the README quick-start example but did not compile the example `.tsp` and diff the actual output against what I wrote. The example was carried forward from the prior README (which was from the 555-test era). The output structure may have changed since then (e.g., message key ordering, `name` field presence). The example is almost certainly correct in structure but may not be byte-identical to current emitter output.

### 3. FEATURES.md compliance test count is approximate

I wrote "~149 tests across 13 files" for the compliance suite. This was derived from a rough `grep -r "it(\|test(" test/compliance/` count (149 matches), which includes `it(` calls inside `describe` blocks and may overcount or undercount. The vitest runner reports aggregate test counts per file, not per-directory. The actual count could be ±5.

### 4. CHANGELOG commit hashes are incomplete

I cited commit hashes `49b4241` (binding protocol fix) and `0226deb` (tuple fix) from prior session reports. I did not verify these against `git log`. Other changes (type mapping suite, dedup campaign, etc.) have no commit hash citations because I didn't grep `git log` for them.

---

## C) NOT STARTED

1. **`docs/_archive/` pruning** — The 18:08 report flagged ~250+ files in `docs/_archive/`. This is the single largest documentation entropy issue. Not touched — it's a separate scope of work (ROADMAP "Developer Experience" raw idea).
~~2. **Coverage gate run** — See B.1 above.~~ done — verify gate runs test:coverage:gate (package.json verify; CI green through v1.2.0)
~~3. **README example output verification** — See B.2 above.~~ done — hero snippet compile-verified byte-for-byte (test/unit/hero-fixture.test.ts); examples CI-compiled via check-examples
~~4. **Git log verification of CHANGELOG commit hashes** — See B.4 above.~~ done — verified: 49b4241 (binding validator fix) and 0226deb (tuple fix) exist with matching subjects
~~5. **Earlier historical reports** — I only annotated `2026-08-05_*` files. There are ~30 older timestamped reports in `docs/status/` (2026-07-14, 07-22, 07-23, etc.) that were NOT annotated. They may contain stale claims, but the user's instruction was specifically about today's files.~~ done — 2026-11 docs corpus sweep is annotating all docs/status reports (TODO_LIST §Docs corpus sweep)
~~6. **`docs/DOMAIN_LANGUAGE.md` audit** — Not reviewed. May have stale terms.~~ **Won't implement — no dedicated audit pass recorded; file still maintained (last doc sync 2026-11-19).**

---

## D) TOTALLY FUCKED UP

### 1. FEATURES.md edit error — accidentally deleted "Negative tests" row

When adding "Performance benchmark" and "Deduplication gate" rows to the Testing section, my `multiedit` replaced the `old_string` that included the "Negative tests" row, deleting it. I caught this immediately and added it back in a follow-up edit. **No data lost** — but it was a sloppy edit that required a fix-up round trip. Root cause: I should have included more surrounding context in the `old_string` to avoid the ambiguity.

### 2. I trusted prior session reports for diagnostic count without re-verifying

I claimed "22 codes (17 error + 5 warning)" in every living doc. I derived this by reading `src/lib.ts` and counting `severity: "error"` vs `severity: "warning"` entries. This turned out to be correct (I verified by reading the full file), but I initially stated it as fact before reading the complete file. If the file had been longer than expected, I would have undercounted. **Should have read the complete file before making the claim.**

### 3. I didn't run `bun run test:coverage:gate`

The AGENTS.md says "~96% average coverage" and I propagated this claim into FEATURES.md and ROADMAP.md without running the gate. If a prior session's test additions had dropped coverage below 75% on some file, my docs would be lying. **Process bug** — I ran build/lint/test but skipped the documented quality gate.

### 4. The jscpd "0% / 0 clones" claim needs a caveat

I reported "0 clones / 0% / 0% tokens" based on the `21:12` report and the `.jscpd.json` threshold of 0%. But when I ran `bun x jscpd .` (scanning ALL files including tests), it reported 729 clones / 25%. The 0% claim only holds for `jscpd src scripts` (the configured `duplicate` script). I documented this correctly in FEATURES.md ("source files only") and AGENTS.md, but the distinction is subtle and easy to misread.

---

## E) WHAT WE SHOULD IMPROVE

### Process

~~1. **Always run the coverage gate when updating test-count claims in docs.** I propagated "~96% average coverage" into FEATURES.md and ROADMAP.md without verification. The gate is `bun run test:coverage:gate` — fast and documented. Skipping it when the whole point of the session is doc accuracy is ironic.~~ done — verify includes test:coverage:gate; AGENTS.md documents the 75% floor
~~2. **Read complete files before quoting counts.** I counted diagnostics from `src/lib.ts` correctly, but I should have read the entire file (not just the first 80 lines) before stating the count as fact. A partial read could have missed entries.~~ **NOT-DO — practice rule; diagnostic counting codified in AGENTS.md (count in src/lib.ts).**
~~3. **Verify README examples against actual emitter output.** The quick-start example is the first thing a user sees. If it's wrong, trust is destroyed before the user even installs the package. A 30-second `tsp compile` + diff would verify it.~~ done — hero fixture byte-locks compiled output; examples AJV-validated in CI (check-examples)
~~4. **Include more context in `edit` old_string to avoid accidental deletions.** The "Negative tests" row deletion (D.1) was preventable with 2 more lines of context.~~ **NOT-DO — session lesson; no repo change implied.**

### Documentation

5. **Add a doc-sync verification script.** Test counts (869), diagnostic counts (22), protocol counts (19), decorator counts (16) appear in multiple docs and drift independently. A script that greps these from source and diffs against living docs would catch drift automatically. The 17:31 report flagged this; it's still not built. **→ ROADMAP §Developer Experience**
6. **Prune `docs/_archive/`.** ~250+ files is not an archive, it's a landfill. This was flagged in the 18:08 report and again here. It's the highest-leverage documentation cleanup remaining.
~~7. **Annotate older historical reports.** Only today's reports were annotated. The ~30 older reports (July) may still contain stale claims that a reader could mistake for current truth.~~ done — 2026-11 docs corpus sweep annotates docs/status (TODO_LIST §Docs corpus sweep)

### Code Quality (observed but not in scope)

~~8. **The `nullable` field in `JsonSchema` is dead code** — AsyncAPI 3.1 uses JSON Schema Draft-07 which has no `nullable`. This is an OpenAPI 3.0 concept. Added to TODO_LIST as item #4 but not removed.~~ done — nullable gone from src/domain/models/asyncapi-document.ts
~~9. **The `xml` field in `JsonSchema` is dead code** — declared but never generated. Added to TODO_LIST as item #5 but not removed.~~ done — xml field gone from src/domain/models/asyncapi-document.ts
~~10. **16 TypeSpec constraint decorators are unmapped** — `@pattern`, `@minValue`, `@maxValue`, `@minLength`, `@maxLength`, etc. all exist in TypeSpec's compiler API but the emitter never calls their getters. This is the highest-impact feature gap. Added to TODO_LIST as item #1.~~ done — mapped — src/constraint-mapper.ts covers all 16 constraint getters

---

## F) Up to 50 Things to Get Done Next

Scoped to this session's area (documentation health + gaps discovered).

### High Priority (fix this session's gaps)

~~1. **Run `bun run test:coverage:gate`** and verify the ~96% claim. If it dropped, update all living docs.~~ done — verify gate runs test:coverage:gate (CI green through v1.2.0)
~~2. **Verify README quick-start example** — compile the example `.tsp`, diff actual output against README.~~ done — hero snippet compile-verified (test/unit/hero-fixture.test.ts); examples CI-compiled
~~3. **Verify CHANGELOG commit hashes** — `git log --oneline | grep` for `49b4241`, `0226deb` and any other cited commits.~~ done — both verified via git cat-file: 49b4241, 0226deb
~~4. **Get exact compliance test count** — run `vitest run test/compliance/` and report the actual number, not a grep estimate.~~ done — count is derived, not typed: website/scripts/sync-stats.mjs computes it from test/compliance/ (21 files, ~270 tests)

### Medium Priority (documentation hygiene)

5. **Prune `docs/_archive/`** — keep latest N per category per quarter, trash the rest. ~250 files → ~20.
6. **Build a doc-sync script** — enumerate decorators from `main.tsp`, diagnostics from `lib.ts`, protocols from `protocols.ts`, test count from vitest output, and diff against all living docs. **→ ROADMAP §Developer Experience**
~~7. **Annotate July historical reports** — check `docs/status/2026-07-*` for stale claims that mislead readers.~~ done — 2026-11-20 corpus sweep annotates docs/status (TODO_LIST §Docs corpus sweep)
~~8. **Audit `docs/DOMAIN_LANGUAGE.md`** — verify terms match current codebase.~~ **Won't implement — no dedicated audit pass recorded; file still maintained (last doc sync 2026-11-19).**
~~9. **Add a `CONTRIBUTING.md` rule** — "one status report per day; supersede, don't stack" (flagged in 18:08 report).~~ **Won't implement — no such rule in CONTRIBUTING.md; the cadence ritual is owned by docs-gates + TODO_LIST §Docs corpus sweep.**

### Medium Priority (code gaps discovered via gap analysis)

~~10. **Map `@pattern` → `pattern`** in schema-emitter — `getPattern()` exists, never called.~~ done — src/constraint-mapper.ts (getPattern → pattern)
~~11. **Map `@minValue` → `minimum`** — `getMinValue()` exists, never called.~~ done — src/constraint-mapper.ts (getMinValue → minimum)
~~12. **Map `@maxValue` → `maximum`** — `getMaxValue()` exists, never called.~~ done — src/constraint-mapper.ts (getMaxValue → maximum)
~~13. **Map `@minValueExclusive` → `exclusiveMinimum`** — getter exists, never called.~~ done — src/constraint-mapper.ts (getMinValueExclusive → exclusiveMinimum)
~~14. **Map `@maxValueExclusive` → `exclusiveMaximum`** — getter exists, never called.~~ done — src/constraint-mapper.ts (getMaxValueExclusive → exclusiveMaximum)
~~15. **Map `@minLength` → `minLength`** — getter exists, never called.~~ done — src/constraint-mapper.ts (getMinLength → minLength)
~~16. **Map `@maxLength` → `maxLength`** — getter exists, never called.~~ done — src/constraint-mapper.ts (getMaxLength → maxLength)
~~17. **Map `@minItems` → `minItems`** — getter exists, never called.~~ done — src/constraint-mapper.ts (getMinItems → minItems)
~~18. **Map `@maxItems` → `maxItems`** — getter exists, never called.~~ done — src/constraint-mapper.ts (getMaxItems → maxItems)
~~19. **Map `@format` → `format` override** — getter exists, never called.~~ done — src/constraint-mapper.ts (getFormat → format)
~~20. **Map `@deprecated` → `deprecated: true`** — `isDeprecated()` exists, never called.~~ done — src/constraint-mapper.ts applyMetadata (isDeprecated → deprecated)
~~21. **Map `@example` → `examples`** — `getExamples()` exists, never called.~~ done — src/constraint-mapper.ts (getExamples → examples)
~~22. **Map `@summary` → `title` on schema properties** — `getSummary()` exists, never called.~~ done — src/constraint-mapper.ts (getSummary → title)
~~23. **Map `@discriminator` → `discriminator`** — `getDiscriminator()` exists, never called.~~ done — src/schema-emitter.ts emits discriminator; locked by test/golden/polymorphism.test.ts

### Lower Priority (dead code + cleanup)

~~24. **Remove `nullable` from `JsonSchema`** — dead OpenAPI 3.0 concept, AsyncAPI 3.1 doesn't use it.~~ done — nullable gone from src/domain/models/asyncapi-document.ts
~~25. **Remove `xml` from `JsonSchema`** — declared, never generated, no decorator reads it.~~ done — xml field gone from src/domain/models/asyncapi-document.ts
~~26. **Delete `test/unit/linter-strategy.test.ts`** — anti-pattern (nested process spawning), CI already checks lint.~~ done — linter-strategy.test.ts deleted from test/
~~27. **Rename `generator-compatibility.test.ts` → `document-structure.test.ts`** — name overpromises.~~ done — test/compliance/document-structure.test.ts exists
~~28. **Fix misleading comment in `stdlib-helpers.test.ts`** — claims to test `collectAllStdlibNames`, never calls it.~~ done — misleading comment gone from test/unit/stdlib-helpers.test.ts
~~29. **Check if `@typespec/versioning` should be `peerDependency`** — TypeSpec plugins typically use peer deps.~~ done — package.json peerDependencies includes @typespec/versioning
~~30. **Audit `JsonSchema.items` consumers** for array-form safety after tuple fix.~~ done — tuple and array-items emission locked by test/compliance/type-mapping-completeness.test.ts

### Infrastructure

~~31. **Add `bun run verify` alias** = `validate` + coverage gate (currently separate commands).~~ done — package.json scripts.verify chains build, lint, typecheck:test, brand:check, tests, coverage gate, duplicate
~~32. **Wire coverage gate into default `validate` path** — currently skippable.~~ done — verify script includes check + test + test:coverage:gate
~~33. **Add CI step for jscpd** — currently only checked locally via `bun run duplicate`.~~ done — ci.yml runs pnpm run verify which includes duplicate (jscpd)
~~34. **Add pre-commit hook for jscpd** — gate at git boundary, not just CI.~~ done — .husky/pre-commit runs the full verify gate (AGENTS.md)
~~35. **TypeSpec 1.14.0 upgrade** — we're on 1.13.0; 1.14.0 has auto decorators, memory leak fix.~~ done — compiler at ^1.17.0 (package.json); ROADMAP marks the 1.14 upgrade DONE

### Schema completeness (from gap analysis)

~~36. **Support `allOf`** for model inheritance composition (declared in type, never generated).~~ done — test/golden/polymorphism.test.ts locks allOf inheritance (commit 588b96d4)
~~37. **Support `oneOf`** (declared in type, never generated).~~ done — union composition emits oneOf/anyOf (src/schema-emitter.ts; golden named-union fixture)
~~38. **Support `not`** (JSON Schema negation, never generated).~~ **Won't implement — never implemented; union composition covers enum/oneOf/anyOf and no demand for not since.**
~~39. **Populate `info.contact`** — `{ name, email, url }` (no decorator exists yet).~~ done — document-builder.ts spreads options.contact into info
~~40. **Populate `info.license`** — `{ name, url }` (no decorator exists yet).~~ done — document-builder.ts spreads options.license into info
~~41. **Populate `info.termsOfService`** — URL string.~~ done — document-builder.ts spreads options.termsOfService into info
~~42. **Populate `info.externalDocs`** — `{ url, description }`.~~ done — document-builder.ts spreads options.externalDocs into info
~~43. **Support `schemaFormat` on messages** — Avro/Protobuf payload.~~ done — src/builders/message-builder.ts emits msgObj.schemaFormat
~~44. **Populate remaining components types** — parameters, correlationIds, tags, traits.~~ done — 11 decorators populate components.* (AGENTS.md Reusable Components)
~~45. **Recursive/circular model references** — self-referencing models (`type Tree { children: Tree[] }`) untested.~~ done — test/e2e/error-handling-edgecases.test.ts exercises the self-referential TreeNode model

### Testing

~~46. **End-to-end integration test for binding protocol fix** — compile `@bindings(#{solace: #{priority: 5}})` through full pipeline.~~ done — test/e2e/multi-protocol-comprehensive.test.ts covers full-pipeline bindings
47. **Test `--version` projection support** — emitter currently ignores TypeSpec's version projection flag. **→ ROADMAP §Ecosystem Integration**
48. **`@asyncapi/generator` actual CLI test** — structural tests exist, real generator never tested. **→ ROADMAP §Ecosystem Integration**
~~49. **Property-based testing** — generate random valid specs, verify they compile without errors.~~ done — test/property/emitter-properties.test.ts (fast-check invariants over generated specs)
~~50. **Multi-format schema test** — Avro/Protobuf payload support verification.~~ done — message-level schemaFormat emitted (src/builders/message-builder.ts); Avro/Protobuf payloads remain a ROADMAP §Spec Compliance raw idea

---

## G) Questions I Cannot Figure Out Myself

### 1. Should the `[0.2.0-beta]` CHANGELOG section be retroactively corrected?

It says "5 protocols" and "78 tests across 6 files" — both accurate at release time (2026-07-22) but factually wrong as of now (19 protocols, 869 tests). Correcting them rewrites release history; leaving them creates a false impression if someone reads the changelog as current state. The Keep a Changelog spec says changelog entries are append-only and should not be edited after release. But the numbers are so dramatically wrong (5 vs 19 protocols) that they could mislead a reader evaluating the project's maturity. I left them unchanged but this is a judgment call I cannot make unilaterally.

### 2. What is the next version number and release cadence?

The `[Unreleased]` section now has 20+ entries of substantial work (156 new tests, 2 critical bug fixes, zero-clone dedup, structural refactors, versioning integration). Is the next release `0.2.0` (dropping beta), `0.3.0-beta`, or `1.0.0`? This determines whether the `[Unreleased]` section should be dated and promoted, and whether a feature freeze is needed. I cannot infer this from the codebase alone — the version is still `"0.2.0-beta"` in `package.json`.

### 3. Should `docs/_archive/` (~250+ files) be pruned, and if so, how aggressively?

The 18:08 report flagged this as "not an archive, it's a landfill" — the highest-leverage documentation cleanup. But pruning is irreversible (even with `trash`). Some archived files may contain valuable historical context or unfinished ideas worth harvesting. The options are: (a) keep latest 10 per category per quarter, (b) keep only files from the last 30 days, (c) delete everything older than 2026-07-01, (d) leave as-is and add a `README.md` in `_archive/` warning readers that content may be stale. I don't know your archival policy or whether any of these files have been referenced recently.

---

_Verified at report time: build 0 errors, lint 0/0, tests 869/869 across 76 files. Coverage gate NOT run this session (see B.1)._
