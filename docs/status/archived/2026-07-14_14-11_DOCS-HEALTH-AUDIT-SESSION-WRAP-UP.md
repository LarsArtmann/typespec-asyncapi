# Status Report: Docs Health Audit + Session Wrap-Up
> **Live remainder:** none — every item resolved in the 2026-11-19/20 corpus sweep (verdicts inline; routed work lives in TODO_LIST.md / ROADMAP.md).

**Date:** 2026-07-14 14:11 UTC
**Session spans:** 3 prior turns (spec compliance + type safety + Alloy analysis + docs-health skill)
**Build:** 0 errors | **Tests:** 348 pass, 0 fail | **Commits:** 7 pushed to origin/master

---

## Reflection: What I Forgot & Could Have Done Better

~~1. **Project directory got deleted mid-session** — recovered from trash. I should have pushed after every commit from the start, not just at the end of each turn. This was near-catastrophic data loss.~~ **NOT-DO — one-off incident — recovered from trash; no standing work item.**
~~2. **Forgot to reinstall `node_modules` after recovery** — the directory came back from trash without node_modules symlinked properly, causing a confusing build failure. Should have run `bun install` immediately after recovery.~~ **NOT-DO — one-off recovery step; nothing to build.**
~~3. **Alloy analysis was asked for but I never committed a conclusion to a file** — the PRO/CONTRA analysis lives only in chat history. Should have written it to a doc or at minimum to AGENTS.md as a decision record.~~ done — recorded as `docs/adr/0001-use-asset-emitter-not-alloy.md`
~~4. **Docs-health audit found 2 missing docs (DOMAIN_LANGUAGE.md, ROADMAP.md) but I deferred them** — for a library at v0.0.1 this is acceptable, but I should have stated the deferral explicitly in TODO_LIST.md instead of just noting it in the health report.~~ **NOT-DO — moot — `ROADMAP.md` and `docs/DOMAIN_LANGUAGE.md` both exist today.**
~~5. **CONTRIBUTING.md still references "plugin development" and "performance optimization"** as contribution areas — these are dead concepts (plugins deleted, performance monitors deleted). I fixed the `just` commands but didn't clean the content.~~ done — cleaned — no plugin/performance mentions remain in `CONTRIBUTING.md`
~~6. **Never ran `bun run lint`** during this session to verify it passes.~~ done — lint is a `pnpm run verify` stage and a CI step
~~7. **`docs/` directory still has 400+ stale planning/status/recovery files** — I documented this as TODO T14 but didn't archive them. The noise is still there.~~ done — archived under `docs/_archive/`
~~8. **Didn't check if examples actually compile** — I rewrote README with decorator examples but never verified they work with a real `tsp compile`.~~ done — `pnpm run check-examples` compiles and AJV-validates examples in CI

---

## a) FULLY DONE

