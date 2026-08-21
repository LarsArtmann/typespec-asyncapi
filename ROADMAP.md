# Roadmap

> Long-term direction and raw ideas. Items here are NOT actionable tasks.
> When an idea is refined into bounded work, it moves to TODO_LIST.md.
> See FEATURES.md for the honest feature inventory; CHANGELOG.md for release history.

## Current State

Pre-release (`0.2.1-beta`). The emitter produces spec-compliant AsyncAPI 3.1 output validated against the official JSON Schema. **1000+ tests** pass across 85+ files (0 skip, 0 todo). Oxlint and ESLint both clean (0 errors, 0 warnings). **25 diagnostic codes** (19 error + 6 warning), all compile-time validated. **26 decorators** declared in `lib/main.tsp` (16 emitter + 10 reusable-component), plus **16 TypeSpec stdlib constraint/metadata mappings** in `src/constraint-mapper.ts`. Full protocol binding support for all **22 AsyncAPI protocols** (auto-generated from `@asyncapi/specs`) with auto-versioning, key normalization, field-level validation, and placement validation. Model inheritance emits `allOf`, model-variant unions emit `oneOf`, `@discriminator` enables polymorphic patterns with auto-required enforcement. `@typespec/versioning` integrated for `info.version`. Operation/channel `@summary`, message `title`/`examples`, `info.tags`, channel/server tags, and reusable `components.*` (operationTraits, messageTraits, parameters, correlationIds, operation/message/server/channel bindings, tags) all populated. Operation traits extract `security`/`tags`/`bindings`; message traits extract `headers`/`correlationId`/`summary`/`tags`/`bindings`. `@tags` accepts both string arrays and rich tag objects with `description`/`externalDocs`. `@parameter` validates `location` against the `$message.#` runtime-expression pattern. **Zero code duplication** (jscpd 0% threshold). **~97% coverage** average. Cross-emitter shared module (`src/shared/`) exports `JsonSchema`, `extractValue`, `intrinsicToSchema`, and `AsyncAPISchemaEmitter` for reuse.

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

#### EFv1 (`@typespec/asset-emitter`) containment and eventual removal

Research findings (2026-08-21, from primary sources):

- `@typespec/asset-emitter` package description says "to be replaced by the new
  emitter framework" — terminal, but slowly.
- EFv2 (`@typespec/emitter-framework`, merged to typespec main 2025-03, now
  0.20.0-still-0.x) is built on alloy-js + tree-sitter: its design center is
  source-code emitters (js/csharp/java/python clients). Only those use it.
- Microsoft's own data-document emitters (`openapi3`, `json-schema`) still use
  EFv1 on typespec main TODAY. EFv1 lives as long as openapi3 lives.
- Our exposure is confined: 5 files, ~490 lines, all in schema generation.
  `extract-value.ts` exists only to fight EFv1's `EmitEntity`/`Placeholder`.
  The document pipeline (11 builders) never touches asset-emitter.

Plan:

1. **Contain (v0.3.0): DONE (M14, 2026-08-21).** ESLint `no-restricted-imports`
   bans `@typespec/asset-emitter` everywhere under `src/` except the
   three-file schema seam (`schema-generator.ts`, `schema-emitter.ts`,
   `extract-value.ts`); the document pipeline (11 builders) never touches
   asset-emitter. CI enforces it via `pnpm run lint`.
2. **Monitor:** the trigger is `openapi3`'s package.json gaining
   `@typespec/emitter-framework` (or asset-emitter being marked deprecated on
   npm). Check quarterly.
3. **Rewrite (v0.4.0 headline or when trigger fires):** replace the
   `TypeEmitter` subclass (~15 overrides, `src/schema-emitter.ts`) with a
   direct recursive type-to-JsonSchema walker. Kills `extract-value.ts`, the
   Placeholder gotchas, the deprecation risk, and neutralizes the competing
   emitter's only architectural differentiator. Our 1286-test suite + golden
   files + AJV validation de-risk this specifically. Must preserve:
   declaration dedup/naming (including template instantiation names — check
   golden files for current naming), circular-ref handling (in-progress set),
   and the `src/shared/` public API.
4. **Never adopt EFv2** for this emitter — wrong tool for data documents.

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
