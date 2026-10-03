# Status Report — BuildFlow Failure Recovery (nix-fmt / jscpd / lockfile drift)

**Date:** 2026-10-03 10:12 CEST
**Scope:** This session only — triage and repair of the failed BuildFlow run
(nix-fmt, jscpd, nix-build-verify) plus directly discovered collateral
(pnpm manifest/lock drift, workflow pin staleness). Continues the issue-#252
session (see `2026-10-03_06-31_issue-252-mixed-emitter-support.md`); its gated
decisions remain gated and are only listed for carry-over.

**Trigger:** Lars pasted a full BuildFlow run failing 3 steps
(`nix-fmt` prettier exit 2 — 4 consecutive identical failures, `jscpd`
`unexpected argument '--gitignore'`, `nix-build-verify` cascaded) and asked to
break it down and fix everything.

---

## a) FULLY DONE

1. **BuildFlow failure triage executed per the buildflow skill** — loaded the
   skill first, used `buildflow history --step <t> --last-error`, found there
   is no `.buildflow.yml` (BuildFlow runs on defaults; failures came from
   BuildFlow's own step wiring, not project config).
2. **jscpd step failure root-caused at source level** —
   `~/projects/BuildFlow/tools/providers/jscpd_provider.go:98-104` passes
   v4-only flags (`--gitignore`, `--exitCode 1`, `--silent`) unconditionally;
   jscpd v5 (the Rust rewrite, pinned here since 2026-09-30) rejects them.
   Verified v5's real flag surface empirically: `.gitignore` files are
   respected **by default** (`--no-gitignore` opts out), the exit flag is
   kebab-case `--exit-code` with an optional value defaulting to 1, and
   `--silent` no longer exists (reporter selection controls output). Also
   explains why BuildFlow's own tests never caught it: its devshell ships
   nixpkgs jscpd (v4), while consumer projects resolve their pinned v5 from
   `node_modules/.bin`.
3. **BuildFlow provider fixed at root cause** — `jscpdMajorVersion()` probe
   (parses `jscpd 5.3.3` and bare `4.0.9`; falls back to v5 on error/garbage)
   - `jscpdBaseArgs()` version-gated arg construction. v4 behavior byte-
     identical to before; v5 gets `--reporters json --output <tmp> --exit-code`.
     6 new unit tests (parse variants + v4/v5 arg sets). Existing integration
     tests untouched and passing: `ok github.com/larsartmann/buildflow/tools/providers 2.702s`.
4. **nix-fmt failure root-caused after discarding a wrong hypothesis** — the
   real culprit: two archived **generated** HTML reports with malformed markup
   (`docs/planning/2026-08-14_21-20_POST-REVIEW-PARETO-PLAN.html`,
   `docs/reviews/archived/2026-08-14_full-code-review.html` → prettier
   `SyntaxError: Unexpected closing tag`, exit 2, treefmt fails). Fixed in
   `flake.nix` treefmt config: `prettier.excludes = [ "docs/**/*.html" ]` —
   generated point-in-time artifacts are never formatted (matches the policy
   BuildFlow's own feedback docs established for report artifacts).
5. **nix-fmt VERIFIED GREEN** — `buildflow -s nix-fmt --fix` → `✔ nix-fmt
26.3s`, "1 success, 0 failed" (635 files traversed, 2 changed). The
   4-run failure loop is broken.
6. **Scratch junk removed** — committed repro outputs `rest/openapi.yaml` +
   `websocket/asyncapi.yaml` (phantom-GET repro artifacts from the issue-252
   session, committed by the daemon at 05:40) trashed; verified nothing
   references them (the mixed example's README references its own
   `tsp-output/...` paths, not these).
7. **jscpd scope policy encoded and verified** — root cause of a scare: the
   project gate (`pnpm run duplicate`) scans **`src scripts` only**, while
   BuildFlow scans `.`; a naive fix would have surfaced ~700 warning findings
   (intrinsic test-file similarity) on every run. Added `**/test/**` and
   `**/website/**` to `.jscpd.json` ignores (duplication policy = src +
   scripts; test/website similarity is intentional). Verified with the exact
   invocation the fixed provider will run: **0 duplicates, exit 0**.
8. **setup-bun workflow pins corrected** — both workflows pinned SHA
   `0c5077e…` with a stale `# v2` comment; `gh api` proved that SHA **is** the
   v2.2.0 tag commit. Comments updated to `# v2.2.0` in `ci.yml` + `release.yml`
   (satisfies github-actions-pinning; no actual action version change).
9. **pnpm manifest/lock drift repaired + CI-proven** — BuildFlow's
   `pnpm-update` step (07:12) bumped `package.json` (jscpd 5.4.0,
   typescript-eslint 8.71.0, vitest ^5.0.3) without regenerating
   `pnpm-lock.yaml` (lock still had jscpd 5.3.3) — the exact class of drift
   that broke the v1.0.0 tag push. Ran `pnpm install` (lockfile synced;
   supply-chain policy check passed, 871 entries) **and**
   `pnpm install --frozen-lockfile` — passes ("Lockfile is up to date").
   CI's frozen install is safe against the current manifest again.

## b) PARTIALLY DONE

1. **BuildFlow binary reinstall — blocked by foreign WIP.** `nix build
git+file:///home/lars/projects/BuildFlow#buildflow` FAILS: another
   in-flight session's baseline-command work modified
   `internal/cli/root.go` (references `createBaselineCommand`) but its
   definition lives in **untracked** `internal/cli/baseline_cmd.go`, which
   nix flakes do not include → dirty tree does not compile. My jscpd fix is
   correct and tested but cannot ship to `~/.nix-profile/bin/buildflow`
   until that tree is consistent (their work committed, or a clean-rev build
   with only my patch). I did NOT touch their files. golangci-lint on the
   package is blocked by the same compile error.
2. **My BuildFlow changes are still uncommitted** — daemon hasn't picked up
   `tools/providers/jscpd_provider.go` + test yet (observed 10:12).
3. **CHANGELOG `[Unreleased]` entry for issue #252 NOT written** — format
   studied (Keep a Changelog, bold-summary entries), interrupted by this
   report. Release-blocking, still open from the previous session.
4. **`buildflow -s jscpd` end-to-end verification pending** — simulated the
   exact command manually (0 findings), but the real step still runs the OLD
   binary (eb35fce) until (b)(1) resolves.
5. **typescript-eslint pin violation introduced by the sync** — `pnpm install`
   happily locked 8.71.0 because package.json was already bumped by
   BuildFlow's pnpm-update; AGENTS deliberately holds **8.70.x** (exact pin,
   after the TS-7 drift incident). Needs `pnpm -w update
typescript-eslint@8.70.1` + relock, or an explicit decision to accept
   8.71.0 and update AGENTS. Unattributed `minimumReleaseAgeExclude:
eslint@10.12.0` appeared in `pnpm-workspace.yaml` during the sync — needs
   review/ownership.
6. **Full gates not yet run this session** — neither `buildflow` (full) nor
   `pnpm run verify` after today's changes (flake, .jscpd.json, workflows,
   lockfile).

