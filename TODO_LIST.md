# TODO List — TypeSpec AsyncAPI Emitter

**Generated:** 2026-05-06 | **Status:** Comprehensive audit of all work needed

---

## Files Read for This TODO

- [x] All 29 source files in `src/`
- [x] All 11 decorator definitions in `lib/main.tsp`
- [x] `package.json`, `tsconfig.json`, `justfile`, `eslint.config.js`
- [x] `AGENTS.md`, `README.md`, `CONTRIBUTING.md`
- [x] `FEATURES.md` (just created)
- [x] `docs/ARCHITECTURE_REVIEW.md`, `docs/ARCHITECTURE_IMPROVEMENT.md` (just created)
- [x] `docs/CODE_QUALITY_REPORT.md` (just created)
- [x] Test results (100 tests, 88 failures)

---

## P0 — Build Must Pass (Blocking Everything)

- [ ] **T1:** Add `"node"` to `tsconfig.json` `types` array → fixes 7 errors
- [ ] **T2:** Add `"dom"` to `tsconfig.json` `lib` array → fixes `console.*` errors
- [ ] **T3:** Delete `src/emitter-alloy.tsx` — dead code with 15+ type errors
- [ ] **T4:** Delete `src/infrastructure/performance/PerformanceMonitor.ts` — excluded from build
- [ ] **T5:** Delete `src/infrastructure/performance/PerformanceRegressionTester.ts` — excluded from build
- [ ] **T6:** Delete `src/plugins/core/PluginSystem.ts` — skeleton, unused
- [ ] **T7:** Fix `src/utils/effect-helpers.ts:276` — `{ successes, errors }` should be `{ successes, failures }`
- [ ] **T8:** Fix ESLint: reinstall `@eslint/js` package or fix `eslint.config.js` imports

## P1 — Correctness & Security

- [ ] **T9:** Remove hard-coded `/Users/larsartmann/` paths from `src/constants/config.ts`
- [ ] **T10:** Fix tags storage: use `string[]` in `TagData` instead of comma-separated string
- [ ] **T11:** Remove 6 debug `Effect.log("🔍 EMITTER DEBUG:...")` lines from `src/emitter.ts`
- [ ] **T12:** Replace hand-rolled YAML in `src/emitter.ts` with `yaml` library (already a dependency)
- [ ] **T13:** Fix `src/emitter.ts` to respect `options["output-file"]` and `options["file-type"]`
- [ ] **T14:** Fix `src/emitter.ts` to include servers from state in generated output
- [ ] **T15:** Fix `src/emitter.ts` to include operations from state in generated output

## P2 — Architecture Cleanup

- [ ] **T16:** Consolidate 4 config files into single `src/infrastructure/config.ts`
  - Delete: `asyncAPIEmitterOptions.ts`, `options.ts`, `config.ts`
  - Create: unified types + defaults + validation
- [ ] **T17:** Unify state keys — remove `stateSymbols` from `lib.ts`, use TypeSpec's `$lib.state` system
  - Delete: `state-compatibility.ts`
  - Update: all decorator state access patterns
- [ ] **T18:** Split `minimal-decorators.ts` (611 lines) into domain modules:
  - `src/domain/decorators/channel.ts`
  - `src/domain/decorators/message.ts`
  - `src/domain/decorators/operation.ts`
  - `src/domain/decorators/server.ts`
  - `src/domain/decorators/protocol.ts`
  - `src/domain/decorators/security.ts`
  - `src/domain/decorators/tags.ts`
  - `src/domain/decorators/correlation.ts`
  - `src/domain/decorators/shared.ts`
- [ ] **T19:** Extract protocol handler strategy pattern from switch/case blocks
- [ ] **T20:** Clean excessive JSDoc/TODOs from `lib.ts` (reduce from 457 to <150 lines)

## P3 — Test Recovery

- [ ] **T21:** Delete `test/domain/disabled/` directory (duplicates of `test/domain/`)
- [ ] **T22:** Remove imports of deleted modules from failing tests
- [ ] **T23:** Fix `test/validation/end-to-end-validation.test.ts` — missing `domain/validation/asyncapi-validator`
- [ ] **T24:** Fix `test/validation/real-asyncapi-validation.test.ts` — missing `@asyncapi/parser`
- [ ] **T25:** Fix `test/unit/core/*.test.ts` — missing `effect` package in test context
- [ ] **T26:** Fix `test/unit/core/DocumentBuilder.test.ts` — missing `domain/emitter/DocumentBuilder`
- [ ] **T27:** Consolidate overlapping test helpers (4+ utility files → 1)
- [ ] **T28:** Remove stale debug test files (`debug-*.test.ts` — 12 files)

## P4 — BDD Tests (New)

- [ ] **T29:** BDD: "User defines a channel with @channel and gets valid AsyncAPI channel in output"
- [ ] **T30:** BDD: "User publishes a message with @publish and sees send operation in output"
- [ ] **T31:** BDD: "User configures server with @server and sees server in output"
- [ ] **T32:** BDD: "User adds Kafka protocol binding and sees Kafka-specific fields"
- [ ] **T33:** BDD: "User adds security scheme and sees securitySchemes in components"
- [ ] **T34:** BDD: "User defines model with @message and sees message in components"
- [ ] **T35:** BDD: "User adds @tags and sees tags array on message"

## P5 — Documentation Cleanup

- [ ] **T36:** Delete 200+ stale planning/status/report files in `docs/`
  - Keep: `docs/architecture/`, `docs/guides/`, `docs/map-typespec-to-asyncapi/`
  - Keep: `docs/architecture-understanding/` (new diagrams)
  - Delete: `docs/planning/`, `docs/status/`, `docs/sessions/`, `docs/reports/`
- [ ] **T37:** Update `README.md` to reflect actual current state
- [ ] **T38:** Update `AGENTS.md` with accurate project status
- [ ] **T39:** Delete `archive/` directory entirely

## P6 — Future (Not Now)

- [ ] Implement JSON output format
- [ ] Implement recursive model resolution >1 level deep
- [ ] Implement proper AssetEmitter integration with `@typespec/asset-emitter`
- [ ] Implement operational plugin system
- [ ] Support `@typespec/versioning` decorators
- [ ] Add cloud provider bindings (AWS SNS/SQS, Google Pub/Sub)
- [ ] Add AsyncAPI spec validation against JSON Schema
- [ ] Performance benchmarks for large schemas

---

## Verification Status

| Item | Verified Against Code | Status |
|------|:--------------------:|--------|
| T1-T8 | tsconfig.json, build output | Confirmed |
| T9 | config.ts:16,17,43 | Confirmed |
| T10 | minimal-decorators.ts:449,452 | Confirmed |
| T11 | emitter.ts:139-189 | Confirmed |
| T12 | emitter.ts:90-127 | Confirmed |
| T13 | emitter.ts:167 | Confirmed |
| T14 | emitter.ts:46-56 | Confirmed |
| T15 | emitter.ts:72-84 | Confirmed |
| T16-T20 | All source files read | Confirmed |
| T21-T28 | Test output analyzed | Confirmed |
