# Status Report: allOf / oneOf / discriminator — Polymorphism Implementation
> **Live remainder:** none — every item resolved in the 2026-11-19/20 corpus sweep (verdicts inline; routed work lives in TODO_LIST.md / ROADMAP.md).

**Date:** 2026-08-06 00:44 CEST
**Session scope:** Implement the 3 remaining TODO_LIST items: `allOf` for model inheritance, `oneOf` for model-variant unions, `@discriminator` for polymorphic type handling
**Baseline before:** 915 tests / 78 files, 96.9% coverage, 14 decorators mapped, allOf/oneOf/discriminator unimplemented
**Result after:** 928 tests / 79 files, 96.7% coverage, 15 decorators mapped (added `@discriminator`), full polymorphism support

---

## TL;DR

Implemented all 3 schema composition features from the TODO_LIST in one session. Model inheritance now emits `allOf: [{ $ref: "..." }]` instead of flattening. Model-variant unions now emit `oneOf` instead of `anyOf`. `@discriminator` mapped to JSON Schema `discriminator` keyword. Also fixed a pre-existing bug where named model variants in unions emitted empty `{}` objects instead of `$ref` pointers. 13 new compliance tests added. 6 existing tests updated for the breaking behavioral change. `refForNamedType` extracted to `schema-ref.ts` to stay under the 370-line file limit. All gates green.

**But:** Coverage dropped 0.2% (96.9%→96.7%) because `schema-emitter.ts` grew with new code paths that are only reachable through specific TypeSpec patterns (discriminated models, all-Model unions). The `schema-ref.ts` extraction added a new source file (35→36) that has one uncovered branch. And I didn't test `@discriminator` on unions because TypeSpec's compiler rejects it at compile time (`decorator-wrong-target`) — the code path exists but is dead code for this TypeSpec version.

---

## a) FULLY DONE

### M1: `allOf` for Model Inheritance

- **`src/schema-emitter.ts:48-63`** — `modelDeclaration()` now checks `model.baseModel`. If present, resolves it via `refForNamedType()` to get a `$ref` pointer, then calls `collectPropertiesSchema(model, false)` (own properties only, no base flattening), and sets `schema.allOf = [baseRef]`.
- Multi-level chains produce linked refs: `C.allOf[0] → B`, `B.allOf[0] → A`, `A.allOf` undefined.
- The `collectModelProperties()` method's `includeBase` parameter is now passed `false` when there's a base model — it only walks the current model's own properties.
- **6 existing tests updated** to assert the new `allOf` behavior instead of flattened properties:
  - `test/compliance/model-composition.test.ts` (4 tests rewritten)
  - `test/integration/asyncapi-generation.test.ts` (2 tests rewritten)
- **Breaking change documented** in CHANGELOG with migration guidance.

### M2: `@discriminator` → `discriminator` Mapping

- **`src/schema-emitter.ts:57-60`** — `modelDeclaration()` calls `getDiscriminator(program, model)`. If it returns `{ propertyName: string }`, sets `schema.discriminator = disc.propertyName`.
- **`src/schema-emitter.ts:121-129`** — `union()` also calls `getDiscriminator(program, union)` for all-Model variant unions. This is future-proofing: TypeSpec's current compiler rejects `@discriminator` on unions (`decorator-wrong-target`), so this code path is dead for now but would activate if TypeSpec adds union discriminator support.
- **`src/schema-emitter.ts:341-346`** — `typeToSchema()` Union branch also has the discriminator check for inline union properties.
- Full polymorphic pattern tested: `@discriminator("kind")` on base model + `allOf` on subtypes + discriminator value override (`kind: "dog"` → `{ const: "dog" }`).
- Import added: `getDiscriminator` from `@typespec/compiler`.

### M3: `oneOf` for Model-Variant Unions

