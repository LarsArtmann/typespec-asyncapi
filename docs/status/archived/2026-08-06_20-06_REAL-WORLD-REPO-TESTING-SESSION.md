# Status Report: Real-World Repo Testing Against Real .tsp Definitions
> **Live remainder:** none — every item resolved in the 2026-11-19/20 corpus sweep (verdicts inline; routed work lives in TODO_LIST.md / ROADMAP.md).

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
| ~~Multi-level scalar inheritance~~ done at `0aa6e76b` | ~~Kernovia, eventsourcing, milestone~~ | ~~5~~ |
| ~~Generic models with constrained type params~~ done at `0aa6e76b` | ~~eventsourcing, ActaFlow~~ | ~~3~~ |
| ~~Spread of generic with literal arg~~ done at `0aa6e76b` | ~~eventsourcing~~ | ~~2~~ |
| ~~3-level model inheritance chains~~ done at `0aa6e76b` | ~~Kernovia, eventsourcing, blog~~ | ~~6~~ |
| ~~Property override/narrowing~~ done at `0aa6e76b` | ~~Kernovia, eventsourcing, blog~~ | ~~5~~ |
| ~~Named unions (discriminated)~~ done at `0aa6e76b` | ~~eventsourcing~~ | ~~2~~ |
| ~~Deeply nested anonymous objects (4-5 levels)~~ done at `0aa6e76b` | ~~blog, Kernovia~~ | ~~4~~ |
| ~~Arrays of inline anonymous objects~~ done at `0aa6e76b` | ~~blog, Kernovia, accountability~~ | ~~3~~ |
| ~~Enums with/without string values~~ done at `0aa6e76b` | ~~accountability, milestone~~ | ~~3~~ |
| ~~Record types (`Record<unknown>`, `Record<string>`)~~ done at `0aa6e76b` | ~~All projects~~ | ~~12~~ |
| ~~Default values (including enum member defaults)~~ done at `0aa6e76b` | ~~Kernovia, eventsourcing, milestone~~ | ~~6~~ |
| ~~Numeric validation decorators~~ done at `0aa6e76b` | ~~accountability, milestone~~ | ~~4~~ |
| ~~`@format`, `@pattern` decorators~~ done at `0aa6e76b` | ~~accountability, milestone~~ | ~~3~~ |

### 2. Real-World Fixture Files (10 files, 1,841 lines)

Created `test/realworld/fixtures/` with `.tsp` files that faithfully recreate REAL patterns from sibling projects, wrapped in AsyncAPI operations:

#### External Model Pattern Fixtures (6 files):

~~1. **`kernovia-branded-types.tsp`** (172 lines) — Multi-level scalar inheritance (`ActorId extends NanoID extends string`), branded types with `@pattern`, kebab-case enum values, default values, `Record<unknown>`, array-of-union-literals, nested inline objects, validation results~~ done at `0aa6e76b`
~~2. **`eventsourcing-generics.tsp`** (197 lines) — Generic models with constrained type params (`BrandedId<Brand extends string>`), spread of generic with string literal arg, phantom brand fields, named unions (`union CommandResult`), 3-level event hierarchy with `allOf`, command models~~ done at `0aa6e76b`
~~3. **`blog-campaign-nesting.tsp`** (179 lines) — Very deeply nested anonymous objects (4-5 levels), arrays of inline anonymous objects, array of named models, many string literal unions, `decimal` type, `Campaign extends AggregateRoot`~~ done at `0aa6e76b`
~~4. **`accountability-domain.tsp`** (232 lines) — Enums with AND without explicit string values, `@format("email")`, `@format("uuid")`, `@format("date-time")`, `@pattern` with regex, `@minLength`/`@maxLength`/`@maxItems`, boolean optional fields, root container with arrays of named types~~ done at `0aa6e76b`
~~5. **`milestone-analysis.tsp`** (230 lines) — Scalar extending numeric type (`CompletionPercentage extends uint8`), `@format("uuid")`, `@format("uri")`, uint8/uint32/uint64 types, `@minValue`/`@maxValue`, cross-file model references, enums without values~~ done at `0aa6e76b`
~~6. **`ecommerce-complete.tsp`** (283 lines) — Full e-commerce domain with 20+ cross-referenced models, decimal types, complex status enums, arrays of named types, nested address model, multiple domains (orders, payments, shipping, inventory, reviews)~~ done at `0aa6e76b`

