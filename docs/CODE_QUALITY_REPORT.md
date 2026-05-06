# Code Quality Scan Report

**Generated:** 2026-05-06 | **Scanner:** Code Quality Scan Skill

---

## Executive Summary

| Check | Result | Details |
|-------|--------|---------|
| TypeScript Build | FAIL (41 errors) | Missing @types/node, unresolved modules, implicit any |
| ESLint | FAIL (runtime error) | `@eslint/js` module not found |
| TypeCheck | FAIL (41 errors) | Same as build |
| Tests | FAIL (88/100 failures) | 7 pass, 88 fail, 4 todo, 1 skip |
| Code Duplication | PASS (0.26%) | 2 clones, 9 duplicated lines |
| File sizes | PASS | Largest: `lib.ts` (457 lines) — under 350 line guideline with TODOs |

---

## Build Errors (41 total)

### Category: Missing Type Definitions (7 errors)
- `src/constants/paths.ts` — `node:path`, `node:url`, `process`, `ImportMeta.url` not found
- `src/constants/version.ts` — `process` not found
- `src/logger.ts` — `console` not found (needs `dom` in lib)

**Fix:** Add `"node"` to `types` in `tsconfig.json` and add `"dom"` to `lib`.

### Category: Unresolved Module Imports (14 errors)
- `@effect/schema` imported but package may not be installed
- All files importing from `effect` have type resolution issues

**Fix:** Run `bun install` and verify `effect` package version.

### Category: Implicit Any (4 errors)
- `src/emitter-alloy.tsx:97` — decorator args access
- `src/emitter-alloy.tsx:500` — property schema building
- `src/utils/effect-helpers.ts:29` — error cast

### Category: TSX/JSX Issues (1 error)
- `src/emitter-alloy.tsx` uses JSX but may need `jsx` compiler option

### Category: Property Access on Unknown Types (15 errors)
- Various `prop.type.scalar`, `prop.type.model`, etc. in `emitter-alloy.tsx`

---

## Sorted Issue List (by priority)

### P0 — Blocking (must fix for build)

1. **Add `"node"` to tsconfig types** — Fixes 7 errors in paths/version/logger
2. **Install/verify `effect` package** — Fixes 14 module resolution errors
3. **Add `"dom"` to tsconfig lib** — Fixes console.* errors in logger.ts
4. **Fix `@eslint/js` resolution** — Reinstall ESLint dependencies

### P1 — High Impact

5. **Remove or properly exclude `emitter-alloy.tsx`** — 15+ type errors; not exported; dead code
6. **Fix `src/constants/config.ts` hard-coded paths** — Contains `/Users/larsartmann/...`
7. **Remove debug `Effect.log` spam from emitter** — 6+ debug logs in `emitter.ts`
8. **Consolidate `stateSymbols` vs `stateKeys`** — Two parallel state key systems

### P2 — Medium Impact

9. **Fix `effect-helpers.ts:276`** — `separateEitherResults` returns `{successes, failures}` but caller expects `{successes, errors}`
10. **Fix `tags` storage** — Stored as comma-separated string instead of array
11. **Remove dead performance monitoring code** — `PerformanceMonitor.ts` excluded from build
12. **Remove skeleton plugin system** — Not functional, adds complexity
13. **Clean up 200+ stale docs/status/planning files** — Massive noise

### P3 — Low Impact

14. **Extract protocol binding switch cases** — Duplicated between `buildChannels` and `buildOperations` in alloy emitter
15. **Replace `getModelPropertySchema` type assertions** — Use proper TypeSpec API types
16. **Remove `tryGetStateMap` wrapper** — Identical to `getStateMap`, no additional error handling
17. **Remove `configUtils` dead export** — Wraps `configurationUtils` for no reason
18. **Consolidate test helpers** — 4+ overlapping test utility files

---

## Duplication Report

```
Format:     typescript
Files:      28
Lines:      3,520
Tokens:     21,733
Clones:     2
Dup Lines:  9 (0.26%)
Dup Tokens: 118 (0.54%)
```

### Clone 1: `effect-helpers.ts` lines 156-162 ≈ 270-276
Batch execute pattern duplicated in `partialFailureHandling` and `batchExecute`.

### Clone 2: `minimal-decorators.ts` lines 259-262 ≈ 359-362
`getModelPropertySchema` helper duplicated for Model vs ModelProperty type extraction.
