# Status Report: Pareto Execution Complete — All 26 Tasks Done, Brutal Self-Review
> **Live remainder:** none — every item resolved in the 2026-11-19/20 corpus sweep (verdicts inline; routed work lives in TODO_LIST.md / ROADMAP.md).

**Date:** 2026-07-23 03:52
**Session:** Tasks 17-26 completion + refactoring
**Previous report:** `docs/status/archived/2026-07-22_20-09_PARETO-EXECUTION-16-OF-25-COMPLETE.md`

---

## Metrics Snapshot

<!-- ledger: session metrics snapshot -->
<!-- check-rows:ledger -->
| Metric                 | Previous (Jul 22)                      | Now (Jul 23)         | Delta |
| ---------------------- | -------------------------------------- | -------------------- | ----- |
| Tests                  | 617 passing                            | **679 passing**      | +62   |
| Test files             | 57                                     | **64**               | +7    |
| Source files (non-gen) | 28                                     | **35**               | +7    |
| Source lines (non-gen) | 3,810                                  | **4,008**            | +198  |
| Test lines             | —                                      | **19,210**           | —     |
| Avg coverage           | unknown                                | **95.2%** (32 files) | —     |
| Files over 370 lines   | 2 (schema-emitter, minimal-decorators) | **0**                | -2    |
| ESLint                 | 0 errors, 0 warnings                   | 0 errors, 0 warnings | —     |
| oxlint                 | 0 errors, 0 warnings                   | 0 errors, 0 warnings | —     |
| Build                  | Clean                                  | Clean                | —     |

---

## a) FULLY DONE

### This Session's Work

<!-- ledger: session work table — completed execution records -->
<!-- check-rows:ledger -->
| Task         | Description                                | Tests Added       | Key Decisions                                                                                                              |
| ------------ | ------------------------------------------ | ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **24**       | Multi-file output (`split-schemas` option) | +9                | `structuredClone` for deep-copy, `$ref` rewriting in both main doc AND extracted schema files                              |
| **Refactor** | `schema-emitter.ts` 453→349 lines          | 0 (no regression) | Extracted to `extract-value.ts`, `stdlib-helpers.ts`, `schema-generator.ts`                                                |
| **Refactor** | `minimal-decorators.ts` 416→351 lines      | 0 (no regression) | Extracted `$server` + `$defaultContentType` → `server-decorators.ts`                                                       |
| **25**       | Cross-emitter shared schema types          | +19               | `src/shared/json-schema.ts` with `JsonSchema`, `SchemaRef`, `SchemaMap` types. `"./shared"` subpath export in package.json |
| **26**       | Performance benchmark suite                | +5                | `fixture-generator.ts` generates 10-200 channel specs programmatically. 200 channels compiles in ~75ms                     |

### All 26 Pareto Tasks Status

<!-- ledger: task-status table — execution records -->
<!-- check-rows:ledger -->
| Tasks        | Status                |
| ------------ | --------------------- |
| 1-16         | Done (prior sessions) |
| 17-19, 21-23 | Done (prior session)  |
| 20           | Dropped by user       |
| 24-26        | Done (this session)   |

**The entire Pareto Execution Plan is complete.**

---

## b) PARTIALLY DONE

### Task 25: Cross-emitter Shared Schema Types — SHALLOW

The shared module is architecturally aspirational but practically thin:

- **`JsonSchema` type is a DUPLICATE of `SchemaObject`** — `SchemaObject` in `src/domain/models/asyncapi-document.ts` has nearly identical fields. Both coexist. The internal emitter uses `SchemaObject`; the shared export uses `JsonSchema`. No code converts between them. This is a **split-brain type definition**.
- **No real consumer exists** — No OpenAPI emitter or JSON Schema emitter imports from `src/shared/`. The module is an API surface with zero external users.
- **`src/shared/index.ts` exports internal implementation details** — Exposing `AsyncAPISchemaEmitter` (a `TypeEmitter` subclass) and `extractValue` (an `EmitEntity` narrowing function) leaks TypeSpec asset-emitter internals to "cross-emitter" consumers. A real cross-emitter API would abstract behind an interface.
- **Untested as a package export** — The `"./shared"` subpath in `package.json` was never tested via actual `import { ... } from "@lars-artmann/typespec-asyncapi/shared"`. Tests import source files directly.

