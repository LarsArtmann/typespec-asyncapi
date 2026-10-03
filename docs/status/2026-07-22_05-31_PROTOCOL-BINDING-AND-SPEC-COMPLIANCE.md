# Status Report: Protocol Binding Support & Spec Compliance Suite

**Date:** 2026-07-22 05:31
**Session scope:** Implement full protocol binding support (Kafka, AMQP, MQTT, WebSocket, HTTP) + AsyncAPI 3.1 specification test suite compliance + docs-health audit

> **Update 2026-07-22:** The 5 uncommitted doc files were committed in `83e3917` and `fa6857d`. Test count grew from 504 to **510**. `@service` compatibility (section c) was resolved — `listServices()` integration shipped in commit `28bed42`. The `getValidVersionsString()` duplication (section e, item 3) was fixed — now imports from `binding-versions.ts`. Still open: dead coverage devDeps, `engines.node` bump, binding placement enforcement, GitHub #229/#160. Item-by-item status in [Resolution](#resolution-2026-07-22) below.

---

## a) FULLY DONE

### Source Code (committed in `60b526c`)

| File                                  | Lines  | What                                                                                                                                                                                                  |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/constants/binding-versions.ts`   | 99     | Latest binding version per protocol (Kafka 0.5.0, AMQP 0.3.0, MQTT 0.2.0, HTTP 0.3.0, WS 0.1.0). `normalizeBindingProtocol()` maps `wss`→`ws` for binding keys. Version validation, placement matrix. |
| `src/domain/models/bindings.ts`       | 177    | Typed TypeScript interfaces for ALL protocol bindings: Kafka channel/operation/message, AMQP channel/operation/message, MQTT server/operation/message, HTTP operation/message, WebSocket channel.     |
| `src/validation/binding-validator.ts` | 127    | `processBindings()` — normalizes binding keys (`websockets`→`ws`), validates versions, auto-injects `bindingVersion` when missing. Returns issues list for diagnostic reporting.                      |
| `src/lib.ts`                          | +12    | 2 new warning diagnostics: `unknown-binding-protocol`, `invalid-binding-version`. Now 17 total codes (15 error + 2 warning).                                                                          |
| `src/minimal-decorators.ts`           | +17/-7 | Wired `processBindings()` into `$bindings` decorator. Removed unused `ProtocolBindings` type import.                                                                                                  |
| `src/document-builder.ts`             | +19/-8 | `@protocol`-generated channel bindings now auto-inject `bindingVersion` and use `normalizeBindingProtocol()` for binding keys.                                                                        |
| `src/state-writers.ts`                | +11/-3 | Fixed `storeSecurityConfig` overwrite bug: changed to array accumulation so multiple `@security` decorators on one namespace work correctly.                                                          |
| `src/state.ts`                        | +2/-2  | `securityConfigs` type changed from `Map<Type, SecurityConfigData>` to `Map<Type, SecurityConfigData[]>`. Uses `getMultiState` now.                                                                   |

### Test Suite (committed in `60b526c`)

| File                                         | Tests  | What                                                                                                                                                                                                                                    |
| -------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test/utils/schema-validator.ts`             | —      | Reusable AJV harness: `compileAndValidate()`, `compileAndValidateOrThrow()`, `formatValidationErrors()`. Validates emitter output against official AsyncAPI 3.1.0 JSON Schema.                                                          |
| `test/compliance/document-structure.test.ts` | 11     | asyncapi version, info object, channels map, channel address, message $ref, operation action/channel, components structure, action inference (send/receive), multi-channel.                                                             |
| `test/compliance/schema-types.test.ts`       | 15     | string, boolean, int32, int64, float32, float64, decimal, bytes, utcDateTime, url, arrays, enum unions, optional/required, nested model $ref, array-of-named-models.                                                                    |
| `test/compliance/ref-chain.test.ts`          | 9      | operation→channel→components chain, channel→components/messages, message→schemas, nested model $ref, array items $ref, slash escaping (~1), multi-operation independence, all-$ref-valid validation.                                    |
| `test/compliance/servers-security.test.ts`   | 11     | server host/protocol, websocket→ws normalization, multi-server, server variables, userPassword/apiKey/http/scramSha256/oauth2/X509 security schemes, multi-security accumulation.                                                       |
| `test/compliance/protocol-bindings.test.ts`  | 18     | Kafka channel/operation/message bindings, AMQP operation/message, MQTT operation/server, WebSocket channel + wss normalization + alias normalization, HTTP operation/message, multi-protocol docs, auto-version injection per protocol. |
| `test/compliance/edge-cases.test.ts`         | 14     | empty models, dotted channels, slash channels, {param} channels, deeply nested refs, union enums, optional fields, multi-op same channel, server-only docs, @doc descriptions, tags, correlationId, headers, float64 arrays.            |
| **Total new tests**                          | **78** | All validated against official AsyncAPI 3.1.0 JSON Schema via AJV.                                                                                                                                                                      |

