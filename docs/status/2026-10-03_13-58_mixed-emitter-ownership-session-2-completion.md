# Status Report — Mixed-Emitter Ownership, Session 2 (resumption + completion)

**Date:** 2026-10-03 13:58 CEST (11:58 UTC)
**Session window:** 13:27–13:58 CEST (resumption after the 13-27 report)
**Scope of this report:** THIS session's run only, per instruction. Prior
state: `docs/status/2026-10-03_13-27_mixed-emitter-ownership-execution.md`
(now annotated with corrections from this session).
**Format note:** user explicitly demanded `.md` at `docs/status/` — override
of the status-report skill's HTML-canonical default, honored and flagged.
Report written, NOT committed manually (harness rule; auto-commit daemon
picks it up).

**Headline:** All autonomous plan tasks (M02–M13, M15/M16-prep, M17+F21,
M18, M19, M21) are now DONE and gate-green. The F64 full-gate debt is PAID
(cache-cold buildflow full exit 0). Three real defects were found and fixed
this session: an ESLint error, 2 jscpd clones my own prior code introduced,
and a wrong diagnostics count (36, not 35) that the previous session had
propagated into four docs — including a pre-existing website omission.

---

## a) FULLY DONE

1. **Todo list corrected** — stale M15/M16-prep, M17+F21, M18 entries marked
   completed; new items added.
2. **Scratch cleanup** — `scripts/scratch-http-route-spike.ts` and
   `scripts/scratch-upstream-matrix.ts` trashed (facts were already
   extracted). `scripts/` is now clean of session litter except
   `ns-test/` (not mine — owner call, TODO).
3. **Lint error fixed** — `restrict-template-expressions` in
   `src/builders/cross-emitter-validation.ts:152` (bare number in template
   literal). ESLint + oxlint now 0 errors / 0 warnings.
4. **jscpd budget restored (0 clones)** — full verify exposed 2 intra-file
   clones in `operation-discovery.ts` (the M05/M06 diagnostic calls).
   Extracted `reportBareOpServiceDiagnostic` helper (service lookup moved
   inside; stays within oxlint max-params 5). Affected suites re-run green
   (113 tests), `pnpm run duplicate` → 0 clones.
5. **Codegen/format split-brain fixed at the root** — the treefmt check
   failed because `scripts/generate-binding-specs.ts` emitted compact JSON
   (`GENERATED_BINDING_PROTOCOLS` array) that prettier re-expanded on every
   `pnpm run build`. Fixed the generator to emit with `null, 2`; verified
   idempotence (build → `nix fmt` → 0 changed).
6. **Repository formatted** — `nix fmt` fixed 11 files the auto-commit
   daemon had committed unformatted (incl. `scripts/check-examples.ts`).
   Honest check `nix fmt . -- --fail-on-change` now exits 0.
7. **F64 paid — cache-cold full gate GREEN:**
   - `BUILDFLOW_NO_RESULT_CACHE=1 buildflow --build-mode full` → **exit 0**,
     29 steps succeeded, 0 failed (remaining findings are env-only: lychee
     link checks cannot leave the sandbox; nix-checker info-level
     suggestions).
   - `pnpm run verify` → 105 files / 1275 tests, coverage gate PASS
     (97.8% avg, min 75%), 0 clones.
   - `nix flake check` → exit 0, plus direct builds of
     `.#checks.x86_64-linux.{treefmt,format}` → exit 0.
   - Honesty note: `nix flake check` printed "running 0 flake checks" while
     the check derivations clearly exist (flake show lists them under
     omitted systems). Unexplained; the direct derivation builds are the
     real evidence. Logged as a follow-up (f-item).