#### Canonical AsyncAPI Spec Fixtures (4 files):

~~7. **`streetlights-mqtt.tsp`** (78 lines) — The canonical AsyncAPI example: MQTT pub/sub, parameterized channel addresses (`{streetlightId}`), bidirectional pub/sub, `@minValue`/`@maxValue` constraints, `@format("date-time")`, enum with explicit values, two servers~~ done at `0aa6e76b`
~~8. **`chat-websocket.tsp`** (121 lines) — Real-time WebSocket chat: bidirectional messaging, user presence, typing indicators, soft-delete messages, message reactions (nested array of named models), multiple channels~~ done at `0aa6e76b`
~~9. **`sensor-iot-multi-protocol.tsp`** (153 lines) — IoT telemetry with 3 protocols (Kafka, MQTT, WebSocket), 3 servers, sensor types, batch readings, device registration, real-time dashboards, multi-protocol operations~~ done at `0aa6e76b`
~~10. **`notifications-enterprise.tsp`** (196 lines) — Enterprise notification service: AMQP + HTTPS, multi-channel delivery (email/sms/push/webhook/slack/teams), notification templates, delivery tracking, retry policies with nested defaults, webhook configs~~ done at `0aa6e76b`

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

~~1. **`@service` doesn't accept `version`** — Core TypeSpec `@service(#{title: "...", version: "..."})` causes `invalid-argument`. Use `@apiVersion("1.0.0")` for version.~~ done at `0aa6e76b`
~~2. **`model` is a reserved keyword** — Property named `model: string` causes `token-expected` parser error.~~ done at `0aa6e76b`
~~3. **`string[] = []` is invalid TypeSpec** — Tuple types used as values require `#[]` syntax. Removed the default.~~ done at `0aa6e76b`
~~4. **Enum default requires member reference** — `priority: MyEnum = "value"` causes `unassignable`. Must use `priority: MyEnum = MyEnum.value`.~~ done at `0aa6e76b`
~~5. **Property override narrowing constraint** — Can't override `"entity.created"` with `"user.created"`. Base must be `string`.~~ done at `0aa6e76b`
~~6. **Missing `@doc` parentheses** — `@doc Notify when...` without parentheses causes `token-expected`. Fixed to `@doc("Notify when...")`.~~ done at `0aa6e76b`

Found 4 real emitter behaviors that are CORRECT but non-obvious (documented in AGENTS.md Gotchas section):

~~1. **`decimal` → `type: "string", format: "decimal"`** (NOT `type: "number"`). Correct for precision preservation.~~ done — documented in `AGENTS.md` §Gotchas — decimal as string plus format, inheritance `allOf`, model unions `oneOf`
~~2. **Generic model instantiation produces `allOf`** with `$ref` to base schema. Inherited properties are NOT in derived model's `properties`.~~ done — documented in `AGENTS.md` §Gotchas — decimal as string plus format, inheritance `allOf`, model unions `oneOf`
~~3. **Named unions produce `oneOf`** and union members are emitted as separate component schemas.~~ done — documented in `AGENTS.md` §Gotchas — decimal as string plus format, inheritance `allOf`, model unions `oneOf`
~~4. **Scalar inheritance flattens** — `ActorId extends NanoID extends string` → `type: "string"`. The emitter correctly resolves through the chain.~~ done — documented in `AGENTS.md` §Gotchas — decimal as string plus format, inheritance `allOf`, model unions `oneOf`

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

