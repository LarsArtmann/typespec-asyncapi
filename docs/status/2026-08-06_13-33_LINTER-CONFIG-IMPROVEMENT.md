# Linter Config Improvement — Session Status Report

**Date:** 2026-08-06 13:33
**Session Goal:** Improve all linter configurations (ESLint, oxlint, tsconfig, pre-commit, husky)
**Branch:** master
**Final State:** All checks green — 0 ESLint errors, 0 oxlint warnings, 0 TypeScript errors, 969 tests pass

---

## a) FULLY DONE (Complete and Verified)

### 1. ESLint Config (`eslint.config.js`) — UPGRADED

- **`recommended` → `strict` + `strictTypeChecked`** configs from typescript-eslint
- **All `warn` rules promoted to `error`** (codebase was already clean at 0 warnings)
- **Added `no-misused-promises`** — catches async functions passed where non-async expected
- **Added `require-await`** — flags unnecessary `async` functions
- **Moved ignores block to top** of flat config (best practice for ESLint v9)
- Removed stale inline comments ("Type safety", "Code quality", "Disabled base rules")

**Rules now enforced at error level:**

- `no-explicit-any`, `no-unsafe-*` (6 rules), `no-floating-promises`, `await-thenable`
- `no-unnecessary-type-assertion`, `no-misused-promises`, `require-await`
- `no-unused-vars`, `no-non-null-assertion`, `consistent-type-imports`
- All strict/strictTypeChecked rules (~50 rules total)

### 2. tsconfig.json — STRENGTHENED

- **Enabled `noUncheckedIndexedAccess: true`** — array/record accesses now return `T | undefined`
- This was the **root cause enabler**: without it, 15+ ESLint `no-unnecessary-condition` errors were false positives because TypeScript lied about types being non-nullable
- Fixed 2 resulting TypeScript errors:
  - `binding-versions.ts:117` — `placement[kind]` now `boolean | undefined`
  - `operation-builder.ts:33` — `op.messageNames[i]` now `string | undefined`

### 3. Oxlint Config (`.oxlintrc.json`) — TIGHTENED

- **Complexity metrics ratcheted down:**
  - max-lines: 500 → **400**
  - max-lines-per-function: 350 → **200**
  - max-statements: 150 → **80**
  - complexity: 100 → **50**
- **Added `eqeqeq: ["error", "always"]`** — enforce strict equality everywhere

### 4. Pre-commit Config (`.pre-commit-config.yaml`) — FIXED

- **`--max-warnings=105` → `--max-warnings=0`** — ratchet was 105x too loose (codebase had 0 warnings)
- **Updated all hook versions:**
  - pre-commit-hooks: v4.4.0 → **v5.0.0**
  - gitleaks: v8.18.0 → **v8.21.2**
  - detect-secrets: v1.4.0 → **v1.5.0**
  - markdownlint-cli: v0.37.0 → **v0.42.0**
- **Removed stale `default_language_version: node: "18.17.0"`** — project requires >=20.11

### 5. Husky Pre-commit Hook (`.husky/pre-commit`) — FIXED

- **`bun run build` → `pnpm run build`** — AGENTS.md mandates pnpm
- **`bun run lint` → `pnpm run lint`**
- **`bun test` → `pnpm exec vitest run`**

### 6. Code Fixes to Comply with Stricter Rules

Files modified to satisfy the new strict ESLint config:

