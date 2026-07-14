# TypeSpec AsyncAPI Emitter — Deep Architecture Cleanup & Type Safety Plan

**Date:** 2026-05-16 23:37  
**Scope:** Delete 40% of src/, fix every split brain, make illegal states unrepresentable  
**Current State:** 255 pass / 120 fail | 3,726 LOC src | 2,249 LOC test helpers

---

## Pareto Analysis

### The 1% that delivers 51% of the result

**Delete dead code.** 733 lines (20% of src/) are files with zero production usage. Deleting them removes confusion, reduces maintenance burden, and makes the real architecture visible.

### The 4% that delivers 64% of the result

**Consolidate split brains.** Three protocol lists, three config objects, three state key systems, two diagnostic systems. Each is a source of bugs where one copy gets updated and the others don't.

### The 20% that delivers 80% of the result

**Replace string-concat emitter with TypeEmitter from `@typespec/asset-emitter`.** This auto-generates schemas from TypeSpec models, fixing 80+ tests and producing real AsyncAPI output instead of empty shells.

---

## Execution Graph

```mermaid
graph TD
    subgraph Phase 1["Phase 1: DELETE (1% → 51%)"]
        D1["T1: Delete 4 dead domain files<br>path-templates, validation-result<br>serialization-format, domain/decorators/*"] --> D2["T2: Delete 3 dead infra files<br>PluginSystem, PerformanceMonitor<br>PerformanceRegressionTester"]
        D2 --> D3["T3: Delete dead error classes<br>standardized-errors.ts"]
        D3 --> D4["T4: Delete empty barrel files<br>shared/index, protocols/index"]
        D4 --> D5["T5: Delete dead code inside living files<br>effect-helpers (200 LOC), logger (40 LOC)<br>constants/paths (140 LOC), constants/version (70 LOC)"]
    end

    subgraph Phase 2["Phase 2: CONSOLIDATE (4% → 64%)"]
        C1["T6: Single protocol source of truth<br>SUPPORTED_PROTOCOLS as ReadonlySet"] --> C2["T7: Single config source of truth<br>DELETE config.ts, constants/index.ts<br>Keep only options.ts"]
        C2 --> C3["T8: Single state key system<br>Delete stateKeys strings, keep stateSymbols"]
        C3 --> C4["T9: Single diagnostic reporter<br>Delete reportDiagnostic from lib.ts<br>Keep reportDecoratorDiagnostic, rename"]
    end

    subgraph Phase 3["Phase 3: TYPE SAFETY"]
        T1["T10: AsyncAPI document type<br>branded types for channels, schemas, operations"] --> T2["T11: Decorator config types<br>replace unknown with tagged unions"]
        T2 --> T3["T12: EmitterOptions cleanup<br>remove Effect.TS, boolean→enum<br>delete ASYNC_API_EMITTER_OPTIONS_SCHEMA"]
    end

    subgraph Phase 4["Phase 4: EMITTER"]
        E1["T13: TypeEmitter subclass<br>visitModel → schema, visitOperation → channel"] --> E2["T14: Proper YAML/JSON output<br>use yaml library, real JSON generation"]
        E2 --> E3["T15: Wire security, servers, tags<br>into document generation"]
    end

    subgraph Phase 5["Phase 5: TEST INFRA"]
        F1["T16: Rewrite test-helpers.ts<br>1339 → ~200 LOC, single API"] --> F2["T17: Delete redundant test helpers<br>cli-test-helpers, clean-test-helper<br>library-test-helper, simple-test-helper"]
        F2 --> F3["T18: Fix broken test data<br>OAuth2 colon syntax, wrong filenames"]
    end

    Phase 1 --> Phase 2
    Phase 2 --> Phase 3
    Phase 3 --> Phase 4
    Phase 4 --> Phase 5
```

---

## Task Breakdown — Phase 1: DELETE (Est. 2h total)

