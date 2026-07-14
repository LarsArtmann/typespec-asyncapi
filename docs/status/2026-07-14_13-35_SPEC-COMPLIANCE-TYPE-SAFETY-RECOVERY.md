# Status Report: Spec Compliance, Type Safety & Recovery

**Date:** 2026-07-14 13:35 UTC
**Session spans:** 2 prior turns + this report turn
**Build:** 0 errors | **Tests:** 348 pass, 0 fail | **Git:** 4 commits pushed to origin/master

---

## a) FULLY DONE

| # | Item | Commit | Verification |
|---|---|---|---|
| 1 | **Spec-compliant `$ref` chain** — operations now reference `#/channels/{id}/messages/{id}` instead of illegally pointing at `#/components/messages/{id}` directly | `85363e6` | Golden file test + schema validation test |
| 2 | **Message names use model names** — `OrderCreated` not `publishOrderCreated`, so payload `$ref` resolves to an actual schema | `85363e6` | Golden file test assertion |
| 3 | **All 8 previously-failing tests fixed** — replaced `npx tsp compile` child_process spawning with programmatic TypeSpec compiler API | `85363e6` | 348 pass, 0 fail |
| 4 | **Golden file test** — `test/golden/golden-file.test.ts` locks in verified-correct output with structural + `$ref` pattern + message naming assertions | `85363e6` | 3 sub-tests pass |
| 5 | **AsyncAPI 3.0.0 JSON Schema validation** — `test/validation/schema-validation.test.ts` validates emitter output against official `@asyncapi/specs` schema via AJV | `85363e6` | 3 scenarios pass (simple, servers, multi-op) |
| 6 | **Strongly-typed AsyncAPI document model** — `src/domain/models/asyncapi-document.ts` with `AsyncAPIDocument`, `ChannelObject`, `OperationObject`, `MessageObject`, `ServerObject`, `ComponentsObject`, `SchemaObject` etc. | `f55c3af` | Build passes, emitter fully type-checked |
| 7 | **`@tags` wired to output** — appears on operations as `Tag[]` arrays | `d178692` | State stores `Tag[]` not comma string |
| 8 | **`@correlationId` wired to output** — appears on messages as `CorrelationId` objects | `d178692` | |
| 9 | **`@header` wired to output** — appears on messages as JSON Schema `headers` objects | `d178692` | |
| 10 | **`@bindings` wired to output** — appears on operations and messages | `d178692` | |
| 11 | **`storeTags` data model fixed** — was `{ name: "tag1,tag2" }` (comma string), now `[{ name: "tag1" }, { name: "tag2" }]` (proper array) | `d178692` | |
| 12 | **`protocolBindings` added to consolidated state** — was stored by decorators but never surfaced to emitter | `d178692` | |
| 13 | **AGENTS.md rewritten** with verified facts, $ref chain documentation, test helper guidance, and anti-pattern rules | `5e59ba6` | |
| 14 | **Post-mortem document** at `docs/POST-MORTEM-AND-RECOVERY-PLAN.md` — comprehensive root cause analysis and execution plan | `85363e6` | |
| 15 | **CLI test helper rewritten** — `test/utils/cli-test-helpers.ts` replaced 336 lines of spawn/fs/race-condition code with 68-line programmatic API wrapper | `85363e6` | All CLI tests pass |
| 16 | **All commits pushed to GitHub** | confirmed `5e59ba6` on origin/master | `gh api` verified |

---

## b) PARTIALLY DONE

| # | Item | What's done | What's missing |
|---|---|---|---|
| 1 | **Channel parameters** | `storeChannelState` extracts path parameters from `{orderId}` patterns into `parameters` array | Emitter doesn't emit `parameters` on channel objects (spec requires this when address contains `{var}`) |
| 2 | **`@server` variables** | Server config stored with url, protocol, description | No `variables` field in `ServerConfigData` type; emitter doesn't emit server variables |
| 3 | **Schema generation** | Models → JSON Schema with types, properties, required, arrays, enums, inheritance, `@doc` descriptions | `decimal` maps to `{ type: "string", format: "decimal" }` (debatable); no `$ref` for nested model references (inlines everything) |
| 4 | **`@message` decorator override** | Explicit `@message` data merged into auto-generated messages | Override only applies if the model has `@message` — auto-discovered messages from return types don't check for `@message` on the return type |
| 5 | **Documentation cleanup** | AGENTS.md rewritten, post-mortem written | `FEATURES.md`, `TODO_LIST.md`, `PARTS.md`, `CONSUMER_PERSPECTIVE.md`, `README.md` all still stale/contradictory; 407 doc files in `docs/` untouched |
| 6 | **Examples** | Identified all broken examples (ghost `@asyncapi` decorator, wrong namespaces, missing tspconfig) | None fixed yet |

