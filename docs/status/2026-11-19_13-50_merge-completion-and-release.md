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

- Release 1.2.0: version bumped (022a0de4), annotated tag `v1.2.0` pushed,
  release.yml ran — and FAILED at `npm publish` with E404: the NPM_TOKEN
  (GitHub secret AND local `~/.npmrc`, both created 2026-08-21) expired on
  its 90-day lifetime exactly today; `npm whoami` → E401 locally, npm still
  serves 1.1.0. The GitHub Release v1.2.0 was created manually from the
  CHANGELOG section (workflow's own extraction logic, byte-identical) so the
  tag is not releaseless. Remaining: Lars mints a granular npm token →
  `gh secret set NPM_TOKEN` → `gh run rerun 44529186193 --failed`. TODO_LIST
  Release row carries the full recipe.

## c) Not started

- #295 deep review (blocked on baywet marking the draft ready; question
  posted).

## d) Operational surprises

- **NPM_TOKEN expired mid-release (2026-11-19):** 90-day token created
  2026-08-21 died the same day as the v1.2.0 tag. CI publish failed E404
  (right after npm's 2FA-bypass-token restriction notice — expiry is the
  simpler explanation, both tokens share the Aug-21 birthday); the local
  token is E401 too. npm's granular-token migration notice suggests future
  tokens must be granular regardless. TODO_LIST Release row upgraded to
  URGENT with the complete fix recipe.

## e) What to improve

- Nothing new; phase-2 lessons (canary-verify GitHub mechanics, pull --rebase
  after remote merges, keep state off /tmp) all applied successfully here.

## f) Next

1. **BLOCKED on maintainer:** rotate NPM_TOKEN (granular, @lars-artmann
   scope, publish rights) → `gh secret set NPM_TOKEN --repo
   LarsArtmann/typespec-asyncapi` → `gh run rerun 44529186193 --failed` →
   verify `npm view @lars-artmann/typespec-asyncapi version` = 1.2.0 +
   provenance + dist-tags (`latest` auto-moves; prerelease channels stay on
   1.1.0 until re-pointed if desired).
2. Cleanup: local `pr-*` / `integration-test` branches, /tmp worktrees
   (executed this session; re-check nothing regenerated).

## g) Questions

- None — the three open questions from phase 2 were answered by the user's
  "the WHOLE TODO LIST" directive (all three: yes).
