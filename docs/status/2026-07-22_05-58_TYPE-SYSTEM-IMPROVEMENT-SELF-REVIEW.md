# Type System / Data Model Improvement Session — Status Report

**Date:** 2026-07-22 05:58
**Session Goal:** "How can we improve the Type System/data model?"
**Baseline:** 504 tests pass, 0 build errors, 0 lint warnings
**Final State:** 504 tests pass, 0 build errors, 0 lint warnings
**Files Changed:** 5 files, +67 lines, -33 lines

> **Update 2026-07-22:** Test count grew from 504 to **510**. The `getValidVersionsString()` duplication (section e, item 3) was fixed — `binding-validator.ts` now imports from `binding-versions.ts`. The critical `availableScopes` half-measure (section b/d) is **STILL OPEN**: the type says `availableScopes` but the runtime passes through whatever key the user wrote (`scopes` or `availableScopes`). Of the 15 type-system issues in section (c), 12 remain open — see [Resolution](#resolution-2026-07-22) below for item-by-item status. These open items have been extracted to TODO_LIST.md.

---

## a) FULLY DONE (This Session)

### 1. OAuth2 `scopes` -> `availableScopes` (Spec Compliance)

**File:** `src/domain/models/asyncapi-document.ts:51-56`

- Changed `OAuth2Flow.scopes` to `OAuth2Flow.availableScopes` per AsyncAPI 3.1 spec
- Added JSDoc with spec link
- **Verdict:** Type-level change only. Correct per spec.

### 2. `SecurityRequirement` Type Added (Spec Compliance)

**File:** `src/domain/models/asyncapi-document.ts:72-77, 88, 111`

- Added `SecurityRequirement = Record<string, string[]>` type
- Changed `ServerObject.security` from `SecurityScheme[]` to `SecurityRequirement[]`
- Changed `OperationObject.security` from `SecurityScheme[]` to `SecurityRequirement[]`
- **Why:** AsyncAPI 3.1 distinguishes between the _scheme definition_ (in components.securitySchemes) and the _requirement_ (on servers/operations — just a name-to-scopes map). The old type conflated them.

### 3. `OperationAction` Named Type (Clarity)

**File:** `src/domain/models/asyncapi-document.ts:38-39`

- Extracted `"send" | "receive"` into a named `OperationAction` type
- Used in `OperationObject.action`, `DiscoveredOp.action`, `inferActionFromName` return type
- Replaced 3 inline occurrences across `document-builder.ts`

### 4. `ref()` / `refSchema()` / `refMessage()` / `refChannel()` Helpers (DRY)

**File:** `src/domain/models/asyncapi-document.ts:13-36`

- Centralized `$ref` construction in domain model
- Moved `escapeRefToken()` from `document-builder.ts` to the domain model (was duplicated/inline)
- Replaced 5 inline `{ $ref: ... }` constructions in `document-builder.ts` with typed helpers

### 5. Binding Version Split-Brain Eliminated (DRY)

**Files:** `src/constants/binding-versions.ts:93-100`, `src/validation/binding-validator.ts`

- Moved `getValidVersionsString()` to `binding-versions.ts` (single source of truth)
- Deleted the duplicate hardcoded copy from `binding-validator.ts` (was 12 lines of the same data)
- Now both functions read from `VALID_BINDING_VERSIONS` constant

### 6. Silent Error Swallowing Fixed (Safety)

**File:** `src/schema-emitter.ts:352-353`

- Changed bare `catch {}` to `catch (err) { console.error(...) }` in `generateSchemas()`
- **Why:** Schema generation failures were silently swallowed with zero diagnostic output

---

## b) PARTIALLY DONE

### OAuth2 `availableScopes` — TYPE ONLY, NO RUNTIME TRANSFORMATION

**Status:** Type changed, but the emitter does NOT rename `scopes` -> `availableScopes` at runtime.

The decorator code (`$security` in `minimal-decorators.ts:169-213`) stores the scheme as a raw `Record<string, unknown>` via `extractConfigRecord()`. If a user writes `scopes:` in their `@security` decorator, the emitter outputs `scopes:` in the document — NOT `availableScopes:`.

The tests pass because:

- `test/compliance/servers-security.test.ts:158` uses `availableScopes` in the input (correct)
- `test/domain/security-oauth2-flows.test.ts` uses `scopes:` in input but doesn't assert on the output field name
- No test validates the emitted document against the AsyncAPI JSON Schema for this specific field

**Risk:** Generated documents with `scopes` instead of `availableScopes` will FAIL AsyncAPI 3.1 JSON Schema validation.

---

## c) NOT STARTED (Identified But Not Addressed)

### Type System Issues Identified During Review

1. **`bindings.ts` is 100% dead code** — `src/domain/models/bindings.ts` (177 lines) is imported by NOTHING in `src/`. Zero imports anywhere in the codebase. It's pure documentation weight. The binding types are never used for validation, never referenced at runtime, never imported. `ProtocolBindings = Record<string, Record<string, unknown>>` is what everything actually uses.

2. **`supportsBindingPlacement()` is never called** — `src/constants/binding-versions.ts:105` defines `supportsBindingPlacement()` and `BINDING_PLACEMENT` (the 5x4 matrix of which protocols support which binding targets). Neither is imported or called anywhere in the codebase.

3. **`SchemaObject` has `[key: string]: unknown` index signature** — This undermines the type safety of the entire schema emission pipeline. Any typo in a schema property name is silently accepted. The AGENTS.md says "No index signatures except `SchemaObject` (standard JSON Schema extension pattern)" — but this is a deliberate tradeoff, not an oversight.

4. **Pervasive `as { name: string }` type assertions** — `document-builder.ts` has 7+ instances of `type as { name: string }` for TypeSpec compiler types. The actual `Type` type from `@typespec/compiler` has proper interfaces (`Operation`, `Model`, `Namespace`) with `.name` properties. These casts bypass type safety entirely.

5. **`ProtocolConfigData` discriminated union is created but never narrowed** — `state.ts` defines a beautiful discriminated union (`KafkaConfigData | WebSocketConfigData | MqttConfigData | GenericProtocolConfigData`) but `document-builder.ts:310-324` accesses it as a generic object: `data.protocol`, `data.binding` — without narrowing on the discriminant. The discriminated union provides zero runtime benefit.

6. **`OperationTypeData.type` is `"publish" | "subscribe"` but AsyncAPI uses `"send" | "receive"`** — The mapping `opData.type === "publish" ? "send" : "receive"` in `document-builder.ts:147` is a string-level translation. `OperationTypeData` should store the AsyncAPI action directly, or at minimum the mapping should be a named function.

7. **`MessageHeaderData` has untyped `value?: unknown`** — Headers have `type?: string` that accepts any string, not a constrained JSON Schema type union.

8. **`SecurityScheme.in` type is `"user" | "password" | "query" | "header" | "cookie"`** — The `"user" | "password"` values are wrong per AsyncAPI 3.1 spec. API key location should be `"query" | "header" | "cookie"` only. The `user`/`password` are for `userPassword` scheme type, not for the `in` field.

9. **No branded/opaque types** — Stringly-typed values like protocol names, security scheme names, and binding keys have no type-level distinction. A `string` channel key and a `string` message name are interchangeable at the type level.

10. **`storeServerConfig` stores as `ServerConfigEntry[]` but `ServerConfigData` in `state.ts` is a single object** — The state type says `Map<Type, ServerConfigData[]>` (multi-value), but `ServerConfigData` has single fields. The array-wrapping happens in `state-writers.ts` ad-hoc.

11. **`ProtocolConfigBase.binding` is `Record<string, unknown>`** — Could use the typed binding interfaces from `bindings.ts` IF that file were actually imported and connected.

12. **`CorrelationIdData` has `property?: string`** but it's never used — `document-builder.ts:239` only reads `.location`, never `.property`. Dead field.

13. **`OperationTypeData` has `tags?: string[]` and `description?: string`** but neither is read in `document-builder.ts` — the tags come from `state.tags` (a separate state map), and the description is never emitted.

14. **`intrinsicToSchema()` return type is `SchemaObject` but some branches return inconsistent shapes** — e.g., `int8/16/32` set `format` but `uint8/16/32/64` and `safeint` don't. The format omission looks like a bug, not a design choice.

15. **`state.ts:TagData = { name: string }[]`** — This is an array of `{name: string}`, which is just `Tag[]` from the domain model but redefined. Split-brain between `Tag` and `{ name: string }`.

---

## d) TOTALLY FUCKED UP

### Nothing was broken.

All 504 tests pass. Build is clean. Lint is clean. No regressions introduced.

### BUT: The `availableScopes` change is a half-measure

I changed the type to match the spec but didn't add the runtime transformation. This is the worst kind of change — it looks correct on paper but the emitted output would still contain `scopes` if that's what the user typed. The type system now _says_ the field is `availableScopes` while the runtime _produces_ `scopes`. This is a type-level lie.

---

## e) WHAT WE SHOULD IMPROVE

### Critical

~~1. **Add runtime `scopes` -> `availableScopes` transformation** in the security decorator or document builder. The type says `availableScopes` but the runtime emits `scopes`.~~ done at `ddd0b079`
~~2. **Fix `SecurityScheme.in`** — remove `"user" | "password"` from the union; AsyncAPI 3.1 API key `in` field only accepts `"query" | "header" | "cookie"`.~~ done at `ddd0b079`
~~3. **Connect or delete `bindings.ts`** — 177 lines of typed interfaces that nothing imports. Either wire them into the validation pipeline or delete them.~~ done at `ddd0b079`

### High Priority

~~4. **Delete `supportsBindingPlacement()` and `BINDING_PLACEMENT`** if not going to be used, or wire them into the binding validation pipeline (they should reject bindings placed on wrong targets).~~ done at `5e78a764`
~~5. **Narrow `ProtocolConfigData` discriminated union in `document-builder.ts`** — the whole point of a discriminated union is type-safe access. Currently it's accessed as a bag of optional fields.~~ done at `07f8b107`
~~6. **Replace `type as { name: string }` casts** with proper TypeSpec type narrowing (`if (type.kind === "Operation")` etc.).~~ done at `07f8b107`
~~7. **Fix `intrinsicToSchema` format inconsistency** — `uint*` and `safeint` should have `format` like `int*` does, or document why they're intentionally omitted.~~ done at `07f8b107`
~~8. **Map `OperationTypeData.type` to `OperationAction`** via a named function instead of inline ternary.~~ done at `07f8b107`
~~9. **Remove dead fields** from state types: `CorrelationIdData.property`, `OperationTypeData.tags`, `OperationTypeData.description`.~~ done at `07f8b107`
~~10. **Align `TagData` with `Tag[]`** — same shape, two definitions.~~ done at `07f8b107`

### Medium Priority

~~11. **Add unit tests for the new `ref()` / `refSchema()` / `refMessage()` / `refChannel()` helpers** — especially RFC 6901 escaping behavior.~~ done — `test/unit/shared-utils.test.ts` covers `escapeRefToken` and the ref builders; RFC 6901 escaping is locked by property P7 in `test/property/emitter-properties.test.ts`
~~12. **Add unit tests for `getValidVersionsString()`** — newly extracted function with no direct test coverage.~~ **Won't implement — no dedicated unit test; version strings are exercised via the invalid-binding-version cases in `test/validation/binding-field-validation.test.ts`.**
~~13. **Consider branded types** for protocol-unsafe strings (channel keys, message names, schema names).~~ **Won't implement — never adopted; section c row 9 already recorded branded types as a deliberate design choice.**
~~14. **Consolidate `ServerConfigData` / `ServerConfigEntry`** — two types for the same concept.~~ done — `src/state.ts:61` defines the single `ServerConfigData` and `src/state-writers.ts:118` writes entries as that type
~~15. **Add AsyncAPI JSON Schema validation test for OAuth2 documents** to catch the `scopes` vs `availableScopes` gap.~~ done — `test/validation/all-examples-validation.test.ts` AJV-validates every examples/ document including OAuth2 security against the official AsyncAPI 3.1.0 schema

---

## f) Up to 50 Things to Get Done Next

### Spec Compliance (CRITICAL)

~~1. Add runtime transformation `scopes` -> `availableScopes` in security scheme processing~~ done at `ddd0b079`
~~2. Fix `SecurityScheme.in` type: remove `"user" | "password"`, keep only `"query" | "header" | "cookie"`~~ done at `ddd0b079`
~~3. Add `SecurityScheme.ils` field if needed by spec (OpenID Connect)~~ done — `openIdConnectUrl` on `SecurityScheme` in `src/domain/models/asyncapi-document.ts:346` covers the OpenID Connect case
~~4. Verify `ServerObject` has all AsyncAPI 3.1 fields (e.g., `security` is now correct, but check `bindings` schema)~~ done — `test/integration/asyncapi-3.1-features.test.ts` locks protocolVersion, pathname, variables and security on servers, emitted by `src/builders/server-builder.ts`
~~5. Add `defaultContentType` to document root (type exists but never populated from decorator state)~~ done — `@defaultContentType` is validated in `src/lib.ts` and written in `src/state-writers.ts:260`; tested at `test/integration/asyncapi-3.1-features.test.ts:232`
~~6. Verify `MessageObject` has all spec fields (e.g., `schemaFormat` is missing)~~ done — `schemaFormat` flows through `src/state.ts:49` and `src/decorator-helpers.ts:304`; tested at `test/integration/asyncapi-3.1-features.test.ts:118`
~~7. Add `externalDocs` support to operations, messages, and tags~~ done — `externalDocs` is supported in the domain model at `src/domain/models/asyncapi-document.ts:125`, in `src/decorator-helpers.ts:267` and in `src/document-builder.ts:226`
~~8. Verify `ChannelObject.parameters` type matches spec (should have `location` field)~~ done — `ParameterObject.location` exists in `src/domain/models/asyncapi-document.ts:273`

### Dead Code Elimination

~~9. Delete or wire `src/domain/models/bindings.ts` (177 lines, 0 imports)~~ done at `ddd0b079`
~~10. Delete or wire `supportsBindingPlacement()` and `BINDING_PLACEMENT`~~ done at `5e78a764`
~~11. Remove `CorrelationIdData.property` (never read)~~ done at `07f8b107`
~~12. Remove `OperationTypeData.tags` (never read; tags come from separate state map)~~ done at `07f8b107`
~~13. Remove `OperationTypeData.description` (never emitted)~~ done at `07f8b107`
~~14. Consolidate `TagData` = `Tag[]` (duplicate definitions)~~ done at `07f8b107`
15. Check if `messageSchemas` state symbol is used (declared in lib.ts but may be dead)

### Type Safety Improvements

~~16. Replace all `type as { name: string }` casts with proper TypeSpec narrowing~~ done at `07f8b107`
~~17. Narrow `ProtocolConfigData` union in document-builder via switch on `data.protocol`~~ done at `07f8b107`
~~18. Map `OperationTypeData.type` to `OperationAction` via named function (eliminate inline ternary)~~ done at `07f8b107`
~~19. Remove `[key: string]: unknown` from `ProtocolBindings` and use the typed binding maps from `bindings.ts`~~ **NOT-DO — `bindings.ts` was deleted at `ddd0b079`; `ProtocolBindings` keeps the `Record` shape by decision.**
~~20. Add branded types for `ChannelKey`, `MessageName`, `SchemaName`~~ **Won't implement — never adopted; section c row 9 already recorded branded types as a deliberate design choice.**
~~21. Type `intrinsicToSchema()` to return specific schema shapes, not generic `SchemaObject`~~ **Won't implement — returns the single `JsonSchema` type at `src/intrinsic-mapping.ts:7`; branch-specific shapes were never added.**
~~22. Fix `intrinsicToSchema` format inconsistency for unsigned integers~~ done at `07f8b107`
~~23. Make `ServerConfigData` and the ad-hoc `ServerConfigEntry` in state-writers.ts the same type~~ done — `src/state.ts:61` defines the single `ServerConfigData` and `src/state-writers.ts:118` writes entries as that type
~~24. Type the decorator config parameters properly instead of `unknown` (use model expression types from TypeSpec)~~ **Won't implement — config records still enter as `unknown` via `extractConfigRecord` at `src/decorator-helpers.ts:231`; typed downstream by `src/extract-nested-config.ts`.**
~~25. Add `satisfies` checks to runtime objects to catch type drift early~~ done — `satisfies` checks live in `src/constants/protocols.ts` and `src/builders/shared-utils.ts`

### Validation Hardening

~~26. Wire `BINDING_PLACEMENT` into binding validation to reject misplaced bindings~~ done at `5e78a764`
~~27. Add AsyncAPI JSON Schema validation test for OAuth2 flows specifically~~ done — `test/validation/all-examples-validation.test.ts` AJV-validates every examples/ document including OAuth2 security against the official AsyncAPI 3.1.0 schema
~~28. Add test that `scopes` input from `@security` produces `availableScopes` in output~~ done — `normalizeOAuth2Scopes` cases in `test/unit/shared-utils.test.ts:102` assert `scopes` input becomes `availableScopes` output
~~29. Validate `SecurityScheme` fields per scheme type (e.g., `apiKey` requires `name` + `in`)~~ **Won't implement — never built; security validation remains scheme-type-only via `invalid-security-scheme-type` in `src/lib.ts:47`.**
~~30. Add test that binding versions emitted match the constants in `binding-versions.ts`~~ done — `test/validation/binding-field-validation.test.ts` imports `LATEST_BINDING_VERSIONS` and asserts invalid-binding-version against the constants
~~31. Validate operation messages reference existing channels~~ **Won't implement — never built as a diagnostic; `test/validation/semantic-ref-resolution.test.ts` locks ref resolution instead.**

### Architecture / Module Boundaries

~~32. Export domain model types from `index.ts` (currently not exported for consumers)~~ done — `src/state.ts:22` re-exports the domain model types and `src/index.ts:12` re-exports state
~~33. Consider whether `binding-versions.ts` and `protocols.ts` should be merged into one `constants/` module~~ **Won't implement — both modules remain separate in `src/constants/` as `binding-versions.ts` and `protocols.ts`; merging was never done.**
~~34. Move `extractConfigRecord` and `modelToRecord` closer to where they're used (decorator-helpers is a grab bag)~~ **Won't implement — still defined in `src/decorator-helpers.ts:222` and `src/decorator-helpers.ts:231`; the emitter modularization kept them there.**
~~35. Consider a `ref-builder.ts` module instead of putting `ref()` functions in the domain model~~ **Won't implement — `ref` constructors stayed in the domain model at `src/domain/models/asyncapi-document.ts:17`, documented in AGENTS.md.**
~~36. Split `state.ts` into `state-types.ts` (types) and `state-consolidation.ts` (functions)~~ **Won't implement — `src/state.ts` remains the single types-plus-consolidation module; the functions already live in `src/state-writers.ts`.**
~~37. Move `inferActionFromName` and `getReturnModelName` to a `naming.ts` utility module~~ done — moved to module scope instead: `inferActionFromName` in `src/builders/shared-utils.ts:122`; no separate naming module

### Testing

~~38. Add unit tests for `ref()`, `refSchema()`, `refMessage()`, `refChannel()`, `escapeRefToken()`~~ done — `test/unit/shared-utils.test.ts` covers `escapeRefToken` and the ref builders; RFC 6901 escaping is locked by property P7 in `test/property/emitter-properties.test.ts`
~~39. Add unit tests for `getValidVersionsString()`~~ **Won't implement — no dedicated unit test; version strings are exercised via the invalid-binding-version cases in `test/validation/binding-field-validation.test.ts`.**
~~40. Add unit tests for `normalizeBindingKey()`~~ **Won't implement — no dedicated unit test; key canonicalization is exercised via `test/validation/binding-field-validation.test.ts`.**
~~41. Add property-based test for RFC 6901 escaping (all `/` and `~` combinations)~~ done — property P7 in `test/property/emitter-properties.test.ts:12` generates RFC 6901 keys and asserts every ref agrees
~~42. Add test for `SecurityRequirement` shape in emitted output~~ done — `test/integration/asyncapi-3.1-features.test.ts:206` asserts `SecurityRequirement` on `operation.security`
~~43. Add test for `OperationAction` type correctness in emitted output~~ done — `operationAction` cases in `test/unit/shared-utils.test.ts:65`
~~44. Add snapshot test for the `console.error` in `generateSchemas` catch block (should not fire on valid input)~~ **Won't implement — never added; no test asserts the `generateSchemas` catch-path console.error.**

### Documentation

~~45. Update AGENTS.md with `SecurityRequirement` type info~~ done — AGENTS.md documents `SecurityRequirement` in the AsyncAPI 3.1 security-format note
~~46. Update AGENTS.md with `OperationAction` type info~~ **Won't implement — never added to AGENTS.md; the type is documented in the domain model file itself.**
~~47. Update AGENTS.md with `ref()` helper functions info~~ done — AGENTS.md documents the `ref` constructors in the Document Model note
~~48. Document that `bindings.ts` is either documentation-only or should be wired in~~ **NOT-DO — moot: `bindings.ts` was deleted at `ddd0b079` and AGENTS.md no longer lists binding types.**
~~49. Document the `scopes` -> `availableScopes` transformation gap~~ done — gap closed by runtime normalization; AGENTS.md documents the accept-both-keys behavior of `normalizeOAuth2Scopes()`
~~50. Add ADR for the domain model type system strategy (when to add index signatures, when to use branded types)~~ **Won't implement — never written; `docs/adr/` holds only 0001 (asset-emitter) and 0002 (brand identity); the index-signature decision lives in AGENTS.md.**

---

## g) Questions I CANNOT Answer Myself

### Q1: Should I add the runtime `scopes` -> `availableScopes` transformation?

The AsyncAPI 3.1 spec requires `availableScopes`. Users currently write `scopes:` in their TypeSpec files. Options:

- (A) Transform `scopes` -> `availableScopes` in the decorator (user-friendly, magic)
- (B) Require users to write `availableScopes:` in their TypeSpec (spec-faithful, breaking)
- (C) Accept both as input, always output `availableScopes` (most compatible)

I lean (C) but this is a user-experience decision I can't make alone.

### Q2: Should `src/domain/models/bindings.ts` be wired into validation or deleted?

It's 177 lines of typed interfaces that nothing imports. Options:

- (A) Delete it (YAGNI — `ProtocolBindings = Record<string, Record<string, unknown>>` works)
- (B) Wire it into `processBindings()` to validate binding field names per protocol
- (C) Keep as documentation (current state, but it's dead weight)

I lean (A) unless binding field validation is a near-term goal.

### Q3: Is the `[key: string]: unknown` index signature on `SchemaObject` intentional and permanent?

JSON Schema is extensible by design, so SchemaObject needs to accept arbitrary keys. But this means typos like `propertis` instead of `properties` are silently accepted. Options:

- (A) Keep the index signature (current — pragmatic for JSON Schema)
- (B) Remove it and use `Record<string, unknown>` only where truly arbitrary (stricter but noisy)
- (C) Keep it but add a strict override type for known fields (complex)

I lean (A) but want confirmation this is the permanent decision.

---

## Resolution (2026-07-22)

### Section (b) — `availableScopes` half-measure: STILL OPEN

The type was changed to `availableScopes` but the emitter does NOT rename `scopes` → `availableScopes` at runtime. If a user writes `scopes:` in their `@security` decorator, the emitted document contains `scopes:`, which FAILS AsyncAPI 3.1 JSON Schema validation. This is the highest-priority open item — extracted to TODO_LIST.md P0.

### Section (c) — 15 type-system issues

<!-- ledger: 2026-07-22 issue-ledger snapshot; each row's final fate is recorded by the section e and f verdicts above -->
<!-- check-rows:ledger -->

| #  | Issue                                                                                      | Status     | Notes                                                   |
| -- | ------------------------------------------------------------------------------------------ | ---------- | ------------------------------------------------------- |
| 1  | `bindings.ts` 100% dead code (177 lines, 0 imports)                                        | OPEN       | Extracted to TODO_LIST                                  |
| 2  | `supportsBindingPlacement()` / `BINDING_PLACEMENT` never called                            | OPEN       | Extracted to TODO_LIST                                  |
| 3  | `SchemaObject` has `[key: string]: unknown`                                                | DELIBERATE | JSON Schema extension pattern — documented in AGENTS.md |
| 4  | `as { name: string }` type assertions (7+ in document-builder)                             | OPEN       | Extracted to TODO_LIST                                  |
| 5  | `ProtocolConfigData` union created but never narrowed                                      | OPEN       | Extracted to TODO_LIST                                  |
| 6  | `OperationTypeData.type` is `"publish"\|"subscribe"` but AsyncAPI uses `"send"\|"receive"` | OPEN       | Extracted to TODO_LIST                                  |
| 7  | `MessageHeaderData.value` untyped `unknown`                                                | OPEN       | Low priority                                            |
| 8  | `SecurityScheme.in` has invalid `"user"\|"password"`                                       | OPEN       | Spec compliance bug — extracted to TODO_LIST P0         |
| 9  | No branded/opaque types                                                                    | DELIBERATE | Design choice, not a bug                                |
| 10 | `storeServerConfig` type mismatch                                                          | OPEN       | Low priority                                            |
| 11 | `ProtocolConfigBase.binding` is `Record<string, unknown>`                                  | OPEN       | Blocked by #1 (bindings.ts dead)                        |
| 12 | `CorrelationIdData.property` dead field                                                    | OPEN       | Extracted to TODO_LIST                                  |
| 13 | `OperationTypeData.tags/description` dead fields                                           | OPEN       | Extracted to TODO_LIST                                  |
| 14 | `intrinsicToSchema()` format inconsistency (uint\*)                                        | OPEN       | Extracted to TODO_LIST                                  |
| 15 | `TagData` vs `Tag[]` duplicate definition                                                  | OPEN       | Extracted to TODO_LIST                                  |

### Section (e) items resolved since this report

| # | Item                                   | Status                                        |
| - | -------------------------------------- | --------------------------------------------- |
| ~~5~~ done — `src/validation/binding-validator.ts:24` imports it from `src/constants/binding-versions.ts:120` | ~~`getValidVersionsString()` duplication~~ | ~~DONE — imports from `binding-versions.ts` now~~ |
