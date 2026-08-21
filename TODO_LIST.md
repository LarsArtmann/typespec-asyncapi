# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

Originally harvested from the 2026-08-14 full code review
(`docs/reviews/archived/2026-08-14_full-code-review.html`), re-verified
against code 2026-08-21 (docs-health pass). Tier-1 items (Kafka `@protocol`
emission, websocket-mqtt rewrite, security suites, named-union decision)
and the v0.3.0 beta program are DONE — see CHANGELOG `[Unreleased]` and
`[0.2.1-beta]`.

---

## Release

- [ ] **Publish stable v0.3.0** — BLOCKED on maintainer decisions (ship M15
      in 0.3.0 vs 0.4.0; stable timing; NPM_TOKEN rotation). CHANGELOG, tag,
      verify, fresh-install smoke once unblocked. `0.3.0-beta.1` is live on
      npm; everything else in the v0.3.0 plan (Phases 1-3) is green.
- [ ] **`@protocol` on Model never attaches message bindings** — found during
      the M11 rewrite: `attachChannelBindings` looks up
      `ctx.channels[modelName]` (misses models); message bindings only work
      via `@bindings` on the model. Either route model protocolConfigs to the
      message object or warn on dead config.

## Emitter Correctness

All verified still-present in code 2026-08-21:

- [ ] O(n²) operation-type lookup — `src/builders/operation-builder.ts:46`
      spread-allocates `[...operations.keys(), ...channels.keys()]` and
      linear-scans `.find()` per operation; precompute a Set/Map.
- [ ] Unify `registerMessage` (shared-utils.ts) vs `mergeExplicitMessages`
      (`src/builders/message-builder.ts:16`) — two ways to build the same
      message object.
- [ ] Warn on conflicting multi-namespace `defaultContentType` / `apiVersion`
      — currently silent last-wins (`src/document-builder.ts:112`).
- [ ] `ParsedAsyncAPIDocument.asyncapi` comment/type contradiction —
      `src/domain/models/asyncapi-document.ts:363-371`: doc comment says
      `asyncapi` is widened to `string`, the interface declares the literal
      `"3.1.0"`. Fix one of the two.
- [ ] Orphan comment above `SECURITY_SCHEME_TYPES`
      (`src/domain/models/asyncapi-document.ts:278`) describes a removed
      concept ("Security Requirement Object — defined later").
- [ ] Dual export `SCHEME_TYPE_LIST` vs `VALID_SCHEME_TYPES`
      (`src/domain/models/asyncapi-document.ts:298-306`; consumer
      `src/minimal-decorators.ts:37`) — same data, two names; keep one.
- [ ] Document (or change) tag-dedup last-wins semantics in
      `src/builders/tag-builder.ts` — dedup-by-name is commented, but which
      duplicate wins is not stated.
- [ ] Remove unreachable fallback defaults in `storeServerConfig`
      (`src/state-writers.ts:111-124`) — `?? "http"` / `?? localhost:3000`
      branches are dead because validation happens upstream.
- [ ] Replace `as never` casts with honest types —
      `src/builders/message-builder.ts:170-204` (5×) and
      `src/builders/operation-discovery.ts:48,120`.
- [ ] Generalize `pickOpt<T, K>` — `src/builders/components-builder.ts`
      takes `(data: object, keys: string[])`; a generic signature would
      compile-time-check trait field lists.

## Test-Suite Integrity

From the 4-agent review (~130 findings triaged); all below verified
still-present 2026-08-21:

**Deletions / consolidation first (they change what the rewrites look like):**

- [ ] Promote `resolveRef`/`collectRefs` to `test/utils/` — 4 divergent
      copies (`document-structure`, `ref-chain-resolution`,
      `generator-compatibility`, `round-trip-verification`); the
      generator-compatibility copy lacks `~1`/`~0` unescaping (latent false
      pass).
