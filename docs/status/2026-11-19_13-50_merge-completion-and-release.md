# Status Report: Merge Sequence Completion + 1.2.0 Release (2026-11-19 13:50)

Session scope: finish the entire merge sequence (user directive: "the WHOLE
TODO LIST"), full hygiene pass, and cut release 1.2.0. Continues
`2026-11-19_07-36_merge-sequence-phase2.md` (phase 2) and
`2026-11-18_23-23_pr-review-sweep-master-red-ci-fix.md` (phase 1).

## End state

- **All 10 mergeable PRs landed.** Only #295 (baywet's import-CLI draft)
  remains open, intentionally untouched.
- Master CI green after every single merge (invariant held end-to-end).

| PR    | Outcome                                                              | Merge sha |
| ----- | ------------------------------------------------------------------- | --------- |
| #296  | merged (phase 2, brand-generator dedup)                              | cac33d0d  |
| #286  | merged (phase 2, preserve user types)                                | f97bd16e  |
| #287  | merged (phase 2, inline stdlib instantiations)                       | 1b8a5107  |
| #288  | merged (phase 2, union-variant literals)                             | fbfa1b15  |
| #289  | merged (derived-variant message discovery)                           | 004728fb  |
| #290  | merged (`$ref` URI-fragment encoding)                                | 9fc16602  |
| #291  | merged (channel IDs separate from addresses, conflict resolved)      | 625a91d4  |
| #293  | merged (minor-and-patch group: eslint 8.72.2, oxlint 1.93, vitest 5.1, astro 7.4.8 lockfile) | 0bcc16cf |
| #294  | **closed as superseded** — #293 already resolved astro to 7.4.8; merging would have downgraded to 7.4.7 | — |
| #292  | merged (@hono/node-server 2.1.8 in website/video)                    | 9943a80c  |
| #278  | merged (hyperframes 0.9.6 in website/video)                          | 56ab9fde  |

## a) Fully done (this phase)

- Merges 289 → 290 → 291 → 293 → 292 → 278, each with fresh
  `gh pr update-branch` + green branch CI + green master CI after landing.
- #291 conflict resolution: merged master into `feat/283-separate-channel-ids`
  in a worktree, resolved the single conflict in
  `src/builders/operation-discovery.ts` (kept BOTH `data.id ?? data.path` and
  the `ctx.program` arg), proved the file byte-identical to the
  `integration-test` reference, ran the FULL local gate in the worktree
  (1333 tests, 96.9% coverage, 0 jscpd clones, 15/15 examples), pushed to
  baywet's fork, CI green, merged. No run approval was needed this time
  (the update-branch/push runs started in_progress directly).
- Issues #280–#285 all CLOSED/COMPLETED with `closedByPullRequestsReferences`
  (auto via "Fixes #N" in the PR bodies) — no manual closing needed.
- AGENTS.md updated: 38 diagnostic codes (22 error + 16 warning, counted from
  `src/lib.ts`), Channel-ID bullet (PR #291), `$ref` URI-encoding gotcha
  (PR #290), derived-variant expansion note (PR #289).
  `docs/DOMAIN_LANGUAGE.md`: `@channel(address, id?)` row + message-expansion
  sentence.
- CHANGELOG `[1.2.0] - 2026-11-19` section written (release.yml's extractor
  verified against the header format).
- TODO_LIST harvested (new "Post-Merge Follow-ups" section, 5 rows).
- Public comments posted (github-voice checked, all 7 passed 0 FAIL):
  thank-yous on #286–#291 (with branch-touch disclosures on 286/288/291) and
  the openapi3-runtime-dep design question on #295.
- `website/video`: `npm ci` clean (hyperframes 0.9.6, @hono/node-server 2.1.8,
  0 vulnerabilities). `pnpm audit`: clean (1 documented ignored advisory —
  the minimatch dismissal).
- Main checkout synced to `56ab9fde` (fast-forward, no daemon divergence).

## b) Partially done

- Release 1.2.0: see §f — gate + tag + publish flow is the remaining step
  as this report is written.

## c) Not started

- #295 deep review (blocked on baywet marking the draft ready; question
  posted).

## d) Operational surprises

- None this phase. The GitHub mechanics that bit phase 2 (reruns on stale
  merge refs, fork-run approvals) were already solved; `update-branch`
  worked first try every time.

## e) What to improve

- Nothing new; phase-2 lessons (canary-verify GitHub mechanics, pull --rebase
  after remote merges, keep state off /tmp) all applied successfully here.

## f) Next

1. Release 1.2.0: `pnpm install --lockfile-only && pnpm install
   --frozen-lockfile && pnpm run verify` proof, `pnpm version minor`, tag
   `v1.2.0` (annotated), push tag → release.yml (full gate + npm publish
   --provenance + GitHub Release from the CHANGELOG section), then verify
   npm + release + dist-tags.
2. Post-release: update TODO_LIST Release section with the shipped row.
3. Cleanup: local `pr-*` / `integration-test` branches, /tmp worktrees.

## g) Questions

- None — the three open questions from phase 2 were answered by the user's
  "the WHOLE TODO LIST" directive (all three: yes).
