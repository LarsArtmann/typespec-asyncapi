# Status Report: Real-World Repo Testing Against Real .tsp Definitions

**Date:** 2026-08-06 20:06
**Session Goal:** "Test this project AGAINST real world repos with proper .tsp definitions"
**Outcome:** Built comprehensive real-world test suite with 146 new tests across 10 fixture files (1,841 lines of real-world `.tsp` patterns) and 3 test files (662 lines). All 1205 project tests pass, lint clean. Found 6 fixture authoring issues and 4 real TypeSpec behavior gotchas documented.

---

## a) FULLY DONE

### 1. Research Phase — External `.tsp` Pattern Catalog

Scanned `/home/lars/projects/` for ALL external `.tsp` files. Found **200+ files across 15+ projects**: Kernovia (40+ files), typespec-eventsourcing (60+ files), blog/content-spec (15+ files), accountability-system, ActaFlow, superb-gh-milestone-extention, GoReleaser-Wizard, SwettySwipperWeb (30+ code-example files), BMAD-METHOD, uniflow, and more.

Read the 18 most complex files and cataloged every model/type pattern:

| Pattern Category                                   | Source Projects                    | Files Analyzed |
| -------------------------------------------------- | ---------------------------------- | -------------- |
| Multi-level scalar inheritance                     | Kernovia, eventsourcing, milestone | 5              |
| Generic models with constrained type params        | eventsourcing, ActaFlow            | 3              |
| Spread of generic with literal arg                 | eventsourcing                      | 2              |
| 3-level model inheritance chains                   | Kernovia, eventsourcing, blog      | 6              |
| Property override/narrowing                        | Kernovia, eventsourcing, blog      | 5              |
| Named unions (discriminated)                       | eventsourcing                      | 2              |
| Deeply nested anonymous objects (4-5 levels)       | blog, Kernovia                     | 4              |
| Arrays of inline anonymous objects                 | blog, Kernovia, accountability     | 3              |
| Enums with/without string values                   | accountability, milestone          | 3              |
| Record types (`Record<unknown>`, `Record<string>`) | All projects                       | 12             |
| Default values (including enum member defaults)    | Kernovia, eventsourcing, milestone | 6              |
| Numeric validation decorators                      | accountability, milestone          | 4              |
| `@format`, `@pattern` decorators                   | accountability, milestone          | 3              |

### 2. Real-World Fixture Files (10 files, 1,841 lines)

Created `test/realworld/fixtures/` with `.tsp` files that faithfully recreate REAL patterns from sibling projects, wrapped in AsyncAPI operations:

#### External Model Pattern Fixtures (6 files):

1. **`kernovia-branded-types.tsp`** (172 lines) — Multi-level scalar inheritance (`ActorId extends NanoID extends string`), branded types with `@pattern`, kebab-case enum values, default values, `Record<unknown>`, array-of-union-literals, nested inline objects, validation results
2. **`eventsourcing-generics.tsp`** (197 lines) — Generic models with constrained type params (`BrandedId<Brand extends string>`), spread of generic with string literal arg, phantom brand fields, named unions (`union CommandResult`), 3-level event hierarchy with `allOf`, command models
3. **`blog-campaign-nesting.tsp`** (179 lines) — Very deeply nested anonymous objects (4-5 levels), arrays of inline anonymous objects, array of named models, many string literal unions, `decimal` type, `Campaign extends AggregateRoot`
4. **`accountability-domain.tsp`** (232 lines) — Enums with AND without explicit string values, `@format("email")`, `@format("uuid")`, `@format("date-time")`, `@pattern` with regex, `@minLength`/`@maxLength`/`@maxItems`, boolean optional fields, root container with arrays of named types
5. **`milestone-analysis.tsp`** (230 lines) — Scalar extending numeric type (`CompletionPercentage extends uint8`), `@format("uuid")`, `@format("uri")`, uint8/uint32/uint64 types, `@minValue`/`@maxValue`, cross-file model references, enums without values
6. **`ecommerce-complete.tsp`** (283 lines) — Full e-commerce domain with 20+ cross-referenced models, decimal types, complex status enums, arrays of named types, nested address model, multiple domains (orders, payments, shipping, inventory, reviews)

