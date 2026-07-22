# Status Report: Split-Brain Elimination, Type Safety & vitest Migration

**Date:** 2026-07-22 03:46
**Session scope:** Execute the full Pareto plan from `docs/planning/2026-07-21_16-31_SPLIT-BRAIN-ELIMINATION-AND-TYPE-SAFETY.md` (8 tasks, 36 subtasks) + emergency vitest migration after Bun OOM crash
**Result:** 9/9 tasks completed. All quality gates pass. **Nothing committed yet.**

> **Update 2026-07-22:** The work was committed across `42ad7ac` (diagnostic drift + test stabilization), `60b526c` (protocol binding enforcement), and `28bed42` (data model + `@service` compat). The `@service` UX trap (section d) is fixed — `listServices()` now reads the title for `info.title`. Test count grew from 426 to **510**. Still open: dead coverage devDeps (3 packages), `engines.node` bump, GitHub #229/#160 closure. Item-by-item status in [Resolution](#resolution-2026-07-22) below.

---

## Quality Gates (verified this session)

| Gate                 | Result                                                 |
| -------------------- | ------------------------------------------------------ |
| Build (`bunx tsc`)   | 0 errors                                               |
| Lint (`eslint src`)  | 0 warnings                                             |
| Tests (`vitest run`) | **426 pass**, 0 fail, 39 files, 3.84s                  |
| Coverage gate        | **PASSED** — 19 files, avg **95.0%**, min 75% per file |
| Git working tree     | 49 modified + 2 untracked, **uncommitted**             |

---

## a) FULLY DONE

### T1: Diagnostic Registry Split-Brain — FIXED

**Root cause fixed:** `reportDecoratorDiagnostic()` in `decorator-helpers.ts` used raw `program.reportDiagnostic({ code, ... })` which accepts any string. Switched to `$lib.reportDiagnostic()` from the TypeSpec library API, which validates codes against the declared registry at compile time AND auto-prefixes the library name.

**Before (split-brain):**

| Category                      | Count                |
| ----------------------------- | -------------------- |
| Declared AND fired            | 3                    |
| Fired but NOT declared        | 11                   |
| Declared but NOT fired (dead) | 6                    |
| Wrong prefix format           | 5 codes in `$server` |

**After (honest):**

| Category               | Count |
| ---------------------- | ----- |
| Declared AND fired     | 14    |
| Fired but NOT declared | 0     |
| Declared but NOT fired | 0     |
| Wrong prefix format    | 0     |

**Files changed:** `src/lib.ts`, `src/decorator-helpers.ts`, `src/minimal-decorators.ts`
**Key design decision:** `reportDiagnostic()` now takes `code: keyof typeof $lib.diagnostics` — TypeScript rejects undeclared codes at compile time. The split-brain is structurally impossible to reintroduce.

### T2: Dead Version Constants — DELETED

`src/constants/index.ts` deleted entirely. All 7 exports (`ASYNCAPI_VERSION`, `ASYNCAPI_VERSIONS`, `DEFAULT_CONFIG`, `LIBRARY_NAME`, `DEFAULT_CONTENT_TYPE`, `DEFAULT_SERVER_URL`, `LIBRARY_PATHS`) had zero importers across `src/` and `test/`. Single version source of truth: `ASYNCAPI_SPEC_VERSION` in `document-builder.ts:31`.

### T3: ServerObject.protocol Type Tightened

`src/domain/models/asyncapi-document.ts`: `ServerObject.protocol: string` → `AsyncAPIProtocol`. Runtime values were always valid (always passed through `normalizeProtocol()`), so zero consumer breakage in `document-builder.ts`.

### T4: OperationObject.bindings Type Tightened

`src/domain/models/asyncapi-document.ts`: `OperationObject.bindings: Record<string, unknown>` → `ProtocolBindings`. Now matches `MessageObject.bindings` and `ChannelObject.bindings` — consistent across the document model.

