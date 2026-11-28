# Status Report: Session 2 — Bug Fixes, Type Safety & CI Hardening
> **Live remainder:** none — every item resolved in the 2026-11-19/20 corpus sweep (verdicts inline; routed work lives in TODO_LIST.md / ROADMAP.md).

**Date:** 2026-07-14 18:37\
**Branch:** `master` (pushed to `origin/master`)\
**Commits this session:** 11 (`953d106` → `9a8bc97`)\
**Starting state:** 294 tests, all 18 prior tasks done\
**Ending state:** 301 tests, 0 errors, 0 warnings, 95.1% avg coverage

---

## A. FULLY DONE (9/9 tasks completed)

### Task 1: Commit status report

- `docs/status/archived/2026-07-14_17-46_TYPESPEC-1.13-ALIGNMENT-QUALITY-OVERHAUL-COMPLETION.md` committed.
- Commit: `953d106`

### Task 2: Fix `minimal-decorators.ts` line count (376 → 321)

- Extracted `src/decorator-helpers.ts` (68 lines): `reportDecoratorDiagnostic`, `validateConfig`, `getModelPropertyStringValue`, `getModelPropertyValue`, `modelToRecord`, `extractConfigRecord`.
- `minimal-decorators.ts` now 321 lines — under the 370-line constraint.
- Commit: `62c0705`

### Task 3: Fix channel-slash `$ref` bug (RFC 6901)

- **Root cause:** Channel addresses like `orders/events` produced `$ref` values `#/channels/orders/events` that JSON pointer resolvers interpreted as `channels.orders.events` (nested path).
- **Fix:** Added `escapeRefToken()` function that replaces `~` → `~0` and `/` → `~1` in all `$ref` URI tokens. Object keys in the document stay raw.
- Updated 3 `$ref` construction sites in `document-builder.ts`.
- Converted the "KNOWN ISSUE" test from a failing assertion (`resolveByJsonPointer(ref)).toBeNull()`) to a passing one (`.toBe(spec.channels["orders/events"])`).
- Updated flat-channel test's resolver to handle `~1`/`~0` unescaping.
- Commit: `696df8a`

### Task 4: Fix `compileAsyncAPI` diagnostic pipeline

- **Root cause:** `tester.compile()` internally calls `expectDiagnosticEmpty()` which throws `AssertionError` (no `.diagnostics` property). The catch block checked `e?.diagnostics` — always `undefined` on `AssertionError` — silently swallowing ALL decorator diagnostics.
- **Fix:** Switched from `tester.compile()` to `tester.compileAndDiagnose()` which returns `[result, diagnostics]` tuple without throwing.
- Simplified `compileRaw()` from 35 lines of duplicated two-pass logic to a 12-line delegate of the now-fixed `compileAsyncAPI`.
- Commit: `f89c04e`

### Task 5: Fix 62 false-green security tests

- **Problem:** 62 of 81 security tests only asserted `spec.asyncapi === "3.0.0"` without verifying the security scheme was actually emitted. If the `@security` decorator silently dropped the config, the test still passed.
- **Fix:** Automated script added 4 assertions per affected test: `securitySchemes` defined, `securitySchemes[schemeName]` defined, `.type` matches expected value.
- **Result:** 81 security tests now have real assertions. `expect()` calls across the suite: 1082 → 1268 (+186 new assertions from same 294 tests; +7 from new state-compat tests = 1275 total).
- Commit: `99036c6`

### Task 6: Consolidate `test-helpers.ts` (607 → 437 lines)

- Removed 7 unused exports: `compileAsyncAPISpecWithResult`, `compileTypeSpecWithDecorators`, `validateAsyncAPIStructure`, `AsyncAPIChannel`, `AsyncAPIOperation`, `AsyncAPIMessage`, `AsyncAPISchema`.
- Deleted 2 duplicate extraction helper functions (`extractAsyncAPIFromResult`, `extractAsyncAPIFromFs`).
- Simplified `createAsyncAPITestHost` internals to delegate to `compileAsyncAPI` instead of duplicating tester setup.
- Commit: `d5eb6e8`

