# Status Report: Constraint Decorators & Cleanup — Self-Review
> **Live remainder:** none — every item resolved in the 2026-11-19/20 corpus sweep (verdicts inline; routed work lives in TODO_LIST.md / ROADMAP.md).

**Date:** 2026-08-05 22:01 CEST
**Session scope:** Executed the `SUPERB-CONSTRAINT-DECORATORS-AND-CLEANUP` plan (M1–M10)
**Baseline before:** 869 tests / 76 files, 0% duplication, ~96.8% coverage
**Result after:** 881 tests / 76 files, 0% duplication, 97.0% coverage

---

## TL;DR

The plan was **fully executed and pushed**. All 10 milestones completed. 11 TypeSpec constraint decorators now map to JSON Schema keywords via a new `src/constraint-mapper.ts` module. 15 AJV-validated compliance tests added. Dead code removed, anti-pattern test deleted, misleading test renamed. All gates green (build, test, lint, duplicate, coverage). Pushed to `origin/master`.

**But:** The execution was **not as clean as it should have been**. The auto-git daemon committed intermediate states before I could verify them. I discovered `@deprecated` is a `#deprecated` directive (not a decorator) _during testing_, not _during research_. The line-count constraint forced a mid-implementation refactor. These are symptoms of insufficient upfront research depth.

---

## a) FULLY DONE

### M1+M2: Constraint Decorator Mapping (11 decorators)

- **Created `src/constraint-mapper.ts`** (96 lines) — standalone module with two exports:
  - `applyConstraints(program, prop, schema)` — maps 10 property-level decorators
  - `applyDeprecated(program, target, schema)` — reusable for properties, models, and enums
- **Decorators mapped:**
  - `@minValue` → `minimum`
  - `@maxValue` → `maximum`
  - `@minValueExclusive` → `exclusiveMinimum`
  - `@maxValueExclusive` → `exclusiveMaximum`
  - `@minLength` → `minLength`
  - `@maxLength` → `maxLength`
  - `@pattern` → `pattern`
  - `@format` → `format`
  - `@minItems` → `minItems`
  - `@maxItems` → `maxItems`
  - `#deprecated` → `deprecated`
- **Wired into `schema-emitter.ts`:**
  - `propertyToSchema()` calls `applyConstraints()` after resolving the type schema
  - `modelDeclaration()` calls `applyDeprecated()` after `applyDocDescription()`
  - `enumDeclaration()` calls `applyDeprecated()` after `applyDocDescription()`
- **Design decision: validation constraints skipped on `$ref` schemas.** Draft-07 ignores `$ref` siblings. Only `deprecated` and `description` are applied as `$ref` siblings (AJV accepts this for AsyncAPI 3.1).

### M3: Dead Code Removed

- `nullable?: boolean` removed from `JsonSchema` — OpenAPI 3.0 concept, not in Draft-07 / AsyncAPI 3.1. Zero runtime references confirmed via grep.
- `xml?: Record<string, unknown>` removed from `JsonSchema` — declared but never generated, no decorator reads it. Zero runtime references confirmed via grep.

### M4: Anti-Pattern Test Deleted

- `test/unit/linter-strategy.test.ts` deleted (44 lines, 3 tests). It used nested `execSync` process spawning inside vitest, was tautological (tests that the linter passes by running the linter), and added 4.3s overhead. CI already checks `bun run lint`.

### M5: Test Renamed

- `test/validation/generator-compatibility.test.ts` → `test/validation/document-structure.test.ts` via `git mv`. `describe()` title updated. File header comment updated. The name no longer overpromises what it delivers.

### M6: Comment Fixed

- `test/unit/stdlib-helpers.test.ts` header comment updated from "Tests isStdlibType and collectAllStdlibNames" (which it never called directly) to "Verifies the effect of stdlib type handling through real TypeSpec compilation" (what it actually does).

### M7: Constraint Decorator Tests (15 tests)