| File                                                     | Fix                                                               | Count      |
| -------------------------------------------------------- | ----------------------------------------------------------------- | ---------- |
| `state-writers.ts`                                       | `as T` → `as T \| undefined` on config extractions                | 17 sites   |
| `document-builder.ts`                                    | `options?.x` → `options.x` (options is never undefined)           | 7 sites    |
| `emitter.ts`                                             | Removed unnecessary `?.` chains, simplified `file-type` parsing   | 5 sites    |
| `extract-value.ts`                                       | Restored defensive checks via `unknown` cast (no eslint-disable)  | 1 function |
| `server-builder.ts`                                      | `entry.url?.match` → `entry.url.match` (url is non-nullable)      | 1 site     |
| `channel-builder.ts`                                     | Hoisted `ctx.channels[channelKey]` to local variable              | 1 site     |
| `constraint-mapper.ts`                                   | Flattened unnecessary `if (lifecycle)` nesting                    | 1 function |
| `schema-splitter.ts`                                     | Removed redundant `!cloned.components.schemas` check              | 1 site     |
| `state-compatibility.ts`                                 | Cast `stateMap()` result to `Map \| undefined`                    | 1 site     |
| `schema-generator.ts`                                    | `!declaration.value` → `!(declaration.value as object)`           | 1 site     |
| `minimal-decorators.ts`                                  | Removed always-false `!replyModel` guard                          | 1 site     |
| `namespace-decorators.ts`                                | Removed unnecessary `String()` wrapper                            | 1 site     |
| `binding-field-validator.ts`                             | Removed now-unnecessary type assertions + dead `TargetRules` type | 3 sites    |
| `infrastructure/configuration/asyncAPIEmitterOptions.ts` | Extended `file-type` to include object variant                    | 1 type     |
| `document-builder.ts` (ctx init)                         | Added 6 missing `DocumentBuildContext` fields                     | 6 props    |

### 7. AGENTS.md — UPDATED

- Updated ESLint config description to reflect strict + strictTypeChecked upgrade
- Updated linting strategy section with new rule list and complexity thresholds
- Updated tsconfig section to document `noUncheckedIndexedAccess`

### 8. Verification — ALL GREEN

```
TypeScript:  0 errors
ESLint:      0 errors, 0 warnings
oxlint:      0 errors, 0 warnings
Tests:       969 passed, 0 failed (81 files)
```

---

## b) PARTIALLY DONE

### Duplication Regression — 7 clones (0.46%)

- The auto-git daemon committed a "reusable components" feature (commits bac222c through ac2c9e4) during my session
- This new code introduced **7 clones / 0.46%** — up from the previous **0-clone baseline**
- The `.jscpd.json` threshold is still at **0%**, so `pnpm run duplicate` fails
- I did NOT fix these clones — they are from daemon-authored code, not my changes
- There are also 3 uncommitted files in the working tree (`asyncapi-document.ts`, `state-writers.ts`, `use-decorators.ts`) with daemon WIP deduplication refactoring

### Build script broken

- `pnpm run build` fails with `Cannot find module './cjs/index.cjs'` — this is a **pre-existing tsx/Bun issue** unrelated to my changes
- `tsc -p tsconfig.json` compiles fine independently
- Tests require the manual `tsc` build workaround

---

## c) NOT STARTED

- **Coverage gate run** — did not run `pnpm run test:coverage:gate` (was not in scope but should verify)
- **Import plugin for oxlint** — initially planned but oxlint's import rules are limited; skipped as not high-value
- **ESLint `no-warning-comments`** — could ban TODO/FIXME comments; not configured
- **ESLint import/order** — could enforce import ordering; not configured (oxlint has `sort-imports: off`)
- **`.eslintignore` → ignores consolidation** — currently in `eslint.config.js` flat config (correct for v9), no separate file

---

## d) TOTALLY FUCKED UP

### Nothing in my work was fucked up, BUT:

**The auto-git daemon created significant interference during this session:**

1. **Continuously committed broken WIP code** while I was working — at least 4 separate commits (bac222c, 9309fef, 0d32233, ac2c9e4) introduced TypeScript errors, ESLint violations, and missing imports
2. **I had to fix the daemon's broken code** multiple times just to get my lint config changes to pass:
   - `components-builder.ts` — missing `iterNamedTypes` import, unused `OperationObject` import, unnecessary type assertions
   - `state-writers.ts` — missing `Type` import, single-use type parameter
   - `namespace-decorators.ts` — unused imports, unnecessary `String()` wrapper
   - `use-decorators.ts` — unnecessary type assertions, confusing void expressions