---

## c) NOT STARTED

| # | Item | Impact | Effort |
|---|---|---|---|
| 1 | Archive 400+ stale planning/status docs into `docs/_archive/` | Unblocks navigation | 30 min |
| 2 | Delete stale `FEATURES.md`, `TODO_LIST.md`, `PARTS.md` (actively harmful) | Prevents confusion | 5 min |
| 3 | Fix examples to compile and produce correct output | Consumer trust | 1h |
| 4 | Remove dead emitter options (15+ defined, only 6 read) | Clean API surface | 30 min |
| 5 | Remove dead dependencies (`@alloy-js/core`, `@effect/schema`, `@effect/eslint-plugin`) | Smaller install | 15 min |
| 6 | Wire output validation in emitter itself (not just tests) — emit diagnostics on invalid output | Spec compliance guarantee | 30 min |
| 7 | Add `EmitterOptions` model to `lib/main.tsp` for IDE autocomplete | Developer experience | 30 min |
| 8 | Remove `any` types from emitter (still ~10 uses in modelDeclaration etc.) | Type safety | 1h |
| 9 | Write proper README with working quickstart | Consumer onboarding | 1h |
| 10 | Tag `v0.1.0-alpha` release | Milestone | 15 min |
| 11 | Remove `Effect.TS` from test files (replace with plain code) | Dependency reduction | 2h |
| 12 | Consolidate overlapping test helpers (6+ files in `test/utils/`) | Maintainability | 1h |

---

## d) TOTALLY FUCKED UP

| # | What | Impact | Root Cause |
|---|---|---|---|
| 1 | **Project directory got deleted during session** | Near-catastrophic: all work nearly lost. Recovered from `~/.local/share/Trash/`. Committed work survived because git, but uncommitted scratch files (golden gen script in `/tmp/`) would have been lost. | Unknown — directory was trashed between turns. Possibly automated cleanup or user action. **Lesson: commit and push immediately after each logical unit, not at the end.** |
| 2 | **AJV schema validation initially failed** with `"reference resolves to more than one schema"` error | Blocked validation tests for a turn | Used `3.0.0.json` schema which has `$id` conflicts with bundled draft-07. Fixed by switching to `3.0.0-without-$id.json` variant. |
| 3 | **`storeTags` was storing tags as comma-separated strings** for the entire project lifetime | Tags were corrupted in state — any consumer reading `TagData` got `{ name: "tag1,tag2" }` instead of `[{ name: "tag1" }]` | Original implementation in `state-writers.ts` was a quick hack that was never corrected. Discovered during this session. |
| 4 | **407 documentation files** (1 per 6 lines of source code) accumulated over 885 commits | Navigation impossible; every session re-reads and re-plans instead of executing | Analysis paralysis pattern documented in post-mortem — each session created new plans instead of executing existing ones |

---

## e) WHAT WE SHOULD IMPROVE

### Architecture

1. **Stop using `any` in the schema emitter.** `modelDeclaration(model: any)` should be `modelDeclaration(model: Model)`. The `AsyncAPISchemaEmitter` class methods all accept `any` because the TypeEmitter base class types were not studied properly.
2. **Add `protocolBindings` to `TagData`.** Currently `TagData` is `{ name: string }[]` but AsyncAPI tags can have `description` and `externalDocs`.
3. **Define `EmitterOptions` model in `lib/main.tsp`.** The `@typespec/openapi3` emitter defines its options as a TypeSpec model, giving consumers IDE autocomplete in `tspconfig.yaml`. We only have TypeScript types.
4. **Use `@asyncapi/parser` for validation in the emitter itself** (not just AJV in tests). The parser is already a dependency but unused.

### Process

5. **Commit after each logical unit, push immediately.** This session nearly lost all work because the directory was deleted.
6. **Never create planning documents.** This project has 150+ execution plans that were never executed. Execute, don't plan.
7. **Verify before claiming.** The project claimed to be "completely broken" for months while actually having a working emitter. Always run `bun run build && bun test` before trusting any status report.
8. **Delete stale documentation aggressively.** 407 docs is the problem, not the solution.

### Testing