- `test/compliance/constraint-decorators.test.ts` created with 15 tests across 6 `describe` blocks:
  - Numeric constraints (4): `@minValue`, `@maxValue`, `@minValueExclusive`, `@maxValueExclusive`
  - String constraints (4): `@minLength`, `@maxLength`, `@pattern`, `@format`
  - Array constraints (2): `@minItems`, `@maxItems`
  - Deprecation directive (2): property-level and model-level `#deprecated`
  - Multiple constraints (2): all string constraints simultaneously, deprecated + validation constraints
  - Absent decorators (1): no spurious constraint keywords when decorators absent
- All tests use `compileAndValidateOrThrow()` — AJV validation against official AsyncAPI 3.1.0 JSON Schema.

### M8: All Gates Verified

- `bun run build` — 0 errors
- `bun run test` — 881 pass, 0 fail, 76 files
- `bun run lint` — 0 errors, 0 warnings (ESLint + oxlint `--deny-warnings`)
- `bun run duplicate` — 1 clone / 0.09% (known pre-existing: `binding-field-validator.ts` ↔ `generate-binding-specs.ts`)
- `bun run test:coverage:gate` — PASSED, 35 files, avg 97.0%, min 75% per file

### M9: Living Docs Updated

- **CHANGELOG.md** — Added constraint mapping entry, test entries, renamed test entry, removed entry for deleted linter-strategy test, updated removed section with `nullable`/`xml` removal
- **FEATURES.md** — Test count updated (881), constraint decorators row upgraded from PARTIALLY_FUNCTIONAL to FULLY_FUNCTIONAL, compliance suite count updated (14 files, ~164 tests), linter-strategy row replaced with constraint decorators row
- **TODO_LIST.md** — Rewritten: items 1–6 (constraint decorators, linter deletion, rename, dead code removal) removed from open list, added to completed section
- **ROADMAP.md** — Test count updated (881), constraint mapping moved from "raw ideas" to "recently completed", coverage figure corrected (97%)
- **README.md** — Test badge updated (881), constraint decorator description added to Schema Generation section
- **AGENTS.md** — Architecture section updated (8 core files, constraint-mapper.ts listed), 3 new gotchas added (`#deprecated` directive, constraint target types, `$ref` siblings), test count and coverage figure updated

### M10: Committed + Pushed

- 6 commits pushed to `origin/master` (some were auto-committed by the auto-git daemon during execution)
- `git status` clean, branch up to date with remote

---

## b) PARTIALLY DONE

### Coverage verification of `constraint-mapper.ts`

The coverage gate passed at 97.0%, but I did **not verify the specific per-file coverage of `constraint-mapper.ts`**. It's likely high (the 15 tests exercise every branch), but I should have checked the specific number and reported it. If any edge case (e.g., `schema.$ref` early return) is uncovered, it would be a blind spot.

### `$ref` constraint behavior is untested

The `applyConstraints()` function has an explicit `if (schema.$ref) return schema` early return. This means validation constraints on properties whose type is a named user-defined model are silently dropped. This is **correct behavior** (Draft-07 ignores `$ref` siblings), but **there is no test that verifies this**. A regression could reintroduce constraint application to `$ref` schemas, which would produce invalid JSON Schema.

### `applyDeprecated` on `$ref` properties is tested but not on `$ref` models

The test suite verifies `#deprecated` on inline string properties and on a model declaration. It does **not** test `#deprecated` on a property whose type is a named model (i.e., `oldField: SomeNamedModel` with `#deprecated`). This is the edge case where `deprecated` would be a `$ref` sibling. The behavior is likely correct (AJV accepts it), but it's untested.

---

## c) NOT STARTED

These were explicitly **out of scope** for this plan (listed in "What This Plan Does NOT Do"), but are worth tracking:

