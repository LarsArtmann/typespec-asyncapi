# Status Report: Open-PR Review, Merge & Dependency-Security Cycle

**Timestamp:** 2026-11-01 23:58 CET
**Session scope:** Review all open PRs → verify locally → post reviews → (on "do it all") merge everything, land follow-ups, push, confirm CI.
**Repo:** LarsArtmann/typespec-asyncapi @ master `a591bf90` (CI: **success**)
**Open PRs before:** 4 (all Dependabot). **After: 0.**

---

## TL;DR

All 4 open Dependabot PRs were reviewed with local verification (worktrees, frozen installs, full gates, npm audits), approved or superseded, merged in safe order, and both follow-ups I had flagged in the reviews (website/video audit overrides + fast-uri override floor) were landed and verified on the final tree. Master's `website/video` `npm ci` — broken since Oct 23 and invisible to CI — is fixed. Two security releases (fast-uri 4 CVEs, hono 5 GHSAs) are in. Final master CI: green. Nothing left open, nothing pushed unverified.

The two things this session got wrong were both self-inflicted tooling races (a forgotten `--no-verify` on an amend that ran the 2-minute husky gate and opened a window for the auto-commit daemon to steal the ref mid-amend). Recovered cleanly, but they cost time and produced two conventionally-worded daemon commits instead of curated messages.

---

## a) FULLY DONE

1. **PR #277 (hono 4.13.7 → 4.13.16, website/video) — reviewed, approved, merged.** Security release: 5 GHSAs (mount middleware bypass, RegExpRouter wildcard middleware skip, validator form bypass, css helper HTML injection, csrf text/ping miss). Verified on branch: `npm ci` succeeds, `npx hyperframes --version` → 0.8.225, `npm ls hono` → 4.13.16.
2. **PR #276 (fast-uri 3.1.8 → 3.1.9, root workspace) — reviewed, approved, merged.** Security release: 4 CVEs (2 Medium: percent-encoded scheme spoofing, domain-host confusion; 2 Low). Verified: frozen-lockfile install clean, full `pnpm run verify` gate green (1275 tests, coverage gate, 0 clones), 3.1.9 satisfies the workspace override floor.
3. **PR #275 (typescript-eslint trio 8.72.0 → 8.72.1 + @astrojs/starlight 0.42.6 → 0.42.7) — reviewed, approved, merged.** Verified: frozen install + full verify gate green + website gate re-run locally on the branch (astro check, 778 internal links, CSP on 22 pages). Publish dates (Oct 23/26) clear the pnpm `minimumReleaseAge` soak by days.
4. **PR #274 (hyperframes → 0.8.206) — identified as superseded, comment posted, closed after #277 merged.** #277's tree re-resolve ships hyperframes 0.8.225 (> 0.8.206) AND the hono security fixes #274 lacked.
5. **Master breakage discovered, root-caused, and fixed:** `website/video/package.json` demanded `hyperframes ^0.8.186` since daemon commit `e46a0468` (Oct 23) while the committed lockfile still embedded `^0.8.105`/locked 0.8.134 → `npm ci` failed on master for 9 days while CI stayed green (CI never installs `website/video`). Repaired by #277's full tree re-resolve; drift origin verified via `git show`.
6. **New audit findings in #277's re-resolved tree, quantified and resolved:** undici 7.25.0 (29 advisories, high), zod < 4.6.6 (high), @hono/node-server 2.1.1 (moderate, serveStatic path double-decode). Verified `npm audit fix` is the WRONG fix (it downgrades hyperframes to 0.8.214); verified the overrides recipe instead: `{"undici": "^7.30.1", "zod": "^4.6.6", "@hono/node-server": "^2.1.3"}` → **0 vulnerabilities with hyperframes still at 0.8.225**.
7. **Follow-up 1 landed: website/video npm overrides** (commit `06e2afd9`, via daemon) — `npm install` re-locked the tree; audit 0; versions confirmed via `npm ls`.
8. **Follow-up 2 landed: fast-uri override floor raised `^3.1.8` → `^3.1.9`** in `pnpm-workspace.yaml` (commits `835545a9` yaml + lockfile record in `06e2afd9`) — so pre-CVE fast-uri can't sneak back on a fresh resolve. `pnpm install --frozen-lockfile` verified after the change.
9. **Final-tree verification before push:** full `pnpm run verify` gate green (build, eslint+oxlint, typecheck:test, 1275 tests / 105 files, coverage gate 97.9% avg / min 75%, jscpd 0 clones) + website gate green (astro check + build + html-validate + 778 links + CSP on 22 pages) + `npm ci` + `npm audit` green in website/video.
10. **Pushed and confirmed:** master `a591bf90`; GitHub Actions `build-and-test` = **success**; PR list = 0 open; #274 CLOSED.
11. **Reviews posted on all 4 PRs** with evidence-first bodies and AI-assisted disclosure notes (branch checked out, gates executed, audit fix verified) — approvals on #275/#276/#277, supersession comment on #274.
12. **Memory maintenance (AGENTS.md, 3 edits, all committed):** corrected the stale "root typescript pinned at 7.0.2" claim (actual: 6.0.3, verified in package.json); recorded the website/video npm-drift gotcha (daemon manifest writes, `npm ci` uncovered by CI, embedded-manifest review heuristic); recorded the landed overrides + the "npm audit fix downgrades hyperframes — don't use it" trap.
13. **Worktree/branch hygiene:** 3 review worktrees + 3 local PR branches created and fully cleaned up; working tree clean at end of session.

