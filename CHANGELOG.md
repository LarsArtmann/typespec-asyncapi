# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0-alpha] - 2026-07-14

First alpha release. Full Pareto recovery from analysis paralysis.

### Added

- Nested model `$ref`: named user models/enums/scalars use `$ref: "#/components/schemas/Name"` instead of inlining
- Channel parameters: `{var}` expressions in channel addresses emit `parameters` objects
- Server variables: `{var}` expressions in server hosts emit `variables` objects
- `EmitterOptions` model in `lib/main.tsp` for IDE autocomplete
- Decorator output tests (`test/integration/decorator-output.test.ts` — 8 tests)
- Negative tests (`test/integration/negative-tests.test.ts` — 6 tests)
- Architecture Decision Record: `docs/adr/0001-use-asset-emitter-not-alloy.md`
- Domain Language glossary: `docs/DOMAIN_LANGUAGE.md`
- Roadmap: `ROADMAP.md` with near/mid/long-term vision
- Working examples: `examples/simple/`, `examples/kafka/`, `examples/multi-channel/`
- GitHub Actions CI: clean build + lint + test workflow

### Changed

- Version bumped from `0.0.1` to `0.1.0-alpha`
- Zero `any` types in `emitter.ts` (was 36 explicit `any`)
- `extractValue` uses discriminated union narrowing on `EmitEntity.kind` instead of unsafe casts
- `collectAllStdlibNames` uses `program.getGlobalNamespaceType()` instead of `as any` cast
- `lib.ts` trimmed from 273 to 90 lines — removed dead diagnostics, dead state entries, excessive JSDoc
- `options.ts` simplified from 244 to 4 lines (pure re-export) — all AJV validation removed
- ESLint config rewritten — removed Effect.TS rules that banned throw/try/catch/Promise
- All Effect.TS imports removed from test files
- `@tags`, `@correlationId`, `@header`, `@bindings` now applied to ALL registered messages

### Removed

- Dependencies: `@alloy-js/core`, `@effect/schema`, `@typespec/emitter-framework`, `@typespec/rest`, `asyncapi-validator`, `@types/js-yaml`, `@typespec/versioning`
- `effect`, `vitest`, `@vitest/coverage-v8` from devDependencies (nothing imports them)
- `vitest.config.ts` (tests use `bun:test`)
- 417 stale docs archived to `docs/_archive/`
- Dead test helpers: `clean-test-helper.ts`, `library-test-helper.ts`, `simple-test-helper.ts`, `emitter-test-helpers.ts`
- Dead test files: `options.test.ts`, `security-validation.test.ts`, `options-integration.test.ts`
- 9 dead loose test scripts (non-`.test.ts` files)
- `scripts/` directory (13 dead files)
- `test/fixtures/`, `test/scratch/`, dead `.tsp` files in `test/`
- 14 loose `.tsp` files in `examples/`
- Dead config: `.effect-arch-lint.yml`, `test-baselines.json`, `test-regression-baselines.json`, `test-metrics-history.json`
- 3 bloated GitHub Actions workflows replaced by single clean workflow

### Fixed

- `compileAsyncAPI` test helper now extracts actual output filename from virtual FS instead of hardcoding "asyncapi.yaml"
- `clean:test` script uses `trash` instead of `rm`
- All 5 lint warnings resolved (0 errors, 0 warnings)

## [Unreleased]

### Added

- Spec-compliant `$ref` chain: operations → channels → components.messages → components.schemas
- Strongly-typed AsyncAPI 3.0 document model (`src/domain/models/asyncapi-document.ts`)
- Golden file test (`test/golden/golden-file.test.ts`) locking in verified-correct output
- AsyncAPI 3.0.0 JSON Schema validation tests using `@asyncapi/specs`
- `@tags` decorator data now emitted as `Tag[]` arrays on operations
- `@correlationId` decorator data now emitted as `CorrelationId` objects on messages
- `@header` decorator data now emitted as JSON Schema `headers` on messages
- `@bindings` decorator data now emitted on operations and messages
- `protocolBindings` added to consolidated state for emitter access
- Post-mortem analysis at `docs/POST-MORTEM-AND-RECOVERY-PLAN.md`

### Fixed

- Critical: operations referenced `#/components/messages/{id}` directly instead of the spec-required `#/channels/{channelId}/messages/{messageId}` path
- Critical: message names used operation names instead of model names, causing broken payload `$ref`s
- All 8 failing tests that spawned `npx tsp compile` (replaced with programmatic TypeSpec compiler API)
- `storeTags` data model: was storing as comma-separated string, now stores as proper `Tag[]`
- CONTRIBUTING.md referenced `just` commands that don't exist (now `bun run`)

### Changed

- Emitter uses strongly-typed interfaces (`AsyncAPIDocument`, `ChannelObject`, etc.) instead of `Record<string, unknown>`
- AGENTS.md rewritten with verified facts and spec-compliance rules
- CLI test helper rewritten from 336 lines of spawn/fs code to 68-line programmatic API wrapper