| #  | Item                                                                                             | Commit    |
| -- | ------------------------------------------------------------------------------------------------ | --------- |
| ~~1~~ done at `85363e6` | ~~Spec-compliant `$ref` chain (operations → channels → components)~~ | ~~`85363e6`~~ |
| ~~2~~ done at `85363e6` | ~~Message names use model names (OrderCreated, not publishOrderCreated)~~ | ~~`85363e6`~~ |
| ~~3~~ done at `85363e6` | ~~All 8 failing tests fixed (replaced pnpm dlx spawning with programmatic API)~~ | ~~`85363e6`~~ |
| ~~4~~ done at `85363e6` | ~~Golden file test with 3 sub-tests (structural, $ref pattern, message naming)~~ | ~~`85363e6`~~ |
| ~~5~~ done at `85363e6` | ~~AsyncAPI 3.0.0 JSON Schema validation (3 scenarios pass against official schema)~~ | ~~`85363e6`~~ |
| ~~6~~ done at `f55c3af` | ~~Strongly-typed document model (AsyncAPIDocument, ChannelObject, OperationObject, etc.)~~ | ~~`f55c3af`~~ |
| ~~7~~ done at `d178692` | ~~`@tags` wired to output as Tag[] arrays~~ | ~~`d178692`~~ |
| ~~8~~ done at `d178692` | ~~`@correlationId` wired to output as CorrelationId objects~~ | ~~`d178692`~~ |
| ~~9~~ done at `d178692` | ~~`@header` wired to output as JSON Schema headers~~ | ~~`d178692`~~ |
| ~~10~~ done at `d178692` | ~~`@bindings` wired to output on operations and messages~~ | ~~`d178692`~~ |
| ~~11~~ done at `d178692` | ~~`storeTags` data model fixed (comma string → proper Tag[])~~ | ~~`d178692`~~ |
| ~~12~~ done at `d178692` | ~~`protocolBindings` added to consolidated state~~ | ~~`d178692`~~ |
| ~~13~~ done at `5e59ba6` | ~~AGENTS.md rewritten with verified facts + spec-compliance rules~~ | ~~`5e59ba6`~~ |
| ~~14~~ done at `85363e6` | ~~Post-mortem document at `docs/POST-MORTEM-AND-RECOVERY-PLAN.md`~~ | ~~`85363e6`~~ |
| ~~15~~ done at `85363e6` | ~~CLI test helper rewritten (336 lines → 68 lines)~~ | ~~`85363e6`~~ |
| ~~16~~ done at `849ceda` | ~~README.md rebuilt (correct syntax, real test count, bun commands, spec-compliant output example)~~ | ~~`849ceda`~~ |
| ~~17~~ done at `849ceda` | ~~FEATURES.md rebuilt (all statuses verified with file:line evidence)~~ | ~~`849ceda`~~ |
| ~~18~~ done at `849ceda` | ~~TODO_LIST.md rebuilt (20 real tasks, no ghosts)~~ | ~~`849ceda`~~ |
| ~~19~~ done at `849ceda` | ~~CHANGELOG.md created~~ | ~~`849ceda`~~ |
| ~~20~~ done at `849ceda` | ~~CONTRIBUTING.md: all `just` commands → `bun run`~~ | ~~`849ceda`~~ |
| ~~21~~ done at `849ceda` | ~~Deleted stale PARTS.md and CONSUMER_PERSPECTIVE.md~~ | ~~`849ceda`~~ |
| ~~22~~ done at `849ceda` | ~~Docs-health audit completed (health score: 8.75/10)~~ | ~~`849ceda`~~ |
| ~~23~~ done — all session commits are on origin; tags through `v1.2.0` shipped since | ~~All commits pushed to GitHub (verified via `gh api`)~~ | ~~confirmed~~ |

---

## b) PARTIALLY DONE

| # | Item                         | What's done                                   | What's missing                                                                  |
| - | ---------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------- |
| ~~1~~ done — `src/builders/channel-builder.ts` emits `parameters`; `extractChannelParameters` unit-tested | ~~Channel parameters~~ | ~~`storeChannelState` parses `{var}` from paths~~ | ~~Emitter doesn't emit `parameters` on channel objects~~ |
| ~~2~~ done — `src/builders/server-builder.ts` plus variables tests in `test/compliance/servers-security.test.ts` | ~~Server variables~~ | ~~Server config stored~~ | ~~No `variables` field in type; not emitted~~ |
| ~~3~~ done — `src/schema-ref.ts`; ref-chain tests lock nested-model `$ref` output | ~~Nested model references~~ | ~~Models fully inlined~~ | ~~No `$ref` for nested models (verbose output)~~ |
| ~~4~~ **Won't implement — never wired into the emitter; validation stayed test-side via `test/utils/schema-validator.ts`.** | ~~Output validation in emitter~~ | ~~Validation works in tests via AJV~~ | ~~Not wired into `$onEmit` to emit diagnostics~~ |
| ~~5~~ done — stale corpus archived under `docs/_archive/` | ~~Documentation cleanup~~ | ~~Root docs rebuilt, 2 stale files deleted~~ | ~~400+ files in `docs/` still not archived~~ |
| ~~6~~ done — dead plugin/performance sections gone from `CONTRIBUTING.md` | ~~CONTRIBUTING.md~~ | ~~`just` → `bun run` fixed~~ | ~~Still mentions "plugin development", "performance optimization" (dead concepts)~~ |
| ~~7~~ done — `@alloy-js/core`, `@effect/*` and `@typespec/emitter-framework` are absent from `package.json` | ~~Dependency cleanup~~ | ~~Identified dead deps~~ | ~~Not removed yet (`@alloy-js/core`, `@effect/schema`, etc.)~~ |
| ~~8~~ done — recorded as `docs/adr/0001-use-asset-emitter-not-alloy.md` | ~~Alloy decision record~~ | ~~PRO/CONTRA analysis done in chat~~ | ~~Not written to a file (ADR or AGENTS.md)~~ |

