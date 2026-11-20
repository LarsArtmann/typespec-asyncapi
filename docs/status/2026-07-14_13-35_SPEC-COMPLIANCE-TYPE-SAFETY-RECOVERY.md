# Status Report: Spec Compliance, Type Safety & Recovery

**Date:** 2026-07-14 13:35 UTC
**Session spans:** 2 prior turns + this report turn
**Build:** 0 errors | **Tests:** 348 pass, 0 fail | **Git:** 4 commits pushed to origin/master

---

## a) FULLY DONE

<!-- ledger: accomplishment table — shipped work records -->
<!-- check-rows:ledger -->
| #  | Item                                                                                                                                                                                                                        | Commit                               | Verification                                 |
| -- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------- |
| ~~1~~ done — every facet shipped and stands — the ref chain, typed document model, wired decorators, and golden locks are AGENTS.md canon | ~~**Spec-compliant `$ref` chain** — operations now reference `#/channels/{id}/messages/{id}` instead of illegally pointing at `#/components/messages/{id}` directly~~ | ~~`85363e6`~~ | ~~Golden file test + schema validation test~~ |
| ~~2~~ done — every facet shipped and stands — the ref chain, typed document model, wired decorators, and golden locks are AGENTS.md canon | ~~**Message names use model names** — `OrderCreated` not `publishOrderCreated`, so payload `$ref` resolves to an actual schema~~ | ~~`85363e6`~~ | ~~Golden file test assertion~~ |
| ~~3~~ done — every facet shipped and stands — the ref chain, typed document model, wired decorators, and golden locks are AGENTS.md canon | ~~**All 8 previously-failing tests fixed** — replaced `pnpm dlx tsp compile` child_process spawning with programmatic TypeSpec compiler API~~ | ~~`85363e6`~~ | ~~348 pass, 0 fail~~ |
| ~~4~~ done — every facet shipped and stands — the ref chain, typed document model, wired decorators, and golden locks are AGENTS.md canon | ~~**Golden file test** — `test/golden/golden-file.test.ts` locks in verified-correct output with structural + `$ref` pattern + message naming assertions~~ | ~~`85363e6`~~ | ~~3 sub-tests pass~~ |
| ~~5~~ done — every facet shipped and stands — the ref chain, typed document model, wired decorators, and golden locks are AGENTS.md canon | ~~**AsyncAPI 3.0.0 JSON Schema validation** — `test/validation/schema-validation.test.ts` validates emitter output against official `@asyncapi/specs` schema via AJV~~ | ~~`85363e6`~~ | ~~3 scenarios pass (simple, servers, multi-op)~~ |
| ~~6~~ done — every facet shipped and stands — the ref chain, typed document model, wired decorators, and golden locks are AGENTS.md canon | ~~**Strongly-typed AsyncAPI document model** — `src/domain/models/asyncapi-document.ts` with `AsyncAPIDocument`, `ChannelObject`, `OperationObject`, `MessageObject`, `ServerObject`, `ComponentsObject`, `SchemaObject` etc.~~ | ~~`f55c3af`~~ | ~~Build passes, emitter fully type-checked~~ |
| ~~7~~ done — every facet shipped and stands — the ref chain, typed document model, wired decorators, and golden locks are AGENTS.md canon | ~~**`@tags` wired to output** — appears on operations as `Tag[]` arrays~~ | ~~`d178692`~~ | ~~State stores `Tag[]` not comma string~~ |
| ~~8~~ done — every facet shipped and stands — the ref chain, typed document model, wired decorators, and golden locks are AGENTS.md canon | ~~**`@correlationId` wired to output** — appears on messages as `CorrelationId` objects~~ | ~~`d178692`~~ | ~~~~ |
| ~~9~~ done — every facet shipped and stands — the ref chain, typed document model, wired decorators, and golden locks are AGENTS.md canon | ~~**`@header` wired to output** — appears on messages as JSON Schema `headers` objects~~ | ~~`d178692`~~ | ~~~~ |
| ~~10~~ done — every facet shipped and stands — the ref chain, typed document model, wired decorators, and golden locks are AGENTS.md canon | ~~**`@bindings` wired to output** — appears on operations and messages~~ | ~~`d178692`~~ | ~~~~ |
| ~~11~~ done — every facet shipped and stands — the ref chain, typed document model, wired decorators, and golden locks are AGENTS.md canon | ~~**`storeTags` data model fixed** — was `{ name: "tag1,tag2" }` (comma string), now `[{ name: "tag1" }, { name: "tag2" }]` (proper array)~~ | ~~`d178692`~~ | ~~~~ |
| ~~12~~ done — every facet shipped and stands — the ref chain, typed document model, wired decorators, and golden locks are AGENTS.md canon | ~~**`protocolBindings` added to consolidated state** — was stored by decorators but never surfaced to emitter~~ | ~~`d178692`~~ | ~~~~ |
| ~~13~~ done — every facet shipped and stands — the ref chain, typed document model, wired decorators, and golden locks are AGENTS.md canon | ~~**AGENTS.md rewritten** with verified facts, $ref chain documentation, test helper guidance, and anti-pattern rules~~ | ~~`5e59ba6`~~ | ~~~~ |
| ~~14~~ done — every facet shipped and stands — the ref chain, typed document model, wired decorators, and golden locks are AGENTS.md canon | ~~**Post-mortem document** at `docs/POST-MORTEM-AND-RECOVERY-PLAN.md` — comprehensive root cause analysis and execution plan~~ | ~~`85363e6`~~ | ~~~~ |
| ~~15~~ done — every facet shipped and stands — the ref chain, typed document model, wired decorators, and golden locks are AGENTS.md canon | ~~**CLI test helper rewritten** — `test/utils/cli-test-helpers.ts` replaced 336 lines of spawn/fs/race-condition code with 68-line programmatic API wrapper~~ | ~~`85363e6`~~ | ~~All CLI tests pass~~ |
| ~~16~~ done — every facet shipped and stands — the ref chain, typed document model, wired decorators, and golden locks are AGENTS.md canon | ~~**All commits pushed to GitHub**~~ | ~~confirmed `5e59ba6` on origin/master~~ | ~~`gh api` verified~~ |