~~1. **Compiling ACTUAL external `.tsp` files** — 200+ files across 15+ projects never compiled through this emitter. Fixtures recreate patterns but are not the real files.~~ done — `test/realworld/repos/` holds 5 real external specs compiled by `test/realworld/github-actual-files.test.ts` plus `test/realworld/adapted/` suites
~~2. **Golden file capture** for the 10 new fixture outputs — The project has a golden file pattern (`test/golden/`). Verified outputs should be captured as golden files to lock exact expected output.~~ **Won't implement — golden locking landed for `test/realworld/golden/livesession-xyd.json` and `test/golden/` instead; the 10 fixtures stay AJV-validated per-run.**
~~3. **Golden file capture** for real-world outputs under load~~ **NOT-DO — folded into item 2 — load behavior is covered by `test/benchmark/performance.test.ts`.**
~~4. **Property-based testing** — No random model generation → validate output cycle~~ done — `test/property/emitter-properties.test.ts` — fast-check suite with 6 invariants
~~5. **Negative test cases for real-world patterns** — What happens with circular model refs? Invalid binding fields? Malformed `.tsp`?~~ done — `test/integration/negative-tests.test.ts` plus `decorator-negative.test.ts` and `error-handling-edgecases.test.ts`
~~6. **Performance benchmarking** on the large fixtures — The fixtures are complex (172-283 lines each) but not benchmarked~~ done — `test/benchmark/performance.test.ts` measures compile time and scaling
~~7. **Multi-file output testing** on real-world fixtures — `split-schemas` option not tested with these fixtures~~ **Won't implement — split-schemas is covered by `test/integration/multi-file-output.test.ts` and `test/e2e/channel-id-split-schemas.test.ts`; never re-run on the realworld fixtures.**
~~8. **Reusable components** in real-world fixtures — None of the fixtures use `@operationTrait`, `@messageTrait`, `@parameter`, `@reusableBinding`~~ **Won't implement — trait coverage lives in `test/compliance/reusable-components.test.ts`; the fixtures never grew `@operationTrait` or `@messageTrait`.**
~~9. **Security schemes** in real-world fixtures — No fixture exercises `@security`, `apiKey`, `oauth2`, etc.~~ **Won't implement — security coverage lives in `test/compliance/servers-security.test.ts`; the fixtures never grew `@security`.**
~~10. **Protocol bindings** in real-world fixtures — Fixtures specify protocols on servers but don't use `@protocol` or `@bindings` decorators on operations/messages~~ **Won't implement — binding coverage lives in `test/compliance/protocol-bindings.test.ts` and `test/domain/`; fixtures stayed domain-model focused.**
~~11. **`@asyncapi/parser` semantic validation** on generated outputs~~ done — `test/validation/studio-compatibility.test.ts` parses output with `@asyncapi/parser` under Node or vitest
~~12. **AsyncAPI Studio compatibility check** — Do the generated specs render correctly in AsyncAPI Studio?~~ done — `test/validation/studio-compatibility.test.ts` locks Studio parsing
~~13. **Cross-emitter validation** — Compare output with the official `@asyncapi/server-api` emitter if one exists~~ done — `test/realworld/cross-emitter-milehimikey.test.ts`

---

## d) TOTALLY FUCKED UP

### Nothing.

No irreversible damage. No broken builds. No data loss. All changes are additive (new test files, new fixtures, documentation updates). The full test suite passes.

**Closest to a mistake:** The initial fixture files had 6 authoring errors that were caught and fixed DURING TESTING. This is the system working as designed — the tests caught the errors. But it means I spent time debugging `.tsp` syntax issues that could have been avoided if I had validated each fixture individually before writing assertions against it.

**Process lesson:** I should have compiled each fixture standalone BEFORE writing the test suite that validates all of them. Instead, I wrote all fixtures, then ran the test suite, then debugged failures across multiple files simultaneously. The progressive debugging (bisecting line by line in the sensor-iot fixture) was time-consuming.

---

## e) WHAT WE SHOULD IMPROVE

### Process improvements