### Task 26: Performance Benchmark — BASIC

- **No CPU profiling** — Original plan called for `bun --cpu-prof`. Only wall-clock time was measured.
- **No memory profiling** — No heap/RSS measurements.
- **No regression baseline** — Results print to console but aren't persisted to a file. Future runs can't compare.
- **`generateFixtureMultiFile()` is dead code** — Created in the fixture generator but never called by any test or benchmark.
- **Simple property types only** — Fixtures use flat models with primitive fields. No deeply nested models, no circular refs, no large enums at scale.

---

## c) NOT STARTED

Nothing from the Pareto plan. However, items discovered during this session that need attention:

~~1. **No CLI integration test for `split-schemas`** — All tests use the programmatic TypeSpec compiler API. No test verifies the option works when passed via `tsp compile` CLI or `tspconfig.yaml`.~~ done — shipped later — test/e2e/channel-id-split-schemas.test.ts
2. **No test for the `"./shared"` package subpath export** — Never imported as an external package. **→ TODO_LIST Test-Suite Integrity (dist/ shared-subpath e2e import row)**
~~3. **No persisted benchmark baselines** — Results are ephemeral console output.~~ **NOT-DO — baselines stay ephemeral; the benchmark suite guards budgets.**

---

## d) TOTALLY FUCKED UP

### 1. Split-Brain: `JsonSchema` vs `SchemaObject`

**This is the most serious issue I introduced.** I created `JsonSchema` in `src/shared/json-schema.ts` as a "cross-emitter" type, but `SchemaObject` already exists in `src/domain/models/asyncapi-document.ts` with nearly the same shape:

```
SchemaObject (existing):     JsonSchema (new):
  type?: string                type?: string
  format?: string              format?: string
  properties?: Record<...>     properties?: Record<...>
  required?: string[]          required?: string[]
  description?: string         description?: string
  items?: SchemaObject         items?: JsonSchema
  enum?: unknown[]             enum?: unknown[]
  anyOf?: SchemaObject[]       anyOf?: JsonSchema[]
  $ref?: string                $ref?: string
  [key: string]: unknown       [key: string]: unknown
```

The entire emitter uses `SchemaObject`. The shared module exports `JsonSchema`. They are structurally identical but nominally distinct. This violates the AGENTS.md principle: "Make impossible states unrepresentable" — here I made the SAME thing representable in TWO ways.

**Fix:** `JsonSchema` should either (a) be a type alias for `SchemaObject`, (b) replace `SchemaObject` entirely, or (c) `SchemaObject` should extend `JsonSchema`.

### 2. `server-decorators.ts` Misleading Name

The file contains `$server` AND `$defaultContentType`. `$defaultContentType` sets the namespace-wide default content type — it has nothing to do with servers. The file name implies all decorators in it are server-related.

### 3. Coverage Holes for New Files

`src/shared/json-schema.ts` and `src/shared/index.ts` have **0% coverage** and don't even appear in the lcov report (type-only / re-export files with no executable lines). `src/schema-generator.ts`, `src/stdlib-helpers.ts`, and `src/server-decorators.ts` are covered transitively through integration tests but have **no direct unit tests**.

### 4. 7 New Files for What Could Be 2-3

The refactoring was too granular:

- `extract-value.ts` (26 lines) — could stay in `schema-emitter.ts`
- `stdlib-helpers.ts` (39 lines) — could stay in `schema-generator.ts`
- `schema-generator.ts` (46 lines) — legitimate extraction
- `server-decorators.ts` (73 lines) — legitimate but misnamed
- `shared/json-schema.ts` (58 lines) — questionable (see split-brain)
- `shared/index.ts` (23 lines) — barrel file for questionable module

