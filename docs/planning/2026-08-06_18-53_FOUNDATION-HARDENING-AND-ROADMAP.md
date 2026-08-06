# Pareto Execution Plan: Foundation Hardening & Spec Compliance Roadmap

**Date:** 2026-08-06 18:53
**Status:** Planning
**Principle:** Don't VERSCHLIMMBESSER. Every change surgical, tested, verified.
**Current state:** 1017 tests, 97.4% coverage, 0 clones, 0 lint, 0 build errors, 26 decorators, 25 diagnostics, all 6 verify gates green.

---

## Context

The emitter is pre-release (`0.2.0-beta`) with solid foundations: spec-compliant AsyncAPI 3.1 output validated against the official JSON Schema, 1017 tests, zero code duplication, comprehensive decorator coverage. The TODO_LIST.md reads "All Clear." This plan looks beyond the empty TODO list to identify what actually matters next — real bugs, regression gaps, documentation drift, and the highest-leverage path to v1.0.

### Verified Findings (This Session)

| Finding                                                         | Severity                        | Evidence                                                                                          |
| --------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `normalizeTagItem("")` returns `{ name: "" }` instead of `null` | **Bug** — silent invalid output | `src/decorator-helpers.ts:234` — `typeof "" === "string"` passes, no emptiness check              |
| CHANGELOG.md missing 3 entries from daemon commits              | **Doc gap**                     | Channel binding golden tests, security format fix, `@tags` JSDoc absent from Unreleased           |
| FEATURES.md + ROADMAP.md have uncommitted test count fixes      | **Uncommitted**                 | `git diff` shows 1010→1017 and 97.3%→97.4%                                                        |
| CI runs 6 separate steps, not `pnpm run verify`                 | **Inefficiency**                | `.github/workflows/ci.yml` has Build, Lint, Test, Coverage, Duplicate, Examples as separate steps |
| No doc-entropy guard                                            | **Process gap**                 | Test counts, line counts, decorator counts in docs drift silently                                 |
| `OperationObject.action` is optional in the type                | **Type safety gap**             | `src/domain/models/asyncapi-document.ts` — AsyncAPI 3.1 requires `action`                         |
| TypeSpec 1.14.0 available (currently 1.13.0)                    | **Upgrade opportunity**         | Auto decorators, `.ts` module imports, memory leak fix                                            |

---

## Pareto Analysis

### The 1% That Delivers 51%

These three items are the absolute highest-leverage work. Fix the bug, commit the docs, consolidate CI.

| #    | Task                                        | Impact                         | Effort | Why                                                               |
| ---- | ------------------------------------------- | ------------------------------ | ------ | ----------------------------------------------------------------- |
| P1-1 | Fix `normalizeTagItem` empty-string bug     | Silent invalid AsyncAPI output | 10min  | Correctness bug — `@tags([""])` produces `{ name: "" }` in output |
| P1-2 | Commit pending doc changes + CHANGELOG gaps | Trust erosion from stale docs  | 20min  | FEATURES.md, ROADMAP.md, CHANGELOG.md all have known drift        |
| P1-3 | Consolidate CI to `pnpm run verify`         | Faster CI, single gate         | 15min  | 6 steps → 1 script call, reduces CI time ~40%                     |

### The 4% That Delivers 64% (1% + these)

Above + regression prevention for the most recently changed code paths.

| #    | Task                                         | Impact                                          | Effort | Why                                                                                    |
| ---- | -------------------------------------------- | ----------------------------------------------- | ------ | -------------------------------------------------------------------------------------- |
| P4-1 | Property-based test for `normalizeTagItem`   | Catches future regressions in tag normalization | 30min  | Fuzz with arbitrary inputs, verify never throws + never returns invalid Tag            |
| P4-2 | Mixed string/object `@tags` integration test | Verifies the union type path works end-to-end   | 20min  | `@tags(["foo", #{name: "bar", description: "baz"}])` — no test covers mixed input      |
| P4-3 | `@useChannelBinding` multi-channel test      | Prevents cross-contamination regressions        | 20min  | Only single-channel test exists; multi-channel binding assignment untested             |
| P4-4 | `@tags` dedup-across-scopes test             | Verifies tag dedup correctness                  | 20min  | Same tag on operation + channel + namespace should produce one `components.tags` entry |
| P4-5 | Key golden files (tags, examples, security)  | Locks output format for 3 feature areas         | 60min  | No golden file covers tags/examples/security output shapes                             |