~~1. **Compile fixtures incrementally** — Write one fixture, compile it, verify it works, THEN write the next. Don't batch-create 10 fixtures and debug them all at once.~~ **NOT-DO — process lesson — no work product.**
~~2. **Use the existing `compileAsyncAPIWithoutErrors()` helper** — The test helpers already have a function that throws on error diagnostics. I could have used this for fixture validation before writing assertion tests.~~ done — helper exists at `test/utils/test-helpers.ts` line 168 and is the standard compile helper
~~3. **Test more aggressively** — The fixtures exercise the "happy path" of each pattern. We need negative tests (malformed input, edge cases, circular refs) to find emitter bugs.~~ done — negative suites exist — `test/integration/negative-tests.test.ts`
~~4. **Use golden files** — The project has a golden file infrastructure. Every verified output should be captured as a golden file to prevent regressions.~~ done — `test/golden/` holds 10 expected YAMLs plus `scripts/regenerate-golden.ts`
~~5. **Test with actual external files** — The fixtures recreate patterns faithfully, but there's no substitute for compiling the real `.tsp` files from external projects.~~ done — `test/realworld/repos/` plus `github-actual-files.test.ts` and `adapted/` suites
~~6. **Add protocol bindings to fixtures** — None of the fixtures use `@protocol` or `@bindings` on operations/messages. These are core AsyncAPI features that should be tested with real-world complexity.~~ **Won't implement — binding coverage lives in `test/compliance/protocol-bindings.test.ts`; fixtures unchanged.**
~~7. **Add security schemes to fixtures** — Same issue. Security is a core feature.~~ **Won't implement — security coverage lives in `test/compliance/servers-security.test.ts`; fixtures unchanged.**
~~8. **Add reusable components to fixtures** — `@operationTrait`, `@messageTrait`, `@parameter`, `@reusableBinding` are not tested in real-world contexts.~~ **Won't implement — trait coverage lives in `test/compliance/reusable-components.test.ts`; fixtures unchanged.**

### Technical improvements to the test suite

~~9. **Dedicated unit tests for `refForNamedType()`** covering Model, Enum, Scalar, stdlib types~~ done — `refForNamedType` exercised in `test/validation/schema-emitter-regression.test.ts`
~~10. **Dedicated unit test for `Record<string>` mapping** (and `Record<int32>`, nested Records, `Record<string, string>`)~~ done — `test/compliance/type-mapping-completeness.test.ts` covers Record mapping plus `test/compliance/template-instantiations.test.ts`
~~11. **Unit test for `typeToSchema()`** covering every branch (Union, indexed Model, Scalar, String/Number/Boolean literals, Tuple, fallback)~~ done — `test/compliance/type-mapping-completeness.test.ts` walks every scalar branch — about 60 tests
~~12. **Test arrays of enums** (`Status[]`)~~ **NOT-DO — duplicate of item 2 in section f — harvested as a TODO_LIST row.**
~~13. **Test arrays of scalars** (`int32[]`)~~ done — int32 and boolean array cases in `test/compliance/type-mapping-completeness.test.ts`
~~14. **Test nested arrays** (`Item[][]`)~~ done — `test/validation/schema-emitter-regression.test.ts` line 79 and `test/compliance/model-composition.test.ts` line 224
~~15. **Test arrays of anonymous models** (`{ x: string }[]`)~~ done — `test/realworld/pattern-assertions.test.ts` line 108 asserts inline anonymous object arrays
~~16. **Test `Map<T>` type** (distinct from `Record`)~~ **NOT-DO — duplicate of item 2 in section f — harvested as a TODO_LIST row.**
~~17. **Test `bytes` and `duration` scalars**~~ done — bytes and duration cases in `test/compliance/type-mapping-completeness.test.ts`
~~18. **Test circular model references** (A → B → A)~~ done — recursive models terminate with a self-referencing `$ref` — `test/integration/decorator-validation.test.ts` line 202
~~19. **Test nullable properties** (`T | null`)~~ done — nullable unions map to `anyOf` with a null variant — `test/compliance/type-mapping-completeness.test.ts`
~~20. **Test optional properties** with complex types~~ done — optional and required field handling locked by `test/compliance/model-composition.test.ts`
~~21. **Test model `is` composition** patterns~~ **Won't implement — no dedicated `is`-composition test; inheritance `allOf` is locked by `test/compliance/model-composition.test.ts`.**
~~22. **Test template parameters** in channel addresses (already partially done)~~ done — channel `{param}` extraction plus `@parameter` auto-ref covered by `test/compliance/edge-cases.test.ts` and `reusable-components.test.ts`

