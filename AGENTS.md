# TypeSpec AsyncAPI Emitter - Agent Context

**Project:** Transform TypeSpec models into AsyncAPI 3.0 specifications
**Architecture:** AssetEmitter-based with custom TypeEmitter for schema generation
---

## Quick Start

```bash
bun install           # Install dependencies
bun run build         # Build TypeScript → JavaScript (0 errors)
bun run lint          # Run ESLint (0 errors, 0 warnings)
bun test              # Run tests (301 pass, 0 fail)
```

**Important:** Use `bun` and `bunx`, never `npm` or `npx`.

## Critical Constraints

- **Use `bun`**, never `npm` or `npx` (use `bunx` instead)
- **Build-before-test policy:** Tests won't run if TypeScript compilation fails
- **git commit --no-verify:** Pre-commit hook requires bash (NixOS doesn't have /bin/bash)
- **All source files under 370 lines** (enforced)
- **Coverage gate at 75%** per-file minimum (scripts/coverage-gate.ts)
- **Diagnostic pipeline unified:** All compilation APIs use `compileAndDiagnose()` — decorator diagnostics always surface
- **Zero `any` types in emitter.ts** (achieved)
- **ESLint config:** Clean, no Effect.TS-era rules (throw/try/catch/Promise allowed)

## Architecture

- **Entry Point:** `src/index.ts` → exports `$onEmit` for TypeSpec compiler
- **Emitter (4 files, split from original 831-line monolith):**
  - `src/emitter.ts` (39 lines) — `$onEmit` entry point, writes output file
  - `src/schema-emitter.ts` (356 lines) — `AsyncAPISchemaEmitter` class extends `TypeEmitter<SchemaObject, AsyncAPIEmitterOptions>`, overrides `modelDeclaration`, `union`, `enum`, `intrinsic`, `scalar`, etc. Contains `extractValue()` and `generateSchemas()`
  - `src/document-builder.ts` (366 lines) — `buildAsyncAPIDocument()` assembles channels, operations, messages, schemas, security from TypeSpec state. Handles `$ref` chain construction
  - `src/intrinsic-mapping.ts` (59 lines) — `intrinsicToSchema()` maps TypeSpec scalar names to JSON Schema types (~30 cases)
- **Decorators:** `lib/main.tsp` declares all decorators + `EmitterOptions` model for IDE autocomplete
- **Decorator Implementations:** `src/minimal-decorators.ts` (321 lines) — thin wrappers with runtime validation, helpers in `src/decorator-helpers.ts`, state writing delegated to `src/state-writers.ts`
- **State Management:** `src/state.ts` (consolidation), `src/state-compatibility.ts` (TypeSpec stateMap access)
- **Configuration:** `src/infrastructure/configuration/` — simplified to just types, no runtime validation
- **Protocols:** `src/constants/protocols.ts` — single source of truth for all AsyncAPI protocols (const array → derived type → runtime Set + type guard)
- **Security Scheme Types:** `src/domain/models/asyncapi-document.ts` — same pattern as protocols: `SECURITY_SCHEME_TYPES` const array → `SecuritySchemeType` union → `isValidSchemeType` runtime guard
- **Document Model:** `src/domain/models/asyncapi-document.ts` — strongly-typed AsyncAPI 3.0 interfaces with `OAuth2Flows`, `ProtocolBindings`, `SecuritySchemeType` types. No index signatures except `SchemaObject` (standard JSON Schema extension pattern)

## AsyncAPI 3.0 `$ref` Chain

The document MUST follow this reference chain:

```
operations → #/channels/{id}/messages/{id}
channels → #/components/messages/{id}
components.messages → #/components/schemas/{name}
```

Nested model properties also use `$ref` for named user-defined models:

```
components.schemas.User.properties.address → #/components/schemas/Address
```

## TypeSpec Test Framework

Tests use `bun:test` with the TypeSpec compiler testing API (`createTester`). All compilation is programmatic via `test/utils/test-helpers.ts` — no process spawning.

### Test Helpers (3 files, consolidated from 7)

- `test/utils/test-helpers.ts` — `compileAsyncAPI`, `compileAsyncAPISpecRaw`, `compileAsyncAPISpecWithoutErrors`
- `test/utils/cli-test-helpers.ts` — CLI-compatible wrapper
- `test/utils/type-guards.ts` — Type assertion utilities

### Key Tests

- `test/golden/golden-file.test.ts` — Locks verified-correct output (3 tests)
- `test/validation/schema-validation.test.ts` — Validates against AsyncAPI 3.0 JSON Schema via AJV
- `test/integration/decorator-output.test.ts` — Verifies @tags, @correlationId, @header, @bindings in output
- `test/integration/negative-tests.test.ts` — Error handling edge cases

## Decorator Signatures

Decorators accept BOTH `{}` (Model expression types) AND `#{}` (value literals):

```typescript
extern dec security(target: Operation | Namespace, config: {} | valueof Record<unknown>);
extern dec message(target: Model, config: {} | valueof Record<unknown>);
extern dec protocol(target: Operation | Model, config: {} | valueof Record<unknown>);
extern dec bindings(target: Operation | Model, value: {} | valueof Record<unknown>);
```

## `EmitEntity<T>` Discriminated Union Pattern

The `@typespec/asset-emitter` API returns `EmitEntity<T>` objects that must be narrowed before extracting values. The `extractValue()` function in `schema-emitter.ts` handles this:

```typescript
export function extractValue(entity: EmitEntity<SchemaObject> | undefined): SchemaObject {
  if (!entity) return {};
  switch (entity.kind) {
    case "declaration":
    case "code": {
      const v = entity.value;
      // Must filter out Placeholder<T> — detected via duck-typing onValue
      if (!v || typeof v !== "object") return {};
      if (typeof (v as { onValue?: unknown }).onValue === "function") return {};
      return v as SchemaObject;
    }
    default:
      return {};
  }
}
```

Key points:

- `entity.kind` narrows the discriminated union: `"declaration"`, `"code"`, `"none"`, `"circular"`
- Only `"declaration"` and `"code"` have a `.value` property
- `Placeholder<T>` objects (lazy values) are detected by checking for an `onValue` function — they must NOT be treated as final values
- `"none"` and `"circular"` kinds return empty objects

## Gotchas

- Use `#{ url: "...", protocol: "..." }` syntax for `@server` (comma-separated, not semicolons)
- `SERIALIZATION_FORMAT_OPTION_JSON` is an object `{format, pretty, indent}`, not a string
- `emitFile` needs `emitterOutputDir` prefix or crashes in CLI mode
- `Placeholder<T>` values are detected by checking for `onValue` method (see `EmitEntity<T>` pattern above)
- **Two compilation APIs unified:** `compileAsyncAPI` now uses `tester.compileAndDiagnose()` (same as `compileRaw`). All compilation APIs consistently surface decorator-reported diagnostics. No more split-brain.
- **Channel addresses with `/` are JSON-pointer-escaped:** `$ref` tokens use `~1` for `/` and `~0` for `~` per RFC 6901. Object keys stay raw.
- `file-type` option can be string `"json"` or object `{ format: "json", pretty: true, indent: 2 }`
- **Arrays of named models:** `Item[]` must emit `items: { $ref: "#/components/schemas/Item" }`, not `items: { type: "string" }`. Fixed via `refForNamedType()` helper in `schema-emitter.ts`. The root cause was `emitTypeReference` returning `NoEmit` for declaration refs, and `extractValue` returning `{}`, causing fallback to `intrinsicToSchema(modelName)` → `{type:"string"}`.
- **`Record<string>` maps to `{ type: "object", additionalProperties: { type: "string" } }`**, NOT `type: "array"`. The indexed-model case in `typeToSchema()` was incorrectly producing arrays.
- **AsyncAPI 3.0 binding key names:** The binding object key MUST match the official schema — `ws` (not `websocket`/`websockets`), `kafka`, `http`, `amqp`, etc. The emitter uses the `protocol:` value from `@protocol` as the binding key.
- **Kafka binding placement:** Channel bindings allow `topic`, `partitions`, `replicas`, `topicConfiguration`, `bindingVersion`. Operation bindings allow only `groupId`, `clientId`, `bindingVersion`. Message bindings allow `key`, `schemaIdLocation`, `schemaIdPayloadEncoding`, `schemaLookupStrategy`, `bindingVersion`. All require `bindingVersion` for schema validation.
- **OAuth2 scopes:** AsyncAPI 3.0 uses `availableScopes` (not `scopes`) in OAuth2 flow objects. Must be a map `{scopeName: "description"}`, not an array.
- **TypeSpec value literals (`#{}`):** Property names must be valid identifiers — `const` is reserved (can't use as key), and quoted keys like `"retention.ms"` are not supported.
