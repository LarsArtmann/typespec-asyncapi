# Status Report: Reusable Components Follow-Up Session

**Date:** 2026-08-06 14:25
**Session Goal:** Execute the 4 next-steps from `2026-08-06_13-50_REUSABLE-COMPONENTS.md`:
negative tests, parameter extraction, serverBindings, AGENTS.md update.

---

## a) FULLY DONE

### 1. AGENTS.md Updated

- Decorator count: **25** (16 core + 9 reusable-component)
- Diagnostic codes: **24** (19 error + 5 warning)
- Builder file list: **10 files** (added `components-builder.ts`, `tag-builder.ts`)
- Test count synced to **982**
- Added "Reusable Components" bullet documenting all 9 decorators, their targets, and the auto-ref behavior

### 2. Negative Tests (`test/integration/reusable-components-negative.test.ts`)

**11 tests**, all passing, covering every error path:

<!-- ledger: 2026-08-06 session test-inventory snapshot; the file exists today with 22 tests -->
<!-- check-rows:ledger -->

| Decorator                           | Test                           | Diagnostic Code                |
| ----------------------------------- | ------------------------------ | ------------------------------ |
| `@operationTrait("")`               | Empty name                     | `invalid-trait-config`         |
| `@useOperationTrait("nonexistent")` | Undefined ref silently skipped | (no error)                     |
| `@messageTrait("")`                 | Empty name                     | `invalid-trait-config`         |
| `@useMessageTrait("")`              | Empty ref name                 | `invalid-trait-config`         |
| `@parameter("", ...)`               | Empty name                     | `invalid-parameter-config`     |
| `@reusableCorrelationId("", ...)`   | Empty name                     | `invalid-correlationId-config` |
| `@reusableCorrelationId("x", "")`   | Empty location                 | `invalid-correlationId-config` |
| `@useCorrelationId("nonexistent")`  | Undefined ref silently skipped | (no error)                     |
| `@reusableBinding("", ...)`         | Empty name                     | `invalid-bindings-config`      |
| `@useBinding("")`                   | Empty ref name                 | `invalid-bindings-config`      |
| `@useBinding("nonexistent")`        | Undefined ref silently skipped | (no error)                     |

Key discovery: TypeSpec diagnostic codes are **library-name-prefixed** at runtime
(`@lars-artmann/typespec-asyncapi/invalid-trait-config`), not bare. Tests use
`.endsWith(suffix)` to match.

### 3. Parameter `enum`/`default`/`examples` Extraction

- Extended `namedConfigDecorator` factory with optional `extraPicker` callback
- `@parameter` now passes `(cfg) => pickDefined(cfg, PARAMETER_EXTRA_FIELDS)` where
  `PARAMETER_EXTRA_FIELDS = ["enum", "default", "examples"]`
- `ParameterConfigData extends ParameterObject` — eliminates field duplication (jscpd clone killed)
- `ParameterObject` types tightened: `string[]` for `enum`/`examples`, `string` for `default`
- **Removed `schema` from `ParameterObject`** — the AsyncAPI 3.1 JSON Schema
  (`@asyncapi/specs/definitions/3.1.0/parameter.json`) has `additionalProperties: false`
  and does NOT include `schema`. Only: `description`, `location`, `enum`, `default`, `examples`.
- Added compliance test verifying AJV validation passes with `default` and `examples`

### 4. Server Bindings Support (`components.serverBindings`)

- Extended `@useBinding` target from `Operation | Model` to `Operation | Model | Namespace` in `lib/main.tsp`
- `applyBindingRefs` in `components-builder.ts` now does 3-way dispatch on `type.kind`:
  - `Operation` → `operationBindings` + sets `operation.bindings = { $ref }`
  - `Namespace` → `serverBindings` + sets `server.bindings = { $ref }` on ALL servers defined on that namespace
  - `Model` (default) → `messageBindings` + sets `message.bindings = { $ref }`
- Extracted `applyBindingToTarget` helper to avoid deep nesting
- Added compliance test: `@reusableBinding` + `@server` + `@useBinding` on namespace →
  server gets `$ref: "#/components/serverBindings/..."`, AJV validates clean

### 5. Dead Code Removal + File Size Remediation

Two files exceeded the 400-line ESLint `max-lines` limit from the prior session's work:

<!-- ledger: 2026-08-06 file-size remediation snapshot; both files remain under the 400-line cap today -->
<!-- check-rows:ledger -->

