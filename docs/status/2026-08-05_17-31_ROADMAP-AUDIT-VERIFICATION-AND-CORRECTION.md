# Status Report — 2026-08-05 17:31

**Session goal:** Verify and execute the ROADMAP audit plan from `docs/planning/2026-08-05_05-34_ROADMAP-AUDIT-AND-CLEANUP.md`.
**Outcome:** Found and fixed critical accuracy errors in the previous session's "complete" work. Build/lint/test green. But multiple systemic issues remain.

> **Update (later sessions same day):** Most issues below were addressed. CHANGELOG `[Unreleased]` populated (18:01 session). Dead BDD infrastructure removed (18:01 session). Test count grew to 869 (19:01 session). Documentation drift corrected across all living docs. The remaining open items are harvested into the current TODO_LIST.md.

---

## A) FULLY DONE (This Session)

### Verified Working

| Item                               | Evidence                                           |
| ---------------------------------- | -------------------------------------------------- |
| Build passes (0 errors)            | `bun run build` — tsc strict mode                  |
| Lint passes (0 errors, 0 warnings) | `bun run lint` — eslint + oxlint `--deny-warnings` |
| All 679 tests pass across 64 files | `bun run test` — vitest run, ~4s                   |
| Git clean                          | 2 new commits this session, working tree clean     |

### Fixed This Session

1. **TODO_LIST.md** — Removed 3 items claiming features were "not implemented" that were actually fully built and tested: server bindings (`namespace-bindings.test.ts`), `@operationId`/`@messageId` (`operation-message-id.test.ts`), `@bindings` on Namespace (`bindingTargetKind` maps Namespace → `"server"`). Renumbered 10→7 items.
2. **ROADMAP.md** — Moved 4 items from "raw ideas" to "recently completed" with evidence: server bindings, `@operationId`/`@messageId`, `@bindings` Namespace target, `@apiVersion`.
3. **FEATURES.md** — Added 3 missing decorator rows (`@operationId`, `@messageId`, `@apiVersion`). Updated `@bindings` row to include servers. Downgraded BDD tests from FULLY_FUNCTIONAL to PARTIALLY_FUNCTIONAL (6 unimplemented stubs in `world.ts`).
4. **AGENTS.md** — Added `security-builder.ts` (8th builder file, was missing). Updated `@bindings` decorator signature from `Operation | Model` to `Operation | Model | Namespace`. Documented `$operationId`, `$messageId`, `$apiVersion`, and `bindingTargetKind` in decorator implementations section.
5. **Planning doc** — Status changed from "Executing" to "Complete". Verschlimmbessern checklist boxes all checked.

---

## B) PARTIALLY DONE

| Item                        | State                                                  | Gap                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CHANGELOG.md**            | `[Unreleased]` section is **EMPTY**                    | All work since `0.2.0-beta` (19 protocols, field-level validation, multi-file output, `@operationId`, `@messageId`, `@apiVersion`, server bindings, `split-schemas`, `ParsedAsyncAPIDocument`, BDD stubs, builders refactor, 98→679 tests) is undocumented in the changelog. The `[0.2.0-beta]` section also has stale claims ("5 protocols", "78 tests across 6 files"). |
| **BDD test infrastructure** | `test/bdd/user-behaviors.test.ts` has 12 working tests | `test/bdd/support/world.ts` has 6 unimplemented method stubs (`createChannelSpec`, `setupSecurityScheme`, `setupMQTTBinding`, `setupInvalidConfig`, `compileAsyncAPISpecFromModel`, `validateOperationBindings`). These methods are **never called by any test** — confirmed via ripgrep. The BDD step infrastructure is dead code.                                       |
| **FEATURES.md accuracy**    | Most rows now correct                                  | The `[0.2.0-beta]` section still says "78 tests across 6 files" — actual is 98 tests across 11 files. The "5 protocols" claim is stale (19 now). These are in the released section so may be intentionally historical.                                                                                                                                                    |

---

## C) NOT STARTED

