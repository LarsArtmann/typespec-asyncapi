# Status Report — SUPERB Plan Execution: Mixed-Emitter Ownership (M02–M18)

**Date:** 2026-10-03 13:27 CEST
**Session:** continuation of the BuildFlow-failure-recovery session; this phase
executed the plan `docs/planning/2026-10-03_11-53_SUPERB-mixed-emitter-ownership.md`
(committed `d86a0251`, pushed). All work below is committed by the auto-commit
daemon except `scripts/check-examples.ts` (last edit, pending daemon pickup).
**Verification state:** every touched domain has a green targeted suite (mixed
integration 19, route-facts unit 8, issue-252 realworld 3, golden 2, property 1×20
runs, isolation suite, `check-examples` 15/15). The FULL verify gate
(build + lint + typecheck:test + test + coverage + duplicate, cache-cold) has
**NOT** been re-run since the last code edit — that is F64 and is owed before
any release.

## a) Fully done (13 of 23 plan tasks, all autonomous ones except M19/M21)

- **M02 — http route API spike.** Facts recorded: state keys are global
  registry symbols (`Symbol.for("@typespec/http/routes" | "/verbs")`,
  `createStateKeys` in `library.js:17-23`) but hold only EXPLICIT decorations;
  the resolved table comes from `getAllHttpServices` (verified: verb-less
  no-body → GET, with `@body` → POST, `@query` → GET); the compiler AWAITS
  `$onValidate` callbacks (`program.js:512`), so the hook can be async;
  `import "@typespec/http"` alone does NOT materialize the `TypeSpec.Http`
  namespace — only `using` does.
- **M03 — `src/builders/http-route-facts.ts`.** Guarded dynamic import
  (http stays a devDependency), `isHttpLibraryLoaded` moved here (one owner),
  WeakMap-cached per Program, self-owned types (no http types on any exported
  surface). 8 unit tests.
- **M04 — `discoverBareOps` rewire.** Exclusion predicate is now
  facts-first (`isRouted`) with the service-containment heuristic as fallback;
  wired through `DocumentBuildContext.httpRouteFacts` ← `buildAsyncAPIDocument`
  (new optional 5th param) ← `$onEmit` (awaits the facts). Behavior locked by
  existing + new tests.
- **M05 — exact conflict warning.** `validateCrossEmitterUsage` is now async,
  warns only when http actually routes the event op, cites the concrete route
  (`GET /api/v1`), keeps the AsyncAPI-over-http escape and geometry fallback.
- **M06 — `bare-op-assumed-rest` diagnostic.** Emitted at every exclusion;
  cites route with facts, `assumed` message variant (namespace) with fallback.
- **M07 — warning dedupe.** Event-op conflict warnings grouped per
  (service, namespace): one warning + `N more operation(s) in this namespace
  are also affected.`
- **M08 — `bare-op-inference-deprecated` warning.** Fires once per program
  when the fallback excludes in a mixed program; removal target 2.0.
- **M09 — semantics matrix.** 6 new tests: `#suppress` on both new warnings,
  @channel-only ops warn, nested `@service` innermost wins, nearest-ancestor
  server escape order both directions, no-server residual warning (documented
  FP), negative tests assert the doc emitted (F27 convention).
- **M10 — `test/realworld/fixtures/issue-252.tsp` + 3-test suite.** Verbatim
  reporter spec (locks: 2 duplicate-operation errors + 2 of our warnings +
  emission skipped), recommended split (clean doc, zero conflict warnings, one
  `bare-op-assumed-rest` for the REST op), OpenAPI emitter yields NO output for
  the broken layout (upstream evidence, locked).
- **M11 — deep namespace walk.** `collectNonStdNamespaces` recurses with
  stdlib pruning; grandchild bare op discovered (locked). Decided: recursion,
  not a documented limit.
- **M12 — property-based ownership invariants.**
  `test/property/mixed-ownership-properties.test.ts`: 20 random mixed specs
  (seed 20261003, `FC_SEED` override), full oracle — channels == decorated
  events + unclaimed bare ops, every exclusion signaled, conflict warning
  deduped per namespace. Unique per-op `@route`s in the generator avoid the
  upstream duplicate-route abort.
- **M13 — CHANGELOG + FEATURES.** Fixed entry rewritten to route-facts; 6 new
  Added entries; FEATURES diagnostics count 34 → **35 (20 error + 15
  warning)**.