## b) PARTIALLY DONE

1. **Root-cause prevention for the 9-day invisible breakage — diagnosed, not fixed.** The reason it stayed broken: no CI step ever runs `npm ci` (or an audit) in `website/video`. I documented the lesson in AGENTS.md and flagged it in review comments, but the CI change itself is NOT in (see c).
2. **Atomic manifest+lockfile commits — content atomic, history not.** The fast-uri floor bump landed as yaml in one daemon commit and lockfile+overrides in the next (daemon raced my amend). Content verified correct and frozen-install green, but the history reads as two unrelated auto-commits instead of one curated "raise fast-uri floor" commit.
3. **Curated commit messages for follow-ups — lost to the daemon.** Both follow-up changes carry `chore: auto-commit N changed file(s) (heuristic)` messages; the real context lives only in the PR review bodies and AGENTS.md.
4. **Post-merge master CI — watched to success for `build-and-test` only.** The full CI file also runs `check-examples`; that ran inside the same workflow (green), but I did not locally re-run example compilation on the merged tree (accepted: CI covers it, and the emitter gate ran locally).

## c) NOT STARTED (all flagged, none begun)

1. **CI: `npm ci` + `npm audit --audit-level=high` gate for `website/video`** — the structural fix that would have caught the Oct 23 drift the same day. Cheapest form: one job step `cd website/video && npm ci && npm audit --omit=dev && npm audit --audit-level=high` (or with dev deps, policy call).
2. **Dependabot automerge policy for verified-green dependency PRs** — this cycle was fully manual (reviews → human-in-loop "do it all"). Automerge for green, gated, security/minor-patch PRs would have landed #275/#276 within hours of green CI.
3. **Re-render of the website demo video on hyperframes 0.8.225** — the render pipeline changed materially (PNG color-tag determinism, preview/render frame agreement, producer no-timeline fix). Existing committed video output predates all of it.
4. **docs-health HARVEST of this report's section (f) into TODO_LIST.md / ROADMAP.md** — deliberately deferred per the skill's own rule and the user's "don't research other stuff" instruction; the list below is entombed until harvested.

## d) TOTALLY FUCKED UP

Nothing catastrophic — no data loss, no broken push, no reverted work. The honest list of self-inflicted failures, all recovered:

1. **Forgot `--no-verify` on the `git commit --amend`** → the husky pre-commit hook ran the FULL ~2-minute verify gate; and because the hook regenerates files (`generated-bindings.ts`, coverage dirs, jscpd-report), the auto-commit daemon saw "changes" and committed mid-hook — the amend then died with `fatal: cannot lock ref 'HEAD'` (ref moved under me). The gate itself PASSED (so the tree was verified), but this was the session's dumbest avoidable moment: AGENTS.md documents the `--no-verify` convention explicitly, and I had read it that same session.
2. **Daemon commit-message races (twice).** The daemon committed `pnpm-workspace.yaml` alone while the matching lockfile regen was still running, then committed the rest mid-hook. Result: correct content, lousy history. Fighting the daemon again would have risked more races; I accepted it. A stricter sequencing (stage + commit within one command, no hooks) was available and not used.
3. **Three wasted tool calls on wrong invocations:** `gh pr diff <n> -- <path>` (not supported — pathspec filtering isn't a thing there), and two `edit`-before-`view` rejections on AGENTS.md (the rule says view first; I had the content in context from the conversation start, but mtime had moved). Each failure was recoverable in one step, but they were all preventable by following known-good patterns the first time.
4. **Late discovery of #277's true scope.** My first diff greps framed #277 as "hono only" and #274 as the drift-repair; only a deeper pass over the full 602-line diff revealed #277 ALSO re-resolves hyperframes to 0.8.225 (superseding #274 entirely). Had I read the complete diff files up front, the supersession finding and the merge-order recommendation would have arrived one research round earlier.

## e) WHAT WE SHOULD IMPROVE

1. **Close the CI gap that made 9 days of breakage invisible** — `website/video` needs an install+audit step in CI, period. This is the single highest-leverage change from this session.
2. **Dependabot throughput policy** — 4 PRs sat open for 1–2 days (one security pair) with green CI and no automerge. If the manual-review bar is "gates green + lockfile-consistent", that bar is exactly what a CI-gated automerge already encodes.
3. **Don't fight or be surprised by the daemon** — any commit operation that (a) runs the husky gate or (b) leaves files dirty for >~1 polling interval will race it. Rule of thumb going forward: `--no-verify` always, single-command stage+commit, and never amend across a daemon tick.
4. **Read the whole diff before the first conclusion.** Full-diff-file reads (`> /tmp/prN.diff` + read) beat incremental greps for Dependabot PRs, where "one dependency" often means "full tree re-resolution".
5. **AGENTS.md claims need a freshness pass** — the stale typescript pin was load-bearing documentation contradicted by the manifest. A periodic docs-health VERIFY sweep (or a lint that greps pins claimed in AGENTS.md against manifests) would catch drift.
6. **The overrides pin set in `website/video` will rot** — undici/zod/@hono/node-server overrides are minimum-floor pins; when hyperframes bumps its ranges, the overrides may mask or conflict with newer trees. They need revisiting on every hyperframes major/minor.
7. **Verification asymmetry:** root workspace PRs got frozen-install + full gate; `website/video` PRs got `npm ci` + version checks + audit but no build/render exercise (no build script exists there; a render was too heavy for review). The fix is a real script (`build`/`check`) in `website/video/package.json` so reviews and CI have something to run.

## f) NEXT — up to 50 things (ordered by impact; brainstorm, harvest-worthy)

**Security & CI (high impact)**
1. Add CI job: `cd website/video && npm ci && npm audit --audit-level=high` (would have caught Oct 23 drift same-day).
2. Add CI job or step: `pnpm audit` gate on the root workspace (currently manual; the workspace yaml has pins but no enforced check).
3. Enable Dependabot automerge (green CI + gates) for `minor-and-patch` groups and security bumps; keep majors manual.
4. Add `package-lock.json` consistency check: fail if the embedded root manifest in the lockfile disagrees with `package.json` (the exact drift class that bit twice).
5. Consider a scheduled `npm outdated`/`pnpm outdated` report workflow so bumps arrive in batches rather than one-PR-per-package.
6. Branch protection review: direct pushes to master are possible (this session pushed follow-ups directly, per order) — decide if that stays.
7. Add the `buildflow` dependency-update caveats (manifest-without-lockfile, minimumReleaseAgeExclude) as a repo-side check, since BuildFlow's updater caused this class of drift before (AGENTS.md, 2026-10-03).
8. Verify `pnpm audit` is actually clean on the merged tree (CI's install didn't audit; I verified website/video only).
9. Re-check `npm audit --production` vs `--include=dev` policy for website/video (current overrides fix is dev-only exposure; decide which level gates).
10. Secrets/permissions sweep: confirm the dependabot GH token / branch rules don't allow automerge of workflow-file changes.

**Repository hygiene (medium)**
11. Curate/rename the two daemon follow-up commits via interactive rebase IF pushed-history rewriting is acceptable (else leave; content is correct).
12. Give `website/video/package.json` real scripts (`build`, `check`) so reviews/CI exercise the video tree.
13. Add a one-line README in `website/video` documenting: npm-managed, why pnpm workspace excludes it, the overrides, the render entrypoint.
14. Record the merge-order/override decisions for this cycle in `CHANGELOG.md` or release notes (security bumps worth surfacing to consumers).
15. AGENTS.md doc-health pass: grep every version pin claimed in AGENTS.md against actual manifests (typescript note was stale; there may be more).
16. Move the "up to 50" list (this section) into TODO_LIST.md via docs-health HARVEST.
17. Annotate older status reports that reference `fast-uri ^3.1.8` / pre-0.8.225 hyperframes so they don't mislead (docs-health ANNOTATE mode).
18. Consider deleting the stale `test` placeholder script in `website/video/package.json` (`echo "Error: no test specified"`) or wiring a real one.
19. `.jscpd.json` / lint scopes: confirm `website/video` is intentionally excluded from duplication/lint gates and document why.
20. Review whether `tsx 4.23.15` in root devDeps is still used (AGENTS.md says `.ts` scripts run via `bun`, never `tsx`; tsx appearing in installs looks vestigial — verify before removing).

**Video/render stack (medium)**
21. Re-render the website demo video on hyperframes 0.8.225 (PNG color + producer fixes landed since the current render).
22. Diff-render a short composition on 0.8.134 vs 0.8.225 to see if visuals change (color fixes imply possible pixel differences).
23. Pin/record the hyperframes CLI version used for published renders somewhere (reproducibility of the landing-page centerpiece).
24. Evaluate the new `hyperframes check` audio-loss catcher against the existing compositions.
25. Decide whether `website/video` node_modules should be pruned from any backups/images (77 packages, puppeteer-core present).

**Dependency-stack follow-ups (medium/low)**
26. Watch for the next Dependabot wave post-merge: #277's tree re-resolve may trigger new grouped PRs against the new lockfile.
27. Re-check the `postcss-selector-parser@<7.1.6: 7.1.6` override crossing a major boundary after the next website build (AGENTS.md warns; website gate was green this session, keep it that way on future bumps).
28. When `typescript-eslint` ships the next release, revisit the TS 7 experiment (root is 6.0.3; TS 7 remains untested territory per AGENTS.md).
29. Confirm starlight-llms-txt 0.12.0 output unchanged under starlight 0.42.7 (`/llms*.txt` endpoints) — CI link check passed, but a content diff of `llms-full.txt` would prove no drift.
30. Raise override floors generally: the security-pin block in `pnpm-workspace.yaml` is minimum-bound; audit whether `js-yaml`, `nanoid`, `devalue`, `brace-expansion` floors should follow their latest patched versions.
31. Dependabot config review: are `website/video` and root grouped sensibly (root has a minor-and-patch group; website/video had one too) — consider adding a `security-only` fast-path group.
32. Check whether `undici` override floor should move to the audited-patched line (7.30.1) vs latest 8.x — 8.x is a major; document why 7.x is held.
33. Add `engines` / `packageManager` pins to `website/video/package.json` so npm-vs-pnpm misuse fails fast.
34. Investigate the `npm warn install-scripts` allowlist path for `esbuild@0.28.2 postinstall` (benign this session — CLI ran — but the warning will recur for every fresh clone).

**Docs & knowledge (lower, cheap)**
35. Add the "read the full diff before concluding" Dependabot-review heuristic to the project AGENTS.md review checklist.
36. Add the "daemon races any hook-running commit; always `--no-verify`, never amend across a tick" rule to AGENTS.md operational safety (this session's §d evidence).
37. Extend the AGENTS.md Dependabot bullet with the concrete verified recipe for website/video override bumps (it currently says what NOT to do; add the positive path used).
38. Screenshot/annotate this cycle's PR review comments as the canonical example of the AI-assisted review disclosure pattern.
39. Document in AGENTS.md that master CI `build-and-test` includes the website gate (ci.yml:38) — I had to read the workflow to learn this.
40. Update the AGENTS.md "Competing emitter" / fleet-review notes only if this cycle touched them (it didn't — skip; listed to force the question).

**Testing & verification depth (lower)**
41. Add a golden/lock test that asserts the website/video lockfile's embedded manifest range equals package.json's range (test-side twin of item 4).
42. Property-test or script the pnpm `minimumReleaseAge` compliance check before merges (currently discovered via install failure).
43. Add a tiny smoke render (1-frame PNG snapshot) test for website/video runnable in <30s for CI.
44. Explore `npm ci --dry-run` diffing in CI to alert on lockfile-only drift between manifest and lock.
45. Track husky pre-commit runtime (2 min) — consider a fast-hook split (lint-staged-style) so `--no-verify` isn't the de-facto path.

**Strategic / open questions (harvest to ROADMAP)**
46. Migrate `website/video` to pnpm to unify tooling (one lockfile format, one audit story, one drift class) — cost: re-lock + CI changes.
47. Decide the render artifact policy: are rendered MP4s committed to the website repo or built in deploy? (affects whether hyperframes bumps can silently change the live site)
48. Consider caching npm/pnpm stores in CI keyed on lockfile hashes (install steps are the slow part of every dependency PR).
49. Evaluate Renovate vs Dependabot given pnpm workspace + npm sub-project mix (Renovate handles mixed managers and lockfile maintenance more aggressively).
50. Post-mortem the "9 days broken, CI green" class across OTHER LarsArtmann repos (any sibling project with an npm-managed subdirectory outside the workspace has the same latent gap).

## g) Three questions I can NOT figure out myself

1. **Render now or not?** The website demo video was rendered on an old hyperframes; 0.8.225 fixes PNG color determinism and preview/render frame agreement. Do you want a fresh render + visual review as part of the website, or is the existing artifact frozen until a deliberate content change?
2. **Automerge policy:** should green-gated Dependabot PRs (security + grouped minor/patch, verified by the same local checks I ran) auto-merge in the future, or do you want the manual review loop kept for everything?
3. **website/video tooling:** is `website/video` npm-managed by choice (isolation from the pnpm workspace), or should it migrate to pnpm and end the two-package-manager split that produced this drift class?

---

*Report generated per the 2026-11-01 session: PR review → verification → merge cycle. Point-in-time snapshot; section (f) is brainstorm-grade input for docs-health HARVEST, not a commitment list.*