### Documentation (uncommitted, 5 files)

| File           | What                                                                                                                                                              |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TODO_LIST.md` | Stripped all 19 completed `[x]` items (trophy case). Now contains 3 genuinely open tasks.                                                                         |
| `CHANGELOG.md` | `[Unreleased]` section captures all session work under Added/Changed/Fixed/Removed. Merged corrupted old content.                                                 |
| `FEATURES.md`  | Updated date, test count (504), added Protocol Bindings section (6 protocols), Binding Validation section, multi-security, external spec tests, compliance suite. |
| `ROADMAP.md`   | Moved `@service` diagnostic to TODO_LIST (not duplicated). Updated test count to 504.                                                                             |
| `README.md`    | Fixed `bun test`→`bun run test`, badge to 504, added protocol support table.                                                                                      |

### Quality Gates

- **Build:** 0 TypeScript errors (strict mode)
- **Lint:** 0 errors, 0 warnings
- **Tests:** 504 pass, 0 fail, 0 skip, 0 todo (was 426)
- **Test files:** 45 (was 39) — 6 new compliance files + 1 schema-validator harness
- **All 78 compliance tests validated against official AsyncAPI 3.1.0 JSON Schema**

---

## b) PARTIALLY DONE

### Binding Placement Validation

The `BINDING_PLACEMENT` matrix in `binding-versions.ts` defines which binding types are valid per protocol per object kind (channel/operation/message/server). However, this matrix is **not enforced at runtime**. The `$bindings` decorator accepts any binding on any target — a user can put a Kafka channel binding on a message, and it will pass through. The schema validation tests catch this downstream, but no diagnostic warns at decorator time.

### Binding Field-Level Validation

Binding objects are validated structurally (key normalization, version injection) but NOT field-level. A Kafka operation binding with `topic: "foo"` (topic is a channel binding field, not operation) will pass through silently. The AsyncAPI JSON Schema catches it in tests, but the emitter produces no diagnostic.

### Coverage Measurement

ROADMAP claims "95% coverage" — this was the number from the previous session using `bun test --coverage`. It has **not been re-measured** this session. The 3 dead coverage devDeps (`@vitest/coverage-v8`, `@vitest/coverage-istanbul`, `c8`) are still installed and non-functional.

---

## c) NOT STARTED

- `@service` decorator diagnostic (TODO_LIST P0)
- Dead coverage devDeps removal (TODO_LIST P0)
- `engines.node` bump from `>=20.0.0` to `>=20.11` (TODO_LIST P1 — `import.meta.dirname` requires 20.11+)
- Commit the 5 uncommitted doc-health files
- GitHub issue management (#229 URL validation, #160 Bun test patterns)

---

## d) TOTALLY FUCKED UP

### CHANGELOG Corruption

My first CHANGELOG edit created a structurally broken `[Unreleased]` section — the old `[Unreleased]` content was orphaned after my new content, creating duplicate `### Added`, `### Fixed`, `### Changed` headers and a stray `### Spec-compliant $ref chain` header that was neither Added nor Fixed. Fixed in a second edit, but it took two passes to get right. **Root cause:** I did a find-and-replace on a sub-section without reading the full surrounding context first.

### TypeSpec `enum` Keyword in Test Fixtures

Three Kafka binding tests used `enum: #["value"]` inside TypeSpec value literals (`#{}`). `enum` is a reserved keyword in TypeSpec — it's a type declaration keyword, not usable as a property name. The compiler threw `token-expected` errors. Fixed by removing the `enum` fields and using plain `#{ type: "string" }` instead. **Should have known:** the AGENTS.md Gotchas section explicitly documents that TypeSpec value literals can't use reserved keywords.

### WSS Binding Key

Initially used `normalizeProtocol()` for binding keys, which maps `websocket`→`ws` but leaves `wss` as `wss`. The AsyncAPI 3.1 binding schema only accepts `ws` as a binding key (not `wss`). Created `normalizeBindingProtocol()` to map `wss`→`ws` for binding keys specifically. **Should have checked the schema first** instead of discovering it through a test failure.

### Security Test: `apiKey` vs `httpApiKey`

Wrote a compliance test using `type: "apiKey"` with `in: "header"` and `name: "X-API-Key"`. The AsyncAPI 3.1 schema rejects this — `apiKey` type doesn't accept `in`/`name` properties. The correct type is `httpApiKey`. **Should have known:** the AGENTS.md Gotchas section documents this exact distinction.

