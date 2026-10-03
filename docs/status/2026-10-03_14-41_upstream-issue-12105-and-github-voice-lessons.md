# Status Report — Upstream Filing #12105, Banner Policy Overhaul, Voice-Skill Lessons

**Date:** 2026-10-03 14:41 CEST
**Session window:** 13:58–14:41 CEST (fourth session of the day; continues
`2026-10-03_13-58_mixed-emitter-ownership-session-2-completion.md`)
**Scope:** this session's run only, per instruction. Canonical actionable
state: `TODO_LIST.md` / `ROADMAP.md`.
**Format note:** `.md` at user-demanded path — standing override of the
status-report skill's HTML default, flagged again.

**Headline:** the upstream issue shipped —
**[microsoft/typespec#12105](https://github.com/microsoft/typespec/issues/12105)**,
Lars-approved after four wording iterations. Getting it shippable overhauled
the github-voice provenance-banner policy at the SOURCE (skill repo: template,
reference doc, checker regex, self-test) and yielded five durable lessons now
encoded in the skill. One casualty: the #252 reply draft is permanently lost
to a `/tmp` wipe.

---

## a) FULLY DONE

1. **Upstream rationale research (verified, no guessing)** — why
   `@typespec/http` defaults verb-less ops to POST-if-body-else-GET:
   - Source comment on `main` (`packages/http/src/parameters.ts`): the
     fallback is deliberate; even documents the arbitrary `@visibility`
     edge case.
   - Docs teach it as the terse style (typespec.io HTTP Operations guide;
     older REST resource-routing guide says the same).
   - Origin: PR **#90** (Nov 2021, daviwil) — auto-routed resource-CRUD
     design (`list`→GET, `create`→POST); survived the http split (#1668)
     unchanged.
   - Prior art: NONE — searches over open+closed issues + discussions
     (verbless/verb-less, implicit GET, default HTTP verb, without explicit
     verb, the doc phrase) all empty. Our filing is the first.
2. **Draft upgraded** with a "Why the default exists (researched upstream
   history)" section; #252 linked as full URL (problem + impact evidence).
3. **Draft resurrected after the `/tmp` wipe** — recreated byte-complete
   from session context (survived by luck, not process).
4. **Provenance banner fixed at the ROOT, not the instance** — Lars
   flagged the banner as "not fully correct"; investigation showed the
   flawed wording was the SKILL's OWN mandated template (policy
   2026-10-01). Fixed across the whole enforcement chain in
   `~/projects/SKILLS/github-voice` (live via fan-out symlink):
   - `check-draft.py`: banner regex now STRUCTURAL (`[!NOTICE]` +
     via-Crush line + MANUALLY REVIEWED) instead of phrase-locked;
     failure message + module docstring updated; self-test rewritten —
     PASSED.
   - `SKILL.md` + `references/voice-profile.md`: template reworded;
     "not at my request" no longer implies AI-discovered failure;
     external evidence routed to the banner's second sentence.
   - All daemon-committed (verified via git log: 3 commits today).
5. **NOTICE conversion** per Lars's instruction (IMPORTANT → NOTICE),
   with the rendering caveat flagged honestly: GitHub has no `[!NOTICE]`
   alert type — it renders as a plain blockquote; `[!NOTE]` is the styled
   equivalent, one word away if he ever wants it.
6. **Banner final wording** per Lars's own sentence: "This filing was
   drafted by GLM-5.3-flash and GLM-5.3 via Crush, with multiple rounds
   of feedback from me." (typo "mutliple feedbacks" corrected to
   "multiple rounds of feedback" — flagged to him).
