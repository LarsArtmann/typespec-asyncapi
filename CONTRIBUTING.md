# Contributing to TypeSpec AsyncAPI Emitter

## Development Setup

```bash
git clone https://github.com/LarsArtmann/typespec-asyncapi
cd typespec-asyncapi
bun install
bun run build
bun test
```

## Commands

```bash
bun run build         # TypeScript compilation (0 errors required)
bun test              # Run test suite
bun run lint          # ESLint on src/
bun run typecheck     # Type check without emit
bun run check         # typecheck + lint
```

## Project Structure

```
src/
  emitter.ts                              Main AsyncAPI emitter (TypeEmitter-based)
  lib.ts                                  TypeSpec library definition + state symbols
  minimal-decorators.ts                   Decorator implementations
  state.ts                                State consolidation
  state-writers.ts                        State write functions
  infrastructure/configuration/           Emitter options
  domain/models/                          Typed document model, path templates
  constants/                              Protocol definitions
lib/
  main.tsp                                TypeSpec decorator declarations
test/
  utils/test-helpers.ts                   Programmatic compilation API
  golden/                                 Golden file tests (lock verified output)
  validation/                             AsyncAPI 3.0 JSON Schema validation
  integration/                            End-to-end compilation tests
examples/
  simple/                                 Working example with expected output
```

## Architecture

The emitter extends `TypeEmitter` from `@typespec/asset-emitter` (same approach as `@typespec/openapi3`). The flow is:

1. `$onEmit(context)` entry point
2. `consolidateAsyncAPIState(program)` reads decorator state into a typed `AsyncAPIConsolidatedState`
3. `generateSchemas(context)` uses the AssetEmitter to produce JSON schemas for models
4. `buildAsyncAPIDocument(state, schemas, options)` assembles the AsyncAPI 3.0 document
5. `emitFile()` writes YAML or JSON output

### AsyncAPI 3.0 `$ref` Chain

The document MUST follow this reference chain for spec compliance:

```
operations → #/channels/{id}/messages/{id}
channels → #/components/messages/{id}
components.messages → #/components/schemas/{name}
```

Operations MUST NOT reference `#/components/messages/` directly.

## Testing

Tests use `bun:test` and the TypeSpec compiler testing API (`createTester`). All compilation is done programmatically via `test/utils/test-helpers.ts` — no process spawning.

### Golden File Test

`test/golden/golden-file.test.ts` locks verified-correct output. If your change alters output, update `test/golden/ecommerce.expected.yaml` and verify the new output is spec-compliant.

### Schema Validation

`test/validation/schema-validation.test.ts` validates emitter output against the official AsyncAPI 3.0.0 JSON Schema via AJV.

## Pull Request Checklist

- Build passes: `bun run build`
- Tests pass: `bun test`
- Lint passes: `bun run lint`
- Output is spec-compliant (golden file test + schema validation)
- New features include tests
- Breaking changes are documented

## Commit Messages

Follow conventional commits:

```
feat: add @correlationId decorator support
fix: correct $ref chain for multi-channel operations
refactor: remove dead dependencies
docs: update README with correct syntax
```

## Code Style

- TypeScript strict mode
- Source files under 370 lines (enforced)
- No `any` types in source code
- Functional style: pure functions, early returns, composition
- Match existing patterns in the codebase