| #   | Task                                      | Files                                                                                                                          | LOC Removed | Est. | Impact                                  |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------- | ---- | --------------------------------------- |
| T1  | Delete dead domain model files            | `src/domain/models/path-templates.ts`, `validation-result.ts`, `serialization-format-option.ts`                                | -284        | 10m  | Removes 3 files with zero callers       |
| T2  | Delete dead domain decorator files        | `src/domain/decorators/channel.ts`, `server.ts`, `index.ts`                                                                    | -64         | 10m  | Removes unnecessary indirection         |
| T3  | Delete dead infrastructure files          | `src/plugins/core/PluginSystem.ts`, `PerformanceMonitor.ts`, `PerformanceRegressionTester.ts`                                  | -216        | 10m  | Zero production usage                   |
| T4  | Delete dead error classes                 | `src/utils/standardized-errors.ts`                                                                                             | -145        | 5m   | 5 error classes, zero throws            |
| T5  | Delete empty barrel files                 | `src/shared/index.ts`, `src/protocols/index.ts`                                                                                | -14         | 5m   | Empty exports                           |
| T6  | Strip dead code from effect-helpers       | Remove `railwayErrorRecovery`, `retryWithBackoff`, `separateEitherResults`, `effectUtils.*` from `src/utils/effect-helpers.ts` | -200        | 15m  | 200 LOC of unused Effect patterns       |
| T7  | Strip dead code from constants/paths      | Remove `pathValidation`, `pathTransformation`, branded types, `FILE_EXTENSIONS`, `FILE_PATTERNS`                               | -140        | 15m  | Zero callers                            |
| T8  | Strip dead code from constants/version    | Remove `parseVersion`, `compareVersions`, `getCompatibilityInfo`, `BUILD_INFO`, fix `LIBRARY_VERSION`                          | -70         | 10m  | Stale version strings                   |
| T9  | Strip dead code from lib.ts               | Remove `stateKeys` (duplicate of `stateSymbols`), remove 31 TODO comments, remove `reportDiagnostic` (unused)                  | -80         | 15m  | Clarity                                 |
| T10 | Remove Effect.TS from options             | Replace `Effect.Effect` return types with plain values in `options.ts`                                                         | -30         | 20m  | Removes Effect dependency from hot path |
| T11 | Delete `ASYNC_API_EMITTER_OPTIONS_SCHEMA` | 148-line JSON Schema object never used for validation                                                                          | -148        | 5m   | Dead weight                             |
| T12 | Delete suspicious package.json deps       | Remove `@xmpp/sasl`, `openid-client`, `passport-oauth2`, `@types/passport-oauth2`                                              | -4 lines    | 5m   | Not used anywhere                       |

**Phase 1 Total: ~1,395 LOC removed, 12 tasks, ~2h**

---

## Task Breakdown — Phase 2: CONSOLIDATE (Est. 2.5h total)

