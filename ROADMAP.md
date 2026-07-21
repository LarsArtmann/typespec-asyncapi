# Roadmap

**Last updated:** 2026-07-21

## Vision

Become the standard way to define AsyncAPI 3.1 specifications using TypeSpec, with first-class IDE support, validation, and ecosystem integration.

## Current State: Pre-Alpha

The emitter produces spec-compliant AsyncAPI 3.1 output for the core feature set. See FEATURES.md for the honest feature inventory.

## Near-Term (v0.1.0-alpha)

- [x] Channel parameters for `{var}` address expressions
- [x] Server variables support
- [x] Nested model `$ref` (instead of inlining)
- [x] `EmitterOptions` model in `lib/main.tsp` for IDE autocomplete
- [x] GitHub Actions CI
- [ ] AJV validation wired in `$onEmit` (decided against — follows the openapi3 emitter pattern; CI runs schema validation separately)

## Mid-Term (v0.2.0-beta)

- [ ] Full protocol binding support (Kafka, AMQP, MQTT, WebSocket)
- [ ] AsyncAPI 3.1 specification test suite compliance
- [ ] Performance optimization for large specifications
- [ ] Visual studio code extension integration
- [ ] AsyncAPI Studio compatibility

## Long-Term (v1.0.0)

- [ ] AsyncAPI 2.x-to-3.x conversion support
- [ ] Multi-file TypeSpec input support
- [ ] Custom decorator validation framework
- [ ] Plugin architecture for community protocol bindings
- [ ] Integration with AsyncAPI generator ecosystem

## Non-Goals

- We do NOT aim to replace the AsyncAPI specification itself
- We do NOT generate code (use AsyncAPI generator for that)
- We do NOT support AsyncAPI 2.x output (3.1 only)
