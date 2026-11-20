# Status Report: TODO_LIST Freshness Audit

**Date:** 2026-08-06 18:50
**Session scope:** Verify TODO_LIST.md accuracy against actual codebase, fix drift
**Outcome:** Doc drift fixed but immediately re-staled by auto-git daemon concurrency

---

## a) FULLY DONE

### Doc drift fixed (committed in `ea74c8a`)

| Doc           | What was stale                                                                                       | Fixed to                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| ~~`AGENTS.md`~~ done at `ea74c8a` | ~~"25 decorators"~~ | ~~**26** (16 core + 10 reusable-component)~~ |
| ~~`AGENTS.md`~~ done at `ea74c8a` | ~~"24 codes (19 error + 5 warning)"~~ | ~~**25 codes (19 error + 6 warning)**~~ |
| ~~`AGENTS.md`~~ done at `ea74c8a` | ~~"9 reusable-component decorators"~~ | ~~**10** (5 definition + 5 reference, added `@useChannelBinding`)~~ |
| ~~`AGENTS.md`~~ done at `ea74c8a` | ~~"4 reference decorators" in `use-decorators.ts`~~ | ~~**5** (added `$useChannelBinding`)~~ |
| ~~`AGENTS.md`~~ done at `ea74c8a` | ~~Builder file count "10 files"~~ | ~~**11 files** (added `_imports.ts`)~~ |
| ~~`AGENTS.md`~~ done at `ea74c8a` | ~~8 stale line counts (emitter.ts, schema-emitter.ts, constraint-mapper.ts, document-builder.ts, etc.)~~ | ~~All corrected to actual `wc -l` values~~ |
| ~~`AGENTS.md`~~ done at `ea74c8a` | ~~"~208 tests across 18 files" (compliance suite)~~ | ~~**~272 tests** across 18 files~~ |
| ~~`AGENTS.md`~~ done at `ea74c8a` | ~~"38 tests" constraint decorators~~ | ~~**54 tests**~~ |
| ~~`AGENTS.md`~~ done at `ea74c8a` | ~~"13 tests" polymorphism~~ | ~~**15 tests**~~ |
| ~~`AGENTS.md`~~ done at `ea74c8a` | ~~"14 tests" reusable components~~ | ~~**41 tests** (added channelBindings)~~ |
| ~~`AGENTS.md`~~ done at `ea74c8a` | ~~"components.messageBindings" only~~ | ~~Added **components.channelBindings**~~ |
| ~~`FEATURES.md`~~ done at `ea74c8a` | ~~Split-brain: line 7 said "26 decorators" but line 51 said "25 decorators" and "9 reusable-component"~~ | ~~Line 51 corrected to **26** and **10**~~ |
| ~~`README.md`~~ done at `ea74c8a` | ~~"22 compile-time diagnostics (17 error + 5 warning)"~~ | ~~**25 (19 error + 6 warning)**~~ |
| ~~`README.md`~~ done at `ea74c8a` | ~~"24 codes (19 error + 5 warning)" in metrics table~~ | ~~**25 codes (19 error + 6 warning)**~~ |

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

