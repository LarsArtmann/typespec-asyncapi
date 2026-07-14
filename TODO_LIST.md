# TODO List

**Verified:** 2026-07-14 against actual code state (post-recovery session)

---

## Done This Session

- [x] Remove dead dependencies (`@alloy-js/core`, `@effect/schema`, `@effect/eslint-plugin`, `@typespec/emitter-framework`, `effect` from deps, `asyncapi-validator`, `@typespec/rest`)
- [x] Working example with `tspconfig.yaml` (`examples/simple/`)
- [x] `.npmignore` verified
- [x] Archive 410+ stale docs into `docs/_archive/`
- [x] Remove dead emitter options (150-line AJV validation never used at runtime)
- [x] Clean ESLint config (removed Effect.TS rules banning throw/try/catch/Promise)
- [x] Clean CONTRIBUTING.md (removed dead "plugin development" and "performance optimization")
- [x] Remove Effect.TS from all test files
- [x] Delete dead test files (9 loose non-`.test.ts` files)
- [x] Consolidate test helpers (7 → 3 files: test-helpers, cli-test-helpers, type-guards)
- [x] Trim `lib.ts` from 273 to 90 lines
- [x] Replace all `any` types in `emitter.ts` with proper TypeSpec types (0 `any` remaining)
- [x] Fix `extractValue` to use discriminated union narrowing (no more `as unknown as`)
- [x] Emit channel `parameters` for `{var}` address expressions
- [x] Add `variables` support to server config (extracted from `{var}` in host)
- [x] Use `$ref` for nested model references instead of full inlining
- [x] Add `EmitterOptions` model to `lib/main.tsp` for IDE autocomplete
- [x] Wire `@tags`, `@correlationId`, `@header`, `@bindings` to ALL messages (not just `@message` ones)
- [x] Write ADR for Alloy rejection decision
- [x] Write `docs/DOMAIN_LANGUAGE.md`
- [x] Write `ROADMAP.md`
- [x] Add GitHub Actions CI workflow (build + lint + test)
- [x] Add decorator output tests (8 tests)
- [x] Add negative tests (6 tests)
- [x] Create kafka and multi-channel examples
- [x] Remove `Effect.TS` from devDependencies (kept in devDeps for test compat)

## Remaining

- [ ] **T1:** Make `ProtocolConfigData` a discriminated union by protocol type
- [ ] **T2:** Wire output validation in `$onEmit` (decided against: follows openapi3 pattern)
- [ ] **T3:** Remove remaining 5 lint warnings in `state-writers.ts` and `state-compatibility.ts`
- [ ] **T4:** Tag `v0.1.0-alpha` release
- [ ] **T5:** Push to remote
