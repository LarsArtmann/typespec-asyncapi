# Contributing to TypeSpec AsyncAPI Emitter

## Development Setup

Requirements: Nix (flake) and pnpm. All commands run inside the dev shell.

```bash
git clone https://github.com/LarsArtmann/typespec-asyncapi
cd typespec-asyncapi
nix develop .#default
pnpm install
pnpm run build
pnpm run test
```

Use `pnpm` for everything. Never `npm`/`npx` in the workspace. Raw `.ts`
scripts run via `bun run` (Bun is kept solely for coverage tooling — see
Testing).

## Commands

```bash
pnpm run build              # TypeScript compilation (0 errors required)
pnpm run test               # Run the suite via vitest
pnpm run lint               # ESLint (type-aware, src/) + oxlint (all files)
pnpm run lint:eslint        # Faster iteration on the type-aware half
pnpm run lint:ox            # Faster iteration on the style half
pnpm run typecheck:test     # Typecheck the test suite (tsconfig.test.json)
pnpm run verify             # FULL gate: build + lint + typecheck + brand + tests + coverage gate + duplication
pnpm run duplicate          # jscpd structural-clone scan (0 clones required)
pnpm run check-examples     # Compile examples/ with 0 diagnostics + AJV-validate each
pnpm run brand:generate     # Regenerate brand SVGs/components (never edit them by hand)
pnpm run brand:check        # Byte-compare generated brand artifacts
```

`pnpm run verify` is the commit gate: every change must pass it before you
push. The pre-commit hook runs the same gate.

## Project Structure

```
src/
  index.ts                       $onEmit entry point
  emitter.ts                     Output writing, split-schemas handling
  schema-emitter.ts              AsyncAPISchemaEmitter (TypeEmitter-based)
  schema-generator.ts            generateSchemas() — the asset-emitter seam
  document-builder.ts            Document assembly; delegates to builders/
  builders/                      Channel/operation/message/server/components builders
  decorators.ts                  Unified decorator registry
  lib.ts                         TypeSpec library definition + diagnostics registry
  state.ts / state-writers.ts    Decorator state consolidation and writing
  shared/                        Cross-emitter exports (@lars-artmann/typespec-asyncapi/shared)
  validation/                    Binding validation
  constants/                     Protocols + generated binding specs
lib/
  main.tsp                       TypeSpec decorator declarations
test/
  utils/test-helpers.ts          Programmatic compilation API (createTester)
  compliance/                    AsyncAPI 3.1 spec-compliance suite (AJV-validated)
  golden/                        Golden-file locks (regenerate: bun run scripts/regenerate-golden.ts)
  unit/ integration/ e2e/ property/ realworld/ ...
scripts/                         Build/verification tooling (run via bun run)
examples/                        pnpm-workspace examples linking the emitter
website/                         Docs site (Astro/Starlight) — part of the workspace
```

## Architecture

The emitter extends `TypeEmitter` from `@typespec/asset-emitter` (same
approach as `@typespec/openapi3`). The flow is:

1. `$onEmit(context)` entry point
2. `consolidateAsyncAPIState(program)` reads decorator state into a typed `AsyncAPIConsolidatedState`
3. `generateSchemas(context)` uses the AssetEmitter to produce JSON schemas for models
4. `buildAsyncAPIDocument(state, schemas, options)` assembles the AsyncAPI 3.1 document
5. `emitFile()` writes YAML or JSON output

### AsyncAPI 3.1 `$ref` Chain

The document MUST follow this reference chain for spec compliance:

```
operations → #/channels/{id}/messages/{id}
channels → #/components/messages/{id}
components.messages → #/components/schemas/{name}
```

Operations MUST NOT reference `#/components/messages/` directly.

## Testing

Tests run on **Vitest** (Node) with the TypeSpec compiler testing API
(`createTester`). All compilation is programmatic via
`test/utils/test-helpers.ts` — no process spawning.

**Build before testing emitter changes.** The compiler loads the emitter
from `dist/` through a virtual filesystem — a stale `dist/` means you are
testing old code.

Coverage runs via `bun test --coverage` (not vitest/c8): only Bun's
runtime-level coverage sees the dynamically loaded `dist/*.js` files. The
gate (`scripts/coverage-gate.ts`) enforces 75% per file. Flake protection:
`scripts/coverage-run.ts` wraps the invocation with a summary check and
per-attempt logs under `coverage/flake-logs/`.

The diagnostics registry is count-locked: adding a code in `src/lib.ts`
requires updating the documented count (see `test/unit/diagnostic-count.test.ts`).

### Golden Files

`test/golden/` locks verified-correct output byte-for-byte. If your change
intentionally alters output, regenerate with `bun run
scripts/regenerate-golden.ts` and verify the new output is spec-compliant
before committing the new fixtures.

### Schema Validation

The compliance suite validates emitter output against the official
AsyncAPI 3.1.0 JSON Schema via AJV (`compileAndValidateOrThrow()`).

## Pull Request Checklist

- Full gate passes: `pnpm run verify`
- Output is spec-compliant (compliance suite + golden files + AJV)
- New features include tests (compliance or golden coverage)
- New diagnostics are declared in `src/lib.ts` with the count updated
- Breaking changes are documented in CHANGELOG.md

## Commit Messages

Follow conventional commits:

```
feat: add @correlationId decorator support
fix: correct $ref chain for multi-channel operations
refactor: remove dead dependencies
docs: update README with correct syntax
```

## Code Style

- TypeScript strict mode with `noUncheckedIndexedAccess`
- Source files under 400 lines (oxlint-enforced); extract when approaching
- No `any` types in source code
- Functional style: pure functions, early returns, composition
- Match existing patterns in the codebase