#### Canonical AsyncAPI Spec Fixtures (4 files):

7. **`streetlights-mqtt.tsp`** (78 lines) — The canonical AsyncAPI example: MQTT pub/sub, parameterized channel addresses (`{streetlightId}`), bidirectional pub/sub, `@minValue`/`@maxValue` constraints, `@format("date-time")`, enum with explicit values, two servers
8. **`chat-websocket.tsp`** (121 lines) — Real-time WebSocket chat: bidirectional messaging, user presence, typing indicators, soft-delete messages, message reactions (nested array of named models), multiple channels
9. **`sensor-iot-multi-protocol.tsp`** (153 lines) — IoT telemetry with 3 protocols (Kafka, MQTT, WebSocket), 3 servers, sensor types, batch readings, device registration, real-time dashboards, multi-protocol operations
10. **`notifications-enterprise.tsp`** (196 lines) — Enterprise notification service: AMQP + HTTPS, multi-channel delivery (email/sms/push/webhook/slack/teams), notification templates, delivery tracking, retry policies with nested defaults, webhook configs

### 3. Test Suite (3 test files, 662 lines, 146 tests)

#### `test/realworld/external-model-patterns.test.ts` (164 lines, 61 tests)

- Auto-discovers all `.tsp` fixtures in `fixtures/` directory
- Per fixture: compiles through emitter, validates against official AsyncAPI 3.1.0 JSON Schema, checks $ref chains, operations, channels, schemas, contentType
- Every fixture validated: 0 error diagnostics, valid AsyncAPI output, valid $ref chains

#### `test/realworld/canonical-asyncapi-specs.test.ts` (276 lines, 47 tests)

- Per canonical spec: validates AsyncAPI 3.1.0 schema compliance, multi-server presence, bidirectional operations
- Streetlights-specific: MQTT protocol, parameterized channels, enum values, `@minValue`/`@maxValue` constraints, `@format` date-time
- Chat-specific: WSS protocol, default values for optional properties, `$ref` for nested named model arrays, enum for status
- Sensor IoT-specific: 3 different protocols, nested anonymous model for location, array of named model for batch readings, string literal union for quality
- Notifications-specific: AMQP + HTTPS, default values, nested retryPolicy with defaults, DeliveryStatus enum

#### `test/realworld/pattern-assertions.test.ts` (222 lines, 38 tests)

- **Scalar inheritance:** `ActorId extends NanoID extends string` → `type: "string"`
- **Generic spread:** `...BrandedId<"event">` → flattened with `value: string` property
- **Named union:** `union CommandResult { ... }` → separate schemas for each variant
- **3-Level inheritance:** `Campaign extends AggregateRoot` → `allOf` with `$ref`
- **Nested anonymous objects:** 4-5 level deep nesting renders correctly
- **Array of inline objects:** `optimalTimes: { platform: Uuid; times: string[] }[]` → array with `items.type: "object"`
- **Decimal type:** Correctly renders as `type: "string", format: "decimal"` (precision-preserving)
- **Enums with values:** `GoalStatus` → `enum: ["active", "paused", "completed", "abandoned"]`
- **Enums without values:** `GoalCategory` → implicit string enum with 6 members
- **`@format` decorator:** `id` → `format: "uuid"`, `email` → `format: "email"`
- **`@pattern` regex:** `startTime` → `pattern` field with regex
- **Scalar extends uint8:** `CompletionPercentage extends uint8` → renders as a schema
- **uint32 types:** `number: uint32` → `type: "integer"`
- **float64 types:** `velocity: float64` → `type: "number"`
- **Full domain:** 15+ schemas, `$ref` for arrays of named models, `$ref` for nested named models, default values, decimal for prices, string literal union for status

### 4. Bug Discovery & Documentation

Found 6 issues during fixture creation (all were FIXTURE AUTHORING errors, not emitter bugs):

