# Roadmap

> Long-term direction and raw ideas. Items here are NOT actionable tasks.
> When an idea is refined into bounded work, it moves to TODO_LIST.md.
> See FEATURES.md for the honest feature inventory; CHANGELOG.md for release history.

## Current State

Pre-release (`0.2.0-beta`). The emitter produces spec-compliant AsyncAPI 3.1 output validated against the official JSON Schema. **1017 tests** pass across 84 files (0 skip, 0 todo). Oxlint and ESLint both clean (0 errors, 0 warnings). **25 diagnostic codes** (19 error + 6 warning), all compile-time validated. **26 decorators** declared in `lib/main.tsp` (16 emitter + 10 reusable-component), plus **16 TypeSpec stdlib constraint/metadata mappings** in `src/constraint-mapper.ts`. Full protocol binding support for all **22 AsyncAPI protocols** (auto-generated from `@asyncapi/specs`) with auto-versioning, key normalization, field-level validation, and placement validation. Model inheritance emits `allOf`, model-variant unions emit `oneOf`, `@discriminator` enables polymorphic patterns with auto-required enforcement. `@typespec/versioning` integrated for `info.version`. Operation/channel `@summary`, message `title`/`examples`, `info.tags`, channel/server tags, and reusable `components.*` (operationTraits, messageTraits, parameters, correlationIds, operation/message/server/channel bindings, tags) all populated. Operation traits extract `security`/`tags`/`bindings`; message traits extract `headers`/`correlationId`/`summary`/`tags`/`bindings`. `@tags` accepts both string arrays and rich tag objects with `description`/`externalDocs`. `@parameter` validates `location` against the `$message.#` runtime-expression pattern. **Zero code duplication** (jscpd 0% threshold). **97.4% coverage** average. Cross-emitter shared module (`src/shared/`) exports `JsonSchema`, `extractValue`, `intrinsicToSchema`, and `AsyncAPISchemaEmitter` for reuse.

---

## Themes

### 1. Spec Compliance Depth

Push toward complete AsyncAPI 3.1 coverage — every field, every binding, every edge case.

Raw ideas:

- Support multi-format schemas (`schemaFormat`, Avro/Protobuf payload) per AsyncAPI 3.1 — allow `@schemaFormat` decorator to set message-level schema format
- Reusable server definitions (`components.servers`) — `@reusableServer` + `@useServer` pattern matching the reusable binding/trait model
- Reactive streaming patterns — server-sent events (SSE), WebSocket subprotocol negotiation, Kafka consumer group rebalance semantics
- Message correlation beyond simple `$ref` location — support `@correlationId` on operations (not just models) for reply correlation
- AsyncAPI 3.1 `channel.servers` field — bind channels to specific servers from the server list
- Top-level `defaultContentType` validation — ensure the `@defaultContentType` value is a valid MIME type

### 2. Developer Experience

Make the emitter a joy to use and maintain.

Raw ideas:

- Add a docs-entropy CI guard that flags when living docs drift from code counts (e.g. test count in FEATURES.md vs `vitest run` output)
- Split `./shared` subpath into neutral (`./shared`) vs AsyncAPI-bound (`./asyncapi`) entry points so neutral consumers pay zero AsyncAPI runtime cost
- Document which `@parameter`/`@reusableBinding` config fields are unreachable via TypeSpec `#{}` syntax (`enum`, `const`, and other reserved keywords cannot be property keys in value literals)

### 3. Architecture

Keep the codebase honest as it grows.

Raw ideas:

- TypeSpec 1.14.0 upgrade (currently on 1.13.0) — includes auto decorators, `.ts` module imports, memory leak fix, entrypoint resolution fix
- Type safety: tighten `OperationObject.action` to required, add `SecurityScheme.description`
- Move generic utilities (`applyOverrides`, `collectNamesInto`) to a shared `src/util/` module
- Property-based and snapshot testing infrastructure — generate random constraint combinations and verify AJV always passes; lock exact JSON Schema per decorator

### 4. Ecosystem Integration

Connect to the broader TypeSpec and AsyncAPI ecosystems.

Raw ideas:

- OpenAPI 3.x cross-emitter type sharing — `src/shared/` module is complete and tested; no external consumer exists yet. Building a separate OpenAPI emitter would be a multi-day project.
- `@asyncapi/generator` actual CLI testing — structural tests exist but the real generator has never been run against emitter output (Bun incompatibility with `@asyncapi/parser`'s Spectral ruleset)
- `--version` projection support — emitter currently always emits the latest version, ignoring TypeSpec's version projection flag

---

## Non-Goals

- We do NOT aim to replace the AsyncAPI specification itself
- We do NOT generate code (use AsyncAPI generator for that)
- We do NOT support AsyncAPI 2.x output (3.1 only)
- We do NOT build a VS Code extension (the TypeSpec VS Code extension already provides IDE support)
- We do NOT convert AsyncAPI 2.x specs to 3.x (use the official AsyncAPI converter)
- We do NOT build a plugin architecture for community protocol bindings (protocol bindings are defined in code, not extensible at runtime)
