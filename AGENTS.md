# TypeSpec AsyncAPI Emitter - Agent Context

**Project:** Transform TypeSpec models into AsyncAPI 3.0 specifications
**Architecture:** AssetEmitter-based with custom TypeEmitter for schema generation
**Status:** v0.1.0-alpha — build clean, 283 tests pass, 0 lint warnings

---

## Quick Start

```bash
bun install           # Install dependencies
bun run build         # Build TypeScript → JavaScript (0 errors)
bun run lint          # Run ESLint (0 errors, 0 warnings)
bun test              # Run tests (283 pass, 0 fail, 0 skip, 0 todo)
```

**Important:** Use `bun` and `bunx`, never `npm` or `npx`.

## Critical Constraints

- **Use `bun`**, never `npm` or `npx` (use `bunx` instead)
- **Build-before-test policy:** Tests won't run if TypeScript compilation fails
- **git commit --no-verify:** Pre-commit hook requires bash (NixOS doesn't have /bin/bash)
- **All source files under 370 lines** (enforced)
- **Zero `any` types in emitter.ts** (achieved)
- **ESLint config:** Clean, no Effect.TS-era rules (throw/try/catch/Promise allowed)

## Architecture

- **Entry Point:** `src/index.ts` → exports `$onEmit` for TypeSpec compiler
- **Main Emitter:** `src/emitter.ts` — AsyncAPISchemaEmitter extends TypeEmitter from `@typespec/asset-emitter`
- **Decorators:** `lib/main.tsp` declares all decorators + `EmitterOptions` model for IDE autocomplete
- **Decorator Implementations:** `src/minimal-decorators.ts` — thin wrappers, state writing delegated to `src/state-writers.ts`
- **State Management:** `src/state.ts` (consolidation), `src/state-compatibility.ts` (TypeSpec stateMap access)
- **Configuration:** `src/infrastructure/configuration/` — simplified to just types, no runtime validation
- **Protocols:** `src/constants/protocols.ts` — single source of truth for all AsyncAPI protocols
- **Document Model:** `src/domain/models/asyncapi-document.ts` — strongly-typed AsyncAPI 3.0 interfaces

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

## Gotchas

- Use `#{ url: "...", protocol: "..." }` syntax for `@server` (comma-separated, not semicolons)
- `SERIALIZATION_FORMAT_OPTION_JSON` is an object `{format, pretty, indent}`, not a string
- `emitFile` needs `emitterOutputDir` prefix or crashes in CLI mode
- The `extractValue` function uses discriminated union narrowing on `EmitEntity.kind`
- `Placeholder<T>` values are detected by checking for `onValue` method
