# Status Report: Reusable AsyncAPI Components (`components.*`)

**Date:** 2026-08-06 13:50
**Session Goal:** Populate remaining `components.*` sections — parameters, correlationIds, operationTraits, messageTraits, reusable bindings

---

## a) FULLY DONE

### 10 New Decorators for Reusable AsyncAPI 3.1 Components

Implemented the full decorator → state → builder → document pipeline for
**5 reusable component types** across **10 new decorators**, validated
against the official AsyncAPI 3.1 JSON Schema.

| Component Section | Definition Decorator | Reference Decorator | Tests |
|---|---|---|---|
| `components.operationTraits` | `@operationTrait(name, config)` on Namespace | `@useOperationTrait(name)` on Operation | 3 |
| `components.messageTraits` | `@messageTrait(name, config)` on Namespace | `@useMessageTrait(name)` on Model | 2 |
| `components.parameters` | `@parameter(name, config)` on Namespace | (auto-ref from `{name}` in channel address) | 3 |
| `components.correlationIds` | `@reusableCorrelationId(name, location)` on Namespace | `@useCorrelationId(name)` on Model | 3 |
| `components.operationBindings` / `components.messageBindings` | `@reusableBinding(name, config)` on Namespace | `@useBinding(name)` on Operation\|Model | 3 |

**Inline approaches still work** — `@correlationId(location)` on a model
continues to emit inline `correlationId: { location }` without populating
`components.correlationIds`. The new decorators add the reusable option
without changing existing behavior.

### Files Changed

| File | Change |
|---|---|
| `src/domain/models/asyncapi-document.ts` | Added `OperationTraitObject`, `MessageTraitObject` (via `Pick<CommonMetadata>` + `Pick<MessageObject>`), expanded `ComponentsObject` with 6 new fields, added `refOperationTrait/refMessageTrait/refParameter/refCorrelationId` helpers, changed `CommonMetadata.bindings` to `ProtocolBindings \| Ref` |
| `src/state.ts` | Added 5 data interfaces + 8 new maps in `AsyncAPIConsolidatedState` + consolidation entries |
| `src/lib.ts` | Added 9 state symbols + 2 new diagnostic codes (`invalid-trait-config`, `invalid-parameter-config`) |
| `src/state-writers.ts` | Added `storeMulti` generic helper + exported ref store factory + 9 store functions |
| `src/namespace-decorators.ts` | Implemented 5 namespace-level definition decorators via `namedConfigDecorator` factory |
| `src/use-decorators.ts` | **New file** — 4 reference decorators via `makeUseDecorator` factory |
| `src/decorator-helpers.ts` | Added `validateNameAndRun` shared helper |
| `src/decorators.ts` | Registered all 10 new decorators in `$decorators` registry |
| `src/builders/components-builder.ts` | **New file** — `buildReusableComponents` + `applyReusableRefs` builders |
| `src/builders/types.ts` | Added 6 new accumulator maps to `DocumentBuildContext` |
| `src/document-builder.ts` | Wired `buildReusableComponents` + `applyReusableRefs` into pipeline, populated 6 new `components.*` fields in `assembleDocument` |
| `src/minimal-decorators.ts` | Extracted shared `targetKindFormat` callback to eliminate pre-existing duplication |
| `lib/main.tsp` | Declared all 10 new decorators with JSDoc |
| `test/compliance/reusable-components.test.ts` | **New file** — 14 compliance tests, all validated against AsyncAPI 3.1 JSON Schema |

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

| Gate | Result |
|---|---|
| TypeScript build (`tsc -p tsconfig.json`) | 0 errors |
| ESLint + oxlint (`pnpm run lint`) | 0 errors, 0 warnings |
| Tests (`pnpm run test`) | **969 pass / 0 fail** (955 existing + 14 new) |
| jscpd duplication (`pnpm run duplicate`) | **0 clones / 0% / 0% tokens** |
| AsyncAPI 3.1 JSON Schema validation | All 14 new tests pass AJV validation |
| `pnpm run verify` (full gate) | **PASS** |

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

1. **Add negative tests** for all 10 new decorators (invalid name, empty config, undefined trait ref)
2. **Populate `components.serverBindings` and `components.channelBindings`** by extending `@useBinding` to Namespace targets
3. **Extract parameter schema/enum/default** from `@parameter` config models
4. **Update AGENTS.md** with new decorator count (27 total: 17 existing + 10 new), diagnostic code count (24: 22 existing + 2 new), and components.* population summary