- **`src/schema-emitter.ts:117-130`** — `union()` checks if ALL variants have `kind === "Model"`. If so, emits `oneOf` (exclusive composition, matching TypeSpec's exclusive union semantics). Falls back to `anyOf` for mixed-type unions.
- **`src/schema-emitter.ts:337-348`** — `typeToSchema()` Union branch applies the same `oneOf` vs `anyOf` logic for inline union properties.
- String-literal unions still emit `enum` (unchanged).
- Mixed-type unions (`string | int32`) still emit `anyOf` (unchanged).

### M4: Union Variant `$ref` Bug Fix (Pre-existing)

- **Problem:** Named model variants in unions (`union Pet { dog: Dog; cat: Cat; }`) emitted `{ properties: {}, type: "object" }` for each variant instead of `{ $ref: "#/components/schemas/Dog" }`.
- **Root cause:** `union()` and `typeToSchema()` Union branch called `emitTypeReference(v.type)` which returned an empty declaration for named types (the declaration is in `components.schemas`, not inline). `extractValue()` returned `{}`, and the fallback was `intrinsicToSchema(t.name)` which produced `{ type: "string" }` or empty object.
- **Fix:** Added `refForNamedType(v.type)` check BEFORE `emitTypeReference` in both `union()` (line 100) and `typeToSchema()` Union branch (line 324). If the variant type is a named model/enum/scalar, return the `$ref` immediately.
- This was discovered during diagnostic testing when union variants showed as empty objects in the output JSON.

### M5: `not` Keyword Type Support

- **`src/domain/models/asyncapi-document.ts:179`** — Added `not?: JsonSchema` to the `JsonSchema` interface.
- AsyncAPI 3.1 JSON Schema accepts `not` (verified in the spec schema at line 1924). No emitter code generates `not` yet — this just makes the type available for future use and for consumers constructing schemas manually.
- Test: `polymorphism.test.ts` includes a type-level test verifying `not` is accepted.

### M6: `schema-ref.ts` Extraction

- **`src/schema-ref.ts`** (43 lines) — `refForNamedType()` extracted from a private method in `schema-emitter.ts` to a standalone module. Pure function, no instance dependencies.
- `schema-emitter.ts` went from 386 lines (over the 370 limit) to 359 lines after extraction.
- Import changed from `this.refForNamedType()` to `refForNamedType()` (standalone function). 6 call sites updated.

### M7: Comprehensive Polymorphism Tests

- **`test/compliance/polymorphism.test.ts`** (13 tests, 229 lines):
  - `allOf` for model inheritance (4 tests): empty body extends, property override/narrowing, metadata on both models, 4-level chain
  - `@discriminator` on models (3 tests): basic discriminator, full polymorphic pattern (parent + 2 subtypes), absence on undecorated models
  - `oneOf` for model-variant unions (5 tests): inline union, named union, mixed-type stays anyOf, string-literal stays enum, 3-model union
  - `not` keyword type availability (1 test)
- All 13 tests validated against official AsyncAPI 3.1.0 JSON Schema via `compileAndValidateOrThrow()`.

### M8: Full Gate Verification

- `bun run build` — 0 errors
- `bun run lint` — 0 errors, 0 warnings (ESLint + oxlint `--deny-warnings`)
- `bun run test` — 928 pass, 0 fail, 79 files
- `bun run test:coverage:gate` — PASSED, 36 source files, avg 96.7%, min 75% per file

### M9: Documentation Updated

- **CHANGELOG.md** — 3 new Added entries (allOf, discriminator, oneOf), 2 new Changed entries (BREAKING: allOf replaces flattening, BREAKING: union of models emits oneOf), `not` keyword, schema-ref extraction.
- **TODO_LIST.md** — Items 1-3 removed from open list, added to completed items. Remaining 3 items renumbered.
- **FEATURES.md** — Test count (928), Inheritance description changed to `allOf`, union description updated, discriminator and oneOf rows added.
- **ROADMAP.md** — Test count (928), coverage (96.7%), completed items list updated.
- **README.md** — Test badge (928), protocol badge (22), description mentions allOf/oneOf/discriminator.
- **AGENTS.md** — schema-emitter description (359 lines, allOf/discriminator/oneOf), schema-ref.ts added (43 lines), emitter file count (8→9), test count (928), compliance suite (~194 tests, 17 files), coverage (96.7%), 5 new gotchas added, $ref chain section updated with allOf pattern.

---

## b) PARTIALLY DONE

### `@discriminator` on unions is dead code

The `union()` method (line 121-129) and `typeToSchema()` Union branch (line 341-346) both call `getDiscriminator(program, union)` and check for a discriminator. However, TypeSpec's compiler rejects `@discriminator` on unions with `decorator-wrong-target: Cannot apply @discriminator decorator to Test.Result since it is not assignable to Model`. So this code path will never execute in practice. It's future-proofing for if TypeSpec ever adds union discriminator support, but right now it's unreachable code with no test coverage.

### `schema-emitter.ts` coverage at 80%

The file dropped to 80% line coverage (177/221 lines). The uncovered lines include the discriminator-on-union paths (dead code, see above), some union/enum override methods that are reached through `emitTypeReference` but Bun's coverage tracks the `dist/` entry, and the `collectModelProperties` base-model traversal with `includeBase=true` path (which is still reachable via `modelLiteral` but not directly tested).

### `schema-ref.ts` has one uncovered branch

The Scalar branch in `refForNamedType()` (line 26) is uncovered. No test currently has a union variant or property that is a user-defined scalar type AND goes through the `refForNamedType` path for scalars. The Model and Enum branches are covered. Coverage: 95% (21/22 lines).

---

## c) NOT STARTED

These were explicitly out of scope — the user asked for the 3 TODO_LIST items only:

~~1. **Remaining `components.*` population** — parameters, correlationIds, tags, operationTraits, messageTraits~~ done at `bac222c4`
~~2. **Channel `summary` and `description`** — only address populated, not `@doc`-derived metadata~~ done at `aeb4f900`
~~3. **OpenAPI cross-emitter** — shared module exports complete but no external consumer~~ done — ROADMAP line 124: `src/shared/` complete and tested, no external consumer yet
~~4. **`bun run verify` alias** — convenience command combining check + coverage gate~~ done — `verify` script in package.json chains the gates
~~5. **README example compilation in CI** — example snippets unverified~~ done — `test/validation/all-examples-validation.test.ts` runs in CI
~~6. **TypeSpec 1.14.0 upgrade** — auto decorators, `.ts` module imports~~ done — `@typespec/compiler` at `^1.17.0` in package.json
~~7. **`@default` → `default` mapping** — TypeSpec `getDefaultValue()` exists but not wired~~ done at `35a6cf53`
~~8. **Table-driven constraint mapping** — 10 if-blocks in `applyConstraints` could be a loop~~ done at `35a6cf53`

---

## d) TOTALLY FUCKED UP

### Nothing is _totally_ fucked up, but:

### 1. Left 3 diagnostic temp files in the repo

I created `diag-test.ts`, `diag-test2.ts`, `diag-test3.ts` in the project root for quick output inspection during development. The auto-git daemon committed one of them before I cleaned them up. The lint step caught them (`--deny-warnings` failed on the temp files). I should have used vitest test cases for output inspection, or at least put temp files in `/tmp/`. The stale `test-scalar-check.ts` from a prior session was also still present and finally got cleaned up this session.

### 2. First test attempt for property override was invalid TypeSpec

I wrote a test with `model Derived extends Base { name: int32; }` where `Base.name` was `string`. TypeSpec correctly rejects changing the type of an inherited property to an incompatible type. I should have known that TypeSpec property override requires the derived type to be a subtype (narrowing), not an arbitrary type change. Fixed by using `kind: "special"` (string literal narrowing) instead.

### 3. `#deprecated` syntax error

First attempt used `#deprecated model Derived` without a message argument. TypeSpec requires `#deprecated "message"` — the directive expects a string argument. Fixed by adding `"Use NewDerived instead"`. This was already documented in a prior session's gotchas but I still hit it.

### 4. Coverage went DOWN again (96.9% → 96.7%)

Adding 72 new lines to `schema-emitter.ts` (314→386 before extraction, 359 after) with new code paths that are only reachable through specific TypeSpec patterns pulled the global average down. The `schema-ref.ts` extraction added a new file (35→36 source files) with a 95% coverage entry, which also slightly dilutes the average. The per-file coverage is still well above the 75% gate.

### 5. Didn't test `@discriminator` property is in `required` list

AsyncAPI 3.1 spec says: "The property name used MUST be defined at this schema and it MUST be in the required property list." I don't verify this at emit time or in tests. If someone writes `@discriminator("kind")` but `kind` is optional, the output would be invalid per spec (though AJV validation passes because the AsyncAPI 3.1 JSON Schema doesn't enforce this constraint).

