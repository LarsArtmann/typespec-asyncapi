# Full Code Review — Pareto Execution Plan

**Generated:** 2026-05-06 | **Reviewer:** Senior Software Architect

---

## File Review Summary

### Source Files (29 files, 3,378 lines)

| File | Lines | Verdict | Issues |
|------|------:|---------|--------|
| `minimal-decorators.ts` | 611 | CRITICAL | God module, all 11 decorators, type assertions everywhere |
| `lib.ts` | 457 | EXCESSIVE | 90% JSDoc/TODOs, ~60 lines actual code |
| `emitter-alloy.tsx` | 591 | DEAD CODE | Not exported, 15+ type errors, richer but unused |
| `utils/effect-helpers.ts` | 285 | OVER-ENGINEERED | Railway patterns defined but barely used |
| `state.ts` | 188 | OK | Clean types, fragile StateMapView unwrapping |
| `emitter.ts` | 192 | WORKING | Simple but functional; debug log spam |
| `infrastructure/configuration/options.ts` | 259 | SPLIT BRAIN | Overlaps with config.ts and types file |
| `constants/paths.ts` | 167 | OK | Hard-coded username in config.ts |
| `utils/standardized-errors.ts` | 144 | OVER-ENGINEERED | 5 error classes, never thrown |
| `domain/models/path-templates.ts` | 134 | OK | Clean, useful utilities |
| `infrastructure/performance/PerformanceRegressionTester.ts` | 134 | DEAD CODE | Excluded from build |
| `domain/decorators/index.ts` | 31 | STUB | Empty barrel file |
| `logger.ts` | 107 | OK | Clean Effect logger |
| `constants/version.ts` | 107 | OK | Package version extraction |
| `constants/index.ts` | 103 | OK | Constants barrel |
| `constants/protocol-defaults.ts` | 88 | OK | Clean protocol definitions |
| `constants/config.ts` | 88 | CRITICAL | Hard-coded `/Users/larsartmann/` paths |
| `domain/models/validation-result.ts` | 74 | OK | Clean result types |
| `domain/models/serialization-format-option.ts` | 73 | OK | Clean enum-like |
| `infrastructure/configuration/asyncAPIEmitterOptions.ts` | 65 | OK | Clean type definitions |
| `state-compatibility.ts` | 50 | FRAGILE | TypeSpec version-specific hacks |
| `plugins/core/PluginSystem.ts` | 43 | DEAD CODE | Skeleton, not used |
| `decorators.ts` | 40 | OK | Clean delegation |
| `infrastructure/performance/PerformanceMonitor.ts` | 40 | DEAD CODE | Excluded from build |
| `shared/index.ts` | 11 | STUB | Empty |
| `protocols/index.ts` | 1 | STUB | Empty |
| `tsp-index.ts` | 12 | OK | Library bridge |
| `index.ts` | 15 | OK | Clean barrel |
| `domain/decorators/channel.ts` | 22 | STUB | Empty |
| `domain/decorators/server.ts` | 8 | STUB | Empty |

### Architect Checklist Findings

- **Split brains detected:** `stateKeys` vs `stateSymbols`, 4 config files, 2 emitter implementations
- **Files over 350 lines:** `minimal-decorators.ts` (611), `emitter-alloy.tsx` (591), `lib.ts` (457)
- **Booleans that should be enums:** `retain` in MQTT config, `enabled` in versioning
- **Hardcoded secrets/paths:** `/Users/larsartmann/` in `config.ts`
- **Unused imports:** Effect.TS imported in files that don't use railway patterns
- **No generated code where appropriate:** YAML serialization is hand-rolled instead of using `yaml` library

---

## Pareto Analysis