| File                        | Before | After   | How                                                                                                                                                    |
| --------------------------- | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/state-writers.ts`      | 434    | **329** | Removed 5 dead `storeOperationTrait`/`storeMessageTrait`/etc. functions (never called — `storeMulti` is used directly) + cleaned 5 unused type imports |
| `src/minimal-decorators.ts` | 409    | **328** | Inlined `applyStringIdDecorator` into `makeStringIdDecorator` (removed intermediate function + `DiagnosticContext` import)                             |

### 6. Duplication Elimination

5 jscpd clones introduced by the parameter/binding refactor → **0 clones** through:

- `ParameterConfigData extends ParameterObject` (eliminates 6 duplicated field declarations)
- `namedConfigDecorator` regains `"invalid-parameter-config"` in its union (no standalone `$parameter` function)
- `$reusableBinding` extracts `{ targetKind: target.kind }` into `fmt` variable (used twice)

### 7. Full Verification Gate — ALL PASS

<!-- ledger: 2026-08-06 session gate-metrics snapshot -->
<!-- check-rows:ledger -->

| Gate                                      | Result                               |
| ----------------------------------------- | ------------------------------------ |
| TypeScript build (`tsc -p tsconfig.json`) | 0 errors                             |
| ESLint + oxlint (`--deny-warnings`)       | 0 errors, 0 warnings                 |
| Tests (vitest, 82 files)                  | **982 pass / 0 fail**                |
| Coverage gate (bun, 39 files)             | PASSED — avg 97.3%, min 75% per-file |
| jscpd duplication                         | **0 clones / 0% / 0% tokens**        |

---

## b) PARTIALLY DONE

### `components.channelBindings` — Type Exists, No Population

The `ComponentsObject` type includes `channelBindings?: Record<string, ProtocolBindings>` (line 318 of `asyncapi-document.ts`), but there is no decorator or builder code to populate it. This requires either:

- A new decorator targeting channel addresses (which are strings, not Type types), or
- Extending `@useBinding` to accept a channel-key string parameter

The architecture doesn't cleanly support this — channels are derived from operation `@channel` addresses, not first-class TypeSpec declarations. This is a deeper design problem, not just a missing decorator.

---

## c) NOT STARTED

~~1. **Channel bindings population** — see (b) above~~ done at `01621253`
~~2. **Operation trait `security` field** — `OperationTraitData` has `security?: SecurityRequirement[]` but the decorator doesn't extract it (would need `@security` on Namespace or a trait-specific mechanism)~~ done — pickOpt list includes `security` at `src/builders/components-builder.ts:68`
~~3. **Message trait `headers` field** — `MessageTraitObject` includes `headers` via `Pick<MessageObject>` but `@messageTrait` doesn't extract a headers model~~ done — `src/builders/components-builder.ts:84` extracts `headers` into messageTraits
~~4. **Message trait `correlationId` field** — Same: type allows it, decorator doesn't populate it~~ done — `src/builders/components-builder.ts:85` extracts `correlationId` into messageTraits

---

## d) TOTALLY FUCKED UP

### Wasted iterations on parameter `schema` field

**What happened:** I initially added `schema?: JsonSchema` to `ParameterConfigData` and `ParameterObject`, wrote a test using `schema: #{ type: "string" }`, and ran it. AJV rejected it with `must NOT have additional properties` because the AsyncAPI 3.1 `parameter.json` schema has `additionalProperties: false` and does NOT include `schema`. I had to remove it.

**Why it happened:** I assumed AsyncAPI 3.1 parameters support `schema` (OpenAPI does). I should have checked the actual JSON Schema definition BEFORE writing the type. The AGENTS.md even says "validate against AsyncAPI 3.1 JSON Schema" — I should have verified the spec first.

**Cost:** ~3 extra build/test cycles and one dead-end implementation.

### Wasted iteration on `enum` keyword

TypeSpec `#{}` value literals don't support reserved keywords like `enum`. The test failed with `token-expected`. I removed `enum` from the test but kept it in the implementation (it works via `pickDefined` which reads from the record — it just can't be set via `#{}` syntax). This is a usability limitation, not a bug, but I should have known from AGENTS.md's existing gotcha about `const` being reserved.

### Temporary debug test files left in the working tree

I created `debug-diagnostic.test.ts` and `debug-param.test.ts` during development. The auto-git daemon committed them before I deleted them. They were removed in a later commit, but they polluted the git history temporarily. Should have used `console.log` in the test itself or a scratch file outside `test/`.

---

## e) WHAT WE SHOULD IMPROVE

### Process improvements

~~1. **Always check the AsyncAPI spec JSON Schema before adding fields to domain types.** The schema files are in `node_modules/@asyncapi/specs/definitions/3.1.0/`. They are the source of truth. Reading them takes 10 seconds; guessing and failing takes 5 minutes.~~ done — AGENTS.md mandates AJV validation against the official 3.1.0 schema in every compliance test