### Task 7: Type remaining `Record<string, unknown>` escape hatches

- Added `OAuth2Flow` type: `{ authorizationUrl?, tokenUrl?, refreshUrl?, scopes }`.
- Added `OAuth2Flows` type: `{ implicit?, password?, clientCredentials?, authorizationCode? }`.
- Added `ProtocolBindings` type: `Record<string, Record<string, unknown>>`.
- Narrowed `SecurityScheme.in` from `string` to `"query" | "header" | "cookie"`.
- Changed `SecurityScheme.flows` from `Record<string, unknown>` to `OAuth2Flows`.
- Updated all 4 `bindings?` fields to `ProtocolBindings` in `ServerObject`, `ChannelObject`, `OperationObject`, `MessageObject`.
- Updated `state.ts` and `state-writers.ts` to import and use `ProtocolBindings`.
- **Remaining `Record<string, unknown>` (19 instances):** All at the TypeSpec AST boundary (`extractConfigRecord`, `modelToRecord`, config parsing in decorators, `ProtocolConfigData.binding`) — these are inherently untyped because TypeSpec AST nodes are dynamically shaped. The domain model (output boundary) is now fully typed.
- Commit: `1c6e320`

### Task 8: Rewrite `comprehensive-protocols` example (890 → 155 lines, 122 → 0 errors)

- Rewrote from scratch using correct API: `#{}` value literals, block namespaces, proper decorator targets.
- Replaced `package.json` (interfered with module resolution) with `tspconfig.yaml`.
- Removed CI exclusion — now smoke-tested in CI with all other examples.
- All 5 protocols demonstrated: Kafka, WebSocket, MQTT, AMQP, HTTP.
- Commit: `dcb0318`

### Task 9: Add coverage threshold enforcement to CI

- Created `scripts/coverage-gate.ts`: parses `lcov.info`, enforces 75% per-file minimum for source files.
- Added 7 unit tests for `state-compatibility.ts` error paths (100% source coverage).
- CI `Coverage` step now runs: build → test with lcov → coverage gate.
- Added `test:coverage:gate` script to `package.json`.
- Current: 19 source files, 95.1% average line coverage, 75% minimum per file.
- Commit: `52d5166`

### Documentation updates

- `AGENTS.md`: Updated test count (294→301), added coverage gate docs, documented unified diagnostic pipeline, documented RFC 6901 `$ref` escaping, added `decorator-helpers.ts` to architecture.
- Commit: `9a8bc97`

---

## B. PARTIALLY DONE

### Coverage gaps remain

- `schema-emitter.ts` at ~76% line coverage — below 80% but above the 75% gate. Uncovered lines are TypeEmitter framework callbacks for edge cases: `modelLiteral`, `modelProperties`, `tuple`, `arrayDeclaration`, `arrayLiteral`, `enumDeclaration`, `scalarInstantiation` with name, `interfaceDeclaration`. These need test sources that exercise those TypeSpec constructs.
- `minimal-decorators.ts` at ~83% — uncovered lines are validation error paths in `$server`, `$message`, `$protocol`, `$security` decorators (diagnostic emission when config is missing/invalid).

### Type safety at boundaries

- `SchemaObject` still has `[key: string]: unknown` index signature at `asyncapi-document.ts:111`. This is **intentional** — JSON Schema is extensible by design and `$ref`, `format`, `pattern`, `minimum`, `maximum` etc. all flow through this. Removing it would require enumerating all JSON Schema keywords.
- 19 `Record<string, unknown>` instances remain in source, but all are at the TypeSpec AST boundary (parsing decorator arguments from dynamically-shaped TypeSpec AST nodes). The domain model (output types) is fully typed.

### `test-helpers.ts` consolidation