8. **Website diagnostics reference fixed — and the count was wrong
   everywhere** — recount of `src/lib.ts` (the authoritative source, per
   AGENTS' own rule) yields **36 codes (20 error + 16 warning)**, not the
   35 claimed yesterday-by-plan and this morning. The website doc said 32
   and was missing FOUR warnings: `protocol-model-fields-unplaced`
   (pre-existing omission from the @protocol feature) +
   `event-op-in-service-namespace`, `bare-op-assumed-rest`,
   `bare-op-inference-deprecated` (this feature). Website doc now lists all
   36 with correct section counts.
9. **All count claims corrected** — `FEATURES.md`, `README.md` (both places
   — 319 said 35, 425 said 32; the README contradicted ITSELF),
   `AGENTS.md` → 36 (20+16). No test hardcodes the total (checked).
10. **Prior status report annotated** — the 13-27 report got inline
    CORRECTION (count) and RESOLVED (website doc) blocks; annotation, not
    rewrite, per docs-health rules.
11. **M19 DONE — website "Mixing with OpenAPI" page**
    (`website/src/content/docs/guides/mixing-with-openapi.md`): ownership
    rules table (facts from the unit/integration suites), devDependency
    rule, real tspconfig from `examples/mixed-rest-events`, suppression,
    #252 duplicate-operation pitfall, deprecation story. Sidebar entry in
    `astro.config.mjs`, README link added. Website builds: 17 pages (was
    16), search index + CSP patch clean.
12. **M21 DONE — living-doc harvest:**
    - `TODO_LIST.md`: new "Mixed-Emitter Ownership Track" section (gated
      release chain: #252 reply, 1.1.0 release, upstream issue, BuildFlow
      handoff, crush-config lessons; time-gated: eslint bump, worktree
      cleanup) + new "Hygiene" section (11 items harvested from the 11-20
      report §f, deduplicated against existing entries).
    - `ROADMAP.md`: "Current State" was STILL the beta 0.3.0 story
      (pre-1.0.0!) — refreshed to v1.0.0 / 1275 tests / 36 codes / mixed
      ownership; added 2.0 strictness idea (geometry-fallback removal) and
      the upstream-watch idea under Developer Experience.
    - Plan file annotated (EXECUTION STATUS block at top; body untouched).
13. **Two harvest items closed on the spot instead of filed** —
    `jscpd-report/` confirmed gitignored; `LATEST_BINDING_VERSIONS` count
    confirmed 19 (matches AGENTS' binding-protocol claim).
14. **Final state green** — lint 0/0, format check exit 0, website build
    17 pages, working tree clean (daemon committed everything).

## b) PARTIALLY DONE

1. **AGENTS.md memory update** — count fixed to 36, but THREE new gotchas
   discovered this session are NOT yet recorded: (a) `buildflow full` is
   not a command — the mode is `--build-mode full` (the plan/summary
   itself carried the wrong form); (b) generators MUST emit
   prettier-stable output (the split-brain rule); (c) `nix fmt
   --fail-on-change` can race the auto-commit daemon and give a false
   "unexpected changes" verdict. Also still missing (carried from 13-27
   §b): the property-suite pointer in the test-inventory section.
2. **M19 completeness** — page exists and builds, but no human/visual QA of
   the rendered page, no `og:image`/social-card consideration, and the
   page is not yet linked from the website's landing/related-tools
   cross-links.
3. **13-27 report sweep** — I annotated the two sections I knew were wrong;
   I did NOT grep the whole 13-27 report for every remaining "35" mention.
   Low risk (annotations cover the claim sites), but not exhaustive.
4. **Harvest depth** — TODO_LIST now carries the actionable tail, but some
   §f items went in as one-line bullets where the 11-20 report has more
   context (lychee specifics, global.out.css background). Deliberate
   (TODO_LIST is a task list, not an archive), noted for honesty.
5. **Docs-count hygiene** — corrected everywhere today, but the numbers are
   still hand-maintained in 4+ places (README×2, FEATURES, AGENTS,
   website). No single source yet (see e/improvements).

## c) NOT STARTED (all gated or time-gated — nothing autonomous remains)

1. **M01** — post the #252 reply (✋ Lars; draft at
   `/tmp/issue-252-reply.md`, voice-checked).
2. **M14** — release train: version call (rec **1.1.0**) → pre-tag
   frozen-lockfile ritual → `pnpm version` → annotated tag → watch
   release.yml (✋ Lars).
3. **M16/F50** — post the microsoft/typespec upstream issue (✋ Lars;
   draft at `/tmp/typespec-upstream-issue.md`, voice-checked 0 FAIL 0
   WARN; prior-art search: none found).
4. **M22** — BuildFlow upstream findings handoff (✋ Lars: file in
   BuildFlow tracker vs hand to the concurrent baseline session).
5. **M20** — eslint 10.12.0 bump (⏰ after 20:08 UTC today — ~8h out at
   report time).
6. **M23** — `.bf-jscpd-worktree` removal + buildflow reinstall from main
   URL (⏰ after the BuildFlow baseline WIP lands).
7. **Website visual/social QA** of the new guide page (never planned as a
   task; surfaced by this session's b-item).
8. **Standalone brutal-self-review HTML** — the skill's canonical output is
   a separate `docs/reviews/*.html`; this session folded the self-review
   into this report per the user's scope instruction. If Lars wants the
   formal artifact, it is a separate task.

## d) TOTALLY FUCKED UP (own faults, brutally honest)

1. **The "35 codes" number was WRONG and I propagated it.** Truth: 36
   (20+16). The previous session (also me) counted by hand instead of from
   `src/lib.ts` — while AGENTS.md literally says "count them there, never
   trust a hardcoded number in docs." Worse: the website doc had been
   missing `protocol-model-fields-unplaced` since the @protocol feature
   shipped, through a whole release, and nobody (including the 13-27
   session that explicitly surveyed that file) noticed. My "fix" this
   morning (32→35) would have STILL been wrong had I not recounted.
2. **My own M05/M06 code introduced 2 jscpd clones** and the 13-27 session
   declared victory on lint-only evidence. The duplication gate — which
   EXISTS precisely to catch this — was never run after the last src edit.
   This is the "tests ≠ gate" lesson biting the same project twice in two
   days.
3. **Two consecutive mangled edits** on
   `test/realworld/external-model-patterns.test.ts` (first ate a newline,
   then swallowed the constant into the comment line) — sloppy edit-tool
   work that cost three tool calls to produce a five-line change.
4. **Ran `buildflow full` verbatim from the session summary without
   checking the skill** — the skill documents `--build-mode full`; `full`
   is not a subcommand. The summary was wrong, but the skill was one view
   away and I had even been told to load it. Wasted a round.
5. **Daemon-vs-formatter race left the gate verdict nondeterministic for
   one call** — first `--fail-on-change` said "unexpected changes", the
   immediate rerun said 0 (the daemon had committed the formatted files in
   between). No damage, but a gate that can flake erodes trust and should
   be understood, not shrugged at.
6. **Root config of the mixed example was nearly a gotcha casualty** —
   (carried honestly from 13-27, still true) three M09 test rewrites and a
   property-generator abort came from violating known documented traps
   BEFORE running specs. The systemic fix (pre-flight trap checklist) was
   proposed but NOT implemented.

## e) WHAT WE SHOULD IMPROVE

1. **Lock the diagnostic count with a test.** One unit test:
   `Object.keys($lib.diagnostics)` length + severity split asserted
   against literals, failing the build when a code is added without a doc
   bump. Cheaper than the fourth manual recount in two days. (My rec: do
   it in 1.1.0.)
2. **Single-source the docs counts.** A tiny script that prints
   counts/versions (codes, decorators, protocols, test count) consumed by
   a docs-sync check — kills the README-vs-FEATURES-vs-website drift class
   permanently. ROADMAP already has a docs-entropy guard idea; promote it.
3. **Full gate after EVERY src-touching batch.** Lint-only between edits
   has now caused: 2 clones (today), the TS-drift release blocker
   (v1.0.0). Rule: if `src/**` changed, `pnpm run verify` before declaring
   anything green — no exceptions, even mid-task.
4. **Codegen must emit formatted output.** Today's fix is one generator;
   the rule should be global: any script that writes TS runs treefmt on
   its output (or the build script appends `nix fmt` after generate) so
   the treefmt check can never race the generator again.
5. **Verify gated commands against the skill before first run.** 30
   seconds of `--help`/SKILL.md beats a failed invocation and a confused
   trail. (BuildFlow today; applies to gh, nix, pnpm flags equally.)
6. **Daemon guard priority bump.** The auto-commit daemon committed
   UNFORMATTED files twice today (10-file commit at ~13:52, then formatter
   had to follow). It is TODO-listed since 09-30 as "daemon guard for
   toolchain files"; today's variant is format-sensitivity. Until guarded,
   every daemon commit is a potential treefmt red.
7. **Pre-flight trap checklist for new test specs.** The known-traps list
   (blockless namespace ordering, reserved words, implicit-route
   collisions, relative namespace resolution) should be a literal
   checklist in AGENTS.md test-harness section, applied BEFORE writing a
   new `.tsp` test fixture — not discovered by red tests after.
8. **Adopt the LSP-restart habit.** Stale diagnostics for trashed
   `scratch-issue-252*.ts` files polluted every diagnostic read this
   session (11 phantom errors). One `lsp_restart` at session start when
   diagnostics reference deleted files.
9. **Annotate-then-sweep.** When a number is found wrong, grep ALL docs
   for the wrong value in one pass before editing (README alone needed a
   second pass today because it stated the count twice, differently).
10. **`nix flake check` "0 checks" mystery.** Direct derivation builds
    green, but the flake-level check reports none — understand and either
    fix the flake attribute shape or document why (buildflow's nix-build
    step found them; plain flake check didn't).

## f) NEXT THINGS (up to 50; sorted by impact; ⏳=gated on Lars, ⏰=time-gated)

**Gated release chain (blocks the most value):**

1. ⏳ Lars: pick #252 reply timing (now vs post-1.1.0) → post
   `/tmp/issue-252-reply.md` (M01).
2. ⏳ Lars: version call → run the 1.1.0 release ritual (lockfile-only →
   frozen → verify → version → tag → watch release.yml) (M14).
3. ⏳ Lars: upstream issue — post as drafted (evidence-first) vs rescoped
   proposal (M16/F50).
4. ⏳ Lars: BuildFlow findings ownership — file upstream vs hand off (M22),
   then file the 4 findings + 5 repo lint issues.
5. ⏰ After 20:08 UTC: eslint 10.12.0 bump, relock, frozen proof, lint (M20).
6. ⏰ After BuildFlow baseline lands: remove `.bf-jscpd-worktree`,
   reinstall buildflow from main URL, verify non-dirty version (M23).
7. ⏳ crush-config lessons commit (worktree replaces, result-cache masking,
   lossy grep) — small, do with next crush-config touch.

**Trust-in-gate hardening (cheap, high value):**
8. Add the diagnostic-count lock test (e.1) — 15 min, prevents the exact
class of today's worst miss.
9. Build-script appends `nix fmt` after codegen (e.4) — one line.
10. Sweep AGENTS.md gotchas: add the 3 new ones (e; b.1) + property-suite
pointer (b.1) — one editing pass.
11. Investigate `nix flake check` 0-checks vs existing check derivations
(e.10).
12. Update the SUPERB plan + session summaries convention: mode flags
copied from SKILL.md, not memory (process note; today's d.4).
13. Daemon guard: build/lint-sensitive files pass at least format check
before auto-commit (e.6) — coordinates with BuildFlow baseline session.
14. Pre-flight trap checklist into AGENTS.md test-harness section (e.7).
15. Run the on-demand sweeps now that the gate is green: gitleaks,
codespell, markdownlint (11-20 §f.14).
16. Add `BUILDFLOW_NO_RESULT_CACHE=1` to the CI final-gate job (11-20
§f.15, pairs with result-cache masking finding).

**Website/docs (visibility = adoption):**
17. Visual QA of `guides/mixing-with-openapi` in a real browser; fix any
rendering/analytics gaps.
18. Cross-link the new guide from related pages (bindings, security,
landing "why" section).
19. Website changelog.md still tells the beta story (TODO-listed since
1.0.0) — 1.0 truth-sync pass over ALL website content, now including
36-code counts and the new guide.
20. og:image / social card refresh for the new guide (fleet review
standard from 2026-09-19).
21. Lychee triage: separate sandboxed-network false positives from real
dead links; fix or archive (11-20 §f.11).
22. Add `docs-entropy` CI guard (counts in docs vs code) — ROADMAP idea,
promote after f.8 proves the pattern.

**Test-suite depth:**
23. Property-suite generator breadth: unions of models, inheritance,
generics, channel parameters (TODO-listed; the mixed-ownership suite
is the template).
24. Root-cause the transient `bun test`/vitest exit-zero-failures flake
(needs a captured failing run; TODO-listed since 09-13).
25. Extend mixed-ownership property suite to cover the fallback path
(http-loaded vs not) as a second invariant set — cheap now that the
generator exists.
26. Consider an integration test that runs BOTH emitters' outputs through
AJV in one compile (check-examples does this per-example in CI; an
in-suite version would catch regressions before push).

**Upstream/ecosystem:**
27. Watch `http-cache-semantics` for a patched release → remove
`ignoreGhsas` (TODO-listed).
28. Watch microsoft/typespec for movement on #2463 + the new issue once
posted (D1 verdict chain already TODO-listed).
29. Evaluate knip for the frozen public API surface (11-20 §f.12).
30. Note/upstream website `@astrojs/check` TS-7 mismatch to Astro
templates (11-20 §f.20).
31. Review nix-checker's 2 info suggestions (cleaner diffs / nvfetcher)
(11-20 §f.13).

**Hygiene (small, batch them):**
32. Trash `scripts/ns-test/` (owner call — not my file).
33. Decide `global.out.css` policy (11-20 §f.17/g)3).
34. Harmonize AGENTS pin wording `^6.0.3` vs exact `6.0.3` (11-20 §f.18).
35. TODO_LIST checkbox templates for ⏰ items (11-20 §f.24).
36. Dependabot divergence guard: config/lockfile drift detection in
preflight (pattern recurred TODAY via pnpm-update manifest drift).
37. Branch protection on master requiring green CI (TODO since 09-30; the
single highest-leverage repo setting).
38. NPM_TOKEN rotation + GitHub publish secret update (TODO since 1.0.0).
39. Remove stale npm `alpha` dist-tag via npmjs.com UI (token can't).
40. Release-preflight script (TODO since 09-30) — now would have caught
today's daemon-unformatted-commit class too.
41. `nix fmt` + daemon race: either serialize (daemon skips while
formatter lock held) or document the false-verdict mode (e.5/d.5).

**Bigger bets (ROADMAP fuel, not commitments):**
42. EFv1 containment watch: quarterly check of openapi3's
emitter-framework adoption (ROADMAP plan step 2; next check due).
43. Announce 1.0.0/1.1.0 (XYD thread / TypeSpec community) — sequencing
with #2463 proposal still open (TODO since 09-30).
44. Demo video epic (ROADMAP §5 storyboard exists; multi-hour creative
commitment — schedule deliberately or descope).
45. Verified comparison vs `tsp-asyncapi` competitor (TODO T05) — the
mixed-emitter feature is now a differentiator worth adding to the
matrix.
46. 2.0 strictness design note: geometry-fallback removal mechanics
(ROADMAP idea added today; needs a migration story before anyone
promises it).
47. `@asyncapi/generator` real-CLI run against emitter output (ROADMAP;
Bun incompatibility workaround needed).
48. Split `./shared` into neutral vs AsyncAPI-bound entry points (ROADMAP
DX idea).
49. Provenance verification instructions in README (TODO since 1.0.0).
50. Session-report cadence: next report should be the RELEASE report
(11-20 §f.30) — everything else here is fuel, not obligation.

## g) QUESTIONS (cannot figure out myself; the standing 3)

1. **#252 reply timing:** post the voice-checked draft NOW (reporter has
   waited since filing; draft already matches shipped behavior), or hold
   until 1.1.0 is tagged so the reply can cite a released version?
2. **Release cutoff:** tag 1.1.0 now that docs, locks, and the cache-cold
   gate are green — or is anything else (website visual QA? upstream
   issue first?) a must-have before the tag?
3. **Upstream issue shape:** post `/tmp/typespec-upstream-issue.md` as
   drafted (evidence-first bug report on verb-less implicit-GET friction),
   or rescoped as a proposal asking http to change its fallback?

---

_Annotated point-in-time snapshot. Corrections to THIS report go inline
(docs-health ANNOTATE mode). Harvest state: actionable items already in
TODO_LIST.md/ROADMAP.md as of 13:52 CEST; §f items 8–16 etc. that postdate
that harvest need a docs-health HARVEST pass before they can be considered
tracked._
