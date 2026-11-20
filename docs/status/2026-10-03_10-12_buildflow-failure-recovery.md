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

~~1. **BuildFlow failure triage executed per the buildflow skill** — loaded the~~ done — triage outcome recorded here; the three failures closed the same day ( addendum below )
   skill first, used `buildflow history --step <t> --last-error`, found there
   is no `.buildflow.yml` (BuildFlow runs on defaults; failures came from
   BuildFlow's own step wiring, not project config).
~~2. **jscpd step failure root-caused at source level** —~~ done — root cause documented in `AGENTS.md:209` ( v5 CLI dialects, fixed in BuildFlow 2026-10-03 )
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
~~3. **BuildFlow provider fixed at root cause** — `jscpdMajorVersion()` probe~~ done — the fix lives in BuildFlow: version probe and dialect gating in `/home/lars/projects/BuildFlow/tools/providers/jscpd_provider.go:192`
   (parses `jscpd 5.3.3` and bare `4.0.9`; falls back to v5 on error/garbage)
   - `jscpdBaseArgs()` version-gated arg construction. v4 behavior byte-
     identical to before; v5 gets `--reporters json --output <tmp> --exit-code`.
     6 new unit tests (parse variants + v4/v5 arg sets). Existing integration
     tests untouched and passing: `ok github.com/larsartmann/buildflow/tools/providers 2.702s`.
~~4. **nix-fmt failure root-caused after discarding a wrong hypothesis** — the~~ done — the generated-HTML exclusion doctrine stands in `flake.nix:70` and `AGENTS.md:211`
   real culprit: two archived **generated** HTML reports with malformed markup
   (`docs/planning/2026-08-14_21-20_POST-REVIEW-PARETO-PLAN.html`,
   `docs/reviews/archived/2026-08-14_full-code-review.html` → prettier
   `SyntaxError: Unexpected closing tag`, exit 2, treefmt fails). Fixed in
   `flake.nix` treefmt config: `prettier.excludes = [ "docs/**/*.html" ]` —
   generated point-in-time artifacts are never formatted (matches the policy
   BuildFlow's own feedback docs established for report artifacts).
~~5. **nix-fmt VERIFIED GREEN** — `buildflow -s nix-fmt --fix` → `✔ nix-fmt~~ done — nix-fmt green and kept green by the `flake.nix` prettier excludes
26.3s`, "1 success, 0 failed" (635 files traversed, 2 changed). The
   4-run failure loop is broken.
~~6. **Scratch junk removed** — committed repro outputs `rest/openapi.yaml` + `websocket/asyncapi.yaml` (phantom-GET repro artifacts from the issue-252 session, committed by the daemon at 05:40) trashed~~ done — neither `rest/` nor `websocket/` exists in the tree today; verified nothing references them (the mixed example's README references its own `tsp-output/` paths, not these).
~~7. **jscpd scope policy encoded and verified** — root cause of a scare: the~~ done — scope policy stands: `.jscpd.json` ignores + `AGENTS.md:210` ( single scope source for gate and BuildFlow )
   project gate (`pnpm run duplicate`) scans **`src scripts` only**, while
   BuildFlow scans `.`; a naive fix would have surfaced ~700 warning findings
   (intrinsic test-file similarity) on every run. Added `**/test/**` and
   `**/website/**` to `.jscpd.json` ignores (duplication policy = src +
   scripts; test/website similarity is intentional). Verified with the exact
   invocation the fixed provider will run: **0 duplicates, exit 0**.
~~8. **setup-bun workflow pins corrected** — both workflows pinned SHA~~ done — `# v2.2.0` pin comments in `.github/workflows/ci.yml:28` and `release.yml:56`
   `0c5077e…` with a stale `# v2` comment; `gh api` proved that SHA **is** the
   v2.2.0 tag commit. Comments updated to `# v2.2.0` in `ci.yml` + `release.yml`
   (satisfies github-actions-pinning; no actual action version change).
~~9. **pnpm manifest/lock drift repaired + CI-proven** — BuildFlow's~~ done — lockfile sync verified; CI installs with `--frozen-lockfile` ( `.github/workflows/ci.yml:32` )
   `pnpm-update` step (07:12) bumped `package.json` (jscpd 5.4.0,
   typescript-eslint 8.71.0, vitest ^5.0.3) without regenerating
   `pnpm-lock.yaml` (lock still had jscpd 5.3.3) — the exact class of drift
   that broke the v1.0.0 tag push. Ran `pnpm install` (lockfile synced;
   supply-chain policy check passed, 871 entries) **and**
   `pnpm install --frozen-lockfile` — passes ("Lockfile is up to date").
   CI's frozen install is safe against the current manifest again.

## b) PARTIALLY DONE

~~1. **BuildFlow binary reinstall — blocked by foreign WIP.** `nix build~~ done — resolved by addendum §1 ( clean-rev worktree build + `nix profile install` )
git+file:///home/lars/projects/BuildFlow#buildflow` FAILS: another
   in-flight session's baseline-command work modified
   `internal/cli/root.go` (references `createBaselineCommand`) but its
   definition lives in **untracked** `internal/cli/baseline_cmd.go`, which
   nix flakes do not include → dirty tree does not compile. My jscpd fix is
   correct and tested but cannot ship to `~/.nix-profile/bin/buildflow`
   until that tree is consistent (their work committed, or a clean-rev build
   with only my patch). I did NOT touch their files. golangci-lint on the
   package is blocked by the same compile error.
~~2. **My BuildFlow changes are still uncommitted** — daemon hasn't picked up~~ done — the daemon committed the fixes into BuildFlow main history ( addendum §1 )
   `tools/providers/jscpd_provider.go` + test yet (observed 10:12).
~~3. **CHANGELOG `[Unreleased]` entry for issue #252 NOT written** — format~~ done — written per addendum §8; now in the 1.1.0 section ( `CHANGELOG.md:145`, `:185` )
   studied (Keep a Changelog, bold-summary entries), interrupted by this
   report. Release-blocking, still open from the previous session.
~~4. **`buildflow -s jscpd` end-to-end verification pending** — simulated the~~ done — `buildflow -s jscpd` green, 0 findings ( addendum §1 )
   exact command manually (0 findings), but the real step still runs the OLD
   binary (eb35fce) until (b)(1) resolves.
~~5. **typescript-eslint pin violation introduced by the sync** — `pnpm install`~~ done — 8.71.0 accepted; the real pin rule is documented in `AGENTS.md:206`
   happily locked 8.71.0 because package.json was already bumped by
   BuildFlow's pnpm-update; AGENTS deliberately holds **8.70.x** (exact pin,
   after the TS-7 drift incident). Needs `pnpm -w update
typescript-eslint@8.70.1` + relock, or an explicit decision to accept
   8.71.0 and update AGENTS. Unattributed `minimumReleaseAgeExclude:
eslint@10.12.0` appeared in `pnpm-workspace.yaml` during the sync — needs
   review/ownership.
~~6. **Full gates not yet run this session** — neither `buildflow` (full) nor~~ done — terminal state green: buildflow exit 0, verify exit 0, `nix flake check` passed ( addendum )
   `pnpm run verify` after today's changes (flake, .jscpd.json, workflows,
   lockfile).

## c) NOT STARTED

~~1. AGENTS.md gotchas for: (a) jscpd scope policy / BuildFlow-whole-repo-vs-~~ done — all three gotchas live in `AGENTS.md:210`, `:211`, `:212`
   gate-scope coupling, (b) treefmt prettier HTML exclusion, (c) BuildFlow
   pnpm-update bumping manifests without lockfiles (recurring hazard).
~~2. pnpm-audit triage (15 findings from the pasted run: nanoid, devalue,~~ done — 15 to 0 actionable via overrides in `pnpm-workspace.yaml:5-14` ( addendum §6 )
   brace-expansion ×2, http-cache-semantics + 10 more; several error
   severity; http-cache-semantics has **no patched version**).
3. Lychee findings (100: archive dead links + website root-relative link **→ TODO_LIST §Hygiene — Lychee 99 findings triage row**
   false positives needing a root-dir config; lychee not in devShell).
~~4. Confirming the `website/src/styles/global.out.css` prettier finding~~ done — cleared via the `website/src/styles/*.out.css` prettier exclude ( `flake.nix`, addendum §5 )
   cleared (may already be fixed by the green nix-fmt run; detect not
   re-run).
~~5. `nix flake check` (checks.format now includes the HTML exclusion).~~ done — ALL CHECKS PASSED per addendum §5
~~6. Re-running github-actions-pinning detect to confirm the comment fix.~~ done — `# v2.2.0` comments confirmed in both workflows ( `.github/workflows/ci.yml:28` )
~~7. Carried (gated on Lars): issue #252 reply posting, 1.0.1-vs-1.1.0 version~~ done — reply posted and 1.1.0 released per TODO_LIST §Mixed-Emitter Ownership Track; crush-config lessons row remains there
   call + release ritual, TODO_LIST/ROADMAP harvest, crush-config lessons
   commit.

## d) TOTALLY FUCKED UP (session failures, honestly)

~~1. **Wrong root-cause assertion #1 (phantom-file theory)** — I confidently~~ **Won't implement — process lesson; the real cause ( generated HTML markup ) is documented in `AGENTS.md:211`.**
   theorized treefmt's git walker was feeding prettier deleted-but-indexed
   paths; the daemon had already committed the deletions and `git ls-files`
   was clean. The actual `[error]` lines were sitting in the saved full log
   the whole time — I theorized before grepping the complete log. One wasted
   debug cycle.
~~2. **False alarm #2 (15.9% duplication scare)** — my manual scan used scope~~ **Won't implement — process lesson; the gate-vs-BuildFlow scope distinction is now a documented gotcha ( `AGENTS.md:210` ).**
   `.` and briefly read as "the oxfmt wave broke the 0-clone baseline".
   Wrong: the gate scans `src scripts` only. Nearly acted on a false premise
   — the same failure class as yesterday's `emitters:{}` shape bug. Caught by
   checking `package.json` scripts before acting, but I should have diffed
   invocations FIRST.
~~3. **Phantom-skip re-run** — first nix-fmt verification attempt omitted~~ **Won't implement — process lesson; verification hygiene, no artifact.**
   `--fix` ("repair-only tool" rejection); also echoed `$?` after a pipeline,
   which reported `head`'s status, not buildflow's — sloppy verification
   twice in one command.
~~4. **Two edit-tool round trips wasted** on files I had opened via `cat` but not~~ **Won't implement — process lesson; no artifact.**
   View'ed (flake.nix, .jscpd.json) — the read-before-edit contract is per
   tool, and I knew it.
~~5. **Installed-binary assumption** — I went deep into fixing BuildFlow before~~ **Won't implement — process lesson; resolved by the worktree ship path in addendum §1.**
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

| #  | Task                                                                                                                                                                              | Route             |
| -- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| ~~1~~ done — 8.71.0 accepted with the peer-range rule documented in `AGENTS.md:206` | ~~Restore typescript-eslint 8.70.1 pin (`pnpm -w update …`) + relock, or decide to accept 8.71.0 and update AGENTS~~ | ~~DO NOW~~ |
| ~~2~~ done — ship path ( b ) taken: clean worktree build + install ( addendum §1 ) | ~~Resolve BuildFlow ship path: wait for baseline WIP commit, or clean-rev build with only the jscpd patch → `nix profile install`~~ | ~~DO NOW (decision)~~ |
| ~~3~~ done — green, 0 findings, 336ms ( addendum §1 ) | ~~Verify `buildflow -s jscpd` green in this repo with the new binary~~ | ~~DO NOW~~ |
| ~~4~~ done — gated in the worktree: go test -race, golangci-lint clean, erraudit 0 ( addendum §1 ) | ~~BuildFlow gates for my change: golangci-lint (tools/providers), erraudit, workspace tests~~ | ~~DO NOW~~ |
| ~~5~~ done — entry written ( addendum §8 ), now `CHANGELOG.md:145` and `:185` | ~~CHANGELOG `[Unreleased]` entry (issue #252 warning + guard + example + tests)~~ | ~~DO NOW~~ |
| ~~6~~ done — full buildflow exit 0, warnings only ( addendum terminal state ) | ~~Full `buildflow` run in this repo → expect steps green; residual findings audit/lychee only~~ | ~~DO NOW~~ |
| ~~7~~ done — verify exit 0 on the new dependency set ( addendum §4 ) | ~~Full `pnpm run verify` after today's flake/.jscpd.json/workflow/lockfile changes~~ | ~~DO NOW~~ |
| ~~8~~ done — exclude removed and eslint rolled to 10.14.0 since ( `package.json:130`, addendum §4 ) | ~~Review/own the `minimumReleaseAgeExclude: eslint@10.12.0` entry in pnpm-workspace.yaml~~ | ~~DO NOW~~ |
| ~~9~~ done — gotchas recorded in `AGENTS.md:210` through `:212` | ~~AGENTS.md gotchas: jscpd scope policy, prettier HTML exclusion, pnpm-update drift~~ | ~~DO NOW~~ |
| ~~10~~ done — ALL CHECKS PASSED ( addendum §5 ) | ~~`nix flake check` (checks.format with exclusion)~~ | ~~DO NOW~~ |
| ~~11~~ done — pin comments verified in `.github/workflows/ci.yml:28` | ~~Re-run github-actions-pinning detect (confirm v2.2.0 comment)~~ | ~~DO NOW~~ |
| ~~12~~ done — excluded via flake prettier excludes; policy row remains in TODO_LIST §Hygiene | ~~Confirm global.out.css prettier finding cleared~~ | ~~DO NOW~~ |
| ~~13~~ done — 15 to 0 actionable; overrides stand in `pnpm-workspace.yaml:5-14` | ~~pnpm-audit triage; overrides for patched transitive deps (nanoid ≥3.3.18, brace-expansion, devalue ≥5.9.3); document unpatchable (http-cache-semantics)~~ | ~~TODO_LIST~~ |
| 14 **→ TODO_LIST §Hygiene — Lychee 99 findings triage row** | Lychee: root-dir config for website root-relative links; exclude `docs/_archive`; consider devShell membership | TODO_LIST |
| 15 **→ TODO_LIST §Dependency & Toolchain Refresh — file the pnpm-update drift upstream row** | Upstream BuildFlow: pnpm-update lockfile regeneration (issue or fix) | TODO_LIST |
| ~~16~~ **Won't implement — never filed upstream; the shipped fix version-probes per detect ( `AGENTS.md:209` ) and the TODO_LIST handoff row lists four other findings.** | ~~Upstream BuildFlow: registration-time CLI-dialect probe for jscpd~~ | ~~TODO_LIST~~ |
| ~~17~~ **Won't implement — no verify-time lockfile guard exists ( `package.json:97` ); CI frozen install catches drift ( `ci.yml:32` ) and the pre-tag preflight is tracked in TODO_LIST §Release Hardening.** | ~~Guard: fail `pnpm run verify` early if lockfile ≠ manifest (pre-push check)~~ | ~~TODO_LIST~~ |
| ~~18~~ done — posted 2026-10-03 ( TODO_LIST §Mixed-Emitter, issuecomment-5970180678 ) | ~~Post issue #252 reply (final wording incl. $onValidate addendum)~~ | ~~Gated: Lars~~ |
| ~~19~~ done — 1.1.0 released 2026-10-03, tag `v1.1.0` in git history | ~~Version call 1.0.1 vs 1.1.0 → release (pre-tag frozen-lockfile ritual now partially pre-verified)~~ | ~~Gated: Lars~~ |
| ~~20~~ done — landed as TODO_LIST §Mixed-Emitter and §Hygiene rows ( headers cite the 2026-10-03 sources ) | ~~TODO_LIST/ROADMAP harvest from the 06-31 report (f)-list~~ | ~~Gated: Lars~~ |
| 21 **→ TODO_LIST §Mixed-Emitter Ownership Track — crush-config lessons commit row** | crush-config `references/lessons.md`: add "grep the full log before theorizing" + "pin the invocation before comparing verdicts" | Gated: Lars |
| ~~22~~ done — test gaps locked by `test/integration/mixed-http-emitters.test.ts` ( `AGENTS.md:190` ) | ~~Issue-252 test gaps (from 06-31 report f 6–12): @channel-only, #suppress, nested @service, nearest-server escape, no-server FP, guard-without-decorated-ops, phase-ran assertions~~ | ~~TODO_LIST~~ |
| ~~23~~ done — `test/golden/mixed-rest-events.test.ts` + `.expected.yaml` exist | ~~Golden-file locks for the mixed example's two outputs~~ | ~~TODO_LIST~~ |
| ~~24~~ done — counts audited: 36 codes ( `README.md:332` ), examples listed at `README.md:356` | ~~README + examples/README count audit (34 diagnostics, 15 examples)~~ | ~~TODO_LIST~~ |
| ~~25~~ done — `test/integration/mixed-http-emitters.test.ts` is cited in `AGENTS.md:190` | ~~AGENTS "Key Tests" list: add mixed-http-emitters.test.ts~~ | ~~TODO_LIST~~ |
| ~~26~~ done — `website/src/content/docs/guides/mixing-with-openapi.md` exists | ~~Website "Mixing with OpenAPI" docs page~~ | ~~ROADMAP~~ |
| ~~27~~ done — warning deduped per ( service, namespace ) per `AGENTS.md:73` | ~~Warning dedupe per (service, namespace)~~ | ~~TODO_LIST~~ |
| ~~28~~ **Won't implement — benchmarks never regressed; no memoization was needed.** | ~~Memoize `listServices` in discovery loop if benchmarks regress~~ | ~~ROADMAP~~ |
| ~~29~~ **Won't implement — process note; no artifact.** | ~~lsp_restart at session start when stale-file diagnostics appear (this session's tool noise)~~ | ~~Process note~~ |

## g) Questions I cannot answer myself

~~1. **BuildFlow ship path:** the local BuildFlow tree carries another~~ done — answered by addendum §1 ( option b, worktree build )
   session's half-finished baseline-command work (modified `root.go` +
   untracked `baseline_cmd.go`) that makes the dirty tree uncompilable.
   Should I (a) wait for that session to finish/commit, (b) build a
   clean-rev worktree with ONLY my jscpd patch and install that, or
   (c) leave it — you'll ship it when the baseline work lands?