### The 20% That Delivers 80% (4% + these)

Above + all testing gaps + documentation accuracy + type safety.

| #      | Task                                                         | Impact                                           | Effort | Why                                                                         |
| ------ | ------------------------------------------------------------ | ------------------------------------------------ | ------ | --------------------------------------------------------------------------- |
| P20-1  | Multi-level inheritance test (A→B→C)                         | Verifies allOf chain depth > 1                   | 20min  | Only 2-level tested (Derived→Base)                                          |
| P20-2  | Multi-namespace isolation test                               | Verifies servers/security/bindings don't leak    | 30min  | No test for namespace boundary isolation                                    |
| P20-3  | `@versioned` compatibility test                              | Verifies version enum → info.version             | 20min  | `getVersion()` integration untested end-to-end                              |
| P20-4  | `@encoded` constraint test                                   | Verifies `resolveEncode()` path                  | 20min  | `resolveEncode` in constraint-mapper untested                               |
| P20-5  | Cross-emitter shared module test                             | Verifies external consumer can import `./shared` | 30min  | `src/shared/` exports tested internally but never from external perspective |
| P20-6  | Benchmark profile on 200-channel scale                       | Verify performance acceptable at scale           | 30min  | `test/benchmark/` exists but hasn't been run with recent changes            |
| P20-7  | Remove exact line counts from AGENTS.md                      | Eliminates entire class of doc drift             | 30min  | Replace "355 lines" with "under 400 lines (lint-enforced)"                  |
| P20-8  | Remove exact test counts from docs                           | Eliminates highest-frequency drift               | 20min  | Replace "1017 tests" with "1000+ tests" in FEATURES.md, ROADMAP.md          |
| P20-9  | Document `normalizeTagItem` + `channelBindings` in AGENTS.md | Architecture docs reflect current code           | 20min  | New helper + new component map undocumented                                 |
| P20-10 | Document unreachable `#{}` fields                            | Prevents user confusion                          | 20min  | `enum`, `const` can't be `#{}` keys — not documented                        |
| P20-11 | Tighten `OperationObject.action` to required                 | Type safety — spec requires it                   | 15min  | AsyncAPI 3.1 mandates `action` field                                        |
| P20-12 | Add `SecurityScheme.description` to type                     | Type completeness                                | 10min  | Spec field exists, type missing it                                          |

### The Remaining 80% Effort (Last 20% Value)

New features, ecosystem integration, and architecture refactoring. These are valuable for v1.0 but not urgent for a beta.

| #    | Task                                                           | Impact | Effort | Theme                |
| ---- | -------------------------------------------------------------- | ------ | ------ | -------------------- |
| R-1  | `@schemaFormat` support                                        | Medium | 4h     | Spec Compliance      |
| R-2  | Reusable server definitions (`@reusableServer` + `@useServer`) | Medium | 6h     | Spec Compliance      |
| R-3  | `@correlationId` on operations                                 | Medium | 3h     | Spec Compliance      |
| R-4  | `channel.servers` field binding                                | Medium | 3h     | Spec Compliance      |
| R-5  | `defaultContentType` MIME validation                           | Low    | 1h     | Spec Compliance      |
| R-6  | Reactive streaming patterns (SSE, WS negotiation)              | Low    | 8h+    | Spec Compliance      |
| R-7  | TypeSpec 1.14.0 upgrade                                        | Medium | 4h     | Architecture         |
| R-8  | Move utilities to `src/util/`                                  | Low    | 2h     | Architecture         |
| R-9  | Split `./shared` subpath into neutral/AsyncAPI                 | Low    | 3h     | Architecture         |
| R-10 | Doc-entropy CI guard                                           | Medium | 3h     | Developer Experience |
| R-11 | `--version` projection support                                 | Medium | 4h     | Ecosystem            |
| R-12 | `@asyncapi/generator` CLI testing                              | Low    | 4h+    | Ecosystem            |
| R-13 | OpenAPI cross-emitter (multi-day project)                      | Low    | 40h+   | Ecosystem            |
| R-14 | `@deprecated` on message/channel level                         | Low    | 2h     | Feature              |
| R-15 | `externalDocs` decorator                                       | Low    | 1h     | Feature              |
| R-16 | `@serverBinding` dedicated decorator                           | Low    | 2h     | Feature              |
| R-17 | AsyncAPI Extensions (`x-*`) support                            | Medium | 3h     | Feature              |
| R-18 | `@defaultContentType` per-operation override                   | Low    | 2h     | Feature              |
| R-19 | Reply address validation                                       | Low    | 1h     | Feature              |
| R-20 | `@messageId` template support                                  | Low    | 3h     | Feature              |
| R-21 | Server variable validation                                     | Low    | 1h     | Feature              |
| R-22 | `@security` per-channel override                               | Low    | 2h     | Feature              |
| R-23 | Kafka schema registry fields                                   | Low    | 2h     | Feature              |
| R-24 | WebSocket subprotocol validation                               | Low    | 1h     | Feature              |
| R-25 | Multi-document output (split files)                            | Medium | 6h     | Feature              |

