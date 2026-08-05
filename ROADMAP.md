# Roadmap

> Long-term direction and raw ideas. Items here are NOT actionable tasks.
> When an idea is refined into bounded work, it moves to TODO_LIST.md.
> See FEATURES.md for the honest feature inventory; CHANGELOG.md for release history.

## Current State

Pre-release (`0.2.0-beta`). The emitter produces spec-compliant AsyncAPI 3.1 output validated against the official JSON Schema. **881 tests** pass across 76 files. Oxlint and ESLint both clean (0 errors, 0 warnings). **22 diagnostic codes** (17 error + 5 warning), all compile-time validated. Full protocol binding support for all **19 AsyncAPI protocols** (auto-generated from `@asyncapi/specs`) with auto-versioning, key normalization, field-level validation, and placement validation. **11 constraint decorators** mapped (`@minValue`, `@maxValue`, `@pattern`, `@minLength`, `@maxLength`, `@format`, `@minItems`, `@maxItems`, `#deprecated`, and exclusive variants). `@typespec/versioning` integrated for `info.version` fallback. **Zero code duplication** (jscpd 0% threshold, structural enforcement via HOFs and mixin interfaces). **97% coverage** average. Cross-emitter shared module (`src/shared/`) exports `JsonSchema`, `extractValue`, `intrinsicToSchema`, and `AsyncAPISchemaEmitter` for reuse.

---

## Themes

### 1. Spec Compliance Depth

Push toward complete AsyncAPI 3.1 coverage — every field, every binding, every edge case.

Raw ideas:

- Populate `info.contact`, `info.license`, `info.termsOfService`, `info.externalDocs` — no decorators or emitter options exist yet
- Support `allOf` / `oneOf` / `not` schema composition keywords (declared in `JsonSchema` type but never generated)
- Support `@discriminator` → JSON Schema `discriminator` for polymorphic type handling
- Support `@example` → JSON Schema `examples` / `example`
- Support multi-format schemas (`schemaFormat`, Avro/Protobuf payload) per AsyncAPI 3.1
- Populate remaining components types (parameters, correlationIds, tags, operationTraits, messageTraits, reusable bindings)

Recently completed:

- ~~11 constraint decorators mapped~~ — `src/constraint-mapper.ts`: `@minValue`→`minimum`, `@maxValue`→`maximum`, exclusive variants, `@minLength`/`@maxLength`, `@pattern`, `@format`, `@minItems`/`@maxItems`, `#deprecated`. 15 compliance tests.
- ~~Dead `nullable`/`xml` removed from `JsonSchema`~~ — OpenAPI 3.0 / never-generated fields
- ~~AsyncAPI Studio compatibility~~ — `test/validation/studio-compatibility.test.ts` (9 tests via `@asyncapi/parser`)
- ~~Server binding support~~ — `@server` + `@bindings` on Namespace → `server.bindings`
- ~~`@operationId` / `@messageId` decorators~~ — explicit naming control
- ~~19 protocol bindings~~ — auto-generated from `@asyncapi/specs`
- ~~Binding field-level validation~~ — `binding-field-validator.ts`, auto-generated field rules
- ~~Full `@doc` propagation~~ — channels, operations, messages, schemas
- ~~Operation `reply` support~~ — `@reply` decorator
- ~~`defaultContentType` on document root~~ — `@defaultContentType` decorator
- ~~Multi-message operations~~ — union return types
- ~~Binding placement matrix~~ — `GENERATED_PLACEMENT` auto-generated
- ~~Tuple of named models~~ — fixed to produce valid JSON Schema with `$ref`
- ~~Binding protocol gap~~ — solace/anypointmq/ros2 now accepted as valid binding protocols

### 2. Developer Experience

Make the emitter a joy to use and maintain.

Raw ideas:

- Split `./shared` subpath into neutral (`./shared`) vs AsyncAPI-bound (`./asyncapi`) entry points so neutral consumers pay zero AsyncAPI runtime cost
- Add `bun run verify` alias = `validate` + coverage gate (currently separate commands)
- Add a docs-entropy CI guard (flag when living docs drift from code counts)

Recently completed:

- ~~AsyncAPI generator ecosystem compatibility~~ — structural requirement tests
- ~~`ParsedAsyncAPIDocument` type~~ — eliminated `as any` in test assertions
- ~~Coverage tooling for `dist/*.js` loading pattern~~ — `bun test --coverage` + `coverage-gate.ts`, 97% average
- ~~Performance profiling~~ — `test/benchmark/` suite (5 tests)
- ~~Dead Cucumber BDD infrastructure removed~~ — 23 real end-to-end tests
- ~~ESLint + oxlint dual-linter consolidation~~ — complementary configs, zero rule conflicts
- ~~Cross-emitter shared module barrel~~ — honest two-tier JSDoc, public-API contract tests

### 3. Architecture

Keep the codebase honest as it grows.

Raw ideas:

- TypeSpec 1.14.0 upgrade (we're on 1.13.0) — includes auto decorators, `.ts` module imports, memory leak fix, entrypoint resolution fix
- Type safety: tighten `OperationObject.action` to required, add `SecurityScheme.description`, make `ParsedAsyncAPIDocument.asyncapi` a literal union
- Move generic utilities (`applyOverrides`, `collectNamesInto`) to a shared `src/util/` module

Recently completed:

- ~~Zero-clone duplication baseline~~ — four-phase campaign: 68 clones / 7.67% → 0 clones / 0%, enforced via 0% jscpd threshold
- ~~Structural deduplication helpers~~ — `DocumentBody`, `DiagnosticContext`, `makeConfigDecorator`, `makeStringIdDecorator`, `messageDecorator`, `checkBound`, `validatedDecorator`, `iterNamedTypes`
- ~~`@bindings` support for `Namespace` target~~ — server binding placement validation
- ~~`@apiVersion` decorator~~ — document-level versioning
- ~~Refactor `buildAsyncAPIDocument()`~~ — 315-line monolith → 116 lines + 8 builder files
- ~~Builder architecture~~ — operation-discovery, message-builder, operation-builder, channel-builder, server-builder, security-builder, shared-utils, types

### 4. Ecosystem Integration

Connect to the broader TypeSpec and AsyncAPI ecosystems.

Raw ideas:

- OpenAPI 3.x cross-emitter type sharing — `src/shared/` module is complete and tested; no external consumer yet
- `@asyncapi/generator` actual CLI testing — structural tests exist but never ran the real generator (Bun incompatibility)
- `--version` projection support — emitter currently always emits the latest version, ignoring TypeSpec's version projection flag

Recently completed:

- ~~`@typespec/versioning` support~~ — `getVersion()` reads `@versioned` enum for `info.version`
- ~~`@service` decorator integration~~ — `listServices()` → `info.title` fallback
- ~~Multi-file output~~ — `split-schemas` option, `schema-splitter.ts`
- ~~Cross-emitter shared module~~ — `src/shared/` exports with barrel contract tests

---

## Non-Goals

- We do NOT aim to replace the AsyncAPI specification itself
- We do NOT generate code (use AsyncAPI generator for that)
- We do NOT support AsyncAPI 2.x output (3.1 only)
- We do NOT build a VS Code extension (the TypeSpec VS Code extension already provides IDE support)
- We do NOT convert AsyncAPI 2.x specs to 3.x (use the official AsyncAPI converter)
- We do NOT build a plugin architecture for community protocol bindings (protocol bindings are defined in code, not extensible at runtime)
