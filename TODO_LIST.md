# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

Harvested from the 2026-08-14 full code review
(`docs/reviews/2026-08-14_full-code-review.html`). Everything found there
that was not fixed on the spot is listed below, most impactful first.

---

## v0.3.0 Release — Beat tsp-asyncapi

Full plan with fine-grained breakdown and execution graph:
`docs/planning/2026-08-21_09-04_SUPERB-v0.3.0-CLEAR-WINNER.md`.
Sorted by Pareto tier (P1 = the 1% that delivers 51%).

- [ ] **P1: Release prep + CI + publish 0.3.0-beta.1** — version bump,
      `pnpm pack` tarball audit, tag-triggered npm publish workflow
      (SHA-pinned), fresh-install compile smoke
- [ ] **P2: README sales page** — quick start, competitor comparison table,
      feature matrix, rigor callouts, EFv1-architecture honesty section
- [ ] **P2: Five worked examples** (`examples/`) — streetlights MQTT, Kafka +
      security, WS chat, reusable components, split-schemas; CI compiles and
      AJV-validates each
- [ ] **P2: `@jsonSchemaExtension(key, value)`** — arbitrary JSON Schema
      keywords on Model/ModelProperty/Union/Enum/Scalar, incl. `$ref`-sibling
      policy
- [ ] **P2: `@encodedName` support** — stdlib decorator, wire-format property
      renaming in schema emitter + required arrays
- [ ] **P2: `@extension("x-...", value)`** — AsyncAPI object spec extensions
      (server/channel/operation/message); key must start `x-`. Neither emitter
      ships this; we go first
- [ ] **P2: `asyncapi-id` emitter option** — top-level document `id`
- [ ] **P3: Rewrite `test/domain/protocol-websocket-mqtt.test.ts`** — 1515
      lines / 50 tests asserting only `=== "3.1.0"`; replace with fixture
      table asserting real binding keys, normalization, auto-bindingVersion
- [ ] **P3: Tighten security-\* tests** — assert `in`/`name`/`scheme`/flows,
      delete AWS SigV4/MAC/Hawk bearer clones
- [ ] **P3: fast-check property suite** — ~7 properties (AJV always passes,
      $ref integrity, constraint sanity, determinism, split-schemas graph)
- [ ] **P3: EFv1 containment** — `generateSchemas()` sole
      `@typespec/asset-emitter` seam + eslint no-restricted-imports guard
- [ ] **P3: Stable template-instantiation names** — verify golden for
      `Page<string>`-style instantiations; lock or implement `PageString`
      naming with collision diagnostic
- [ ] **P3: Publish stable v0.3.0** — CHANGELOG, tag, verify, fresh-install
      smoke (only after all P2/P3 above are green)

Post-release (feed 0.3.1/0.4.0): docs site, v0.4.0 direct-AST spike + memo,
openapi3 EFv2-migration watch procedure. See plan Phases 4-5.

---

## Emitter Correctness

- [x] **Kafka `@protocol` fields never emitted** — FIXED (2026-08-21):
      `@protocol` config fields now emit at their spec-correct placements
      (kafka `partitions`/`replicationFactor` → channel binding
      `partitions`/`replicas`; `consumerGroup` → operation-binding
      `groupId` schema; mqtt `qos`/`retain` → operation binding; ws
      `headers`/`queryParams` → channel binding `headers`/`query`).
      Fabricated defaults removed; version-only binding shells no longer
      emitted; raw `binding:` passthrough routes to the operation binding
      when the protocol has no channel binding (http).
- [ ] O(n²) operation-type lookup in `src/builders/operation-builder.ts:37` —
      builds a fresh array scan per operation; precompute a Set/Map.
- [ ] Unify `registerMessage` vs `mergeExplicitMessages` construction paths in
      `src/builders/message-builder.ts` — two ways to build the same object.
- [ ] Warn on conflicting multi-namespace `defaultContentType` / `apiVersion`
      — currently last-wins silently.
- [ ] `ParsedAsyncAPIDocument.asyncapi` comment/type contradiction in
      `test/utils/type-guards.ts` — comment says one thing, type another.
- [ ] Orphan comment above `SECURITY_SCHEME_TYPES`
      (`src/domain/models/asyncapi-document.ts:268`) describes a removed concept.
- [ ] Dual export `SCHEME_TYPE_LIST` vs `VALID_SCHEME_TYPES` — same data, two
      names; keep one.
- [ ] Collapse the 7 near-identical `ref*` constructors in
      `src/builders/shared-utils.ts` into one parameterized helper.
- [ ] Document (or change) tag-dedup last-wins semantics in `tag-builder.ts`.
- [ ] Remove unreachable fallback defaults in `storeServerConfig`
      (`src/state-writers.ts`) — the guarded branches make them dead.