---

## Execution Order

### Phase 1: Critical Fixes (The 1% → 51%)

**Total estimated time: 45 minutes**

| Task ID | Description                                            | Size  | Depends On |
| ------- | ------------------------------------------------------ | ----- | ---------- |
| T1      | Fix `normalizeTagItem` empty-string bug                | 10min | —          |
| T2      | Add negative test for empty-string tag                 | 10min | T1         |
| T3      | Commit pending FEATURES.md + ROADMAP.md + CHANGELOG.md | 15min | T1, T2     |
| T4      | Consolidate CI to `pnpm run verify` + examples step    | 15min | T3         |

### Phase 2: Regression Prevention (The 4% → 64%)

**Total estimated time: 2.5 hours**

| Task ID | Description                                  | Size  | Depends On |
| ------- | -------------------------------------------- | ----- | ---------- |
| T5      | Property-based test for `normalizeTagItem`   | 30min | T1         |
| T6      | Mixed string/object `@tags` integration test | 20min | T1         |
| T7      | `@useChannelBinding` multi-channel test      | 20min | —          |
| T8      | `@tags` dedup-across-scopes test             | 20min | —          |
| T9      | Golden file: tag-rich output                 | 30min | —          |
| T10     | Golden file: `@example` message output       | 20min | —          |
| T11     | Golden file: server security output          | 20min | —          |
| T12     | Run `pnpm run verify` + commit Phase 2       | 10min | T5-T11     |

### Phase 3: Comprehensive Testing & Docs (The 20% → 80%)

**Total estimated time: 4 hours**

| Task ID | Description                                                                      | Size  | Depends On |
| ------- | -------------------------------------------------------------------------------- | ----- | ---------- |
| T13     | Multi-level inheritance test (A→B→C)                                             | 20min | —          |
| T14     | Multi-namespace isolation test                                                   | 30min | —          |
| T15     | `@versioned` compatibility test                                                  | 20min | —          |
| T16     | `@encoded` constraint test                                                       | 20min | —          |
| T17     | Cross-emitter shared module integration test                                     | 30min | —          |
| T18     | Benchmark profile on 200-channel scale                                           | 30min | —          |
| T19     | Remove exact line counts from AGENTS.md                                          | 30min | —          |
| T20     | Remove exact test counts from all docs                                           | 20min | —          |
| T21     | Document `normalizeTagItem` + `channelBindings` + `@tags` signature in AGENTS.md | 20min | T19        |
| T22     | Document unreachable `#{}` fields                                                | 20min | —          |
| T23     | Tighten `OperationObject.action` to required                                     | 15min | —          |
| T24     | Add `SecurityScheme.description` to type                                         | 10min | —          |
| T25     | Run `pnpm run verify` + commit Phase 3                                           | 10min | T13-T24    |

### Phase 4: Future Work (No immediate execution)

