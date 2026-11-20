# Status Report: Reusable AsyncAPI Components (`components.*`)
> **Live remainder:** none — every item resolved in the 2026-11-19/20 corpus sweep (verdicts inline; routed work lives in TODO_LIST.md / ROADMAP.md).

**Date:** 2026-08-06 13:50
**Session Goal:** Populate remaining `components.*` sections — parameters, correlationIds, operationTraits, messageTraits, reusable bindings

---

## a) FULLY DONE

### 10 New Decorators for Reusable AsyncAPI 3.1 Components

Implemented the full decorator → state → builder → document pipeline for
**5 reusable component types** across **10 new decorators**, validated
against the official AsyncAPI 3.1 JSON Schema.

| Component Section                                             | Definition Decorator                                  | Reference Decorator                         | Tests |
| ------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------- | ----- |
| ~~`components.operationTraits`~~ done — operationTraits shipped and documented ( `FEATURES.md:108`, `test/compliance/reusable-components.test.ts` ) | ~~`@operationTrait(name, config)` on Namespace~~ | ~~`@useOperationTrait(name)` on Operation~~ | ~~3~~ |
| ~~`components.messageTraits`~~ done — messageTraits shipped and documented ( `FEATURES.md:109` ) | ~~`@messageTrait(name, config)` on Namespace~~ | ~~`@useMessageTrait(name)` on Model~~ | ~~2~~ |
| ~~`components.parameters`~~ done — parameters shipped and documented ( `FEATURES.md:112` ) | ~~`@parameter(name, config)` on Namespace~~ | ~~(auto-ref from `{name}` in channel address)~~ | ~~3~~ |
| ~~`components.correlationIds`~~ done — correlationIds shipped and documented ( `FEATURES.md:113` ) | ~~`@reusableCorrelationId(name, location)` on Namespace~~ | ~~`@useCorrelationId(name)` on Model~~ | ~~3~~ |
| ~~`components.operationBindings` / `components.messageBindings`~~ done — reusable bindings shipped and documented ( `FEATURES.md:115` ) | ~~`@reusableBinding(name, config)` on Namespace~~ | ~~`@useBinding(name)` on Operation/Model~~ | ~~3~~ |

**Inline approaches still work** — `@correlationId(location)` on a model
continues to emit inline `correlationId: { location }` without populating
`components.correlationIds`. The new decorators add the reusable option
without changing existing behavior.

### Files Changed