1. **`@service` doesn't accept `version`** — Core TypeSpec `@service(#{title: "...", version: "..."})` causes `invalid-argument`. Use `@apiVersion("1.0.0")` for version.
2. **`model` is a reserved keyword** — Property named `model: string` causes `token-expected` parser error.
3. **`string[] = []` is invalid TypeSpec** — Tuple types used as values require `#[]` syntax. Removed the default.
4. **Enum default requires member reference** — `priority: MyEnum = "value"` causes `unassignable`. Must use `priority: MyEnum = MyEnum.value`.
5. **Property override narrowing constraint** — Can't override `"entity.created"` with `"user.created"`. Base must be `string`.
6. **Missing `@doc` parentheses** — `@doc Notify when...` without parentheses causes `token-expected`. Fixed to `@doc("Notify when...")`.

Found 4 real emitter behaviors that are CORRECT but non-obvious (documented in AGENTS.md Gotchas section):

1. **`decimal` → `type: "string", format: "decimal"`** (NOT `type: "number"`). Correct for precision preservation.
2. **Generic model instantiation produces `allOf`** with `$ref` to base schema. Inherited properties are NOT in derived model's `properties`.
3. **Named unions produce `oneOf`** and union members are emitted as separate component schemas.
4. **Scalar inheritance flattens** — `ActorId extends NanoID extends string` → `type: "string"`. The emitter correctly resolves through the chain.

### 5. Documentation Updates

- **AGENTS.md Quick Start:** Updated test count to "1200+ pass" (was "1000+ pass")
- **AGENTS.md Key Tests:** Added `test/realworld/` section documenting the 3 test files and 10 fixtures with pattern coverage
- **AGENTS.md Gotchas:** Added 7 new entries documenting real-world testing discoveries (see section 4 above)

### 6. Verification

- **Full test suite:** 1205 pass / 0 fail (up from 1059 baseline)
- **New tests added:** 146 (from 3 new test files)
- **Lint:** 0 errors, 0 warnings (ESLint + oxlint)
- **Build:** 0 TypeScript errors
- **All 10 fixture `.tsp` files:** Compile cleanly AND validate against official AsyncAPI 3.1.0 JSON Schema

---

## b) PARTIALLY DONE

### 1. Source Code vs Fixture Bug Distinction

All 6 bugs found were FIXTURE AUTHORING errors (my mistakes writing the `.tsp` files), NOT emitter bugs. The emitter handled every correct `.tsp` input properly. This is actually a good sign — the emitter is robust. But it means we didn't find any new emitter bugs to fix.

**What's partial:** The research found patterns that COULD stress the emitter more aggressively:

- **Circular model references** (A → B → A) — not tested
- **`Map<T>` type** (distinct from `Record`) — not tested
- **`bytes` and `duration` scalars** — not tested
- **Arrays of enums** (`Status[]`) — not tested
- **Arrays of scalars** (`int32[]`) — not tested
- **Nested arrays** (`Item[][]`) — not tested
- **Arrays of anonymous models** (`{ x: string }[]`) — not tested
- **`Set<T>` type** — not tested
- **Unions of named models** (`Cat | Dog`) — partially tested via `CommandResult` but could be deeper

### 2. External `.tsp` File Compilation

The fixtures RECREATE patterns from external projects but don't compile the ACTUAL external files. The real `.tsp` files use custom decorators (`@aggregate`, `@command`, `@event`, `@query`, `@projection`, `@jsonSchema`) that this emitter doesn't support — they would fail compilation.

**What's partial:** We confirmed the emitter handles the MODEL PATTERNS from external projects, but not the full external spec files themselves.

### 3. `@asyncapi/parser` Semantic Validation

The project has `@asyncapi/parser` (v3.6.0) as a devDependency. It performs semantic validation beyond JSON Schema (e.g., `$ref` resolution, message consistency, channel/operation coherence). AGENTS.md notes it's "incompatible with Bun due to AJV `new Function()` codegen issues." Tests only validate structural correctness via AJV.

