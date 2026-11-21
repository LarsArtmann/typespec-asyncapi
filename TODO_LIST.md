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
  - [ ] ADR npm-surface decision (`docs/adr/0002`): trademark posture + npm
      package surface — the last open row there; unblocks README and
      release-checklist work (docs/status/2026-11-04_17-42:134).
- [ ] Verify the npm package page renders the README `<picture>` logo
      after the next publish; add a raster fallback if npm strips it
      (docs/status/2026-11-02_01-20:231).
- [ ] Provenance verification instructions in the README — how consumers
      verify sigstore/provenance on the package
      (docs/status/2026-10-03_13-58:332).
- [ ] Register npm trusted publisher — **remaining Lars action; SECOND
        failed publish 2026-11-21**: v1.3.0 was tagged and pushed (commit
        b27d8690, release run 44853401675 — verify GREEN, publish E404 on
        PUT, provenance signed: sigstore logIndex 4030901917; tracked in
        #301 with the full diagnosis). Same failure mode as the 2026-11-19
        v1.2.0 dispatch (run 44603780129): OIDC exchange works, the registry
        rejects the package write. GitHub side is verifiably correct (repo,
        default branch, workflow filename `release.yml`, `id-token: write`,
        NO `environment:` on the job), so the mismatch is in the npmjs.com
        registration: check it reads EXACTLY repository
        `LarsArtmann/typespec-asyncapi`, workflow filename `release.yml`,
        environment EMPTY (a registered environment the job does not declare
        is the classic E404-on-PUT cause). Recovery once registered (npm
        requires the first authorized publish within 2 days of
        registration): `gh workflow run Release --ref master -f dry_run=false`
        — master is at 1.3.0, so the dispatch publishes 1.3.0. In the
        same npmjs.com session: delete the `beta` and `alpha` dist-tags
        (registry still shows all three at 1.1.0 on 2026-11-21).
        Status comment on #297: issuecomment-7020669604.
  - [ ] Post-publish verification (after the recovery dispatch): watch the
        publish job (two failed live exercises so far — 2026-11-19 dispatch,
        2026-11-21 v1.3.0 tag push — see the registration item above), then
        `npm view @lars-artmann/typespec-asyncapi version` → 1.3.0,
        provenance attestation on the npm page, fresh-install smoke test
        (new project, compile, AJV-validate), dist-tags reduced to
        `latest` only, confirm the prerelease `--tag latest` branch did
        NOT fire (1.3.0 is stable), and MANUALLY create the v1.3.0 GitHub
        Release (the `github-release` job is push-event-only and the tag's
        run already consumed its chance): `gh release create v1.3.0` from
        the CHANGELOG 1.3.0 section, attaching the verified tarball
        (`gh run download 44853401675 -n npm-package` or re-pack). v1.2.0's
        release stays as the GitHub-only record of what shipped there.
        FINALLY deploy the website (`nix run .#deploy-website`): its
        hero/FAQ/stats already say v1.3.0 and were verified locally, but
        deploying before the npm publish would advertise a version
        `npm install` cannot give yet.
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
- [x] **CI alerting on daemon-push failures** — DONE 2026-11-19:
      `.github/workflows/ci-alert.yml` (workflow_run on CI/Release) opens or
      comments on a single `ci-alert`-labeled tracking issue for every failed
      run (Release failures always alert; CI only on master/main — PR runs
      stay excluded) and auto-closes it once CI on master is green again. No
      third-party actions to pin; actionlint clean, heredoc logic dry-run
      verified locally. **NOT LIVE YET** (verified 21:17 CET): it sits in
      daemon commits not yet pushed — GitHub's workflow list has no "CI
      Alert". Once pushed, `workflow_run` only observes runs started AFTER
      the landing, so the 19:58Z Release failure predates it and will never
      alert; the first incident after the push is the live-fire test.
      (`docs/status/2026-11-19_07-36_merge-sequence-phase2.md` §f.13)
- [x] **Property-test seeds for the new 1.2.0 behaviors** — DONE
      2026-11-19: `specArbitrary` now generates optional channel IDs
      (`@channel(address, id)`) and optional discriminated variant families
      (`@discriminator("kind")` + 2-4 derived models); all six original
      properties run over the enriched space, and two new invariants lock the
      behaviors directly: P7 (channel key = `id ?? address`, every ref agrees
      incl. RFC 6901 token escaping) and P8 (variant expansion: one message
      per variant, base excluded, payload refs per variant schema).
      (`docs/status/2026-11-18_23-23_pr-review-sweep-master-red-ci-fix.md` §f.32)
- [x] **E2E test: `@channel(address, id)` with `split-schemas`** — DONE
      2026-11-19: `test/e2e/channel-id-split-schemas.test.ts` (6 tests:
      id-keyed channels, op pairing at a shared id, separation of distinct
      ids at one address, ref-chain rewriting to external schema files, file
      emission, YAML flavor).
      (`docs/status/2026-11-18_23-23_pr-review-sweep-master-red-ci-fix.md` §f.33)
- [x] (repo: fleet) **Daemon-push CI health sweep** — DONE 2026-11-19
      (agent sweep, 57 active repos): **16 red**, worst: BuildFlow (every
      gate red across the whole 15-run window — no green in days); nextd,
      project-dependency-graph, gh-constellation, index, Code-To-CV-Agent,
      mr-sync, sox-cra, crush-config (gitleaks), pim-sync, blog, CV red
      12h-1.3d; go-cqrs-lite, dnsblockd, templ-components flipped red within
      ~2h of the sweep (same daemon blind spot). Follow-up: port
      `ci-alert.yml` to the red repos (owner call per repo), triage BuildFlow
      first. This repo's own reds (Release dispatch failure, Dependabot
      minimatch) are handled in the Release section and below.
      (`docs/status/2026-11-18_23-23_pr-review-sweep-master-red-ci-fix.md` §f.35)