| #   | Task                                           | Description                                                                                                                                                                                           | Est. | Impact                           |
| --- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | -------------------------------- |
| T13 | **Single protocol source of truth**            | Create `src/constants/protocols.ts` with `SUPPORTED_PROTOCOLS` as `ReadonlySet`. Delete protocol lists from `minimal-decorators.ts`, `protocol-defaults.ts`, `options.ts`. All import from one place. | 25m  | Eliminates 4-list split brain    |
| T14 | **Delete `config.ts`**                         | Merge useful parts (title, description defaults) into `options.ts` `DEFAULT_OPTIONS`. Delete `DEFAULT_CONFIGURATION`, `DEFAULT_SERVER_OPTIONS`, `configurationUtils`, hardcoded paths.                | 20m  | Eliminates config split brain    |
| T15 | **Consolidate `constants/index.ts`**           | Delete `DEFAULT_CONFIG` (duplicate of `DEFAULT_OPTIONS`), `PROTOCOL_DEFAULTS` (now in protocols.ts), `BINDING_DEFAULTS`, `ASYNCAPI_VERSIONS`. Keep only re-exports from version.ts and protocols.ts.  | 20m  | Single config source             |
| T16 | **Delete `stateKeys` from lib.ts**             | Remove the string-key state system. Keep only `stateSymbols` (Symbols are the actual production path). Update any stray imports.                                                                      | 15m  | Eliminates state key split brain |
| T17 | **Consolidate diagnostic reporting**           | Rename `reportDecoratorDiagnostic` → `emitDiagnostic`. Delete unused `reportDiagnostic` from lib.ts. Single diagnostic path.                                                                          | 15m  | Clarity                          |
| T18 | **Remove Effect.TS from remaining files**      | Replace `Effect.log` with nothing (remove ~70 fire-and-forget calls in test-helpers). Remove `Effect.gen`/`Effect.fail`/`Effect.succeed` from options.ts. Remove Effect import from logger.ts.        | 30m  | Removes Effect.TS from project   |
| T19 | **Fix `state-compatibility.ts` silent errors** | Replace `return new Map()` with `throw new Error(...)` on 3 failure paths. Callers should handle missing state explicitly.                                                                            | 10m  | Stops hiding bugs                |

**Phase 2 Total: ~7 tasks, ~2.5h**

---

## Task Breakdown — Phase 3: TYPE SAFETY (Est. 3h total)

| #   | Task                                  | Description                                                                                                                                                                                                                               | Est.                                                 | Impact                               |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------ | --- | ------------ |
| T20 | **AsyncAPI document branded types**   | Create `src/types/asyncapi-document.ts` with proper types for `AsyncAPIDocument`, `ChannelObject`, `OperationObject`, `SchemaObject`, `ServerObject`, `SecuritySchemeObject`. Replace all `Record<string, unknown>` in emitter and state. | 45m                                                  | Makes illegal states unrepresentable |
| T21 | **Decorator config tagged unions**    | Replace `unknown` params in `$message`, `$protocol`, `$security`, `$bindings` with proper discriminated unions: `{ source: "model", model: Model }                                                                                        | { source: "value", value: Record<string, string> }`. | 30m                                  | Type-safe decorator handling |
| T22 | **Fix `AsyncAPIEmitterOptions` type** | Remove `extends EmitFileOptions` (unused). Remove duplicate `version` / `asyncapi-version` keys. Replace booleans with enums: `debug?: "none"                                                                                             | "basic"                                              | "verbose"`, `validation?: "off"      | "warn"                       | "strict"`. Remove `"omit-unreachable-types"`, `"include-source-info"`, `"validate-spec"` (all unused). | 25m | Honest types |
| T23 | **Fix `state.ts` types**              | Replace `[key: string]: unknown` on `ProtocolConfigData` with proper typed fields. Replace `Record<string, unknown>` on `SecurityConfigData.scheme` with `SecuritySchemeObject`. Remove `unwrapStateMap` (duplicate of `getStateMap`).    | 25m                                                  | Type-safe state                      |
| T24 | **Fix `emitter.ts` type safety**      | Replace all `as` casts with proper type guards. Add try/catch in `$onEmit`. Use `ASYNCAPI_VERSION` constant instead of hardcoded `"3.0.0"`. Use proper YAML library for output instead of template literals.                              | 30m                                                  | No more runtime crashes              |

**Phase 3 Total: ~5 tasks, ~3h**

---

## Task Breakdown — Phase 4: EMITTER (Est. 4h total)