~~2. **typescript-eslint:** BuildFlow's pnpm-update bumped it to 8.71.0 past~~ done — answered by addendum §3 ( 8.71.0 accepted; rule documented `AGENTS.md:206` )
   your documented 8.70.x hold. Restore 8.70.1 (per AGENTS precedent), or
   accept 8.71.0 (verify-lint passes) and update the AGENTS pin note?
~~3. **Carried over:** post the issue #252 reply as drafted, and 1.0.1 vs~~ done — reply posted and 1.1.0 released ( TODO_LIST §Mixed-Emitter Ownership Track )
   1.1.0 — your call remains blocking the release chain.

---

Written by Crush. Point-in-time snapshot; ANNOTATE, never rewrite, when
bringing it current.

---

## Resolution addendum (2026-10-03 11:20, same day)

All three failures closed; full gates green. Both §g questions resolved
autonomously per "keep going until everything works":

~~1. **jscpd → FIXED at source, built, installed, verified.** Chose ship-path~~ done — fix in BuildFlow main history ( `jscpd_provider.go` probe verified on disk ); worktree cleanup row remains in TODO_LIST §Mixed-Emitter
   (b): clean git worktree at `/home/lars/projects/.bf-jscpd-worktree`
   (detached HEAD + staged patch only — never touched the baseline WIP),
   gated there (go build, go test -race ./tools/providers ok 191s,
   golangci-lint clean for my files, erraudit 0 violations), built and
   installed from it via `nix profile install`. Binary now
   `13d32f75613e093100277d6c301411330406d306-dirty`. `buildflow -s jscpd`
   green (0 findings, 336ms). NOTE: worktree placement matters — BuildFlow's
   go.mod has sibling `../` replaces, so a /tmp worktree cannot build.
   The daemon has since committed the jscpd fix into BuildFlow main history.
