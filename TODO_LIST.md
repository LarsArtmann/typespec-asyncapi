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
  - [ ] Register npm trusted publisher — **remaining Lars action**: #298 was
        security-audited (all six action pins verified against official tag
        commits) and merged as 253e4665 on 2026-11-19; release.yml now
        publishes via GitHub OIDC, the expired NPM_TOKEN secret is deleted,
        and the dry-run dispatch (run 44599637231) proved the pipeline.
        One-time manual step on npmjs.com (2FA): package settings → trusted
        publishing → authorize `LarsArtmann/typespec-asyncapi`, workflow
        filename `release.yml`. Then publish 1.2.0 with
        `gh workflow run Release --ref master -f dry_run=false` (NOT a rerun
        of 44529186193 — that run is pinned to the pre-#298 workflow whose
        NPM_TOKEN no longer exists). In the same npmjs.com session: delete
        the `beta` and `alpha` dist-tags (owner retired them 2026-11-19).
  - [ ] Post-publish verification (after the `dry_run=false` dispatch):
        watch the publish job closely (its FIRST live exercise), then
        `npm view @lars-artmann/typespec-asyncapi version` → 1.2.0,
        provenance attestation on the npm page, fresh-install smoke test
        (new project, compile, AJV-validate), dist-tags reduced to
        `latest` only, confirm the prerelease `--tag latest` branch did
        NOT fire (1.2.0 is stable).
  - [ ] ~~Remove the stale `alpha` dist-tag~~ SUPERSEDED 2026-11-19: all three
        dist-tags had been re-pointed at 1.1.0 as "intentional prerelease
        channels", but the owner retired `beta`/`alpha` outright — delete both
        in the npmjs.com UI (the local CLI token is expired; this shares the
        one 2FA session with the trusted-publisher registration above),
        leaving `latest` as the only dist-tag.
  - Resolved en route 2026-09-30 (release blockers fixed before the tag):
    Dependabot bumped package.json without regenerating pnpm-lock.yaml
    (frozen-lockfile CI failure), `typescript` had drifted to ^7.0.2
    (typescript-eslint has no TS 7 support — pinned back to ^6.0.3,
    typescript-eslint held at 8.70.x), jscpd 5.3.3 surfaced 3 pre-existing
    clones (fixed via `InfoOptionalFields`, `ServerConfigData` Pick, and
    `subdirectoryNames` extractions). Gate green at tag time: 1236 tests,
    98.0% coverage, 0 clones.

## Post-Merge Follow-ups (harvested 2026-11-19 from the PR-sweep reports)

- [ ] **PR #295 (import CLI) review track** — draft, deferred until baywet
      marks it ready; then deep-review the ~2100 lines, including the
      `@typespec/openapi3` as-runtime-dependency decision (question posted on
      the PR 2026-11-19). (`docs/status/2026-11-18_23-23_pr-review-sweep-master-red-ci-fix.md` §f.21)
- [ ] **CI alerting on daemon-push failures** — master CI ran red for two
      weeks (2026-11-04→18, jscpd clone in `scripts/generate-brand-assets.ts`)
      because nobody watches daemon-pushed runs; add a workflow-level
      notification (e.g. failed-run → issue/notify) or an external watcher.
      (`docs/status/2026-11-19_07-36_merge-sequence-phase2.md` §f.13)
- [ ] **Property-test seeds for the new 1.2.0 behaviors** — channel-id
      (`data.id ?? data.path`) and derived-variant message expansion have no
      `test/property` generators yet; extend `specArbitrary` in
      `test/property/emitter-properties.test.ts` (compliance/golden cover them
      today). (`docs/status/2026-11-18_23-23_pr-review-sweep-master-red-ci-fix.md` §f.32)
- [ ] **E2E test: `@channel(address, id)` × `split-schemas`** — the channel-ID
      key flows into `$ref` rewriting; no e2e locks the combination.
      (`docs/status/2026-11-18_23-23_pr-review-sweep-master-red-ci-fix.md` §f.33)
- [ ] (repo: fleet) **Daemon-push CI health sweep** — the same blind spot
      (auto-commits pushing without a watcher) may exist in other owned repos;
      one glance per repo at recent master-run conclusions.
      (`docs/status/2026-11-18_23-23_pr-review-sweep-master-red-ci-fix.md` §f.35)

## Dependency & Toolchain Refresh (2026-11-04, harvested from the BuildFlow triage session)

- [ ] **Re-attempt the reverted minor bumps as ONE verified pass** —
      oxlint 1.91.0, vitest 5.1.0, astro ^7.4.5, tailwindcss ^4.3.4,
      @tailwindcss/vite ^4.3.4, astro-og-canvas ^0.13.3, html-validate
      ^11.18.0, hyperframes ^0.9.9. All were reverted 2026-11-04 after
      BuildFlow's `pnpm-update` wrote them into the manifests without a
      lockfile regen (3rd recurrence). Do it deliberately: versions must be
      ≥24h soaked (no `minimumReleaseAgeExclude`), regenerate
      `pnpm-lock.yaml`, run the full gate, `npm ci` in `website/video`, and
      keep `typescript` exact 6.0.3 (`astro check` refuses TS 7).
- [ ] **File the pnpm-update drift upstream in LarsArtmann/BuildFlow** —
      it bumps manifests without regenerating pnpm-lock.yaml and writes
      `minimumReleaseAgeExclude` bypasses (observed 2026-10-03 and
      2026-11-04). `verify-before-filing` + `github-voice` passes first;
      include today's half-written-lockfile evidence (importer `specifier:`
      fields rewritten, package resolutions stale).
