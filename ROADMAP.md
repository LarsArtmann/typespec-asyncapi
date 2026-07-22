# Roadmap

**Last updated:** 2026-07-22

## Vision

Become the standard way to define AsyncAPI 3.1 specifications using TypeSpec, with first-class IDE support, validation, and ecosystem integration.

## Current State: Pre-Alpha

The emitter produces spec-compliant AsyncAPI 3.1 output for the core feature set. Diagnostic registry is fully type-safe (14 codes, compile-time validated). Test suite runs on vitest (426 tests, 95% coverage). See FEATURES.md for the honest feature inventory.

## Shipped (v0.1.0-alpha)

- [x] Channel parameters for `{var}` address expressions
- [x] Server variables support
- [x] Nested model `$ref` (instead of inlining)
- [x] `EmitterOptions` model in `lib/main.tsp` for IDE autocomplete
- [x] GitHub Actions CI
- [x] Diagnostic registry split-brain eliminated — all codes declared and fired via `$lib.reportDiagnostic()`
- [x] Document model fully type-safe (`ServerObject.protocol: AsyncAPIProtocol`, `OperationObject.bindings: ProtocolBindings`)
- [x] External `.tsp` pattern compilation tests (16 patterns from 5 projects)
- [x] URL validation for `@server` decorator
- [x] Migrated test runner from bun:test to vitest (Bun OOM crashes)
- [x] Dead code eliminated (`src/constants/index.ts` deleted, single version constant)
- [~] AJV validation wired in `$onEmit` (decided against — follows the openapi3 emitter pattern; CI runs schema validation separately)

## Mid-Term (v0.2.0-beta)

- [ ] Full protocol binding support (Kafka, AMQP, MQTT, WebSocket)
- [ ] AsyncAPI 3.1 specification test suite compliance
- [ ] Performance optimization for large specifications
- [ ] AsyncAPI Studio compatibility

## Long-Term (v1.0.0)

- [ ] Multi-file TypeSpec input support
- [ ] Custom decorator validation framework
- [ ] Integration with AsyncAPI generator ecosystem

## Non-Goals

- We do NOT aim to replace the AsyncAPI specification itself
- We do NOT generate code (use AsyncAPI generator for that)
- We do NOT support AsyncAPI 2.x output (3.1 only)
- We do NOT build a VS Code extension (the TypeSpec VS Code extension already provides IDE support)
- We do NOT convert AsyncAPI 2.x specs to 3.x (use the official AsyncAPI converter)
- We do NOT build a plugin architecture for community protocol bindings (protocol bindings are defined in code, not extensible at runtime)