### Testing depth

~~23. **Use `@asyncapi/parser` for semantic validation** — Structural JSON Schema validation is necessary but not sufficient. Semantic validation catches $ref resolution errors, message consistency issues, and channel/operation coherence problems.~~ done — `test/validation/studio-compatibility.test.ts` plus `test/validation/semantic-ref-resolution.test.ts`
~~24. **Add AsyncAPI Studio compatibility check** — Verify generated specs render correctly in the official AsyncAPI Studio web UI.~~ done — `test/validation/studio-compatibility.test.ts`
~~25. **Test against the official AsyncAPI examples repo** — The asyncapi/examples repo has canonical YAML specs. Port them to TypeSpec and compare output.~~ done — canonical spec ports compiled by `test/realworld/canonical-asyncapi-specs.test.ts`
~~26. **Cross-validate with other AsyncAPI tools** — Run output through `@asyncapi/parser`, `@asyncapi/modelina`, and other tools to verify compatibility.~~ **Won't implement — parser validation shipped via `test/validation/studio-compatibility.test.ts`; modelina never wired.**

### CI and infrastructure

~~27. **Add the real-world test suite as an explicit CI step** — Don't just rely on `vitest run` catching everything. Make it visible in CI logs.~~ **Won't implement — CI is one `pnpm run verify` gate plus `check-examples` by design — `.github/workflows/ci.yml`.**
~~28. **Add schema validation to CI** — The CI workflow's "Compile examples" step only checks compilation, not schema validity.~~ done — CI `check-examples` step AJV-validates every example output
~~29. **Add a coverage check for the new test files** — Ensure the real-world tests cover meaningful emitter code paths.~~ done — `test:coverage:gate` with 75 percent per-file minimum runs inside `pnpm run verify`
~~30. **Add a duplicate-clone check** — Ensure the new fixtures don't have unnecessary duplication.~~ done — `pnpm run duplicate` — jscpd at 0 percent threshold — runs inside `pnpm run verify`

---

## f) Up to 50 Things to Do Next

### High priority — correctness & coverage