- [ ] Replace `as never` casts in `resolveOpName` / `returnModelTypes` with
      honest types.
- [ ] Generalize `pickOpt<T, K>` helper (decorator-helpers.ts) — currently
      hand-instantiated per field.

## Test-Suite Integrity (from 4-agent review, ~130 findings triaged)

- [ ] **`test/domain/protocol-websocket-mqtt.test.ts`** — 1515 lines, 50
      tests, every assertion is only `asyncapi === "3.1.0"`. Zero binding checks;
      the `websocket → ws` normalization is untested. Rewrite as fixture table
      with per-feature binding assertions.
- [ ] **`test/domain/security-*.test.ts` (4 files)** — ~60 of 80 tests assert
      only the base `type` (`apiKey`/`http`/`oauth2`), never the feature named in
      the title (`in`/`name`/`scheme`/specific flow). Fixtures for "AWS SigV4",
      "MAC", "Hawk" are bearer clones. Tighten assertions; drop fake scenarios.
- [ ] `test/compliance/schema-types.test.ts` — ~90% duplicate of
      `type-mapping-completeness.test.ts`; delete one.
- [ ] `test/e2e/multi-protocol-comprehensive.test.ts` — headline promises
      bindings, asserts none; also empty `if (diagnostics.length > 0) {}` block.
- [ ] Promote `resolveRef`/`collectRefs` to `test/utils/` — 5+ divergent
      copies; the `generator-compatibility.test.ts` copy lacks `~1`/`~0`
      unescaping (latent false pass).
- [ ] `test/integration/multi-file-output.test.ts` — 9× `as never` option
      casts; use the typed `AsyncAPIEmitterOptions`.
- [ ] `test/external/external-specs.test.ts` — 7 of 14 tests only
      `not.toBeNull()` smoke checks under "should handle X" names.
- [ ] `test/validation/studio-compatibility.test.ts` — 3 tests assert less
      than their names (bindings/reply never checked).
- [ ] Deduplicate `compileAndGetDoc` helpers (4+ copies across suites) — use
      `compileAndValidateOrThrow` from `test/utils/schema-validator.ts`.
- [ ] `test/e2e/error-handling-edgecases.test.ts` — two `≤1 error`
      assertions mask real diagnostics; investigate what error occurs, tighten
      to 0.
- [ ] `test/integration/round-trip-verification.test.ts` — 20 tests read a
      module-level `doc` set by the first test; convert to `beforeAll`.
- [ ] `test/validation/all-examples-validation.test.ts` +
      `real-world-examples.test.ts` — ~90 redundant full compiles (each example
      recompiled per assertion group); compile once per fixture. The latter is
      fully subsumed by the former.
- [ ] `test/validation/schema-validation.test.ts` — copy of
      `utils/schema-validator.ts`; delegate or delete.
- [ ] `test/integration/asyncapi-generation.test.ts:679` — "spec compliant"
      backed by a 2-field stub validator; switch to real AJV validation.
- [ ] `test/integration/cli-simple-emitter.test.ts` — fake CLI wrapper
      (wraps programmatic API); delete or make it a real CLI test.
- [ ] `test/e2e/realworld-ecommerce.test.ts:336` — protocol diversity via
      substring search on serialized JSON; inspect `servers[*].protocol` instead.
- [ ] Replace `require("yaml")` CJS calls with ESM imports (7 sites in e2e/).
- [ ] Import `LATEST_BINDING_VERSIONS` instead of hardcoding version strings
      (~20 sites across compliance/integration/validation).
- [ ] `test/benchmark/fixture-generator.ts` — dead `modelsPerChannel` option;
      remove or implement.

## Recently Completed

- Named-union metadata decision (2026-08-15): **locked in** as public
  contract — named unions emit `@doc`/`@summary` as `description`/`title`
  via the shared `declareSchema` path; 2 compliance tests in
  `test/compliance/polymorphism.test.ts` (commit `2e2ef0b`)

- Full code review of all 40 src/ files, lib/main.tsp, scripts/, configs,
  and 102 test files (4 sub-agents + personal review of bdd/golden/utils) —
  2026-08-14, see `docs/reviews/2026-08-14_full-code-review.html`
- Pin oxlint 1.78.0 + jscpd 4.0.9 as devDependencies — GitHub CI was broken
  (command not found); local gates immune to host drift
- Repair 9 broken tests: 5 tautologies (could never fail), 1 tautological
  file deleted (`test/validation/protocol-bindings.test.ts`), benchmark time
  budget added, duplicate test removed, misleading names fixed
- Dead config removed: `tspconfig.json` (split-brain with yaml), vestigial
  tsconfig decorator/jsx options, redundant eslint ignore, unused `@channel`
  description param
- Empty stale dirs trashed: `test/acceptance/`, `test/core/`
