# Status Report: Merge Sequence Execution, Phase 2 (2026-11-19 07:36)

Session scope: execution of the user-approved merge sequence (approve CI, push prepared fixups to baywet's fork branches, merge in verified order), plus recovery from two operational surprises. Continues `2026-11-18_23-23_pr-review-sweep-master-red-ci-fix.md`.

## Where the sequence stands (7 of 11 PRs remain open, 4 merged)

Merged to master (all squash, all with green PR CI AND green master CI on the merge push):
- **#296** brand dedup / red-CI fix (cac33d0d)
- **#286** preserve user types (f97bd16e) — with the dead-code fixup I pushed to baywet's branch first
- **#287** inline stdlib instantiations (1b8a5107)
- **#288** union-variant literals (fbfa1b15) — after pushing a master-merge resolution to his branch

Ready, not yet merged (sequence was interrupted here):
- **289** derived messages — `update-branch` done, fresh CI **success**, mergeable now
- **290** $ref encoding — expected clean merge; update-branch + CI not yet run
- **291** channel IDs — will conflict with 289 (`operation-discovery.ts` one-liner); resolution recipe prepared and proven in the integration tree
- **293, 294, 292, 278** (Dependabot) — all `update-branch`ed, all CI **pass** (verified 293/294 locally earlier incl. full website gate for 294)

## a) Fully done (this phase)

- All 7 fork workflow-run approvals (GitHub API) — baywet's PRs can run CI now; future pushes to his branches trigger runs that need approval per-push (I approved each new one as it appeared).
- Fixup push to `baywet:fix/281-preserve-user-schemas` (dead `collectAllStdlibNames` removal) — maintainerCanModify worked as expected.
- The complete 296→286→287→288 merge chain with per-PR green CI before each merge and green master CI after each.
- 288 conflict resolution: rebuilt from scratch after /tmp wipe, validated properly this time (TS parse + brace balance + marker scan + build + **ran the resolved test file: 20/20 pass** BEFORE pushing to his fork).
- Dependabot branches updated and green.

## b) Partially done

- 289: fully prepared (CI green) but not merged — interrupted at exactly that point.
- 291: resolution designed and proven in the integration tree; not yet pushed to his branch (must follow 289's merge).
- Local main checkout: rebased onto merged master (was diverged — see d); daemon commits preserved; the daemon will push them.

## c) Not started

- Merges for 289, 290, 291, 293, 294, 292, 278.
- `cd website/video && npm ci` after 278/292 (AGENTS.md-mandated).
- Post-merge hygiene: close issues #280–285, AGENTS.md diagnostic count 36→38, TODO_LIST harvest, CHANGELOG 1.2.0 notes (289 changes existing output — golden updated; 290 encodes refs; 291 adds channel IDs), thank-you comment to baywet, PR 295 draft feedback (openapi3-as-runtime-dep question).
- Cleanup: prunable worktree metadata, local `pr-*` + `integration-test` branches, `/tmp` rebuild for the 291 resolution.

## d) Totally fucked up / operational surprises (with fixes applied)

1. **GitHub reruns reuse stale merge refs.** Approving old runs and API-rerunning failed runs both executed against PRE-#296 master trees — burned two failed CI cycles on 287 plus all four dependabot reruns before I switched to `gh pr update-branch` (merge master into branch → fresh commit → fresh merge-ref run). Should have verified the mechanism on ONE PR before fanning out.
2. **/tmp got wiped mid-sequence** (all 13 worktrees + review logs deleted; branches survived in .git). Rebuilt the needed worktree via `git worktree prune` + re-add. Lesson: keep in-flight work off volatile /tmp; branches are the durable artifact, directories are not.
3. **Local master diverged from origin** because I merged via `gh` while the auto-commit daemon owns the local checkout: two daemon commits (my AGENTS.md incident note + the 23:23 status report) sat unpushed under the old master. Detected during this report, fixed with a clean `git pull --rebase origin master` (both commits preserved on top of fbfa1b15). Root lesson: after the FIRST gh-mediated merge, I should have synced the local checkout immediately.
4. Minor: first 289 poll read the OLD run's databaseId (`--limit 1` grabbed a superseded run) — one wasted poll cycle; fixed by listing runs by createdAt.

## e) What to improve

- Learn/verify one GitHub Actions mechanic on a single canary before batch-applying it (rerun vs update-branch).
- After any remote-side merge, immediately `git pull --rebase` the daemon-owned local checkout.
- Keep active working state on non-volatile storage; /tmp is for scratch.
- Master CI verified green after every merge this time — keep that invariant for the remaining seven.

## f) Next (in order, all verified-ready or one prepared step away)

1. `gh pr merge 289 --squash` (CI already green). 2. `gh pr update-branch 290` → wait green → merge. 3. Push 291 resolution (merge master into his branch, combine `data.id ?? data.path` with `ctx.program` arg, validate, push to fork) → CI → merge. 4. Merge 293, 294, 292, 278 (all CI green now). 5. Verify master CI after each. 6. `cd website/video && npm ci`. 7. Close issues #280–285 with fixed-by references. 8. AGENTS.md: 38 diagnostic codes + the two new decorators documented. 9. TODO_LIST.md harvest + CHANGELOG 1.2.0 notes (output-shape changes: 289 message expansion, 290 encoded refs, 291 channel IDs). 10. Thank-you comment on baywet's merged PRs; comment on #295 draft re openapi3 runtime dep. 11. Cleanup worktree metadata + local branches. 12. Optional: 1.2.0 release flow (`pnpm version minor` → tag → release.yml) when user says go. 13. Optional: daemon-push CI failure alerting (two weeks of red went unnoticed once already).

## g) Questions

1. Continue the remaining sequence now (merge 289 → 290 → 291 → 293 → 294 → 292 → 278 → hygiene)? Any holds?
2. Cut release 1.2.0 immediately after (CHANGELOG + version + tag → release.yml), or hold the release?
3. Post public comments: thank-you/summary on baywet's six merged PRs and the openapi3-dependency question on draft #295 — yes, or keep it silent?

## Environment

- origin/master: fbfa1b15 (clean, all CI green); local master rebased on top with 2 daemon commits pending push.
- PR 295 draft: intentionally untouched.
- Integration branch `integration-test` in local .git still holds the full pre-verified future (all 6 + fix + fixup, full gate green) — reference for the 291 resolution.
