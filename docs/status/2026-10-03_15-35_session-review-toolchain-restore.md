# Status Report — Change-Set Review & Toolchain Restore Session

**Date:** 2026-10-03 15:35 CEST
**Repo:** `typespec-asyncapi` @ `30470de5` (working tree clean)
**Session scope:** review of the pending 12-file change set, then execute-and-verify of the two defects found; BuildFlow full-run output (14:56) used as input context.
**Release state observed:** `v1.1.0` tag points at `2d06b977` (includes the manifest/lockfile pin restore). Publish state NOT verified this session.

---

## Self-Review (brutal, first — because you asked)

### What did I forget?

1. **The BuildFlow output already contained my headline finding.** `nix-flake-check` reported `checks.x86_64-linux.treefmt` failed at 14:56 — that WAS the generated-bindings prettier drift. I read it as background noise and only rediscovered the root cause ~30 minutes later via my own regen experiment. The evidence was in front of me before I started.
2. **No ticket for the lychee failure.** 112 broken links kill every full BuildFlow run, and I only mentioned it verbally in my summary. Point-in-time mentions get entombed; TODO_LIST was not updated (until this report's section f).
3. **`pnpm audit` was not re-run after downgrading eslint 10.12.0 → 10.11.0.** "Lockfile passes supply-chain policies" = freshness policy (minimumReleaseAge), not an advisory scan. A downgrade can theoretically reintroduce an advisory. Unverified.
4. **Second-formatter exposure unverified.** I verified the generated file against treefmt-prettier (318 files, 0 changed) but only _assumed_ BuildFlow's `dprint-format` step no-ops without a `dprint.json`. If dprint formats `.ts` with defaults, the ping-pong returns through a different door.
5. **`pnpm run check-examples` not run after the lockfile rewrite.** CI enforces it; local confirmation was skipped. The verify gate does not cover the examples workspace.

### What could I have done better?

- **First-pass review missed the split-brain.** I examined the lockfile, workspace yaml, docs, and generated file — and did NOT cross-check `package.json` specifiers against the lockfile until the step-by-step execute pass. For a lockfile diff, "does the manifest agree?" is the _first_ reviewer question, not the fifth. The initial pass would have called the change set "sound."
- **Concurrent-session awareness came late.** A second session was actively committing 1.1.0 release notes while I mutated the tree. My regen-test output ended up committed _mixed_ with their changelog work (`4392e94d`). No harm done, but I should have checked `git log` freshness and foreign modifications before my first mutation, not after they collided with mine.
- **"CI would fail" was inferred, not demonstrated.** I fixed the manifest before ever running the failing `pnpm install --frozen-lockfile`. Confidence is very high (specifier mismatch is mechanically fatal), but the claim in my summary was reasoned, not reproduced.

### What could I still improve?

- Connect pasted CI/tool output to working-tree state _before_ forming conclusions (see forgot #1).
- Treat "review" of dependency files as a three-way check: manifest ↔ lockfile ↔ documented pins in AGENTS.md. I checked two of three initially.
- In repos with the auto-commit daemon + possible parallel sessions, snapshot `git status`/`git log` immediately before every mutation batch.

### Did I lie to you?

No. Every claim in my summary maps to a command output from this session. The one soft spot is the inferred (not executed) CI failure above.

---

## a) FULLY DONE

| Item                                                                                                                                                                                                                                                                                                                       | Evidence                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reviewed the full pending 12-file change set and classified every hunk (docs = prettier table re-alignment; lockfile = eslint 10.12.0→10.11.0 + typescript 7.0.2→6.0.3 restore; workspace = `minimumReleaseAgeExclude` bypass removed with `auditConfig.ignoreGhsas` intact; generated-bindings = pure reformat)           | `git diff` analysis; quote/space-stripped comparison proved generated file value-identical (protocols, versions, field rules, placements unchanged) |
| Found and fixed the manifest/lockfile split-brain: committed `package.json` held BuildFlow's drifted pins (`eslint 10.12.0`, `typescript 7.0.2`) while the pending lockfile resolved `10.11.0` / `6.0.3` — CI's frozen install would reject this state                                                                     | Fixed via documented `pnpm -w update eslint@10.11.0 typescript@6.0.3`; committed as `2d06b977`                                                      |
| CI-parity proven: `pnpm install --frozen-lockfile` passes on the committed state                                                                                                                                                                                                                                           | "Lockfile is up to date, resolution step is skipped. Done in 22ms"                                                                                  |
| Root-caused and structurally fixed the generated-bindings formatter ping-pong: a formatter sweep had reformatted generator output; regeneration proved it flips back (1267-line churn). Fix = `src/constants/generated-bindings.ts` added to treefmt-prettier `excludes` in `flake.nix`; raw generator output is canonical | Commit `289135ad` (flake.nix); regen experiment produced byte-identical output twice (sha256 `a22d7326…`)                                           |
| Cache-cold formatter stability proven: `nix fmt -- --fail-on-change -c` → 318 files formatted, **0 changed**                                                                                                                                                                                                               | Command output, exit 0                                                                                                                              |
| Full project gate green on the committed state: `pnpm run verify` = build + lint + typecheck:test + tests + coverage + duplication                                                                                                                                                                                         | **1275 pass / 0 fail** (105 files, 4799 expects); coverage gate PASSED (45 files, avg 97.9%, min 75%); jscpd **0 clones / 0.00%**                   |
| AGENTS.md memory updated: treefmt-exclusion bullet now documents the new exclusion + the 2026-10-03 incident (formatter sweep → regen flip-back)                                                                                                                                                                           | Commit `30470de5`                                                                                                                                   |
| Verified `v1.1.0` tag includes the pin fix                                                                                                                                                                                                                                                                                 | `git merge-base --is-ancestor 2d06b977 v1.1.0` → true; tag points at `2d06b977`                                                                     |

## b) PARTIALLY DONE

1. **BuildFlow-generated-file exclusion is single-formatter.** treefmt-prettier verified; BuildFlow's `dprint-format` path assumed safe but untested. _Remains:_ run `buildflow -s dprint-format` (or a dprint check) against the regenerated file. Effort: S. Blocker: none.
2. **BuildFlow full-gate recovery.** The 14:56 run failed (lychee exit 2). The two causes I own are fixed (treefmt check was the generated-bindings drift), but 112 lychee link errors and 9 unavailable tools remain. _Remains:_ sections c/d items. Effort: M–L overall.
3. **1.1.0 release chain.** Tag verified consistent (`v1.1.0` = `2d06b977`, restored pins included). _Remains:_ whether `release.yml` ran green and npm publish/provenance/dist-tags are correct — deliberately not researched this session per your scope instruction; the concurrent session owns it. Effort: S to verify.
4. **Audit posture after downgrade.** Freshness policy passed; `pnpm audit` not re-run. _Remains:_ one command. Effort: S.
5. **Examples workspace health.** Lockfile was rewritten today; `pnpm run check-examples` (CI-enforced) not run locally. Effort: S.

## c) NOT STARTED

| Item                                                                                                                                                                                                       | Why not started                                                                 | Priority |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------- |
| Lychee link repair (112 errors: `docs/_archive/**` internal links, `website/video/…/fonts/*.woff2` missing files, `typespec.io/docs/extending-typespec/emitters` 404, ADR renames breaking relative links) | Out of session scope; needs a policy decision first (see g-Q2)                  | High     |
| vulnix triage (34 findings: binutils 2.46/2.47, bison, ada, +29 more — all nix _store/build-time_ packages)                                                                                                | Needs a dismiss/wontfix/await-nixpkgs matrix; not a repo-code fix               | Medium   |
| BuildFlow binary rebuild (`13d32f7` built, HEAD `2851a16`; results may not reflect current code)                                                                                                           | Fleet-level action; also `nix-build-verify` failing 5/5 needs investigation     | Medium   |
| DevShell tool additions (lychee, dprint, tailwindcss, interrogate run "WITHOUT project deps" today)                                                                                                        | Tooling polish; warnings only                                                   | Medium   |
| Regen-stability CI check (run generator + `git diff --exit-code`)                                                                                                                                          | Policy currently enforced only by flake exclusion + this session's manual proof | High     |
| `website/flake.nix:43` Go vendorHash investigation (possible ghost system: a Go vendor flake inside an Astro website; nix-checker also suggests extracting to `vendorHash.nix`)                            | Needs investigation before touching                                             | Medium   |
| Upstream `microsoft/typespec#12105` monitoring (filed earlier today per docs/drafts)                                                                                                                       | Filed this morning; response pending                                            | Low      |

## d) TOTALLY FUCKED UP

1. **The fleet quality gate is red and has been ignored.** Every full BuildFlow run exits 69 on lychee (112 broken links). Severity: blocks the "green gate" trust for ALL repos using this flow; the failure is 100% reproducible. Root cause: link rot in `docs/_archive/**` + 5+ missing website/video font assets + upstream URL changes. Mitigation: none currently — runs just fail. (Note: the run's treefmt failure component IS fixed by this session.)
2. **The formatter sweep silently rewrote a generator-owned file and it got committed.** `generated-bindings.ts` was prettier-formatted and auto-committed (`631e50d1`) even though regeneration contradicts it. Severity: was a recurring churn bomb (every regen = 1267-line diff); _now structurally fixed_ (`289135ad`), but it demonstrates the sweep has no "generated file" awareness. Root cause: prettier excludes list predated the file being swept. Mitigation: in place (flake exclude); dprint path still unverified.
3. **BuildFlow's `pnpm-update` keeps re-breaking the toolchain, and the auto-commit daemon then _commits_ the broken state.** Today's `2d06b977` is at least the second same-day restore of `typescript`/`eslint` pins; earlier today the drifted manifest was committed at HEAD before the lockfile restore landed, creating the exact frozen-install-breaking state I found. Severity: any tag/publish cut in the wrong window ships a red CI. Root cause: BuildFlow writes manifests without lockfiles + writes `<24h` excludes (documented in AGENTS.md as upstream candidates). Mitigation: manual ritual after every `buildflow update` (documented), plus the tag-window check I added to this report.
4. **Two concurrent sessions committed interleaved with mixed authorship.** Auto-commits `4392e94d`, `289135ad`, `30470de5` each mix my fixes with the other session's release-notes work. Severity: no data loss, but history is hard to attribute and a `git restore`/revert by either session could have nuked the other's work. Root cause: no session-claim convention in a daemon-driven repo. Mitigation: none yet (process fix in section e).

## e) WHAT WE SHOULD IMPROVE

1. **Read tool output as evidence, not noise.** The BuildFlow treefmt failure was the diagnosis of the day's main bug, printed 30 minutes before I found it myself. Practice: before investigating, grep the pasted failure list for anything matching files I'm about to touch.
2. **Dependency-file review = 3-way check.** Manifest ↔ lockfile ↔ AGENTS.md documented pins. Make it a reflex (or a script — see f-4).
3. **Generated artifacts need a machine policy, not vigilance.** The flake exclude fixes prettier; the class survives as long as two formatters (dprint via BuildFlow, prettier via treefmt) exist with no shared exclusion source. Consolidate formatter ownership to ONE for JS/TS.
4. **Concurrent-session hygiene.** In daemon-driven repos, check `git log -1 --format=%ci` freshness + `git status` before mutating; announce scope early; avoid regen-style experiments while a foreign session is mid-write.
5. **Verbal follow-ups rot; tickets don't.** The lychee failure was "mentioned" in my summary — that is not capture. Section (f) + HARVEST is the mechanism; use it every time.
6. **Pin-drift permanently:** a 3-line script that fails when root `typescript` major ≠ 6 or `eslint` ≠ pinned value (typescript-eslint peer range guard) would have caught today's drift at gate time, not review time.

---

## f) Top things to get done next (ranked; HARVEST-ready for TODO_LIST/ROADMAP)

| #  | Task                                                                                                                                                                         | Impact   | Effort                  | Category      |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------- | ------------- |
| 1  | Verify 1.1.0 release pipeline end-to-end: `gh run list` for release.yml on `v1.1.0`, npm dist-tags, provenance                                                               | Critical | S                       | Release       |
| 2  | Decide lychee policy: exclude `docs/_archive/**` (+ `docs/status/**`?) from link-checking vs repair-in-place (archives are annotate-dont-rewrite) — then make the gate green | Critical | S (policy) / M (repair) | Quality       |
| 3  | Restore the 5+ missing `website/video/…/fonts/space-grotesk-*.woff2` assets lychee found                                                                                     | High     | S                       | Bug           |
| 4  | Add regen-stability check to the verify gate: run `scripts/generate-binding-specs.ts`, then `git diff --exit-code src/constants/generated-bindings.ts`                       | High     | S                       | Quality       |
| 5  | Verify dprint (BuildFlow) ignores `src/constants/generated-bindings.ts`; if not, add BuildFlow-side exclusion                                                                | High     | S                       | Tooling       |
| 6  | Re-run `pnpm audit` post-eslint-downgrade; confirm the 14/15-cleared posture holds                                                                                           | High     | S                       | Security      |
| 7  | Run `pnpm run check-examples` locally post-lockfile-rewrite (CI parity)                                                                                                      | Medium   | S                       | Quality       |
| 8  | Rebuild BuildFlow binary (`nix build . && nix run .#reinstall`) to clear the freshness warning; investigate `nix-build-verify` 5/5 failures                                  | Medium   | S                       | Tooling       |
| 9  | Add `pnpm install --frozen-lockfile` as an explicit early stage of `pnpm run verify` (would have caught today's split-brain mechanically)                                    | High     | S                       | Quality       |
| 10 | Add toolchain-guard script: fail gate if root typescript major > 6 or eslint ≠ pinned (typescript-eslint peer range)                                                         | High     | S                       | Quality       |
| 11 | Consolidate JS/TS formatter ownership to one engine (treefmt-prettier XOR dprint) to kill the two-formatter ping-pong class                                                  | Medium   | M                       | Tooling       |
| 12 | Add lychee, dprint, tailwindcss, interrogate to devShell (kills 4 "WITHOUT project deps" warnings)                                                                           | Medium   | S                       | Tooling       |
| 13 | Triage vulnix's 34 CVEs into fix/wontfix/await-nixpkgs with a documented dismissal list                                                                                      | Medium   | M                       | Security      |
| 14 | Investigate `website/flake.nix:43` Go vendorHash — ghost-system candidate in an Astro site; extract or delete                                                                | Medium   | S                       | Cleanup       |
| 15 | Run full BuildFlow again after items 1–13 and confirm exit 0 (loop closure)                                                                                                  | High     | S                       | Quality       |
| 16 | Sweep for OTHER generator-owned files prettier can reach (grep "auto-generated"/"do not edit" headers); exclude or regen-verify each                                         | Medium   | S                       | Quality       |
| 17 | Establish a concurrent-session convention: freshness check before mutation, or daemon pause during multi-step reviews                                                        | Medium   | M                       | Process       |
| 18 | Fix `docs/_archive/architecture/2025-09-02…` typespec.io 404 (`/docs/extending-typespec/emitters` moved upstream)                                                            | Low      | S                       | Cleanup       |
| 19 | Fix `_archive` ADR/USAGE relative-link breakage class from past renames (ADR-001 → adr/001-asset-emitter.md etc.)                                                            | Low      | M                       | Cleanup       |
| 20 | Replace 37 redirecting URLs with resolved ones where in live docs (lychee hint)                                                                                              | Low      | S                       | Cleanup       |
| 21 | Add in-repo lychee config (`.lychee.toml`) with explicit excludes so link policy is versioned, not BuildFlow defaults                                                        | Medium   | S                       | Tooling       |
| 22 | Verify BuildFlow's nix-fmt step honors the new flake exclusion end-to-end (`buildflow -s nix-fmt`)                                                                           | Medium   | S                       | Tooling       |
| 23 | AGENTS.md: document that `docs/drafts` + `docs/planning` ARE prettier-formatted (unlike `_archive`/`status`) so future sweeps are expected                                   | Low      | S                       | Documentation |
| 24 | Decide if `docs/drafts` canonical copies (e.g. the #12105 filing) should be byte-frozen (exclude from prettier) vs living-format                                             | Low      | S                       | Documentation |
| 25 | Re-bump eslint to 10.12.0 once it soaks >24h (minimumReleaseAge-compliant) and drop any remaining references                                                                 | Low      | S                       | Dependency    |
| 26 | Track typescript-eslint#10940 for TS 7 peer support to unpin root typescript                                                                                                 | Low      | S                       | Dependency    |
| 27 | Add HARVEST of this report into TODO_LIST.md / ROADMAP.md (docs-health)                                                                                                      | Medium   | S                       | Documentation |
| 28 | Record the lockfile/manifest split-brain failure signature + fix command in AGENTS.md troubleshooting (one-liner: `pnpm -w update pkg@x.y.z`)                                | Low      | S                       | Documentation |
| 29 | AGENTS.md: note generator determinism (sha-verified) next to the binding-specs docs                                                                                          | Low      | S                       | Documentation |
| 30 | Update TODO_LIST.md Release-1.1.0 item once publish state is confirmed                                                                                                       | Low      | S                       | Documentation |
| 31 | Post-1.1.0 FEATURES.md refresh (already queued in TODO_LIST)                                                                                                                 | Medium   | M                       | Documentation |
| 32 | Investigate `nix-build-verify` 5/5 failure rate flagged by preflight                                                                                                         | Medium   | S                       | Tooling       |
| 33 | Review `buildflow doctor`'s 9 unavailable tools; fix or explicitly skip each                                                                                                 | Medium   | S                       | Tooling       |
| 34 | Add a website-build asset-existence check so missing fonts fail the website build, not a fleet-wide link gate                                                                | Medium   | M                       | Quality       |
| 35 | Consider `--fail-on warning` for BuildFlow in CI once findings are cleared                                                                                                   | Low      | S                       | Tooling       |
| 36 | Decide fate of inert npm-compat `overrides` block in root package.json (verify website/video npm usage first)                                                                | Low      | S                       | Cleanup       |
| 37 | Remove stale `alpha` npm dist-tag (0.0.1-alpha.2; UI-only, token DELETE → 403)                                                                                               | Low      | S                       | Cleanup       |
| 38 | Consider upstreaming a BuildFlow provider check: "generated files must be regen-stable" (fleet value)                                                                        | Low      | M                       | Tooling       |
| 39 | Cosmetic: fix the TODO_LIST.md continuation-line de-indent prettier introduced                                                                                               | Low      | S                       | Cleanup       |
| 40 | Confirm daemon committed this report + AGENTS.md edits; final `git status` at session end                                                                                    | Low      | S                       | Process       |

_(Items 1–15 are the actionable core; 16–40 are ROADMAP-fuel-grade unless prioritized.)_

---

## g) Questions I can NOT figure out myself

1. **Release intent:** `v1.1.0` points at `2d06b977` (pins restored), but the later commits (`4392e94d`, `289135ad`, `30470de5` — raw-canonical generated file, flake exclusion, release notes) are NOT in the tag. Did `release.yml` already run/publish from the tag, and do you want 1.1.0 shipped as-is (my later commits are formatter-policy only, safe to omit) or re-cut to include them?
2. **Link-gate policy:** for the 112 lychee errors — should `docs/_archive/**` (and `docs/status/**`) be _excluded_ from link checking (annotate-dont-rewrite wins) with repairs scoped to live docs + website assets only? I can't decide whether archive immutability or link-health is the stronger invariant for you.
3. **Formatter ownership:** should dprint be dropped from the BuildFlow repair set for JS/TS in favor of treefmt-prettier as the single formatter (kills the two-formatter class permanently), or is dprint your intended primary and treefmt should delegate to it?

---

**Handoff:** Section (f) is structured for `docs-health` HARVEST → `TODO_LIST.md` / `ROADMAP.md`.

**WAITING FOR INSTRUCTIONS.**