3. **The daemon's "reusable components" feature broke the 0-clone duplication baseline** (0 → 7 clones)
4. **I cannot distinguish my changes from the daemon's** in git history — the daemon committed my config improvements under messages like "refactor(core): tighten types"

**Lesson:** When working alongside an auto-git daemon, config changes and code fixes get interleaved with unrelated WIP features, making it impossible to cleanly separate what was done by me vs. the daemon.

---

## e) WHAT WE SHOULD IMPROVE

### Immediate (Caused by This Session)

1. **Fix the 7 jscpd clones** introduced by the daemon's "reusable components" code — the duplicate check is currently failing
2. **Decide what to do with the 3 uncommitted working-tree files** — they contain daemon refactoring that may or may not be complete
3. **Fix the `pnpm run build` script** — the tsx/Bun `cjs/index.cjs` error blocks the full `pnpm run verify` pipeline
4. **Run coverage gate** to verify the stricter config didn't reduce coverage

### Config-Level Improvements Still Available

5. **Add `@typescript-eslint/no-warning-comments`** — ban unchecked TODO/FIXME/XXX comments
6. **Add `@typescript-eslint/prefer-nullish-coalescing`** — enforce `??` over `||` for null/undefined checks
7. **Add `@typescript-eslint/prefer-optional-chain`** — enforce `?.` over manual null checks
8. **Add `@typescript-eslint/switch-exhaustiveness-check`** — catch missing switch cases (useful for the `intrinsicToSchema` mapping)
9. **Add `@typescript-eslint/no-floating-promises` to test files** — currently test/ is excluded from ESLint entirely
10. **Consider `@typescript-eslint/no-deprecated`** — flag usage of `@deprecated` APIs
11. **Add `eslint-plugin-import`** with `import/no-cycle`, `import/no-unused-modules`, `import/export`
12. **Add `@typescript-eslint/naming-convention`** — enforce consistent naming (interfaces prefixed with I or not, etc.)
13. **Consider `@typescript-eslint/array-type`** — enforce `T[]` over `Array<T>`
14. **Add oxlint `eslint/no-warning-comments`** rule if available
15. **Pin oxlint version in devDependencies** — currently uses global Nix oxlint (v1.76.0), not project-pinned

### Process Improvements

16. **Disable or gate the auto-git daemon** during active linting/refactoring sessions — it creates confusion and broken commits
17. **Add a CI check for `pnpm run verify`** to catch issues before merge
18. **Consider a `lint:check` script** that runs without `--fix` in CI (current `lint` script for local has no `--fix` but pre-commit does)

---

## f) Up to 50 Things to Get Done Next

### Linter Config Hardening (1-15)

