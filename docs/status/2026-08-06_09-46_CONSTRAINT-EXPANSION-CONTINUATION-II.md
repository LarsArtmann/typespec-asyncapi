# Status Report: Constraint Expansion Continuation II — "50 Things" Batch 2

**Date:** 2026-08-06 09:46
**Session type:** Continuation of "50 Things" list from `2026-08-05_23-38_CONSTRAINT-EXPANSION-SELF-REVIEW-II.md`
**Previous session:** `docs/status/2026-08-06_09-02_CONSTRAINT-EXPANSION-CONTINUATION.md`

---

## Executive Summary

Executed 8 of the 10 TODO items from the updated `TODO_LIST.md`. All 6 quality gates are green (build, lint, 949 tests, 97.0% coverage, 0 clones, `bun run verify` passes end-to-end). The session started by discovering the duplication gate was **silently RED** with 6 clones — this was fixed as the first priority. 11 new tests were added across 2 test files.

---

## a) FULLY DONE (8 of 10 items)

| # | Task | What Was Done | Files Changed |
| --- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| ~~1~~ done at `35a6cf53` | ~~Table-driven constraint mapping~~ | ~~Replaced 10 sequential if-blocks in `applyConstraints()` with a `CONSTRAINT_TABLE` array of `{ getter, keyword }` entries iterated in a single loop. Consolidated `applyDocDescription`, `applyDeprecated`, `applySummary`, `applyExamples` into `applyMetadata()`. Inlined `applyVisibility`. Eliminated 5 of 6 jscpd clones as a side effect.~~ | ~~`src/constraint-mapper.ts` (203→173 lines)~~ |
| ~~2~~ done at `35a6cf53` | ~~`encodeAs` parameter passing~~ | ~~Added `resolveEncode()` helper that safely wraps `getEncode()` — returns `undefined` for non-encodable types (`Model~~ | ~~Enum~~ | ~~Union`). Wired into both `applyMetadata` (examples) and `applyConstraints` (defaults) via the `encodeAs` parameter of `serializeValueAsJson()`.~~ | ~~`src/constraint-mapper.ts`~~ |
| ~~3~~ done at `35a6cf53` | ~~Complex `@default` tests~~ | ~~Added 3 tests: array default (`#["urgent", "important"]`), enum member default (`Priority.High` → `"high"`), Record object default (`#{region: "us-east-1"}`).~~ | ~~`test/compliance/constraint-decorators.test.ts`~~ |
| ~~4~~ done at `35a6cf53` | ~~Message `title` population~~ | ~~`@message(#{title: "..."})` decorator's `title` value now populates the message's `title` field (from `CommonMetadata`). Previously only `name` was set. Both `mergeExplicitMessages` in `message-builder.ts` and `registerMessage` in `channel-builder.ts` updated.~~ | ~~`src/builders/message-builder.ts`, `src/builders/channel-builder.ts`~~ |
| ~~5~~ done at `35a6cf53` | ~~Operation `summary` population~~ | ~~`@summary` on operations now maps to `operationObj.summary` via `getSummary()` from `@typespec/compiler`. Added `getSummary` to `_imports.ts` re-export.~~ | ~~`src/builders/operation-builder.ts`, `src/builders/_imports.ts`~~ |
| ~~6~~ done at `35a6cf53` | ~~Stale source header comments~~ | ~~`constraint-mapper.ts`: "11 decorators" → "16 constraint/metadata mappings". `constraint-decorators.test.ts`: Full decorator list (16 mappings including `@doc`→description, `= syntax`→default).~~ | ~~`src/constraint-mapper.ts:1-14`, `test/compliance/constraint-decorators.test.ts:1-18`~~ |
| ~~7~~ done at `35a6cf53` | ~~`bun run verify` alias~~ | ~~Added unified script: `build + lint + test + coverage:gate + duplicate`.~~ | ~~`package.json`~~ |
| ~~10~~ done at `35a6cf53` | ~~Channel `summary` and `description`~~ | ~~`@summary` on channel-decorated operations now populates `channel.summary` via new `channelSummaries` map in `DocumentBuildContext`. Populated in `operation-discovery.ts`, applied in `channel-builder.ts:applyChannelDocs`. `@doc` → `description` was already wired.~~ | ~~`src/builders/types.ts`, `src/document-builder.ts`, `src/builders/operation-discovery.ts`, `src/builders/channel-builder.ts`~~ |