---

## e) WHAT WE SHOULD IMPROVE

### Process improvements

~~1. **Don't create diagnostic temp files in the project root.** Use vitest test cases for output inspection, or put scripts in `/tmp/`. The auto-git daemon commits everything, including temp files. This is the second session in a row where temp files caused lint failures.~~ **NOT-DO — lesson logged; AGENTS.md documents the daemon committing everything.**

~~2. **Check TypeSpec property override rules before writing tests.** TypeSpec only allows narrowing (subtype relationship), not arbitrary type changes. `string` → `int32` is rejected. `string` → `"literal"` is allowed (narrowing).~~ **NOT-DO — lesson logged.**

~~3. **Verify `#deprecated` syntax.** It requires a message: `#deprecated "message"`, not `#deprecated` alone. This is documented in AGENTS.md but still tripped me up.~~ **NOT-DO — lesson logged; the gotcha is documented in AGENTS.md.**

~~4. **Consider testing dead code paths differently.** The discriminator-on-union code is future-proofing that will never execute with current TypeSpec. Either remove it (YAGNI) or add a comment explaining it's dead code. Currently it just sits there uncovered.~~ **Won't implement — kept with an explanatory JSDoc at `src/schema-fragments.ts:22`.**

### Code improvements

~~5. **`collectModelProperties` has dual behavior that's confusing.** The `includeBase` parameter controls whether to walk `baseModel`. With `allOf`, `modelDeclaration` passes `false`, but `modelLiteral` also passes `false`. The only case where `includeBase=true` would be used is if someone called it directly, which nobody does now. Consider simplifying to always `false` and removing the parameter.~~ **Won't implement — the `includeBase` parameter remains at `src/schema-emitter.ts:291`.**