### The 1% that delivers 51% of the result

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 1 | Fix tsconfig.json (add `"node"`, `"dom"`) | Fixes 7 build errors | 5 min |
| 2 | Delete `emitter-alloy.tsx` | Removes 15 errors, dead code | 2 min |
| 3 | Delete `PerformanceMonitor.ts`, `PerformanceRegressionTester.ts` | Removes dead code | 2 min |
| 4 | Delete `PluginSystem.ts` | Removes dead code | 1 min |
| 5 | Fix `config.ts` hard-coded paths | Security + correctness | 5 min |

### The 4% that delivers 64% of the result

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 6 | Remove debug Effect.log from emitter.ts | Clean output | 10 min |
| 7 | Consolidate config into single file | Eliminates split brain | 45 min |
| 8 | Remove `lib.ts` excessive comments | Readability | 20 min |
| 9 | Fix tags storage (array not comma-separated) | Correctness | 15 min |
| 10 | Add `"dom"` to tsconfig lib | Fixes logger console errors | 2 min |

### The 20% that delivers 80% of the result

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 11 | Split `minimal-decorators.ts` into domain modules | Testability, maintainability | 4 hrs |
| 12 | Extract protocol handler strategy pattern | Extensibility | 4 hrs |
| 13 | Delete 200+ stale docs/status/planning files | Cognitive load | 30 min |
| 14 | Fix broken tests (remove references to deleted modules) | Test suite green | 2 hrs |
| 15 | Use `yaml` library for YAML serialization | Correctness | 30 min |

---

## Detailed Task Breakdown (15 min each)

### Phase 1: Build Fix (6 tasks, ~90 min)

| Task | Description |
|------|-------------|
| T1 | Add `"node"` to `tsconfig.json` types array |
| T2 | Add `"dom"` to `tsconfig.json` lib array |
| T3 | Delete `emitter-alloy.tsx` (dead code, 15 errors) |
| T4 | Delete `PerformanceMonitor.ts`, `PerformanceRegressionTester.ts` |
| T5 | Delete `PluginSystem.ts` |
| T6 | Fix `effect-helpers.ts:276` — rename `errors` to `failures` |

### Phase 2: Clean Code (8 tasks, ~120 min)

| Task | Description |
|------|-------------|
| T7 | Remove debug `Effect.log` lines from `emitter.ts` |
| T8 | Replace hard-coded paths in `config.ts` with `process.cwd()` |
| T9 | Fix tags storage: use `string[]` instead of comma-separated |
| T10 | Remove `tryGetStateMap` (identical to `getStateMap`) |
| T11 | Remove `configUtils` wrapper (useless indirection) |
| T12 | Clean excessive JSDoc/TODOs from `lib.ts` (reduce to <150 lines) |
| T13 | Remove `emitter.ts` hand-rolled YAML, use `yaml` library |
| T14 | Consolidate config files into single `config.ts` |

### Phase 3: Architecture (6 tasks, ~90 min)

| Task | Description |
|------|-------------|
| T15 | Split `minimal-decorators.ts` into domain modules |
| T16 | Unify state keys (remove `stateSymbols`, use `$lib.state`) |
| T17 | Extract protocol handler interface + implementations |
| T18 | Delete 200+ stale docs (keep only: architecture/, guides/, map-typespec-to-asyncapi/) |
| T19 | Fix broken test imports (remove references to deleted modules) |
| T20 | Remove `disabled/` test duplicates |

### Phase 4: BDD Tests (4 tasks, ~60 min)

| Task | Description |
|------|-------------|
| T21 | Write BDD test: "User defines a channel and gets valid AsyncAPI" |
| T22 | Write BDD test: "User publishes a message with Kafka binding" |
| T23 | Write BDD test: "User adds security scheme to operation" |
| T24 | Write BDD test: "User configures server with protocol" |

---

## Execution Graph

```
T1 → T2 → T3 → T4 → T5 → T6 (build fix chain)
                                      ↓
                         T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14 (clean code)
                                                                          ↓
                                              T15 → T16 → T17 (architecture)
                                                ↓
                                              T18 → T19 → T20 (cleanup)
                                                         ↓
                                              T21 → T22 → T23 → T24 (BDD tests)
```