~~1. The daemon committed `ea74c8a` (my doc fixes + its own source changes)~~ done at `ea74c8a`
~~2. The daemon committed `beb6ac1` (new test files, `storeTags` union type)~~ done at `beb6ac1`
~~3. The daemon committed `ffa5a10` (resolved TODO #1, #2, #4; rewrote TODO_LIST.md)~~ done at `ffa5a10`

My TODO_LIST.md write was based on a snapshot that was already stale. I should have:

- Checked `git log` immediately before writing to see if new commits landed
- Re-read TODO_LIST.md after the daemon committed to see if it was overwritten
- Recognized the pattern: any manual doc edit to a file the daemon also touches is a race

### Lint failure misdiagnosis

When `pnpm run verify` failed with `minimal-decorators.ts:425 lines (max 400)`, I initially attributed this to Prettier formatting expansion from a prior session. In reality, the daemon was actively reformatting the file. The count fluctuated 357→425→397 within minutes. I should have recognized this as concurrent modification immediately, not investigated it as a static problem.

---

## e) WHAT WE SHOULD IMPROVE

### Process improvements

~~1. **Auto-git daemon awareness** — Every manual edit competes with the daemon. Before writing ANY file the daemon might touch (TODO_LIST.md, AGENTS.md, CHANGELOG.md), check `git log --oneline -3` first. After writing, check again.~~ **NOT-DO — process lesson — no work product.**
~~2. **TODO_LIST.md ownership ambiguity** — Both I and the daemon write to TODO_LIST.md. This is a split-brain. Either the daemon should not touch it, or I should treat it as read-only and append-only.~~ done — `AGENTS.md` tooling notes document the auto-commit daemon and CI alerting
3. **Test count is a moving target** — The daemon adds tests. Hardcoding "1010" or "1017" in docs guarantees drift. Consider removing exact counts from FEATURES.md/ROADMAP.md or using "1000+" phrasing. **→ ROADMAP §Developer Experience — docs-entropy CI guard raw idea**
~~4. **Line counts in AGENTS.md are inherently stale** — Any source file line count documented in AGENTS.md will drift on the next formatting pass. Consider removing per-file line counts or replacing with "under 400 lines" phrasing (which is what the linter enforces).~~ **Won't implement — AGENTS.md keeps line counts but the enforced bound is the lint 400-line cap.**
~~5. **Doc verification should be atomic** — I verified facts, then wrote fixes, then the daemon changed things. The verification and fix should happen in one atomic pass: verify → write → commit immediately.~~ **NOT-DO — process lesson — no work product.**

### Technical improvements

~~6. **`normalizeTagItem` extraction was good** — The daemon extracted `normalizeTagItem` from `minimal-decorators.ts` to `decorator-helpers.ts` to fix the 425→397 line overflow. This is the right pattern: keep files under the 400-line lint limit.~~ done — lives in `src/decorator-helpers.ts` with `test/unit/normalize-tag-item.test.ts`
~~7. **Security format fix reveals a documentation gap** — The trait security test was using AsyncAPI 2.x format (`{ userPassword: [] }`) instead of 3.1 (`{ type: "userPassword" }`). This suggests the trait config extraction in `namespace-decorators.ts` may not be fully documented. The AGENTS.md gotcha about `SecuritySchemeType` lists valid types but doesn't show the `SecurityRequirement` shape.~~ done — `AGENTS.md` line 188 documents the `SecurityRequirement` shape

---

## f) Next 50 Things to Get Done

### High priority — correctness and regression prevention

~~1. **Add golden file test for `@discriminator` polymorphic output** — Only remaining TODO_LIST item. Lock `allOf`/`discriminator`/auto-required format.~~ done — `test/golden/polymorphism.expected.yaml` locks discriminator output at line 46
~~2. **Review daemon's `normalizeTagItem` in `decorator-helpers.ts`** — Verify it handles edge cases: empty string, numeric name, null externalDocs.url, circular references.~~ done — `test/unit/normalize-tag-item.test.ts`
~~3. **Review daemon's `storeTags` union type change** — `storeTags` now accepts `(string | Tag)[]`. Verify all callers handle both shapes correctly.~~ done — `src/state-writers.ts` line 173 plus mixed-shape tests in `test/compliance/components-tags.test.ts`
~~4. **Review daemon's security trait test fix** — Verify the 3.1 `SecurityScheme` format is what the emitter actually outputs, not just what the test expects.~~ done — `test/golden/server-security.expected.yaml`
~~5. **Update FEATURES.md test count** — 1010→1017 (or remove hardcoded count).~~ done — FEATURES.md carries audit-verified counts from 2026-10-03
~~6. **Update ROADMAP.md test count** — Same.~~ done — ROADMAP.md carries audit-verified counts from 2026-10-03
~~7. **Verify CHANGELOG.md reflects daemon commits** — `beb6ac1` and `ffa5a10` added features/tests.~~ done — `CHANGELOG.md` entries cover the golden channelBindings and JSDoc work at lines 280 and 282

### Medium priority — architecture and testing gaps

~~8. **Add CI consolidation to TODO** — `.github/workflows/ci.yml` runs 6 separate steps instead of `pnpm run verify`. Consider consolidating.~~ done — `.github/workflows/ci.yml` runs one `pnpm run verify` step plus `check-examples`
~~9. **Profile constraint table loop on 200-channel benchmark** — Verify performance hasn't regressed with new tag normalization.~~ done — `test/benchmark/performance.test.ts`
~~10. **Add property-based test for `normalizeTagItem`** — Fuzz with arbitrary `unknown` inputs, verify never throws.~~ done — `test/unit/normalize-tag-item.test.ts`
~~11. **Add test for `@useChannelBinding` with multiple channels** — Current test has one channel; verify multi-channel doesn't cross-contaminate.~~ **Won't implement — only single-channel `@useChannelBinding` cases exist — `test/compliance/reusable-components.test.ts` line 429; no cross-contamination test.**
~~12. **Add test for mixed string/object `@tags` array** — `@tags(["foo", #{name: "bar", description: "baz"}])` should normalize both.~~ done — mixed string and object tags — `test/compliance/components-tags.test.ts` line 237
~~13. **Review `@parameter` location validation** — Concurrent process added `validateParameterLocation()`. Verify the `$message.#` regex pattern is correct.~~ done — `src/namespace-decorators.ts` line 203 validates the `$message.#` pattern
~~14. **Add golden file for tag-rich output** — Lock the `info.tags` / `channel.tags` / `server.tags` output format.~~ done — `test/golden/tag-rich.expected.yaml`
~~15. **Add golden file for `@example` message output** — Lock `MessageObject.examples` format.~~ done — `test/golden/example-message.expected.yaml`
~~16. **Add integration test for full polymorphic chain** — Base → Derived with discriminator, verify `$ref` chain end-to-end.~~ done — full polymorphic pattern test — `test/compliance/polymorphism.test.ts` line 109
~~17. **Verify `@tags` deduplication across scopes** — Same tag name on operation + channel + namespace should produce one `components.tags` entry.~~ done — dedup across sources — `test/compliance/components-tags.test.ts` line 54
~~18. **Add test for `@discriminator` on optional property** — Verify auto-required enforcement behavior.~~ done — `test/compliance/polymorphism.test.ts` line 167
~~19. **Add test for multi-level inheritance (A → B → C)** — Verify `allOf` chain depth.~~ done — 4-level chain — `test/compliance/polymorphism.test.ts` line 67
~~20. **Add negative test: `@discriminator` on union** — Should produce compiler error, not emitter crash.~~ **Won't implement — compiler rejects `@discriminator` on unions per `AGENTS.md` Gotchas; no emitter-side negative test.**

### Low priority — polish and documentation

~~21. **Consider removing exact line counts from AGENTS.md** — They drift every formatting pass. Replace with "under N lines (lint-enforced)".~~ **Won't implement — AGENTS.md keeps exact line counts, refreshed per audit; lint cap enforces the bound.**
22. **Consider removing exact test counts from FEATURES.md/ROADMAP.md** — They drift every test addition. Replace with "1000+". **→ ROADMAP §Developer Experience — docs-entropy CI guard raw idea**
~~23. **Add AGENTS.md note about auto-git daemon TODO_LIST ownership** — Warn future sessions that TODO_LIST.md may be overwritten by the daemon.~~ done — `AGENTS.md` tooling notes cover the auto-commit daemon
~~24. **Document `normalizeTagItem` in AGENTS.md** — New shared helper in `decorator-helpers.ts`, not mentioned in current architecture docs.~~ **Won't implement — helper documented only in code and `test/unit/normalize-tag-item.test.ts`, not in the AGENTS architecture list.**
~~25. **Add `components.channelBindings` to AGENTS.md `$ref` chain documentation** — Current chain docs stop at `components.messages`.~~ done — `AGENTS.md` line 63 lists `components.channelBindings` in the chain
~~26. **Update AGENTS.md `@tags` decorator signature** — Now accepts `valueof (string | Record<unknown>)[]`, document the rich object shape.~~ done — `AGENTS.md` line 184 documents rich `@tags` objects
~~27. **Add JSDoc to `@useChannelBinding` in `lib/main.tsp`** — Other `@use*` decorators have JSDoc; this one may not.~~ done — JSDoc present above `useChannelBinding` in `lib/main.tsp` line 233
~~28. **Review `reusable-components-negative.test.ts`** — New file added by daemon. Verify test quality and coverage.~~ done — file exists and green — `test/integration/reusable-components-negative.test.ts`
~~29. **Add `verify` script to CI as single step** — Currently 6 steps; consolidate to reduce CI time.~~ done — CI runs `pnpm run verify` as a single gate step
~~30. **Consider `info.tags` `$ref` to `components.tags`** — Currently inline objects; spec allows `$ref`. Design decision needed.~~ **Won't implement — inline tags are the shipped output contract, semver-frozen since 1.0.0.**

### Future enhancements

~~31. **Add `@deprecated` to message/channel level** — Currently only on model properties.~~ **Won't implement — `#deprecated` maps on properties, models, enums via `src/constraint-mapper.ts`; no message or channel level.**
32. **Add `externalDocs` decorator** — `Tag.externalDocs` type exists but no dedicated decorator. **→ ROADMAP §Spec Compliance — dedicated `@externalDocs` decorator raw idea**
33. **Add `@schemaFormat` support** — AsyncAPI 3.1 allows schema format declaration. **→ ROADMAP §Spec Compliance — `@schemaFormat` decorator raw idea**
~~34. **Add multi-document output** — Split operations/channels/schemas into separate files.~~ done — `split-schemas` option ships — `src/schema-splitter.ts` plus `test/integration/multi-file-output.test.ts`
~~35. **Add `@serverBinding` dedicated decorator** — Currently via `@bindings` on Namespace.~~ **Won't implement — server bindings reachable via `@bindings` on Namespace and `@reusableBinding` — FEATURES.md documents both.**
~~36. **Add AsyncAPI Extensions (`x-*`) support** — Custom key passthrough.~~ done — `@extension` decorator ships `x-` keys — `src/extension-decorators.ts` plus `test/compliance/spec-extensions.test.ts`
~~37. **Add `@defaultContentType` per-operation override** — Currently namespace-level only.~~ **Won't implement — `@defaultContentType` stays namespace-level — `src/namespace-decorators.ts`.**
~~38. **Add reply address validation** — Verify reply address matches channel pattern.~~ **Won't implement — reply `address` is emitted in `test/compliance/operation-reply.test.ts` line 31 but never validated.**
~~39. **Add `@ messageId` template support** — Dynamic message ID generation.~~ **Won't implement — `@messageId` takes a literal id — `src/builders/message-builder.ts`; no templating.**
~~40. **Add server variable validation** — Verify variables match server URL template.~~ **Won't implement — variables extracted from `{var}` host tokens — `test/compliance/servers-security.test.ts` line 67; no template-match validation.**
~~41. **Add `@security` per-channel override** — Currently operation/namespace level.~~ **Won't implement — `@security` is namespace-level and `@operationSecurity` operation-level; no channel target.**
~~42. **Add Kafka-specific schema registry support** — `schemaIdLocation`, `schemaLookupStrategy`.~~ done — kafka `schemaIdLocation` asserted in `test/domain/protocol-model-bindings.test.ts` line 139
43. **Add WebSocket subprotocol validation** — Verify `protocol` matches binding subprotocol. **→ ROADMAP §Spec Compliance — WebSocket subprotocol negotiation raw idea**
44. **Add `@correlationId` on operation level** — Currently model-level only. **→ ROADMAP §Spec Compliance — `@correlationId` on operations raw idea**
~~45. **Add operation `summary`/`description` to golden file** — Lock output format.~~ **Won't implement — operation summary and description covered by `test/compliance/doc-propagation.test.ts`; no golden lock.**
~~46. **Add server `security` to golden file** — Lock `components.securitySchemes` format.~~ done — `test/golden/server-security.expected.yaml`
~~47. **Add multi-namespace test** — Verify namespace isolation for servers/security/bindings.~~ done — `test/integration/multi-namespace-isolation.test.ts`
~~48. **Add `@versioned` compatibility test** — Verify version enum affects `info.version`.~~ done — `test/integration/versioning.test.ts`
~~49. **Add `@encoded` constraint test** — Verify `resolveEncode()` path in constraint-mapper.~~ done — `test/compliance/encoded-names.test.ts`
~~50. **Add cross-emitter shared module integration test** — Verify `@lars-artmann/typespec-asyncapi/shared` exports work from external consumer.~~ done — `test/unit/shared-schema-types.test.ts` barrel contract tests

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
| ~~Tests~~ done at `ea74c8a`, `beb6ac1`, `ffa5a10` | ~~1010~~ | ~~1017~~ | ~~+7 (daemon)~~ |
| ~~Compliance tests~~ done at `ea74c8a`, `beb6ac1`, `ffa5a10` | ~~~208 (reported)~~ | ~~~272+ (actual)~~ | ~~+64 (was miscounted)~~ |
| ~~Coverage~~ done at `ea74c8a`, `beb6ac1`, `ffa5a10` | ~~97.3%~~ | ~~97.4%~~ | ~~+0.1%~~ |
| ~~Diagnostic codes~~ done at `ea74c8a`, `beb6ac1`, `ffa5a10` | ~~24 (reported)~~ | ~~25 (actual)~~ | ~~was miscounted~~ |
| ~~Decorators~~ done at `ea74c8a`, `beb6ac1`, `ffa5a10` | ~~25 (reported)~~ | ~~26 (actual)~~ | ~~was miscounted~~ |
| ~~Clones~~ done at `ea74c8a`, `beb6ac1`, `ffa5a10` | ~~0~~ | ~~0~~ | ~~—~~ |
| ~~Lint warnings~~ done at `ea74c8a`, `beb6ac1`, `ffa5a10` | ~~0~~ | ~~0~~ | ~~—~~ |
| ~~Build errors~~ done at `ea74c8a`, `beb6ac1`, `ffa5a10` | ~~0~~ | ~~0~~ | ~~—~~ |
| ~~Commits this session~~ done at `ea74c8a`, `beb6ac1`, `ffa5a10` | ~~—~~ | ~~4 (`ea74c8a`, `beb6ac1`, `ffa5a10`, + my doc fixes inside `ea74c8a`)~~ | ~~—~~ |

## Key lesson

**Never trust a snapshot of a file that a concurrent process modifies.** The auto-git daemon is not a passive observer — it actively writes code, tests, and docs. Any verification I do is a point-in-time snapshot that may be invalid by the time I act on it. The only defense is: verify → act → re-verify → commit, all in one rapid sequence.