- **M15 + M16 prep — upstream evidence pack.** Http-only (no our-emitter)
  repro matrix; prior-art search on microsoft/typespec found NONE (closest:
  #2463 AsyncAPI POC, #4124 websockets — different topics); draft issue
  written and voice-checked (`0 FAIL, 0 WARN`) at
  `/tmp/typespec-upstream-issue.md` — POSTING GATED on Lars (F50).
- **M17 + F21 — docs.** README new "Mixing with OpenAPI (REST + Events)"
  section (recommended layout, warnings, suppression, deprecation); README
  Validation count fixed (32 → 35); `lib/main.tsp` `@server` doc comment
  documents the AsyncAPI-over-HTTP escape hatch; the locking test
  ("intentional AsyncAPI-over-HTTP servers stay silent") already existed and
  is green (F53 satisfied).
- **M18 — locks.** `test/golden/mixed-rest-events.expected.yaml` + 2-test
  golden lock (full-document byte-lock read from the example file on disk;
  no-REST-leak assertions). `scripts/check-examples.ts` now validates every
  emitted OpenAPI document structurally (3.x version + paths object) and
  cross-checks no AsyncAPI channel leaked into it; 15/15 examples pass.

## b) Partially done

- **AGENTS.md memory:** new architecture bullets (route-facts ownership,
  diagnostics, http-as-devDep rule) + 3 gotchas (blockless relative-resolution
  trap, import-vs-using namespace materialization, http verb fallback +
  emit-skip on duplicate errors) are in. Not yet written: a pointer to the
  property-suite file in the test inventory section.
- **Scratch cleanup:** 6 debug probes trashed during the session;
  `scripts/scratch-http-route-spike.ts` and `scripts/scratch-upstream-matrix.ts`
  are still present (facts extracted, files owed a `trash` before F64 gates —
  they are outside lint/typecheck scope but stale).
- **Website diagnostics reference:** `website/src/content/docs/reference/diagnostics.md`
  still lists 32 codes — the 3 new codes are missing. Discovered while
  surveying for M19; not yet fixed (fits M19/M21 scope).

## c) Not started (remaining plan tasks)

- **M19** website "Mixing with OpenAPI" page + nav entry + README link
  (structure surveyed only; guides live in `website/src/content/docs/guides/`,
  sidebar in `astro.config.mjs:65-85`).
- **M21** harvest into `TODO_LIST.md`/`ROADMAP.md` (2.0 strictness, upstream
  watch, lint-numRuns bump) + annotate the plan file.
- **F64** full gates cache-cold: `BUILDFLOW_NO_RESULT_CACHE=1 buildflow full`,
  `pnpm run verify`, `nix flake check` — OWED, nothing ships before this.
- **M20** eslint 10.12.0 bump — time-gated after 20:08 UTC (now 13:27 CEST /
  11:27 UTC; ~9h remain).
- **M23** worktree cleanup + buildflow main-URL reinstall — gated on the
  BuildFlow baseline WIP landing (foreign session still active).

## d) What went wrong (own failures, no varnish)

1. **I violated documented gotchas I later wrote down.** Three M09 test
   rewrites were caused by the two-blockless trap and by putting `@server` on
   an operation instead of the namespace — both discoverable from AGENTS.md
   before writing. Cost: 3 red runs + 2 debug probes.
2. **My own test hit my own bug's mechanism.** The first "excluded bare ops"
   test used two verb-less ops on the same implicit route → http
   duplicate-operation errors → emission aborted → 0 diagnostics. I should
   have reasoned about route collisions before writing the test (now an
   AGENTS gotcha, but the cycle was avoidable).
3. **Test-authoring sloppiness in the route-facts suite:** blockless
   `namespace Service;` leaving ops in the global namespace (3 failures), a
   blanket `python3` replace that broke a passing test while the `write` tool
   correctly refused a stale overwrite. The stale-file rejection was the tool
   protecting me; the blanket replace was on me.
4. **Two full-suite 30s timeouts cost a diagnosis detour.** They were
   load-flakes (pass in isolation), but I burned two extra full-suite runs to
   prove it. A cheaper check would have been: run the two files in isolation
   FIRST.
5. **Raw `compile()` crash in the upstream scratch** (logger config) and the
   `Response` name colliding with `TypeSpec.Http.Response` in the split test —
   both one-cycle avoidable.
6. **Todo list lagged the work** (batched updates at M08 and M13 instead of
   per-task).
7. **The full gate is still owed** — I verified per-domain but have not run
   `pnpm run verify`/buildflow once this phase. Nothing is broken that I know
   of, but "I ran the affected suites" is not the gate.

## e) What could be better (systemic)

- Check generated/probe specs against known parse traps (blockless paths,
  decorator targets, name collisions with `TypeSpec.Http.*`) BEFORE running.
- Run `pnpm run lint` + `typecheck:test` incrementally per file instead of
  deferring to F64 (lint on the new files has not been exercised; oxlint
  diagnostics shown in-editor were clean, ESLint strictTypeChecked unknown).
- External-comms drafts should ship WITH the ready-to-run `gh` command so the
  gated step is one paste, not a reconstruction.
- The website `reference/diagnostics.md` should be generated from `src/lib.ts`
  (or at least gate-checked against the code count) — hand-maintained counts
  have now drifted twice.

## f) Next tasks (ordered, max 50)

1. `trash scripts/scratch-http-route-spike.ts scripts/scratch-upstream-matrix.ts`
2. Run `pnpm run lint` + `pnpm run typecheck:test` on the new/changed files
3. Run full `pnpm run verify` (build + lint + tests + coverage + duplicate)
4. Cache-cold `BUILDFLOW_NO_RESULT_CACHE=1 buildflow full`
5. `nix flake check`
6. F64: annotate the plan file with execution deltas (annotate, never rewrite)
7. M19: write `website/src/content/docs/guides/mixing-with-openapi.md`
8. M19: add sidebar entry in `astro.config.mjs` (Guides group)
9. M19: link the page from README's new section
10. Add the 3 new diagnostic codes to `website/src/content/docs/reference/diagnostics.md`
11. M21: harvest actionable items into `TODO_LIST.md`
12. M21: add 2.0-strictness + upstream-watch entries to `ROADMAP.md`
13. Refresh FEATURES.md test-count header line after F64 (currently stale "1259")
14. M20 (after 20:08Z): `pnpm -w update eslint@10.12.0` + relock
15. M20: `pnpm install --frozen-lockfile` + lint proofs
16. M23 (after BuildFlow baseline lands): `nix profile remove buildflow && nix profile install <main-url>`
17. M23: `git worktree remove --force /home/lars/projects/.bf-jscpd-worktree`
18. M23: verify buildflow version is clean main
19. M01 (gated): post `gh issue comment 252 --body-file /tmp/issue-252-reply.md`
20. M14 (gated): version decision (recommendation: 1.1.0)
21. F40: `pnpm version 1.1.0`
22. F41: `pnpm install --lockfile-only`
23. F42: `pnpm install --frozen-lockfile` proof
24. F43: full verify cache-cold pre-tag
25. F44: annotated tag `v1.1.0` + push tag
26. F45: watch release.yml + npm provenance check
27. Post-release: comment on #252 with the 1.1.0 shim/upgrade note if needed
28. F50 (gated): post `/tmp/typespec-upstream-issue.md` to microsoft/typespec
29. Watch the upstream issue for maintainer response (add to ROADMAP watch)
30. F62 (gated): write up the 4 BuildFlow findings for handoff
31. Dismiss Dependabot alert #36 on GitHub (server-side click; local
    `ignoreGhsas` does not reach the API)