7. **TL;DR added, then distilled** — Lars demanded TL;DR on top, then
   rejected the 3-clause version ("TOO LONG DIDN'T READ. WHAT IS THE
   PURE CORE!?"), then rebalanced the ask ("we want BETTER error
   messages, or not?" — yes: the at-failure fix is what would have saved
   the #252 reporter; a hard-failing program never sees a warning).
   Final: mechanism + ask (warn AND name the operations in
   duplicate-operation errors).
8. **Section reorder** — Goal moved above the research section
   (Problem → Goal → Why → Proposal).
9. **PUBLISHED: [microsoft/typespec#12105](https://github.com/microsoft/typespec/issues/12105)**
   as LarsArtmann; review ledger ticked `2026-10-03 14:34 CEST` on the
   explicit publish order; voice checker 0 FAIL / 0 WARN at every step
   (7 consecutive passes this session).
10. **Living docs closed the loop** — TODO_LIST M16 item → `[x]` with
    link + response-watch remainder; ROADMAP upstream-watch now cites
    #12105 (was "draft ready; filed after release").
11. **Five lessons encoded into SKILL.md** (his request; mirrored in the
    profile where applicable):
    1. Two banner modes: autonomous ("not at my request") vs
       Lars-iterated ("with multiple rounds of feedback from me").
    2. TL;DR rule: under the banner, one short paragraph, mechanism +
       ask; name both pre-collision and at-failure fixes.
    3. Drafts NEVER in `/tmp` — repo `docs/drafts/` (today's wipe lost a
       draft permanently).
    4. Proposed title ships WITH the draft (titles need voice review too;
       mine was coined unreviewed at `gh issue create` time).
    5. Review-ledger mechanics: agent ticks + stamps only on explicit
       publish order; wording iterations count as the review.

## b) PARTIALLY DONE

1. **Upstream research breadth** — issues/discussions/PRs searched well;
   NOT searched: the typespec Discord/community channels (no public
   search API) and the #90 PR review comments (diminishing returns,
   stopped deliberately). The issue's "no prior discussion found" claim
   is scoped to GitHub — as worded in the filing, accurate.
2. **Banner policy propagation** — skill repo fully updated, but the
   #12105 issue body uses the NEW wording while NO posted artifact yet
   exercises the autonomous-mode template ("not at my request" + external
   evidence sentence). The template's second mode is untested in the
   wild until the next autonomous filing.
3. **Lessons → other skills** — "drafts not in /tmp" was written into
   github-voice only; the same failure applies to ANY skill or session
   that stages artifacts in /tmp (verify-before-filing hand-offs, status
   reports' /tmp/buildflow logs, etc.). Not generalized.

## c) NOT STARTED

1. **M01 — #252 reply**: still unposted (Lars's timing call), and its
   draft is LOST (see d). Needs full re-draft; can now cite upstream
   #12105 — arguably stronger than the original draft was.
2. **M14 — 1.1.0 release**: untouched; Lars's two remaining questions
   (below) gate it.
3. **M20 — eslint 10.12.0 bump**: ⏰ after 20:08 UTC (~5.5h out).
4. **M22 — BuildFlow findings handoff**: ownership question still open.
5. **M23 — worktree cleanup + buildflow reinstall**: ⏰ after baseline.
6. **Archive of the posted filing** — the draft still exists ONLY at
   `/tmp/typespec-upstream-issue.md` + on GitHub; no repo-local copy of
   what was posted (should live in `docs/drafts/` per the very lesson I
   just wrote — not yet done; see d.2).

## d) TOTALLY FUCKED UP (brutal, honest)

1. **The #252 reply draft is permanently lost.** `/tmp` was wiped
   between sessions; `/tmp/issue-252-reply.md` existed ONLY there. I
   flagged the wipe mid-session and the TODO_LIST says "recreate from
   the 13-27 report" — but I never VERIFIED the 13-27 report actually
   contains the draft's text. If it doesn't, the reply is a from-scratch
   re-draft, not a recreation. Unverified claim = not known.
2. **I re-violated the lesson while writing it.** Knowing /tmp had
   wiped one draft, I still recreated the upstream draft at
   `/tmp/typespec-upstream-issue.md` instead of the repo. It survived
   only because the session stayed alive. I then wrote "drafts never in
   /tmp" into the skill as a lesson — the rule was correct, my
   compliance was not.
3. **Garbled edit #3 in two sessions** — the checker-docstring edit
   landed with a stray `">(the` prefix and literal `\n` sequences;
   fixed on review. Sloppy edit-tool discipline (same class as
   yesterday's mangled test-file edits).
4. **Read-before-edit miss** — first SKILL.md edit rejected with "you
   must read the file before editing" (I had grepped, not viewed).
   One wasted round.
5. **Title shipped unreviewed** — the draft never contained a title; I
   coined one at post time. It is probably fine; "probably fine" is not
   the bar the skill sets for any other part of a filing.

## e) WHAT WE SHOULD IMPROVE

1. **Follow new rules the moment they're written** — archive the posted
   #12105 draft to `docs/drafts/` (or link the canonical GitHub URL in
   the project docs) and move ALL future drafts there immediately.
2. **Verify "recreate from report" claims** — check the 13-27 report
   actually contains the #252 reply text before promising recreation;
   if absent, say "re-draft from scratch" honestly.
3. **Edit discipline** — after two sessions of mangled multiline edits:
   paste exact text from the last View, no reformatting, one edit at a
   time on unfamiliar files. (Personal process rule; consider it
   binding.)
4. **Generalize the /tmp lesson** — a one-liner in the global
   crush-config lessons file (cross-project): staging artifacts in /tmp
   risks silent loss between sessions; use repo paths.
5. **Pre-posting checklist** — before the next `gh issue create`: title
   present and reviewed? ledger tick authorized? draft archived? (These
   are now IN the skill; make them a literal pre-flight scan.)
6. **Track upstream reactions** — #12105 has no watch task beyond a
   TODO_LIST sentence; decide a follow-up cadence (see questions).

## f) NEXT THINGS (up to 50; impact-sorted; ⏳=gated on Lars, ⏰=time-gated)

**Gated chain (blocks the most value):**
1. ⏳ Lars: #252 reply — redraft now citing #12105, then decide
   post-now vs post-1.1.0 (draft must be rebuilt from scratch or from
   the 13-27 report IF it contains the text — verify first).
2. ⏳ Lars: 1.1.0 release call → run the full ritual (lockfile-only →
   frozen → verify → version → tag → watch release.yml).
3. ⏳ Lars: BuildFlow findings ownership (file vs hand off) → then file
   the 4 findings + 5 repo lint issues (M22).
4. ⏰ After 20:08 UTC: eslint 10.12.0 bump + relock + frozen proof (M20).
5. ⏰ After BuildFlow baseline lands: `.bf-jscpd-worktree` cleanup +
   reinstall from main URL (M23).
6. Watch microsoft/typespec#12105 for triage/response; capture the
   maintainer reply into ROADMAP's upstream-watch entry.

**Close-the-loop hygiene (small, immediate):**
7. Archive the posted #12105 draft + final body into the project repo
   (`docs/drafts/upstream-typespec-12105.md`) — the /tmp copy is
   disposable.
8. Verify whether the 13-27 report contains the #252 reply text; update
   TODO_LIST's recreate-vs-redraft wording to the truth.
9. Move the five SKILL.md lessons' enforcement into a pre-posting
   checklist the agent runs before any `gh issue create`.
10. Generalize "/tmp is volatile" into the cross-project lessons file
    (crush-config repo, committed — not an in-session write).
11. Sync the `[!NOTICE]` rendering caveat into the skill next to the
    template (one line: renders as plain blockquote on GitHub;
    `[!NOTE]` is the styled equivalent) — it is only in this report
    today.
12. typespec-asyncapi TODO_LIST: prune items completed today beyond
    M16 (the Hygiene section items resolved en route earlier).

**Trust-in-gate (carried from the 13-58 report, still open):**
13. Diagnostic-count lock test (36) — 15 min, kills the hand-count
    drift class.
14. Build script appends `nix fmt` after codegen (generator-format
    split-brain class).
15. AGENTS.md gotcha sweep: 3 new gotchas from session-2 + property-suite
    pointer.
16. `nix flake check` "0 checks" mystery vs existing check derivations.
17. Daemon guard for format/toolchain-sensitive auto-commits.
18. Add `BUILDFLOW_NO_RESULT_CACHE=1` to CI final-gate job.

**Website/docs (carried, unchanged):**
19. Visual QA of the new mixing-with-openapi guide page.
20. Website 1.0 truth-sync (changelog.md beta story) — now also covers
    36-code counts + the new guide.
21. Cross-link the guide from related pages; og:image refresh.
22. Lychee triage (sandbox false positives vs real rot).
23. docs-entropy CI guard promotion after f.13 proves the pattern.

**Test depth (carried):**
24. Property-suite breadth (unions/inheritance/generics/params).
25. Root-cause the transient vitest/bun exit-zero flake (needs a capture).
26. Mixed-ownership property suite: fallback-path invariant set.
27. In-suite dual-emitter AJV compile (pre-push variant of
    check-examples).

**Upstream/ecosystem (carried + today):**
28. `http-cache-semantics` watch → remove `ignoreGhsas`.
29. 14-day watch cadence decision for #12105 (see questions).
30. knip evaluation for the frozen API surface.
31. Website `@astrojs/check` TS mismatch — note/upstream to Astro.
32. nix-checker 2 info suggestions review.

**Hygiene batch (carried):**
33. `scripts/ns-test/` trash (owner call).
34. `global.out.css` policy decision.
35. AGENTS `^6.0.3` vs `6.0.3` wording harmonization.
36. TODO_LIST checkbox templates for ⏰ items.
37. Dependabot config/lockfile divergence guard in preflight.
38. Branch protection on master (green CI required) — highest-leverage
    repo setting, open since 09-30.
39. NPM_TOKEN rotation + publish secret update.
40. Stale npm `alpha` dist-tag removal (UI-only).
41. Release-preflight script (would have caught two incident classes).
42. crush-config lessons commit (worktree replaces, result-cache
    masking, lossy grep) — now ALSO carries the /tmp lesson (f.10).

**Bigger bets (ROADMAP fuel, unchanged):**
43. EFv1 containment quarterly watch (openapi3 emitter-framework move).
44. 1.0/1.1 announcement sequencing (XYD / TypeSpec community).
45. Demo video epic (storyboarded; schedule deliberately or descope).
46. Verified `tsp-asyncapi` comparison matrix (mixed-emitter feature
    now a differentiator — add to it).
47. 2.0 strictness design note (geometry-fallback removal migration).
48. `@asyncapi/generator` real-CLI run (Bun workaround needed).
49. `./shared` neutral vs AsyncAPI-bound entry-point split.
50. Next status report = the RELEASE report (cadence rule from 11-20
    §f.30; everything above is fuel, not obligation).

## g) QUESTIONS (cannot figure out myself)

1. **#252 reply (M01):** redraft now so it can cite upstream #12105 —
   and post immediately, or hold until 1.1.0 ships and cite the release?
   (Note: the old draft is lost; this is a fresh draft either way.)
2. **1.1.0 release (M14):** tag now? Everything autonomous is green
   (gates, docs, locks, upstream filed); only your timing question
   remains open.
3. **#12105 follow-up cadence:** microsoft/typespec triage varies from
   days to months — day-7 polite ping, day-14 escalate to
   timotheeguerin/bterlson mention, or just watch passively until the
   next release cycle?

---

*Point-in-time snapshot; corrections go inline (docs-health ANNOTATE).
§f actionable items beyond today's completions are already in
TODO_LIST.md / ROADMAP.md or flagged for the next HARVEST pass.*