- Reduced from 607 to 437 lines (28% reduction) but the target was ~200 lines. The remaining size is mostly `TestSources` (6 pre-built TypeSpec source strings, 90 lines), `AsyncAPIAssertions` (28 lines), `TestValidationPatterns` (13 lines), `TestLogging` (7 lines no-op stubs), and `validateAsyncAPIObjectComprehensive` (30 lines). These could be moved to separate files but it's low-value busywork.

---

## C. NOT STARTED

~~1. **`test/temp-output/` cleanup** — ~90+ empty temp directories from test runs, never cleaned up, tracked by git.~~ done — git tracks nothing under test/temp-output and .gitignore lists test/temp-output/
~~2. **`test/acceptance/` directory** — empty, no tests.~~ done — directory removed — no test/acceptance in the tree
~~3. **`test/core/` directory** — no test files, only `unified-test-infrastructure.ts`.~~ done — directory removed — no test/core in the tree
~~4. **Split `ProtocolConfigData` into discriminated union** — currently a flat struct with optional fields for Kafka/MQTT/WS/AMQP. Should be `{ protocol: "kafka", ...kafkaFields } | { protocol: "mqtt", ...mqttFields } | ...`.~~ done — discriminated union lives in src/state.ts (Kafka / WebSocket / Mqtt / Generic variants)
~~5. **Remove `test/utils/type-guards.ts`** — 348 lines, 27% coverage, mostly dead code.~~ done — repurposed as the assertion-helper module (inlineObject, asJsonSchema, assert* — AGENTS.md Test Helpers)
~~6. **README.md badge for coverage** — coverage gate exists but no badge in README.~~ **Won't implement — no shields coverage badge; the README status table carries the 98.0% metric row instead.**

---

## D. TOTALLY FUCKED UP (Nothing this session)

No regressions, no broken commits, no data loss. Everything was committed incrementally with tests passing at every step.

**Near-miss:** The coverage gate script initially had a `.ts` vs `.js` dedup bug that caused it to track 0 files and trivially "pass". Caught and fixed before committing.

**Near-miss:** The `comprehensive-protocols` example initially used multiple blockless namespaces (TypeSpec only allows one per file). Fixed by switching to block namespaces.

---

## E. WHAT WE SHOULD IMPROVE

### Architecture

~~1. **`ProtocolConfigData` is a god type** — It has Kafka, MQTT, WebSocket, and AMQP fields all in one interface with optionals. Should be a discriminated union on `protocol`.~~ done — discriminated union in src/state.ts
~~2. **`test-helpers.ts` is still 437 lines** — `TestSources`, `TestValidationPatterns`, `TestLogging`, `validateAsyncAPIObjectComprehensive` should each be in separate files or deleted if unused.~~ **Won't implement — test-helpers.ts grew with functionality (529 lines); current API documented in AGENTS.md Test Helpers.**
~~3. **`schema-emitter.ts` `typeToSchema` is a 40-line `if/else` chain** — Could use the same const-array/lookup pattern as `intrinsic-mapping.ts`.~~ **NOT-DO — typeToSchema survives as a delegation method; intrinsic mapping is the table-driven piece (src/intrinsic-mapping.ts).**
~~4. **`propertyToSchema` duplicates `typeToSchema` logic** — Both do kind-checking and delegation. Consolidate.~~ done — both route through the shared refOrFallback path (src/schema-emitter.ts propertyToSchema / typeToSchema)
~~5. **Decorator config extraction is copy-paste** — `$message`, `$protocol`, `$security` each repeat the same `Model → Record` vs `object → Record` branching. Should be a shared `extractDecoratorConfig()` helper.~~ done — namedConfigDecorator + makeUseDecorator factories own config extraction (AGENTS.md Decorator Implementations)

### Testing

