# TypeSpec AsyncAPI Emitter - Agent Context

**Project:** Transform TypeSpec models into AsyncAPI 3.0 specifications
**Architecture:** Custom emitter with Effect.TS functional patterns
**Status:** Active Recovery - 255/408 tests pass, CLI works, core decorators functional

---

## Quick Start

```bash
bun install           # Install dependencies
bun run build         # Build TypeScript → JavaScript (0 errors)
bun test              # Run test suite (408 tests, 255 pass)
bun run lint          # Run ESLint
```

**Important:** `just` commands fail on NixOS (requires bash). Use `bun run` directly.

## Test Results (Current)

```
255 pass | 120 fail | 29 skip | 4 todo | 68 files
```

The 120 failing tests are almost all about **emitter feature gaps** — the emitter generates
channels and messages but doesn't yet produce component schemas, operations, or security schemes
in the output. These are NOT infrastructure issues.

## Critical Constraints

- **Use `bun`**, never `npm` or `npx` (use `bunx` instead)
- **Build-before-test policy:** Tests won't run if TypeScript compilation fails
- **git commit --no-verify:** Pre-commit hook requires bash (NixOS doesn't have /bin/bash)
- **Effect.TS v3.21.2:** Used for options validation, mostly overkill for this project

## Architecture

- **Entry Point:** `src/index.ts` exports `$onEmit` for TypeSpec compiler
- **Main Emitter:** `src/emitter.ts` - generates AsyncAPI YAML/JSON from decorator state
- **Decorators:** `lib/main.tsp` - `@channel`, `@publish`, `@subscribe`, `@server`, `@message`, `@protocol`, `@security`, `@tags`, `@correlationId`, `@bindings`, `@header`
- **Decorator Implementations:** `src/minimal-decorators.ts` - handles both `{}` (Model types) and `#{}` (value literals)
- **State Management:** `src/state.ts`, `src/state-compatibility.ts`
- **Configuration:** `src/infrastructure/configuration/options.ts` - options validation with Effect.TS

## TypeSpec Test Framework

```typescript
// OLD API (still used by many tests):
const host = await createAsyncAPITestHost();
host.addTypeSpecFile("main.tsp", source);
await host.diagnose("./main.tsp", { emit: ["@lars-artmann/typespec-asyncapi"] });
// Output in host.fs (Map<string, string>), keys like "/test/asyncapi.yaml"

// NEW API (createTester):
const tester = createTester(packageRoot, { libraries: [...] })
  .importLibraries()
  .using("TypeSpec.AsyncAPI")
  .emit("@lars-artmann/typespec-asyncapi", options);
const result = await tester.compile(source);
// Output in result.fs.fs (Map<string, string>), NOT in result.outputs
```

**Key insight:** `emitFile()` writes to `program.host.writeFile()` which populates the virtual
filesystem. The file appears at paths like `/test/asyncapi.yaml` or `/test/tsp-output/@lars-artmann/typespec-asyncapi/asyncapi.yaml`.

## Decorator Signatures

Decorators accept BOTH `{}` (Model expression types) AND `#{}` (value literals):
```typescript
extern dec security(target: Operation | Namespace, config: {} | valueof Record<unknown>);
extern dec message(target: Model, config: {} | valueof Record<unknown>);
extern dec protocol(target: Operation | Model, config: {} | valueof Record<unknown>);
extern dec bindings(target: Operation | Model, value: {} | valueof Record<unknown>);
```

## Project Structure

```
lib/                                    # TypeSpec library (decorator declarations)
src/                                    # TypeScript emitter implementation
  emitter.ts                            # $onEmit entry point
  minimal-decorators.ts                 # Decorator JS implementations
  state.ts                              # State management via TypeSpec stateMap
  infrastructure/configuration/         # Options types and validation
test/                                   # Test suites (Bun test runner)
  utils/test-helpers.ts                 # Main test helper (compileAndGetAsyncAPI etc.)
  utils/emitter-test-helpers.ts         # createTester-based helpers
examples/                               # Example TypeSpec files
docs/                                   # Documentation and ADRs
```

## Remaining Work (Priority Order)

1. **Emitter schema generation** — Generate `components.schemas` from TypeSpec models
2. **Emitter operations** — Generate publish/subscribe operations in output
3. **Emitter security** — Include security schemes in output
4. **Fix OAuth2 test syntax** — 21 tests use `"api:read": "API read"` which is invalid TypeSpec
5. **Remove Effect.TS dependency** — Overkill for options validation, adds complexity
6. **Extract protocols constant** — `supportedProtocols` in minimal-decorators.ts should be ReadonlySet
7. **Fix state-compatibility.ts** — Silent error swallowing on version mismatches

## Gotchas

- `host.fs` is `TestFileSystem` (has `.fs` Map), `runner.fs` is `Map<string, string>` directly
- `createTestWrapper` returns `{ fs: host.fs }` — they're the same Map
- `compileAndDiagnose()` returns `[Record<string, Type>, Diagnostic[]]`
- Options must be passed via `CompilerOptions.options[emitterName]` (nested Record)
- `SERIALIZATION_FORMAT_OPTION_JSON` is an object `{format, pretty, indent}`, not a string
- `emitFile` needs `emitterOutputDir` prefix or `mkdir ''` crashes in CLI mode

---

_Last updated: May 16, 2026_