---

## b) PARTIALLY DONE

| # | Item                              | What's done                                                                                            | What's missing                                                                                                                                      |
| - | --------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~1~~ done — all six shipped — channel parameters, server variables, schema generation, @message override, docs, examples | ~~**Channel parameters**~~ | ~~`storeChannelState` extracts path parameters from `{orderId}` patterns into `parameters` array~~ | ~~Emitter doesn't emit `parameters` on channel objects (spec requires this when address contains `{var}`)~~ |
| ~~2~~ done — all six shipped — channel parameters, server variables, schema generation, @message override, docs, examples | ~~**`@server` variables**~~ | ~~Server config stored with url, protocol, description~~ | ~~No `variables` field in `ServerConfigData` type; emitter doesn't emit server variables~~ |
| ~~3~~ done — all six shipped — channel parameters, server variables, schema generation, @message override, docs, examples | ~~**Schema generation**~~ | ~~Models → JSON Schema with types, properties, required, arrays, enums, inheritance, `@doc` descriptions~~ | ~~`decimal` maps to `{ type: "string", format: "decimal" }` (debatable); no `$ref` for nested model references (inlines everything)~~ |
| ~~4~~ done — all six shipped — channel parameters, server variables, schema generation, @message override, docs, examples | ~~**`@message` decorator override**~~ | ~~Explicit `@message` data merged into auto-generated messages~~ | ~~Override only applies if the model has `@message` — auto-discovered messages from return types don't check for `@message` on the return type~~ |
| ~~5~~ done — all six shipped — channel parameters, server variables, schema generation, @message override, docs, examples | ~~**Documentation cleanup**~~ | ~~AGENTS.md rewritten, post-mortem written~~ | ~~`FEATURES.md`, `TODO_LIST.md`, `PARTS.md`, `CONSUMER_PERSPECTIVE.md`, `README.md` all still stale/contradictory; 407 doc files in `docs/` untouched~~ |
| ~~6~~ done — all six shipped — channel parameters, server variables, schema generation, @message override, docs, examples | ~~**Examples**~~ | ~~Identified all broken examples (ghost `@asyncapi` decorator, wrong namespaces, missing tspconfig)~~ | ~~None fixed yet~~ |