32. Delete stale npm `alpha` dist-tag via npmjs.com UI (token DELETE → 403)
33. Consider `numRuns` bump for the property suite in CI config (currently 20)
34. Add `mixed-ownership-properties` to the FEATURES.md test inventory section
35. Add AGENTS.md pointer to the property-suite file (see b)
36. Example README cross-link: `examples/mixed-rest-events/README.md` → website page
37. Check `reference/emitter-options.md` for drift (no new options; verify only)
38. Re-run `pnpm run check-examples` after M19 website edits (no code impact, cheap)
39. Verify golden regeneration tooling still matches the new golden naming
    (`scripts/regenerate-golden.ts` unaware of mixed-rest-events expected file —
    regenerate path is manual here; document or add)
40. Sanity: `git log --oneline -20` review of daemon commits for accidental
    noise before tagging
41. Confirm `pnpm-lock.yaml` has no un-aged entries before tag (soak policy)
42. Post-tag: verify npm dist-tags (`latest` → 1.1.0)
43. Post-release: update CHANGELOG `[Unreleased]` → `[1.1.0] - <date>`
44. Post-release: FEATURES.md "Verified" header date + version bump
45. Post-release: website changelog page sync
46. BuildFlow: after baseline lands, re-verify `buildflow full` green on main
    install (not the worktree binary)
47. Consider extracting the ownership oracle in the property test into
    `test/utils/` if a second consumer appears (YAGNI note)
48. Re-check jscpd baseline after F64 (new files: http-route-facts, tests are
    excluded by scope, but verify 0 clones)
49. Roadmap: note the EFv2/EFv1 posture is unchanged by this work (route facts
    are compiler-API only, no asset-emitter import added)
50. Archive this report as done once F64 + M19 + M21 land

## g) Questions I cannot answer myself (blockers → need Lars)

1. **#252 reply timing:** post the current voice-checked draft now (it
   accurately describes shipped behavior), or hold ~1 day and answer with
   "shipped in 1.1.0, warnings now cite exact routes" once M14 runs? The
   reporter has waited since the issue was filed; the draft claims nothing
   about versions, so posting now is safe — but the better answer may be the
   release. Your call.
2. **Version + cutoff:** is 1.1.0 cut after F64+M19+M21 (website page +
   diagnostics reference in the release), or do you want the release first and
   the docs in a fast-follow? (Plan default: release after M13, docs may
   follow — but the diagnostics page drift argues for including it.)
3. **Upstream issue posting:** the draft at `/tmp/typespec-upstream-issue.md`
   carries the unsolicited-AI provenance banner (unchecked) and proposes a
   warning + better duplicate-operation messages. Do you want the proposal
   scoped differently (e.g. linter rule only, or also an opt-out for non-REST
   namespaces) before it goes public under your name?

— end of report. No further work executed; awaiting Lars's decisions.