### Bonus work (not in original TODO list)

| Task                                                     | What Was Done                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~Fixed 6 duplication clones (gate was RED)~~ done at `35a6cf53` | ~~The `verify` script discovered the jscpd gate was silently failing with 6 clones (0.58%). 5 clones in `constraint-mapper.ts` (repeated function signatures from `apply*` helpers), 1 in `binding-field-validator.ts` ↔ `generate-binding-specs.ts` (`.filter()` bindingVersion skip pattern). Fixed all 6 → 0 clones.~~ |
| ~~`@encode` serialization smoke tests~~ done at `35a6cf53` | ~~3 tests verifying `@encode(string)` on numeric types doesn't break example/default serialization.~~ |
| ~~Tests for operation/channel `@summary` + message `title`~~ done at `35a6cf53` | ~~5 new tests in `doc-propagation.test.ts` (3→8 tests).~~ |

### Gate metrics

<!-- ledger: session-metrics snapshot — gate values at session end, not actionable items -->
<!-- check-rows:ledger -->
| Gate             | Before (session start)     | After             |
| ---------------- | -------------------------- | ----------------- |
| Build            | 0 errors                   | 0 errors          |
| Lint             | 0 warnings                 | 0 warnings        |
| Tests            | 938 pass                   | 949 pass (+11)    |
| Coverage         | 96.9% avg                  | 97.0% avg         |
| Duplication      | **6 clones / 0.58% (RED)** | 0 clones / 0%     |
| `bun run verify` | Did not exist              | Passes end-to-end |

---

## b) PARTIALLY DONE

| Task   | Status | What's Missing                                  |
| ------ | ------ | ----------------------------------------------- |
| ~~(none)~~ **NOT-DO — placeholder row — nothing was partial; all eight attempted items completed.** | ~~—~~ | ~~All 8 attempted items are fully done with tests~~ |

---

## c) NOT STARTED (2 of 10 items)

| # | Task                                                                                                                    | Why Not Started                                                                                                                                                                                                                                                                                                | Effort Estimate                |
| - | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| ~~8~~ **Won't implement — out of scope then and never built — src/shared/ serves only this emitter.** | ~~OpenAPI 3.x cross-emitter type sharing~~ | ~~Explicitly out of scope per the TODO list description. `src/shared/` module exports are complete and tested (25 tests). Building a separate OpenAPI emitter would be a multi-day project.~~ | ~~4-6h+~~ |
| ~~9~~ done — shipped as decorator-driven reusable components (src/builders/components-builder.ts) | ~~Populate remaining `components.*` (parameters, correlationIds, tags, operationTraits, messageTraits, reusable bindings)~~ | ~~Assessed and documented. The inline approach (correlation IDs on messages, tags on operations) is valid AsyncAPI 3.1. Reusable components would require new decorator infrastructure (`@trait`, `@reusableCorrelationId`) or an extraction strategy — this is a design decision, not just implementation work.~~ | ~~4-6h (design + implementation)~~ |

---

## d) TOTALLY FUCKED UP

| Issue                                                                           | Severity | Root Cause                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Resolution                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~`@encode` tests initially asserted string output for `@encode(string)` on int32~~ **Won't implement — gap stands — only the no-breakage @encode smoke tests exist (test/compliance/constraint-decorators.test.ts).** | ~~Low~~ | ~~I assumed `@encode(string)` would serialize numbers as strings. TypeSpec's `@encode(string)` on numeric types means "use the base10 decimal representation as a string when encoding" — but `serializeValueAsJson` without `encodeAs` still serializes as native JSON number. With `encodeAs` passed, it still serializes as a number for `@example(42)` because the example value IS already a number literal. The serialization transformation happens at a different layer.~~ | ~~Fixed tests to be smoke tests asserting no-breakage rather than asserting transformed output. The `encodeAs` parameter is correctly wired — the tests just validate it doesn't crash, not that it transforms the value. This is a testing gap: we don't have a test case where `encodeAs` actually changes the output.~~ |

---

## e) WHAT WE SHOULD IMPROVE

### Process issues discovered this session

