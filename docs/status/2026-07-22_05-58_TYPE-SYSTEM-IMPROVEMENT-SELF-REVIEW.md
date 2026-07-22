# Type System / Data Model Improvement Session — Status Report

**Date:** 2026-07-22 05:58
**Session Goal:** "How can we improve the Type System/data model?"
**Baseline:** 504 tests pass, 0 build errors, 0 lint warnings
**Final State:** 504 tests pass, 0 build errors, 0 lint warnings
**Files Changed:** 5 files, +67 lines, -33 lines

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

1. **Add runtime `scopes` -> `availableScopes` transformation** in the security decorator or document builder. The type says `availableScopes` but the runtime emits `scopes`.
2. **Fix `SecurityScheme.in`** — remove `"user" | "password"` from the union; AsyncAPI 3.1 API key `in` field only accepts `"query" | "header" | "cookie"`.
3. **Connect or delete `bindings.ts`** — 177 lines of typed interfaces that nothing imports. Either wire them into the validation pipeline or delete them.

### High Priority

4. **Delete `supportsBindingPlacement()` and `BINDING_PLACEMENT`** if not going to be used, or wire them into the binding validation pipeline (they should reject bindings placed on wrong targets).
5. **Narrow `ProtocolConfigData` discriminated union in `document-builder.ts`** — the whole point of a discriminated union is type-safe access. Currently it's accessed as a bag of optional fields.
6. **Replace `type as { name: string }` casts** with proper TypeSpec type narrowing (`if (type.kind === "Operation")` etc.).
7. **Fix `intrinsicToSchema` format inconsistency** — `uint*` and `safeint` should have `format` like `int*` does, or document why they're intentionally omitted.
8. **Map `OperationTypeData.type` to `OperationAction`** via a named function instead of inline ternary.
9. **Remove dead fields** from state types: `CorrelationIdData.property`, `OperationTypeData.tags`, `OperationTypeData.description`.
10. **Align `TagData` with `Tag[]`** — same shape, two definitions.

### Medium Priority

11. **Add unit tests for the new `ref()` / `refSchema()` / `refMessage()` / `refChannel()` helpers** — especially RFC 6901 escaping behavior.
12. **Add unit tests for `getValidVersionsString()`** — newly extracted function with no direct test coverage.
13. **Consider branded types** for protocol-unsafe strings (channel keys, message names, schema names).
14. **Consolidate `ServerConfigData` / `ServerConfigEntry`** — two types for the same concept.
15. **Add AsyncAPI JSON Schema validation test for OAuth2 documents** to catch the `scopes` vs `availableScopes` gap.

---

## f) Up to 50 Things to Get Done Next

### Spec Compliance (CRITICAL)

1. Add runtime transformation `scopes` -> `availableScopes` in security scheme processing
2. Fix `SecurityScheme.in` type: remove `"user" | "password"`, keep only `"query" | "header" | "cookie"`
3. Add `SecurityScheme.ils` field if needed by spec (OpenID Connect)
4. Verify `ServerObject` has all AsyncAPI 3.1 fields (e.g., `security` is now correct, but check `bindings` schema)
5. Add `defaultContentType` to document root (type exists but never populated from decorator state)
6. Verify `MessageObject` has all spec fields (e.g., `schemaFormat` is missing)
7. Add `externalDocs` support to operations, messages, and tags
8. Verify `ChannelObject.parameters` type matches spec (should have `location` field)

### Dead Code Elimination

9. Delete or wire `src/domain/models/bindings.ts` (177 lines, 0 imports)
10. Delete or wire `supportsBindingPlacement()` and `BINDING_PLACEMENT`
11. Remove `CorrelationIdData.property` (never read)
12. Remove `OperationTypeData.tags` (never read; tags come from separate state map)
13. Remove `OperationTypeData.description` (never emitted)
14. Consolidate `TagData` = `Tag[]` (duplicate definitions)
15. Check if `messageSchemas` state symbol is used (declared in lib.ts but may be dead)

### Type Safety Improvements

16. Replace all `type as { name: string }` casts with proper TypeSpec narrowing
17. Narrow `ProtocolConfigData` union in document-builder via switch on `data.protocol`
18. Map `OperationTypeData.type` to `OperationAction` via named function (eliminate inline ternary)
19. Remove `[key: string]: unknown` from `ProtocolBindings` and use the typed binding maps from `bindings.ts`
20. Add branded types for `ChannelKey`, `MessageName`, `SchemaName`
21. Type `intrinsicToSchema()` to return specific schema shapes, not generic `SchemaObject`
22. Fix `intrinsicToSchema` format inconsistency for unsigned integers
23. Make `ServerConfigData` and the ad-hoc `ServerConfigEntry` in state-writers.ts the same type
24. Type the decorator config parameters properly instead of `unknown` (use model expression types from TypeSpec)
25. Add `satisfies` checks to runtime objects to catch type drift early

### Validation Hardening

26. Wire `BINDING_PLACEMENT` into binding validation to reject misplaced bindings
27. Add AsyncAPI JSON Schema validation test for OAuth2 flows specifically
28. Add test that `scopes` input from `@security` produces `availableScopes` in output
29. Validate `SecurityScheme` fields per scheme type (e.g., `apiKey` requires `name` + `in`)
30. Add test that binding versions emitted match the constants in `binding-versions.ts`
31. Validate operation messages reference existing channels

### Architecture / Module Boundaries

32. Export domain model types from `index.ts` (currently not exported for consumers)
33. Consider whether `binding-versions.ts` and `protocols.ts` should be merged into one `constants/` module
34. Move `extractConfigRecord` and `modelToRecord` closer to where they're used (decorator-helpers is a grab bag)
35. Consider a `ref-builder.ts` module instead of putting `ref()` functions in the domain model
36. Split `state.ts` into `state-types.ts` (types) and `state-consolidation.ts` (functions)
37. Move `inferActionFromName` and `getReturnModelName` to a `naming.ts` utility module

### Testing

38. Add unit tests for `ref()`, `refSchema()`, `refMessage()`, `refChannel()`, `escapeRefToken()`
39. Add unit tests for `getValidVersionsString()`
40. Add unit tests for `normalizeBindingKey()`
41. Add property-based test for RFC 6901 escaping (all `/` and `~` combinations)
42. Add test for `SecurityRequirement` shape in emitted output
43. Add test for `OperationAction` type correctness in emitted output
44. Add snapshot test for the `console.error` in `generateSchemas` catch block (should not fire on valid input)

### Documentation

45. Update AGENTS.md with `SecurityRequirement` type info
46. Update AGENTS.md with `OperationAction` type info
47. Update AGENTS.md with `ref()` helper functions info
48. Document that `bindings.ts` is either documentation-only or should be wired in
49. Document the `scopes` -> `availableScopes` transformation gap
50. Add ADR for the domain model type system strategy (when to add index signatures, when to use branded types)

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