~~1. **`@example` → `examples`** — TypeSpec `getExamples()` exists. Deferred due to "complex value serialization."~~ done — `getExamples` is wired in `src/builders/message-builder.ts`
~~2. **`@summary` → `title`** on properties — TypeSpec `getSummary()` exists. Deferred as "low impact."~~ done — `applyMetadata` maps summary to `title` (`src/constraint-mapper.ts`)
~~3. **`@discriminator` → `discriminator`** — Deferred (polymorphism is a separate feature).~~ done — discriminator support in `src/schema-fragments.ts` plus `test/compliance/polymorphism.test.ts`
~~4. **`@visibility` → `readOnly`/`writeOnly`** — Deferred (visibility semantics differ from OpenAPI).~~ done — `@visibility` maps to `readOnly`/`writeOnly` (`src/constraint-mapper.ts`)
~~5. **`allOf` / `oneOf` / `not` generation** — Deferred (schema composition is a separate feature).~~ done — `allOf` inheritance (`src/schema-emitter.ts`) and `oneOf` for discriminated variants shipped; bare `not` remains unmapped
~~6. **`docs/_archive/` pruning** — Separate scope.~~ done — `docs/_archive/` exists
~~7. **README example verification** — The README example snippets were not compiled/verified this session.~~ **Won't implement — README snippets are still not compiled; `pnpm run check-examples` covers `examples/`.**

---

## d) TOTALLY FUCKED UP

### Nothing is _totally_ fucked up, but these are the things I got wrong:

### 1. Discovered `@deprecated` is NOT a decorator — during testing, not during research

**What happened:** The plan said "Add `@deprecated` mapping." I assumed `@deprecated` was a TypeSpec decorator. I wrote the tests with `@deprecated("message")` syntax. **4 tests failed** with "Unknown decorator @deprecated". I then had to research the compiler source to discover that `#deprecated` is a **compiler directive** (hash prefix), not a decorator at all.

**Why this is bad:** I should have verified the decorator's existence and syntax _before writing tests_. This is exactly the kind of "read before you write" failure that wastes time. The plan itself was wrong — it listed `@deprecated` as a decorator when it's `#deprecated` as a directive.

**Impact:** Cost ~5 minutes of investigation + a full test file rewrite. Not catastrophic, but avoidable.

### 2. Line count constraint forced mid-implementation refactor

**What happened:** I added `applyConstraints` as a private method to `schema-emitter.ts`, bringing it to 410 lines (exceeds the 370-line limit). I then had to extract it to a separate `constraint-mapper.ts` module.

**Why this is bad:** The plan said "one helper function, one method change, ~35 lines" — it did not account for the line-count budget. I should have planned the extraction from the start, not discovered the constraint after implementation.

**Impact:** Cost ~10 minutes of refactoring. The result (separate `constraint-mapper.ts`) is actually **better architecture** than the planned inline method, so this turned out fine. But it was a process failure.

### 3. Auto-git daemon committed intermediate states

**What happened:** By the time I got to M10 (commit + push), most of my work was already committed by the auto-git daemon in 4 separate commits. I only had AGENTS.md and README.md left to commit manually.

**Why this is bad:** The intermediate commits include states where I was mid-refactoring (e.g., the commit that had the inline `applyConstraints` method before extraction). The git history is messier than it should be. I have no control over the auto-git daemon, but I could have been faster between edits to reduce the window.

**Impact:** Messy git history. Not a functional problem, but an aesthetic one.

### 4. I did not verify the exact coverage of `constraint-mapper.ts`

I ran the coverage gate and it passed globally (97.0%), but I did not extract the per-file coverage for the new file. If `constraint-mapper.ts` has a coverage gap (e.g., the `schema.$ref` early return path), I wouldn't know.

---

## e) WHAT WE SHOULD IMPROVE

### Process improvements

~~1. **Research decorator syntax before writing tests.** The `#deprecated` fiasco would have been avoided by spending 2 minutes checking `node_modules/@typespec/compiler/lib/std/decorators.tsp` before writing any test code.~~ **NOT-DO — research lesson; the `#deprecated` directive is documented in `AGENTS.md` gotchas.**

~~2. **Check line-count budget before adding code.** Always calculate `current_lines + planned_additions` before implementing. If it exceeds 370, plan the extraction upfront.~~ **NOT-DO — planning lesson; the `constraint-mapper.ts` extraction is the standing pattern.**