- [x] **Dependabot `minimatch` failures** — DONE 2026-11-19: Dependabot
      Updates failed 3x from 12:51Z (new advisory fetch for the documented
      GHSA-g3hv-75wg-m249 dismissal — only patched minimatch releases are
      ESM-only, spectral-core is CJS). Added `ignore:
    dependency-name: minimatch` to the root npm updater in
      `.github/dependabot.yml` with the rationale as a comment.

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
- [x] **⏰ eslint 10.12.0 bump** — SUPERSEDED (2026-11-19): the tree already
      resolved eslint 10.14.0 (verified via `pnpm why minimatch`), so the
      10.12.0 window is long gone; eslint rides the "one verified pass"
      dependency item above if it ever needs a deliberate bump again.
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
- [ ] Decide `docs/_archive/` policy — prune/move the archived reports or
      declare the archive permanent (harvested from the 2026-10-03
      toolchain-restore + 2026-08-21 phase-1 reports; lychee already
      excludes archives from link checks, the storage-growth call does not
      exist yet).
- [ ] Dependabot: allow-list the `typescript-eslint-eslint` group so its
      PRs can actually build (other groups create unbuildable PRs)
      (docs/status/2026-10-23_09-46:58).
- [ ] Add a `website/video` CI install job — CI never runs `npm ci` there,
      which let the master lockfile rot for 9 days unnoticed
      (docs/status/2026-10-23_09-46:103).
- [ ] Pin pnpm via a file the daemon cannot rewrite — `packageManager`
      drift was missed by three sessions
      (docs/status/2026-10-23_09-46:104).
- [ ] Retire `tsx` remnants: swap the typecheck runner to plain `tsc`
      (docs/status/2026-10-23_09-46:125).
- [ ] Remove the dead `messageSchemas` state symbol — declared at `src/lib.ts:245,293`,
      referenced nowhere else (docs/status/2026-07-22_05-58:180).
- [ ] Trash `scripts/ns-test/` (113-byte scratch, not referenced; owner call).
- [ ] Dependabot automerge policy decision — enable green-CI + gates
      automerge for minor/patch + security groups, majors stay manual
      (docs/status/2026-11-01_23-58:73).
- [ ] CI gate: `pnpm audit` on the root workspace (currently manual only;
      the one advisory is the documented minimatch dismissal)
      (docs/status/2026-11-01_23-58:72).