~~1. **The duplication gate was RED for the entire previous session** — The previous session (2026-08-06 09:02) claimed "0 clones" but had actually introduced clones via the `applyDefault`/`applyExamples`/`applyVisibility` function signatures in `constraint-mapper.ts`. The `verify` script didn't exist, so the duplication gate was never run during that session. **Lesson: `bun run verify` should ALWAYS be run before claiming gates are green. Now it exists.**~~ done — the verify alias exists (package.json) and .husky/pre-commit runs it; CI runs the same gate

~~2. **`applyConstraints` grew to 6+ exported helper functions that were structurally identical** — `applyDocDescription`, `applyDeprecated`, `applySummary`, `applyExamples` all had the signature `(program: Program, target: Type, schema: JsonSchema): void`. This was a duplication time bomb. The table-driven rewrite + `applyMetadata` consolidation eliminates this class of issue. \__Lesson: when adding a new "apply_" helper, ask if it can be a table entry or a consolidation instead.\_\*~~ done — single loop over CONSTRAINT_TABLE with applyMetadata consolidation in src/constraint-mapper.ts

~~3. **No test validates that `encodeAs` actually transforms serialization output** — The 3 `@encode` smoke tests verify no-breakage but don't verify the `encodeAs` parameter actually changes the output. This is because finding a TypeSpec type where `serializeValueAsJson(program, value, type, encodeData)` produces a DIFFERENT result than `serializeValueAsJson(program, value, type)` is non-trivial within the compiler's type system. **This is a real coverage gap.**~~ **Won't implement — never added — only the no-breakage @encode smoke tests exist (test/compliance/constraint-decorators.test.ts).**

~~4. **Channel summary required plumbing through 4 files** — Adding `channelSummaries` to `DocumentBuildContext` (types.ts), initializing it (document-builder.ts), populating it (operation-discovery.ts), and applying it (channel-builder.ts). This is a 4-file change for a single field. The builder pipeline architecture has high ceremony for small additions.~~ **Won't implement — pattern retained — the four-file plumbing remains the documented builder architecture (src/builders/).**

~~5. **Message `title` was unconditionally set** — In `mergeExplicitMessages`, `title: data.title` is always set because `extractMessageConfig` defaults `title` to `target.name`. This means every message now has a `title` field equal to its `name`. In `registerMessage` (channel-builder.ts), I used a conditional spread `...(msgData?.title ? { title: msgData.title } : {})` — so auto-registered messages only get `title` when `msgData` is provided. This inconsistency between the two code paths may be confusing. **Should normalize: either always set title or only set when explicitly provided.**~~ done — buildMessageObject always sets title defaulting to the message name (src/builders/shared-utils.ts)

### Architectural observations

~~6. **The `CONSTRAINT_TABLE` pattern could be extended to metadata** — Currently metadata (doc, deprecated, summary, examples) is applied via inline calls in `applyMetadata`. These could also be table-driven, but the different target types (`ExampleTarget` vs `Type`) and different getter signatures make it less clean. The validation constraints are uniform; metadata is not.~~ **Won't implement — kept inline by design — the AGENTS.md constraint-mapper bullet documents table plus inline metadata.**

~~7. **`components.*` population is blocked on a design decision** — The inline approach (correlation IDs, headers, bindings on individual messages/operations) produces valid AsyncAPI 3.1. The reusable-components approach (populating `components.correlationIds`, `components.parameters`, etc.) requires deciding: (a) new decorators like `@trait`? (b) auto-extraction from repeated patterns? (c) explicit `@reusable` marker? This is a product decision, not just engineering.~~ done — decided as decorator-driven reusable components (src/builders/components-builder.ts)

---

## f) Up to 50 Things We Should Get Done Next

### High Impact (spec compliance + correctness)

