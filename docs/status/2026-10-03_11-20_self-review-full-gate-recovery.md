# Self-Review & Full Gate Recovery — Status Report

**Date:** 2026-10-03 11:20 CEST
**Session:** Continuation of `2026-10-03_10-12_buildflow-failure-recovery.md`
(Lars: "break it down, execute and verify, keep going until everything works";
mid-session course corrections on downgrades vs latest, then this demanded
self-review). Format note: `.md` at explicit path per Lars's demand — override
of the status-report skill's HTML default, flagged, not propagated.

**Terminal state achieved this session:** `buildflow` full = exit 0 ·
`pnpm run verify` = exit 0 (1250 tests, 98.0% avg coverage, 0 clones) ·
`nix flake check` = all checks passed · `pnpm install --frozen-lockfile` =
clean (re-proven after the last workspace.yaml change).

---

## a) FULLY DONE (verified this session)

1. **BuildFlow jscpd v4/v5 dialect fix** — version probe + `jscpdBaseArgs`,
   gated in clean sibling worktree (`go build`, `go test -race` ok 191s,
   golangci-lint clean for my files, erraudit 0 violations), built, installed
   (`13d32f756…d306-dirty`), `buildflow -s jscpd` green (0 findings, 336ms).
   Daemon has committed it into BuildFlow main history.
2. **BuildFlow todo-checker word-boundary fix** — `(?i)\b(...):` in
   `compilePatterns`; `debug: "1"` no longer matches `BUG:`. Regression test
   through the PRODUCTION compile path (existing tests hand-rolled a `\b`
   regex — production never had it, which is how the bug survived). Module
   tests, golangci-lint 0 issues, erraudit 0 violations (the latter two added
   during this self-review — see d)2). `buildflow -s todo-check` = 0
   findings. Daemon-committed to BuildFlow main history.
3. **Dependency set at latest-allowed** — typescript-eslint 8.71.0 (the real
   constraint is the peer range `typescript <6.1.0`, NOT an 8.70.x hold;
   AGENTS rewritten to the real rule), root TypeScript 6.0.3 (latest 6.x;
   6.0.4 does not exist; caught a RECURRENCE of the `^7.0.2` root drift and
   restored it), eslint 10.11.0, vitest 5.0.3, oxlint 1.86.0, jscpd 5.4.0 —
   all newest versions their constraints allow. Verify gate green on the set.
4. **`minimumReleaseAgeExclude: eslint@10.12.0` removed** — it bypassed the
   24h publish soak for a <24h-old eslint; reverted to aged 10.11.0. Soak
   policy documented in AGENTS.
5. **pnpm-audit 15 → 0 actionable findings** — range-selectored overrides
   (`nanoid@<3.3.18`, `devalue@<=5.9.2`, `brace-expansion@^1/@^5`,
   `fast-uri ^3.1.8`); the one unpatchable advisory (http-cache-semantics
   GHSA-ch52; 4.2.0 IS the latest release; website-build-only chain) dismissed
   via `auditConfig.ignoreGhsas` with the removal condition documented.
   Cache-cold `buildflow -s pnpm-audit` = exit 0.
6. **treefmt generated/artifact exclusion doctrine** — prettier excludes:
   `docs/**/*.html`, `docs/_archive/**`, `docs/status/**` (point-in-time
   reports — prettier wanted to re-wrap their code fences),
   `website/src/styles/*.out.css`, `pnpm-lock.yaml`. `nix flake check` =
   ALL CHECKS PASSED.
7. **Formatter single-ownership** — new `.buildflow.yml`: oxfmt and
   prettier-format skipped with rationale (treefmt/prettier via
   nix-flake-check is the ONE formatting owner; the duplicates don't honor
   its excludes and disagreed: 135 + 1 advisory findings).
8. **github-actions-pinning** = exit 0 (setup-bun `# v2.2.0` comment fix).
9. **CHANGELOG `[Unreleased]`** entry for issue #252 (leak fix, diagnostic,
   example, integration test).
10. **AGENTS.md updated** — pin rule, soak policy, overrides precedent +
    range-selector gotcha, treefmt doctrine + mtime-cache caveat, jscpd v5
    dialect + `.jscpd.json` dual-scope coupling, BuildFlow pnpm-update
    hazards.
11. **Resolution addendum** appended to the 10-12 report (incl. worktree
    cleanup commands).
12. **Self-review verifications just re-run:** frozen-lockfile proof after the
    auditConfig edit; todo-checker lint+erraudit; lychee state; ns-test
    identity (see below).

## b) PARTIALLY DONE

1. **BuildFlow ship path** — both fixes are in BuildFlow main HISTORY (daemon
   commits), but the ACTIVE fleet binary is my `-dirty` worktree build. The
   proper `git+file:///home/lars/projects/BuildFlow` reinstall remains blocked
   by the concurrent session's uncompiling baseline WIP (root.go references
   `createBaselineCommand` defined only in untracked files). Workaround is
   solid and documented; not the end state.