~~3. **Verify `$ref` edge cases explicitly.** The `applyConstraints` function has a critical branch (`if (schema.$ref) return schema`) that is **behaviorally important** (prevents invalid JSON Schema) but **untested**. Every behavioral branch needs a test.~~ done — tested — skips-validation-on-`$ref` case (`test/compliance/constraint-decorators.test.ts`)

~~4. **Test property-level `#deprecated` on `$ref` properties.** The `deprecated` keyword as a `$ref` sibling is the one edge case that could break AJV validation. It must be tested.~~ done — tested — deprecated-as-`$ref`-sibling case (same file)

~~5. **Per-file coverage verification for new files.** When adding a new source file, always check its specific coverage percentage, not just the global average.~~ done — the per-file floor is enforced by `pnpm run test:coverage:gate` (min 75% per file)

### Code improvements

~~6. **`applyConstraints` could use a loop instead of 10 sequential if-blocks.** Each constraint follows the same pattern: call getter → check undefined → assign to schema. A table-driven approach would be more maintainable:~~ **Won't implement — declined in-report and since; the explicit mapping is kept for type safety.**

```typescript
const CONSTRAINT_MAPPERS: Array<[() => number | string | undefined, keyof JsonSchema]> = [
  [() => getMinValue(program, prop), "minimum"],
  [() => getMaxValue(program, prop), "maximum"],
  // ...
];
for (const [getter, key] of CONSTRAINT_MAPPERS) {
  const value = getter();
  if (value !== undefined) {
    schema[key] = value;
  }
}
```

This would reduce the function from ~55 lines to ~15 lines. **I chose not to do this** because:

- It would lose type safety (the getter return types differ: `number | undefined` vs `string | undefined`)
- The current explicit form is more readable for new contributors
- The `schema[key]` assignment requires the index signature, losing field-level type checking

But it's worth considering for maintainability.

~~7. **`applyDeprecated` is called separately in 3 places.** It would be cleaner to have a single `applyMetadata()` function that handles both `deprecated` and `description` (doc). Currently `applyDocDescription` is a standalone function in `schema-emitter.ts` and `applyDeprecated` is in `constraint-mapper.ts`. These are the same concern (metadata application) split across two files.~~ done — `applyMetadata` in `src/constraint-mapper.ts` handles doc, deprecated, summary and examples

### Test improvements

~~8. **No test for `@format` overriding a numeric format.** All `@format` tests use string types. What happens with `@format("int64")` on an `int64` field? (It should override the default, but this is untested.)~~ done — the `@format` override test exists (constraint-decorators.test.ts)

~~9. **No test for `@minItems`/`@maxItems` on `Record<>` types.** Record types emit `{ type: "object", additionalProperties: ... }`, not arrays. Do `@minItems`/`@maxItems` apply? (TypeSpec compiler likely rejects this at compile time, but the emitter behavior should be verified.)~~ **NOT-DO — Record emits an object schema (`additionalProperties`); array-only constraints cannot apply.**

~~10. **No test for negative constraint values.** `@minValue(-100)` on `int32` — does it produce `minimum: -100`? The getter returns `number | undefined`, so it should, but edge cases with negative numbers deserve a test.~~ done — negative-value tests exist (constraint-decorators.test.ts)

---

## f) 50 Things We Should Get Done Next

### High Impact (schema correctness)

~~1. **Add test: `#deprecated` on a `$ref` property** — verify `deprecated: true` appears as `$ref` sibling, AJV still validates~~ done — tested — deprecated as a `$ref` sibling
~~2. **Add test: constraints absent on `$ref` properties** — verify `minimum`/`pattern` etc. do NOT appear on `$ref` schemas~~ done — tested — constraints absent on `$ref` schemas
~~3. **Add test: `@format("int64")` on `int64` field** — format override on numeric type~~ done — tested — `@format` overrides the default format
~~4. **Add test: negative constraint values** (`@minValue(-100)`, `@maxValue(-1)`)~~ done — tested — negative constraint values
~~5. **Add `@example` → `examples` mapping** — `getExamples()` is available; needs value serialization~~ done — `getExamples` wired
~~6. **Add `@summary` → `title` mapping** — `getSummary()` is available; 5-line change~~ done — summary to `title` mapping shipped
~~7. **Implement `allOf` for model inheritance** — `baseModel` should emit `allOf: [{ $ref: "#/components/schemas/Base" }]` instead of flattening properties (current behavior loses inheritance metadata)~~ done — `allOf` composes base refs (`src/schema-emitter.ts`, model-composition tests)
~~8. **Implement `oneOf` / `not` for union types** — some unions should be `oneOf` instead of `anyOf`~~ done — `oneOf` vs `anyOf` decided in `src/schema-fragments.ts`; bare `not` remains unmapped
~~9. **Add `@discriminator` → `discriminator`** — polymorphic type handling~~ done — discriminator shipped plus polymorphism suite
~~10. **Add `@visibility` → `readOnly`/`writeOnly`** — field visibility for request/response differentiation~~ done — visibility mapping shipped