## c) NOT STARTED

1. AGENTS.md gotchas for: (a) jscpd scope policy / BuildFlow-whole-repo-vs-
   gate-scope coupling, (b) treefmt prettier HTML exclusion, (c) BuildFlow
   pnpm-update bumping manifests without lockfiles (recurring hazard).
2. pnpm-audit triage (15 findings from the pasted run: nanoid, devalue,
   brace-expansion ×2, http-cache-semantics + 10 more; several error
   severity; http-cache-semantics has **no patched version**).
3. Lychee findings (100: archive dead links + website root-relative link
   false positives needing a root-dir config; lychee not in devShell).
4. Confirming the `website/src/styles/global.out.css` prettier finding
   cleared (may already be fixed by the green nix-fmt run; detect not
   re-run).
5. `nix flake check` (checks.format now includes the HTML exclusion).
6. Re-running github-actions-pinning detect to confirm the comment fix.
7. Carried (gated on Lars): issue #252 reply posting, 1.0.1-vs-1.1.0 version
   call + release ritual, TODO_LIST/ROADMAP harvest, crush-config lessons
   commit.

## d) TOTALLY FUCKED UP (session failures, honestly)

1. **Wrong root-cause assertion #1 (phantom-file theory)** — I confidently
   theorized treefmt's git walker was feeding prettier deleted-but-indexed
   paths; the daemon had already committed the deletions and `git ls-files`
   was clean. The actual `[error]` lines were sitting in the saved full log
   the whole time — I theorized before grepping the complete log. One wasted
   debug cycle.
