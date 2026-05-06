# Architecture Improvement — Deepening Opportunities

**Generated:** 2026-05-06 | **Framework:** Improve Codebase Architecture Skill

---

## Glossary

- **Module** — anything with an interface and an implementation
- **Seam** — where an interface lives; a place behavior can be altered without editing in place
- **Depth** — leverage at the interface: lots of behavior behind a small interface
- **Shallow** — interface nearly as complex as the implementation
- **Adapter** — concrete thing satisfying an interface at a seam

---

## Candidate 1: Extract Protocol Handlers from Switch/Case

**Files:** `emitter-alloy.tsx:160-187`, `emitter-alloy.tsx:248-268`, `minimal-decorators.ts:326-351`

**Problem:** Protocol binding logic is duplicated across 3 locations as `switch/case` blocks for Kafka, WebSocket, MQTT, HTTP. Adding a new protocol requires editing all three places.

**Solution:** Define a `ProtocolHandler` interface:

```typescript
interface ProtocolHandler {
  protocol: string
  buildChannelBindings(config: ProtocolConfigData): Record<string, unknown>
  buildOperationBindings(config: ProtocolConfigData): Record<string, unknown>
  applyDefaults(config: Record<string, unknown>): ProtocolConfigData
}
```

Register handlers in a `Map<string, ProtocolHandler>`. Each protocol becomes a self-contained module.

**Benefits:**
- **Locality:** Adding Kafka support = 1 new file, not 3 edits
- **Leverage:** Emitter code shrinks; protocol complexity hidden behind seam
- **Testability:** Each handler tested independently with focused unit tests
- **Extensibility:** Community can add protocols via the plugin system

---

## Candidate 2: Split `minimal-decorators.ts` into Domain Modules

**Files:** `minimal-decorators.ts` (611 lines)

**Problem:** Single file handles all 11 decorators with inline validation, type extraction, state management, and diagnostic reporting. This is a shallow module — the interface (11 exported functions) is nearly as complex as the implementation.

**Solution:** Decompose by domain:

```
src/domain/decorators/
  channel.ts     — @channel, storeChannelState, ChannelPathData
  message.ts     — @message, @header, storeMessageConfig, storeHeader
  operation.ts   — @publish, @subscribe, storeOperationType
  server.ts      — @server, storeServerConfig
  protocol.ts    — @protocol, @bindings, storeBindings
  security.ts    — @security, storeSecurityConfig
  tags.ts        — @tags, storeTags
  correlation.ts — @correlationId, storeCorrelationId
  shared.ts      — reportDecoratorDiagnostic, validateConfig, getStateMap re-exports
```

**Benefits:**
- **Depth:** Each module has a small interface (1-3 functions) hiding domain complexity
- **Locality:** Change channel logic → edit 1 file
- **Testability:** Test each decorator domain independently
- **Deletion test:** Deleting any module removes exactly that domain's complexity

---

## Candidate 3: Consolidate Configuration into Single Source of Truth

**Files:** `asyncAPIEmitterOptions.ts`, `options.ts`, `config.ts`, `constants/index.ts`

**Problem:** Four configuration files with overlapping defaults, types, and validation. `config.ts` has hard-coded paths. `options.ts` has both a JSON Schema and TypeScript type guards for the same thing.

**Solution:** Single `config.ts`:

```typescript
export type EmitterConfig = { ... }           // types
export const defaults: EmitterConfig = { ... } // defaults
export function validate(cfg: unknown): Effect.Effect<EmitterConfig, Error>  // validation
```

Delete the other three files. Export from single location.

**Benefits:**
- **Locality:** One place to change config behavior
- **Deletion test:** Removing any of the 4 current files would force consolidation
- **Type safety:** No more "which config source is canonical?"

---

## Candidate 4: Unify State Key System

**Files:** `lib.ts:334-349` (stateKeys), `lib.ts:434-448` (stateSymbols)

**Problem:** Two parallel key systems. `stateKeys` uses strings for TypeSpec's state schema. `stateSymbols` uses Symbols for runtime state access via `stateMap()`. Decorators use `stateSymbols` through `state-compatibility.ts`, but the `$lib` schema defines `stateKeys`.

**Solution:** Use TypeSpec's built-in state system exclusively. The `$lib.state` definition already provides the schema — use `$lib.stateKeys` (provided by `createTypeSpecLibrary`) instead of custom Symbol-based access.

**Benefits:**
- **Depth:** One state access pattern instead of two
- **Locality:** Remove `state-compatibility.ts` entirely
- **Type safety:** TypeSpec compiler validates state access patterns

---

## Candidate 5: Delete Dead Code Aggressively

**Files:** `emitter-alloy.tsx`, `plugins/core/PluginSystem.ts`, `infrastructure/performance/PerformanceMonitor.ts`, `infrastructure/performance/PerformanceRegressionTester.ts`

**Problem:** 4 files (approx 800 lines) are either excluded from build, not imported, or not functional. They increase cognitive load without providing value.

**Solution:** Delete them. When the functionality is needed, implement it properly from scratch.

**Benefits:**
- **Locality:** Less code to understand
- **Deletion test:** Deleting these files changes nothing about the working system
- **Architecture clarity:** No false impressions of completeness

---

## Recommended Priority Order

1. **Delete dead code** (Candidate 5) — 15 min, immediate clarity
2. **Consolidate configuration** (Candidate 3) — 1 hour, removes split brain
3. **Unify state keys** (Candidate 4) — 2 hours, removes compatibility layer
4. **Split decorators** (Candidate 2) — 4 hours, enables independent testing
5. **Extract protocol handlers** (Candidate 1) — 4 hours, enables extensibility