---

## c) NOT STARTED

| #  | Item                                                        |
| -- | ----------------------------------------------------------- |
| ~~1~~ done — `docs/_archive/` holds the stale corpus | ~~Archive 400+ stale docs into `docs/_archive/`~~ |
| ~~2~~ done — examples carry `tspconfig.yaml`; `pnpm run check-examples` runs in CI | ~~Fix examples to compile and produce correct output~~ |
| ~~3~~ done — dead dependencies removed from `package.json` | ~~Remove dead dependencies~~ |
| ~~4~~ done — option surface is the `EmitterOptions` model (`lib/main.tsp` line 256); no ignored options accepted | ~~Remove dead emitter options~~ |
| ~~5~~ done — no `@effect` imports remain in `test/` | ~~Remove `Effect.TS` from test files~~ |
| ~~6~~ done — shared helpers consolidated under `test/utils/` | ~~Consolidate overlapping test helpers~~ |
| ~~7~~ done — `EmitterOptions` model at `lib/main.tsp` line 256 | ~~Add `EmitterOptions` model to `lib/main.tsp`~~ |
| ~~8~~ done — `docs/DOMAIN_LANGUAGE.md` exists | ~~Create `docs/DOMAIN_LANGUAGE.md`~~ |
| ~~9~~ done — `ROADMAP.md` exists at the repo root | ~~Create `ROADMAP.md`~~ |
| ~~10~~ done — `test/integration/negative-tests.test.ts` plus `test/integration/decorator-negative.test.ts` | ~~Add negative tests (invalid decorator usage, circular refs)~~ |
| ~~11~~ **Won't implement — never implemented; validation remains test-side (`test/utils/schema-validator.ts`), the emitter trusts its output.** | ~~Wire validation in `$onEmit` itself~~ |
| ~~12~~ done — `docs/adr/0001-use-asset-emitter-not-alloy.md` | ~~Write ADR for Alloy rejection decision~~ |
| ~~13~~ done — tag `v0.1.0-alpha` exists, through `v1.2.0` | ~~Tag `v0.1.0-alpha` release~~ |
| ~~14~~ done — `.github/workflows/ci.yml` gates every push | ~~Add GitHub Actions CI workflow~~ |
| ~~15~~ done — lint runs in `pnpm run verify` and CI | ~~Run `bun run lint` to verify it passes~~ |

---

## d) TOTALLY FUCKED UP