Tasks R-1 through R-25 are documented for future sessions. They should be pulled into TODO_LIST.md one theme at a time when capacity allows. No dependency ordering unless noted.

---

## Mermaid Execution Graph

```mermaid
graph TD
    subgraph "Phase 1: Critical Fixes (45min)"
        T1[T1: Fix normalizeTagItem<br/>empty-string bug<br/>10min]
        T2[T2: Add negative test<br/>for empty-string tag<br/>10min]
        T3[T3: Commit pending docs<br/>+ CHANGELOG gaps<br/>15min]
        T4[T4: Consolidate CI to<br/>pnpm run verify<br/>15min]
        T1 --> T2
        T2 --> T3
        T3 --> T4
    end

    subgraph "Phase 2: Regression Prevention (2.5h)"
        T5[T5: Property-based test<br/>normalizeTagItem<br/>30min]
        T6[T6: Mixed @tags test<br/>20min]
        T7[T7: Multi-channel<br/>@useChannelBinding test<br/>20min]
        T8[T8: @tags dedup<br/>across scopes<br/>20min]
        T9[T9: Golden: tag-rich<br/>output<br/>30min]
        T10[T10: Golden: @example<br/>message output<br/>20min]
        T11[T11: Golden: server<br/>security output<br/>20min]
        T12[T12: Verify + commit<br/>10min]
        T5 --> T12
        T6 --> T12
        T7 --> T12
        T8 --> T12
        T9 --> T12
        T10 --> T12
        T11 --> T12
    end

    subgraph "Phase 3: Testing & Docs (4h)"
        T13[T13: Multi-level<br/>inheritance test<br/>20min]
        T14[T14: Multi-namespace<br/>isolation test<br/>30min]
        T15[T15: @versioned<br/>compatibility test<br/>20min]
        T16[T16: @encoded<br/>constraint test<br/>20min]
        T17[T17: Cross-emitter<br/>shared module test<br/>30min]
        T18[T18: Benchmark<br/>200-channel profile<br/>30min]
        T19[T19: Remove line counts<br/>from AGENTS.md<br/>30min]
        T20[T20: Remove test counts<br/>from all docs<br/>20min]
        T21[T21: Document new helpers<br/>in AGENTS.md<br/>20min]
        T22[T22: Document unreachable<br/>#{} fields<br/>20min]
        T23[T23: Tighten<br/>OperationObject.action<br/>15min]
        T24[T24: Add SecurityScheme<br/>.description type<br/>10min]
        T25[T25: Verify + commit<br/>10min]
        T13 --> T25
        T14 --> T25
        T15 --> T25
        T16 --> T25
        T17 --> T25
        T18 --> T25
        T19 --> T25
        T20 --> T25
        T21 --> T25
        T22 --> T25
        T23 --> T25
        T24 --> T25
    end

    subgraph "Phase 4: Future Work"
        R[25 future tasks<br/>R-1 through R-25<br/>See table above]
    end

    T4 --> T5
    T4 --> T6
    T4 --> T7
    T4 --> T8
    T4 --> T9
    T4 --> T10
    T4 --> T11
    T12 --> T13
    T12 --> T14
    T12 --> T15
    T12 --> T16
    T12 --> T17
    T12 --> T18
    T12 --> T19
    T25 --> R

    style T1 fill:#ff6b6b,color:#fff
    style T2 fill:#ff6b6b,color:#fff
    style T3 fill:#ffa502,color:#fff
    style T4 fill:#ffa502,color:#fff
    style T12 fill:#2ed573,color:#fff
    style T25 fill:#2ed573,color:#fff
```

---

## Micro-Breakdown: All Tasks at ≤12min Granularity

Each task above is broken into atomic steps that can be executed independently. Every step includes verification.

### T1: Fix `normalizeTagItem` empty-string bug (10min)

| Step | Action                                                                                         | Verify                                                    | Time |
| ---- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---- |
| T1.1 | Read `src/decorator-helpers.ts` lines 234-260                                                  | Confirm `typeof item === "string"` has no emptiness check | 2min |
| T1.2 | Add guard: `if (typeof item === "string") { return item.length > 0 ? { name: item } : null; }` | Read back the edit                                        | 3min |
| T1.3 | Run `pnpm run build`                                                                           | 0 errors                                                  | 2min |
| T1.4 | Run `pnpm run lint`                                                                            | 0 warnings                                                | 2min |

