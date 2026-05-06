# Architecture Review

**Generated:** 2026-05-06 | **Reviewer:** Senior Software Architect

---

## 1. Current Architecture Overview

```
TypeSpec Source (.tsp)
       │
       ▼
┌──────────────────┐
│  lib/main.tsp    │  extern dec declarations
│  (TypeSpec Lib)  │  → dist/src/tsp-index.js
└────────┬─────────┘
         │ (decorator calls)
         ▼
┌──────────────────────────────┐
│  decorators.ts               │  $decorators export
│  (Namespace: TypeSpec.AsyncAPI│  → minimal-decorators.ts
└────────┬─────────────────────┘
         │ (state storage)
         ▼
┌──────────────────────────────┐
│  state.ts / state-compat.ts  │  StateMapView → Map unwrapping
│  (State Management)          │  Symbol-based keys via lib.ts
└────────┬─────────────────────┘
         │ (state retrieval)
         ▼
┌──────────────────┐    ┌───────────────────┐
│  emitter.ts      │ OR │  emitter-alloy.tsx│  (DEAD CODE)
│  (Simple YAML)   │    │  (Alloy JSX)      │
└────────┬─────────┘    └───────────────────┘
         │
         ▼
    asyncapi.yaml
```

## 2. Scalability Assessment

### Module Boundaries: **POOR**

The codebase has **no clear domain boundaries**. All state flows through a single flat `stateMap` with symbol keys. There is no separation between:

- Channel domain logic
- Message domain logic
- Protocol binding logic
- Schema generation logic

Everything is in one undifferentiated Map, and the emitter must know about all keys and data shapes.

### Coupling: **HIGH**

- `minimal-decorators.ts` (611 lines) handles ALL 11 decorators with inline validation, state management, and diagnostic reporting. This is a God Module.
- `emitter-alloy.tsx` (591 lines) duplicates protocol binding switch cases between `buildChannels()` and `buildOperations()`.
- `lib.ts` (457 lines) is 90% JSDoc comments with TODOs and only ~60 lines of actual code.

### Composability: **VERY LOW**

- No plugin system is operational. The `PluginSystem.ts` skeleton exists but nothing plugs into it.
- Protocol bindings are handled via `switch/case` hardcoding rather than a strategy pattern.
- No middleware/transform pipeline for spec generation.

### Service Orientation: **NONE**

- Single-process, single-pass emitter with no separation of concerns.
- No dependency injection. Everything imports everything directly.

## 3. Key Architectural Problems

### Problem 1: Two Competing Emitters (Split Brain)

`emitter.ts` (exported) and `emitter-alloy.tsx` (dead code but more complete) represent two divergent architectures. The Alloy version uses `@alloy-js/core` JSX templates and produces richer output but is not exported.

**Impact:** Developer confusion, wasted maintenance, feature fragmentation.

### Problem 2: State Key Dualism

`stateSymbols` (Symbols) and `stateKeys` (strings) in `lib.ts` define the same keys in two formats. Decorators use `stateSymbols` via `state-compatibility.ts`, but the `$lib` definition uses `stateKeys` for TypeSpec's built-in state schema.

**Impact:** Risk of divergence, unclear which system is canonical.

### Problem 3: God Module (`minimal-decorators.ts`)

All 11 decorators, validation, state management, and diagnostic reporting in one 611-line file. Each decorator manually handles type extraction from TypeSpec AST with `as` casts everywhere.

**Impact:** Cannot test decorators independently, high cognitive load, fragile type assertions.

### Problem 4: Configuration Explosion

Four configuration sources with overlapping concerns:
- `asyncAPIEmitterOptions.ts` — type definitions
- `options.ts` — validation, defaults, schema
- `config.ts` — hardcoded defaults with local paths
- `constants/index.ts` — more constants

**Impact:** No single source of truth for configuration.

### Problem 5: Test Infrastructure Collapse

104 test files, 88 failing. Multiple overlapping test helpers. Tests reference modules that don't exist (`domain/validation/asyncapi-validator`, `domain/emitter/DocumentBuilder`). The `disabled/` directory contains duplicates of tests.

**Impact:** Cannot verify correctness, CI is non-functional.

## 4. Composability Recommendations

### Short-term (1-2 weeks)

1. **Pick one emitter** — Either commit to Alloy or simple. Delete the other.
2. **Extract decorator modules** — One file per decorator domain: `channel.ts`, `message.ts`, `server.ts`, `security.ts`, `protocol.ts`.
3. **Protocol strategy pattern** — Replace switch/case with `ProtocolHandler` interface and registry.
4. **Consolidate configuration** — Single `config.ts` with types, defaults, and validation.

### Medium-term (1-2 months)

5. **Domain-driven module structure:**
   ```
   src/
     domain/
       channel/     — Channel types, validation, emission
       message/     — Message types, schema building
       server/      — Server types, config
       protocol/    — Protocol handlers (one per protocol)
       security/    — Security scheme handling
     infrastructure/
       state/       — State management, consolidation
       config/      — Single source of truth
       logging/     — Effect logger
     emitter/       — Emitter orchestration
   ```

6. **Plugin system with real interface** — `ProtocolHandler` plugins that register binding builders.

### Long-term (3-6 months)

7. **AssetEmitter migration** — Use `@typespec/asset-emitter` properly with `AssetEmitter` class for proper schema traversal.
8. **Streaming output** — Support large specs with streaming YAML/JSON generation.
9. **Multi-file output** — Split large specs into referenced component files.

## 5. Modularity Score

| Dimension | Score (1-10) | Rationale |
|-----------|:---:|-----------|
| Separation of Concerns | 2 | All logic in 2-3 large files |
| Coupling | 2 | Direct imports everywhere, no interfaces |
| Cohesion | 3 | Decorators are cohesive; emitter is not |
| Testability | 1 | 88% test failure rate |
| Extensibility | 2 | Hardcoded protocols, no plugin system |
| Composability | 2 | No pipeline/middleware pattern |
| Type Safety | 4 | Types exist but heavily cast |
| Documentation | 5 | Good docs, excessive historical noise |
| **Overall** | **2.6/10** | Infrastructure recovery mode — needs deep restructuring |