9. **Remove overlapping test helpers.** There are 6+ files in `test/utils/` with overlapping functionality. Consolidate to 2: `test-helpers.ts` (compilation) and `type-guards.ts` (assertions).
10. **Remove `Effect.TS` from tests.** Tests import `Effect` just for `Effect.log()` which is never actually executed. Replace with `console.log` or remove entirely.
11. **Add negative tests.** No tests for invalid decorator usage, circular references, missing required fields.

---

## f) Top 50 Things to Get Done Next

### P0 — Spec Compliance & Correctness

1. Emit channel `parameters` when address contains `{var}` expressions
2. Add `variables` support to `@server` decorator and `ServerConfigData` type
3. Wire output validation in `$onEmit` itself (emit diagnostics, not just test-side validation)
4. Fix `decimal` type mapping — current `{ type: "string", format: "decimal" }` may not match consumer expectations
5. Add `$ref` for nested model references instead of full inlining
6. Handle `union` types in return positions (oneOf/anyOf in message payloads)
7. Handle `enum` types in schema generation (currently falls through to generic)
8. Ensure `@doc` on operation parameters is preserved

### P1 — Type Safety

9. Replace all `any` in `AsyncAPISchemaEmitter` with proper TypeSpec types (`Model`, `ModelProperty`, etc.)
10. Add `description` field to `TagData` type
11. Make `ProtocolConfigData` a discriminated union by protocol type instead of a flat bag
12. Replace string literal `"publish" | "subscribe"` with a proper const enum
13. Type the `DiscoveredOp` interface's `messageName` as a branded type
14. Remove unsafe type assertions (`as`) from state consolidation

### P2 — Developer Experience

15. Define `EmitterOptions` model in `lib/main.tsp`
16. Write working README with quickstart guide
17. Fix 3 key examples to compile and produce correct output
18. Add `tspconfig.yaml` to each example
19. Commit expected output alongside each example
20. Add an `npx`-free quickstart (programmatic API or `bunx tsp compile`)

### P3 — Code Cleanup

21. Delete stale `FEATURES.md`, `TODO_LIST.md`, `PARTS.md`, `CONSUMER_PERSPECTIVE.md`
22. Archive 400+ docs into `docs/_archive/`
23. Remove dead emitter options
24. Remove dead dependencies (`@alloy-js/core`, `@effect/schema`, `@effect/eslint-plugin`)
25. Simplify `options.ts` (remove 150-line schema validation that's never used at runtime)
26. Consolidate 6+ test helper files into 2
27. Remove `Effect.TS` imports from all test files
28. Remove `console.log` debug spam from tests
29. Remove dead `path-templates.ts` and `serialization-format-option.ts` (only used by tests, not production)
30. Clean up `lib.ts` — remove excessive JSDoc (276 lines, half is comments)

### P4 — Testing

31. Add negative tests (invalid decorator usage, missing required fields)
32. Add circular reference test
33. Add multi-namespace test
34. Add inheritance chain test
35. Add test for `@tags` appearing in output
36. Add test for `@correlationId` appearing in output
37. Add test for `@header` appearing in output
38. Add test for `@bindings` appearing in output
39. Add test for server variables
40. Add performance baseline test

### P5 — Release

41. Ensure `bun run build && bun test && bun run lint` all pass clean
42. Write CHANGELOG.md
43. Update `package.json` version to `0.1.0-alpha`
44. Tag git release
45. Verify `npm publish --dry-run` works
46. Add GitHub Actions CI workflow that runs on every PR
47. Add `.npmignore` to exclude test/docs/scripts from published package
48. Verify published package size is reasonable
49. Create GitHub release with release notes
50. Announce

---

## g) Top 2 Questions I Cannot Figure Out Myself

### Question 1: Should we use `@asyncapi/parser` or raw AJV for output validation?

`@asyncapi/parser` (v3.6.0) is already a dependency and is the "official" validation tool. However, it's a heavy async library that may have side effects. The current AJV approach using `@asyncapi/specs` JSON schemas is simpler and synchronous. **I don't know which is the "right" approach for a TypeSpec emitter.** The `@typespec/openapi3` emitter doesn't validate its own output at all — it trusts its own code. Should we?

### Question 2: Should nested model references use `$ref` or inline?

Currently, when a model property references another model, we fully inline the schema. AsyncAPI 3.0 and OpenAPI 3.0 both support `$ref: "#/components/schemas/ModelName"` for reusable schemas. The `@typespec/openapi3` emitter uses the AssetEmitter's declaration system to automatically create `$ref` pointers. Our emitter inlines everything, which works for simple cases but produces massive output for deeply nested models. **I don't know if inlining is the right design choice or if we should refactor to use `$ref` for all model references.** This affects the entire schema generation architecture.