~~1. **Test circular model references** (A → B → A) — does the emitter handle them or crash?~~ done — recursive models test — `test/integration/decorator-validation.test.ts` line 202
2. **Test arrays of enums** (`Status[]`) — does `refForNamedType()` handle this correctly? **→ TODO_LIST §Test-Suite Integrity (enum-array + Map/Set type-mapping tests row)**
~~3. **Test arrays of scalars** (`int32[]`) — verify `typeToSchema` fallback path~~ done — int32 and boolean array cases in `test/compliance/type-mapping-completeness.test.ts`
~~4. **Test nested arrays** (`Item[][]`) — does the emitter handle this?~~ done — nested arrays — `test/validation/schema-emitter-regression.test.ts` line 79
~~5. **Test arrays of anonymous models** (`{ x: string }[]`) — inline schema generation~~ done — `test/realworld/pattern-assertions.test.ts` line 108
~~6. **Test `Map<T>` type** (distinct from `Record`) — may have mapping issues~~ **NOT-DO — duplicate of item 2 in section f — harvested as a TODO_LIST row.**
~~7. **Test `bytes` scalar** — binary data format mapping~~ done — bytes case in `test/compliance/type-mapping-completeness.test.ts`
~~8. **Test `duration` scalar** — duration format mapping~~ done — duration case in `test/compliance/type-mapping-completeness.test.ts`
~~9. **Test nullable properties** (`T | null`) — null handling in JSON Schema~~ done — nullable unions in `test/compliance/type-mapping-completeness.test.ts`
~~10. **Test `Set<T>` type** — does the emitter handle it?~~ **NOT-DO — duplicate of item 2 in section f — harvested as a TODO_LIST row.**
~~11. **Test model `is` composition** — inline model composition pattern~~ **Won't implement — no dedicated `is`-composition test; inheritance locked by `test/compliance/model-composition.test.ts`.**
~~12. **Add `@protocol` decorator to real-world fixtures** — test Kafka/MQTT/WS bindings on operations~~ **Won't implement — `@protocol` output covered by `test/compliance/protocol-bindings.test.ts`; fixtures unchanged.**
~~13. **Add `@bindings` to real-world fixtures** — test protocol-specific binding fields~~ **Won't implement — `@bindings` covered by `test/compliance/protocol-bindings.test.ts`; fixtures unchanged.**
~~14. **Add `@security` to real-world fixtures** — test OAuth2, apiKey, and other security schemes~~ **Won't implement — `@security` covered by `test/compliance/servers-security.test.ts`; fixtures unchanged.**
~~15. **Add reusable components to real-world fixtures** — `@operationTrait`, `@messageTrait`, `@parameter`, `@reusableBinding`~~ **Won't implement — reusable components covered by `test/compliance/reusable-components.test.ts`; fixtures unchanged.**
~~16. **Add `@correlationId` to real-world fixtures** — correlation ID pattern~~ **Won't implement — correlationId covered by `test/compliance/edge-cases.test.ts` and `reusable-components.test.ts`; fixtures unchanged.**
~~17. **Add `@message` decorator with all fields** — name, title, contentType, description, headers, correlationId~~ **Won't implement — `@message` fields covered by `test/compliance/` and `test/golden/example-message.expected.yaml`; fixtures unchanged.**
~~18. **Test operation reply** patterns in real-world context — request/reply messaging~~ **Won't implement — reply covered by `test/compliance/operation-reply.test.ts`; fixtures unchanged.**
~~19. **Test multi-message operations** — channels with multiple message types~~ done — `test/compliance/multi-message-operations.test.ts`
~~20. **Capture golden files** for all 10 verified fixture outputs~~ **Won't implement — golden locking landed in `test/golden/` and `test/realworld/golden/livesession-xyd.json`; the 10 fixtures have none.**
~~21. **Add negative tests for real-world patterns** — malformed bindings, invalid protocols, circular refs~~ done — `test/integration/negative-tests.test.ts` plus `test/e2e/error-handling-edgecases.test.ts`
~~22. **Test `@format` with all valid values** — email, uuid, uri, date-time, date, time, hostname, ipv4, ipv6~~ **Won't implement — uuid, email, code, uri overrides asserted in `test/compliance/constraint-decorators.test.ts` and `pattern-assertions.test.ts`; full sweep never added.**
~~23. **Test all numeric scalar types** — int8, int16, int32, int64, uint8, uint16, uint32, uint64, float32, float64, decimal128, decimal~~ done — int8 through decimal128 all covered in `test/compliance/type-mapping-completeness.test.ts`
~~24. **Test string literal union with 10+ variants** — verify enum array completeness~~ **Won't implement — no 10-plus-variant case; literal-union enum output locked by `test/compliance/polymorphism.test.ts`.**
~~25. **Test cross-namespace references** in real-world fixtures — `Plugins.PluginManifest` pattern~~ **Won't implement — cross-namespace refs not directly tested; namespace isolation is — `test/integration/multi-namespace-isolation.test.ts`.**

### Medium priority — semantic validation & tooling

