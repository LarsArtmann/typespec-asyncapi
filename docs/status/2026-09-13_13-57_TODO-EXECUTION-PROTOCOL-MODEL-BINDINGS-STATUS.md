# Status Update: TODO_LIST Execution — Stale-Triage + `@protocol`-on-Model + Test-Suite Hardening

**Date:** 2026-09-13 13:57 CEST
**Session focus:** Execute the pasted TODO_LIST (Emitter Correctness / Test-Suite Integrity /
Tooling), READ-UNDERSTAND-RESEARCH-REFLECT style, one step at a time, verified by the full
`pnpm run verify` gate.

**Gate at session end:** `pnpm run verify` **PASSED** — build ✓, eslint+oxlint (deny-warnings) ✓,
`typecheck:test` ✓, **1236 tests / 100 files / 0 failures**, coverage gate **98.1% avg (min 75%
per file)**, jscpd **0 clones**. Baseline at session start: 1222 tests / 98 files, all green.

---

## a) FULLY DONE

### Triage (before any code)

<!-- ledger: T-table — execution records -->
<!-- check-rows:ledger -->
| # | Item                                                                  | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| - | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | TODO_LIST staleness discovered                                        | `docs/status/2026-08-21_22-57_STATUS-UPDATE.md` shows a same-day later session had fixed ~20 TODO items but never updated TODO_LIST. Each claim was re-verified in code (grep/view) before removal: `buildTypeNameLookup` Map exists (O(n²) done), no `as never` left in `src/`, no `SCHEME_TYPE_LIST` in src, 4 duplicate test files gone, `test/utils/ref-utils.ts` exists, no `require("yaml")` in test/, `conflicting-*` diagnostics declared + implemented, `buildMessageObject` shared helper exists, `round-trip-verification` already uses `beforeAll`, `external-specs.test.ts` already has structural assertions behind every guard (3-6 value-asserts per test), `asyncapi-generation.test.ts` already uses real AJV (`validateAsyncAPIDocument`), `validateAsyncAPIObjectComprehensive` fully gone. |
| 2 | Post-hoc verified the two claims I had initially trusted without grep | `tag-builder.ts:7` does carry the last-wins comment; `ParsedAsyncAPIDocument.asyncapi` is `string` (contradiction resolved).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### Emitter feature (the Release-section bug)

<!-- ledger: T-table — execution records -->
<!-- check-rows:ledger -->
| # | Item                                                     | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| - | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3 | **`@protocol` on Model never attached message bindings** | FIXED (both TODO options, combined). `attachChannelBindings` now branches on `type.kind === "Model"`: the `binding:` passthrough becomes the model's MESSAGE binding with `bindingVersion` auto-injected and `@bindings`-compatible merge (explicit fields win per protocol key; an existing `$ref` binding wins). Config that cannot attach emits the NEW diagnostic `protocol-model-fields-unplaced` (severity warning): channel/operation-only fields (e.g. kafka `partitions`), binding fields for protocols without message placements (e.g. ws), and bindings on models no operation references (messageId `no-message`). Files: `src/lib.ts` (diagnostic), `src/builders/channel-builder.ts` (`attachModelProtocolBindings`, `modelConfigFieldsWithoutMessagePlacement`), `src/builders/shared-utils.ts` (`injectLatestBindingVersion` extracted, now shared with `buildProtocolBindings`), `src/builders/_imports.ts` (binding-registry re-exports). Locked by new `test/domain/protocol-model-bindings.test.ts` (5 AJV-validated tests: passthrough+version, partitions warning + no channel leak, ws no-message-placement warning, orphan-model `no-message`, `@bindings` merge). |

### Test-suite integrity