---

## c) NOT STARTED

<!-- ledger: works table — shipped work records -->
<!-- check-rows:ledger -->
| #  | Item                                                                                           | Impact                    | Effort |
| -- | ---------------------------------------------------------------------------------------------- | ------------------------- | ------ |
| ~~1~~ done — the cleanup program executed — archive exists, living docs rebuilt, examples CI-validated, options audited, zero-any, README shipped, releases through 1.2.0 | ~~Archive 400+ stale planning/status docs into `docs/_archive/`~~ | ~~Unblocks navigation~~ | ~~30 min~~ |
| ~~2~~ done — the cleanup program executed — archive exists, living docs rebuilt, examples CI-validated, options audited, zero-any, README shipped, releases through 1.2.0 | ~~Delete stale `FEATURES.md`, `TODO_LIST.md`, `PARTS.md` (actively harmful)~~ | ~~Prevents confusion~~ | ~~5 min~~ |
| ~~3~~ done — the cleanup program executed — archive exists, living docs rebuilt, examples CI-validated, options audited, zero-any, README shipped, releases through 1.2.0 | ~~Fix examples to compile and produce correct output~~ | ~~Consumer trust~~ | ~~1h~~ |
| ~~4~~ done — the cleanup program executed — archive exists, living docs rebuilt, examples CI-validated, options audited, zero-any, README shipped, releases through 1.2.0 | ~~Remove dead emitter options (15+ defined, only 6 read)~~ | ~~Clean API surface~~ | ~~30 min~~ |
| ~~5~~ done — the cleanup program executed — archive exists, living docs rebuilt, examples CI-validated, options audited, zero-any, README shipped, releases through 1.2.0 | ~~Remove dead dependencies (`@alloy-js/core`, `@effect/schema`, `@effect/eslint-plugin`)~~ | ~~Smaller install~~ | ~~15 min~~ |
| ~~6~~ done — the cleanup program executed — archive exists, living docs rebuilt, examples CI-validated, options audited, zero-any, README shipped, releases through 1.2.0 | ~~Wire output validation in emitter itself (not just tests) — emit diagnostics on invalid output~~ | ~~Spec compliance guarantee~~ | ~~30 min~~ |
| ~~7~~ done — the cleanup program executed — archive exists, living docs rebuilt, examples CI-validated, options audited, zero-any, README shipped, releases through 1.2.0 | ~~Add `EmitterOptions` model to `lib/main.tsp` for IDE autocomplete~~ | ~~Developer experience~~ | ~~30 min~~ |
| ~~8~~ done — the cleanup program executed — archive exists, living docs rebuilt, examples CI-validated, options audited, zero-any, README shipped, releases through 1.2.0 | ~~Remove `any` types from emitter (still ~10 uses in modelDeclaration etc.)~~ | ~~Type safety~~ | ~~1h~~ |
| ~~9~~ done — the cleanup program executed — archive exists, living docs rebuilt, examples CI-validated, options audited, zero-any, README shipped, releases through 1.2.0 | ~~Write proper README with working quickstart~~ | ~~Consumer onboarding~~ | ~~1h~~ |
| ~~10~~ done — the cleanup program executed — archive exists, living docs rebuilt, examples CI-validated, options audited, zero-any, README shipped, releases through 1.2.0 | ~~Tag `v0.1.0-alpha` release~~ | ~~Milestone~~ | ~~15 min~~ |
| ~~11~~ done — the cleanup program executed — archive exists, living docs rebuilt, examples CI-validated, options audited, zero-any, README shipped, releases through 1.2.0 | ~~Remove `Effect.TS` from test files (replace with plain code)~~ | ~~Dependency reduction~~ | ~~2h~~ |
| ~~12~~ done — the cleanup program executed — archive exists, living docs rebuilt, examples CI-validated, options audited, zero-any, README shipped, releases through 1.2.0 | ~~Consolidate overlapping test helpers (6+ files in `test/utils/`)~~ | ~~Maintainability~~ | ~~1h~~ |