| #   | Task                                          | Description                                                                                                                                                                                                                                  | Est. | Impact          |
| --- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | --------------- |
| T25 | **Create `AsyncAPITypeEmitter` class**        | Extend `TypeEmitter` from `@typespec/asset-emitter`. Implement `visitModel` → AsyncAPI Schema Object, `visitOperation` → Channel + Operation, `writeOutput` → assemble document. ~150 lines replaces current 155-line string-concat emitter. | 60m  | Fixes 80+ tests |
| T26 | **Implement `components.schemas` generation** | Walk model properties via TypeEmitter visitors. Handle: string, int32, float, boolean, arrays, enums, union types, optional fields, nested models, recursive references. Generate proper JSON Schema objects.                                | 60m  | Core feature    |
| T27 | **Implement `operations` section**            | Generate publish/subscribe operations with channel refs, message refs, summary from `@doc`. Read from `@channel`, `@publish`, `@subscribe` state.                                                                                            | 30m  | +20 tests       |
| T28 | **Implement `servers` section**               | Generate server objects from `@server` decorator state. Include url, protocol, description, protocol-version, variables.                                                                                                                     | 20m  | +5 tests        |
| T29 | **Implement `security` in output**            | Include `securitySchemes` in `components` from `@security` state. Include `security` refs on operations.                                                                                                                                     | 20m  | +10 tests       |
| T30 | **Generate proper JSON output**               | When `file-type: "json"`, serialize to JSON (not YAML with .json extension).                                                                                                                                                                 | 10m  | +2 tests        |

**Phase 4 Total: ~6 tasks, ~4h**

---

## Task Breakdown — Phase 5: TEST INFRA (Est. 2h total)

| #   | Task                                   | Description                                                                                                                                                                                                                                 | Est. | Impact          |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | --------------- |
| T31 | **Rewrite `test-helpers.ts`**          | Split 1,339-line monolith into 3 files: `test-helpers-compile.ts` (~80 LOC), `test-helpers-assert.ts` (~60 LOC), `test-helpers-sources.ts` (~60 LOC). Single `createTester`-based API. Remove all `Effect.log`, `console.log` debug output. | 60m  | Maintainability |
| T32 | **Delete redundant test helper files** | `cli-test-helpers.ts` (322 LOC), `clean-test-helper.ts` (56 LOC), `library-test-helper.ts` (29 LOC), `simple-test-helper.ts` (21 LOC), `type-guards.ts` (374 LOC). Consolidate into new helpers.                                            | 30m  | -800 LOC        |
| T33 | **Fix OAuth2 test syntax**             | In `test/domain/security-comprehensive.test.ts`, replace `"api:read": "API read"` with `apiRead: "API read"` or use array syntax. 21 tests.                                                                                                 | 20m  | +21 tests       |
| T34 | **Migrate tests to new helpers**       | Update all test files to import from new helper structure. Verify all 255 passing tests still pass.                                                                                                                                         | 30m  | Clean migration |

**Phase 5 Total: ~4 tasks, ~2h**

---

## Summary Statistics

| Phase                | Tasks  | Est. Time | LOC Impact     | Tests Fixed |
| -------------------- | ------ | --------- | -------------- | ----------- |
| Phase 1: DELETE      | 12     | 2h        | **-1,395**     | 0           |
| Phase 2: CONSOLIDATE | 7      | 2.5h      | **-200**       | 0           |
| Phase 3: TYPE SAFETY | 5      | 3h        | **+50/-100**   | 0           |
| Phase 4: EMITTER     | 6      | 4h        | **+150/-155**  | **+120**    |
| Phase 5: TEST INFRA  | 4      | 2h        | **-800**       | **+21**     |
| **TOTAL**            | **34** | **13.5h** | **-2,350 net** | **+141**    |

**Target: 396 pass / ~10 fail / 68 files** (from current 255 pass / 120 fail)

---

## Sub-Task Breakdown (Max 15min each, 50-125 tasks)

### Phase 1 Sub-tasks