~~6. **`schema-emitter.ts` has ~24% uncovered lines** — Needs tests with enums, tuples, array declarations, scalar instantiations, interface declarations.~~ done — test/compliance/type-mapping-completeness.test.ts covers enums, tuples, arrays (42 cases)
~~7. **`minimal-decorators.ts` error paths mostly untested** — 17 uncovered lines are all diagnostic emission paths. Need negative tests passing invalid configs.~~ done — test/integration/decorator-negative.test.ts + negative-tests.test.ts cover error paths
~~8. **No snapshot/golden tests for protocol bindings output** — We test that bindings are attached but don't verify the exact binding structure in the output.~~ done — test/golden/protocol-bindings.expected.yaml locks binding output
~~9. **`test/utils/type-guards.ts` (348 lines, 27% coverage)** — Massive file mostly dead code. Should be deleted or drastically slimmed.~~ done — kept and repurposed — assertion helpers per AGENTS.md Test Helpers, not dead code
~~10. **`test/integration/` has 14 test files** — Some may overlap. An audit for test redundancy would help.~~ **Won't implement — integration suite grew to 30 files; no redundancy audit recorded.**

### CI/CD

~~11. **No publish workflow** — No pnpm publish step in CI. Tags exist but no release automation.~~ done at `d03e157`
~~12. **No dependency audit** — `bun audit` or similar not in CI.~~ **Won't implement — no audit stage in ci.yml; advisory posture tracked via TODO_LIST §Hygiene (ignoreGhsas watch).**
~~13. **Coverage gate at 75% is generous** — Should ratchet to 80%+ after schema-emitter tests are added.~~ **Won't implement — gate kept at the 75% per-file floor (AGENTS.md); suite sits at ~98%.**

### Code Quality