---

## d) TOTALLY FUCKED UP

<!-- ledger: incident record — post-mortem facts, no actionable rows -->
<!-- check-rows:ledger -->
| # | What                                                                                                 | Impact                                                                                                                                                                                                   | Root Cause                                                                                                                                                                 |
| - | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | **Project directory got deleted during session**                                                     | Near-catastrophic: all work nearly lost. Recovered from `~/.local/share/Trash/`. Committed work survived because git, but uncommitted scratch files (golden gen script in `/tmp/`) would have been lost. | Unknown — directory was trashed between turns. Possibly automated cleanup or user action. **Lesson: commit and push immediately after each logical unit, not at the end.** |
| 2 | **AJV schema validation initially failed** with `"reference resolves to more than one schema"` error | Blocked validation tests for a turn                                                                                                                                                                      | Used `3.0.0.json` schema which has `$id` conflicts with bundled draft-07. Fixed by switching to `3.0.0-without-$id.json` variant.                                          |
| 3 | **`storeTags` was storing tags as comma-separated strings** for the entire project lifetime          | Tags were corrupted in state — any consumer reading `TagData` got `{ name: "tag1,tag2" }` instead of `[{ name: "tag1" }]`                                                                                | Original implementation in `state-writers.ts` was a quick hack that was never corrected. Discovered during this session.                                                   |
| 4 | **407 documentation files** (1 per 6 lines of source code) accumulated over 885 commits              | Navigation impossible; every session re-reads and re-plans instead of executing                                                                                                                          | Analysis paralysis pattern documented in post-mortem — each session created new plans instead of executing existing ones                                                   |

---

## e) WHAT WE SHOULD IMPROVE

### Architecture

~~1. **Stop using `any` in the schema emitter.** `modelDeclaration(model: any)` should be `modelDeclaration(model: Model)`. The `AsyncAPISchemaEmitter` class methods all accept `any` because the TypeEmitter base class types were not studied properly.~~ done — adopted — zero-any held through 1.2.0 (AGENTS.md)
~~2. **Add `protocolBindings` to `TagData`.** Currently `TagData` is `{ name: string }[]` but AsyncAPI tags can have `description` and `externalDocs`.~~ **NOT-DO — evolved differently — protocol bindings live in state via storeProtocolConfig.**
~~3. **Define `EmitterOptions` model in `lib/main.tsp`.** The `@typespec/openapi3` emitter defines its options as a TypeSpec model, giving consumers IDE autocomplete in `tspconfig.yaml`. We only have TypeScript types.~~ done — shipped — the EmitterOptions model is in lib/main.tsp
~~4. **Use `@asyncapi/parser` for validation in the emitter itself** (not just AJV in tests). The parser is already a dependency but unused.~~ **NOT-DO — decided — parser + AJV validation stayed test-side by design.**

### Process

~~5. **Commit after each logical unit, push immediately.** This session nearly lost all work because the directory was deleted.~~ **NOT-DO — daemon canon now — commits ride the auto-daemon.**
~~6. **Never create planning documents.** This project has 150+ execution plans that were never executed. Execute, don't plan.~~ done — fleet canon — the docs-health ritual enforces it
~~7. **Verify before claiming.** The project claimed to be "completely broken" for months while actually having a working emitter. Always run `bun run build && bun test` before trusting any status report.~~ done — canon — docs-health VERIFY/ANNOTATE modes
~~8. **Delete stale documentation aggressively.** 407 docs is the problem, not the solution.~~ done — being finished by this very sweep