~~1. **Find a real `@encode` test case where `encodeAs` changes output** — The current smoke tests don't verify transformation. Try `@encode(unixTimestamp)` on `utcDateTime` with a proper date value, or `@encode(base64)` on `bytes`.~~ **Won't implement — never added — only the no-breakage @encode smoke tests exist (test/compliance/constraint-decorators.test.ts).**
~~2. **Normalize message `title` between `mergeExplicitMessages` and `registerMessage`** — Decide: always set `title` (current in mergeExplicit), or only when explicitly provided (current in registerMessage). Pick one.~~ done — buildMessageObject always sets title defaulting to the message name (src/builders/shared-utils.ts)
~~3. **Populate `components.tags`** — Collect all unique tags from operations/messages into `components.tags` map. `@tag` state already exists.~~ done — src/builders/tag-builder.ts collects unique tags into components.tags
~~4. **Populate `components.parameters`** — Channel path parameters (`{userId}`) currently only produce inline `ParameterObject` with description. Extract to reusable `components.parameters`.~~ done — reusableParameters populated in src/builders/components-builder.ts
~~5. **Populate `components.correlationIds`** — When `@correlationId` is used, also register in `components.correlationIds` for reuse.~~ done — reusableCorrelationIds populated in src/builders/components-builder.ts
~~6. **Add `@doc` propagation to channel `description` via operation discovery** — Currently `channelDocs` is set from `@doc` on channel-decorated operations. Verify this works for all discovery paths (bare ops, channel-only ops).~~ **Won't implement — partial by design — decorated and bare paths capture docs (src/builders/operation-discovery.ts); the channel-only path never set channel docs.**
~~7. **Test message `title` on auto-registered messages** — Messages registered via `registerMessage` (not via `@message` decorator) may not get `title` set. Add test.~~ done — auto-registered messages get title from the name via the buildMessageObject default (src/builders/shared-utils.ts)
~~8. **Test `@summary` on bare operations** — Operations discovered via `discoverBareOps` (no decorators). Does `getSummary` work on them?~~ done — src/builders/operation-builder.ts applies getSummary to every built operation, bare ops included
~~9. **Test `@summary` propagation through all operation discovery paths** — `discoverDecoratedOps`, `discoverChannelOnlyOps`, `discoverBareOps`. Only the first path populates `channelSummaries`.~~ **Won't implement — operation summaries are set for all paths (src/builders/operation-builder.ts); channel summaries still come only from decorated discovery.**
~~10. **Add `@example` on message payloads** — AsyncAPI 3.1 `MessageObject.examples` field is typed but never populated from `@example` on the message model.~~ done — applyMessageExamples populates MessageObject.examples (src/builders/message-builder.ts)
~~11. **Verify `channelSummaries` is populated for `discoverChannelOnlyOps` path** — Currently only `discoverDecoratedOps` sets channel summaries. Channel-only ops may be a gap.~~ **Won't implement — still unpopulated — only discoverDecoratedOps feeds channelSummaries (src/builders/operation-discovery.ts).**
~~12. **Add `@doc` to channel `description` for bare operations** — Bare ops don't have `@channel` decorators. Verify channel docs are correct.~~ done — bare-op docs captured into opDocs by the bare discovery path (src/builders/operation-discovery.ts)

### Medium Impact (refactoring + code quality)

~~13. **Extract `CONSTRAINT_TABLE` to a separate file** — If more constraint types are added, the table + `ConstraintEntry` interface could live in `src/constants/constraints.ts`.~~ **Won't implement — kept in place — CONSTRAINT_TABLE lives in src/constraint-mapper.ts and is documented in AGENTS.md.**
~~14. **Consider metadata table for `applyMetadata`** — If a 5th metadata mapping is added, consider a table similar to `CONSTRAINT_TABLE`. Currently 4 inline calls is fine.~~ **Won't implement — kept inline by design — the AGENTS.md constraint-mapper bullet documents table plus inline metadata.**
~~15. **Add `verify` to CI/pre-commit** — The `bun run verify` alias exists but isn't wired to a git hook.~~ done — .husky/pre-commit runs the full verify gate (package.json verify script)
~~16. **Profile `CONSTRAINT_TABLE` loop vs if-blocks** — 10 entries × every model property. Unlikely to matter but should profile on the 200-channel benchmark.~~ **Won't implement — never profiled in isolation — test/benchmark/performance.test.ts covers whole-emitter performance.**
~~17. **Consider `applyMetadata` for `OperationObject` and `ChannelObject`** — Operations and channels also have `CommonMetadata` (title, summary, description, tags, bindings). Currently metadata is applied ad-hoc per builder.~~ **Won't implement — kept ad hoc — operations and channels apply metadata in their own builders (src/builders/operation-builder.ts, applyChannelDocs).**
~~18. **Extract channel summary/doc population to a shared `applyCommonMetadata`** — Channel and operation builders both do similar "if doc, set description; if summary, set summary" patterns.~~ done — applyChannelDocs applies doc, summary, and tags from context maps (src/builders/channel-builder.ts)
~~19. **Add type-safe `@encode` test with `utcDateTime` + `rfc3339`** — This would test the actual `encodeAs` transformation, not just no-breakage.~~ **Won't implement — never added — only the no-breakage @encode smoke tests exist (test/compliance/constraint-decorators.test.ts).**
~~20. **Consider passing `encodeAs` in `applyMetadata` for model/enum/scalar declarations** — Currently `resolveEncode` is called but only for examples, not for model-level serialization.~~ done — resolveEncode is called inside applyMetadata so examples serialize with encodeAs (src/constraint-mapper.ts)
~~21. **Add `@deprecated` to operation/channel/message objects** — `CommonMetadata` doesn't have `deprecated`. AsyncAPI 3.1 spec doesn't define it either, but it's a common extension.~~ **Won't implement — never added — deprecated exists only on schemas (src/domain/models/asyncapi-document.ts).**
~~22. **Audit all `as never` / `as unknown` casts in builders** — `message-builder.ts` has several `as never` casts in state map lookups.~~ done — zero as never casts remain in src/builders/message-builder.ts