- [ ] CI check: fail when the lockfile's embedded root manifest disagrees
      with `package.json` — the drift class that bit twice
      (docs/status/2026-11-01_23-58:74).
- [ ] Scheduled `pnpm outdated` report workflow so bumps arrive in batches
      (docs/status/2026-11-01_23-58:75).
- [ ] Branch protection review — direct master pushes are possible; decide
      if that stays (docs/status/2026-11-01_23-58:76).
- [ ] Revisit `website/video` npm overrides on every hyperframes bump —
      floor pins can mask or conflict with newer trees
      (docs/status/2026-11-01_23-58:64).
- [ ] Refresh CONTRIBUTING.md commands/testing guidance from Bun/bun:test
      to pnpm + Vitest (Bun stays for coverage)
      (docs/status/2026-07-22_03-46:267).
- [ ] Add an unknown-payload runnable example documenting the
      unconstrained-schema semantics (docs/status/2026-08-22_00-17:99).
- [ ] Refresh ROADMAP to the current era — Current State exists but no
      1.2.0-era mentions yet; upstream-watch section references #12105
      (docs/status/2026-10-03_16-48:53,128).
- [ ] github-voice skill: add the `test -s body` non-empty guard step to
      the posting procedure (repo: crush-config)
      (docs/status/2026-10-03_16-48:134).
- [ ] Decide `global.out.css` policy (11-20 report g)3).
- [ ] Harmonize AGENTS pin wording (`^6.0.3` prose vs exact `6.0.3` manifest).
- [ ] Note or upstream: website `@astrojs/check` wants TS `^5||^6` while
      website pins TS 7 (Astro-side mismatch, pre-existing).
- [ ] Dependabot watch: config/lockfile divergence pattern recurred 2026-10-03
      (pnpm-update manifest drift); consider a daemon/preflight guard.
- [ ] Consider checkbox templates for ⏰ items so reports aren't the reminder
      system.
~~- [ ] Docs corpus sweep (2026-11-19): 272 unharvested open items across 99
      reports in `docs/status/` — harvest into TODO_LIST/ROADMAP or annotate
      resolved (docs-health ANNOTATE ritual), then archive per cadence
      thresholds (15 reports / 21 days, currently 99 / oldest 128d).
      `audit_max: 267` in `.docs-gates.json` is the ratchet pin (ratcheted
      from 272 the moment this row landed): NEVER raise it; every future item
      gets an inline verdict or a TODO_LIST/ROADMAP row, and the pin steps
      down as the corpus drains. Source: `docs-gates freshness . --audit-all`
      evidence.~~ done — the sweep ran 2026-11-19/20: 88 reports annotated item-by-item (every hash judge-verified), archived to `docs/status/archived/` with Live-remainder banners, audit_max ratcheted 267 → 11, full battery PASS
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

## Website QA & Brand Follow-ups (harvested 2026-11-19 from kept status reports)

- [ ] Screenshot `/` at 1440 / 768 / 390 and store as review artefacts
      (docs/status/2026-11-02_12-09:118).
- [ ] Run axe-core over `/` and fix violations
      (docs/status/2026-11-02_12-09:121).
- [ ] Test the copy-button path with a mocked clipboard
      (docs/status/2026-11-02_12-09:129).
- [ ] Verify the playground overlay editor in Safari/Firefox
      (scrollbar-width support, scroll sync)
      (docs/status/2026-11-04_00-04:117).
- [ ] Document the `faq.mdx` MDX exception where the docs conventions live
      (docs/status/2026-11-02_12-09:169).
- [ ] Generate a multi-size `.ico` fallback (16/32/48) next to
      `brand-mark.png` — Safari/legacy-tool coverage
      (docs/status/2026-11-04_17-42:122).
- [ ] Review favicon manifest `id`/`scope` for PWA installability score
      (Lighthouse pass) (docs/status/2026-11-04_17-42:153).
- [ ] Lighthouse CI budgets for performance/a11y/SEO
      (docs/status/2026-10-23_12-00:246).
- [ ] Playwright smoke tests for nav, theme, copy, and search
      (docs/status/2026-10-23_12-00:244).