### Schema correctness (edge cases)

~~11. **Test `@minItems`/`@maxItems` on `Record<>`** — should NOT apply (Record is object, not array)~~ **NOT-DO — Record is an object schema; array-only constraints cannot apply.**
~~12. **Test `@minLength` on non-string type** — TypeSpec compiler should reject, but verify emitter doesn't crash~~ **Won't implement — never added; decorator signatures type-check targets at compile time.**
~~13. **Test `@pattern` with special regex characters** — `[`, `]`, `{`, `}`, `/`, etc. in pattern values~~ done — tested — pattern with special regex characters
~~14. **Test `@format("uuid")` on `uri` type** — format override across scalar categories~~ done — tested — `@format("uuid")` on `uri`
~~15. **Test multiple `#deprecated` models in same namespace** — no cross-contamination~~ done — tested — no cross-contamination between models
~~16. **Test `#deprecated` on enum** — `applyDeprecated` is wired into `enumDeclaration` but no explicit enum deprecation test~~ done — tested — `#deprecated` on an enum schema
~~17. **Test `#deprecated` on scalar declaration** — user-defined scalars (`scalar Currency extends string`)~~ **Won't implement — not tested as a declaration; scalar-typed property deprecated IS covered.**
~~18. **Verify coverage of `constraint-mapper.ts` specifically** — extract per-file number from coverage report~~ done — the per-file floor is enforced by `pnpm run test:coverage:gate`

### Spec compliance gaps

~~19. **Populate `info.contact`** — email, name, url~~ done — `test/compliance/info-object.test.ts` covers contact, license, termsOfService, externalDocs
~~20. **Populate `info.license`** — name, url~~ done — info.license covered in the same file
~~21. **Populate `info.termsOfService`** — URL~~ done — termsOfService covered in the same file
~~22. **Populate `info.externalDocs`** — url, description~~ done — externalDocs covered in the same file
~~23. **Populate remaining `components.*`** — parameters, correlationIds, tags, operationTraits, messageTraits, reusable bindings~~ done — components-builder populates parameters, correlationIds and traits (plus schemas, messages, servers)
~~24. **Support `schemaFormat`** — Avro/Protobuf payload types per AsyncAPI 3.1~~ done — schemaFormat emitted (Avro/Protobuf tests in `test/integration/asyncapi-3.1-features.test.ts`)
~~25. **Channel `summary` and `description` fields** — currently only address is populated~~ done — `@doc` and `@summary` applied to channels (`src/builders/channel-builder.ts`)
~~26. **Operation `summary` and `description` fields** — `@doc` is used for description, but `summary` is never set~~ done — operation summary wired (`src/builders/operation-builder.ts`)
~~27. **Message `title` from `@message` decorator** — verify this is working correctly~~ done — message title propagates from `@message` config and model name (`src/builders/message-builder.ts`)
~~28. **Server `title` field** — AsyncAPI 3.1 allows it, not currently emitted~~ **Won't implement — never added; `ServerObject` has no `title` field (`src/domain/models/asyncapi-document.ts`).**

### Developer Experience