**What's partial:** We added structural validation (JSON Schema) but not semantic validation.

### 4. CI Integration

The new `test/realworld/` tests run via `pnpm run test` (which runs `vitest run` including all `test/**/*.test.ts` files). But the CI workflow (`.github/workflows/ci.yml`) may not explicitly highlight the real-world test suite.

**What's partial:** Tests are integrated into the test suite but not called out separately in CI.

---

## c) NOT STARTED

1. **Compiling ACTUAL external `.tsp` files** — 200+ files across 15+ projects never compiled through this emitter. Fixtures recreate patterns but are not the real files.
2. **Golden file capture** for the 10 new fixture outputs — The project has a golden file pattern (`test/golden/`). Verified outputs should be captured as golden files to lock exact expected output.
3. **Golden file capture** for real-world outputs under load
4. **Property-based testing** — No random model generation → validate output cycle
5. **Negative test cases for real-world patterns** — What happens with circular model refs? Invalid binding fields? Malformed `.tsp`?
6. **Performance benchmarking** on the large fixtures — The fixtures are complex (172-283 lines each) but not benchmarked
7. **Multi-file output testing** on real-world fixtures — `split-schemas` option not tested with these fixtures
8. **Reusable components** in real-world fixtures — None of the fixtures use `@operationTrait`, `@messageTrait`, `@parameter`, `@reusableBinding`
9. **Security schemes** in real-world fixtures — No fixture exercises `@security`, `apiKey`, `oauth2`, etc.
10. **Protocol bindings** in real-world fixtures — Fixtures specify protocols on servers but don't use `@protocol` or `@bindings` decorators on operations/messages
11. **`@asyncapi/parser` semantic validation** on generated outputs
12. **AsyncAPI Studio compatibility check** — Do the generated specs render correctly in AsyncAPI Studio?
13. **Cross-emitter validation** — Compare output with the official `@asyncapi/server-api` emitter if one exists

---

## d) TOTALLY FUCKED UP

### Nothing.

No irreversible damage. No broken builds. No data loss. All changes are additive (new test files, new fixtures, documentation updates). The full test suite passes.

**Closest to a mistake:** The initial fixture files had 6 authoring errors that were caught and fixed DURING TESTING. This is the system working as designed — the tests caught the errors. But it means I spent time debugging `.tsp` syntax issues that could have been avoided if I had validated each fixture individually before writing assertions against it.

**Process lesson:** I should have compiled each fixture standalone BEFORE writing the test suite that validates all of them. Instead, I wrote all fixtures, then ran the test suite, then debugged failures across multiple files simultaneously. The progressive debugging (bisecting line by line in the sensor-iot fixture) was time-consuming.

---

## e) WHAT WE SHOULD IMPROVE

### Process improvements

1. **Compile fixtures incrementally** — Write one fixture, compile it, verify it works, THEN write the next. Don't batch-create 10 fixtures and debug them all at once.
2. **Use the existing `compileAsyncAPIWithoutErrors()` helper** — The test helpers already have a function that throws on error diagnostics. I could have used this for fixture validation before writing assertion tests.
3. **Test more aggressively** — The fixtures exercise the "happy path" of each pattern. We need negative tests (malformed input, edge cases, circular refs) to find emitter bugs.
4. **Use golden files** — The project has a golden file infrastructure. Every verified output should be captured as a golden file to prevent regressions.
5. **Test with actual external files** — The fixtures recreate patterns faithfully, but there's no substitute for compiling the real `.tsp` files from external projects.
6. **Add protocol bindings to fixtures** — None of the fixtures use `@protocol` or `@bindings` on operations/messages. These are core AsyncAPI features that should be tested with real-world complexity.
7. **Add security schemes to fixtures** — Same issue. Security is a core feature.
8. **Add reusable components to fixtures** — `@operationTrait`, `@messageTrait`, `@parameter`, `@reusableBinding` are not tested in real-world contexts.

### Technical improvements to the test suite