### Security Test: OAuth2 `availableScopes`

First OAuth2 test used `scopes` — AsyncAPI 3.1 uses `availableScopes`. Then the fix used quoted keys `"read": "read access"` in a TypeSpec value literal, which TypeSpec doesn't support (only identifier-compatible keys). **Two errors in the same test.** Fixed with `readAccess: "read access"`.

---

## e) WHAT WE SHOULD IMPROVE

### Architectural

1. **Binding placement enforcement:** `BINDING_PLACEMENT` exists but is dead code. Wire it into `processBindings()` to warn when a binding is placed on the wrong target kind (e.g., Kafka server binding on a message).

2. **Binding field validation:** Consider validating binding fields against the official `@asyncapi/specs/bindings/` JSON Schemas at decorator time, not just at test time. This would catch `topic` on an operation binding before the user runs the emitter.

3. **`processBindings()` has a local `getValidVersionsString()` that duplicates `VALID_BINDING_VERSIONS`:** The function in `binding-validator.ts:108-117` hardcodes the same data that `VALID_BINDING_VERSIONS` in `binding-versions.ts` already provides. Should import from the single source.

4. **`storeSecurityConfig` uses `getStateMap` not `getMultiState`:** I changed the type to `SecurityConfigData[]` and the consolidation to `getMultiState`, but `storeSecurityConfig` itself still uses `getStateMap` and manually accumulates. This works but is inconsistent with how `storeServerConfig` works (which also manually accumulates on `getStateMap`). Consider a proper `getMultiState` pattern.

### Process

5. **I should have read the AsyncAPI binding schemas BEFORE writing tests.** I wrote tests from intuition, then fixed them one by one as schema validation failed. Reading the schemas first would have saved 4-5 iterations.

6. **The CHANGELOG corruption would not have happened if I had read the full `[Unreleased]` section before editing.** I did a targeted find-and-replace that merged with content I hadn't seen.

7. **Docs-health should have been applied FIRST, before writing TODO_LIST as a trophy case.** I wrote a TODO_LIST with 19 `[x]` items, then had to rewrite it. The skill explicitly says "Delete done items."

### Coverage

8. **Three dead coverage devDeps still installed.** `@vitest/coverage-v8`, `@vitest/coverage-istanbul`, `c8` — none work because TypeSpec loads emitter from `dist/*.js` as opaque modules. Either remove them or find a working coverage approach.

9. **Coverage claim in ROADMAP is stale.** "95% coverage" hasn't been verified this session.

---

## f) Up to 50 Things to Get Done Next

### P0 — Correctness

1. Commit the 5 uncommitted doc-health files (CHANGELOG, FEATURES, README, ROADMAP, TODO_LIST)
2. Fix `@service` decorator: register as no-op or emit diagnostic for OpenAPI migrants
3. Remove dead coverage devDeps from package.json
4. Bump `engines.node` from `>=20.0.0` to `>=20.11` (for `import.meta.dirname`)
5. Re-measure coverage and update ROADMAP claim (or remove the number)
6. Wire `BINDING_PLACEMENT` matrix into `processBindings()` — warn on wrong placement
7. Fix `getValidVersionsString()` duplication in `binding-validator.ts`

### P1 — Type Safety & Validation

8. Validate binding fields against `@asyncapi/specs/bindings/` JSON Schemas at decorator time
9. Add `bindingVersion` version validation test for each protocol (0.5.0, 0.4.0, 0.3.0 for Kafka etc.)
10. Add test: Kafka channel binding rejected on message target (once placement enforcement exists)
11. Add test: AMQP operation binding fields (cc, bcc, replyTo, mandatory, ack)
12. Add test: MQTT server binding (clientId, cleanSession, lastWill, keepAlive)
13. Add test: MQTT messageExpiryInterval edge cases (0, max 4294967295)
14. Add test: WebSocket query/headers Schema object validation
15. Add test: HTTP statusCode in message bindings

### P2 — Spec Compliance Gaps

16. Add compliance test for `@message` decorator with contentType variants
17. Add compliance test for namespace-level `@doc` as API description
18. Add compliance test for `Record<string, Model>` additionalProperties with $ref
19. Add compliance test for `bytes` format (base64 vs byte)
20. Add compliance test for `duration` format
21. Add compliance test for `plainDate`/`plainTime` formats
22. Add compliance test for deeply nested unions (`"a" | "b" | Model`)
23. Add compliance test for model with `@doc` on individual properties
24. Add compliance test for multiple operations sharing the same message model
25. Add compliance test for server `protocolVersion` field
26. Add compliance test for server `pathname` field
27. Add compliance test for operation `reply` object
28. Add compliance test for `defaultContentType` on document
29. Add compliance test for components `parameters` reuse
30. Add compliance test for channel `servers` reference list