The original goal was "under 370 lines." I could have achieved that with fewer, larger files instead of scattering logic across 7 tiny modules.

---

## e) WHAT WE SHOULD IMPROVE

### Critical (Self-Inflicted This Session)

~~1. **Consolidate `JsonSchema` and `SchemaObject`** — Pick one. Eliminate the duplicate.~~ done — resolved — a single JsonSchema shared type (AGENTS.md shared module)
~~2. **Rename `server-decorators.ts`** — Either move `$defaultContentType` back to `minimal-decorators.ts`, or rename to something accurate like `namespace-decorators.ts`.~~ done — resolved — namespace-decorators.ts exists
~~3. **Delete or use `generateFixtureMultiFile()`** — Dead code in `fixture-generator.ts`.~~ **NOT-DO — superseded during fixture evolution.**
4. **Test the `"./shared"` subpath export** — Write a test that actually imports from the package path. **→ TODO_LIST Test-Suite Integrity (dist/ shared-subpath e2e import row)**
5. **Add direct unit tests** for `server-decorators.ts`, `schema-generator.ts`, `stdlib-helpers.ts`.

### Important (Pre-Existing)

~~6. **`state-writers.ts` at 340 lines** — Approaching the 370-line limit. Next decorator addition will push it over.~~ done — resolved — store-protocol-config extracted (AGENTS.md)
~~7. **`@asyncapi/parser` Bun incompatibility** — Still unresolved. Round-trip tests use manual `$ref` resolution.~~ done — documented — parser runs under vitest/node (AGENTS.md)
~~8. **Coverage tooling complexity** — Bun native coverage + lcov parsing + dist-to-src remapping is fragile. Any new source file that isn't loaded during tests silently gets 0%.~~ done — resolved — the bun-native coverage gate works and is documented
~~9. **Redis protocol has no binding definitions** — Accepted as server protocol but can't produce bindings.~~ done — shipped — redis binding support (19 binding protocols)
~~10. **SNS binding version mismatch** — AsyncAPI 3.1 schema accepts only `0.1.0`, specs have `0.2.0`.~~ done — shipped — binding versions spec-generated per protocol

### Architectural

~~11. **No output validation in split-schemas tests** — Schema files aren't validated against AsyncAPI 3.1 JSON Schema (they're partial documents, so AJV would reject them — but we should validate the main document still resolves).~~ done — shipped — the split-schemas e2e AJV-validates output
~~12. **Benchmark fixtures don't test complex topologies** — No deeply nested models, no cross-references, no large enums, no circular dependencies.~~ **NOT-DO — complex benchmark topologies never added.**
~~13. **The `EmitEntity<T>` pattern is leaky** — `extractValue` duck-types `Placeholder<T>` by checking `onValue`. This is fragile and will break if TypeSpec changes the Placeholder interface.~~ done — shipped — extractValue is the authoritative implementation (AGENTS.md)
~~14. **`tsconfig.json` `"types": ["node"]`** — Restricts ambient types to ONLY `@types/node`. If we ever need `@types/something-else`, it won't be auto-loaded. Should be documented or made explicit.~~ done — documented — AGENTS.md tsconfig types note

---

## f) 50 Things to Get Done Next

### P0 — Fix Self-Inflicted Issues