~~14. **`[key: string]: unknown` on `SchemaObject`** — Intentional for JSON Schema extensibility, but could be replaced with specific keyword unions for the ones we actually emit.~~ **NOT-DO — intentional — AGENTS.md document-model bullet keeps the JsonSchema index signature as the standard extension pattern.**
~~15. **`any` in test-helpers** — `AsyncAPIObject = Record<string, any>` and several `any` casts remain. Test code can afford looser typing but it's a slippery slope.~~ **Won't implement — test typing deliberately relaxed (tsconfig.test.json, AGENTS.md).**
~~16. **`document-builder.ts` has 3 inline closures** — `getReturnModelName`, `extractChannelParameters`, `ensureChannel` are defined inside `buildAsyncAPIDocument`. Could be module-level functions taking explicit parameters.~~ done — document-builder refactored into src/builders/* (module-level functions)
~~17. **`state.ts` imports unused `ProtocolBindings`** — After type refinement, the import may be only used in type position. (Need to verify.)~~ **NOT-DO — moot after the state + builders restructure.**

---

## F. 50 Things To Get Done Next

### High Impact (P0)

~~1. Clean up `test/temp-output/` — ~90+ empty temp dirs tracked by git, should be gitignored and deleted~~ done — git tracks nothing under test/temp-output; cleanup happened
~~2. Delete or slim `test/utils/type-guards.ts` (348 lines, 27% coverage)~~ done — kept — repurposed as assertion helpers (AGENTS.md Test Helpers)
~~3. Add `test/temp-output/` to `.gitignore`~~ done — test/temp-output listed in .gitignore
~~4. Add schema-emitter tests for enums, tuples, array declarations, scalar instantiations~~ done — test/compliance/type-mapping-completeness.test.ts (42 cases incl. enums, tuples, arrays)
~~5. Add decorator error-path tests (invalid configs for `$server`, `$message`, `$protocol`)~~ done — test/integration/decorator-negative.test.ts + negative-tests.test.ts
~~6. Ratchet coverage gate from 75% to 80% after adding schema-emitter tests~~ **Won't implement — gate stays at the 75% floor (AGENTS.md); coverage ~98%.**
~~7. Split `ProtocolConfigData` into discriminated union per protocol~~ done — discriminated union in src/state.ts
~~8. Add `bun audit` to CI~~ **Won't implement — no audit stage in ci.yml; advisories tracked in TODO_LIST §Hygiene.**
~~9. Extract `getReturnModelName`, `extractChannelParameters`, `ensureChannel` out of `buildAsyncAPIDocument` in document-builder.ts~~ done — builders extracted — src/builders/ (11 files) own channel and operation assembly

### Medium Impact (P1)

~~10. Consolidate `propertyToSchema` and `typeToSchema` in schema-emitter.ts~~ done — both route through shared refOrFallback + applyMetadata paths (src/schema-emitter.ts)
~~11. Create shared `extractDecoratorConfig()` helper for `$message`, `$protocol`, `$security`~~ done — namedConfigDecorator + makeUseDecorator factories (AGENTS.md Decorator Implementations)
~~12. Audit `test/integration/` for test redundancy (14 files)~~ **Won't implement — no redundancy audit; integration suite now 30 files.**
~~13. Add golden file test for protocol bindings output structure~~ done — test/golden/protocol-bindings.expected.yaml
~~14. Add golden file test for security scheme output (OAuth2 flows, API key, etc.)~~ done — test/golden/server-security.expected.yaml
~~15. Add `coverage` badge to README.md~~ **Won't implement — no badge; README status table row states 98.0% coverage.**
~~16. Verify and clean up unused `ProtocolBindings` import in `state.ts` if applicable~~ **NOT-DO — moot after the state restructure.**
~~17. Remove `TestLogging` no-op stubs (7 functions that do nothing)~~ **Won't implement — helper inventory churned; current API documented in AGENTS.md Test Helpers.**
~~18. Remove `TestValidationPatterns` if callers can use direct assertions instead~~ **Won't implement — helper inventory churned; current API documented in AGENTS.md Test Helpers.**
~~19. Move `TestSources` to a separate file or inline into tests that use them~~ **Won't implement — TestSources not split out; example sources live on in test-helpers + website/src/data/hero.ts.**
~~20. Empty `test/acceptance/` directory — either add tests or remove~~ done — test/acceptance removed from the tree
~~21. Add pnpm publish workflow triggered on tag push~~ done at `d03e157`
~~22. Add `real-world` examples to CI smoke test (currently only 5 of 8 examples tested)~~ done — ci.yml check-examples compiles all 14 examples with 0 diagnostics + AJV validation
~~23. Add test for `@protocol` decorator output verification~~ done — test/compliance/protocol-bindings.test.ts (23 cases)
~~24. Add test for `@bindings` decorator on channels vs operations vs messages~~ done — test/unit/binding-placement.test.ts + test/integration/binding-placement.test.ts
~~25. Add test for `@correlationId` in message output~~ done — correlationId covered in test/compliance/edge-cases.test.ts and reusable-components.test.ts

### Lower Impact (P2)

~~26. Replace `typeToSchema` if/else chain with lookup table pattern~~ **NOT-DO — typeToSchema survives as a delegation method; intrinsic mapping already table-driven (src/intrinsic-mapping.ts).**
~~27. Type `AsyncAPIObject` properly instead of `Record<string, any>` in test-helpers~~ **Won't implement — test typing deliberately relaxed (tsconfig.test.json, AGENTS.md).**
~~28. Add `.editorconfig` for consistent editor settings~~ **Won't implement — never added; formatting owned by treefmt/prettier (flake.nix).**
~~29. Add `CONTRIBUTING.md` with development setup instructions~~ done — CONTRIBUTING.md exists (106 lines)
~~30. Add `CHANGELOG.md` entry for this session's changes~~ done — CHANGELOG [0.1.0-alpha] 2026-07-14 section records the session
~~31. Add test for multiple `@server` decorators on one namespace~~ done — servers + multi-server covered in test/compliance/servers-security.test.ts
~~32. Add test for `@header` on ModelProperty~~ done — test/compliance/edge-cases.test.ts covers @header
~~33. Add test for nested model `$ref` in array items~~ done — test/compliance/ref-chain.test.ts
~~34. Add test for `@tags` with non-string values (should produce diagnostic)~~ done — invalid-config diagnostics covered in test/integration/decorator-negative.test.ts
~~35. Add test for `@security` on Namespace vs Operation~~ done — namespace and operation security covered in test/compliance/servers-security.test.ts
~~36. Add test for empty namespace (no operations, no channels)~~ done — empty-namespace case in test/integration/negative-tests.test.ts
~~37. Add test for model inheritance (`model B extends A`) in schema output~~ done — inheritance covered (test/compliance/model-composition.test.ts + polymorphism golden)
~~38. Add test for `is` expression (`model Foo is Bar`) in schema output~~ done — is expressions covered in test/compliance/model-composition.test.ts
~~39. Add test for template spread (`model Foo { ...Base }`) — ref-chain test has this but no schema verification~~ done — test/integration/template-spread-patterns.test.ts
~~40. Add test for union types with mixed string/scalar variants~~ done — union variants covered in test/compliance/type-mapping-completeness.test.ts
~~41. Add test for optional model properties (should NOT appear in `required` array)~~ done — exact assertion present — test/compliance/model-composition.test.ts (required does not contain optional)
~~42. Add test for `@doc` decorator appearing as `description` in schema~~ done — test/compliance/doc-propagation.test.ts
~~43. Add test for deeply nested model (3+ levels of `$ref`)~~ done — test/e2e/complex-nested-schemas.test.ts
~~44. Consider adding JSON Schema validation for ALL generated schemas (not just top-level)~~ done — compliance suite AJV-validates every document via compileAndValidateOrThrow (AGENTS.md)
~~45. Consider adding AsyncAPI Studio preview link in example READMEs~~ **Won't implement — no Studio preview links in examples/README.md.**
~~46. Consider adding a `justfile` or `flake.nix` target for `tsp compile` of all examples~~ **Won't implement — no flake or just target for compiling examples; pnpm run check-examples owns it.**
~~47. Consider adding semantic versioning check in CI (e.g., release-please)~~ **Won't implement — no semver automation; annotated v* tags + release.yml.**
~~48. Consider adding PR template~~ **Won't implement — no PR template in .github/.**
~~49. Consider adding issue templates~~ **Won't implement — no issue templates in .github/.**
~~50. Consider renaming `minimal-decorators.ts` to just `decorators.ts` since it's no longer minimal~~ **Won't implement — minimal-decorators.ts kept (388 lines) alongside the src/decorators.ts registry.**

---

## G. Top 2 Questions

### Q1: Should `ProtocolConfigData` be a discriminated union or is the flat struct acceptable?

Currently `ProtocolConfigData` has fields for all protocols mixed together:

```typescript
type ProtocolConfigData = {
  protocol: string;
  binding?: Record<string, unknown>;
  partitions?: number;      // Kafka
  replicationFactor?: number; // Kafka
  consumerGroup?: string;    // Kafka
  sasl?: {...};              // Kafka
  subprotocol?: string;      // WebSocket
  queryParams?: Record<...>; // WebSocket
  headers?: Record<...>;     // WebSocket
  qos?: 0 | 1 | 2;          // MQTT
  retain?: boolean;          // MQTT
  lastWill?: {...};          // MQTT
  version?: string;          // Generic
};
```

A discriminated union would be type-safer but requires refactoring all consumers (`storeProtocolConfig`, `document-builder.ts` channel bindings section). **Is this worth doing now, or should it wait until we have more protocol-specific tests to guide the split?**

### Q2: Should we publish to pnpm as `@lars-artmann/typespec-asyncapi` or use a different scope?

The package name is hardcoded throughout (`package.json`, `lib/main.tsp`, CI, tests, examples). There's no publish workflow yet. **What's the intended pnpm package name and scope for public release?** This affects the `tspconfig.yaml` emitter name, the `import` paths in examples, and the decorator namespace in `lib/main.tsp`.