~~26. **Run `@asyncapi/parser` on all generated outputs** — semantic validation beyond JSON Schema~~ done — `test/validation/studio-compatibility.test.ts` runs `@asyncapi/parser` on outputs
~~27. **Add AsyncAPI Studio compatibility check** — render in Studio, verify no errors~~ done — `test/validation/studio-compatibility.test.ts`
~~28. **Test with `split-schemas` option** on real-world fixtures — multi-file output~~ **Won't implement — split-schemas covered by `test/integration/multi-file-output.test.ts`; not fixture-specific.**
~~29. **Add a fixture with `@versioned` namespace** — version resolution in `info.version`~~ done — `test/integration/versioning.test.ts` plus `test/realworld/repos/azure-eventgrid.tsp`
~~30. **Add a fixture with `@service` title fallback** — emitter option override behavior~~ done — `listServices()` drives `info.title` — `src/document-builder.ts` line 208 and `test/decorators/service.test.ts`
~~31. **Property-based testing** — generate random valid TypeSpec models, compile, validate output~~ done — `test/property/emitter-properties.test.ts`
~~32. **Benchmark compilation performance** on the large fixtures — 283-line ecommerce fixture is a good candidate~~ done — `test/benchmark/performance.test.ts`
~~33. **Test multi-namespace isolation** with real-world patterns — separate services in one spec~~ done — `test/integration/multi-namespace-isolation.test.ts`
~~34. **Test `@defaultContentType`** in real-world fixtures — contentType propagation to messages~~ done — `test/compliance/default-content-type.test.ts`
~~35. **Test `@tags`** in real-world fixtures — tag collection and `components.tags` population~~ **Won't implement — tags collection covered by `test/compliance/components-tags.test.ts`; fixtures unchanged.**

### Lower priority — external validation & CI

~~36. **Port actual AsyncAPI v3 example YAML specs to TypeSpec** — the asyncapi/examples repo has canonical specs~~ done — streetlights, chat, sensor, notification ports live in `test/realworld/fixtures/` under `canonical-asyncapi-specs.test.ts`
~~37. **Compare output with other AsyncAPI emitters** if any exist for TypeSpec~~ done — `test/realworld/cross-emitter-milehimikey.test.ts`
~~38. **Add the real-world suite as an explicit CI step** in `.github/workflows/ci.yml`~~ **Won't implement — CI is one `pnpm run verify` gate by design — `.github/workflows/ci.yml`.**
~~39. **Add a pre-commit hook** that validates fixture outputs~~ done — `.husky/pre-commit` runs the full `pnpm run verify` gate including all realworld tests
~~40. **Create a "real-world testing" section** in docs/testing/~~ **Won't implement — `docs/testing/` never created; test-suite docs live in `AGENTS.md` and the website docs.**
~~41. **Document the fixture pattern coverage** in a matrix (pattern × fixture × test)~~ **Won't implement — no matrix exists; `FEATURES.md` §Testing summarizes coverage.**
~~42. **Add a script to auto-generate fixtures from external `.tsp` files** — extract model definitions and wrap in AsyncAPI operations~~ **Won't implement — `scripts/` has no fixture generator; `scripts/regenerate-golden.ts` is golden-only.**
~~43. **Test against TypeSpec 1.14+** when released (currently 1.13.0)~~ done — `package.json` pins `@typespec/compiler` at ^1.17.0
~~44. **Add a fixture with internationalization patterns** — multi-language content~~ **Won't implement — never added; no internationalization fixture exists.**
~~45. **Add a fixture with complex security combinations** — OAuth2 + apiKey on same namespace~~ **Won't implement — security combinations covered by `test/compliance/servers-security.test.ts`; no combined realworld fixture.**

### Documentation & polish

~~46. **Update FEATURES.md** with the real-world testing capability~~ done — `FEATURES.md` §Testing row Real-world fixtures
~~47. **Update README.md** with a "Tested against real-world patterns" section~~ done — README Real-world regression guards line
~~48. **Create a CHANGELOG.md entry** for the new test suite~~ done — `CHANGELOG.md` documents realworld suite work
~~49. **Document the `test/realworld/` architecture** for contributors~~ done — `AGENTS.md` documents the `test/realworld/` architecture
~~50. **Review all fixtures for accuracy** — ensure they faithfully represent the source project patterns~~ **NOT-DO — one-off review task; fixtures re-verified by every CI run.**

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