### P3 — Developer Experience

31. Add `engines.node` warning in README prerequisites
32. Document binding version matrix in README (which protocol supports which version)
33. Create examples for each protocol binding (Kafka, AMQP, MQTT, WS, HTTP)
34. Add error message improvement: when `@bindings` receives invalid protocol key, suggest closest match
35. Add AJV format keywords (`uri`, `date-time`, etc.) to silence "unknown format ignored" warnings in test output

### P4 — Infrastructure

36. Close GitHub #229 (URL validation) with comment about pragmatic approach
37. Close GitHub #160 (Bun-compatible test patterns) — moot after vitest migration
38. Decide pnpm vs bun for package management
39. Set up vitest coverage working with TypeSpec (custom istanbul ignore patterns?)
40. Add CI step to run compliance tests separately from unit tests
41. Add CI step for AsyncAPI Studio compatibility check
42. Investigate vitest `isolate: false` — does it cause test pollution?

### P5 — Future Features

43. Multi-file TypeSpec input support (`import` across `.tsp` files)
44. AsyncAPI Studio compatibility verification
45. Performance profiling for large specifications (100+ channels)
46. Custom decorator validation framework
47. Integration with AsyncAPI generator ecosystem (code generation from emitter output)
48. OpenAPI 3.0/3.1 cross-emitter compatibility (share types between specs)
49. AsyncAPI 3.2 tracking (when released)
50. Plugin/hook system for custom binding extensions

---

## g) Questions (3)

### 1. Commit strategy for the 5 uncommitted doc files?

All source code and tests are committed in `60b526c` and `fa6857d`. The only uncommitted changes are the 5 doc-health fixes (CHANGELOG, FEATURES, README, ROADMAP, TODO_LIST). Should I:

- (a) Commit them now as `docs: apply docs-health audit — strip trophy case, fix stale claims`
- (b) Wait for your review first
- (c) Squash into the previous docs commit

### 2. Should I implement binding placement enforcement now?

`BINDING_PLACEMENT` is defined but not wired in. It would catch errors like putting a Kafka server binding on a message at decorator time (warning diagnostic). This is a ~30 min change (wire into `processBindings()`, add 5-6 tests). Should I do it now or leave it as a TODO?

### 3. Coverage approach — remove the claim or fix the tooling?

ROADMAP says "95% coverage" but coverage hasn't been measured this session. The 3 coverage devDeps don't work with vitest + TypeSpec's `dist/` loading pattern. Options:

- (a) Remove the "95%" claim from ROADMAP, say "coverage tracked manually via `bun test --coverage` on core dirs"
- (b) Invest time in making vitest coverage work (may require `nyc` instrumenting `src/` before `tsc` runs)
- (c) Delete the 3 dead devDeps and drop coverage tracking entirely for now

---

## Resolution (2026-07-22)

### Section (c) NOT STARTED items

| Item                             | Status | Evidence                                                         |
| -------------------------------- | ------ | ---------------------------------------------------------------- |
| `@service` decorator diagnostic  | DONE   | `listServices()` reads title for `info.title` (commit `28bed42`) |
| Dead coverage devDeps removal    | OPEN   | Still in `package.json`                                          |
| `engines.node` bump to `>=20.11` | OPEN   | Still `>=20.0.0`                                                 |
| Commit 5 doc-health files        | DONE   | Commits `83e3917`, `fa6857d`                                     |
| GitHub #229 closure              | OPEN   | Still open                                                       |
| GitHub #160 closure              | OPEN   | Still open                                                       |

### Section (e) architectural items

| #   | Item                                               | Status                                        |
| --- | -------------------------------------------------- | --------------------------------------------- |
| 1   | Binding placement enforcement                      | OPEN — `BINDING_PLACEMENT` still dead code    |
| 2   | Binding field-level validation                     | OPEN — structural validation only             |
| 3   | `getValidVersionsString()` duplication             | DONE — now imports from `binding-versions.ts` |
| 4   | `storeSecurityConfig` getStateMap vs getMultiState | OPEN — still uses manual accumulation         |

### Questions resolved

- **Q1 (commit strategy):** Docs committed separately in `83e3917` / `fa6857d`.
- **Q2 (binding placement enforcement):** Not done — left as TODO.
- **Q3 (coverage approach):** Not resolved — dead devDeps still installed, ROADMAP still claims 95%.