- [ ] Deduplicate `compileAndGetDoc` helpers (2+ copies: `document-structure`,
      `protocol-kafka-comprehensive`) — use `compileAndValidateOrThrow` from
      `test/utils/schema-validator.ts`.
- [ ] Delete `test/compliance/schema-types.test.ts` — ~90% duplicate of
      `type-mapping-completeness.test.ts`.
- [ ] Delete `test/validation/real-world-examples.test.ts` — subsumed by
      `all-examples-validation.test.ts` (and recompiles every fixture per
      assertion group; compile once instead).
- [ ] Delete/delegate `test/validation/schema-validation.test.ts` — copy of
      `utils/schema-validator.ts`.
- [ ] Delete or make real `test/integration/cli-simple-emitter.test.ts` —
      fake CLI wrapper around the programmatic API.
- [ ] Import `LATEST_BINDING_VERSIONS` instead of hardcoding binding-version
      strings (~77 sites across compliance/integration/validation; zero test
      files import it today).

**Under-asserting suites:**

- [ ] `test/integration/asyncapi-generation.test.ts` — "spec compliance"
      checks use the hand-rolled `validateAsyncAPIObjectComprehensive`
      (`test/utils/test-helpers.ts:518`), not real AJV.
- [ ] `test/e2e/error-handling-edgecases.test.ts` — two `≤1 error`
      assertions (lines ~91, ~232) mask real diagnostics; investigate what
      error occurs, tighten to 0.
- [ ] `test/e2e/multi-protocol-comprehensive.test.ts` — headline promises
      bindings, asserts none; also an empty `if (diagnostics.length > 0) {}`
      block.
- [ ] `test/integration/multi-file-output.test.ts` — 9× `as never` option
      casts; use the typed `AsyncAPIEmitterOptions`.
- [ ] `test/external/external-specs.test.ts` — 27 bare `not.toBeNull()`
      smoke assertions under "should handle X" names.
- [ ] `test/integration/decorator-functionality.test.ts` — 635 lines, no
      decorator config ever asserted (worst integration file).
- [ ] `test/integration/protocol-binding-integration.test.ts` — near-zero
      binding assertions anywhere.
- [ ] `test/integration/reusable-components-negative.test.ts` — 2 duplicate
      test names (`invalid-bindings-config`/`invalid-trait-config` for empty
      name).

**Hygiene:**

- [ ] `test/integration/round-trip-verification.test.ts` — module-level
      `doc` (line ~134) set by the first test, read by the rest; convert to
      `beforeAll`.
- [ ] `test/e2e/realworld-ecommerce.test.ts` — protocol diversity via
      substring search on serialized JSON; inspect `servers[*].protocol`
      instead.
- [ ] Replace `require("yaml")` CJS calls with ESM imports — 7 sites across
      4 `test/e2e/` files.
- [ ] `test/decorators/server.test.ts` — hardcoded protocol list; import
      `PROTOCOL_LIST`.
- [ ] `test/benchmark/fixture-generator.ts` — dead `modelsPerChannel` option
      (declared, defaulted, never used); remove or implement.

## Tooling / Environment

- [ ] Reduce LSP/editor diagnostic noise (~1,400 `one-var` warnings + stale
      references to deleted files) — a `test/` tsconfig or tsserver scoping
      would restore signal.
- [ ] Root-cause the transient `bun test` exit-1-with-zero-failures (last
      seen 2026-08-15; suspected race over `coverage/`; clean re-runs pass).
- [ ] Golden-file locks for the rewritten protocol/security suites
      (M11/M12 cover behavior; no byte-level golden) and a named-union
      fixture in an existing golden file.

Post-release (feeds 0.3.1/0.4.0): docs site, v0.4.0 direct-AST spike + memo,
openapi3 EFv2-migration watch. See `docs/planning/2026-08-21_09-04_SUPERB-v0.3.0-CLEAR-WINNER.md`
Phases 4-5 and ROADMAP.md.