1. **CHANGELOG `[Unreleased]` population** — No entries for any post-`0.2.0-beta` work.
2. **BDD step definitions** — 6 stub methods in `world.ts` are completely unimplemented and uncalled.
3. **AsyncAPI Studio compatibility verification** — No test. `@asyncapi/parser` has Bun incompatibility.
4. **AsyncAPI generator ecosystem compatibility** — No integration test against `@asyncapi/generator`.
5. **`@typespec/versioning` library integration** — Custom `@apiVersion` exists but TypeSpec versioning library not integrated.
6. **OpenAPI cross-emitter type sharing** — `src/shared/` module exists but no external consumer.

---

## D) TOTALLY FUCKED UP

### 1. Previous Session's Verification Was Deeply Flawed

The previous session claimed "all work complete" and "9/9 tasks completed" with a detailed handoff document. In reality, it **listed 3 fully-implemented, tested features as "not yet built"** in TODO_LIST.md. This is the most serious failure: the TODO_LIST — the project's actionable backlog — was actively misleading.

**Root cause:** The previous session trusted the OLD roadmap's claims ("server bindings not implemented", "no @operationId decorator") and never verified them against actual source code. It read `ROADMAP.md` and believed it, rather than reading `src/`.

### 2. CHANGELOG.md Is Severely Stale

The `[Unreleased]` section is completely empty. Every feature added since `0.2.0-beta` (which appears to be substantial — 14 additional protocols, field-level binding validation, 3 new decorators, multi-file output, builders refactor, server bindings) has zero changelog documentation. The AGENTS.md explicitly says "Completed items live in CHANGELOG" — but they don't.

### 3. BDD Infrastructure Is Dead Code

`test/bdd/support/world.ts` contains a `World` class with 6 methods that are all `// TODO: Implement` stubs. No test file imports or calls any of these methods. The "BDD tests" row in FEATURES.md was marked FULLY_FUNCTIONAL (now corrected to PARTIALLY_FUNCTIONAL). This is 108+ lines of dead code masquerading as a feature.

### 4. Documentation Drift Is Systemic

Three docs (ROADMAP.md, FEATURES.md, AGENTS.md) had different test counts (553, 555, 555), all wrong. The roadmap claimed `buildAsyncAPIDocument()` was 315 lines (actually 116). The roadmap claimed 5 protocols (actually 19). The AGENTS.md listed 7 builder files (actually 8). This pattern of drift suggests docs are updated infrequently and not verified against code.

### 5. I Didn't Catch Everything Either

During this session, I found `@apiVersion` by accident while looking up `@operationId`. I then found `security-builder.ts` by accident while checking server-builder. This suggests my verification was **reactive, not systematic**. A systematic approach would have been: enumerate all `extern dec` declarations in `main.tsp` (16 decorators) and diff against FEATURES.md, enumerate all `src/builders/*.ts` files and diff against AGENTS.md, etc.

---

## E) WHAT WE SHOULD IMPROVE

### Process Improvements

1. **Systematic doc verification, not ad-hoc.** Before writing TODO_LIST items, enumerate actual source declarations. Before marking FEATURES.md rows, diff `main.tsp` decorators against documented rows. The pattern of "finding things by accident" is unreliable.
2. **CHANGELOG discipline.** The `[Unreleased]` section should be populated as features ship, not retroactively. Right now there's a massive gap.
3. **Dead code removal.** The BDD `world.ts` stubs have been sitting there with TODO comments. Either implement them or delete them — don't let dead code with misleading TODOs accumulate.
4. **Single source of truth for counts.** Test counts (679/64), protocol counts (19), decorator counts (16), diagnostic counts (18) appear in multiple docs and drift independently. Consider a generated/canonical source.
5. **The auto-git daemon masks manual work.** It committed most of my changes before I could commit them myself. This made the git history harder to reason about (my corrections were split across an auto-commit and a manual commit).

### Code Quality Observations