### T2: Add negative test for empty-string tag (10min)

| Step | Action                                                                                                               | Verify          | Time |
| ---- | -------------------------------------------------------------------------------------------------------------------- | --------------- | ---- |
| T2.1 | Add test to `test/compliance/components-tags.test.ts`: `@tags([""])` should produce `invalid-tags-config` diagnostic | Test compiles   | 5min |
| T2.2 | Run `node_modules/.bin/vitest run test/compliance/components-tags.test.ts`                                           | New test passes | 3min |
| T2.3 | Run full `pnpm run verify`                                                                                           | All gates green | 2min |

### T3: Commit pending docs + CHANGELOG gaps (15min)

| Step | Action                                                                                                                                    | Verify           | Time |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---- |
| T3.1 | Verify FEATURES.md and ROADMAP.md uncommitted changes are correct (1010→1017, 97.3→97.4)                                                  | `git diff`       | 2min |
| T3.2 | Add CHANGELOG.md entries for: channel binding golden tests, security format fix, @tags JSDoc, normalizeTagItem fix, empty-string tag test | Read back        | 5min |
| T3.3 | `git add` all changed files                                                                                                               | Staged correctly | 2min |
| T3.4 | Commit with detailed message                                                                                                              | Exit 0           | 3min |
| T3.5 | Check git status                                                                                                                          | Clean tree       | 1min |

### T4: Consolidate CI to `pnpm run verify` (15min)