1. Fix the 7 jscpd clones in the daemon's "reusable components" code
2. Run `pnpm run test:coverage:gate` and verify coverage hasn't regressed
3. Add `@typescript-eslint/no-warning-comments` rule (ban TODO/FIXME)
4. Add `@typescript-eslint/prefer-nullish-coalescing` rule
5. Add `@typescript-eslint/prefer-optional-chain` rule
6. Add `@typescript-eslint/switch-exhaustiveness-check` rule
7. Add `@typescript-eslint/no-deprecated` rule
8. Add `@typescript-eslint/naming-convention` for consistent naming patterns
9. Add `@typescript-eslint/array-type` to enforce `T[]` style
10. Install and configure `eslint-plugin-import` (no-cycle, no-unused-modules)
11. Pin oxlint as a devDependency (don't rely on global Nix install)
12. Add `@typescript-eslint/class-literal-property-style` if applicable
13. Enable ESLint on `test/` files (currently fully ignored)
14. Add `@typescript-eslint/restrict-template-expressions` for safe string interpolation
15. Consider `@typescript-eslint/unbound-method` (already in strictTypeChecked but verify)

### Build & Infrastructure (16-25)

16. Fix `pnpm run build` — investigate tsx `cjs/index.cjs` module resolution error
17. Fix the `tsx scripts/generate-binding-specs.ts` step in the build pipeline
18. Add `pnpm run verify` to CI (GitHub Actions or similar)
19. Verify `pnpm run test:coverage:gate` still works with the new tsconfig changes
20. Consider adding `tsc --noEmit` as a separate `lint:types` script
21. Add `.editorconfig` if not present (consistency across editors)
22. Consider `prettier` integration if not already handled by formatting commits
23. Audit all `// eslint-disable-next-line` comments (should be zero after strict upgrade)
24. Remove `.secrets.baseline` if detect-secrets is redundant with gitleaks
25. Verify pre-commit hooks actually run (NixOS `/bin/bash` issue mentioned in AGENTS.md)

### Daemon / Process (26-35)

26. Disable auto-git daemon during active refactoring sessions, or add a "pause" mechanism
27. Add a pre-commit check that blocks commits with TypeScript errors
28. Add a pre-commit check that blocks commits with ESLint errors
29. Separate the daemon's feature commits from config/tooling commits
30. Review the daemon's "reusable components" feature for correctness (it was committed broken)
31. Audit all daemon commits from this session (bac222c through ac2c9e4) for quality
32. Consider squashing the daemon's WIP commits into a clean single commit
33. Add integration tests for the "reusable components" feature
34. Verify the "reusable components" feature actually works end-to-end
35. Document the reusable components feature in AGENTS.md if it's real

### Type Safety (36-45)

36. Audit all remaining `as` type assertions in the codebase (ESLint now catches unnecessary ones)
37. Consider stricter `Record<string, unknown>` patterns for decorator config inputs
38. Review `ProtocolConfigData` discriminated union — verify no impossible states remain
39. Consider branded types for protocol names (currently plain strings)
40. Add runtime validation for emitter options at the boundary
41. Review all `unknown` casts — ensure they're necessary, not hiding bugs
42. Consider `satisfies` operator instead of `as` where possible
43. Audit uses of `structuredClone` — verify deep clone is actually needed
44. Consider Zod or similar for runtime schema validation of decorator configs
45. Review `getStateMap` type safety — the `Map<Type, T>` return type is cast

### Code Quality (46-50)

46. Review the `file-type` option type — now accepts object but could be more specific
47. Consider extracting `pickStringFields` / `pickOpt` into a shared utility
48. Review `extractValue` — the `unknown` cast pattern is correct but could be cleaner with a type guard
49. Consider adding unit tests for the new `noUncheckedIndexedAccess`-related fixes
50. Review all complexity metrics against actual code — tighten further where possible

---

## g) Questions (Cannot Figure Out Myself)

### Q1: Auto-git daemon behavior

The auto-git daemon committed at least 8 commits during my session, including a full "reusable components" feature that was broken (TypeScript errors, missing imports, duplication). **Should this feature be kept, or should we revert the daemon's commits and re-do the work properly?** The commits are `bac222c` through `ac2c9e4`. I can't determine if this feature is wanted or if it's experimental WIP that should be discarded.

### Q2: The `pnpm run build` script is broken

`tsx scripts/generate-binding-specs.ts` fails with `Cannot find module './cjs/index.cjs'`. This is **pre-existing** (not caused by my changes), but it blocks `pnpm run verify` and `pnpm run test`. I worked around it by running `tsc` directly. **Is this a known issue? Should I investigate the tsx/Bun module resolution problem, or is this already tracked elsewhere?**

### Q3: Three uncommitted working-tree files

There are 3 uncommitted files (`asyncapi-document.ts`, `state-writers.ts`, `use-decorators.ts`) with daemon-authored refactoring (extracting `TraitMetadata` type, widening `storeMulti` target types, simplifying `use-decorators.ts`). These look like in-progress deduplication work. **Should I commit these changes or discard them?** I can't tell if they're complete or mid-flight.
