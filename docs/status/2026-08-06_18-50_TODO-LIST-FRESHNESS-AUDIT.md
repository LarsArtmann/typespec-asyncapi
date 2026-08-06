# Status Report: TODO_LIST Freshness Audit

**Date:** 2026-08-06 18:50
**Session scope:** Verify TODO_LIST.md accuracy against actual codebase, fix drift
**Outcome:** Doc drift fixed but immediately re-staled by auto-git daemon concurrency

---

## a) FULLY DONE

### Doc drift fixed (committed in `ea74c8a`)

| Doc           | What was stale                                                                                       | Fixed to                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `AGENTS.md`   | "25 decorators"                                                                                      | **26** (16 core + 10 reusable-component)                        |
| `AGENTS.md`   | "24 codes (19 error + 5 warning)"                                                                    | **25 codes (19 error + 6 warning)**                             |
| `AGENTS.md`   | "9 reusable-component decorators"                                                                    | **10** (5 definition + 5 reference, added `@useChannelBinding`) |
| `AGENTS.md`   | "4 reference decorators" in `use-decorators.ts`                                                      | **5** (added `$useChannelBinding`)                              |
| `AGENTS.md`   | Builder file count "10 files"                                                                        | **11 files** (added `_imports.ts`)                              |
| `AGENTS.md`   | 8 stale line counts (emitter.ts, schema-emitter.ts, constraint-mapper.ts, document-builder.ts, etc.) | All corrected to actual `wc -l` values                          |
| `AGENTS.md`   | "~208 tests across 18 files" (compliance suite)                                                      | **~272 tests** across 18 files                                  |
| `AGENTS.md`   | "38 tests" constraint decorators                                                                     | **54 tests**                                                    |
| `AGENTS.md`   | "13 tests" polymorphism                                                                              | **15 tests**                                                    |
| `AGENTS.md`   | "14 tests" reusable components                                                                       | **41 tests** (added channelBindings)                            |
| `AGENTS.md`   | "components.messageBindings" only                                                                    | Added **components.channelBindings**                            |
| `FEATURES.md` | Split-brain: line 7 said "26 decorators" but line 51 said "25 decorators" and "9 reusable-component" | Line 51 corrected to **26** and **10**                          |
| `README.md`   | "22 compile-time diagnostics (17 error + 5 warning)"                                                 | **25 (19 error + 6 warning)**                                   |
| `README.md`   | "24 codes (19 error + 5 warning)" in metrics table                                                   | **25 codes (19 error + 6 warning)**                             |

### Verification performed

- Counted all 26 `extern dec` declarations in `lib/main.tsp` via grep
- Counted all 25 diagnostic codes in `src/lib.ts` at runtime via `$lib.diagnostics`
- Verified severity split: 19 error + 6 warning (was reported as 19+5)
- Verified `src/use-decorators.ts` exports 5 `$use*` functions (including `$useChannelBinding`)
- Verified FEATURES.md already documents `@useChannelBinding` at line 88 — old TODO #4 was already done
- Confirmed golden file had no `channelBindings` section — old TODO #1 was valid at time of check
- Confirmed security trait test used `compileAndValidate` (not `OrThrow`) — old TODO #2 was valid at time of check
- Ran `pnpm run verify` — all 6 gates green (1010 tests at that point)

---

## b) PARTIALLY DONE

### TODO_LIST.md rewrite — overwritten by auto-git daemon

I rewrote TODO_LIST.md with 4 verified items. The auto-git daemon then committed `ffa5a10` which:

- **Resolved TODO #1** (golden channelBindings) — added `channelBindings` to `reusable-components.expected.yaml`
- **Resolved TODO #2** (AJV security strictness) — fixed test data from AsyncAPI 2.x format to 3.1 `SecurityScheme` format, switched to `compileAndValidateOrThrow`
- **Resolved TODO #4** (@tags JSDoc) — added 3 usage examples in `lib/main.tsp`
- **Rewrote TODO_LIST.md** entirely with only 1 remaining item (discriminator golden file)