| #   | Task                                                                   | Est. |
| --- | ---------------------------------------------------------------------- | ---- |
| S1  | Delete `src/domain/models/path-templates.ts`                           | 5m   |
| S2  | Delete `src/domain/models/validation-result.ts`                        | 5m   |
| S3  | Delete `src/domain/models/serialization-format-option.ts`              | 5m   |
| S4  | Delete `src/domain/decorators/channel.ts`                              | 5m   |
| S5  | Delete `src/domain/decorators/server.ts`                               | 5m   |
| S6  | Delete `src/domain/decorators/index.ts`                                | 5m   |
| S7  | Delete `src/plugins/core/PluginSystem.ts`                              | 5m   |
| S8  | Delete `src/infrastructure/performance/PerformanceMonitor.ts`          | 5m   |
| S9  | Delete `src/infrastructure/performance/PerformanceRegressionTester.ts` | 5m   |
| S10 | Delete `src/utils/standardized-errors.ts`                              | 5m   |
| S11 | Delete `src/shared/index.ts`                                           | 5m   |
| S12 | Delete `src/protocols/index.ts`                                        | 5m   |
| S13 | Strip unused functions from `effect-helpers.ts`                        | 15m  |
| S14 | Strip dead path code from `constants/paths.ts`                         | 15m  |
| S15 | Strip dead version code from `constants/version.ts`                    | 10m  |
| S16 | Remove `stateKeys` and dead code from `lib.ts`                         | 15m  |
| S17 | Remove Effect return types from `options.ts`                           | 15m  |
| S18 | Delete `ASYNC_API_EMITTER_OPTIONS_SCHEMA` from `options.ts`            | 5m   |
| S19 | Remove suspicious deps from `package.json`                             | 5m   |
| S20 | Build and verify 0 TS errors after deletions                           | 10m  |

### Phase 2 Sub-tasks

| #   | Task                                                                       | Est. |
| --- | -------------------------------------------------------------------------- | ---- |
| S21 | Create `src/constants/protocols.ts` with `SUPPORTED_PROTOCOLS` ReadonlySet | 15m  |
| S22 | Update `minimal-decorators.ts` to import from protocols.ts                 | 10m  |
| S23 | Update `options.ts` to import from protocols.ts                            | 10m  |
| S24 | Delete `src/constants/protocol-defaults.ts`                                | 5m   |
| S25 | Merge config.ts useful parts into options.ts DEFAULT_OPTIONS               | 15m  |
| S26 | Delete `src/constants/config.ts`                                           | 5m   |
| S27 | Strip `constants/index.ts` to thin re-exports                              | 10m  |
| S28 | Consolidate diagnostic reporting (rename, delete duplicate)                | 15m  |
| S29 | Remove all Effect.log from test-helpers.ts                                 | 15m  |
| S30 | Remove Effect imports from logger.ts, strip dead code                      | 10m  |
| S31 | Fix `state-compatibility.ts` error handling                                | 10m  |
| S32 | Build and verify Phase 2                                                   | 10m  |

### Phase 3 Sub-tasks

| #   | Task                                                             | Est. |
| --- | ---------------------------------------------------------------- | ---- |
| S33 | Create `src/types/asyncapi-document.ts` with core types          | 15m  |
| S34 | Add ChannelObject, OperationObject types                         | 10m  |
| S35 | Add SchemaObject, ServerObject, SecuritySchemeObject types       | 10m  |
| S36 | Update `state.ts` to use new types                               | 15m  |
| S37 | Create `src/types/decorator-config.ts` with tagged unions        | 15m  |
| S38 | Update `$message` to use tagged union config                     | 10m  |
| S39 | Update `$protocol` to use tagged union config                    | 10m  |
| S40 | Update `$security` to use tagged union config                    | 10m  |
| S41 | Update `$bindings` to use tagged union config                    | 10m  |
| S42 | Fix `AsyncAPIEmitterOptions` type (remove extends, fix booleans) | 15m  |
| S43 | Update `emitter.ts` to use typed state and add try/catch         | 15m  |
| S44 | Build and verify Phase 3                                         | 10m  |