9. **Dedicated unit tests for `refForNamedType()`** covering Model, Enum, Scalar, stdlib types
10. **Dedicated unit test for `Record<string>` mapping** (and `Record<int32>`, nested Records, `Record<string, string>`)
11. **Unit test for `typeToSchema()`** covering every branch (Union, indexed Model, Scalar, String/Number/Boolean literals, Tuple, fallback)
12. **Test arrays of enums** (`Status[]`)
13. **Test arrays of scalars** (`int32[]`)
14. **Test nested arrays** (`Item[][]`)
15. **Test arrays of anonymous models** (`{ x: string }[]`)
16. **Test `Map<T>` type** (distinct from `Record`)
17. **Test `bytes` and `duration` scalars**
18. **Test circular model references** (A → B → A)
19. **Test nullable properties** (`T | null`)
20. **Test optional properties** with complex types
21. **Test model `is` composition** patterns
22. **Test template parameters** in channel addresses (already partially done)

### Testing depth

23. **Use `@asyncapi/parser` for semantic validation** — Structural JSON Schema validation is necessary but not sufficient. Semantic validation catches $ref resolution errors, message consistency issues, and channel/operation coherence problems.
24. **Add AsyncAPI Studio compatibility check** — Verify generated specs render correctly in the official AsyncAPI Studio web UI.
25. **Test against the official AsyncAPI examples repo** — The asyncapi/examples repo has canonical YAML specs. Port them to TypeSpec and compare output.
26. **Cross-validate with other AsyncAPI tools** — Run output through `@asyncapi/parser`, `@asyncapi/modelina`, and other tools to verify compatibility.

### CI and infrastructure

27. **Add the real-world test suite as an explicit CI step** — Don't just rely on `vitest run` catching everything. Make it visible in CI logs.
28. **Add schema validation to CI** — The CI workflow's "Compile examples" step only checks compilation, not schema validity.
29. **Add a coverage check for the new test files** — Ensure the real-world tests cover meaningful emitter code paths.
30. **Add a duplicate-clone check** — Ensure the new fixtures don't have unnecessary duplication.

---

## f) Up to 50 Things to Do Next

### High priority — correctness & coverage

1. **Test circular model references** (A → B → A) — does the emitter handle them or crash?
2. **Test arrays of enums** (`Status[]`) — does `refForNamedType()` handle this correctly?
3. **Test arrays of scalars** (`int32[]`) — verify `typeToSchema` fallback path
4. **Test nested arrays** (`Item[][]`) — does the emitter handle this?
5. **Test arrays of anonymous models** (`{ x: string }[]`) — inline schema generation
6. **Test `Map<T>` type** (distinct from `Record`) — may have mapping issues
7. **Test `bytes` scalar** — binary data format mapping
8. **Test `duration` scalar** — duration format mapping
9. **Test nullable properties** (`T | null`) — null handling in JSON Schema
10. **Test `Set<T>` type** — does the emitter handle it?
11. **Test model `is` composition** — inline model composition pattern
12. **Add `@protocol` decorator to real-world fixtures** — test Kafka/MQTT/WS bindings on operations
13. **Add `@bindings` to real-world fixtures** — test protocol-specific binding fields
14. **Add `@security` to real-world fixtures** — test OAuth2, apiKey, and other security schemes
15. **Add reusable components to real-world fixtures** — `@operationTrait`, `@messageTrait`, `@parameter`, `@reusableBinding`
16. **Add `@correlationId` to real-world fixtures** — correlation ID pattern
17. **Add `@message` decorator with all fields** — name, title, contentType, description, headers, correlationId
18. **Test operation reply** patterns in real-world context — request/reply messaging
19. **Test multi-message operations** — channels with multiple message types
20. **Capture golden files** for all 10 verified fixture outputs
21. **Add negative tests for real-world patterns** — malformed bindings, invalid protocols, circular refs
22. **Test `@format` with all valid values** — email, uuid, uri, date-time, date, time, hostname, ipv4, ipv6
23. **Test all numeric scalar types** — int8, int16, int32, int64, uint8, uint16, uint32, uint64, float32, float64, decimal128, decimal
24. **Test string literal union with 10+ variants** — verify enum array completeness
25. **Test cross-namespace references** in real-world fixtures — `Plugins.PluginManifest` pattern

