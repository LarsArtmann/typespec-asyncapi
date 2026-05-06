# TypeSpec AsyncAPI Emitter - Feature Inventory

**Generated:** 2026-05-06 | **Project:** `@lars-artmann/typespec-asyncapi` v0.0.1

---

## Core Emitter

| Feature | Status | Notes |
|---------|--------|-------|
| AsyncAPI 3.0 YAML generation | PARTIALLY_FUNCTIONAL | Simple emitter produces basic YAML; Alloy emitter produces richer output but both are immature |
| JSON output format | BROKEN | `"file-type": "json"` option exists but no JSON serialization implemented |
| TypeSpec `$onEmit` integration | PARTIALLY_FUNCTIONAL | Two competing `$onEmit` implementations: `emitter.ts` (simple) and `emitter-alloy.tsx` (Alloy framework). Only `emitter.ts` is exported |
| Schema generation from TypeSpec models | PARTIALLY_FUNCTIONAL | Alloy version handles scalars, models, arrays; simple version outputs empty schemas |
| Recursive model reference resolution | PARTIALLY_FUNCTIONAL | Alloy version collects nested models; limited to 1 level deep in practice |
| `emitFile` output | PARTIALLY_FUNCTIONAL | Works but always outputs `asyncapi.yaml` regardless of options |

## Decorator System

| Decorator | Status | Notes |
|-----------|--------|-------|
| `@channel` | PARTIALLY_FUNCTIONAL | Stores path in state; basic validation; no parameter extraction in emitter |
| `@publish` | PARTIALLY_FUNCTIONAL | Stores operation type; optional message config linkage |
| `@subscribe` | PARTIALLY_FUNCTIONAL | Stores operation type; no message config linkage |
| `@server` | PARTIALLY_FUNCTIONAL | Stores config with validation; emitter ignores server definitions in simple mode |
| `@message` | PARTIALLY_FUNCTIONAL | Stores title/description/contentType from Model config |
| `@protocol` | PARTIALLY_FUNCTIONAL | Stores protocol config with defaults; Kafka/WS/MQTT specific handling |
| `@security` | PARTIALLY_FUNCTIONAL | Stores name+scheme; handles both Model and plain object configs |
| `@tags` | PARTIALLY_FUNCTIONAL | Stores as comma-separated string (poor data structure) |
| `@correlationId` | PARTIALLY_FUNCTIONAL | Stores location+property; not emitted in output |
| `@bindings` | PARTIALLY_FUNCTIONAL | Merges bindings with existing; not emitted in simple mode |
| `@header` | PARTIALLY_FUNCTIONAL | Stores on ModelProperty; emitter must collect from properties |

## State Management

| Feature | Status | Notes |
|---------|--------|-------|
| State persistence via TypeSpec `stateMap` | PARTIALLY_FUNCTIONAL | Uses both `stateSymbols` (Symbol keys) and `stateKeys` (string keys) — potential split brain |
| State consolidation | PARTIALLY_FUNCTIONAL | `consolidateAsyncAPIState()` unwraps StateMapView; works but fragile |
| Compatibility layer | PARTIALLY_FUNCTIONAL | `state-compatibility.ts` handles TypeSpec 1.8+ API changes |

## Infrastructure

| Feature | Status | Notes |
|---------|--------|-------|
| Effect.TS error handling | PARTIALLY_FUNCTIONAL | Railway patterns in `effect-helpers.ts`; barely used in actual emitter |
| Effect.TS logging | PARTIALLY_FUNCTIONAL | Custom logger in `logger.ts`; emitter uses `Effect.log` for debug spam |
| Standardized errors | PARTIALLY_FUNCTIONAL | 5 error classes defined; not actually thrown anywhere meaningful |
| Configuration options | PARTIALLY_FUNCTIONAL | Rich schema validation but emitter ignores most options |
| Plugin system | BROKEN | `PluginSystem.ts` is a skeleton; no plugins registered or functional |
| Performance monitoring | BROKEN | `PerformanceMonitor.ts` excluded from compilation; references missing |
| Path utilities | PARTIALLY_FUNCTIONAL | Comprehensive path helpers; hard-coded paths (`/Users/larsartmann/...`) in defaults |

## Testing

| Feature | Status | Notes |
|---------|--------|-------|
| Bun test runner integration | PARTIALLY_FUNCTIONAL | 100 tests across 92 files; 88 failures, 7 passes, 4 todo |
| Protocol binding tests | FUNCTIONAL | 7 passing tests for Kafka/WebSocket binding validation |
| Integration tests | BROKEN | Missing modules (`@asyncapi/parser`, domain validators) |
| E2E tests | BROKEN | Missing source files, broken imports |
| BDD test infrastructure | BROKEN | `test/bdd/` exists but no functional tests |
| Test helper infrastructure | PARTIALLY_FUNCTIONAL | Multiple overlapping test helpers (`test-helpers.ts`, `emitter-test-helpers.ts`, `library-test-helper.ts`, etc.) |

## Build & CI

| Feature | Status | Notes |
|---------|--------|-------|
| TypeScript compilation | BROKEN | 41 type errors; missing `@types/node` in tsconfig, unresolved module imports |
| ESLint | BROKEN | `@eslint/js` package resolution failure |
| Code duplication | EXCELLENT | 0.26% duplication (2 clones, 9 lines) |
| CI pipeline | PARTIALLY_FUNCTIONAL | GitHub Actions workflows exist; build must pass 0 errors (currently fails) |

## Documentation

| Feature | Status | Notes |
|---------|--------|-------|
| README | FUNCTIONAL | Basic usage documentation |
| CONTRIBUTING.md | FUNCTIONAL | Contribution guidelines |
| TypeSpec-to-AsyncAPI mapping docs | FUNCTIONAL | 9-part guide in `docs/map-typespec-to-asyncapi/` |
| Architecture docs | OVERWHELMED | 200+ planning/status/report markdown files; mostly historical noise |
| ADR records | PARTIALLY_FUNCTIONAL | 3 ADRs + 1 in `docs/adr/` |

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Source files | 29 |
| Source lines | 3,378 |
| Test files | 104 |
| Test results | 7 pass / 88 fail / 4 todo / 1 skip |
| TS compilation errors | 41 |
| Code duplication | 0.26% |
| Decorators | 11 |
| Passing features | ~3 |
| Partially functional | ~25 |
| Broken | ~8 |
