# TODO List

**Verified:** 2026-07-14 against actual code state

---

## P0 — Spec Compliance Gaps

- [ ] **T1:** Emit channel `parameters` when address contains `{var}` expressions (spec requires this)
- [ ] **T2:** Add `variables` support to `@server` decorator (spec supports `{env}` in host)
- [ ] **T3:** Wire output validation in `$onEmit` itself — emit diagnostics on invalid output, not just test-side
- [ ] **T4:** Use `$ref` for nested model references instead of full inlining

## P1 — Type Safety

- [ ] **T5:** Remove all `any` from `AsyncAPISchemaEmitter` methods (`src/emitter.ts:47,80,107`)
- [ ] **T6:** Make `ProtocolConfigData` a discriminated union by protocol type
- [ ] **T7:** Remove unsafe `as` type assertions from state consolidation code

## P2 — Code Cleanup

- [ ] **T8:** Remove dead dependencies: `@alloy-js/core`, `@effect/schema`, `@effect/eslint-plugin`
- [ ] **T9:** Remove dead emitter options that are accepted but ignored (see FEATURES.md)
- [ ] **T10:** Simplify `src/infrastructure/configuration/options.ts` (remove 150-line schema validation never used at runtime)
- [ ] **T11:** Remove `Effect.TS` imports from all test files (replace `Effect.log` with nothing or `console.log`)
- [ ] **T12:** Consolidate 6+ overlapping test helper files in `test/utils/` into 2
- [ ] **T13:** Remove debug `console.log` spam from test files

## P3 — Documentation

- [ ] **T14:** Archive 400+ stale planning/status docs into `docs/_archive/`
- [ ] **T15:** Fix 3 key examples to compile and produce correct output
- [ ] **T16:** Add `tspconfig.yaml` to each example
- [ ] **T17:** Add `EmitterOptions` model to `lib/main.tsp` for IDE autocomplete

## P4 — Release

- [ ] **T18:** Tag `v0.1.0-alpha`
- [ ] **T19:** Verify `npm publish --dry-run` works
- [ ] **T20:** Add GitHub Actions CI workflow