### Medium priority — semantic validation & tooling

26. **Run `@asyncapi/parser` on all generated outputs** — semantic validation beyond JSON Schema
27. **Add AsyncAPI Studio compatibility check** — render in Studio, verify no errors
28. **Test with `split-schemas` option** on real-world fixtures — multi-file output
29. **Add a fixture with `@versioned` namespace** — version resolution in `info.version`
30. **Add a fixture with `@service` title fallback** — emitter option override behavior
31. **Property-based testing** — generate random valid TypeSpec models, compile, validate output
32. **Benchmark compilation performance** on the large fixtures — 283-line ecommerce fixture is a good candidate
33. **Test multi-namespace isolation** with real-world patterns — separate services in one spec
34. **Test `@defaultContentType`** in real-world fixtures — contentType propagation to messages
35. **Test `@tags`** in real-world fixtures — tag collection and `components.tags` population

### Lower priority — external validation & CI

36. **Port actual AsyncAPI v3 example YAML specs to TypeSpec** — the asyncapi/examples repo has canonical specs
37. **Compare output with other AsyncAPI emitters** if any exist for TypeSpec
38. **Add the real-world suite as an explicit CI step** in `.github/workflows/ci.yml`
39. **Add a pre-commit hook** that validates fixture outputs
40. **Create a "real-world testing" section** in docs/testing/
41. **Document the fixture pattern coverage** in a matrix (pattern × fixture × test)
42. **Add a script to auto-generate fixtures from external `.tsp` files** — extract model definitions and wrap in AsyncAPI operations
43. **Test against TypeSpec 1.14+** when released (currently 1.13.0)
44. **Add a fixture with internationalization patterns** — multi-language content
45. **Add a fixture with complex security combinations** — OAuth2 + apiKey on same namespace

### Documentation & polish

46. **Update FEATURES.md** with the real-world testing capability
47. **Update README.md** with a "Tested against real-world patterns" section
48. **Create a CHANGELOG.md entry** for the new test suite
49. **Document the `test/realworld/` architecture** for contributors
50. **Review all fixtures for accuracy** — ensure they faithfully represent the source project patterns

---

## g) Questions I Cannot Figure Out Myself

### 1. Should I try to compile the ACTUAL external `.tsp` files, or is the pattern-recreation approach sufficient?

The external projects (Kernovia, typespec-eventsourcing, blog) use custom decorators (`@aggregate`, `@command`, `@event`, `@jsonSchema`, `@projection`) that this emitter doesn't support. I recreated the MODEL PATTERNS (scalars, generics, inheritance, unions) without the custom decorators. **Should I:**

- (a) Strip custom decorators from actual external files and compile them?
- (b) Create stripped-down versions of the external specs?
- (c) Is the current pattern-recreation approach sufficient for the goal?

### 2. Should the real-world fixtures live inside the test suite, or in `examples/`?

Currently the 10 fixtures are in `test/realworld/fixtures/`. The project already has an `examples/` directory with simpler example specs. The real-world fixtures could also serve as documentation/examples. **Should I:**

- (a) Keep them in `test/realworld/fixtures/` (test-only, not shipped to users)?
- (b) Move them to `examples/real-world/` (shipped, documented, but also tested)?
- (c) Duplicate the most interesting ones into both locations?

### 3. Should I add protocol bindings and security to ALL fixtures, or create dedicated fixtures for those?

The current fixtures are domain-model focused (testing type patterns). Protocol bindings and security schemes are AsyncAPI-specific features that need real-world testing. **Should I:**

- (a) Add `@protocol`, `@bindings`, and `@security` to the existing domain fixtures (broader coverage per fixture)?
- (b) Create separate protocol/security-focused fixtures (cleaner separation of concerns)?
- (c) Do both?