| File                                          | Change                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~`src/domain/models/asyncapi-document.ts`~~ done — `src/domain/models/asyncapi-document.ts` carries the trait and component types today | ~~Added `OperationTraitObject`, `MessageTraitObject` (via `Pick<CommonMetadata>` + `Pick<MessageObject>`), expanded `ComponentsObject` with 6 new fields, added `refOperationTrait/refMessageTrait/refParameter/refCorrelationId` helpers, changed `CommonMetadata.bindings` to `ProtocolBindings-or-Ref`~~ |
| ~~`src/state.ts`~~ done — `src/state.ts` carries the consolidated state today | ~~Added 5 data interfaces + 8 new maps in `AsyncAPIConsolidatedState` + consolidation entries~~ |
| ~~`src/lib.ts`~~ done — `src/lib.ts` declares the diagnostic codes today ( `invalid-parameter-location` at `:181` ) | ~~Added 9 state symbols + 2 new diagnostic codes (`invalid-trait-config`, `invalid-parameter-config`)~~ |
| ~~`src/state-writers.ts`~~ done — `src/state-writers.ts` carries the store functions today | ~~Added `storeMulti` generic helper + exported ref store factory + 9 store functions~~ |
| ~~`src/namespace-decorators.ts`~~ done — `src/namespace-decorators.ts` carries the definition decorators today | ~~Implemented 5 namespace-level definition decorators via `namedConfigDecorator` factory~~ |
| ~~`src/use-decorators.ts`~~ done — `src/use-decorators.ts` exists today ( the session's new file ) | ~~**New file** — 4 reference decorators via `makeUseDecorator` factory~~ |
| ~~`src/decorator-helpers.ts`~~ done — `src/decorator-helpers.ts` carries the shared validation helper today | ~~Added `validateNameAndRun` shared helper~~ |
| ~~`src/decorators.ts`~~ done — `src/decorators.ts` registers all reusable decorators today | ~~Registered all 10 new decorators in `$decorators` registry~~ |
| ~~`src/builders/components-builder.ts`~~ done — `src/builders/components-builder.ts` exists today ( the session's new file ) | ~~**New file** — `buildReusableComponents` + `applyReusableRefs` builders~~ |
| ~~`src/builders/types.ts`~~ done — `src/builders/types.ts` carries the accumulator maps today | ~~Added 6 new accumulator maps to `DocumentBuildContext`~~ |
| ~~`src/document-builder.ts`~~ done — `src/document-builder.ts` wires the component builders today | ~~Wired `buildReusableComponents` + `applyReusableRefs` into pipeline, populated 6 new `components.*` fields in `assembleDocument`~~ |
| ~~`src/minimal-decorators.ts`~~ done — `src/minimal-decorators.ts` carries the shared callback today | ~~Extracted shared `targetKindFormat` callback to eliminate pre-existing duplication~~ |
| ~~`lib/main.tsp`~~ done — `lib/main.tsp` declares all ten decorators with JSDoc today | ~~Declared all 10 new decorators with JSDoc~~ |
| ~~`test/compliance/reusable-components.test.ts`~~ done — `test/compliance/reusable-components.test.ts` carries 43 tests today | ~~**New file** — 14 compliance tests, all validated against AsyncAPI 3.1 JSON Schema~~ |

**Total:** 14 files changed, 2 new files

### Duplication Elimination

Every clone was eliminated at `minTokens: 15` (the project's strict baseline):

- **29 clones** introduced by new code → **0 clones** through:
  - `validateNameAndRun` shared validation helper in `decorator-helpers.ts`
  - `makeUseDecorator` factory for all `@use*` decorators
  - `namedConfigDecorator` factory for trait/parameter decorators
  - `storeMulti` generic for array-accumulating state writers
  - `multiRefStore` factory for ref state writers
  - `populateNamed` generic for component builder loops
  - `TraitMetadata` shared type alias for trait objects
  - `targetKindFormat` shared callback in `minimal-decorators.ts`
  - Merged message-trait-ref and correlation-id-ref loops into single iteration

### Verification Results

| Gate                                      | Result                                        |
| ----------------------------------------- | --------------------------------------------- |
| ~~TypeScript build (`tsc -p tsconfig.json`)~~ done — build is a standing verify stage ( `AGENTS.md:26` ) | ~~0 errors~~ |
| ~~ESLint + oxlint (`pnpm run lint`)~~ done — dual-linter gate standing and green ( `AGENTS.md:32` ) | ~~0 errors, 0 warnings~~ |
| ~~Tests (`pnpm run test`)~~ done — suite has since grown to 1275 tests / 105 files ( `FEATURES.md:4` ) | ~~**969 pass / 0 fail** (955 existing + 14 new)~~ |
| ~~jscpd duplication (`pnpm run duplicate`)~~ done — jscpd 0-clone gate standing ( `FEATURES.md:9` ) | ~~**0 clones / 0% / 0% tokens**~~ |
| ~~AsyncAPI 3.1 JSON Schema validation~~ done — AJV validation is standing policy across the compliance suite ( `AGENTS.md:115` ) | ~~All 14 new tests pass AJV validation~~ |
| ~~`pnpm run verify` (full gate)~~ done — the full verify gate is standing policy ( `AGENTS.md:26` ) | ~~**PASS**~~ |

---

## b) PARTIALLY DONE / LIMITATIONS

### `components.serverBindings` and `components.channelBindings` not implemented

The `ComponentsObject` type now includes `serverBindings` and `channelBindings`
fields, but there are no decorators to populate them. This requires:

- `@useBinding` targeting Namespace (for server bindings) or adding a channel-level target
- A `@useBinding` on the channel address itself (which is currently an Operation-level concept)

This is a minor gap — server and channel bindings are rarely reused.

### Parameter `schema`, `enum`, `default`, `examples` not stored

The `@parameter` decorator extracts `description` and `location` from the
config, but the `ParameterObject` type also supports `schema`, `enum`,
`default`, and `examples`. These require JSON Schema extraction from the
TypeSpec config model, which adds complexity. The current implementation
covers the most common use case (description + location).

### No negative/error tests for new decorators

The 14 compliance tests verify correct output but don't test error paths
(invalid names, missing configs, referencing undefined traits). These should
be added to `test/integration/negative-tests.test.ts`.

---

## c) NEXT STEPS

~~1. **Add negative tests** for all 10 new decorators (invalid name, empty config, undefined trait ref)~~ done — `test/integration/reusable-components-negative.test.ts` exists with the error-path tests
~~2. **Populate `components.serverBindings` and `components.channelBindings`** by extending `@useBinding` to Namespace targets~~ done — serverBindings via Namespace `@bindings` ( `AGENTS.md:62` ) and channelBindings via `@useChannelBinding` ( `FEATURES.md:117` )
~~3. **Extract parameter schema/enum/default** from `@parameter` config models~~ done — `enum`/`default`/`examples` extract today ( `FEATURES.md:112` ); the `schema` field was later removed deliberately ( commit `a61f52d7` )
~~4. **Update AGENTS.md** with new decorator count (27 total: 17 existing + 10 new), diagnostic code count (24: 22 existing + 2 new), and components.\* population summary~~ done — counts current in `AGENTS.md:61` ( 30 decorators ) and `:73` ( 38 codes )