| # | Task                                                                              | Effort  |
| - | --------------------------------------------------------------------------------- | ------- |
| ~~1~~ done — resolved — single JsonSchema shared type | ~~**Consolidate `JsonSchema` → `SchemaObject` alias or replace**~~ | ~~Low~~ |
| ~~2~~ done — resolved — namespace-decorators.ts | ~~**Rename `server-decorators.ts`** to `namespace-decorators.ts` or split correctly~~ | ~~Low~~ |
| ~~3~~ **NOT-DO — superseded during fixture evolution.** | ~~**Delete `generateFixtureMultiFile()`** dead code~~ | ~~Trivial~~ |
| ~~4~~ **NOT-DO — baselines stay ephemeral.** | ~~**Persist benchmark baselines** to `docs/benchmark-baselines.json`~~ | ~~Low~~ |
| 5 **→ TODO_LIST Test-Suite Integrity (dist/ shared-subpath e2e import row)** | **Test `"./shared"` subpath import** via package resolution | Low |

### P1 — Coverage & Test Gaps

| #  | Task                                                                                         | Effort |
| -- | -------------------------------------------------------------------------------------------- | ------ |
| ~~6~~ done — covered — server-builder validation tests | ~~Unit tests for `server-decorators.ts` (`$server` validation paths)~~ | ~~Low~~ |
| ~~7~~ done — covered — the schema-generation-failed diagnostic path | ~~Unit tests for `schema-generator.ts` (error handling path)~~ | ~~Low~~ |
| ~~8~~ **NOT-DO — stdlib-helpers never got dedicated unit tests.** | ~~Unit tests for `stdlib-helpers.ts` (`isStdlibType`, `collectAllStdlibNames`)~~ | ~~Low~~ |
| ~~9~~ **NOT-DO — splitter tested through the e2e instead.** | ~~Unit tests for `schema-splitter.ts` (direct function tests, not through compiler)~~ | ~~Low~~ |
| ~~10~~ done — shipped — the split-schemas e2e | ~~CLI integration test for `split-schemas` option~~ | ~~Medium~~ |
| ~~11~~ done — shipped — e2e AJV validation | ~~Test split-schemas output still validates against AsyncAPI 3.1 (main doc with external refs)~~ | ~~Medium~~ |
| ~~12~~ **NOT-DO — circular split-schemas negative never added.** | ~~Negative test: `split-schemas` with circular `$ref` between schemas~~ | ~~Medium~~ |
| ~~13~~ done — yaml emission tested | ~~Test `split-schemas` with YAML output + round-trip parsing~~ | ~~Low~~ |

### P2 — Harden What Exists

| #  | Task                                                                         | Effort  |
| -- | ---------------------------------------------------------------------------- | ------- |
| ~~14~~ done — shipped — store-protocol-config extraction | ~~Proactively refactor `state-writers.ts` (340 lines, approaching limit)~~ | ~~Medium~~ |
| ~~15~~ done — versioning integrated | ~~Add `@apiVersion` to decorators.ts `$decorators` map — verify it's there~~ | ~~Trivial~~ |
| ~~16~~ **NOT-DO — covered by compiler validation instead.** | ~~Add `@apiVersion` negative tests (non-string, empty, wrong target)~~ | ~~Low~~ |
| ~~17~~ done — documented — AGENTS.md tsconfig types note | ~~Document `tsconfig.json` `"types": ["node"]` constraint in AGENTS.md gotchas~~ | ~~Trivial~~ |
| ~~18~~ **NOT-DO — CPU profiling never added.** | ~~Add CPU profiling to benchmarks (`bun --cpu-prof`)~~ | ~~Medium~~ |
| ~~19~~ **NOT-DO — memory profiling never added.** | ~~Add memory profiling to benchmarks~~ | ~~Medium~~ |
| ~~20~~ **NOT-DO — nested-model benchmarks never added.** | ~~Benchmark with nested models (depth 5+)~~ | ~~Low~~ |
| ~~21~~ **NOT-DO — large-enum benchmarks never added.** | ~~Benchmark with large enums (100+ variants)~~ | ~~Low~~ |
| ~~22~~ **NOT-DO — cross-file benchmarks never added.** | ~~Benchmark with cross-file model references at scale~~ | ~~Low~~ |

### P3 — AsyncAPI Spec Compliance Deepening