### Testing

~~9. **Remove overlapping test helpers.** There are 6+ files in `test/utils/` with overlapping functionality. Consolidate to 2: `test-helpers.ts` (compilation) and `type-guards.ts` (assertions).~~ done — consolidated — the three test helpers documented in AGENTS.md
~~10. **Remove `Effect.TS` from tests.** Tests import `Effect` just for `Effect.log()` which is never actually executed. Replace with `console.log` or remove entirely.~~ done — Effect.TS fully removed
~~11. **Add negative tests.** No tests for invalid decorator usage, circular references, missing required fields.~~ done — shipped — compliance negative tests

---

## f) Top 50 Things to Get Done Next

### P0 — Spec Compliance & Correctness

~~1. Emit channel `parameters` when address contains `{var}` expressions~~ done — shipped — channel parameters (AGENTS.md address-parameter note)
~~2. Add `variables` support to `@server` decorator and `ServerConfigData` type~~ done — shipped — server variables
~~3. Wire output validation in `$onEmit` itself (emit diagnostics, not just test-side validation)~~ **NOT-DO — decided — validation stays test-side.**
~~4. Fix `decimal` type mapping — current `{ type: "string", format: "decimal" }` may not match consumer expectations~~ done — deliberate — decimal renders as string+format decimal (AGENTS.md documents the convention)
~~5. Add `$ref` for nested model references instead of full inlining~~ done — shipped — nested $ref
~~6. Handle `union` types in return positions (oneOf/anyOf in message payloads)~~ done — shipped — oneOf/anyOf unions
~~7. Handle `enum` types in schema generation (currently falls through to generic)~~ done — shipped — enum handling
~~8. Ensure `@doc` on operation parameters is preserved~~ done — shipped — @doc preserved

### P1 — Type Safety

~~9. Replace all `any` in `AsyncAPISchemaEmitter` with proper TypeSpec types (`Model`, `ModelProperty`, etc.)~~ done — shipped — zero-any in the schema emitter
~~10. Add `description` field to `TagData` type~~ done — shipped — @tags rich objects carry description
~~11. Make `ProtocolConfigData` a discriminated union by protocol type instead of a flat bag~~ done — shipped — ProtocolConfigData discriminated union
~~12. Replace string literal `"publish" | "subscribe"` with a proper const enum~~ done — shipped — typed action
~~13. Type the `DiscoveredOp` interface's `messageName` as a branded type~~ **NOT-DO — branded messageName never adopted.**
~~14. Remove unsafe type assertions (`as`) from state consolidation~~ done — shipped — unsafe assertions removed (strict eslint)

### P2 — Developer Experience

~~15. Define `EmitterOptions` model in `lib/main.tsp`~~ done — shipped — EmitterOptions in lib/main.tsp
~~16. Write working README with quickstart guide~~ done — shipped — the README
~~17. Fix 3 key examples to compile and produce correct output~~ done — shipped — examples compile + AJV-validate in CI
~~18. Add `tspconfig.yaml` to each example~~ done — examples carry their configs (check-examples compiles them)
~~19. Commit expected output alongside each example~~ done — shipped — golden expected outputs
~~20. Add an `pnpm dlx`-free quickstart (programmatic API or `bunx tsp compile`)~~ done — shipped — programmatic compileAsyncAPI (AGENTS.md test framework)

### P3 — Code Cleanup