~~2. **Use scratch files outside `test/` for debugging.** The auto-git daemon commits everything. Debug files in `test/` get committed and pollute history.~~ **Won't implement — process note; AGENTS.md documents the auto-commit daemon committing everything in the tree.**

~~3. **Diagnostic codes are library-prefixed at runtime.** This is now documented in the negative test file but should be a gotcha in AGENTS.md. Every test that checks diagnostic codes needs `.endsWith()` or `.includes()`, not exact equality.~~ done — AGENTS.md documents library-prefixed codes and the `endsWith` matching rule

~~4. **TypeSpec `#{}` keyword limitations are systematic.** `enum`, `const`, and other reserved words can't be used as property keys in value literals. This affects user-facing API design. We should document which config fields are unreachable via `#{}` syntax.~~ done — AGENTS.md documents the `#{}` reserved-key limitation including `enum` and `const`

### Code improvements

~~5. **`components-builder.ts` is at 212 lines** (limit 370). It's getting complex with 3 different binding target types. Consider splitting binding-ref logic into its own module if more binding types are added.~~ **Won't implement — file stands at 286 lines today, well under the cap; no split needed.**

~~6. **`namedConfigDecorator` is now doing double duty** — trait decorators and parameter decorators share the factory but have different semantics (traits only extract strings; parameters also extract typed arrays/string values via `extraPicker`). The `extraPicker` callback is a code smell that these aren't quite the same pattern.~~ **Won't implement — the shared factory remains at `src/namespace-decorators.ts:143` serving traits and parameters.**

~~7. **`applyBindingToTarget` in `components-builder.ts`** accesses `state.servers` to find server names for Namespace bindings. This couples the reusable-components builder to the server builder's state shape. If the server state structure changes, this will break silently (no type error, just missing bindings).~~ **Won't implement — coupling remains at `src/builders/components-builder.ts:229`; no breakage since.**

~~8. **The negative test file checks `.endsWith()` on diagnostic codes** — fragile if a future library rename changes the prefix. Consider a shared helper that strips the library prefix.~~ **Won't implement — still local to `test/integration/reusable-components-negative.test.ts:12`.**

---

## f) NEXT STEPS (Prioritized)

### High Impact

~~1. **Populate `components.channelBindings`** — requires designing a channel-targeting mechanism (likely a new `@channelBinding(name, address)` decorator or extending `@useBinding` with an address parameter)~~ done at `01621253`
~~2. **Extract operation trait `security` field** — `@operationTrait` should support `security` in its config, mapping to `OperationTraitObject.security`~~ done — `src/builders/components-builder.ts:68` extracts `security` into operationTraits
~~3. **Extract message trait `headers` and `correlationId` fields** — `@messageTrait` should support headers model references and inline/reusable correlation IDs~~ done — `src/builders/components-builder.ts:84` and `:85` extract `headers` and `correlationId` into messageTraits
~~4. **Add `@parameter` `location` validation** — the AsyncAPI spec requires `location` to match `^\$message\.(header|payload)#...` pattern. Currently any string is accepted.~~ done at `2d6bd9e2`
~~5. **Add integration test for server bindings with multiple servers** — verify that `@useBinding` on a namespace with 2+ servers applies the ref to ALL servers, not just one~~ **Won't implement — no multi-server case; serverBindings coverage lives in `test/compliance/reusable-components.test.ts`.**

### Medium Impact

~~6. **Document TypeSpec `#{}` reserved keyword limitation** in AGENTS.md — list which `@parameter` / `@reusableBinding` config fields can't be set via `#{}` syntax (`enum`, `const`)~~ done — AGENTS.md documents reserved keys including `enum` and `const`
~~7. **Extract shared diagnostic-code matching helper** — `hasErrorCode(diagnostics, suffix)` from the negative test file into `test/utils/test-helpers.ts` for reuse~~ **Won't implement — still local to `test/integration/reusable-components-negative.test.ts:12`.**
~~8. **Add positive integration test for `@parameter` with `location`** — verify the runtime expression format is preserved in output~~ done — `test/compliance/reusable-components.test.ts:142` sets `location: "$message.payload#/userId"`
~~9. **Add test for `@useBinding` on Namespace with NO servers** — verify it doesn't crash, produces empty `components.serverBindings`~~ **Won't implement — never added; namespace bindings without servers remain untested.**
~~10. **Add test for multiple `@reusableBinding` + `@useBinding` combinations** — verify name collision behavior (last-wins? error?)~~ **Won't implement — never added; name-collision behavior untested.**
~~11. **Consider `@useBinding` on channel operations for channel bindings** — `op` with `@channel("x") @useBinding("chBind")` could populate `channel.bindings` if the binding definition is placed in `components.channelBindings`~~ **NOT-DO — superseded: `@useChannelBinding` (added at `01621253`) is the shipped mechanism.**
~~12. **Add test verifying `components.serverBindings` validates against AsyncAPI 3.1 schema** — the current test checks `doc.servers?.prod.bindings` but doesn't deeply validate the binding object structure~~ done — `test/compliance/reusable-components.test.ts` covers serverBindings and AJV-validates output