| # | What                                                               | Impact                                                                 | Root Cause                                                                                                  |
| - | ------------------------------------------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| ~~1~~ **NOT-DO — one-off incident; recovered, commits survived; nothing actionable remains.** | ~~**Project directory deleted mid-session**~~ | ~~Near-total work loss. Recovered from trash, all git commits survived.~~ | ~~Unknown cause — possibly automated cleanup or user action. **Lesson: push immediately after every commit.**~~ |
| ~~2~~ done — harness validates with the `3.1.0-without-$id.json` variant (`test/utils/schema-validator.ts`) | ~~**AJV schema validation initially crashed**~~ | ~~Blocked validation tests for one turn~~ | ~~Used `3.0.0.json` schema (has `$id` conflicts). Fixed by using `3.0.0-without-$id.json` variant.~~ |
| ~~3~~ done — archived under `docs/_archive/` | ~~**407 documentation files accumulated**~~ | ~~Navigation impossible; every session re-reads and re-plans~~ | ~~2-year pattern of analysis paralysis — each session created new plans instead of executing~~ |
| ~~4~~ done at `d178692` | ~~**`storeTags` was corrupt for entire project lifetime**~~ | ~~Tags stored as `"tag1,tag2"` string instead of `[{name:"tag1"}]` array~~ | ~~Original quick-hack implementation never reviewed~~ |
| ~~5~~ done at `849ceda` | ~~**FEATURES.md claimed "7 pass / 88 fail"** when actual was 311+/8-~~ | ~~Actively misled every reader for months~~ | ~~Nobody ran `bun test` before writing status~~ |

---

## e) WHAT WE SHOULD IMPROVE

### Process

~~1. **Commit + push after every logical unit** — not batched at end of turn~~ **NOT-DO — process habit with no artifact; the auto-commit daemon now owns cadence (documented in `AGENTS.md`).**
~~2. **Run `bun install` after directory recovery** — node_modules state is not guaranteed~~ **NOT-DO — one-off recovery step.**
~~3. **Never create planning documents** — this project has 150+ unexecuted plans~~ **NOT-DO — process preference; `docs/planning/` retained as point-in-time records under the docs-gates corpus policy.**
~~4. **Verify all claims with `bun run build && bun test`** — never trust existing status reports~~ done — institutionalized as `pnpm run verify` (build, lint, typecheck, test, coverage, duplicate)
~~5. **Write decisions to files, not just chat** — the Alloy PRO/CONTRA analysis is lost in chat history~~ done — decisions now land as ADRs (`docs/adr/`)

### Architecture

~~6. **Remove `any` types from schema emitter** — `modelDeclaration(model: any)` should be `Model`~~ done — no `any` remains in `src/schema-emitter.ts`
~~7. **Add `$ref` for nested models** — current inlining produces massive output~~ done — `src/schema-ref.ts` plus `test/compliance/ref-chain.test.ts`
~~8. **Use discriminated unions for ProtocolConfigData** — flat bag of optional fields is untyped~~ done — `ProtocolConfigData` is a discriminated union (`src/state.ts`)
~~9. **Wire validation in emitter itself** — not just test-side~~ **Won't implement — never wired into `$onEmit`; AJV validation is test-side only.**

### Documentation

~~10. **Archive the 400+ docs** — they are actively harmful noise~~ done — `docs/_archive/`
~~11. **Clean CONTRIBUTING.md content** — still references dead plugin/performance concepts~~ done — `CONTRIBUTING.md` cleaned
~~12. **Write ADR for Alloy rejection** — decision should be recorded, not just chat~~ done — `docs/adr/0001-use-asset-emitter-not-alloy.md`
~~13. **Create DOMAIN_LANGUAGE.md** — terms like "channel", "operation", "message" need definitions~~ done — `docs/DOMAIN_LANGUAGE.md`

---

## f) Top 50 Things to Get Done Next

### P0 — Correctness

