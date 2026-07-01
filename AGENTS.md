# TypeSpec AsyncAPI Emitter - Agent Context

**Project:** Transform TypeSpec models into AsyncAPI 3.0 specifications
**Architecture:** AssetEmitter-based with custom TypeEmitter for schema generation
**Status:** Active Recovery — build clean, core emitter functional

---

## Quick Start

```bash
bun install           # Install dependencies
bun run build         # Build TypeScript → JavaScript (0 errors)
bun run lint          # Run ESLint
```

**Important:** `just` commands fail on NixOS (requires bash). Use `bun run` directly.

## Critical Constraints

- **Use `bun`**, never `npm` or `npx` (use `bunx` instead)
- **Build-before-test policy:** Tests won't run if TypeScript compilation fails
- **git commit --no-verify:** Pre-commit hook requires bash (NixOS doesn't have /bin/bash)
- **Effect.TS fully removed from src/** (only in test/ for legacy test compatibility)
- **All source files under 370 lines** (enforced)

## Architecture

- **Entry Point:** `src/index.ts` → exports `$onEmit` for TypeSpec compiler
- **Main Emitter:** `src/emitter.ts` — AsyncAPISchemaEmitter extends TypeEmitter from `@typespec/asset-emitter`
- **Decorators:** `lib/main.tsp` declares `@channel`, `@publish`, `@subscribe`, `@server`, `@message`, `@protocol`, `@security`, `@tags`, `@correlationId`, `@bindings`, `@header`
- **Decorator Implementations:** `src/minimal-decorators.ts` — thin wrappers, state writing delegated to `src/state-writers.ts`
- **State Management:** `src/state.ts` (consolidation), `src/state-compatibility.ts` (TypeSpec stateMap access)
- **Configuration:** `src/infrastructure/configuration/options.ts` — plain functions, no Effect.TS
- **Protocols:** `src/constants/protocols.ts` — single source of truth for all AsyncAPI protocols

## Source Files (1,660 total LOC)

```
src/lib.ts                              276  TypeSpec library definition + stateSymbols
src/minimal-decorators.ts               272  Decorator implementations
src/state-writers.ts                    171  State write functions (extracted from decorators)
src/infrastructure/configuration/options.ts  165  Options defaults + validation
src/emitter.ts                          345  AsyncAPI emitter (TypeEmitter-based)
src/state.ts                            151  State consolidation
src/domain/models/path-templates.ts     134  Path template parsing
src/infrastructure/configuration/asyncAPIEmitterOptions.ts  74  Options type
src/domain/models/serialization-format-option.ts  73  Format options
src/constants/index.ts                   43  Re-exports
src/state-compatibility.ts               41  TypeSpec stateMap access
src/decorators.ts                        40  TypeSpec decorator namespace
src/constants/protocols.ts               38  Protocol definitions (single source of truth)
src/index.ts                             15  Package entry point
src/tsp-index.ts                         12  TypeSpec integration
```

## TypeSpec Test Framework

```typescript
// OLD API (many existing tests):
const host = await createAsyncAPITestHost();
host.addTypeSpecFile("main.tsp", source);
await host.diagnose("./main.tsp", { emit: ["@lars-artmann/typespec-asyncapi"] });

// NEW API (createTester — preferred):
const tester = createTester(packageRoot, { libraries: [...] })
  .importLibraries()
  .using("TypeSpec.AsyncAPI")
  .emit("@lars-artmann/typespec-asyncapi", options);
const result = await tester.compile(source);
// Output in result.fs.fs (Map<string, string>)
```

## Decorator Signatures

Decorators accept BOTH `{}` (Model expression types) AND `#{}` (value literals):

```typescript
extern dec security(target: Operation | Namespace, config: {} | valueof Record<unknown>);
extern dec message(target: Model, config: {} | valueof Record<unknown>);
extern dec protocol(target: Operation | Model, config: {} | valueof Record<unknown>);
extern dec bindings(target: Operation | Model, value: {} | valueof Record<unknown>);
```

## Gotchas

- `SERIALIZATION_FORMAT_OPTION_JSON` is an object `{format, pretty, indent}`, not a string
- `emitFile` needs `emitterOutputDir` prefix or `mkdir ''` crashes in CLI mode
- `file-type` option can be string `"json"` or object `{ format: "json", pretty: true, indent: 2 }`
- `extractValue` in emitter.ts handles `EmitEntity` unwrapping from `@typespec/asset-emitter`