~~6. **`typeToSchema()` and `union()` have duplicated union logic.** Both methods independently implement the same variant-processing logic (check for strings, check for models, decide oneOf vs anyOf). This is a DRY violation. The `union()` override handles top-level unions (union declarations), while `typeToSchema()` handles inline unions (union as property type). They should share a helper.~~ done — shared helper extracted: `composeUnionVariants` at `src/schema-fragments.ts:23` (CHANGELOG line 318)

~~7. **`schema-emitter.ts` is 359 lines — close to the 370 limit again.** Any future feature additions will require another extraction. The next candidate is `typeToSchema()` (50+ lines), which could become `src/type-to-schema.ts`.~~ **Won't implement — `typeToSchema` remains a private method at `src/schema-emitter.ts:331`.**

~~8. **The `not` keyword type was added but no emitter code generates it.** This is intentional (it's a type availability change, not a feature), but it means the `not` field on `JsonSchema` is declared but never assigned anywhere in `src/`.~~ **Won't implement — type-only availability stands; no generator code emits `not`.**

~~9. **Discriminator validation missing.** AsyncAPI 3.1 requires the discriminator property to be in the `required` array. The emitter doesn't validate this. A user writing `@discriminator("kind")` with `kind?: string` (optional) would produce spec-violating output that AJV accepts.~~ done at `6f4cb773`

~~10. **`refForNamedType` is now a standalone function but still tightly coupled.** It imports from `stdlib-helpers.js` and `asyncapi-document.js`. It's not truly independent — it's just extracted for line-count purposes. A more meaningful extraction would include the `$ref` construction pattern (`refSchema`, `refMessage`, `refChannel`) as a cohesive reference resolution module.~~ **Won't implement — `refForNamedType` remains in `src/schema-ref.ts` alongside the domain model's ref constructors.**

---

## f) 50 Things We Should Get Done Next

### High Impact (schema correctness)

~~1. **Add `@default` → `default` mapping** — TypeSpec `getDefaultValue()` exists, similar to existing constraint mappings~~ done at `35a6cf53`
~~2. **Validate `@discriminator` property is in `required`** — AsyncAPI 3.1 spec requirement, currently unchecked~~ done at `6f4cb773`
~~3. **Deduplicate union logic between `union()` and `typeToSchema()`** — Extract shared helper for variant processing~~ done — shared `composeUnionVariants` at `src/schema-fragments.ts:23` (CHANGELOG line 318)
~~4. **Simplify `collectModelProperties` — remove `includeBase` parameter** — Always `false` now with `allOf`~~ **Won't implement — the `includeBase` parameter remains at `src/schema-emitter.ts:291`.**
~~5. **Remove or annotate dead discriminator-on-union code** — YAGNI vs future-proofing decision~~ **Won't implement — kept with the JSDoc at `src/schema-fragments.ts:22` explaining the future-proofing.**
~~6. **Test `refForNamedType` Scalar branch** — Currently uncovered (95% file coverage)~~ **Won't implement — no direct scalar-branch case; the coverage gate sits at 98.1 percent average.**
~~7. **Test `collectModelProperties` with `includeBase=true` via `modelLiteral`** — Verify the base-walking path still works for anonymous model expressions~~ **Won't implement — `modelLiteral` passes false at `src/schema-emitter.ts:95`; the base-walking path stays untested.**
~~8. **Add `@discriminator` on model with optional discriminator property** — Negative test (should warn or error)~~ done — resolved by auto-add: `test/compliance/polymorphism.test.ts:167` covers the optional-property case
~~9. **Test multi-level `allOf` with `@discriminator` at each level** — Verify discriminator inheritance~~ **Won't implement — the suite covers a 4-level allOf chain and discriminator separately, never combined at each level.**
~~10. **Test `oneOf` with 10+ model variants** — Stress test variant resolution~~ **Won't implement — no 10-variant case; P8 generates 2-4 variants in the property suite.**

### Spec compliance gaps

~~11. **Populate `info.tags`** — from `@tag` decorator on namespace~~ done at `6f4cb773`
~~12. **Populate channel `summary`** — from `@summary` or `@doc` on channel operation~~ done — `src/builders/channel-builder.ts:88` applies `@summary` and `@doc` to channels
~~13. **Populate channel `description`** — separate from `summary`~~ done — `src/builders/channel-builder.ts:92` populates channel description from `@doc`
~~14. **Populate operation `summary`** — `@doc` goes to `description`, `summary` never set~~ done at `aeb4f900`
~~15. **Populate message `title`** — from `@message` decorator or model name~~ done — `src/builders/message-builder.ts:32` sets message `title`
~~16. **Populate `components.parameters`** — channel path parameters~~ done at `bac222c4`
~~17. **Populate `components.correlationIds`** — from `@correlationId` decorator~~ done at `bac222c4`
~~18. **Populate `components.tags`** — reusable tag definitions~~ done — `test/compliance/components-tags.test.ts`
~~19. **Populate `components.operationTraits`** — operation trait reuse~~ done at `bac222c4`
~~20. **Populate `components.messageTraits`** — message trait reuse~~ done at `bac222c4`
~~21. **Support `schemaFormat`** — Avro/Protobuf payload types~~ done — `schemaFormat` via `src/state.ts:49`; tested at `test/integration/asyncapi-3.1-features.test.ts:118`
~~22. **Populate server `title`** — AsyncAPI 3.1 allows it~~ **Won't implement — ServerObject gained no `title` field; never populated.**
~~23. **Server `security` field** — per-server security overrides~~ done — `test/integration/asyncapi-3.1-features.test.ts:80` locks server.security

### Architecture & Code Quality

~~24. **Extract `typeToSchema()` to `src/type-to-schema.ts`** — Next extraction candidate (50+ lines)~~ **Won't implement — `typeToSchema` remains a private method at `src/schema-emitter.ts:331`.**
~~25. **Table-driven constraint mapping** — reduce 10 if-blocks to a loop in `applyConstraints`~~ done at `35a6cf53`
~~26. **Tighten `OperationObject.action` to required** — currently optional in the type~~ done — `action` is required on `OperationObject` at `src/domain/models/asyncapi-document.ts:197`
~~27. **Move generic utilities to `src/util/`** — `applyOverrides`, `collectNamesInto`~~ **Won't implement — `src/util/` never created; `applyOverrides` lives privately in `src/constants/binding-versions.ts:52`.**
~~28. **Consider shared union-variant helper** — DRY `union()` and `typeToSchema()` union logic~~ done — shared `composeUnionVariants` at `src/schema-fragments.ts:23`
~~29. **Add `examples` to `MessageObject`** — typed but never populated~~ done — `test/integration/asyncapi-3.1-features.test.ts:160` locks message.examples
~~30. **Remove the 1 remaining jscpd clone** — `binding-field-validator.ts` ↔ `generate-binding-specs.ts`~~ done — duplication gate sits at 0 clones (AGENTS line 28); the bindingVersion skip was refactored (CHANGELOG line 318)
~~31. **Consider extracting `collectModelProperties`** to a schema-properties builder module~~ **Won't implement — `collectModelProperties` remains a private method at `src/schema-emitter.ts:289`.**
~~32. **Add `not` keyword emitter support** — type exists, but no code generates it yet~~ **Won't implement — type-only availability stands; nothing emits `not`.**
~~33. **Consider discriminated union detection without `@discriminator`** — Auto-detect when all variants share a common string-literal property~~ **Won't implement — never built; variant expansion keys on `@discriminator` explicitly (property P8).**

### Testing Infrastructure

~~34. **Add property-based testing** — generate random model hierarchies, verify AJV always passes~~ done — property suite at `test/property/emitter-properties.test.ts`
~~35. **Add snapshot tests for allOf output** — lock exact JSON Schema for inheritance patterns~~ done — golden `test/golden/polymorphism.expected.yaml` locks allOf, discriminator and oneOf (CHANGELOG line 281)
~~36. **Add cross-protocol polymorphism tests** — allOf works regardless of protocol bindings~~ done — polymorphism compliance tests validate via AJV independent of protocol bindings
~~37. **Benchmark allOf resolution overhead** — measure `modelDeclaration` on 10-level inheritance chain~~ **Won't implement — `test/benchmark/performance.test.ts` measures the emitter; no allOf-specific benchmark.**
~~38. **Add negative tests** — `@discriminator("nonexistent")` should warn~~ **Won't implement — no nonexistent-discriminator warning exists.**
~~39. **Test all 15 decorators in golden file** — lock exact output for regression detection~~ **Won't implement — no per-decorator golden; constraint behavior is AJV-locked in `test/compliance/constraint-decorators.test.ts`.**
~~40. **Add CI guard for stale doc counts** — fail if test count in FEATURES.md doesn't match `vitest run` output~~ **Won't implement — never added; docs-gates tracks report freshness, not FEATURES.md test-count parity.**
~~41. **Test allOf with circular base model references** — ensure no infinite recursion~~ **Won't implement — no circular-base test exists; the property suite generates finite hierarchies.**
~~42. **Test oneOf with `$ref` to union type** — verify nested union references work~~ done — golden `test/golden/named-union.expected.yaml` locks named unions and their ref chains
~~43. **Test allOf + constraint decorators interaction** — constraints on properties inherited via allOf~~ **Won't implement — no dedicated interaction case; constraints apply per property in the compliance suite.**

### Developer Experience

~~44. **Add `bun run verify` alias** — `validate` + coverage gate in one command~~ done — `verify` script in package.json chains the gates
~~45. **Add polymorphism quick reference** — one-page table showing allOf/oneOf/discriminator patterns~~ **Won't implement — no polymorphism guide; FEATURES.md lines 57 and 62 carry the composition rows.**
~~46. **TypeSpec 1.14.0 upgrade** — auto decorators, `.ts` module imports, memory leak fix~~ done — `@typespec/compiler` at `^1.17.0` in package.json
~~47. **README example snippets compiled in CI** — verify they actually work~~ done — `test/validation/all-examples-validation.test.ts` compiles every examples/ file in CI
~~48. **Add migration guide for allOf breaking change** — how to update consumers parsing flattened output~~ done — CHANGELOG lines 318-320 carry the breaking-change entries with migration guidance
~~49. **Improve error messages for discriminator validation** — if discriminator property is missing from model~~ **Won't implement — no discriminator-missing diagnostic; the required-list case is auto-fixed at `6f4cb773`.**
~~50. **Add JSDoc to `modelDeclaration` explaining allOf/discriminator logic** — link to AsyncAPI 3.1 spec~~ **Won't implement — no spec-link JSDoc on `modelDeclaration` at `src/schema-emitter.ts:52`; tests and CHANGELOG carry the logic.**

---

## g) Questions I CANNOT Figure Out Myself

### 1. Should the emitter validate that `@discriminator` properties are required?

AsyncAPI 3.1 spec says: "The property name used MUST be defined at this schema and it MUST be in the required property list." Currently the emitter emits `discriminator: "kind"` regardless of whether `kind` is required. AJV validation passes (the AsyncAPI 3.1 JSON Schema doesn't enforce this constraint at the schema level). Should we:

- (a) Add a warning diagnostic when `@discriminator("prop")` is used but `prop` is optional
- (b) Auto-add the discriminator property to `required` if missing
- (c) Leave it as-is (user responsibility)

I can't determine the right answer without knowing whether consumers rely on the emitter for spec compliance enforcement or just for output generation.

### 2. Should the dead discriminator-on-union code be removed?

TypeSpec's `@discriminator` decorator targets `Model` only. The compiler rejects it on unions with `decorator-wrong-target`. I added `getDiscriminator(program, union)` calls in `union()` and `typeToSchema()` as future-proofing, but these are dead code — they will always return `undefined`. Should I:

- (a) Remove the dead code (YAGNI — clean up uncovered paths)
- (b) Keep it with a `// Future-proofing: TypeSpec may add union discriminator support` comment
- (c) Keep it silently (it's harmless)

I lean toward (b), but removing uncovered code improves the coverage number and reduces maintenance burden.

### 3. Should `collectModelProperties`'s `includeBase` parameter be removed?

With `allOf`, `modelDeclaration` passes `includeBase=false`, and `modelLiteral` also passes `false`. The only way `includeBase=true` would be used is if `collectPropertiesSchema` were called with `true`, which nobody does. The parameter and its associated base-model-walking logic in `collectModelProperties` are effectively dead code. Should I:

- (a) Remove the parameter and the base-walking logic (simplify)
- (b) Keep it in case someone needs flattened properties in the future

This is a cleanup decision — removing it makes the code simpler but reduces flexibility.

---

## Session Metrics

<!-- ledger: 2026-08-06 session-metrics snapshot (before/after counts at session end) -->
<!-- check-rows:ledger -->

| Metric                 | Before | After | Delta                               |
| ---------------------- | ------ | ----- | ----------------------------------- |
| Tests                  | 915    | 928   | +13                                 |
| Test files             | 78     | 79    | +1 (polymorphism.test.ts)           |
| Source files           | 35     | 36    | +1 (schema-ref.ts)                  |
| Source lines (emitter) | 314    | 359   | +45 (allOf + discriminator + oneOf) |
| Source lines (ref)     | 0      | 43    | +43 (extracted from emitter)        |
| Coverage               | 96.9%  | 96.7% | -0.2%                               |
| Decorators mapped      | 14     | 15    | +1 (@discriminator)                 |
| TODO_LIST items        | 6      | 3     | -3 (allOf, oneOf, discriminator)    |
| Commits this session   | —      | 5     | —                                   |
| Files changed          | —      | 12    | —                                   |

---

## Conclusion

All 3 TODO_LIST items are implemented and verified. The emitter now supports full polymorphic type patterns: `allOf` for inheritance, `oneOf` for exclusive model unions, `@discriminator` for polymorphic dispatch. The pre-existing union variant `$ref` bug was discovered and fixed as a bonus.

The main tradeoff is a breaking change: model inheritance output changed from flattened properties to `allOf` refs. Consumers parsing flattened output must update to resolve `allOf`. This is more spec-compliant and is the standard approach used by OpenAPI/AsyncAPI code generators.

Coverage dropped to 96.7% due to new code paths and a new source file. The uncovered paths are: discriminator-on-union dead code, the Scalar branch in `refForNamedType`, and some `union()`/`enum()` override methods that Bun's coverage doesn't fully track through `dist/`.

The TODO_LIST is down to 3 low-impact items (OpenAPI cross-emitter, remaining `components.*`, channel metadata). The self-review's 50-item list is dominated by spec compliance gaps (13 items) and testing hardening (10 items).
