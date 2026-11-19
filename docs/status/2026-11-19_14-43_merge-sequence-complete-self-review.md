# Status Report: Merge Sequence Complete, 1.2.0 Half-Shipped, Self-Review (2026-11-19 14:43)

Session scope: finishing the entire PR merge sequence + hygiene + 1.2.0
release, followed by the user's self-review demand ("What did you forget?
What could you have done better?"). This report covers THIS session only
(continues `2026-11-19_13-50_merge-completion-and-release.md`).

**Verified this session (fresh command output, not memory):** all seven
merges landed with green PR CI before and green master CI after each
(`gh run list/view` polled per merge); issues #280–#285 all
CLOSED/COMPLETED via `closedByPullRequestsReferences`; full local gate on
merged master (verify 1333 tests / 96.9% coverage / 0 clones, 15/15
examples, website check 22 pages, nix format derivation PASS); `npm ci`
in website/video clean (hyperframes 0.9.6, 0 vulns); `pnpm audit` clean;
npm registry state read anonymously (`npm view` → still 1.1.0);
GitHub Release v1.2.0 exists (published, not draft); master CI green on
final commit 39b25b75 (after one network-flake rerun).

**NOT verified:** npm publish of 1.2.0 (blocked on dead credentials — see
§d); PR #298's CI (fork run, not approved, not attempted — left for
review); nothing about repos outside this one.

## a) FULLY DONE

1. **#289** merged (004728fb) — discriminated derived-variant message
   discovery. Issue #282 auto-closed.
2. **#290** merged (9fc16602) — `$ref` URI-fragment encoding. Issue #285
   auto-closed.
3. **#291** merged (625a91d4) — channel IDs separate from addresses. The
   conflict with #289 was resolved in a worktree, the resolved file proven
   byte-identical to the pre-verified `integration-test` tree, FULL gate
   run locally BEFORE pushing to baywet's fork (1333 tests, 96.9%, 0
   clones, 15/15 examples), fork CI green, merged. Issue #283 auto-closed.
4. **#293** merged (0bcc16cf) — minor-and-patch group (eslint 8.72.2,
   oxlint 1.93.0, vitest 5.1.0, astro 7.4.8 in lockfile, jscpd 5.4.3).
   Verified: root+website `typescript` pins survived at 6.0.3.
5. **#294 CLOSED as superseded** (comment posted) — its astro 7.4.7 bump
   predates the 7.4.8 already in master's lockfile via #293.
6. **#292** merged (9943a80c), **#278** merged (56ab9fde) — website/video
   npm deps; `npm ci` + version + audit verified locally after.
7. **Docs updated:** AGENTS.md (38 codes = 22 error + 16 warning counted
   from `src/lib.ts`; Channel-ID bullet; `$ref` URI-encoding gotcha;
   derived-variant note), DOMAIN_LANGUAGE.md (`@channel(address, id?)`,
   message expansion), CHANGELOG `[1.2.0] - 2026-11-19` section (release.yml
   extractor format verified against the workflow source).
8. **TODO_LIST harvested:** new "Post-Merge Follow-ups" section (5 rows:
   #295 review track, daemon-push CI alerting, property-test seeds,
   channel-id × split-schemas e2e, fleet CI sweep).
9. **7 public comments posted** (github-voice checker: 0 FAIL each):
   thank-yous on #286–#291 (with branch-touch disclosures) + the
   openapi3-runtime-dep question on #295.
10. **Full local gate green on final master** + website/video lockfile
    integrity + format derivation PASS.
11. **Release 1.2.0, documentation half:** version bumped (022a0de4),
    annotated tag `v1.2.0` pushed, GitHub Release created from the exact
    CHANGELOG section (workflow's own extraction logic).
12. **Cleanup:** /tmp worktrees removed, session branches deleted
    (`integration-test` first proven `src/`-identical to master).

## b) PARTIALLY DONE

1. **Release 1.2.0, npm half:** everything done except the registry PUT —
   run 44529186193 failed at `npm publish` (E404). npm serves 1.1.0. Fix
   recipe + both paths in TODO_LIST (Release row).
2. **PR #298 (baywet, npm trusted publishing):** diff inspected (clean
   OIDC switch: drops NPM_TOKEN, adds registry-url + job-level
   permissions); NOT reviewed in depth, CI not approved, NOT merged —
   arrived mid-session, release-critical, deserves the same per-PR rigor
   as #286–#291.

## c) NOT STARTED

1. Deep review of #295 (import CLI, draft) — blocked on baywet's
   ready-for-review signal; my design question is posted on it.
2. Post-publish verifications for 1.2.0: registry smoke test (fresh
   install + compile + AJV), sigstore provenance logIndex check,
   dist-tag moves — all wait on the publish.

## d) TOTALLY FUCKED UP!

1. **The 1.2.0 npm publish failed on a PREDICTABLE, PRE-WARNED credential
   expiry — and the miss was mine, not the token's.** The TODO_LIST Release
   section has carried an UNCHECKED row since 2026-09-30: "NPM_TOKEN
   rotation + update the GitHub publish secret... flagged for rotation
   before the beta". The token was created 2026-08-21 with a 90-day
   lifetime → it expired TODAY, the exact day I tagged the release. I ran
   an elaborate pre-release ritual around the OTHER v1.0.0 lesson
   (lockfile proof: `--lockfile-only` + `--frozen-lockfile` + verify) while
   never re-reading the Release section I was executing under. A 2-second
   pre-flight (`npm whoami`) before pushing the tag would have caught it.
   Instead: tag pushed → workflow burned a full verify cycle → failed at
   the last step → manual GitHub Release backfill → release now half-shipped.