2. **eslint truly-latest** — 10.12.0 published 2026-10-02T20:08Z; crosses the
   24h soak tonight 20:08 UTC. One-liner bump then (`pnpm -w update
   eslint@10.12.0` + relock).
3. **Follow-up tracking** — every follow-up lives in prose (AGENTS gotchas +
   this report); NOT harvested into `TODO_LIST.md`, the designated file. This
   report's §f supersedes the 10-12 §f table for harvesting.

## c) NOT STARTED (gated on Lars — carried, unchanged)

1. Issue #252 reply posting (drafted earlier; posting is external+irreversible).
2. 1.0.1-vs-1.1.0 version call + release ritual (annotated tag → release.yml;
   pre-tag `pnpm install --lockfile-only && --frozen-lockfile && verify` now
   MORE important — see the Dependabot/frozen incident note in AGENTS).
3. TODO_LIST / ROADMAP harvest (10-12 §f 29-item table + this §f).
4. crush-config lessons commit (cross-project lessons).

## d) TOTALLY FUCKED UP (honest)

1. **Near-false-green from result-cache masking.** I reported "exit 0" from a
   full run whose pnpm-audit step was a 1ms cache replay that hid the LIVE
   http-cache-semantics error finding. Caught only because I distrusted the
   1ms and re-ran cache-cold (exit 69 → then fixed properly). The first
   "terminal state" message to Lars rested partly on a masked result.
   Systemic fix: final gate verification must use `BUILDFLOW_NO_RESULT_CACHE=1`
   (and this masking behavior is itself a BuildFlow bug worth reporting —
   a cached GREEN over a live-RED finding).
2. **Gate asymmetry on my second fix** (caught + closed in this self-review):
   the jscpd fix got build+race+lint+erraudit; the todo-checker fix initially
   shipped with only `go test`. Sloppy. All BuildFlow patches get the full
   gate set now (lint 0 / erraudit 0 confirmed above).
3. **Lossy verification greps, three times.** (i) `treefmt --fail-on-change |
   grep -E 'pnpm-lock|fail|changed'` printed nothing → I declared clean while
   the sandbox failed on OTHER files. (ii) `head`-truncated gate outputs hid
   verdict lines twice. (iii) `echo EXIT=${PIPESTATUS[0]}` inside piped
   background commands expanded empty — exit codes silently lost. Rule going
   forward: gate verdicts go to a FILE, greps never filter the verdict line,
   exit codes captured without pipes.
4. **First worktree attempt in /tmp** broke on BuildFlow's sibling `../`
   replaces — one wasted cycle; recovered to a sibling dir under ~/projects.
   Should have read go.mod replaces BEFORE choosing worktree location.
5. **Minor:** initial jscpd provider gate used per-FILE golangci-lint args
   (18 bogus typecheck errors — file-mode linting lacks package context);
   recovered by package-scoped run. Verify with the same invocation CI uses.

## e) WHAT WE SHOULD IMPROVE

1. **TODO_LIST.md discipline** — follow-ups belong in the interactive file,
   not entombed in prose. (docs-health HARVEST applies after this report.)
2. **Cache-cold final gates as policy** — `BUILDFLOW_NO_RESULT_CACHE=1` for
   any "final" claim; also worth adding to CI's gate job.
3. **Symmetric gating** — every BuildFlow patch: build + race tests + lint +
   erraudit, no exceptions.
4. **Verification output hygiene** — verdict lines unfiltered; exit codes
   explicit; full logs to /tmp files (pattern worked every time I used it).
5. **LSP restart** — stale diagnostics for trashed `scripts/scratch-issue-252*`
   polluted EVERY tool result this session; one `lsp_restart` at session start
   would have cleaned two sessions' worth of noise.
6. **lychee 99 warning findings** — link rot accumulating (docs); warning-only
   so invisible to the gate. Triage or schedule.
7. **knip** (dead-code) shows as "unavailable" — evaluate adopting it; this
   repo's exports surface is now semver-frozen, dead code is audit material.
8. **pnpm-lock.yaml is currently prettier-STYLED** (treefmt --fix ran before
   the exclusion landed; data-identical, pnpm accepts it). It will snap back
   to pnpm style at the next real relock — expect a one-time style diff, not
   a dependency change.
9. **`scripts/ns-test/main.tsp`** — 113-byte scratch from 05:38 today, not
   mine, not referenced. Owner should trash it (I don't delete others' files).
10. **AGENTS pin notation drift** — AGENTS says TS "pinned to ^6.0.3" prose
    while the manifest now pins exact `6.0.3`. Harmonize wording at next edit.

## f) NEXT THINGS (harvest-ready; ⏳=gated on Lars, ⏰=time-based)

