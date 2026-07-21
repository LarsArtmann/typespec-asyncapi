# Open GitHub Issues — Comprehensive Review

**Date:** 2026-07-21
**Reviewer:** Crush (automated, evidence-based)
**Scope:** All 48 open issues, including every comment
**Method:** Read each issue body + all comments, then cross-referenced every claim against the **current** codebase (build, tests, lint, source files, config).

---

## TL;DR

**37 of 48 open issues (77%) are obsolete or already done.** The project went through a major architecture simplification — **Effect.TS and the entire plugin/DocumentBuilder/performance-dashboard stack were removed** — but the issue tracker was never cleaned up afterwards. As a result, most open issues reference files and architecture that **no longer exist**.

| Category                                                         | Count | Action           |
| ---------------------------------------------------------------- | ----- | ---------------- |
| **OBSOLETE** — references removed Effect.TS/old architecture     | 13    | Close            |
| **ALREADY DONE** — verified implemented in current code          | 13    | Close            |
| **STALE / LOW-VALUE** — premise invalidated by rewrite, or YAGNI | 11    | Close (or defer) |
| **GENUINELY RELEVANT** — real feature/RFC gaps                   | 11    | Keep             |

### Evidence the tracker is stale

| Claim still open in issues                                                                                                                                                           | Reality in `master` today                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Effect.TS used throughout                                                                                                                                                            | **0** `effect` imports in `src/`, **0** in `package.json`                    |
| `src/emitter-with-effect.ts`, `src/types/branded-types.ts`, `src/utils/type-cache.ts`, `ValidationService.ts`, `ImmutableDocumentManager.ts`, `PluginRegistry.ts`, `dashboard.ts`, … | **All gone.** Current `src/` is 2,091 lines across 18 small files            |
| 284 TODO comments (#131)                                                                                                                                                             | **0** TODO/FIXME in `src/`                                                   |
| Test suite 32.43s, 775 tests, 66% pass (#133)                                                                                                                                        | **301 tests, 0 fail, ~9s**                                                   |
| Zero code-coverage visibility (#132)                                                                                                                                                 | `scripts/coverage-gate.ts` enforces **75% per-file**, runs in CI             |
| No CI (#36)                                                                                                                                                                          | `.github/workflows/ci.yml`: build + lint + test + coverage + example-compile |
| `@correlationId`/`@header`/`@bindings` missing (#218)                                                                                                                                | All three **FULLY_FUNCTIONAL** (`lib/main.tsp`)                              |
| Protocol enum incomplete (#227)                                                                                                                                                      | **19 protocols** incl. all the "missing" ones                                |
| Pre-commit ESLint blocks all commits (#241)                                                                                                                                          | ESLint **clean** (0 errors, 0 warnings)                                      |
| `@asyncapi/specs` security advisory (#245)                                                                                                                                           | Locked at **6.11.1** (last safe version)                                     |

---

## Category A — OBSOLETE (13 issues) — Close

These reference the removed Effect.TS / micro-kernel / plugin architecture. The files they cite no longer exist.

| #        | Title (short)                               | Why obsolete                                                                                                                                                                                           |
| -------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **#104** | Type safety roadmap                         | Cites `src/emitter-with-effect.ts`, 209-line `src/index.ts`, Effect imports. All gone. Zero-`any` goal met via different design.                                                                       |
| **#150** | Type cache clearing in AssetEmitter         | Cites `src/application/services/emitter-with-effect.ts` + `src/utils/type-cache.ts`. Both removed; no caching layer exists.                                                                            |
| **#154** | Effect runPromise→runSync                   | Pure Effect.TS issue. Effect.TS fully removed.                                                                                                                                                         |
| **#158** | Branded types across codebase               | Cites `src/types/branded-types.ts` (gone). Project chose typed interfaces in `asyncapi-document.ts` instead.                                                                                           |
| **#171** | Integrate @effect/schema                    | `@effect/schema` was a removed dep. Project uses AJV + official AsyncAPI JSON Schema (`test/validation/schema-validation.test.ts`).                                                                    |
| **#185** | Eliminate 24 JSCPD clones                   | All cited files (`emitter-with-effect.ts`, `ValidationService.ts`, `ImmutableDocumentManager.ts`, `CompilationError.ts`) are gone. Rewrite solved it.                                                  |
| **#197** | Performance dashboard integration           | Cites `src/infrastructure/performance/dashboard.ts` (gone) + DiscoveryService/ProcessingService (gone).                                                                                                |
| **#223** | Split files >300 lines                      | Cites `standardized-errors.ts (477)`, `ValidationService.ts (537)`, `effect-helpers.ts (536)`, `PluginRegistry.ts (509)` — **all gone**. Largest current file: `document-builder.ts` at **365 lines**. |
| **#226** | Value objects (branded types) Phase 2       | Same branded-types.ts approach, removed. Superseded by `SecuritySchemeType` / `OAuth2Flows` / `ProtocolBindings` typed model.                                                                          |
| **#231** | DDD architecture for production             | Cites Effect.TS pipelines, plugin registry, performance monitoring. All removed. Goal met via clean 4-module emitter.                                                                                  |
| **#235** | Strongly-typed decorator params             | Body is actually a milestone-org plan referencing closed #234. Decorators now use `{} \| valueof Record<unknown>`; zero `any` in emitter.                                                              |
| **#241** | Pre-commit ESLint template-literal failures | ESLint now clean; pre-commit uses `bun`. The `restrict-template-expressions` failures were resolved by rewrite.                                                                                        |
| **#244** | Effect.TS performance optimization          | Literally about Effect.TS patterns (lazy eval, `Effect.gen`). Effect.TS removed.                                                                                                                       |

---

## Category B — ALREADY DONE (13 issues) — Close

Verified implemented in the current codebase.

| #        | Title (short)                                       | Evidence of completion                                                                                                                                                               |
| -------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **#36**  | CI/CD GitHub Actions                                | `.github/workflows/ci.yml` — build+lint+test+coverage+example compile.                                                                                                               |
| **#74**  | Ship source maps in production                      | `tsconfig.json` has `sourceMap:true`; **20 `.js.map` files** generated in `dist/`; `package.json` `files` includes `dist/`. Maps ship.                                               |
| **#82**  | Extract DocumentBuilder interface                   | **Done:** `src/document-builder.ts` (365 lines) with `buildAsyncAPIDocument()`, split from the old monolith.                                                                         |
| **#132** | Code coverage reporting                             | `scripts/coverage-gate.ts` (75% per-file); `test:coverage:gate` script; CI runs it.                                                                                                  |
| **#133** | Test perf 32.43s                                    | Now **301 tests in ~9s** (Effect.TS removal fixed it).                                                                                                                               |
| **#134** | Split-brain test metrics                            | ValidationResult split brain fixed (its own latest comment); metrics subsystem removed.                                                                                              |
| **#135** | Test quality gates in CI/CD                         | Coverage gate shipped in CI. Ghost-test problem eliminated by rewrite (301 real tests).                                                                                              |
| **#214** | Test framework npx/tsp CLI deps                     | Tests now use programmatic `compileAndDiagnose()` via `test/utils/test-helpers.ts` — no process spawning. Latest comment: "FULLY RESOLVED".                                          |
| **#218** | Missing decorators @correlationId/@header/@bindings | All three **FULLY_FUNCTIONAL** in `lib/main.tsp` + `FEATURES.md`.                                                                                                                    |
| **#222** | Fix doc-example test timeouts                       | The cited `test/documentation/*.test.ts` files no longer exist; rewrite removed them.                                                                                                |
| **#227** | Complete protocol enum                              | `src/constants/protocols.ts` has **19 protocols** incl. mqtt, mqtt5, nats, redis, sns, sqs, pulsar.                                                                                  |
| **#34**  | Test coverage >80%                                  | Mechanism delivered (75% gate). Original "ZERO visibility" premise resolved; 75→80 is a tuning knob, not the filed ask.                                                              |
| **#245** | Security advisory (Miasma RAT)                      | `@asyncapi/specs@6.11.1` (last safe version) locked in `bun.lock`. Malicious 6.11.2 not present. _(Optional follow-up: tighten `^6.11.1`→`~6.11.1` in `package.json` per advisory.)_ |

---

## Category C — STALE / LOW-VALUE (11 issues) — Close or defer

Premise invalidated by the rewrite, or nice-to-have that doesn't justify an open issue for a pre-alpha emitter.

| #        | Title (short)                        | Recommendation                                                                                                                                                      |
| -------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **#30**  | BDD/TDD comprehensive strategy       | **Close** — superseded by #243 and by 301 existing tests (integration/e2e/bdd).                                                                                     |
| **#94**  | Real code-quality metrics validation | **Close** — meta-issue debating jscpd/test-count metrics that the rewrite moots.                                                                                    |
| **#131** | Convert 284 TODOs to issues          | **Close** — **0 TODOs** now remain in `src/`.                                                                                                                       |
| **#136** | Type caching 50–70% speedup          | **Close** — cites removed `src/utils/type-cache.ts`; no perf problem (9s/301 tests).                                                                                |
| **#153** | Complete `lib/main.tsp` docs         | **Close/rescope** — "63 TODOs / incomplete decorators" premise is false (all 11 decorators implemented). JSDoc polish is ordinary maintenance, not a tracked issue. |
| **#160** | Bun test patterns (toHaveProperty)   | **Close** — tests pass (301/301); resolved during rewrite.                                                                                                          |
| **#167** | Performance benchmark suite          | **Close** — cites removed caching infra. No perf problem to benchmark against. Reopen if a perf regression ever appears.                                            |
| **#170** | Advanced decorator examples          | **Close** — `examples/` already has advanced/kafka/real-world/multi-channel/comprehensive-protocols dirs. More examples = ordinary docs work.                       |
| **#199** | Integration test implementations     | **Close** — `test/integration/` has 16 files; harness exists.                                                                                                       |
| **#242** | Structured logging                   | **Close** — premise ("console.log throughout emitter") is **false** (0 console calls in `src/`). A compiler emitter doesn't need a logger service.                  |
| **#243** | BDD + property-based testing         | **Rescope/close** — BDD half **done** (`test/bdd/` has a `.feature` file). Only property-based (fast-check) is new work; file that separately if wanted.            |

---

## Category D — GENUINELY RELEVANT (11 issues) — Keep

Real feature gaps / RFCs, not tied to removed architecture.

| #        | Title (short)                                 | Status                                                                                                | Priority                 |
| -------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------ |
| **#32**  | [RFC] Plugin extraction                       | Open RFC. Owner note: "TypeSpec Emitters are already kind of plugins." Long-term.                     | Low (v1.0+)              |
| **#42**  | Redis protocol binding                        | Not implemented.                                                                                      | Medium (roadmap v0.2.0)  |
| **#43**  | Google Cloud Pub/Sub binding                  | Not implemented.                                                                                      | Medium (roadmap v0.2.0)  |
| **#44**  | AWS SNS binding                               | Not implemented.                                                                                      | Medium (roadmap v0.2.0)  |
| **#54**  | Error type hierarchy                          | Revisit against current 2,091-line codebase — may be lighter than proposed.                           | Medium                   |
| **#58**  | File-system verification post-compile         | Useful for DX; CI now compiles examples so partially covered.                                         | Low                      |
| **#59**  | Emitter debug logging                         | Effect.log solution obsolete; a few `console.debug` calls could help. Current code has **0** logging. | Low                      |
| **#77**  | [RFC] Negative decorators (`@exclude`)        | Open RFC. Real design question.                                                                       | Low (backlog RFC)        |
| **#78**  | Multiple output files by default              | Not implemented. Debatable UX (opinionated default).                                                  | Low                      |
| **#163** | Versioning decorator (`@typespec/versioning`) | Not implemented. Enterprise feature.                                                                  | Medium (roadmap v0.2.0+) |
| **#229** | RFC 3986 URL validation                       | **Not implemented** (confirmed: no URL parsing in `src/`). Real validation gap.                       | Medium                   |

---

## Recommended next actions

1. **Bulk-close the 26 Category A + B issues** with a single canonical comment pointing to this review and explaining the Effect.TS removal. Closures are reversible (reopen) so this is safe.
2. **Re-scope or close the 11 Category C issues** individually (judgment calls).
3. **Re-label the 11 Category D keepers** — strip the stale `milestone:v0.1.1` / `milestone:v1.0.0` labels (those milestones describe the _old_ roadmap) and align them with the current `ROADMAP.md` (v0.2.0-beta: protocol bindings; v1.0.0: plugin architecture).
4. **Optional follow-ups surfaced by the review:**
   - Tighten `@asyncapi/specs` pin (`^6.11.1` → `~6.11.1`) per #245 advisory.
   - `tsconfig.json` still lists 4 exclude paths for files that no longer exist (`src/infrastructure/performance/*.ts`, `src/domain/emitter/AsyncAPIEmitter.ts`) — harmless but dead config worth removing.
   - `FEATURES.md` says "283 tests" while actual is **301**; `ROADMAP.md` near-term checklist items (channel params, server vars, nested `$ref`, `EmitterOptions`, CI, AJV) are **all done** and should be checked off.

---

## How this review was produced

- Fetched all 48 open issues (body + every comment) via `gh issue view`.
- Read project context: `AGENTS.md`, `FEATURES.md`, `TODO_LIST.md`, `ROADMAP.md`, `package.json`, recent commit history.
- Verified each issue's claims against the live codebase: `rg` for removed files/imports, `wc -l` on `src/`, TODO counts, protocol enum, decorator list, coverage gate, CI workflow, `tsconfig` source-map settings, lockfile security pin.
- Ran the full suite: `bun install` → `bun run build` (0 errors) → `bun run lint` (0 warnings) → `bun test` (**301 pass, 0 fail, ~9s**).