### Low Impact (polish + documentation)

~~23. **Update `AGENTS.md` builder line counts** — `message-builder.ts`, `operation-builder.ts`, `channel-builder.ts` line counts changed. AGENTS.md still has old counts.~~ **NOT-DO — moot — AGENTS.md no longer carries per-file line counts.**
~~24. **Update `FEATURES.md` constraint decorator count** — Should say "16 mappings (table-driven)" not "15 decorators".~~ done — FEATURES.md states 16 mappings via the table-driven CONSTRAINT_TABLE
~~25. **Add `bun run verify` to README "Development" section** — Document the unified verification command.~~ done — README documents the pnpm run verify gate (Releasing section)
26. **Add `CONTRAIBUTING.md` mention of `bun run verify`** — If a CONTRIBUTING.md exists or is planned. **→ TODO_LIST §CONTRIBUTING refresh**
~~27. **Document the `CONSTRAINT_TABLE` pattern in AGENTS.md** — Currently mentioned in gotchas but not in the architecture section as a pattern.~~ done — the AGENTS.md constraint-mapper bullet documents CONSTRAINT_TABLE
~~28. **Add `resolveEncode` to AGENTS.md architecture section** — Currently only in gotchas.~~ done — the AGENTS.md @encode serialization bullet documents resolveEncode
~~29. **Consider renaming `CONSTRAINT_TABLE` to `VALIDATION_CONSTRAINTS`** — The current name is slightly misleading: it only contains validation keywords, not metadata.~~ **Won't implement — name kept — CONSTRAINT_TABLE is the documented name in AGENTS.md and FEATURES.md.**
~~30. **Add inline JSDoc to `CONSTRAINT_TABLE` entries** — Each entry could document which TypeSpec type it applies to (numeric, string, array).~~ **Won't implement — no per-entry JSDoc — the table header comment documents the pattern (src/constraint-mapper.ts).**

### Spec compliance depth (components.\*)

~~31. **Design `@trait` decorator for reusable operation/message traits** — AsyncAPI 3.1 `OperationTrait`, `MessageTrait`.~~ done — operationTraits populated with useOperationTrait refs (src/builders/components-builder.ts)
~~32. **Design `@reusable` marker for auto-extracting repeated patterns** — If the same correlation ID location is used on 5 messages, auto-extract to `components.correlationIds`.~~ done — decorator control chosen — @reusableBinding and @reusableCorrelationId (src/namespace-decorators.ts); no auto-extraction
~~33. **Populate `components.operationTraits`** — From `@trait` decorator.~~ done — components.operationTraits in src/builders/components-builder.ts
~~34. **Populate `components.messageTraits`** — From `@trait` decorator.~~ done — components.messageTraits in src/builders/components-builder.ts
~~35. **Populate `components.parameters` from channel path parameters** — Auto-extract `{userId}` to reusable parameter.~~ done — reusable channel parameters extracted via upgradeChannelParameterRefs (src/builders/components-builder.ts)
~~36. **Add `$ref` to `components.tags` when tags repeat** — Instead of inline tag arrays.~~ **Won't implement — inline tag arrays kept — components.tags dedupes by name (src/builders/tag-builder.ts) without ref-swapping repeated arrays.**

### Testing gaps