My carefully verified TODO_LIST lasted ~7 minutes before being overwritten. The daemon's version is now the source of truth.

### AGENTS.md line counts — partially re-staled by concurrent changes

The daemon's commit `ea74c8a` also:

- Added 34 lines to `decorator-helpers.ts` (extracted `normalizeTagItem`) — I didn't update this count
- Changed `minimal-decorators.ts` formatting (357→425→397 lines) — I caught the final value

---

## c) NOT STARTED

- **CHANGELOG.md verification** — The daemon's commits (`beb6ac1`, `ffa5a10`) added new tests and features (string tag support, channel binding golden tests, security format fix, @tags JSDoc). CHANGELOG may not reflect these.
- **FEATURES.md test count update** — Still says "1010 pass" but actual count is now **1017 pass** (daemon added 7 tests).
- **ROADMAP.md test count** — Still says "1010 tests" but actual is 1017.
- **AGENTS.md test count** — No explicit "1010" reference but the "~272 compliance tests" count I wrote may now be different (daemon added tests to `reusable-components.test.ts`).

---

## d) TOTALLY FUCKED UP

### TODO_LIST.md race condition with auto-git daemon

**This is the critical failure.** The auto-git daemon is a concurrent process that commits changes automatically. I treated the codebase as static while I carefully verified each TODO item against actual source files. But between my verification and my TODO_LIST.md write:

