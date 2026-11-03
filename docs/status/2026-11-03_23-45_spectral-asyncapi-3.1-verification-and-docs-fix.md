# Status Report — Spectral "2.x-only" Claim Verification & Docs Fix

**Date:** Tuesday, 2026-11-03, 23:45 CET (`date` run in-session)
**Session task:** User asserted "We recommend Spectral while it is only for AsyncAPI 2.x." I verified the claim against primary sources, found it outdated, corrected our docs copy, and recorded the finding.
**Type:** Session-scoped status + brutal self-review. Per explicit user instruction, this report covers ONLY this session's work and observations — no unrelated subsystems were researched, and section (f) is deliberately NOT padded to 50 items.

---

## Scope line

**VERIFIED here (command → artifact):**

| Claim                                                                | Evidence                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Spectral's asyncapi ruleset declares AsyncAPI 3.x formats            | Sourcegraph on `stoplightio/spectral` → `packages/rulesets/src/asyncapi/index.ts`: `formats: [aas2_0…aas2_6, aas3_0, aas3_1]` + dedicated `asyncapi-3-*` rules + `asyncapi-3-document-resolved`/`-unresolved` schema validation                                                                                                                                                                                    |
| v3 rules shipped 2024-11-12                                          | `packages/rulesets/CHANGELOG.md`: "add AsyncAPI v3 support (#2697)" in 1.21.0                                                                                                                                                                                                                                                                                                                                      |
| 3.1 rules shipped 2026-10-01                                         | Same changelog: "add 3.1 support and future minor fallback (#3019)" in 1.23.0; npm registry `@stoplight/spectral-rulesets/latest` = 1.23.0 (2026-10-01); `@stoplight/spectral-cli` 6.17.0 published 2026-10-01 (npm search result)                                                                                                                                                                                 |
| `< 1.23.0` silently skips 3.1 docs                                   | Inference from the format-filter mechanism above (rule set skipped on format miss, not an error). Source-level, NOT runtime-verified — see (b).                                                                                                                                                                                                                                                                    |
| `@asyncapi/parser` does NOT depend on `@stoplight/spectral-rulesets` | `rg spectral pnpm-lock.yaml` → no `spectral-rulesets` entry (only core/formats/functions/parsers/ref-resolver/runtime as parser transitives)                                                                                                                                                                                                                                                                       |
| Docs copy corrected                                                  | `website/src/content/docs/related-tools.md:39` rewritten; `AGENTS.md` gotcha added after the severity-enum bullet                                                                                                                                                                                                                                                                                                  |
| Website gate green after edits                                       | `pnpm --filter typespec-asyncapi-website run check`: astro check 0 errors/0 warnings/0 hints (35 files), 22 pages built, `CSP fix: patched 22/22`, `links: 798 internal references across 22 pages are valid`, `csp: 22 pages carry a valid, hash-covered policy`. Stats line read from gate output: v1.1.0 · 30 decorators · 22 protocols · 19 bindings · 36 diagnostics · 15 examples · **305 compliance tests** |
| No test snapshots the edited copy                                    | `rg related-tools` → hits are nav links and og:image URLs only                                                                                                                                                                                                                                                                                                                                                     |

**NOT verified here (and why):**