**Recovery tail**
1. ⏰ eslint → 10.12.0 after 20:08 UTC tonight; relock; frozen proof; quick lint.
2. ⏰ After baseline WIP lands: reinstall buildflow from main URL, remove
   `.bf-jscpd-worktree`, verify version ≠ -dirty build.
3. Watch http-cache-semantics for a patched release → remove `ignoreGhsas` entry.
4. BuildFlow upstream queue (file or hand to the concurrent session — see g)1):
   pnpm-update writes manifests without lockfiles; pnpm-update writes
   `minimumReleaseAgeExclude` bypasses for <24h publishes; result cache can
   replay a GREEN over a live-RED finding; `nix profile install` same-URL
   no-op skips rebuild when the dirty source changed.
5. BuildFlow HEAD has 5 pre-existing lint issues (gofumpt/golines/wsl_v5 in
   vendor_resync_ordering_test.go, nix_tools.go) — other session's domain,
   currently red for their own gates.
**Gated release chain**
6. ⏳ Post issue #252 reply (verify-before-filing pass done 10-12; then github-voice).
7. ⏳ Version call 1.0.1 (bugfix) vs 1.1.0 (the #252 diagnostic+behavior change
   is arguably minor-not-patch) → CHANGELOG section rename → `pnpm version` →
   tag → release.yml.
8. ⏳ Pre-tag ritual per AGENTS: `pnpm install --lockfile-only && pnpm install
   --frozen-lockfile && pnpm run verify`.
9. ⏳ TODO_LIST/ROADMAP harvest (this §f + 10-12 §f).
10. ⏳ crush-config lessons commit (worktree-placement-for-relative-replaces;
    result-cache masking; lossy-grep failures).
**Quality / hygiene**
11. lychee 99 findings triage (docs link rot; fix or archive dead links).
12. Evaluate knip adoption for the frozen public API surface.
13. Review nix-checker's 2 remaining info suggestions (cleaner-diffs/nvfetcher).
14. On-demand sweeps now the gate is green: gitleaks, codespell, markdownlint.
15. Add `BUILDFLOW_NO_RESULT_CACHE=1` to the CI final-gate job (cache-masking
    defense — pairs with item 4).
16. `scripts/ns-test/` — owner trashes or it becomes repo litter.
17. Decide global.out.css policy (see g)3).
18. AGENTS `^6.0.3`-vs-`6.0.3` wording harmonization.
19. LSP restart habit at session start when diagnostics reference deleted files.
20. pnpm peers check: website `@astrojs/check` wants TS ^5||^6 vs website TS 7
    — pre-existing Astro-side mismatch; note or upstream to Astro templates.
21. Re-run `pnpm run check-examples` (CI-covered, not run this session).
22. `jscpd-report/` output dir from the duplicate step — confirm gitignored.
23. Verify `generated-bindings.ts` shrinkage (12169→11073 after @asyncapi/specs
    relock) didn't drop binding rules: spot-check `LATEST_BINDING_VERSIONS`
    count vs AGENTS' 19 binding protocols.
24. Consider TODO_LIST entry templates for ⏰ items (this report should not be
    the reminder system).
25. FEATURES.md refresh after #252 work lands in a release.
26. ROADMAP: EFv1 containment watch (asset-emitter → openapi3 migration news).
27. npm dist-tag `alpha` cleanup still UI-only (token lacks DELETE) — keep in
    release checklist.
28. Dependabot watch: next config/lockfile divergence (the v1.0.0 incident
    pattern recurred TODAY as pnpm-update manifest drift).
29. `buildflow doctor` binary-freshness warnings on this shared checkout are
    expected noise — consider a doctor allowlist note in AGENTS if it annoys.
30. Session report hygiene: this is the 3rd report in 2 days on this recovery;
    next one should be the release/ship report only.

## g) QUESTIONS (cannot figure out myself)

1. **BuildFlow upstream ownership:** four upstream findings this session
   (pnpm-update lockless manifest writes; release-age-exclude bypasses;
   result-cache green-over-red replay; nix profile same-URL no-op) plus
   landing my two fixes through a clean main build — do I file these in
   BuildFlow's TODO/issue tracker myself, or does the concurrent baseline
   session own that queue and I hand them over?
2. **Formatter endgame:** I locked prettier/treefmt in as the single owner
   (skipping oxfmt + prettier-format in BuildFlow). Correct long-term, or is
   ox-native oxfmt the intended eventual single formatter (making the
   migration a planned task instead of a skip)?
3. **`website/src/styles/global.out.css`:** generated Tailwind output, but
   TRACKED in git (and now excluded from formatting). Untrack and generate
   at build time, or keep committing build output?

---

Written by Crush. Point-in-time snapshot; ANNOTATE, never rewrite, when
bringing it current. §f is the HARVEST input for TODO_LIST/ROADMAP.