- [ ] JSON-LD structured data: FAQPage (FAQ), HowTo (Quick Start),
      TechArticle + BreadcrumbList (docs pages)
      (docs/status/2026-10-23_12-00:251-253).
- [ ] Compress `public/og.png` and audit icon weights
      (docs/status/2026-10-23_12-00:254).
- [ ] Package-manager tabs on install snippets
      (docs/status/2026-10-23_12-00:260).
- [ ] "Copy page as Markdown" button (docs/status/2026-10-23_12-00:261).
- [ ] "Was this page helpful?" widget opening a prefilled issue
      (docs/status/2026-10-23_12-00:262).
- [ ] Reduce llms.txt anchor noise — "Section titled" spam in the llms
      output; try starlight-llms-txt `customSelectors`
      (docs/status/2026-10-23_14-13:206).
- [ ] Visual QA of `guides/mixing-with-openapi` in a real browser; fix
      rendering/analytics gaps (docs/status/2026-10-03_13-58:261).
- [ ] og:image / social card refresh for the new guide (fleet review
      follow-up) (docs/status/2026-10-03_13-58:268).
- [ ] CI deploy workflow for the website (Phase 7 build+deploy,
      FIREBASE_SERVICE_ACCOUNT secret) — needs a Lars decision
      (docs/status/2026-10-04_03-00:96).
- [ ] /guides index still 404s — add an overview page or redirect
      (design call open) (docs/status/2026-10-04_03-00:67).
- [ ] Update `website/README.md` pages/ listing: drop the manual llms.txt
      endpoints line, document `starlight-llms-txt` plugin generation
      (docs/status/2026-10-23_14-13:215).

## Test-Suite Integrity (residual)

- [ ] Property-suite generator breadth — generators now cover model→model
      refs, arrays with min/maxItems, enums, and constraint ordering, but
      unions of models, inheritance, generics, and channel parameters are
      still only covered by the compliance suite. Consider extending
      `specArbitrary` in `test/property/emitter-properties.test.ts`.
- [ ] Negative-proof pass for e2e + P7/P8: mutate one expectation, see red
      (docs/status/2026-11-19_21-17:183).
- [ ] Order-asserting variant for P8 (or document the suite is
      sorted-by-design) (docs/status/2026-11-19_21-17:184).
- [ ] Watch the coverage-average trend (96.9% and drifting)
      (docs/status/2026-11-19_21-17:189).
- [ ] Intrinsic-output hardening tests: golden lock for unknown/nullable
      unions, e2e never/void mapping tests, AJV negative `type: null` tests
      (docs/status/2026-08-22_00-17:85-93).
- [ ] Lock the diagnostic-code count with a unit test — `src/lib.ts`
      diagnostics registry otherwise grows silently
      (docs/status/2026-10-03_13-58:243).
- [ ] Type-mapping tests for enum arrays (`Status[]`) plus `Map<T>` /
      `Set<T>` stdlib shapes — none in
      `test/compliance/type-mapping-completeness.test.ts`
      (docs/status/2026-08-06_20-06:240).
- [ ] End-to-end test importing `@lars-artmann/typespec-asyncapi/shared`
      from built `dist/` via the package exports map — current tests
      import from `src/` only (docs/status/2026-08-05_18-14:74).
- [ ] Extend the mixed-ownership property suite to cover the http-route
      fallback path (docs/status/2026-10-03_13-58:281).
- [ ] Integration test running BOTH emitters' outputs through AJV in one
      program (docs/status/2026-10-03_13-58:284).
- [ ] Negative tests for `@operationId`/`@messageId` empty strings and
      invalid special characters (docs/status/2026-07-22_20-09:140).
- [ ] Consolidate duplicated compileAndGetDoc-style helpers into one
      shared test utility (docs/status/2026-07-22_17-57:93).
- [ ] Audit all `extractValue`/`refOrFallback` consumers for in-place
      mutation of framework-interned schemas
      (docs/status/2026-08-22_00-17:73).
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
- [ ] CI: add the nix/treefmt format check — the 2026-11-18 session's
      format debt was invisible to CI (docs/status/2026-11-19_20-38:240).

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