### T5: External `.tsp` Spec Compilation — 16 patterns tested

Created `test/external/external-specs.test.ts` (16 tests) covering real-world patterns extracted from 5 external projects:

| Pattern source         | Patterns tested                                                       |
| ---------------------- | --------------------------------------------------------------------- |
| Kernovia               | Scalar inheritance, model spread, enums, default values, multi-server |
| typespec-eventsourcing | Generics, branded IDs, CQRS, Record types, discriminated unions       |
| blog/content-spec      | Deep model inheritance, multi-message channels                        |
| ActaFlow               | Nested anonymous models, nullable types                               |
| Stress/edge cases      | 50-field models, empty models, arrays of named models                 |

**Key finding:** `@service({})` (common pattern from OpenAPI/HTTP emitters) is NOT registered in this emitter. It causes a silent compilation failure — "Is a model expression type, but is being used as a value" — and produces NO AsyncAPI output. This is a UX trap for new users.

### T6: URL Validation for `@server`

- Added `isValidUrl()` to `decorator-helpers.ts`
- Added `invalid-server-url` diagnostic to `src/lib.ts`
- Wired into `$server` decorator in `minimal-decorators.ts`
- 4 test cases: valid URLs, schemeless hostnames (valid AsyncAPI), spaces rejected, template variables accepted
- **Design note:** Initially implemented full RFC 3986 validation via `new URL()`, but realized AsyncAPI server URLs are NOT full RFC 3986 URLs — they're host/path strings where the protocol comes from a separate field. Schemeless hostnames like `{region}.example.com` are valid. Relaxed to reject only clearly broken values (empty, whitespace, control characters).

### T7: Error Type Hierarchy — CLOSED AS YAGNI

GitHub issue #54 closed with detailed rationale:

- Only 2 `throw new Error()` calls exist (defensive guards in `state-compatibility.ts`)
- Validation errors use TypeSpec diagnostics (14 codes), not exceptions
- Effect.TS (referenced in the issue's Phase 3) no longer in codebase
- 5-class error hierarchy wrapping 2 throw sites is 2.5:1 overengineering

### T9: vitest Migration (emergency, unplanned)

**Trigger:** `bun test` consumed 61GB RAM and crashed the system. Research confirmed well-documented Bun memory leaks: GitHub #29083 (GC failures → OOM), #27692 (BSODs from memory corruption), Kiro #7909 (4-5GB growth in minutes). Bun was rewritten from Zig to Rust in July 2026 specifically to address these issues.

**Migration:**

- Installed `vitest@4.1.10` (same version microsoft/typespec uses)
- Replaced `from "bun:test"` → `from "vitest"` across 40 files
- Replaced `import.meta.dir` → `import.meta.dirname` across 8 files (Bun-specific API)
- Created `vitest.config.ts` with `environment: "node"`, `isolate: false`
- Updated `package.json` scripts
- Updated `AGENTS.md` with vitest instructions

**Result:** 426 tests pass in 3.84s, zero OOM, zero crashes.

### T8: Full Verification — ALL PASS

Build: 0 errors. Lint: 0 warnings. Tests: 426/426. Coverage: 95.0% avg, gate passes.

### Docs Updated

- `AGENTS.md`: Updated test commands, constraints, diagnostic system description, test framework section
- `TODO_LIST.md`: All 7 items marked done
- GitHub issue #54: Closed with rationale
- Planning doc status: Still says "PLANNED" (not updated — see section b)

---

## b) PARTIALLY DONE

### Coverage Toolchain — WORKING but FRAGILE

**The split strategy works but is inelegant:**

- `bun run test` → `vitest run` (426 tests, no OOM, but vitest's coverage providers can't instrument the emitter code because the TypeSpec compiler loads it from `dist/*.js` as opaque native modules)
- `bun run test:coverage` → `bun test` on core dirs only (277 tests, generates lcov.info, but EXCLUDES `test/external/` to avoid the OOM)
- Coverage gate (`scripts/coverage-gate.ts`) reads `coverage/lcov.info` which uses `dist/src/*.js` paths, not `src/*.ts` paths

**What's fragile:** Three coverage devDependencies installed (`@vitest/coverage-v8`, `@vitest/coverage-istanbul`, `c8`), none of which work for this project's architecture. Only `bun test --coverage` works. This is confusing for new contributors.

### Planning Doc Not Updated

`docs/planning/2026-07-21_16-31_SPLIT-BRAIN-ELIMINATION-AND-TYPE-SAFETY.md` still says `**Status:** PLANNED (awaiting execution approval)` on line 4. Should be updated to `EXECUTED` with results.

### GitHub Issues #229 and #160 Not Closed

- **#229** (RFC 3986 URL validation): Partially addressed by T6, but the implementation is pragmatic (reject garbage, don't do full RFC 3986). Should be closed with a comment explaining the design decision.
- **#160** (Apply Bun-Compatible Test Patterns): This issue is now moot — we migrated to vitest. Should be closed.

---

## c) NOT STARTED

### Commit and Push

**49 modified files + 2 untracked files are uncommitted.** The entire session's work sits in the working tree. No commit, no push.

### pnpm Migration

The user mentioned switching to pnpm (matching microsoft/typespec). Not started. Currently using `bun install` / `bun.lock`.

### `packageManager` Field in package.json

Not set. microsoft/typespec pins `"packageManager": "pnpm@11.10.0"`.

---

## d) TOTALLY FUCKED UP

### Three Useless Coverage DevDependencies

Installed `@vitest/coverage-v8`, `@vitest/coverage-istanbul`, AND `c8` — all three are dead weight. None of them can instrument code that the TypeSpec compiler loads from `dist/*.js` as opaque modules. Only `bun test --coverage` works for this architecture. Should remove the two vitest coverage packages and `c8` from devDependencies, or find a proper solution.

### Coverage Strategy is a Compromise

The "use bun test for coverage but vitest for test running" split is honest but confusing. A new contributor will run `vitest run --coverage`, see 0%, and be confused. The vitest config has `coverage` settings that don't work. This is technical debt.

### URL Validation Weakened from Original Spec

T6 started as "RFC 3986 URL validation" (issue #229) but became "reject empty/whitespace/control chars." This is pragmatic but doesn't fully satisfy the issue's intent. The original `new URL()` approach was too strict for AsyncAPI's host-string format. A better solution would validate the URL format after combining `url` + `protocol` fields, but that's more complex.

### `@service` UX Trap Discovered but Not Fixed

T5 revealed that `@service({})` silently kills output. This is a significant UX issue for users coming from OpenAPI/HTTP emitters. We documented it in test comments but didn't add a diagnostic warning or a helpful error message.

---

## e) WHAT WE SHOULD IMPROVE

### Architecture

1. **Coverage toolchain needs a single clear path.** Currently: vitest for tests, bun for coverage, three dead coverage packages. Pick ONE: either make vitest coverage work (by somehow getting the emitter code instrumented) or commit to bun for coverage and document it clearly.
2. **`@service({})` should produce a helpful diagnostic**, not silent failure. Either register it as a no-op decorator with a deprecation warning, or emit a diagnostic saying "this emitter does not use @service — use @server on your namespace instead."
3. **Diagnostic `messageId` typing is hacked.** `reportDiagnostic()` casts `messageId as "default"` to satisfy TypeScript. The TypeSpec API types `messageId` very strictly per-code. A proper solution would use conditional types or function overloads.
4. **`import.meta.dirname` is Node.js 20.11+ only.** If the project needs to support older Node versions, this will break. (microsoft/typespec requires Node 24, so this is likely fine, but should be documented.)

### Process

5. **The planning doc should be updated after execution**, not left stale. It still says "PLANNED."
6. **GitHub issues should be closed promptly** when the work is done, not left for later. #229 and #160 are still open.
7. **Coverage devDependencies should be cleaned up** — three dead packages is clutter.

### Testing

8. **External spec tests (`test/external/`) are excluded from coverage runs** because `bun test` OOMs when including them. This means new external tests won't be coverage-verified. Consider running them in a separate vitest worker pool.
9. **The coverage gate checks `dist/src/*.js` paths**, not `src/*.ts` paths. If source files are renamed or deleted, the gate won't catch it.
10. **No integration test verifies the diagnostic prefix format.** Tests assert `d.code === "@lars-artmann/typespec-asyncapi/unsupported-protocol"` but only for 2 codes. A broader test would catch prefix regressions.

---

## f) Up to 50 Things to Get Done Next

#### Immediate (blockers / cleanup from this session)

1. **Commit the work** — 49 files uncommitted
2. **Update planning doc status** to `EXECUTED` with results
3. **Close GitHub #229** with comment explaining pragmatic URL validation
4. **Close GitHub #160** — "Bun-compatible test patterns" is moot after vitest migration
5. **Remove dead coverage devDependencies** (`@vitest/coverage-v8`, `@vitest/coverage-istanbul`, `c8`) or document why they're needed
6. **Clean up `vitest.config.ts`** — remove coverage config that doesn't work, or fix it

#### TypeSpec alignment

7. **Add `"packageManager": "pnpm@..."` to package.json** if migrating to pnpm
8. **Migrate from bun to pnpm** for install/build (matching microsoft/typespec)
9. **Set up `engines.node`** in package.json — require Node 20.11+ (for `import.meta.dirname`)
10. **Add `.npmrc`** with `engine-strict=true` if migrating to pnpm
11. **Add oxlint** alongside or replacing ESLint (microsoft/typespec uses oxlint)
12. **Upgrade TypeScript** to ~6.0.2 (microsoft/typespec's version) if compatible

#### Diagnostics & UX

13. **Add `@service` no-op decorator** with helpful diagnostic: "This emitter uses @server, not @service"
14. **Improve URL validation** — combine `url` + `protocol` for full validation, or add `@server` format documentation
15. **Add diagnostic tests** for ALL 14 diagnostic codes (currently only 2 are tested by code)
16. **Consider `missing-required-decorator` diagnostic** — warn when a namespace has operations but no `@server`
17. **Add `@message` target validation diagnostic** — `@message` on a non-model should be a clear error

#### Testing

18. **Set up vitest workspaces** if the project grows (matching microsoft/typespec's monorepo pattern)
19. **Add `@vitest/coverage-v8` back** and make it work by configuring source map resolution
20. **Add Playwright E2E tests** for CLI compilation (`tsp compile .`)
21. **Add snapshot testing** for golden file comparison (vitest has built-in snapshot support)
22. **Add property-based testing** for schema generation (GitHub #243)
23. **Add performance benchmarks** (GitHub #167)
24. **Create test fixture factory** — reduce boilerplate in test source strings
25. **Add flaky test detection** — run test suite 3x in CI to catch intermittent failures
26. **Add `test:ci` script** with JUnit XML reporter for CI integration

#### Features

27. **Implement `@typespec/versioning` support** (GitHub #163)
28. **Add SNS protocol binding** (GitHub #44)
29. **Add Google Pub/Sub protocol binding** (GitHub #43)
30. **Add Redis protocol binding** (GitHub #42)
31. **Implement multi-file output** (GitHub #78)
32. **Add structured logging** (GitHub #242)
33. **Add file system verification after compilation** (GitHub #58)
34. **Enhance emitter logging for debugging** (GitHub #59)

#### Code Quality

35. **Convert TODO comments to GitHub issues** (GitHub #131 — 284 TODOs at time of issue)
36. **Implement type caching system** for 50-70% speedup (GitHub #136)
37. **Complete `lib/main.tsp` documentation** (GitHub #153)
38. **Add comprehensive decorator examples** (GitHub #170)
39. **Add real code quality metrics** (GitHub #94)
40. **Review negative decorators RFC** (GitHub #77)
41. **Review plugin extraction / modular architecture** (GitHub #32)

#### Docs

42. **Update README** with vitest commands (currently references `bun test`)
43. **Update CONTRIBUTING.md** with vitest and pnpm workflow
44. **Update FEATURES.md** test count (406 → 426) and file count
45. **Add ADR for vitest migration** (architecture decision record)
46. **Add ADR for diagnostic system design** (why `$lib.reportDiagnostic` over raw API)
47. **Add CHANGELOG entry** for this session's changes
48. **Update flake.nix** if it references bun test commands
49. **Add CI workflow** using vitest (matching microsoft/typespec's `vitest run --coverage --reporter=junit`)
50. **Add `prepublishOnly` script** to run full quality gate before npm publish

---

## g) Questions I Cannot Answer Myself

### 1. Should I commit this as one commit or split it?

There are 49 files changed across 9 logical tasks (T1-T8 + vitest migration). Options:

- **One commit:** "fix: eliminate diagnostic split-brain, tighten types, migrate to vitest" — simple but huge diff
- **Two commits:** (1) T1-T8 code changes, (2) vitest migration — separates concerns
- **Three commits:** (1) diagnostic + type fixes, (2) external tests + URL validation, (3) vitest migration
- What's your preference?

### 2. Should we migrate to pnpm now?

You mentioned matching microsoft/typespec. This would change `bun install` → `pnpm install`, `bun.lock` → `pnpm-lock.yaml`, and require Corepack setup. But Bun is still useful for `bunx tsc` and `bun run build` speed. Do you want full pnpm, or a hybrid (pnpm for install, bun for build)?

### 3. Is the pragmatic URL validation acceptable for closing #229?

Issue #229 asks for "RFC 3986 URL Format Validation." What I built rejects empty/whitespace/control-character URLs but accepts schemeless hostnames like `{region}.example.com` (which are valid AsyncAPI). This is less strict than RFC 3986 but correct for AsyncAPI's format. Should I close #229 as done, or do you want stricter validation that combines `url` + `protocol` into a full URI before validating?

---

## Resolution (2026-07-22)

### Immediate items (section f, items 1-6)

| #   | Item                                        | Status | Evidence                                                                         |
| --- | ------------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| 1   | Commit the work                             | DONE   | Commits `42ad7ac`, `60b526c`, `28bed42`, `83e3917`, `fa6857d`                    |
| 2   | Update planning doc status                  | DONE   | Both planning docs annotated                                                     |
| 3   | Close GitHub #229                           | OPEN   | Still open; pragmatic validation shipped, full RFC 3986 not done                 |
| 4   | Close GitHub #160                           | OPEN   | Still open; moot after vitest migration but never closed                         |
| 5   | Remove dead coverage devDeps                | OPEN   | `@vitest/coverage-v8`, `@vitest/coverage-istanbul`, `c8` still in `package.json` |
| 6   | Clean up `vitest.config.ts` coverage config | OPEN   | Still references non-functional coverage settings                                |

### Section (d) "TOTALLY FUCKED UP" items

| Item                           | Status                                                                     |
| ------------------------------ | -------------------------------------------------------------------------- |
| Three useless coverage devDeps | OPEN — still installed                                                     |
| Coverage strategy compromise   | OPEN — vitest for tests, bun for coverage split remains                    |
| URL validation weakened        | KEPT AS-IS — pragmatic approach is correct for AsyncAPI host-string format |
| `@service` UX trap             | DONE — `listServices()` reads title for `info.title` (commit `28bed42`)    |

### Questions resolved

- **Q1 (commit strategy):** Work was committed in logical units across 5 commits, not one mega-commit.
- **Q2 (pnpm migration):** Not done — project still uses bun for install/build.
- **Q3 (URL validation for #229):** Pragmatic approach kept as the correct design for AsyncAPI. #229 still open.
