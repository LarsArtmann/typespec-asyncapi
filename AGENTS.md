# TypeSpec AsyncAPI Emitter - Agent Context

**Project:** Transform TypeSpec models into AsyncAPI 3.0 specifications
**Architecture:** AssetEmitter-based with custom TypeEmitter for schema generation
**Status:** Working — 348 tests pass, output validates against AsyncAPI 3.0.0 JSON schema

---

## Quick Start

```bash
bun install           # Install dependencies
bun run build         # Build TypeScript → JavaScript (0 errors)
bun test              # Run tests (348 pass, 0 fail)
bun run lint          # Run ESLint
```

**Important:** `just` commands fail on NixOS (requires bash). Use `bun run` directly.

## Critical Constraints

- **Use `bun`**, never `npm` or `npx` (use `bunx` instead)
- **Build-before-test policy:** Tests won't run if TypeScript compilation fails
- **git commit --no-verify:** Pre-commit hook requires bash (NixOS doesn't have /bin/bash)
- **Effect.TS fully removed from src/** (only in test/ for legacy test compatibility)
- **NO npx spawning in tests** — use programmatic TypeSpec compiler API via `test/utils/test-helpers.ts`

## Architecture

- **Entry Point:** `src/index.ts` → exports `$onEmit` for TypeSpec compiler
- **Main Emitter:** `src/emitter.ts` — builds `AsyncAPIDocument` from decorator state + generated schemas
- **Document Types:** `src/domain/models/asyncapi-document.ts` — strongly-typed AsyncAPI 3.0 interfaces
- **Decorators:** `lib/main.tsp` declares `@channel`, `@publish`, `@subscribe`, `@server`, `@message`, `@protocol`, `@security`, `@tags`, `@correlationId`, `@bindings`, `@header`
- **Decorator Implementations:** `src/minimal-decorators.ts` — thin wrappers, state writing delegated to `src/state-writers.ts`
- **State Management:** `src/state.ts` (consolidation), `src/state-compatibility.ts` (TypeSpec stateMap access)
- **Configuration:** `src/infrastructure/configuration/options.ts` — plain functions, no Effect.TS
- **Protocols:** `src/constants/protocols.ts` — single source of truth for all AsyncAPI protocols

## AsyncAPI 3.0 $ref Chain (CRITICAL)

The emitter MUST follow this $ref pattern per the AsyncAPI 3.0 spec:

```
operations.{opId}.messages[] → #/channels/{channelId}/messages/{messageId}
channels.{channelId}.messages.{messageId} → #/components/messages/{messageId}
components.messages.{messageId}.payload → #/components/schemas/{schemaName}
```

Operations MUST NOT reference `#/components/messages/` directly — they MUST go through the channel.

## Test Infrastructure

Use these helpers from `test/utils/test-helpers.ts`:

- `compileAsyncAPISpecWithoutErrors(source)` — compile + assert no errors
- `compileAsyncAPISpecRaw(source)` — compile, return raw diagnostics + output files
- `parseAsyncAPIOutput(outputFiles)` — find and parse the asyncapi YAML/JSON output

DO NOT use `createAsyncAPITestHost` from `library-test-helper.ts` — it's broken.
DO NOT spawn `npx tsp compile` — use the programmatic API instead.

## Decorator Signatures

Decorators accept BOTH `{}` (Model expression types) AND `#{}` (value literals):

```typescript
extern dec security(target: Operation | Namespace, config: {} | valueof Record<unknown>);
extern dec message(target: Model, config: {} | valueof Record<unknown>);
extern dec protocol(target: Operation | Model, config: {} | valueof Record<unknown>);
extern dec bindings(target: Operation | Model, value: {} | valueof Record<unknown>);
```

## Gotchas

- `emitFile` needs `emitterOutputDir` prefix or `mkdir ''` crashes in CLI mode
- `file-type` option can be string `"json"` or object `{ format: "json", pretty: true, indent: 2 }`
- `extractValue` in emitter.ts handles `EmitEntity` unwrapping from `@typespec/asset-emitter`
- Message names should use the MODEL name (from operation return type), not the operation name
- Tags are stored as `Tag[]` (`[{ name: "tag1" }, ...]`), not comma-separated strings

## Key Files

| File                                        | Purpose                                             |
| ------------------------------------------- | --------------------------------------------------- |
| `docs/POST-MORTEM-AND-RECOVERY-PLAN.md`     | Root cause analysis + execution plan                |
| `test/golden/golden-file.test.ts`           | Golden file test — locks in correct output          |
| `test/golden/ecommerce.expected.yaml`       | Reference output for e-commerce example             |
| `test/validation/schema-validation.test.ts` | Validates output against AsyncAPI 3.0.0 JSON schema |

## Rules for Future Sessions

1. **NO NEW PLANNING DOCUMENTS.** Execute the plan in `docs/POST-MORTEM-AND-RECOVERY-PLAN.md`.
2. **NO NEW FRAMEWORKS.** No Effect.TS, no branded types, no plugin systems.
3. **NO REWRITES.** The emitter works. Improve incrementally.
4. **VERIFY BEFORE CLAIMING.** Never claim "broken" without running `bun run build && bun test`.
5. **SPEC COMPLIANCE IS NON-NEGOTIABLE.** Always validate output against `@asyncapi/specs` JSON schema.
6. **DELETE DOCS, NOT CODE.** When in doubt, delete documentation noise, not working code.
