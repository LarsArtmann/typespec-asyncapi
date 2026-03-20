# TypeSpec AsyncAPI Emitter - Agent Context

**Project:** Transform TypeSpec models into AsyncAPI 3.0 specifications  
**Architecture:** AssetEmitter-based with Effect.TS functional patterns  
**Status:** Infrastructure Recovery Mode - basic features work, advanced disabled

---

## Quick Start

```bash
bun install           # Install dependencies
just build            # Build TypeScript → JavaScript (0 errors target)
just test             # Run test suite (builds first)
just lint             # Run ESLint
```

## Critical Constraints

- **Use `just` commands**, not raw `bun` or `npm` directly
- **Use `bun`**, never `npm` or `npx` (use `bunx` instead)
- **Build-before-test policy:** Tests won't run if TypeScript compilation fails
- **5,745 lines disabled:** Complex infrastructure files temporarily removed to fix TS errors

## Architecture Notes

- **Entry Point:** `src/index.ts` exports `$onEmit` for TypeSpec compiler
- **Main Emitter:** `src/asyncapi-emitter.ts` - AssetEmitter architecture
- **Decorators:** `lib/main.tsp` defines `@channel`, `@publish`, `@subscribe`, `@server`
- **Effect.TS:** Railway programming for error handling, `@effect/schema` for validation

## Project Structure

```
lib/         # TypeSpec library (decorators)
src/         # TypeScript emitter implementation
test/        # Test suites (Bun test runner)
examples/    # Example TypeSpec files
docs/        # Documentation and ADRs
```

## Essential Commands

| Command | Purpose |
|---------|---------|
| `just build` | Compile TypeScript (must pass 0 errors) |
| `just test` | Run all tests |
| `just lint` | Run ESLint |
| `just typecheck` | Type check without emitting |
| `just quality-check` | Full CI pipeline |

## TypeSpec Compilation

```bash
bunx tsp compile examples/complete-example.tsp --emit @lars-artmann/typespec-asyncapi
```

## Current Limitations

- Does NOT support `@typespec/versioning` decorators
- Plugin system disabled (src/plugins/core/PluginSystem.ts)
- Advanced state management disabled
- Performance monitoring broken (missing service layer)

---

_Last updated: March 20, 2026_