2. **False alarm #2 (15.9% duplication scare)** — my manual scan used scope
   `.` and briefly read as "the oxfmt wave broke the 0-clone baseline".
   Wrong: the gate scans `src scripts` only. Nearly acted on a false premise
   — the same failure class as yesterday's `emitters:{}` shape bug. Caught by
   checking `package.json` scripts before acting, but I should have diffed
   invocations FIRST.
3. **Phantom-skip re-run** — first nix-fmt verification attempt omitted
   `--fix` ("repair-only tool" rejection); also echoed `$?` after a pipeline,
   which reported `head`'s status, not buildflow's — sloppy verification
   twice in one command.
4. **Two edit-tool round trips wasted** on files I had `cat`ed but not
   View'ed (flake.nix, .jscpd.json) — the read-before-edit contract is per
   tool, and I knew it.
5. **Installed-binary assumption** — I went deep into fixing BuildFlow before
   noticing the tree carries someone else's uncompiling WIP; the ship path
   was blocked at the last step. Should have checked foreign working-tree
   state before planning an install from a shared repo.

## e) WHAT WE SHOULD IMPROVE

- **Grep the saved full log before theorizing** when a step fails with
  truncated output — `/tmp/nixfmt-*.log` contained the answer all along.
- **Pin the exact invocation (scope, config, binary version) before
  comparing tool verdicts** — gate-vs-BuildFlow scope and 5.3.3-vs-5.4.0 both
  bit this session.
- **BuildFlow health checks could probe CLI dialect at registration** (my
  version probe runs per detect; a registration-time check would have
  flagged the v5 incompatibility on 2026-09-30 instead of failing every
  consumer run for 3+ days).
- **BuildFlow `pnpm-update` must regenerate the lockfile** (or be forbidden
  from manifest-only bumps) — this is the second CI-frozen-install hazard
  from that step (v1.0.0 tag push was the first). Upstream fix candidate.
- **Scratch outputs must live in gitignored dirs** — the daemon committed
  `rest/` + `websocket/` repro outputs to git within minutes.
- **Shared-repo etiquette:** before building/installing from a repo someone
  else may be working in, check `git status` for foreign changes first.

## f) Next things (impact-ordered)