### Lower Impact / Polish

~~13. **Split `namedConfigDecorator` into two factories** — one for string-only extraction (traits), one for mixed-type extraction (parameters with `extraPicker`)~~ **Won't implement — single factory remains at `src/namespace-decorators.ts:143`.**
~~14. **Rename `PARAMETER_EXTRA_FIELDS`** to something more descriptive like `PARAMETER_SCHEMA_FIELDS`~~ **Won't implement — name kept: `PARAMETER_EXTRA_FIELDS` at `src/namespace-decorators.ts:124`.**
~~15. **Add JSDoc to `ParameterConfigData`** documenting the `extends ParameterObject` relationship~~ done — JSDoc above `src/state.ts:210` documents the `extends ParameterObject` relationship
~~16. **Consider making `pickDefined` generic** — currently returns `Record<string, unknown>`, could return a typed subset~~ **Won't implement — still returns `Record<string, unknown>` at `src/namespace-decorators.ts:134`.**
~~17. **Add `channelBindings` to `DocumentBuildContext`** — even if unpopulated, having the accumulator ready signals intent~~ done — `src/builders/types.ts:49` carries `channelBindings` in the context
~~18. **Add E2E test** — full AsyncAPI document with all 6 component types populated simultaneously~~ done — golden `test/golden/reusable-components.test.ts:47` locks components.* populated
~~19. **Add golden file test** for a spec using reusable components — locks the output format~~ done — `test/golden/reusable-components.test.ts` with `reusable-components.expected.yaml`
~~20. **Consider operation trait `tags` extraction** — `TraitMetadata` includes `tags` but `@operationTrait` doesn't extract them~~ done — `src/builders/components-builder.ts:69` extracts `tags` into operationTraits
~~21. **Add test for trait name collision** — two `@operationTrait("same", ...)` on the same namespace (last-wins? merge? error?)~~ **Won't implement — never added; collision behavior untested.**
~~22. **Document the 3-way binding dispatch** in `components-builder.ts` with a comment explaining Operation vs Namespace vs Model~~ **Won't implement — no dedicated dispatch comment; the file header at `src/builders/components-builder.ts:1` lists the binding sections.**
~~23. **Consider extracting `BindingTargetSection` type** — `"operationBindings" | "messageBindings" | "serverBindings"` as a named union~~ **Won't implement — never introduced; binding sections stay inline in `src/builders/components-builder.ts`.**
~~24. **Add benchmark test** for reusable components — verify no performance regression with large numbers of traits/parameters~~ **Won't implement — `test/benchmark/performance.test.ts` measures the emitter; no reusable-components benchmark exists.**
~~25. **Update `docs/status/2026-08-06_13-50_REUSABLE-COMPONENTS.md`** — mark the 4 next-steps as done with cross-references to this report~~ **Won't implement — never edited in place; this follow-up report and the CHANGELOG entries are the record.**

---

## g) QUESTIONS

### 1. Should `components.channelBindings` be implemented via a new decorator or by extending `@useBinding`?

The fundamental problem: channels are not first-class TypeSpec types — they're derived from `@channel("address")` on operations. There's no Type target to attach a `@useBinding` to. Options:

- **A:** New `@channelBinding(name, addressPattern)` decorator on Namespace that matches channels by address glob
- **B:** Extend `@useBinding` to accept a string second parameter (the channel address)
- **C:** Add a `bindings` parameter to `@channel` itself (inline, not reusable)
- **D:** Skip channelBindings entirely — they're rarely used in practice

### 2. Should we support `@operationTrait` and `@messageTrait` with richer config (security, headers, correlationId)?

The AsyncAPI 3.1 spec allows `security` on operation traits and `headers`/`correlationId` on message traits. Currently we only extract string metadata fields. Adding these would make traits genuinely useful but requires either model-expression syntax (`{}`) or nested `#{}` configs with model references — significantly more complex extraction logic.

### 3. Should the negative test diagnostic-code matching helper be shared or kept local?

The `hasErrorCode(diagnostics, suffix)` pattern using `.endsWith()` will be needed in any future test that checks diagnostic codes. Should I extract it to `test/utils/test-helpers.ts`, or is it too niche to generalize?