| #  | Task                                                                                         | Effort |
| -- | -------------------------------------------------------------------------------------------- | ------ |
| ~~23~~ done — shipped — the split-schemas e2e resolves external refs | ~~Validate `split-schemas` main document resolves all external `$ref` refs~~ | ~~Medium~~ |
| ~~24~~ done — shipped — server variables | ~~Test `@server` with `variables` field~~ | ~~Low~~ |
| ~~25~~ done — shipped — server-security golden | ~~Test `@server` with `security` field~~ | ~~Low~~ |
| ~~26~~ done — covered — multi-server tests | ~~Test multi-server configurations (2+ servers per namespace)~~ | ~~Low~~ |
| ~~27~~ done — shipped — message-level protocol bindings | ~~Test `@protocol` on Models (message-level protocol)~~ | ~~Low~~ |
| ~~28~~ done — shipped — channel bindings | ~~Test `@bindings` on channels (not just operations/messages/servers)~~ | ~~Low~~ |
| ~~29~~ done — shipped — kafka schemaIdLocation validation | ~~Verify Kafka message binding `schemaIdLocation` field validation~~ | ~~Low~~ |
| ~~30~~ done — shipped — security-oauth2-flows.test.ts | ~~Test OAuth2 with all 4 flow types (implicit, password, clientCredentials, authorizationCode)~~ | ~~Low~~ |
| ~~31~~ done — covered — scheme types | ~~Test `@security` with `openIdConnect` type~~ | ~~Low~~ |
| ~~32~~ done — covered — scheme types | ~~Test `@security` with `X509` type~~ | ~~Low~~ |
| ~~33~~ done — shipped — components-tags test | ~~Add compliance test for `components.tags`~~ | ~~Low~~ |

### P4 — Developer Experience

| #  | Task                                                                            | Effort |
| -- | ------------------------------------------------------------------------------- | ------ |
| ~~34~~ **NOT-DO — error-message improvements never added.** | ~~Improve error messages for `split-schemas` (what if schemas dir is unwritable?)~~ | ~~Low~~ |
| ~~35~~ done — shipped — split-schemas writes to the schemas/ output dir | ~~Add `--output-dir` support for split schemas~~ | ~~Medium~~ |
| ~~36~~ **NOT-DO — no all-options tspconfig example.** | ~~Create a `tspconfig.yaml` example with all emitter options~~ | ~~Low~~ |
| ~~37~~ done — README documents the options | ~~Document all emitter options in README.md~~ | ~~Low~~ |
| ~~38~~ **NOT-DO — legacy-helper JSDoc never added.** | ~~Add `@deprecated` JSDoc to legacy test helpers~~ | ~~Low~~ |
| ~~39~~ done — operation-discovery consolidated | ~~Consolidate `returnModelNames` and `returnModelTypes` in operation-discovery.ts~~ | ~~Low~~ |
| ~~40~~ done — shipped — lib/main.tsp doc comments | ~~Add IDE hover documentation for all decorators in `lib/main.tsp`~~ | ~~Medium~~ |

### P5 — Future Features