2. **I invoked `npm version` without reading the lifecycle scripts first.**
   Its `postversion` (`git push && git push --tags`) fired mid-command and
   pushed to the remote before I understood what had happened; I initially
   misattributed the push to the daemon. No damage occurred (it pushed only
   existing commits), but "check for scripts first" is a written rule, and I
   checked after, not before. Same class: the initial `pnpm version` attempt
   failed confusingly because the `version` script shadows the builtin —
   archaeology AFTER, not inspection BEFORE.

## e) WHAT WE SHOULD IMPROVE!

1. **Pre-release checklist that greps TODO_LIST** — the release flow in
   AGENTS.md has a lockfile-proof step but no credential-proof step. Add:
   `npm whoami` must succeed before tagging; read the TODO_LIST Release
   section before cutting a release (its open rows are release blockers by
   definition).
2. **Credential rows need expiry dates.** "Rotate NPM_TOKEN" sat unchecked
   for 7 weeks with no visible deadline. Rows depending on time-limited
   secrets should carry the expiry date; the 90-day token made today's
   failure computable in advance.
3. **AGENTS.md release-flow note is now WRONG:** it says "bump via
   `pnpm version`" — that builtin is shadowed by the `version` script and
   fails. Document the working path (`npm version minor
   --no-git-tag-version` runs build+test+`git add .`, its `postversion`
   pushes master+tags) and the surprise factor.
4. **release.yml should fail fast on dead credentials** — a `npm whoami`
   (or trusted-publishing preflight) step before the 2-minute verify would
   have converted this failure from "expensive late" to "cheap early".
5. **The website build fetches Google Fonts at build time** — run 44532617534
   failed on a transient `fonts.gstatic.com` fetch flake (rerun green).
   Self-hosting the woff2 removes both the flake class and a third-party
   availability dependency. (Not yet a TODO row — should become one.)
6. **Supersession handling:** I closed #294 manually within minutes of
   merging #293. Dependabot auto-closes superseded PRs on its next pass;
   waiting costs nothing and keeps the bot's bookkeeping consistent.
   Harmless, but not my cleanest call.

## f) Next (up to 50; realistically 14, ordered)

1. **Pick the npm fix path** (needs Lars, see §g Q1): #298 trusted
   publishing (preferred) or granular NPM_TOKEN.
2. Lars registers the trusted publisher on npmjs.com (if #298 path) or
   `gh secret set NPM_TOKEN` (token path).
3. Review + merge #298 (same rigor as #286–#291: worktree, full gate).
4. `gh run rerun 44529186193 --failed` → verify npm serves 1.2.0 with
   provenance (sigstore logIndex, like the 1.0.0 verification).
5. Fresh-install smoke test for 1.2.0 (new project, compile, AJV-validate
   output) — the v1.0.0 ritual.
6. Decide + apply dist-tag policy for `beta`/`alpha` (1.1.0 today).
7. AGENTS.md: fix the release-flow note (`pnpm version` shadowing) + add
   the credential pre-flight lesson (§e.1, §e.3).
8. release.yml: fail-fast credential step (§e.4) — possibly already
   obsolete if #298 merges (trusted publishing has no token to check, but
   an explicit preflight error is still clearer than a late E403/E404).
9. Self-host the Space Grotesk woff2 (kills the fonts.gstatic.com CI
   flake, §e.5).
10. TODO_LIST: add expiry-date convention for credential rows (§e.2).
11. Deep-review #295 when baywet flips it out of draft (openapi3 runtime
    dep question outstanding on the PR).
12. CI alerting on daemon-push failures (rowed earlier; today's flake
    proves the point — nobody but me saw that red run).
13. Property-test seeds for channel-id + derived-variant behavior (rowed).
14. E2E test: `@channel(address, id)` × `split-schemas` (rowed).

## g) Questions (cannot figure out myself)

1. **Which npm path do you want?** (a) Merge baywet's #298 and register
   release.yml as a trusted publisher on npmjs.com (my recommendation — no
   token, no expiry, provenance included), or (b) mint a fresh granular
   NPM_TOKEN + `gh secret set NPM_TOKEN`? Both need ONE npmjs.com login
   from you; I cannot mint npm credentials.
2. **After 1.2.0 lands on npm:** re-point `beta`/`alpha` dist-tags to
   1.2.0 (as 1.1.0 did) or retire those channels?
3. **Who reviews #298?** I can give it the full worktree + gate treatment
   next session and merge it — or do you want eyes on it first, given it
   rewires the publish path?

## Environment

- origin/master 39b25b75, CI green; local = origin; daemon quiet.
- npm: 1.1.0 latest; GitHub Release v1.2.0 published; tag v1.2.0 → 022a0de4.
- Release run 44529186193: failed at publish, rerun-ready after the
  credential fix (its GitHub-Release step will skip — I created it
  manually, idempotently).