| #   | Task                                                                                                                                                                              | Route             |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 1   | Restore typescript-eslint 8.70.1 pin (`pnpm -w update …`) + relock, or decide to accept 8.71.0 and update AGENTS                                                                  | DO NOW            |
| 2   | Resolve BuildFlow ship path: wait for baseline WIP commit, or clean-rev build with only the jscpd patch → `nix profile install`                                                   | DO NOW (decision) |
| 3   | Verify `buildflow -s jscpd` green in this repo with the new binary                                                                                                                | DO NOW            |
| 4   | BuildFlow gates for my change: golangci-lint (tools/providers), erraudit, workspace tests                                                                                         | DO NOW            |
| 5   | CHANGELOG `[Unreleased]` entry (issue #252 warning + guard + example + tests)                                                                                                     | DO NOW            |
| 6   | Full `buildflow` run in this repo → expect steps green; residual findings audit/lychee only                                                                                       | DO NOW            |
| 7   | Full `pnpm run verify` after today's flake/.jscpd.json/workflow/lockfile changes                                                                                                  | DO NOW            |
| 8   | Review/own the `minimumReleaseAgeExclude: eslint@10.12.0` entry in pnpm-workspace.yaml                                                                                            | DO NOW            |
| 9   | AGENTS.md gotchas: jscpd scope policy, prettier HTML exclusion, pnpm-update drift                                                                                                 | DO NOW            |
| 10  | `nix flake check` (checks.format with exclusion)                                                                                                                                  | DO NOW            |
| 11  | Re-run github-actions-pinning detect (confirm v2.2.0 comment)                                                                                                                     | DO NOW            |
| 12  | Confirm global.out.css prettier finding cleared                                                                                                                                   | DO NOW            |
| 13  | pnpm-audit triage; overrides for patched transitive deps (nanoid ≥3.3.18, brace-expansion, devalue ≥5.9.3); document unpatchable (http-cache-semantics)                           | TODO_LIST         |
| 14  | Lychee: root-dir config for website root-relative links; exclude `docs/_archive`; consider devShell membership                                                                    | TODO_LIST         |
| 15  | Upstream BuildFlow: pnpm-update lockfile regeneration (issue or fix)                                                                                                              | TODO_LIST         |
| 16  | Upstream BuildFlow: registration-time CLI-dialect probe for jscpd                                                                                                                 | TODO_LIST         |
| 17  | Guard: fail `pnpm run verify` early if lockfile ≠ manifest (pre-push check)                                                                                                       | TODO_LIST         |
| 18  | Post issue #252 reply (final wording incl. $onValidate addendum)                                                                                                                  | Gated: Lars       |
| 19  | Version call 1.0.1 vs 1.1.0 → release (pre-tag frozen-lockfile ritual now partially pre-verified)                                                                                 | Gated: Lars       |
| 20  | TODO_LIST/ROADMAP harvest from the 06-31 report (f)-list                                                                                                                          | Gated: Lars       |
| 21  | crush-config `references/lessons.md`: add "grep the full log before theorizing" + "pin the invocation before comparing verdicts"                                                  | Gated: Lars       |
| 22  | Issue-252 test gaps (from 06-31 report f 6–12): @channel-only, #suppress, nested @service, nearest-server escape, no-server FP, guard-without-decorated-ops, phase-ran assertions | TODO_LIST         |
| 23  | Golden-file locks for the mixed example's two outputs                                                                                                                             | TODO_LIST         |
| 24  | README + examples/README count audit (34 diagnostics, 15 examples)                                                                                                                | TODO_LIST         |
| 25  | AGENTS "Key Tests" list: add mixed-http-emitters.test.ts                                                                                                                          | TODO_LIST         |
| 26  | Website "Mixing with OpenAPI" docs page                                                                                                                                           | ROADMAP           |
| 27  | Warning dedupe per (service, namespace)                                                                                                                                           | TODO_LIST         |
| 28  | Memoize `listServices` in discovery loop if benchmarks regress                                                                                                                    | ROADMAP           |
| 29  | lsp_restart at session start when stale-file diagnostics appear (this session's tool noise)                                                                                       | Process note      |

## g) Questions I cannot answer myself

1. **BuildFlow ship path:** the local BuildFlow tree carries another
   session's half-finished baseline-command work (modified `root.go` +
   untracked `baseline_cmd.go`) that makes the dirty tree uncompilable.
   Should I (a) wait for that session to finish/commit, (b) build a
   clean-rev worktree with ONLY my jscpd patch and install that, or
   (c) leave it — you'll ship it when the baseline work lands?
2. **typescript-eslint:** BuildFlow's pnpm-update bumped it to 8.71.0 past
   your documented 8.70.x hold. Restore 8.70.1 (per AGENTS precedent), or
   accept 8.71.0 (verify-lint passes) and update the AGENTS pin note?
3. **Carried over:** post the issue #252 reply as drafted, and 1.0.1 vs
   1.1.0 — your call remains blocking the release chain.

---

Written by Crush. Point-in-time snapshot; ANNOTATE, never rewrite, when
bringing it current.