| #  | Task                                                               | Effort |
| -- | ------------------------------------------------------------------ | ------ |
| ~~41~~ done — shipped — @messageTrait | ~~Message traits support (`@trait` decorator)~~ | ~~High~~ |
| ~~42~~ done — shipped — @operationTrait | ~~Operation traits support~~ | ~~High~~ |
| ~~43~~ done — shipped — server variables with enum values | ~~Server variables with enum/default validation~~ | ~~Medium~~ |
| ~~44~~ done — shipped — named types emit $ref | ~~Schema deduplication (identical inline schemas → `$ref`)~~ | ~~High~~ |
| ~~45~~ done — shipped — @extension x-* support | ~~AsyncAPI extensions (`x-*` fields) support~~ | ~~Medium~~ |
| ~~46~~ **NOT-DO — schema filtering never shipped.** | ~~Server-side schema filtering (include/exclude specific models)~~ | ~~Medium~~ |
| ~~47~~ **NOT-DO — one-doc-per-namespace never shipped.** | ~~Multi-namespace output (one AsyncAPI doc per namespace)~~ | ~~High~~ |
| ~~48~~ **NOT-DO — webhook channels never shipped.** | ~~Webhook channel support (`@channel` with HTTP protocol)~~ | ~~Medium~~ |
| ~~49~~ **Won't implement — migration guide never written.** | ~~AsyncAPI 3.0 → 3.1 migration guide for users~~ | ~~Low~~ |
| ~~50~~ **NOT-DO — IDE diagnostic pull mode never shipped.** | ~~Real-time schema validation feedback in IDE (diagnostic pull mode)~~ | ~~High~~ |

---

## g) Questions I Cannot Figure Out Myself

### 1. Should `JsonSchema` replace `SchemaObject`, or should it be deleted?

I created `JsonSchema` in `src/shared/json-schema.ts` as a "cross-emitter" type, but `SchemaObject` already exists with the same shape. The entire codebase uses `SchemaObject`. Options:

- **A)** Delete `JsonSchema`, keep `SchemaObject`, export `SchemaObject` from `src/shared/`
- **B)** Rename `SchemaObject` → `JsonSchema` everywhere (large refactor, cleaner name)
- **C)** Make `JsonSchema` a type alias: `type JsonSchema = SchemaObject`
- **D)** Keep both, document that `JsonSchema` is the public API and `SchemaObject` is internal

I lean toward **A** (delete the duplicate, export what already works) but this makes the "cross-emitter shared module" look thin. **B** is cleaner naming but touches ~30 files.

### 2. Should the `./shared` package subpath export exist at all?

The `"./shared"` export in `package.json` gives external packages access to `generateSchemas`, `extractValue`, `intrinsicToSchema`, and `AsyncAPISchemaEmitter`. But:

- No external consumer exists
- These exports leak TypeSpec asset-emitter internals (`EmitEntity`, `TypeEmitter`)
- A real cross-emitter API would need a stable interface, not raw implementation exports

Should I:

- **A)** Keep it as-is (aspirational, early access)
- **B)** Remove the subpath, keep types exported from main entry point only
- **C)** Design a proper `SchemaGenerator` interface that abstracts away TypeSpec internals

### 3. Is the `split-schemas` option the right API, or should it be a separate tool?

The `split-schemas: boolean` emitter option splits the AsyncAPI document into multiple files at emission time. But:

- The AsyncAPI specification expects a single document
- Tools like `@asyncapi/generator` may not handle multi-file input
- Post-processing tools exist for splitting (e.g., `@redocly/cli`)

Should `split-schemas`:

- **A)** Stay as an emitter option (convenient, single-step)
- **B)** Become a separate post-processing CLI tool
- **C)** Support a callback/hook so users control the splitting strategy

---

## Session Summary

**Started:** 646 tests, 61 files (blocked on Task 24 build error)
**Ended:** 679 tests, 64 files (all 26 Pareto tasks complete)
**Net gain:** +33 tests, +3 test files, +7 source files, 0 files over 370 lines

**What went well:**

- Build error diagnosed and fixed in 1 attempt (`"types": ["node"]`)
- Schema splitter bug (nested `$ref` in extracted files) caught by test, fixed immediately
- Refactoring brought both oversized files under the 370-line limit with zero regressions
- Benchmark results are encouraging: 200 channels compiles in ~75ms with sub-linear scaling

**What went poorly:**

- Created a split-brain type system (`JsonSchema` vs `SchemaObject`)
- Over-fragmented the codebase (7 new files, several under 50 lines)
- Task 25 is architecturally aspirational but practically hollow
- Dead code shipped (`generateFixtureMultiFile`)
- No unit tests for newly extracted modules