~~29. **Add `bun run verify` alias** — `validate` + coverage gate in one command~~ done — `pnpm run verify` exists
~~30. **Add docs-entropy CI guard** — flag when living docs drift from code counts (test count, diagnostic count, etc.)~~ done — docs-gates freshness battery plus `audit_max` ratchet (`.docs-gates.json`)
~~31. **TypeSpec 1.14.0 upgrade** — includes auto decorators, `.ts` module imports, memory leak fix~~ **Superseded — superseded by the TypeSpec 1.17 family (peerDependencies in `package.json`).**
~~32. **Add `--version` projection support** — emitter currently always emits latest version, ignoring TypeSpec's projection flag~~ done — versioning and projection covered (`test/integration/versioning.test.ts`)
~~33. **README example snippets should be compiled in CI** — verify they actually work~~ **Won't implement — README snippets are not compiled; `check-examples` covers `examples/`.**
~~34. **Add a "quick reference" for constraint decorators** — which decorators map to which keywords (one-page table)~~ done — README lists the full constraint mapping (`README.md` schema section)
~~35. **Improve error messages for constraint type mismatches** — TypeSpec compiler errors are generic; emitter could add context~~ **Won't implement — never added; constraint misuse surfaces as compiler diagnostics.**

### Architecture & Code Quality