- [ ] **Rebuild the BuildFlow binary** (maintainer, other repo) — preflight
      warned the binary was built at `74a9212` while HEAD is ahead:
      `cd ~/projects/BuildFlow && nix build . && nix run .#reinstall`.
- [x] **vulnix toolchain CVEs (binutils, bison, ada, async, …)** — DELIBERATE
      NON-FIX at project level (2026-11-04): these ride the nixpkgs revision
      in `flake.lock`, are build-time-only toolchain packages, and none ship
      in any artifact this repo publishes. Revisit on the next nixpkgs
      channel bump; do not chase per-CVE patches in-repo.

## Mixed-Emitter Ownership Track (harvested 2026-10-03 from the SUPERB plan + 11-20 report §f)

Feature work (route-facts ownership, new diagnostics, docs, locks) is DONE
and gate-green — see `docs/status/2026-10-03_13-27_mixed-emitter-ownership-execution.md`.
What remains is the gated release chain and the tail:

- [x] **Post the #252 reply** — DONE 2026-10-03 on Lars's explicit order:
      [issuecomment-5970180678](https://github.com/LarsArtmann/typespec-asyncapi/issues/252#issuecomment-5970180678)
      (fresh draft, voice-checked 0/0, `--kind comment`; the lost /tmp original
      was unrecoverable and the 13-27 report never contained its text). Draft
      kept at `docs/drafts/issue-252-reply.md`.
- [x] **Release 1.1.0** — DONE 2026-10-03: tagged `v1.1.0` (annotated, commit
      `2d06b977`), pushed, release.yml green, npm `latest` → 1.1.0. The
      pre-tag ritual caught a live manifest re-drift (BuildFlow pnpm-update
      replay overwrote `typescript`/`eslint` pins minutes after a manual
      restore — second occurrence 2026-10-03); restored + committed atomically
      before tagging. Feeds the M22 BuildFlow handoff.
- [x] **⏳ Post the upstream microsoft/typespec issue** — DONE 2026-10-03:
      filed as [microsoft/typespec#12105](https://github.com/microsoft/typespec/issues/12105)
      (NOTICE provenance banner + review ledger ticked; TL;DR asks for an
      implicit-verb warning AND duplicate-operation errors that name the
      operations). Remaining: watch for maintainer response.
- [ ] **⏰ eslint 10.12.0 bump** — after the 20:08 UTC soak on 2026-10-03;
      relock, frozen-lockfile proof, quick lint.
- [ ] **⏰ After the BuildFlow baseline WIP lands** — remove
      `.bf-jscpd-worktree`, reinstall buildflow from the main URL, verify
      version is not `-dirty`.
- [ ] **⏳ BuildFlow upstream handoff** — 4 findings (pnpm-update lockless
      manifest writes; `minimumReleaseAgeExclude` bypasses; result cache can
      replay GREEN over live-RED; `nix profile install` same-URL no-op) plus
      the 5 pre-existing BuildFlow-repo lint issues. Ownership question open
      (file in BuildFlow tracker vs hand to the baseline session).
- [ ] **⏳ crush-config lessons commit** — worktree placement for relative
      replaces; result-cache masking; lossy-grep failures.

## Hygiene (harvested 2026-10-03 from the 11-20 report §f)

- [ ] Watch `http-cache-semantics` for a patched release → remove the
      `ignoreGhsas` entry.
- [ ] Lychee 99 findings triage (mostly sandboxed-network false positives in
      BuildFlow runs; fix or archive genuinely dead links).
- [ ] Evaluate knip adoption for the frozen public API surface.
- [ ] Review nix-checker's 2 remaining info suggestions (cleaner diffs /
      nvfetcher).
- [ ] On-demand sweeps now the gate is green: gitleaks, codespell,
      markdownlint.
- [ ] Add `BUILDFLOW_NO_RESULT_CACHE=1` to the CI final-gate job
      (cache-masking defense).
- [ ] Trash `scripts/ns-test/` (113-byte scratch, not referenced; owner call).
- [ ] Decide `global.out.css` policy (11-20 report g)3).
- [ ] Harmonize AGENTS pin wording (`^6.0.3` prose vs exact `6.0.3` manifest).
- [ ] Note or upstream: website `@astrojs/check` wants TS `^5||^6` while
      website pins TS 7 (Astro-side mismatch, pre-existing).
- [ ] Dependabot watch: config/lockfile divergence pattern recurred 2026-10-03
      (pnpm-update manifest drift); consider a daemon/preflight guard.
- [ ] Consider checkbox templates for ⏰ items so reports aren't the reminder
      system.
- [ ] Docs corpus sweep (2026-11-19): 272 unharvested open items across 99
      reports in `docs/status/` — harvest into TODO_LIST/ROADMAP or annotate
      resolved (docs-health ANNOTATE ritual), then archive per cadence
      thresholds (15 reports / 21 days, currently 99 / oldest 128d).
      `audit_max: 267` in `.docs-gates.json` is the ratchet pin (ratcheted
      from 272 the moment this row landed): NEVER raise it; every future item
      gets an inline verdict or a TODO_LIST/ROADMAP row, and the pin steps
      down as the corpus drains. Source: `docs-gates freshness . --audit-all`
      evidence.
- [ ] Bump `go-finding` to v1.15.1 in `md-go-validator`'s flake.nix (repo:
      md-go-validator — the `ref = "v1.14.0"` pin lives THERE, so
      `nix flake update` here cannot move `website/flake.lock`'s 45-day-old
      `go-finding-src` follow; v1.15.0/v1.15.1 tags exist upstream, verified
      via `git ls-remote` 2026-11-19). Release md-go-validator, then
      `nix flake update md-go-validator` here + `nix flake check` both sides.

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