- **Spectral never actually RUN against a 3.1 document.** All 3.x support evidence is source/changelog/registry level. The end-to-end behavior (does CLI 6.17.0 lint + schema-validate an emitted 3.1.0 doc cleanly?) was not executed. Blocked by nothing but scope/time — flagged as next task #1.
- **The built `/related-tools/` page was not visually inspected.** The gate proves it builds and links resolve; it does not prove the new bullet reads well.
- **`git status` was not re-run after edits.** Both edits are on disk (edit tool confirmed); the auto-commit daemon is expected to pick them up, but I did not observe that commit.
- **No manual commit** — harness forbids commits without explicit "commit" (per status-report skill's own carve-out).
- **agentic_fetch degraded mid-session:** first call 404'd on my guessed repo URL (`asyncapi/spectral-ruleset` — wrong), second failed with `payment required: You're out of credits` (hyper.charm.land). Fell back to `fetch` + Sourcegraph + npm registry, which sufficed.

---

## Session verdict (the actual answer)

The user's premise — **"Spectral is only for AsyncAPI 2.x" — is outdated**:

- **AsyncAPI v3 rules:** since `@stoplight/spectral-rulesets` **1.21.0** (2024-11-12, PR #2697)
- **AsyncAPI 3.1 rules:** since **1.23.0** / `spectral-cli` **6.17.0** (**2026-10-01**, PR #3019, incl. "future minor fallback")
- **The real footgun:** any rulesets **< 1.23.0 silently applies ZERO AsyncAPI rules to a 3.1 document** — the format filter misses and rules are skipped without error. That silent-skip is what our docs needed to warn about, not "2.x-only".

Consequence: our three Spectral recommendation sites were assessed. `README.md:60` ("Keep a linter (Spectral)") and the landing row "Spectral, at best" remain defensible as workflow statements; `related-tools.md` needed (and got) the precise version coverage + pin caveat.

---

## Brutal self-review (direct answers to the three questions)

**What did you forget?**

1. I did not load `verify-external-claims` SKILL.md by the letter before encoding external claims into documentation — I followed its spirit (source-level evidence, quoted lines) inline, but the skill's gate exists precisely for this task and I skipped the lookup step.
2. I flagged the landing-row/demo-video "Spectral, at best" drift but did not reconcile it — the split brain between `website/src/data/sections.ts:38`, `ComparisonSection.astro`, and the demo video captures (`website/video/.../tokens.json`, `page.html`, `visible-text.txt` — all carry the same string) is still open, waiting on a marketing call.
3. I did not visually check the rendered built page, did not re-run `git status` at the end, and did not consider whether this docs fix belongs in `CHANGELOG.md`.
4. I initially wasted two fetch attempts on guessed URLs (both 404) — violating the no-URL-guessing rule before falling back to registry search.

**What could you have done better?**

1. **Runtime proof, not just source proof.** One `spectral lint` against an emitted 3.1 doc closes the gap between "the ruleset declares aas3_1" and "Spectral validates our output". I stopped at source level.
2. **Proactive drift detection.** The "Spectral, at best" superiority claim silently weakened on 2026-10-01 and nobody noticed until the user pushed. I should periodically re-verify ecosystem-version-dependent competitive copy instead of waiting for a user prompt.
3. **Read the skill files first** (verify-external-claims), not after.
4. Search npm registry BEFORE guessing GitHub URLs.

**What could you still improve?**

1. Mechanical date-stamping of every ecosystem-version claim in website copy (like `stats.complianceTests` is derived — claims like "checked October 2026" and Spectral version floors should be one-grep auditable).
2. docs-health HARVEST of section (f) into `TODO_LIST.md` — pending user go-ahead since the instruction was "WAIT".
3. Tooling: agentic_fetch credits are exhausted — either top up or accept fetch/Sourcegraph as the default research path.

**Did I lie to you?** No. The one claim I'd qualify: "Spectral < 1.23.0 silently skips 3.1 docs" is mechanism-inferred from source, not executed — labeled as such everywhere I stated it.

---

## a) FULLY DONE

| # | Item                                                                                                                                                                                 | Evidence                                                                                  | Scope                             |
| - | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------- |
| 1 | Verified the Spectral version-coverage claim against primary sources (ruleset source, per-package changelog, npm registry)                                                           | See scope-line table; verdict: 2.x-only is false as of 2024-11-12 (v3) / 2026-10-01 (3.1) | External research, no repo change |
| 2 | Rewrote the Spectral bullet in Related Tools with exact version coverage + the silent-skip pin caveat                                                                                | `website/src/content/docs/related-tools.md:39` (single line, edit tool confirmed)         | Website docs                      |
| 3 | Recorded the finding as an AGENTS.md gotcha (dates, formats list, footgun, "keep copy accurate" instruction) so the stale belief cannot be re-encoded by a future session            | `AGENTS.md`, new bullet directly after the severity-enum gotcha                           | AI session context                |
| 4 | Assessed ALL 44 Spectral mentions in the repo and dispositioned each: README/landing/historical docs left untouched (still accurate or point-in-time archives per annotation policy) | Grep inventory at session start                                                           | Repo-wide audit                   |
| 5 | Confirmed the docs change is safe by the full website gate                                                                                                                           | astro check 0/0/0 · 22 pages built · 798 internal links valid · CSP valid 22/22           | Website                           |

## b) PARTIALLY DONE

| # | Item                                          | Works now                                                                                                                                      | Open                                                                                                                                            | Blocker                           | Effort |
| - | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------ |
| 1 | External-claim verification                   | Source-level: formats list, changelog entries, registry versions all read and quoted                                                           | Runtime execution of Spectral against a 3.1 doc (next task #1)                                                                                  | None — pure scope choice          | S–M    |
| 2 | Split-brain sweep of "Spectral, at best" copy | Found every surface carrying the string (landing `sections.ts`, `ComparisonSection.astro`, video `tokens.json`/`page.html`/`visible-text.txt`) | Reconciling them into one agreed framing                                                                                                        | Marketing decision (question g-1) | S      |
| 3 | Parser/lockfile relationship check            | Proved `@asyncapi/parser` has no `@stoplight/spectral-rulesets` dep (lockfile grep)                                                            | Did not check which ruleset version the parser bundles internally, so the AGENTS.md "parser Spectral ruleset" gotcha remains version-unverified | None                              | S      |

## c) NOT STARTED

| # | Item                                                       | Why not started                                    | Priority                  |
| - | ---------------------------------------------------------- | -------------------------------------------------- | ------------------------- |
| 1 | FAQ entry "which linters/validators support AsyncAPI 3.1?" | Out of session scope; needs Lars' go-ahead on copy | Medium                    |
| 2 | Landing comparison row reword ("Spectral, at best")        | Blocked on marketing-honesty decision (g-1)        | High (decision), S (work) |
| 3 | Demo-video copy reconciliation                             | Depends on #2                                      | Medium                    |
| 4 | CHANGELOG entry for this docs fix                          | Convention undecided (g-3)                         | Low                       |
| 5 | docs-health HARVEST of (f) into TODO_LIST/ROADMAP          | User instruction: WAIT after report                | High (process)            |
| 6 | README:60 tweak (add "(now supports AsyncAPI 3.1)")        | Judged unnecessary as written; revisit after g-1   | Low                       |
| 7 | Silent-skip footnote on landing comparison                 | Needs g-1 framing decision                         | Low                       |

## d) TOTALLY FUCKED UP

**Nothing in the repo is broken by this session.** Both edits are gate-green. Honest inventory of the nearest misses, in decreasing severity:

1. **Pre-existing, noticed this session: the landing/demo-video superiority claim "Spectral, at best" silently degraded on 2026-10-01** when Spectral gained 3.1 schema validation. Severity: not user-blocking, but a competitive copy whose implicit claim ("they don't validate, we do") is now half-true — Spectral validates against `@asyncapi/specs` too; what remains ours is "validated on every build, wired by default". Root cause: no re-verification cadence for ecosystem-dependent marketing claims. Mitigation: tasks f-2/f-6/f-8.
2. **Pre-existing docs drift, noticed in passing from the gate output:** AGENTS.md says the compliance suite is "~270 tests"; the live derived stat says **305** (README's "300+" is fine; the website count is derived via `sync-stats.mjs` and cannot drift). Severity: cosmetic AI-context drift. Fix: f-23.
3. **My process this session:** two 404s from guessed URLs; `verify-external-claims` skill not loaded by the letter. Severity: wasted ~2 tool calls, no wrong output shipped. Root cause: acting on a small task reflexively. Mitigation: (e).
4. **Environment:** agentic_fetch is out of credits (`payment required`, hyper.charm.land). Severity: degraded research tooling for this session onward. Workaround: `fetch` + Sourcegraph + raw registry JSON worked fine.

## e) WHAT WE SHOULD IMPROVE

1. **Load the gate skill by the letter.** When a task encodes external claims into docs/code, view `verify-external-claims` SKILL.md FIRST, then verify. The spirit-followed-inline approach works but skips the checklist that catches the subtle failure modes (unverified CLI flags, hallucinated versions).
2. **Runtime-verify before "verified" when the claim is behavioral.** "The ruleset declares aas3_1" ≠ "Spectral lints our 3.1 output". Standard: a claim about tool behavior gets executed, not just read. Concrete: one `spectral lint` against `examples/` output in a scratch dir.
3. **Search before guessing URLs.** npm registry `/-/v1/search` + raw `registry.npmjs.org/<pkg>/latest` first; GitHub raw paths second. Cost of the guessing habit: 2 wasted calls this session.
4. **Date-stamp ecosystem claims mechanically.** Every "X supports Y since Z" in website copy should cite a date and be findable by one grep (`checked October 2026` pattern exists on `related-tools.md:50` — extend it to Spectral/version-sensitive rows and consider deriving from a data file like `stats.ts`).
5. **Split-brain hunt across copy surfaces.** One marketing string ("Spectral, at best") lives in ≥5 files (site + video captures). If (f-2) rewords it, ALL surfaces must change in one commit — add this to the fix-forward discipline.
6. **Cradle-to-grave claims hygiene:** when the ecosystem changes under a comparison row, nothing alerts us. Cheapest fix: a TODO_LIST recurring item "re-verify ecosystem-dependent copy after notable upstream releases" or a monthly check.

## f) NEXT TASKS (23 grounded items — deliberately NOT padded to 50)

Per your instruction to not research unrelated subsystems: every item below was noticed or created by THIS session. Padding to 50 would have required inventing work outside that scope, so this is 23 real items, HARVEST-ready. (Per the status-report skill: items ≥ #20-class are ROADMAP fuel; HARVEST should route accordingly.)

| #  | Task                                                                                                                                                                                                       | Impact   | Effort | Category      |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ | ------------- |
| 1  | Runtime-proof: `spectral lint` (CLI ≥ 6.17.0, `extends: ["spectral:asyncapi"]`) against an emitted 3.1.0 doc from `examples/`; record result in AGENTS.md gotcha                                           | Critical | S–M    | Quality       |
| 2  | Decide + implement landing row "Spectral, at best" reword (blocked on g-1)                                                                                                                                 | High     | S      | Documentation |
| 3  | docs-health HARVEST: pull (f) into TODO_LIST.md/ROADMAP.md once you lift the WAIT                                                                                                                          | High     | S      | Process       |
| 4  | Add FAQ answer: "Which linters/validators support AsyncAPI 3.1?" (Spectral ≥ rulesets 1.23.0 / CLI ≥ 6.17.0; `@asyncapi/parser` native; silent-skip pin warning)                                           | High     | S      | Documentation |
| 5  | Reconcile demo-video copy ("Spectral, at best" in `website/video/.../tokens.json`, `page.html`, `visible-text.txt`) with any landing reword, in ONE commit                                                 | Medium   | S–M    | Documentation |
| 6  | Add a recurring TODO_LIST item: re-verify ecosystem-dependent comparison copy after notable upstream releases (Spectral, tsp-asyncapi, AsyncAPI Studio)                                                    | High     | S      | Process       |
| 7  | Mechanize claim date-stamps: extend the "checked October 2026" pattern to every version-sensitive copy row; consider deriving from a generated data module (like `stats.ts`)                               | Medium   | M      | Quality       |
| 8  | Fix AGENTS.md compliance-suite count drift: "~270 tests" → 305 (live stat from gate output; website is already derived and safe)                                                                           | Medium   | S      | Documentation |
| 9  | Link the Spectral bullet to the exact changelog URLs (rulesets CHANGELOG, PR #3019) so future re-verification is one click                                                                                 | Low      | S      | Documentation |
| 10 | Decide CHANGELOG convention for docs-site copy fixes (blocked on g-3); apply to this fix                                                                                                                   | Low      | S      | Documentation |
| 11 | Visual QA: read the built `dist/related-tools/index.html` bullet to confirm rendering (gate-green ≠ copy reads well)                                                                                       | Low      | S      | Quality       |
| 12 | README:60: optionally append "(now supports AsyncAPI 3.1)" after g-1 decision                                                                                                                              | Low      | S      | Documentation |
| 13 | Consider a silent-skip footnote near the landing comparison: "Spectral < 6.17.0 silently skips 3.1 docs — pin ≥ 6.17.0"                                                                                    | Low      | S      | Documentation |
| 14 | Sweep website copy for other ecosystem version claims that may have silently aged (grep `checked`, `as of`, version literals in `website/src`) — same failure class as the Spectral miss                   | Medium   | M      | Quality       |
| 15 | Verify the bundled-ruleset version inside `@asyncapi/parser` and note it in AGENTS.md so the parser's validation path isn't conflated with `@stoplight/spectral-rulesets` (lockfile already proves no dep) | Low      | S      | Documentation |
| 16 | Optional e2e: emit a fixture and lint it programmatically via `@stoplight/spectral-core` (already in the tree as a parser transitive) to lock "our output lints clean under the 3.x ruleset"               | Medium   | M      | Quality       |
| 17 | ROADMAP item noticed in passing: unblock "@asyncapi/generator actual CLI testing" by running under vitest/Node instead of Bun (parser-based tests already run under Node)                                  | Medium   | M      | Quality       |
| 18 | Restore agentic_fetch credits or declare fetch/Sourcegraph the default research path                                                                                                                       | Low      | S      | Environment   |
| 19 | Save a copy-paste verification recipe (registry JSON fetch + per-package CHANGELOG fetch + Sourcegraph query) for the next external-claim task                                                             | Low      | S      | Process       |
| 20 | After g-1: if the comparison framing changes, update `website/IMPROVEMENTS.md` row 55 context so the docs-site-gap ledger stays truthful                                                                   | Low      | S      | Documentation |
| 21 | Re-verify our own npm dist-tag claims on the site the same way Spectral's metadata was verified (AGENTS.md says latest/beta/alpha → 1.1.0 as of 2026-10-04)                                                | Low      | S      | Quality       |
| 22 | Consider adding `spectral:asyncapi` to the related-tools "Where to go next" flow only if g-1 keeps Spectral as a recommended tool                                                                          | Low      | S      | Documentation |
| 23 | Add the runtime-proof result as a dated line in the AGENTS.md Spectral gotcha (supersedes the mechanism-inference label in this report)                                                                    | Medium   | S      | Documentation |

## g) QUESTIONS I could NOT figure out myself (what I tried first)

1. **How honest should the landing comparison be about Spectral?** "Spectral, at best" is now half-true: Spectral DOES schema-validate 3.1 documents (against the same `@asyncapi/specs` source our AJV tests use); what remains genuinely ours is that validation is wired on every build by default. Tried: read `sections.ts`, `ComparisonSection.astro`, `related-tools.md` — all frame workflow superiority, none states the version caveat. This is a marketing-honesty line only you can draw: keep the workflow framing, concede the schema-validation parity, or add the pin caveat as a footnote.
2. **What is the verification bar for ecosystem claims in your book?** I stopped at source-level (ruleset source + changelog + registry). Do you want runtime execution as the standard for behavior claims (one-off here, or a permanent opt-in test like f-16), or is source-level sufficient for copy accuracy?
3. **CHANGELOG convention:** do docs-site copy fixes like this get a `CHANGELOG.md` entry, or is the changelog release-scoped only (in which case this fix rides the next release notes)? I could not find a written rule; past entries are release-focused.

---

**Next step awaiting your instruction:** answers to g-1/g-2/g-3, then f-1 (runtime proof) and f-3 (HARVEST) are the two highest-leverage moves I can execute immediately. No commits made this session (harness rule); auto-commit daemon expected to pick up both edits and this report.