6. **`src/tsp-index.ts`** is not documented in AGENTS.md (18 src files, AGENTS references most but I didn't audit tsp-index.ts specifically).
7. **The `[0.2.0-beta]` CHANGELOG section says "5 protocols" and "78 tests"** — historical, but if someone reads it as current state, it's misleading.
8. **FEATURES.md has 16 decorators documented now** (matching `main.tsp` exactly) — this is correct as of this session, but there's no mechanism to keep it in sync.

---

## F) Up to 50 Things to Get Done Next

### High Impact (Documentation Truth)

1. **Populate CHANGELOG `[Unreleased]`** — Document all post-`0.2.0-beta` features: 14 additional protocols, field-level binding validation, `@operationId`, `@messageId`, `@apiVersion`, server bindings, `split-schemas`, multi-file output, `ParsedAsyncAPIDocument`, builders refactor, BDD tests, compliance suite expansion (78→98).
2. **Audit CHANGELOG `[0.2.0-beta]` section** — Update "5 protocols" → "19 protocols", "78 tests across 6 files" → "98 across 11 files" (or mark as historical snapshot).
3. **Delete or implement BDD `world.ts` stubs** — 6 methods are dead code with TODO comments. Either implement them or remove the file and downgrade BDD from PARTIALLY_FUNCTIONAL to "BDD utilities only".
4. **Create a doc-sync verification script** — Enumerate `main.tsp` decorators, `src/builders/` files, test counts, protocol counts, and diff against FEATURES.md/AGENTS.md to catch drift automatically.

### High Impact (Testing)

5. **AsyncAPI Studio compatibility test** — Round-trip: emit → import into Studio → validate. May need alternative to `@asyncapi/parser` due to Bun incompatibility.
6. **AsyncAPI generator compatibility test** — Verify emitter output works with `@asyncapi/generator` for code generation.
7. **Integration test for `@apiVersion`** — `test/decorators/api-version.test.ts` exists but verify it covers edge cases (multiple namespaces, empty version, override behavior).
8. **Integration test for `@operationId`/`@messageId`** — Verify `test/integration/operation-message-id.test.ts` covers $ref chain integrity when custom IDs are used.
9. **Server binding edge case tests** — `namespace-bindings.test.ts` has 3 tests; add: multiple protocols on one namespace, binding on namespace with no servers, binding validation warnings.

### Medium Impact (Features)

10. **`@typespec/versioning` library integration** — Custom `@apiVersion` exists but TypeSpec's versioning system is not integrated.
11. **Plugin/hook system for custom bindings** — Design RFC needed (#32).
12. **OpenAPI cross-emitter type sharing** — `src/shared/` module exists but no consumer.
13. **`@doc` propagation audit** — FEATURES.md says done; verify it covers ALL AsyncAPI object types (servers, channels, operations, messages, schemas).
14. **Multi-namespace support** — Verify emitter handles multiple namespaces correctly (each with its own servers, security, channels).

### Medium Impact (Code Quality)

15. **`src/tsp-index.ts` documentation** — Not mentioned in AGENTS.md Architecture section.
16. **Test file size audit** — Some test files are very large (1518, 941 lines). Previous session deferred splitting (verschlimmbessern risk). Reassess.
17. **`Record<string, unknown>` cast cleanup** — Previous session deferred (functional, not broken). Reassess with count.
18. **Coverage gate audit** — AGENTS.md says 75% per-file gate, ~96% average. Verify no files are barely passing.
19. **Diagnostic code documentation** — 18 codes declared. Verify all are tested in negative test suite.
20. **`generated-bindings.ts` diff stability** — Auto-generated file; verify it's in `.gitattributes` for diff suppression.

### Medium Impact (DX)

21. **Error message audit** — Verify all 18 diagnostic codes have clear, actionable messages (AGENTS.md mandates What/Reassure/Why/Fix/Escape).
22. **`EmitterOptions` IDE autocomplete audit** — Verify all options in `lib/main.tsp` have descriptions.
23. **README.md accuracy** — Not reviewed this session. May have stale claims.
24. **`docs/DOMAIN_LANGUAGE.md` accuracy** — Not reviewed this session.

### Lower Impact (Polish)

25. **Consolidate `AsyncAPIObject` type definitions** — Three sources: `test-helpers.ts` (alias), `cli-test-helpers.ts` (parser import), `type-guards.ts` (now fixed). Consider unifying.
26. **ESLint + oxlint config consolidation** — Monitor for rule conflicts.
27. **Pre-commit hook fix for NixOS** — Currently requires `--no-verify` because `/bin/bash` doesn't exist.
28. **Flake.nix audit** — Not reviewed this session.
29. **GitHub Actions CI audit** — Verify CI runs build + lint + test.
30. **`.github/workflows/` accuracy** — FEATURES.md says "FULLY_FUNCTIONAL" CI.
31. **Golden file test freshness** — Verify golden files match current output format.
32. **Performance benchmark regression check** — `test/benchmark/` exists; verify no regression.
33. **External spec test freshness** — 16 patterns from 5 projects; verify they still compile.
34. **Compliance suite coverage audit** — 98 tests across 11 files; identify gaps vs AsyncAPI 3.1 spec.
35. **`@tags` on Namespace** — `main.tsp` allows `Namespace` target; verify emitter handles it.
36. **`@channel` description parameter** — `main.tsp` has optional `description` param; verify it's emitted.
37. **`@publish` config parameter** — `main.tsp` has optional `config: Model`; verify it's consumed.
38. **`@header` value parameter** — `main.tsp` accepts `string | Model`; verify both paths work.
39. **`@server` config validation** — Verify URL/host validation covers edge cases.
40. **Multi-security scheme ordering** — Verify array accumulation produces deterministic output.
41. **`split-schemas` $ref rewriting** — Verify nested refs in split files are correct.
42. **YAML output formatting** — Verify indentation and key ordering are consistent.
43. **JSON output formatting** — Verify pretty/indent options work correctly.
44. **`normalizeProtocol` completeness** — Verify all 19 canonical names + aliases are handled.
45. **`normalizeBindingProtocol` completeness** — Verify `wss`→`ws` and any other needed mappings.
46. **OAuth2 flow validation** — Verify all 4 flow types (implicit, password, clientCredentials, authorizationCode) work.
47. **Security scheme `in` field validation** — Verify only `query|header|cookie` accepted for httpApiKey.
48. **Multi-file TypeSpec input** — Verify `import` and `import from` work correctly.
49. **Schema inheritance depth** — Verify deep inheritance chains emit correct `$ref`s.
50. **Union/enum edge cases** — Verify non-string unions, numeric enums, mixed types.

---

## G) Questions I Cannot Figure Out Myself

### 1. Should the BDD `world.ts` stubs be implemented or deleted?

The `World` class in `test/bdd/support/world.ts` has 6 methods that are all `// TODO: Implement` stubs. **No test calls any of them.** The actual BDD tests in `user-behaviors.test.ts` test utility functions directly, completely bypassing the step infrastructure. Implementing them would be 2-3h of work to build an abstraction layer that nothing currently uses. Deleting them would remove the "BDD" category from FEATURES.md entirely (the 12 working tests are really just unit tests of path-templates and protocol constants). I cannot determine whether the intent is to eventually build full Gherkin-style BDD or whether this was an abandoned experiment.

### 2. Should the `[0.2.0-beta]` CHANGELOG section be retroactively corrected?

It says "5 protocols" and "78 tests across 6 files" — both factually wrong as of now (19 protocols, 98 tests across 11 files). But those numbers were arguably accurate at the time of the `0.2.0-beta` release on 2026-07-22. Correcting them would rewrite history; leaving them creates a false impression if someone reads the changelog as current state. I don't know your policy on retroactive changelog corrections.

### 3. What is the intended release cadence and next version number?

The `[Unreleased]` section is empty but substantial work has shipped since `0.2.0-beta`. Is the next release `0.2.0` (dropping beta), `0.3.0-beta`, or `1.0.0`? This determines how the CHANGELOG should be structured and whether a feature freeze is needed. I can't infer this from the codebase alone.