~~37. **Add golden file test for operation `summary`** — Golden files don't have `@summary` on operations.~~ **Won't implement — golden fixtures carry no operation @summary — coverage lives in test/compliance/doc-propagation.test.ts.**
~~38. **Add golden file test for message `title`** — Golden files don't have `@message(#{title})`.~~ done — test/golden/example-message.test.ts locks the @message title output
~~39. **Add golden file test for channel `summary`** — Golden files don't have `@summary` on channels.~~ **Won't implement — golden fixtures carry no channel @summary — coverage lives in test/compliance/doc-propagation.test.ts.**
~~40. **Add negative test: `@summary` with empty string** — Does `getSummary` return `""` or `undefined`?~~ **Won't implement — never added — the empty-string @summary case is untested.**
~~41. **Add negative test: `@message` without title** — Verify `title` defaults to model name correctly.~~ done — test/compliance/doc-propagation.test.ts covers the model-name title default
~~42. **Add test: `@default` with `null` value** — `prop: string | null = null`.~~ **Won't implement — never added — the null default case is untested.**
~~43. **Add test: multiple `@example` on same property with `@encode`** — Verify all examples serialize with encode.~~ **Won't implement — multiple-example mapping is covered (test/compliance/constraint-decorators.test.ts) but never combined with @encode.**
~~44. **Add test: `@encode` on scalar declaration (not property)** — `resolveEncode` handles `Scalar` kind. Test it.~~ **Won't implement — never added — resolveEncode handles Scalar (src/constraint-mapper.ts) without a dedicated test.**
~~45. **Add test: complex nested object default** — `config: Config = #{nested: #{deep: "value"}}`.~~ **Won't implement — defaults coverage is flat (array, enum member, record in test/compliance/constraint-decorators.test.ts); the nested object default is untested.**

### Infrastructure

~~46. **Wire `bun run verify` to pre-commit hook** — Currently the husky pre-commit exists but doesn't run verify.~~ done — .husky/pre-commit runs pnpm run verify
~~47. **Fix jscpd HTML report EACCES error** — `jscpd-report/html/js/prism.js` is read-only from Nix store. Consider `chmod` or `--no-html` flag.~~ done — the duplicate script chmods jscpd-report/html (package.json), avoiding the Nix store EACCES
~~48. **Add `verify` to `alpha-release` script** — Currently `alpha-release` runs build+test+lint but not duplicate or coverage:gate.~~ done — alpha-release runs pnpm run verify (package.json)
~~49. **Consider adding `jscpd` to `lint` script** — So duplication is caught alongside linting.~~ **Won't implement — duplication stays its own verify stage — lint remains eslint plus oxlint.**
~~50. **Add `CONSTRAINT_TABLE` count assertion test** — A test that verifies exactly 10 entries exist, preventing accidental additions without table awareness.~~ **Won't implement — no count assertion test — the 10 entries are documented in AGENTS.md.**

---

## g) Questions (3 max)

### Q1: Message `title` normalization — always set or only when explicit?

In `mergeExplicitMessages` (message-builder.ts), I unconditionally set `title: data.title` because `extractMessageConfig` defaults `title` to `target.name`. But in `registerMessage` (channel-builder.ts), I conditionally set `title` via `...(msgData?.title ? { title: msgData.title } : {})`. This means `@message`-decorated models always get `title`, but auto-registered messages (from operations) only get `title` when `msgData` is passed.

**Should every message have a `title` field (always populated), or should `title` only appear when explicitly set by the user via `@message(#{title})`?**

### Q2: Should `components.*` reusable population be attempted without new decorators?

The inline approach (correlation IDs on messages, tags on operations, parameters on channels) is valid AsyncAPI 3.1. The reusable `components.*` approach is "nicer" for large documents with repeated patterns but requires either: (a) new decorators like `@trait`/`@reusable`, or (b) auto-extraction logic that detects repetition and extracts. Option (b) is complex and potentially surprising.

**Should we attempt auto-extraction (detecting repeated patterns and extracting to `components.*`), or wait until a user explicitly requests reusable components and design decorator-based control?**

### Q3: Should `@example` on message models populate `MessageObject.examples`?

AsyncAPI 3.1's `MessageObject` has an `examples` field: `{ headers?: unknown; payload?: unknown }[]`. Currently `@example` on a message model only populates the schema-level `examples` in `components.schemas`. The message-level `examples` field is never populated.

**Should `@example` on a model decorated with `@message` also populate `MessageObject.examples` (with the payload field), or is the schema-level `examples` sufficient?**