| Step | Action                                                                                                                             | Verify                   | Time |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---- |
| T4.1 | Read `.github/workflows/ci.yml`                                                                                                    | Confirm 6 separate steps | 2min |
| T4.2 | Replace Build+Lint+Test+Coverage+Duplicate steps with single `pnpm run verify` step. Keep Examples step separate (it's orthogonal) | Read back                | 5min |
| T4.3 | Verify `pnpm run verify` locally passes                                                                                            | Exit 0                   | 3min |
| T4.4 | Commit CI change                                                                                                                   | Exit 0                   | 3min |

### T5: Property-based test for `normalizeTagItem` (30min)

| Step  | Action                                                                  | Verify                  | Time |
| ----- | ----------------------------------------------------------------------- | ----------------------- | ---- |
| T5.1  | Read `src/decorator-helpers.ts` `normalizeTagItem` function fully       | Understand all branches | 3min |
| T5.2  | Create `test/unit/normalize-tag-item.test.ts`                           | File exists             | 2min |
| T5.3  | Add test: string input returns `{ name: string }`                       | Passes                  | 3min |
| T5.4  | Add test: empty string returns `null`                                   | Passes                  | 2min |
| T5.5  | Add test: object with valid name returns `Tag`                          | Passes                  | 3min |
| T5.6  | Add test: object with empty name returns `null`                         | Passes                  | 2min |
| T5.7  | Add test: object with non-string name returns `null`                    | Passes                  | 2min |
| T5.8  | Add test: object with description + externalDocs returns full Tag       | Passes                  | 3min |
| T5.9  | Add test: null/undefined/number/array input returns `null`              | Passes                  | 3min |
| T5.10 | Add test: externalDocs without url returns Tag without externalDocs     | Passes                  | 3min |
| T5.11 | Run `node_modules/.bin/vitest run test/unit/normalize-tag-item.test.ts` | All pass                | 2min |
| T5.12 | Run full `pnpm run lint`                                                | 0 warnings              | 2min |

### T6: Mixed string/object `@tags` integration test (20min)

| Step | Action                                                                                                                   | Verify   | Time |
| ---- | ------------------------------------------------------------------------------------------------------------------------ | -------- | ---- |
| T6.1 | Add test to `test/compliance/components-tags.test.ts`: compile `@tags(["simple", #{name: "rich", description: "desc"}])` | Compiles | 5min |
| T6.2 | Assert both tags appear in output with correct shapes                                                                    | Passes   | 5min |
| T6.3 | Assert AJV validation passes                                                                                             | Passes   | 3min |
| T6.4 | Run targeted test                                                                                                        | Green    | 2min |
| T6.5 | Run full verify                                                                                                          | Green    | 5min |

### T7: `@useChannelBinding` multi-channel test (20min)

| Step | Action                                                             | Verify   | Time |
| ---- | ------------------------------------------------------------------ | -------- | ---- |
| T7.1 | Add test with 2 channels, each with different `@useChannelBinding` | Compiles | 5min |
| T7.2 | Assert each channel gets correct binding `$ref`                    | Passes   | 5min |
| T7.3 | Assert `components.channelBindings` has both entries               | Passes   | 3min |
| T7.4 | Assert no cross-contamination                                      | Passes   | 3min |
| T7.5 | Run targeted + full verify                                         | Green    | 4min |

### T8: `@tags` dedup-across-scopes test (20min)

| Step | Action                                                     | Verify   | Time |
| ---- | ---------------------------------------------------------- | -------- | ---- |
| T8.1 | Add test: same tag name on operation + channel + namespace | Compiles | 5min |
| T8.2 | Assert `components.tags` has one entry per unique name     | Passes   | 5min |
| T8.3 | Assert tag description from richest source wins            | Passes   | 3min |
| T8.4 | Run targeted + full verify                                 | Green    | 7min |

### T9-T11: Golden files (3 tasks, 20-30min each)

| Step | Action                                     | Verify     | Time |
| ---- | ------------------------------------------ | ---------- | ---- |
| G.1  | Create `.tsp` fixture covering the feature | Compiles   | 5min |
| G.2  | Compile and capture output                 | Valid JSON | 5min |
| G.3  | Write `.expected.yaml` golden file         | Formatted  | 5min |
| G.4  | Write golden test that asserts exact match | Passes     | 5min |
| G.5  | Run targeted + verify                      | Green      | 5min |

(Repeated for tags, examples, security — 3 × 5 steps)

### T12: Verify + commit Phase 2 (10min)

| Step  | Action                     | Verify          | Time |
| ----- | -------------------------- | --------------- | ---- |
| T12.1 | Run `pnpm run verify`      | All gates green | 5min |
| T12.2 | `git add -A && git commit` | Exit 0          | 3min |
| T12.3 | Check status               | Clean           | 2min |

### T13-T18: Testing gap tasks (each 20-30min)

Each follows the same micro-pattern:

| Step | Action                                         | Verify   | Time |
| ---- | ---------------------------------------------- | -------- | ---- |
| X.1  | Write test TypeSpec code covering the scenario | Compiles | 5min |
| X.2  | Assert expected AsyncAPI output structure      | Passes   | 5min |
| X.3  | Assert AJV validation passes                   | Passes   | 3min |
| X.4  | Add edge case assertions                       | Passes   | 5min |
| X.5  | Run targeted test                              | Green    | 2min |

### T19-T22: Documentation tasks (each 20-30min)

| Step | Action                                         | Verify             | Time |
| ---- | ---------------------------------------------- | ------------------ | ---- |
| D.1  | Read current AGENTS.md section                 | Understand context | 3min |
| D.2  | Make edit with exact text matching             | Edit succeeds      | 5min |
| D.3  | Read back edit                                 | Correct            | 2min |
| D.4  | Run `pnpm run verify` (docs don't break build) | Green              | 5min |

### T23-T24: Type safety (10-15min each)

| Step | Action                          | Verify                    | Time |
| ---- | ------------------------------- | ------------------------- | ---- |
| S.1  | Read type definition            | Confirm gap               | 2min |
| S.2  | Edit type to add required field | Edit succeeds             | 3min |
| S.3  | Run `pnpm run build`            | 0 errors (or fix callers) | 5min |
| S.4  | Run `pnpm run verify`           | Green                     | 5min |

### T25: Verify + commit Phase 3 (10min)

Same as T12.

---

## Risk Assessment

| Risk                                                 | Likelihood | Impact | Mitigation                                                        |
| ---------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------- |
| Type safety change (T23) breaks callers              | Medium     | Medium | Build after edit, fix cascading errors                            |
| Golden file format doesn't match daemon expectations | Low        | Low    | Golden files are additive — existing tests unaffected             |
| Doc edits conflict with auto-git daemon              | High       | Low    | Check `git log` before and after each edit; commit immediately    |
| Benchmark reveals performance regression             | Low        | Medium | If regression found, document and ticket — don't fix in this plan |
| TypeSpec 1.14.0 upgrade (Phase 4) breaks emitter     | Medium     | High   | Separate session with full regression test suite                  |

---

## What NOT to Do (Anti-Verschlimmbessern)

1. **Don't refactor working code for style** — The codebase is clean (0 lint, 0 clones). No speculative refactoring.
2. **Don't add new features before testing existing ones** — Phase 2/3 before Phase 4.
3. **Don't change the `info.tags` inline-vs-$ref design** without user input — This is a design decision, not a bug.
4. **Don't remove the auto-git daemon** — It's a feature, not a bug. Learn to work with it.
5. **Don't hardcode any new counts in docs** — Use ranges or remove entirely.
6. **Don't touch `generated-bindings.ts`** — It's auto-generated. Changes will be overwritten.
7. **Don't add dependencies** — The project has everything it needs.
8. **Don't change the test runner** — vitest via Node.js/V8 is the stable path. Bun test runner has OOM crashes.

---

## Summary Table: Comprehensive Plan (30-100min tasks)

| Phase | Task ID     | Description                                  | Impact   | Effort   | Priority |
| ----- | ----------- | -------------------------------------------- | -------- | -------- | -------- |
| 1     | T1          | Fix `normalizeTagItem` empty-string bug      | Critical | 10min    | P1       |
| 1     | T2          | Add negative test for empty-string tag       | Critical | 10min    | P1       |
| 1     | T3          | Commit pending docs + CHANGELOG gaps         | High     | 15min    | P1       |
| 1     | T4          | Consolidate CI to `pnpm run verify`          | High     | 15min    | P1       |
| 2     | T5          | Property-based test for `normalizeTagItem`   | High     | 30min    | P4       |
| 2     | T6          | Mixed string/object `@tags` test             | Medium   | 20min    | P4       |
| 2     | T7          | `@useChannelBinding` multi-channel test      | Medium   | 20min    | P4       |
| 2     | T8          | `@tags` dedup-across-scopes test             | Medium   | 20min    | P4       |
| 2     | T9          | Golden file: tag-rich output                 | Medium   | 30min    | P4       |
| 2     | T10         | Golden file: `@example` message output       | Medium   | 20min    | P4       |
| 2     | T11         | Golden file: server security output          | Medium   | 20min    | P4       |
| 2     | T12         | Verify + commit Phase 2                      | —        | 10min    | P4       |
| 3     | T13         | Multi-level inheritance test (A→B→C)         | Medium   | 20min    | P20      |
| 3     | T14         | Multi-namespace isolation test               | Medium   | 30min    | P20      |
| 3     | T15         | `@versioned` compatibility test              | Medium   | 20min    | P20      |
| 3     | T16         | `@encoded` constraint test                   | Low      | 20min    | P20      |
| 3     | T17         | Cross-emitter shared module test             | Medium   | 30min    | P20      |
| 3     | T18         | Benchmark profile on 200-channel scale       | Medium   | 30min    | P20      |
| 3     | T19         | Remove exact line counts from AGENTS.md      | Medium   | 30min    | P20      |
| 3     | T20         | Remove exact test counts from docs           | Medium   | 20min    | P20      |
| 3     | T21         | Document new helpers in AGENTS.md            | Low      | 20min    | P20      |
| 3     | T22         | Document unreachable `#{}` fields            | Low      | 20min    | P20      |
| 3     | T23         | Tighten `OperationObject.action` to required | Medium   | 15min    | P20      |
| 3     | T24         | Add `SecurityScheme.description` to type     | Low      | 10min    | P20      |
| 3     | T25         | Verify + commit Phase 3                      | —        | 10min    | P20      |
| 4     | R-1 to R-25 | Future features & ecosystem                  | Variable | Variable | Future   |

**Total Phase 1-3 effort: ~8 hours**
**Total micro-tasks: ~120 atomic steps**