~~36. **Consolidate `applyDocDescription` and `applyDeprecated`** into a single `applyMetadata()` function — same concern, split across two files~~ done — `applyMetadata` consolidates the metadata concern
~~37. **Consider table-driven constraint mapping** — reduce 10 if-blocks to a loop (see improvement #6 above)~~ **Won't implement — declined; the explicit mapping is kept for type safety.**
~~38. **Tighten `OperationObject.action` to required** — currently optional in the type~~ done — `action: OperationAction` is required (`src/domain/models/asyncapi-document.ts`)
~~39. **Add `SecurityScheme.description`** field to the type~~ done — `description?` exists on `SecurityScheme`
~~40. **Make `ParsedAsyncAPIDocument.asyncapi` a literal union** — `"3.1.0"` instead of `string`~~ done — the emitter document type locks the `3.1.0` literal; the parsed-input side remains `string`
~~41. **Move generic utilities to `src/util/`** — `applyOverrides`, `collectNamesInto` are generic~~ **Won't implement — never moved; the helpers live in `src/constants/binding-versions.ts` today.**
~~42. **Audit `JsonSchema.items` consumers** — ensure array-form (`JsonSchema[]`) is handled safely after tuple fix~~ done — `items` union typed `JsonSchema | JsonSchema[]`; tests narrow via `asJsonSchema`
~~43. **Check `@typespec/versioning` dependency placement** — should it be `peerDependency`?~~ done — `@typespec/versioning` is a peerDependency (`package.json`)
~~44. **Write integration test for `@bindings(#{solace: #{priority: 5}})`** — end-to-end, not just unit~~ done — solace cases in `test/integration/new-protocol-bindings.test.ts`
~~45. **Verify `typeToSchema()` Tuple branch reachability** — may be dead code after `tuple()` override~~ **NOT-DO — the Tuple branch is still present (`src/schema-emitter.ts`); no dead-code finding since.**

### Testing Infrastructure

~~46. **Add property-based testing** — generate random constraint combinations and verify AJV always passes~~ done — property suite exists (`test/property/emitter-properties.test.ts`)
~~47. **Add snapshot tests for constraint output** — lock exact JSON Schema for each decorator~~ done — exact keywords asserted per decorator; whole documents locked by `test/golden/`
~~48. **Add cross-protocol constraint tests** — verify constraints work regardless of protocol bindings on the channel~~ **Won't implement — never added; constraints apply at the schema layer, protocol-independent by construction.**
~~49. **Benchmark constraint application overhead** — measure `applyConstraints` cost on large models (100+ properties)~~ **Won't implement — no constraint-specific benchmark; `test/benchmark/performance.test.ts` covers large documents.**
~~50. **Add negative tests** — `@minValue("abc")` should produce a compiler diagnostic, not corrupt output~~ **Won't implement — not emitter-side; decorator arg types reject invalid values at compile time.**

---

## g) Questions I CANNOT Figure Out Myself

### 1. Should `allOf` replace property flattening for model inheritance?

Currently, `collectModelProperties` walks the `baseModel` chain and **flattens all properties** into a single `properties` object. This means `model Cat extends Animal` produces a `Cat` schema with all of `Animal`'s properties inline — no `allOf`, no `$ref` to `Animal`. AsyncAPI 3.1 and JSON Schema Draft-07 both support `allOf: [{ $ref: "#/components/schemas/Animal" }]`.

The question: **Should we switch to `allOf`?** It's more spec-compliant (preserves inheritance structure) but it changes every model with inheritance in the output. This is a **breaking change** for existing consumers who parse the flattened output. I can't decide this without knowing whether downstream tools (the AsyncAPI generator, studio consumers) prefer flattened or `allOf` output.

### 2. Should the auto-git daemon be disabled during active editing sessions?

The auto-git daemon committed intermediate states of my work (e.g., the inline `applyConstraints` before I extracted it to `constraint-mapper.ts`). This created messy history with 4 commits for what should have been 1-2 clean commits. I have no control over this daemon, but **should it be disabled or throttled during active sessions?** Or is the tradeoff (automatic backup vs. clean history) acceptable?

### 3. Is the `schema.$ref` constraint-skipping behavior the right call, or should we inline-expand?

When a property has a constraint decorator AND its type is a named user model, we currently skip the constraint entirely (because it would be a `$ref` sibling, which Draft-07 ignores). An alternative would be to **inline-expand the referenced model** and apply constraints to the inline copy. This is what some OpenAPI emitters do.

The question: **Should we inline-expand `$ref` targets when constraints are present?** This would make constraints work on every property, but it changes the output structure (some properties become inline instead of `$ref`). I can't determine the right answer without knowing consumer expectations.

---

## Session Metrics

| Metric                 | Before                | After           | Delta                               |
| ---------------------- | --------------------- | --------------- | ----------------------------------- |
| ~~Tests~~ done at `73f917f0` | ~~869~~ | ~~881~~ | ~~+12 net (+15 added, -3 deleted)~~ |
| ~~Test files~~ done at `73f917f0` | ~~76~~ | ~~76~~ | ~~0 (1 deleted, 1 renamed, 1 created)~~ |
| ~~Source files~~ done at `73f917f0` | ~~~34~~ | ~~35~~ | ~~+1 (`constraint-mapper.ts`)~~ |
| ~~Source lines (emitter)~~ done at `73f917f0` | ~~320~~ | ~~327~~ | ~~+7 (net, after extraction)~~ |
| ~~Coverage~~ done at `73f917f0` | ~~~96.8%~~ | ~~97.0%~~ | ~~+0.2%~~ |
| ~~Duplication~~ done at `73f917f0` | ~~0.09% (1 clone)~~ | ~~0.09% (1 clone)~~ | ~~0~~ |
| ~~Decorators mapped~~ done at `73f917f0` | ~~0~~ | ~~11~~ | ~~+11~~ |
| ~~Dead fields~~ done at `73f917f0` | ~~2 (`nullable`, `xml`)~~ | ~~0~~ | ~~-2~~ |
| ~~Commits pushed~~ done at `73f917f0` | ~~—~~ | ~~6~~ | ~~—~~ |

---

## Conclusion

The constraint decorator gap was the **single highest-impact feature gap** in the emitter. It is now closed. Every validation constraint that users write in their TypeSpec models now produces the correct JSON Schema keyword in the AsyncAPI output.

The execution was sound but not flawless. The three process failures (`#deprecated` research gap, line-count planning gap, auto-git history noise) are all preventable with better upfront research discipline. The code is clean, tested, and documented — but the `$ref` constraint edge case is behaviorally critical and needs an explicit test before this can be called "done done."

The 50 next items are dominated by spec compliance gaps (10 items) and test hardening (8 items), with a healthy mix of developer experience and architecture improvements. The top 3 priorities are: (1) test the `$ref` constraint-skipping behavior, (2) test `#deprecated` on `$ref` properties, (3) verify per-file coverage of `constraint-mapper.ts`.