~~1. Emit channel `parameters` when address contains `{var}`~~ done — channel `parameters` emitted (`src/builders/channel-builder.ts`)
~~2. Add `variables` to `@server` (spec supports `{env}` in host)~~ done — server `variables` emitted (`src/builders/server-builder.ts`)
~~3. Wire AJV validation in `$onEmit` (emit diagnostics on invalid output)~~ **Won't implement — never wired into `$onEmit`; AJV validation is test-side only.**
~~4. Add `$ref` for nested model references instead of inlining~~ done — nested models use `$ref` (`src/schema-ref.ts` and ref-chain tests)
~~5. Fix `decimal` type mapping (debatable: `{ type: "string", format: "decimal" }`)~~ done — `src/intrinsic-mapping.ts` maps decimal to a string schema with format decimal
~~6. Handle `enum` declarations (not just string union literals)~~ done — `enumDeclaration` handled in `src/schema-emitter.ts`
~~7. Handle `union` types in return positions (oneOf in payloads)~~ done — unions compose to enum, `oneOf` or `anyOf` (`src/schema-fragments.ts`)
~~8. Verify all README decorator examples actually compile~~ **Won't implement — README snippets never compiled in CI; `pnpm run check-examples` covers `examples/` instead.**

### P1 — Type Safety

~~9. Replace `any` in `AsyncAPISchemaEmitter.modelDeclaration` with `Model`~~ done — `modelDeclaration` typed — no `any` in `src/schema-emitter.ts`
~~10. Replace `any` in `AsyncAPISchemaEmitter.modelLiteral` with `Model`~~ done — `modelLiteral` typed — same file, `any`-free
~~11. Replace `any` in `collectProperties` helper with `Model`~~ done — property collection typed; `src/` typechecks under `noUncheckedIndexedAccess`
~~12. Make `ProtocolConfigData` a discriminated union~~ done — `ProtocolConfigData` is a discriminated union (`src/state.ts`)
~~13. Remove unsafe `as` casts from state consolidation~~ done — one residual `as unknown as` cast in all of `src/`
~~14. Add `description` field to `Tag` type~~ done — `Tag` carries `description?` (`src/domain/models/asyncapi-document.ts`)

### P2 — Cleanup

~~15. Archive 400+ stale docs into `docs/_archive/`~~ done — `docs/_archive/`
~~16. Remove dead deps: `@alloy-js/core`, `@effect/schema`, `@effect/eslint-plugin`~~ done — dead dependencies gone from `package.json`
~~17. Remove dead deps: `@typespec/emitter-framework` (not imported anywhere)~~ done — `@typespec/emitter-framework` gone
~~18. Remove dead emitter options (5+ accepted but ignored)~~ done — option surface is the `EmitterOptions` model; no dead options accepted
~~19. Simplify `options.ts` (remove 150-line schema validation never used)~~ **Superseded — option handling moved to `src/infrastructure/configuration/` plus `src/emitter.ts`.**
~~20. Remove `Effect.TS` from all test files~~ done — no `@effect` imports in `test/`
~~21. Consolidate 6+ test helper files into 2~~ done — shared helpers live under `test/utils/`
~~22. Remove `console.log` debug spam from tests~~ done — only intentional benchmark output and doc examples remain (`test/benchmark/performance.test.ts`)
~~23. Clean CONTRIBUTING.md content (remove dead plugin/performance sections)~~ done — dead plugin/performance content removed
~~24. Remove dead `path-templates.ts` and `serialization-format-option.ts` from src~~ **Superseded — both files now live under `test/utils/`.**
~~25. Trim `lib.ts` from 273 lines (half is JSDoc)~~ **Won't implement — never trimmed; `src/lib.ts` grew to 318 lines of shipped decorator surface plus JSDoc by design.**

### P3 — Developer Experience

~~26. Add `EmitterOptions` model to `lib/main.tsp` for IDE autocomplete~~ done — `EmitterOptions` model in `lib/main.tsp` line 256
~~27. Fix 3 key examples to compile with `tspconfig.yaml`~~ done — examples compile via `tspconfig.yaml` plus `pnpm run check-examples`
~~28. Commit expected output alongside each example~~ done — expected outputs committed (`examples/simple/expected-output.yaml`, `test/golden/` fixtures)
~~29. Write `docs/DOMAIN_LANGUAGE.md`~~ done — `docs/DOMAIN_LANGUAGE.md`
~~30. Write ADR for Alloy rejection~~ done — `docs/adr/0001-use-asset-emitter-not-alloy.md`
~~31. Write ADR for TypeEmitter (asset-emitter) choice~~ done — the same ADR records the asset-emitter choice
~~32. Add `bun run lint` to verify it passes~~ done — lint runs in `pnpm run verify`