<!-- ledger: T-table — execution records -->
<!-- check-rows:ledger -->
| # | Item                                                                          | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| - | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 4 | `LATEST_BINDING_VERSIONS` sweep finished                                      | Remaining ~34 hardcoded version sites across 9 files converted (compliance reusable-components + protocol-bindings, integration new-protocol-bindings / multi-namespace-isolation / reusable-components-negative, golden reusable-components, e2e realworld-ecommerce + multi-protocol-comprehensive, unit binding-placement + binding-field-validation). Deliberate older-than-latest explicit-passthrough fixtures (kafka `0.4.0` ×2, shared-utils `0.4.0`) kept as literals ON PURPOSE — they prove an explicit version survives without being overwritten.                                                           |
| 5 | `decorator-functionality.test.ts` strengthened                                | Multi-`@protocol` test now locks amqp channel-binding passthrough (exchange/routingKey/deliveryMode + latest bindingVersion) and mqtt operation-binding passthrough (topic/qos/retain + bindingVersion) incl. placement routing (mqtt has NO channel binding → operation). JWT test fixture gained `@operationSecurity(#{ name: "jwtAuth" })` and now asserts the operation `security` `$ref` + full scheme shape; OAuth2 test asserts `tokenUrl`/`authorizationUrl` and normalized `availableScopes` per flow.                                                                                                          |
| 6 | `protocol-binding-integration.test.ts` headline tests deliver                 | The four "with bindings"-named tests now configure `@protocol` on fixtures and assert emitted binding objects (kafka partitions/replicas, ws headers/query, http operation `method`) with registry-sourced `bindingVersion`. 11/11 pass.                                                                                                                                                                                                                                                                                                                                                                                 |
| 7 | Property suite P2/P5 deepened + generators widened                            | P2 asserts exact emitted values AND ordering (minimum/maximum, minLength/maxLength, and minItems/maxItems — which the generator previously generated but never rendered; array fields added). P5 now verifies the split-schemas rewrite itself: zero unrewritten `#/components/schemas/*` refs in the main doc, every `schemas/<Name>` ref resolves to an emitted file, every ref inside a split file resolves within it (pointer-exists). Generators produce model→model `$ref` graphs (payload references next model) and array fields, so P1/P3/P5/P6 exercise multi-model documents. 6/6 pass under the pinned seed. |
| 8 | Golden-file locks added                                                       | `test/golden/lock-fixtures.test.ts` byte-locks three previously-unlocked outputs: named-union `oneOf` (`TextContent                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 9 | `test/decorators/server.test.ts` PROTOCOL_LIST + benchmark `modelsPerChannel` | Confirmed already done (marked `[x]` in TODO; spot-checked).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

### Tooling / docs

<!-- ledger: T-table — execution records -->
<!-- check-rows:ledger -->
| #  | Item                    | Result                                                                                                                                                                                                                                                                                                             |
| -- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 10 | Editor tsserver scoping | `test/tsconfig.json` (extends `tsconfig.test.json`) added — nearest-tsconfig rule stops inferred-project noise for test files. `one-var` was ALREADY off in `.oxlintrc.json` (the ~1,400 warnings were editors not using project config). vtsls restart here still served cached diagnostics — documented, see c). |
| 11 | Dead code               | Deleted orphaned `test/utils/cli-test-helpers.ts` (zero importers since the fake-CLI test was removed).                                                                                                                                                                                                            |
| 12 | Docs updated            | TODO_LIST.md rewritten (done items removed, residuals kept with evidence), CHANGELOG `[Unreleased]` (1 Fixed / 2 Added / 5 Changed entries), AGENTS.md (test/tsconfig, golden locks inventory, 14 examples, `@protocol`-Model routing in the placement-mapping bullet).                                            |

### Examples

<!-- ledger: T-table — execution records -->
<!-- check-rows:ledger -->
| #  | Item                                 | Result                                                                                                                                                                                                                                                                                                                                                                      |
| -- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13 | Examples for the 3 newest decorators | `examples/schema-extensions/` (main.tsp, tspconfig.yaml, README.md): `@jsonSchemaExtension` (pattern/minimum/multipleOf/examples/additionalProperties), `@encodedName` (`Payment-Id` wire key), `@extension` at document root / operation / message. `pnpm run check-examples`: **14/14 PASS**, and the emitted YAML was grep-verified to contain every decorator's effect. |

---

## b) PARTIALLY DONE

<!-- ledger: what-got-done table — execution records -->
<!-- check-rows:ledger -->
| Item                                                  | What got done                                                                                                                                                                                                         | What remains                                                                                                                                                                                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Property-suite generator breadth                      | model→model `$ref` links + array fields + constraint-value assertions (P2/P5 now honest to their names)                                                                                                                    | Unions of models, inheritance, generics, channel parameters still only covered by the compliance suite; `specArbitrary` could be extended further                                                                                      |
| `bun test` / vitest transient exit-with-zero-failures | Observed ONE live occurrence this session (`vitest run test/golden/` → "7 failed / no tests", immediate re-run passed, then 3/3 stable). Confirmed the defensive `rm -rf coverage` already exists in `test:coverage`. | Root cause unknown — needs a captured failing run (CI logs / `--reporter=verbose` on failure)                                                                                                                                          |
| LSP diagnostic noise in `test/`                       | `test/tsconfig.json` scopes tsserver for workspace editors; `one-var` already off                                                                                                                                     | The embedded vtsls instance kept serving stale inferred-project diagnostics even after `lsp_restart` (15 phantom `Cannot find name 'describe'` errors while `tsc -p tsconfig.test.json` reports 0) — unfixable from inside the session |
| TODO_LIST triage depth                                | All removed items were code-verified; the 08-21 22:57 report's own residual list (f) items) partially absorbed                                                                                                        | The historical status reports I executed from are still unannotated (docs-health ANNOTATE pass not run — their open items now partially closed by this session)                                                                        |
| Docs freshness after adding the 14th example          | AGENTS.md, CHANGELOG.md, TODO_LIST.md updated; FEATURES.md example-count drift FIXED on sight during this report (line 164 said "13")                                                                                 | examples/README.md has no count to update (verified); did not re-audit other FEATURES.md counts                                                                                                                                        |

---

## c) NOT STARTED

~~1. **Publish stable v0.3.0** — BLOCKED on maintainer decisions (M15 in 0.3.0 vs 0.4.0; NPM_TOKEN~~ done — resolved — the release train shipped through v1.2.0 (OIDC flow)
   rotation; stale `beta` dist-tag). Untouched by design.
2. v0.4.0 direct-AST spike + memo (ROADMAP). **→ ROADMAP §3 Architecture (EFv1 direct-AST row)**
~~3. Docs site (Astro + Starlight) (ROADMAP).~~ done — shipped — the Astro+Starlight website is live
4. openapi3 EFv2-migration watch (ROADMAP). **→ ROADMAP §3 Architecture (EFv1 containment / openapi3 watch)**
~~5. Mutation tests for the reusable-components builder pipeline.~~ **NOT-DO — mutation tests never added.**
~~6. CI check that regenerates `generated-bindings.ts` and fails on diff drift.~~ **NOT-DO — regen drift check never added.**
~~7. Benchmark for the O(1) operation-type lookup (old f)18) — the O(n²) fix predates this session.~~ **NOT-DO — O(1) benchmark never added.**
~~8. Annotating `docs/status/2026-08-21_22-57_STATUS-UPDATE.md` items now closed by this session.~~ done — that report is annotated in this sweep

---

## d) TOTALLY FUCKED UP!

Nothing permanently broken — final gate is fully green — but this session's mistake list is
longer than I'd like, all recovered:

~~1. **The version sweep went through FOUR failure classes before it was right:**~~ **NOT-DO — lesson recorded — the sweep protocol now mandates emit-keys-first.**
   a) Replaced `bindingVersion: "0.5.0"` (quoted TypeSpec string) with UNQUOTED `${...}`
   interpolation → `0.5.0` is not a valid TypeSpec literal → `token-expected` parse errors
   across 7 fixtures. Quotes had to be restored around every template interpolation.
   b) Interpolated `${...}` into PLAIN JS object literals (binding-placement,
   binding-field-validation) where template syntax is invalid → re-fixed to bare
   `LATEST_BINDING_VERSIONS.ws`.
   c) Inserted the new import INSIDE a multi-line `import type {` block
   (compliance/reusable-components) → TS1003.
   d) A global replace ate the `bindingVersion:` key prefix on 5 lines of
   new-protocol-bindings.test.ts, and the loop fixture got the WRONG protocol constant
   (`ros2` instead of `[protocol]`) — repaired line-by-line with index assertions.
   **Lesson:** should have decided quoting/context strategy UP FRONT and typechecked after
   each file, not after all nine.
~~2. **Shell heredoc `\$` escaping silently broke Python regexes** (mvdan/sh strips `\$` even in~~ **NOT-DO — lesson recorded.**
   quoted heredocs) — the quote-restore pass matched 0 files twice while looking correct.
   Wasted two round trips; worked around with `re.escape` + character classes.
~~3. **pnpm node_modules wedged mid-session** (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`) after~~ **NOT-DO — lesson recorded.**
   concurrent `nix develop` pnpm invocations — recovered with `CI=true pnpm install`. Self-
   inflicted by running vitest in background + foreground simultaneously.
~~4. **Introduced 2 jscpd clones in `channel-builder.ts`** (import block duplicated from~~ **NOT-DO — lesson recorded.**
   shared-utils; version-inject `if` block copied verbatim) — the FINAL gate caught it, but I
   knew the project's 0-clone gate existed and should have checked duplication BEFORE running
   the 2-minute gate. Fixed via `_imports.ts` re-exports + shared `injectLatestBindingVersion`.
~~5. **`@protocol` Model tests initially declared the model twice** (`model X {...}` + a second~~ **NOT-DO — lesson recorded.**
   `@protocol(...) model X;`) → `duplicate-symbol` — decorators belong ON the declaration.
~~6. **Test destructure bug** (`doc` vs the helper's actual `document` key) cost a run.~~ **NOT-DO — lesson recorded.**
7. **P5 needed 4 iterations** (collectRefs returns ALL refs incl. channel/message; split-file
   lookup key is `Name.ext` without the `schemas/` prefix — multi-file-output.test.ts already
   showed the format; I only grepped it after failing). Should have read the existing split
   assertions FIRST.
~~8. **Forgot FEATURES.md** when adding the 14th example — drift found and fixed during THIS~~ **NOT-DO — lesson recorded.**
   report (line 164).
~~9. **Two claims trusted without grep** during triage (tag-builder comment, asyncapi type) —~~ done — adopted — trust-but-verify is the docs-health canon
   both turned out true, but that's luck, not process; verified post-hoc during this report.

---

## e) WHAT WE SHOULD IMPROVE

~~1. **Bulk-edit protocol:** for any mechanical multi-file sweep, write the transform as a~~ **NOT-DO — lesson recorded.**
   committed script (or at least a temp file, not heredocs), decide string-context handling
   per language (TypeSpec source vs TS object vs TS template literal), and run
   `tsc -p tsconfig.test.json` after EACH file — vitest alone hides syntax errors poorly.
~~2. **Read the existing assertion pattern before writing new assertions** — P5's key format and~~ done — adopted — read-before-write is protocol
   the binding-assertion helpers already existed in multi-file-output / protocol-bindings.
~~3. **Check the duplication gate between edits and gate-run**, not only at the end — jscpd runs~~ done — adopted — mid-edit gate checks in this sweep
   in ~400 ms; the verify gate runs 2+ minutes.
~~4. **Trust-but-verify with a checklist:** when closing ~20 stale TODO items by grep, record the~~ done — adopted — the sweep records grep evidence per item
   grep result per item (a table), so "verified" is auditable instead of narrative.
~~5. **Never run two pnpm processes against one workspace concurrently** — background + foreground~~ **NOT-DO — lesson recorded.**
   `nix develop -c pnpm exec` wedged the store once already.
~~6. **The vtsls embedded-LSP cache is unusable for test/ verification** — AGENTS.md already says~~ done — adopted — AGENTS.md already mandated it; followed here
   trust `tsc`; consider silencing vtsls diagnostics for `test/` in Crush config so phantom
   errors stop polluting context windows.
~~7. **Golden regeneration should be scripted** — today I used a throwaway generator; extend~~ done — adopted — regenerate-golden.ts is the canonical script
   `scripts/regenerate-golden.ts` to cover ALL `test/golden/*.expected.yaml` fixtures.
~~8. **Status-report hygiene:** the 08-21 22:57 report fixed ~20 items without touching~~ done — adopted — status-report hygiene practiced in this sweep
   TODO_LIST, and this session executed more items without annotating that report — each
   session should close its own loop (TODO_LIST + report annotation) before ending.

---

## f) Up to 50 Things We Should Get Done Next

### Immediate (next session)

~~1. Extend `scripts/regenerate-golden.ts` to regenerate ALL `test/golden/*.expected.yaml`~~ done — shipped — regenerate-golden.ts covers all goldens
   fixtures; commit it so golden updates are one command.
~~2. Annotate `docs/status/2026-08-21_22-57_STATUS-UPDATE.md` items closed by this session~~ done — annotated in this sweep
   (docs-health ANNOTATE, inline `done at <hash>`).
~~3. Add a regression test locking the NEW `@protocol`-on-Model behavior against a channel/model~~ done — locked — the @protocol-on-Model behavior is golden/test locked
   NAME COLLISION (model named like a channel address — old accidental leak path).
~~4. Add `no-message` messageId assertion (not just code/message) in~~ done — covered — the no-message warning is asserted
   protocol-model-bindings.test.ts via the raw compile helper.
~~5. Verify `validateBindingFields` coverage for message bindings produced by `@protocol` on~~ done — covered — binding-field validation includes message bindings
   Model (field validation is currently NOT applied on this path — parity with the
   channel/operation path, but worth an explicit decision + test).
6. Capture the transient vitest "no tests" failure: add a retry-with-logs wrapper or CI artifact **→ TODO_LIST Test-Suite Integrity (transient bun/vitest flake row)**
   on first failure.
~~7. Decide vtsls handling for `test/` (silence diagnostics in editor config vs leave documented).~~ done — resolved — test/tsconfig.json + test/tsconfig.json editor scoping shipped
~~8. Sweep `FEATURES.md` remaining counts against code (this session fixed only the example count).~~ done — resolved — counts derive now
~~9. Add the `schema-extensions` example to any docs/README example inventory if one exists~~ done — the example exists and CI-validates
   beyond FEATURES/AGENTS.
~~10. Run a focused `tsc --strict` probe on the NEW code paths~~ **NOT-DO — strict probe never run.**
    (`attachModelProtocolBindings`, `injectLatestBindingVersion`) to see what the relaxed
    tsconfig hides.

### Short-term (this week)

11. Extend property generators: unions of models in operation returns. **→ TODO_LIST Test-Suite Integrity (property-suite breadth row)**
12. Extend property generators: `extends` inheritance chains. **→ TODO_LIST Test-Suite Integrity (property-suite breadth row)**
13. Extend property generators: generic instantiations (`Page<T>`). **→ TODO_LIST Test-Suite Integrity (property-suite breadth row)**
14. Extend property generators: channel address parameters (`{id}`). **→ TODO_LIST Test-Suite Integrity (property-suite breadth row)**
15. Add `injectLatestBindingVersion` unit tests (missing-version, explicit-version,
    no-binding-schema protocol).
~~16. Test `modelConfigFieldsWithoutMessagePlacement` directly (unit) for each protocol variant.~~ **NOT-DO — dedicated unit tests never added.**
~~17. Consider routing more `@protocol` fields on Model to message-legal equivalents instead of~~ **NOT-DO — never unit-tested directly.**
    warning (needs design decision, see g)1).
~~18. Wire the conflict-warning diagnostics (`conflicting-default-content-type`/`-api-version`)~~ done — shipped — the conflict diagnostics fire in $onValidate (AGENTS.md mixed-emitter note)
    into the same test style as the new domain tests (raw-compile + messageId assertions).
~~19. Add a test asserting model-branch `@protocol` does NOT touch `channel.bindings` even when a~~ done — covered — the model branch is tested not to touch channel bindings
    channel address equals the model name (regression guard for the removed coincidence leak).
~~20. Split-schemas: property-test inner files also for yaml format (P5 currently locks json).~~ **NOT-DO — yaml property-test never added.**
~~21. Add mutation-style checks: flip one constraint in a golden expected.yaml and confirm the~~ **NOT-DO — mutation-style checks never added.**
    golden test fails (one-off sanity, then revert).
~~22. Document `protocol-model-fields-unplaced` in the decorator docs/README decorator table.~~ done — documented — AGENTS.md protocol-model-fields-unplaced note
~~23. Confirm `@protocol` on Model appears in `FEATURES.md` (new capability row if the table lists~~ done — FEATURES carries the capability
    decorator behaviors).
~~24. Audit remaining `as` casts in `test/` that are NOT mock casts (relaxed tsconfig hides some).~~ **NOT-DO — test-cast audit never done.**
~~25. Add `test/tsconfig.json` mention to the onboarding/README dev-setup section.~~ done — documented — AGENTS.md test-suite note

### Mid-term (this release cycle)

26. Root-cause the transient runner exit (needs captured failure; instrument CI). **→ TODO_LIST Test-Suite Integrity (transient bun/vitest flake row)**
~~27. Property suite: fold compliance-grade assertions into P1 (schema-shape invariants, not just~~ **NOT-DO — P1 kept lean.**
    AJV validity).
~~28. Golden locks for security-suite outputs beyond `server-security` (oauth2 flows byte-lock).~~ done — covered — security goldens + the oauth2 flows test
~~29. Golden lock for `split-schemas` main document (multi-file output byte-level).~~ done — covered — the split-schemas e2e locks the main document
~~30. Split the golden compare helper (`compileAndParse`) into `test/utils/` if a 4th golden file~~ **NOT-DO — helper stayed inline.**
    needs it (today it's file-local to avoid premature abstraction).
~~31. Decide the `cli-test-helpers.ts` replacement policy: delete the "CLI-compatible wrapper"~~ done — resolved — cli-test-helpers policy settled (kept, documented)
    AGENTS.md mention (test helpers section) if it's gone.
~~32. Review `@encodedName` + `@jsonSchemaExtension` interaction (encoded key AND extension on~~ **NOT-DO — interaction never tested.**
    same property — ordering, merge).
~~33. Performance: bench the sweep-affected builder path (attachChannelBindings iterates raw map~~ **NOT-DO — bench never added.**
    now) — confirm no regression on large specs.
~~34. Add CI job running `check-examples` with `--reporter=dot` to shorten logs (14 examples now).~~ **NOT-DO — reporter never changed.**
~~35. Evaluate property-suite seed rotation policy (pin per-release vs fixed forever).~~ **NOT-DO — seed stays pinned by design.**
~~36. Coverage: route `attachModelProtocolBindings` under mutation testing once mutation infra~~ **NOT-DO — mutation infra absent.**
    exists.
~~37. Update the competitive-analysis doc with the new Model-target `@protocol` capability (the~~ done — documented — AGENTS.md carries the Model-target @protocol capability
    competing `tsp-asyncapi` lacks it).
~~38. CHANGELOG: prepare `0.3.0-beta.2` notes draft from `[Unreleased]`.~~ done — superseded — releases shipped through 1.2.0
~~39. Docs site: include the new example as a live demo page.~~ **NOT-DO — live demo page never added.**
~~40. `TODO_LIST.md`: revisit after release-unblock — residuals may reshuffle.~~ done — continuous — the sweep revisits TODO_LIST

### Park (backlog hygiene)

~~41. Annotate remaining pre-08-22 status reports whose items are now closed.~~ done — being done by this sweep
~~42. Consider a `pnpm run verify:fast` (skip coverage) for inner-loop use.~~ **NOT-DO — verify:fast never added.**
~~43. Consider jscpd include of `test/utils/` (currently src+scripts only) to keep test helpers~~ **NOT-DO — include never extended.**
    deduped too.
~~44. Add `#extension`/`@extension` merge-order test at message level (outermost-wins documented~~ done — covered — merge-order documented and tested (AGENTS.md outermost-wins)
    for schemas; message path used `Object.assign` — order semantics worth locking).
~~45. Evaluate replacing the temp-file golden generator pattern with a vitest `-u`-style update~~ **NOT-DO — vitest -u pattern never adopted.**
    mode for goldens.
~~46. `test/tsconfig.json`: consider adding `../vitest.config.ts` to include so the root config~~ **NOT-DO — include never extended.**
    file also typechecks under test settings.
~~47. Sweep `docs/` claims that mention "13 examples".~~ done — resolved — 14 examples now; counts derive
48. Add error-path test: `@protocol` on Model with INVALID binding field values (message path
    currently bypasses the field validator — decides whether to add validation).
49. Consider exporting `attachModelProtocolBindings`-related types from `shared` for downstream
    emitters (only if the shared module contract needs it).
50. After v0.3.0 unblock: fold this session's emitter change into the release notes (it's
    user-visible: new warning diagnostic + new message-binding capability).

---

## g) Questions I Cannot Figure Out Myself

~~1. **`@protocol` on Model — warn-only vs route-deeper:** currently only the `binding:` passthrough~~ done — settled — the warn-only path shipped (protocol-model-fields-unplaced)
   lands on the message and protocol-specific fields (mqtt `qos`/`retain`, ws `headers`/`query`,
   kafka `partitions`/`replicationFactor`/`consumerGroup`) are warned as unplaced. Do you want
   future routing of any of those to message-legal equivalents (where the binding spec allows),
   or is warn-only the intended long-term semantics for Model targets?
~~2. **Golden regeneration workflow:** should `scripts/regenerate-golden.ts` become the single~~ done — settled — regenerate-golden.ts is the single canonical flow
   committed regenerator for ALL `test/golden/*.expected.yaml` (my recommendation), or do you
   prefer golden files to be hand-curated so regeneration is always a deliberate, reviewed diff?
~~3. **v0.3.0 release prep despite the BLOCK:** the `@protocol`-on-Model routing + new warning~~ done — settled — v0.3.0 shipped through the release train
   diagnostic are user-visible and now sit in `[Unreleased]`. Do you want me to stage
   `0.3.0-beta.2` (tag, publish, smoke) with these changes, or does the M15-in-0.3.0-vs-0.4.0 /
   NPM_TOKEN decision gate ALL release motion until you unblock it?

---

_Last commands run: `pnpm run verify` — **PASSED** (1236 tests, 0 failures, 0 clones, 98.1% avg
coverage, lint 0/0, typecheck:test 0 errors). `pnpm run check-examples` — **14/14 PASS**._
