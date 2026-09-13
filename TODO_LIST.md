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

## Upstream Adoption (from 2026-09-13 plan)

Source of truth for this track:
`docs/planning/2026-09-13_13-48_SUPERB-UPSTREAM-ADOPTION-PATH.md`
(analysis: `docs/analysis/upstream-merge-into-microsoft-typespec.md`).
P4/P5 migration tasks stay in the plan (gated on a YES) until D1 resolves.

- [ ] **Baseline evidence snapshot** — verify gate green, exact test/coverage
      counts, pinned versions; blocks the proposal (T01).
- [ ] **Draft + post decision-forcing proposal on microsoft/typespec#2463**
      — evidence, differentiators, scope offer A(full)/B(minimal 3.1 core),
      maintenance commitment, direct question; `verify-before-filing` +
      `github-voice` passes before posting; ping bterlson/mikekistler/
      timotheeguerin + mario-guerra/fmvilas (T02-T03).
- [ ] **14-day response watch → D1 verdict** — day-7 follow-up if silent,
      day-14 decision routes P4 (yes) or fallback (no) (T04).
- [ ] **Verified comparison vs `tsp-asyncapi`** — install both, compile same
      specs, AJV both outputs against AsyncAPI 3.1; factual tone only (T05).
- [ ] **Killer demo spec + annotated output** — kafka + polymorphism +
      versioning + split-schemas; Studio render (T06, video T07 optional).
- [ ] **Pre-alignment dry-run (scratch branch, merge nothing)** —
      `gen-extern-signature` over 30 decorators, `library-linter`,
      `api-extractor`; produce remediation memo (T12, coverage memo T13).
- [ ] **typespec.io third-party listing** — the "no" fallback; PR/issue to
      their docs (T10, README section T11).
- [ ] **Stable v0.3.0 release interplay** — keep blocked while D1 pending;
      unblock immediately if "no" (T14, ties into Release section above).

Post-release (feeds 0.3.1/0.4.0): docs site, v0.4.0 direct-AST spike +
memo, openapi3 EFv2-migration watch. See
`docs/planning/2026-08-21_09-04_SUPERB-v0.3.0-CLEAR-WINNER.md`
Phases 4-5 and ROADMAP.md.