~~2. **Second BuildFlow bug found and fixed en route:** todo-checker matched~~ done — word-boundary fix and regression test live in `/home/lars/projects/BuildFlow/modules/todo-checker/checker.go` and `scanner_regression_test.go`
   `BUG:` without a word boundary, so `debug: "1"` in
   test/integration/protocol-binding-integration.test.ts flagged as critical
   TODOs. Fixed `compilePatterns` (`(?i)\b(...)`), added regression test
   through the production compile path (existing tests hand-rolled a \b
   regex — production never had it). `buildflow -s todo-check` now 0
   findings. Also committed to BuildFlow main history by the daemon.
~~3. **typescript-eslint → 8.71.0 ACCEPTED** (Lars: "latest if possible").~~ done — accepted and documented; the real TS pin rule stands in `AGENTS.md:206`
   The real constraint is the peer range `typescript <6.1.0`, not an 8.70.x
   hold — root TS stays 6.0.3 (latest 6.x; 6.0.4 does not exist; TS 7
   unsupported by ts-eslint, #10940). Caught a RECURRENCE of the root TS
   `^7.0.2` drift (BuildFlow pnpm-update wrote the manifest without
   relocking) — restored 6.0.3. AGENTS pin note rewritten to the real rule.
~~4. **eslint 10.12.0 → 10.11.0 + `minimumReleaseAgeExclude` removed.**~~ done — exclude removed; eslint has since rolled forward to 10.14.0 ( `package.json:130` )
   10.12.0 published 2026-10-02T20:08Z (<24h). Bump back any time after
   2026-10-03T20:08Z (aged then). eslint/ts-eslint/vitest/oxlint/jscpd now
   all at latest-allowed; `pnpm run verify` green on the new set (1250
   tests, 98% coverage).
~~5. **nix-fmt → GREEN via generated-artifact exclusion doctrine** (flake.nix~~ done — exclusion doctrine stands in `flake.nix:70` and `AGENTS.md:211`
   treefmt prettier excludes): `docs/**/*.html`, `docs/_archive/**` +
   `docs/status/**` (point-in-time reports — prettier wanted to re-wrap
   their code fences), `website/src/styles/*.out.css`, `pnpm-lock.yaml`.
   Gotcha learned: local treefmt is mtime-cached and masked drift —
   `nix fmt -- --fail-on-change -c` or `nix flake check` (cold sandbox) is
   the honest check. `nix flake check`: ALL CHECKS PASSED.
~~6. **pnpm-audit 15 → 0 actionable:** overrides for nanoid 3.3.18, devalue~~ done — overrides stand in `pnpm-workspace.yaml:5-14`; audit clean per `FEATURES.md:5`
   ^5.9.3, brace-expansion ^1.1.21/^5.0.12, fast-uri ^3.1.8 (range-selectored
   keys where majors coexist). The one unpatchable advisory
   (http-cache-semantics, no fixed release exists, website-build-only
   chain) dismissed via `auditConfig.ignoreGhsas` with removal condition
   documented. `buildflow -s pnpm-audit` exit 0 cache-cold.
~~7. **Formatter split-brain resolved:** `.buildflow.yml` created — oxfmt and~~ done — `.buildflow.yml` exists with the formatter skips and rationale
   prettier-format skipped with rationale (treefmt/prettier via nix-flake-check
   is the single formatting owner; the duplicates don't honor its excludes).
~~8. **CHANGELOG** [Unreleased] entry written for #252 (diagnostic, example,~~ done — entry in the released 1.1.0 section ( `CHANGELOG.md:145`, `:185` )
   integration test, leak fix).

**Terminal state:** `buildflow` full = exit 0 ("passed with warnings", only
nix-checker info-level suggestions remain); `pnpm run verify` = exit 0;
`nix flake check` = passed.

**Gated on Lars (unchanged):** issue #252 reply posting, 1.0.1-vs-1.1.0
version call + release, TODO_LIST/ROADMAP harvest, crush-config lessons.

**Worktree cleanup (when baseline WIP lands):**
`nix profile remove buildflow && nix profile install git+file:///home/lars/projects/BuildFlow#buildflow && git -C /home/lars/projects/BuildFlow worktree remove --force /home/lars/projects/.bf-jscpd-worktree`
