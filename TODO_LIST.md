# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

Originally harvested from the 2026-08-14 full code review
(`docs/reviews/archived/2026-08-14_full-code-review.html`), re-verified
against code 2026-08-21 (docs-health pass) and again 2026-09-13 (this
session, which also executed the remaining emitter/test items — see
CHANGELOG `[Unreleased]`). The 2026-08-21 22:57 cleanup session had fixed
~20 items whose TODO entries were stale; all were verified in code before
removal.

---

## Release

- [ ] **Publish stable v0.3.0** — BLOCKED on maintainer decisions (ship M15
      in 0.3.0 vs 0.4.0; stable timing; NPM_TOKEN rotation; stale `beta`
      dist-tag still points at `0.2.1-beta`). CHANGELOG, tag, verify,
      fresh-install smoke once unblocked. `0.3.0-beta.1` is live on
      npm; everything else in the v0.3.0 plan (Phases 1-3) is green.

## Test-Suite Integrity (residual)

- [ ] Property-suite generator breadth — generators now cover model→model
      refs, arrays with min/maxItems, enums, and constraint ordering, but
      unions of models, inheritance, generics, and channel parameters are
      still only covered by the compliance suite. Consider extending
      `specArbitrary` in `test/property/emitter-properties.test.ts`.
- [ ] Root-cause the transient `bun test` / vitest exit-with-zero-failures
      (suspected worker/coverage race; last observed 2026-09-13 once in
      `vitest run test/golden/` — immediate re-run passed). The defensive
      `rm -rf coverage` already exists in `test:coverage`; needs a captured
      failing run to diagnose.

## Tooling / Environment

- [ ] vtsls still serves stale inferred-project diagnostics for `test/`
      after restart in some sessions; `test/tsconfig.json` (added 2026-09-13)
      scopes tsserver correctly for workspace editors — trust
      `tsc -p tsconfig.test.json` meanwhile (see AGENTS.md).

Post-release (feeds 0.3.1/0.4.0): docs site, v0.4.0 direct-AST spike +
memo, openapi3 EFv2-migration watch. See
`docs/planning/2026-08-21_09-04_SUPERB-v0.3.0-CLEAR-WINNER.md`
Phases 4-5 and ROADMAP.md.