### P4 — Testing

~~33. Add negative tests (invalid decorator usage)~~ done — `test/integration/decorator-negative.test.ts` covers invalid decorator usage
~~34. Add circular reference test~~ done — circular-reference handling tested (`test/unit/shared-schema-types.test.ts`)
~~35. Add multi-namespace test~~ done — `test/integration/multi-namespace-isolation.test.ts`
~~36. Add test for `@tags` in output~~ done — `test/compliance/components-tags.test.ts`
~~37. Add test for `@correlationId` in output~~ done — correlationId asserted in `test/compliance/edge-cases.test.ts` and `reusable-components.test.ts`
~~38. Add test for `@header` in output~~ done — headers asserted in `test/compliance/edge-cases.test.ts` and `decorator-output.test.ts`
~~39. Add test for `@bindings` in output~~ done — `test/compliance/protocol-bindings.test.ts`
~~40. Add server variables test~~ done — server-variables tests in `test/compliance/servers-security.test.ts`
~~41. Add nested model `$ref` test (after implementing)~~ done — nested-model `$ref` tests in `test/compliance/ref-chain.test.ts`
~~42. Add JSON output format test~~ done — `file-type: json` covered in `test/unit/emitter-core.test.ts`

### P5 — Release

~~43. Ensure `bun run build && bun test && bun run lint` all pass~~ done — gate green at tag time per CHANGELOG (1236 tests, 98.0%, 0 clones)
~~44. Update `package.json` version to `0.1.0-alpha`~~ done — released through `v1.2.0` (2026-11-19)
~~45. Verify `pnpm publish --dry-run` works~~ done — superseded by real npm publishes through `v1.2.0`
~~46. Add `.npmignore`~~ done — `.npmignore` exists
~~47. Add GitHub Actions CI workflow~~ done — `.github/workflows/ci.yml`
~~48. Tag git release~~ done — tags `v0.1.0-alpha` through `v1.2.0` exist
~~49. Create GitHub release with notes~~ done — release notes in `CHANGELOG.md`; the v1.2.0 GitHub release is confirmed in TODO_LIST
~~50. Remove `private: false` if not ready to publish, or keep and publish~~ done — `private: false` plus `publishConfig.access: public`; published through `v1.2.0`

---

## g) Top 2 Questions I Cannot Answer Myself

### Question 1: Should nested model references use `$ref` or inline?

Currently, when `model Order { customer: Customer }` is compiled, `Customer` is fully inlined into the `Order` schema. AsyncAPI 3.0 and OpenAPI 3.0 both support `$ref: "#/components/schemas/Customer"` for reusable schemas. The `@typespec/openapi3` emitter uses the AssetEmitter's declaration system to auto-create `$ref` pointers.

**I don't know whether to refactor to `$ref` or keep inlining.** This affects the entire schema generation architecture. Inlining works for simple cases but produces massive duplicated output for deeply nested or shared models. `$ref` is spec-preferred but requires rewriting how `modelDeclaration` handles property types that are themselves models.

### Question 2: Should we validate output in the emitter itself, or only in tests?

The `@typespec/openapi3` emitter does NOT validate its own output — it trusts its own code. We currently validate only in tests (via AJV + `@asyncapi/specs` JSON schema). We could wire validation into `$onEmit` to emit TypeSpec diagnostics when output is invalid, catching bugs earlier for consumers.

**I don't know if this is worth the added complexity and runtime cost.** The AJV compilation step takes ~100ms. For a TypeSpec emitter that runs during compilation, adding 100ms may be acceptable, or it may annoy users. The alternative is to document that validation is test-side only and trust the emitter code.