~~21. Delete stale `FEATURES.md`, `TODO_LIST.md`, `PARTS.md`, `CONSUMER_PERSPECTIVE.md`~~ done — living docs rebuilt
~~22. Archive 400+ docs into `docs/_archive/`~~ done — docs/_archive exists
~~23. Remove dead emitter options~~ done — options audited
~~24. Remove dead dependencies (`@alloy-js/core`, `@effect/schema`, `@effect/eslint-plugin`)~~ done — Effect deps gone
~~25. Simplify `options.ts` (remove 150-line schema validation that's never used at runtime)~~ done — options are types-only now
~~26. Consolidate 6+ test helper files into 2~~ done — helpers consolidated
~~27. Remove `Effect.TS` imports from all test files~~ done — Effect.TS removed
~~28. Remove `console.log` debug spam from tests~~ done — lint 0/0 standing
~~29. Remove dead `path-templates.ts` and `serialization-format-option.ts` (only used by tests, not production)~~ done — dead modules gone (src/constants holds only protocols/binding-versions/generated-bindings)
~~30. Clean up `lib.ts` — remove excessive JSDoc (276 lines, half is comments)~~ done — lib.ts is focused (diagnostics registry + lib definition)

### P4 — Testing

~~31. Add negative tests (invalid decorator usage, missing required fields)~~ done — shipped — compliance negative tests
~~32. Add circular reference test~~ done — shipped — circular handling covered
~~33. Add multi-namespace test~~ done — shipped — multi-namespace-isolation.test.ts
~~34. Add inheritance chain test~~ done — shipped — polymorphism suite
~~35. Add test for `@tags` appearing in output~~ done — shipped — tag output locked
~~36. Add test for `@correlationId` appearing in output~~ done — shipped — correlationId output
~~37. Add test for `@header` appearing in output~~ done — shipped — header output
~~38. Add test for `@bindings` appearing in output~~ done — shipped — bindings output
~~39. Add test for server variables~~ done — shipped — server variables tests
~~40. Add performance baseline test~~ done — shipped — the benchmark suite

### P5 — Release

~~41. Ensure `bun run build && bun test && bun run lint` all pass clean~~ done — standing — the verify gate
~~42. Write CHANGELOG.md~~ done — CHANGELOG shipped through 1.2.0
~~43. Update `package.json` version to `0.1.0-alpha`~~ done — shipped — 0.1.0-alpha through 1.2.0
~~44. Tag git release~~ done — releases tagged
~~45. Verify `pnpm publish --dry-run` works~~ done — publish path verified (OIDC flow documented)
~~46. Add GitHub Actions CI workflow that runs on every PR~~ done — CI workflows shipped
~~47. Add `.npmignore` to exclude test/docs/scripts from published package~~ done — superseded — the package ships a files whitelist (AGENTS.md npm-surface note)
~~48. Verify published package size is reasonable~~ done — package size verified in release notes
~~49. Create GitHub release with release notes~~ done — GitHub releases exist through v1.2.0
50. Announce **→ TODO_LIST Release Hardening (announce row)**

---

## g) Top 2 Questions I Cannot Figure Out Myself

### Question 1: Should we use `@asyncapi/parser` or raw AJV for output validation?

`@asyncapi/parser` (v3.6.0) is already a dependency and is the "official" validation tool. However, it's a heavy async library that may have side effects. The current AJV approach using `@asyncapi/specs` JSON schemas is simpler and synchronous. **I don't know which is the "right" approach for a TypeSpec emitter.** The `@typespec/openapi3` emitter doesn't validate its own output at all — it trusts its own code. Should we?

### Question 2: Should nested model references use `$ref` or inline?

Currently, when a model property references another model, we fully inline the schema. AsyncAPI 3.0 and OpenAPI 3.0 both support `$ref: "#/components/schemas/ModelName"` for reusable schemas. The `@typespec/openapi3` emitter uses the AssetEmitter's declaration system to automatically create `$ref` pointers. Our emitter inlines everything, which works for simple cases but produces massive output for deeply nested models. **I don't know if inlining is the right design choice or if we should refactor to use `$ref` for all model references.** This affects the entire schema generation architecture.
