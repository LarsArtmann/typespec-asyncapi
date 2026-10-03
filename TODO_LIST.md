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

- [x] **Release v1.0.0 — SHIPPED 2026-09-30** (tag `v1.0.0`, npm `latest` +
      `beta` dist-tags, provenance attested — sigstore logIndex 3009748579,
      GitHub release created; verified from a clean registry install: fresh
      project, spec compiles, output AJV-valid against the official
      AsyncAPI 3.1.0 schema):
  - [x] Decision: semver commitment — freeze public API (30 decorators,
        EmitterOptions, output contract, `./shared`); retitle ROADMAP's
        v0.4.0 direct-AST rewrite as the internal-only 1.1.0
  - [x] CHANGELOG 1.0.0 entry (fold `[Unreleased]`) + package.json bump
  - [x] README de-beta-ification + stability statement
  - [x] Tag `v1.0.0` → provenance workflow; fresh-install smoke test
  - [ ] NPM_TOKEN rotation + update the GitHub publish secret (maintainer;
        current token still works — the 1.0.0 publish succeeded — but was
        flagged for rotation before the beta)
  - [ ] Remove the stale `alpha` dist-tag (0.0.1-alpha.2) — `npm dist-tag rm`
        returns 403 with the local token (registry DELETEs restricted); do it
        from the npmjs.com package settings page. `beta` was re-pointed at
        1.0.0 via `npm dist-tag add` (the `set` form 400s).
  - Resolved en route 2026-09-30 (release blockers fixed before the tag):
    Dependabot bumped package.json without regenerating pnpm-lock.yaml
    (frozen-lockfile CI failure), `typescript` had drifted to ^7.0.2
    (typescript-eslint has no TS 7 support — pinned back to ^6.0.3,
    typescript-eslint held at 8.70.x), jscpd 5.3.3 surfaced 3 pre-existing
    clones (fixed via `InfoOptionalFields`, `ServerConfigData` Pick, and
    `subdirectoryNames` extractions). Gate green at tag time: 1236 tests,
    98.0% coverage, 0 clones.

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

## Release Hardening (harvested 2026-09-30 from post-1.0 status report)

- [ ] **Branch protection on master requiring green CI** — the Dependabot
      "21 updates" PR failed its own CI (frozen-lockfile mismatch) and was
      merged anyway; master CI then stayed red 09-24 → 09-30 (5 runs) until
      the v1.0.0 release work fixed the lockfile. GitHub settings change, ~10
      min.
- [ ] **Release preflight script** (`scripts/release-preflight`):
      `pnpm install --lockfile-only && pnpm install --frozen-lockfile &&
  pnpm run verify` + clean-tree check — one command before tagging, so a
      green gate measures the dependency set CI will install (tonight's
      stale-node_modules false-green).
- [ ] **Track typescript-eslint#10940 → un-pin deliberately** — typescript
      (^6.0.3) and typescript-eslint (8.70.x) must be un-pinned TOGETHER in
      one PR when TS 7 support lands; decline Dependabot bumps of either
      until then (8.71.0 hard-blocks TS 7).
- [ ] **Website 1.0 truth-sync** — `website/src/content/docs/changelog.md`
      ("Current status") still tells the beta story; full docs-content pass
      for 1.0.
- [ ] **Announce 1.0.0** (XYD thread / TypeSpec community) — sequencing
      question open: announce now vs bundle with the #2463 proposal (see
      `docs/status/2026-09-30_04-39_POST-1.0.0-RELEASE-STATUS.html` §G).
- [ ] **Daemon guard for toolchain files** — auto-commits of
      package.json/tsconfig/pnpm-lock.yaml should pass at least a build
      before committing (the TS 7 drift entered via a 151-file auto-commit).
- [ ] **Provenance verification instructions in README** — how consumers
      verify the npm attestation.

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
- [ ] **Release/upstream interplay** — flipped 2026-09-30: ship v1.0.0
      FIRST, then post the proposal ("adopt a proven 1.0" beats "beta seeking
      verdict"). Do not block the tag on D1.

Post-release (feeds 0.3.1/0.4.0): docs site, v0.4.0 direct-AST spike +
memo, openapi3 EFv2-migration watch. See
`docs/planning/2026-08-21_09-04_SUPERB-v0.3.0-CLEAR-WINNER.md`
Phases 4-5 and ROADMAP.md.
