# Roadmap

> Long-term direction and raw ideas. Items here are NOT actionable tasks.
> When an idea is refined into bounded work, it moves to TODO_LIST.md.
> See FEATURES.md for the honest feature inventory; CHANGELOG.md for release history.

## Current State

Pre-release (`0.2.0-beta`). The emitter produces spec-compliant AsyncAPI 3.1 output validated against the official JSON Schema. 713 tests pass across 68 files. Oxlint and ESLint both clean (0 errors, 0 warnings). 18 diagnostic codes, all compile-time validated. Full protocol binding support for all 19 AsyncAPI protocols (auto-generated from `@asyncapi/specs`) with auto-versioning, key normalization, field-level validation, and placement validation via `misplaced-binding` warnings. `@typespec/versioning` integrated for `info.version` fallback.

## Themes

### 1. Spec Compliance Depth

Push toward complete AsyncAPI 3.1 coverage — every field, every binding, every edge case.

Raw ideas:

- AsyncAPI Studio compatibility verification (round-trip: emit → import → validate)

Recently completed:

- ~~Server binding support (`@server` + `@bindings` on Namespace → server.bindings)~~ — `server-builder.ts` reads `state.protocolBindings`, `test/integration/namespace-bindings.test.ts`
- ~~`@operationId` / `@messageId` decorators for explicit naming control~~ — `src/minimal-decorators.ts`, `test/integration/operation-message-id.test.ts`
- ~~Additional protocol bindings: Redis, Google Cloud Pub/Sub, AWS SNS, and 11 more~~ — 19 protocols auto-generated from `@asyncapi/specs`
- ~~Binding field-level validation against `@asyncapi/specs/bindings/` JSON Schemas at decorator time~~ — `binding-field-validator.ts`, auto-generated field rules
- ~~Full `@doc` propagation to all AsyncAPI object types~~ — channels, operations, messages
- ~~Operation `reply` support~~ — `@reply` decorator, `operation-builder.ts`
- ~~`defaultContentType` on document root~~ — `@defaultContentType` decorator
- ~~Multi-message operations (one operation referencing multiple message types)~~ — union return types
- ~~Binding placement matrix derived from `@asyncapi/specs`~~ — `GENERATED_PLACEMENT` auto-generated, `BINDING_PLACEMENT` consumed from it

### 2. Developer Experience

Make the emitter a joy to use and maintain.

Raw ideas:

- Consolidate ESLint and oxlint configs (two linters with potentially contradictory rules — currently complementary with zero rule conflicts)

Recently completed:

- ~~`ParsedAsyncAPIDocument` type to eliminate `as any` in test assertions~~ — 14 `as any` eliminated
- ~~Remove redundant `as AsyncAPIObject` casts~~ — consolidated to `ParsedAsyncAPIDocument`
- ~~Clean up `Record<string, unknown>` casts in compliance tests~~ — reduced from 60+ to 25
- ~~Fix `schema-validator.ts` and `type-guards.ts` to return/assert `ParsedAsyncAPIDocument`~~
- ~~Coverage tooling for TypeSpec's `dist/*.js` loading pattern~~ — `bun test --coverage` + `coverage-gate.ts`, ~96% average
- ~~Performance profiling for large specifications (100+ channels)~~ — `test/benchmark/` suite

### 3. Architecture

Keep the codebase honest as it grows.

Raw ideas:

- Plugin/hook system for custom binding extensions (#32 RFC)

Recently completed:

- ~~`@bindings` support for `Namespace` target (enables server binding placement validation)~~ — decorator targets `Operation | Model | Namespace`, `bindingTargetKind` maps Namespace → `"server"`
- ~~`@apiVersion` decorator for document-level versioning~~ — `src/minimal-decorators.ts:283`, `test/decorators/api-version.test.ts`
- ~~Refactor `buildAsyncAPIDocument()` (was 315 lines, complexity 84)~~ — split to 116 lines + `src/builders/` directory (server, channel, operation, message builders, operation discovery, shared utils)
- ~~Protocol binding validation framework: derive `BINDING_PLACEMENT` from `@asyncapi/specs`~~ — auto-generated at build time
- ~~Multi-file TypeSpec input support~~ — external `.tsp` compilation tests (16 patterns from 5 projects)

### 4. Ecosystem Integration

Connect to the broader TypeSpec and AsyncAPI ecosystems.

Raw ideas:

- OpenAPI 3.x cross-emitter type sharing (cross-emitter shared module at `src/shared/`)

Recently completed:

- ~~AsyncAPI generator ecosystem compatibility~~ — `test/validation/generator-compatibility.test.ts` (8 structural tests), `test/validation/studio-compatibility.test.ts` (9 parser tests)
- ~~`@typespec/versioning` support (#163)~~ — `getVersion()` reads `@versioned` enum for `info.version`, `test/integration/versioning.test.ts` (5 tests)

Recently completed:

- ~~Multi-file output (#78)~~ — `split-schemas` option, `schema-splitter.ts`

## Non-Goals

- We do NOT aim to replace the AsyncAPI specification itself
- We do NOT generate code (use AsyncAPI generator for that)
- We do NOT support AsyncAPI 2.x output (3.1 only)
- We do NOT build a VS Code extension (the TypeSpec VS Code extension already provides IDE support)
- We do NOT convert AsyncAPI 2.x specs to 3.x (use the official AsyncAPI converter)
- We do NOT build a plugin architecture for community protocol bindings (protocol bindings are defined in code, not extensible at runtime)