1. The daemon committed `ea74c8a` (my doc fixes + its own source changes)
2. The daemon committed `beb6ac1` (new test files, `storeTags` union type)
3. The daemon committed `ffa5a10` (resolved TODO #1, #2, #4; rewrote TODO_LIST.md)

My TODO_LIST.md write was based on a snapshot that was already stale. I should have:

- Checked `git log` immediately before writing to see if new commits landed
- Re-read TODO_LIST.md after the daemon committed to see if it was overwritten
- Recognized the pattern: any manual doc edit to a file the daemon also touches is a race

### Lint failure misdiagnosis

When `pnpm run verify` failed with `minimal-decorators.ts:425 lines (max 400)`, I initially attributed this to Prettier formatting expansion from a prior session. In reality, the daemon was actively reformatting the file. The count fluctuated 357→425→397 within minutes. I should have recognized this as concurrent modification immediately, not investigated it as a static problem.

---

## e) WHAT WE SHOULD IMPROVE

### Process improvements

1. **Auto-git daemon awareness** — Every manual edit competes with the daemon. Before writing ANY file the daemon might touch (TODO_LIST.md, AGENTS.md, CHANGELOG.md), check `git log --oneline -3` first. After writing, check again.
2. **TODO_LIST.md ownership ambiguity** — Both I and the daemon write to TODO_LIST.md. This is a split-brain. Either the daemon should not touch it, or I should treat it as read-only and append-only.
3. **Test count is a moving target** — The daemon adds tests. Hardcoding "1010" or "1017" in docs guarantees drift. Consider removing exact counts from FEATURES.md/ROADMAP.md or using "1000+" phrasing.
4. **Line counts in AGENTS.md are inherently stale** — Any source file line count documented in AGENTS.md will drift on the next formatting pass. Consider removing per-file line counts or replacing with "under 400 lines" phrasing (which is what the linter enforces).
5. **Doc verification should be atomic** — I verified facts, then wrote fixes, then the daemon changed things. The verification and fix should happen in one atomic pass: verify → write → commit immediately.

### Technical improvements

6. **`normalizeTagItem` extraction was good** — The daemon extracted `normalizeTagItem` from `minimal-decorators.ts` to `decorator-helpers.ts` to fix the 425→397 line overflow. This is the right pattern: keep files under the 400-line lint limit.
7. **Security format fix reveals a documentation gap** — The trait security test was using AsyncAPI 2.x format (`{ userPassword: [] }`) instead of 3.1 (`{ type: "userPassword" }`). This suggests the trait config extraction in `namespace-decorators.ts` may not be fully documented. The AGENTS.md gotcha about `SecuritySchemeType` lists valid types but doesn't show the `SecurityRequirement` shape.

---

## f) Next 50 Things to Get Done

### High priority — correctness and regression prevention

1. **Add golden file test for `@discriminator` polymorphic output** — Only remaining TODO_LIST item. Lock `allOf`/`discriminator`/auto-required format.
2. **Review daemon's `normalizeTagItem` in `decorator-helpers.ts`** — Verify it handles edge cases: empty string, numeric name, null externalDocs.url, circular references.
3. **Review daemon's `storeTags` union type change** — `storeTags` now accepts `(string | Tag)[]`. Verify all callers handle both shapes correctly.
4. **Review daemon's security trait test fix** — Verify the 3.1 `SecurityScheme` format is what the emitter actually outputs, not just what the test expects.
5. **Update FEATURES.md test count** — 1010→1017 (or remove hardcoded count).
6. **Update ROADMAP.md test count** — Same.
7. **Verify CHANGELOG.md reflects daemon commits** — `beb6ac1` and `ffa5a10` added features/tests.

### Medium priority — architecture and testing gaps

8. **Add CI consolidation to TODO** — `.github/workflows/ci.yml` runs 6 separate steps instead of `pnpm run verify`. Consider consolidating.
9. **Profile constraint table loop on 200-channel benchmark** — Verify performance hasn't regressed with new tag normalization.
10. **Add property-based test for `normalizeTagItem`** — Fuzz with arbitrary `unknown` inputs, verify never throws.
11. **Add test for `@useChannelBinding` with multiple channels** — Current test has one channel; verify multi-channel doesn't cross-contaminate.
12. **Add test for mixed string/object `@tags` array** — `@tags(["foo", #{name: "bar", description: "baz"}])` should normalize both.
13. **Review `@parameter` location validation** — Concurrent process added `validateParameterLocation()`. Verify the `$message.#` regex pattern is correct.
14. **Add golden file for tag-rich output** — Lock the `info.tags` / `channel.tags` / `server.tags` output format.
15. **Add golden file for `@example` message output** — Lock `MessageObject.examples` format.
16. **Add integration test for full polymorphic chain** — Base → Derived with discriminator, verify `$ref` chain end-to-end.
17. **Verify `@tags` deduplication across scopes** — Same tag name on operation + channel + namespace should produce one `components.tags` entry.
18. **Add test for `@discriminator` on optional property** — Verify auto-required enforcement behavior.
19. **Add test for multi-level inheritance (A → B → C)** — Verify `allOf` chain depth.
20. **Add negative test: `@discriminator` on union** — Should produce compiler error, not emitter crash.

### Low priority — polish and documentation

21. **Consider removing exact line counts from AGENTS.md** — They drift every formatting pass. Replace with "under N lines (lint-enforced)".
22. **Consider removing exact test counts from FEATURES.md/ROADMAP.md** — They drift every test addition. Replace with "1000+".
23. **Add AGENTS.md note about auto-git daemon TODO_LIST ownership** — Warn future sessions that TODO_LIST.md may be overwritten by the daemon.
24. **Document `normalizeTagItem` in AGENTS.md** — New shared helper in `decorator-helpers.ts`, not mentioned in current architecture docs.
25. **Add `components.channelBindings` to AGENTS.md `$ref` chain documentation** — Current chain docs stop at `components.messages`.
26. **Update AGENTS.md `@tags` decorator signature** — Now accepts `valueof (string | Record<unknown>)[]`, document the rich object shape.
27. **Add JSDoc to `@useChannelBinding` in `lib/main.tsp`** — Other `@use*` decorators have JSDoc; this one may not.
28. **Review `reusable-components-negative.test.ts`** — New file added by daemon. Verify test quality and coverage.
29. **Add `verify` script to CI as single step** — Currently 6 steps; consolidate to reduce CI time.
30. **Consider `info.tags` `$ref` to `components.tags`** — Currently inline objects; spec allows `$ref`. Design decision needed.

### Future enhancements

31. **Add `@deprecated` to message/channel level** — Currently only on model properties.
32. **Add `externalDocs` decorator** — `Tag.externalDocs` type exists but no dedicated decorator.
33. **Add `@schemaFormat` support** — AsyncAPI 3.1 allows schema format declaration.
34. **Add multi-document output** — Split operations/channels/schemas into separate files.
35. **Add `@serverBinding` dedicated decorator** — Currently via `@bindings` on Namespace.
36. **Add AsyncAPI Extensions (`x-*`) support** — Custom key passthrough.
37. **Add `@defaultContentType` per-operation override** — Currently namespace-level only.
38. **Add reply address validation** — Verify reply address matches channel pattern.
39. **Add `@ messageId` template support** — Dynamic message ID generation.
40. **Add server variable validation** — Verify variables match server URL template.
41. **Add `@security` per-channel override** — Currently operation/namespace level.
42. **Add Kafka-specific schema registry support** — `schemaIdLocation`, `schemaLookupStrategy`.
43. **Add WebSocket subprotocol validation** — Verify `protocol` matches binding subprotocol.
44. **Add `@correlationId` on operation level** — Currently model-level only.
45. **Add operation `summary`/`description` to golden file** — Lock output format.
46. **Add server `security` to golden file** — Lock `components.securitySchemes` format.
47. **Add multi-namespace test** — Verify namespace isolation for servers/security/bindings.
48. **Add `@versioned` compatibility test** — Verify version enum affects `info.version`.
49. **Add `@encoded` constraint test** — Verify `resolveEncode()` path in constraint-mapper.
50. **Add cross-emitter shared module integration test** — Verify `@lars-artmann/typespec-asyncapi/shared` exports work from external consumer.

---

## g) Questions I Cannot Answer Myself

### 1. Should the auto-git daemon be allowed to modify TODO_LIST.md?

The daemon rewrote TODO_LIST.md during this session, overwriting my carefully verified version with its own. This creates a split-brain: two agents (me and the daemon) both writing to the same file. **Should TODO_LIST.md be excluded from auto-git daemon commits, or should I treat it as read-only and let the daemon own it?**

### 2. Should exact counts (test count, line count, diagnostic count) be hardcoded in docs?

Every doc has hardcoded numbers ("1010 tests", "25 decorators", "397 lines") that drift on every change. I fixed them this session, but they'll be stale again tomorrow. **Should these be replaced with ranges ("1000+ tests", "under 400 lines per file") or should a pre-commit hook auto-update them?**

### 3. Should `info.tags` use inline objects or `$ref` to `components.tags`?

Currently tags are inline `Tag[]` objects on `info.tags`. The AsyncAPI 3.1 spec allows `$ref` to `components.tags` entries. The `components.tags` map IS populated by `tag-builder.ts`. **Is the inline approach intentional (simpler output) or should tags reference the components map (DRYer output)?**

---

## Session metrics

| Metric               | Session start   | Session end                                                          | Delta                |
| -------------------- | --------------- | -------------------------------------------------------------------- | -------------------- |
| Tests                | 1010            | 1017                                                                 | +7 (daemon)          |
| Compliance tests     | ~208 (reported) | ~272+ (actual)                                                       | +64 (was miscounted) |
| Coverage             | 97.3%           | 97.4%                                                                | +0.1%                |
| Diagnostic codes     | 24 (reported)   | 25 (actual)                                                          | was miscounted       |
| Decorators           | 25 (reported)   | 26 (actual)                                                          | was miscounted       |
| Clones               | 0               | 0                                                                    | —                    |
| Lint warnings        | 0               | 0                                                                    | —                    |
| Build errors         | 0               | 0                                                                    | —                    |
| Commits this session | —               | 4 (`ea74c8a`, `beb6ac1`, `ffa5a10`, + my doc fixes inside `ea74c8a`) | —                    |

## Key lesson

**Never trust a snapshot of a file that a concurrent process modifies.** The auto-git daemon is not a passive observer — it actively writes code, tests, and docs. Any verification I do is a point-in-time snapshot that may be invalid by the time I act on it. The only defense is: verify → act → re-verify → commit, all in one rapid sequence.