### Phase 4 Sub-tasks

| #   | Task                                                                  | Est. |
| --- | --------------------------------------------------------------------- | ---- |
| S45 | Create `src/asyncapi-type-emitter.ts` extending TypeEmitter           | 15m  |
| S46 | Implement `visitModel` → Schema Object generation                     | 15m  |
| S47 | Implement `visitModelProperty` → property with types                  | 15m  |
| S48 | Implement `visitEnum` → enum schema                                   | 10m  |
| S49 | Implement `visitUnion` → oneOf schema                                 | 10m  |
| S50 | Implement `visitOperation` → channel + operation                      | 15m  |
| S51 | Implement `visitString/visitNumeric/visitBoolean` → primitive schemas | 10m  |
| S52 | Implement `visitArray` → array schema                                 | 10m  |
| S53 | Implement `writeOutput` → document assembly                           | 15m  |
| S54 | Wire security scheme generation                                       | 10m  |
| S55 | Wire server generation                                                | 10m  |
| S56 | Wire tags generation                                                  | 10m  |
| S57 | Implement proper JSON serialization for `file-type: "json"`           | 10m  |
| S58 | Replace old emitter with TypeEmitter in `$onEmit`                     | 15m  |
| S59 | Update `src/index.ts` exports                                         | 5m   |
| S60 | Build and run full test suite                                         | 10m  |

### Phase 5 Sub-tasks

| #   | Task                                                        | Est. |
| --- | ----------------------------------------------------------- | ---- |
| S61 | Create `test/helpers/compile.ts` with single compile helper | 15m  |
| S62 | Create `test/helpers/assert.ts` with AsyncAPI assertions    | 10m  |
| S63 | Create `test/helpers/sources.ts` with test TypeSpec sources | 10m  |
| S64 | Delete old `test/utils/test-helpers.ts`                     | 5m   |
| S65 | Delete `test/utils/cli-test-helpers.ts`                     | 5m   |
| S66 | Delete `test/utils/clean-test-helper.ts`                    | 5m   |
| S67 | Delete `test/utils/library-test-helper.ts`                  | 5m   |
| S68 | Delete `test/utils/simple-test-helper.ts`                   | 5m   |
| S69 | Delete `test/utils/type-guards.ts`                          | 5m   |
| S70 | Fix OAuth2 colon syntax in security tests (21 tests)        | 15m  |
| S71 | Migrate test imports to new helpers (batch 1: unit/)        | 15m  |
| S72 | Migrate test imports to new helpers (batch 2: integration/) | 15m  |
| S73 | Migrate test imports to new helpers (batch 3: domain/)      | 15m  |
| S74 | Migrate test imports to new helpers (batch 4: rest)         | 15m  |
| S75 | Final full test suite run and verification                  | 10m  |
| S76 | Update AGENTS.md with new architecture                      | 10m  |
| S77 | Git commit and push                                         | 5m   |

**Total: 77 sub-tasks, ~13.5h estimated**

---

## Architectural Decisions

1. **TypeEmitter over string-concat**: The `@typespec/asset-emitter` TypeEmitter handles type walking, circular references, and declaration scoping. We'd be fools to reinvent this.

2. **Delete Effect.TS entirely**: Zero value-add. Replace with plain TypeScript functions. Effect.TS is designed for complex concurrent workflows — we have none.

3. **Single protocol/config source**: One `ReadonlySet` for protocols, one `DEFAULT_OPTIONS` for config. Any duplication is a bug.

4. **Branded types for AsyncAPI documents**: `type AsyncAPIVersion = "3.0.0" & { __brand: "AsyncAPIVersion" }`. Prevents accidentally passing a random string.

5. **Test helpers: one API**: `createTester`-based. Delete everything else. Tests should be ~5 lines each.

---

_Next step: Execute Phase 1 (DELETE), then Phase 2 (CONSOLIDATE), then assess before proceeding._
