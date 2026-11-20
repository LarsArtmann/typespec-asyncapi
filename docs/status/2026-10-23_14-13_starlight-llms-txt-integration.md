# Status Report: `starlight-llms-txt` integration

**Date:** 2026-10-23 14:13
**Scope:** this session only (LLM endpoint request -> plugin evaluation -> adoption -> verification)
**Overall state:** implemented locally, all local gates green, **not deployed, not pushed, not CI-verified**
**Working tree:** clean (auto-commit daemon committed every change)

---

## 0. Session verdict

| Metric                  | Value                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| ~~Requested work~~ done — the plugin generates all three endpoints today ( `website/astro.config.mjs` ) and the site is live per `website/IMPROVEMENTS.md:7` | ~~Add an LLM endpoint to the website~~ |
| ~~Delivered~~ done — `starlight-llms-txt@0.12.0` is still a website dependency ( `website/package.json` ) resolved in `pnpm-lock.yaml` | ~~3 generated endpoints (`/llms.txt`, `/llms-full.txt`, `/llms-small.txt`) via `starlight-llms-txt@^0.12.0`~~ |
| ~~Local website gate~~ done — now a standing CI gate: `.github/workflows/ci.yml:41` runs the website check on every push | ~~PASS (22 pages, 778 internal refs, CSP 22/22)~~ |
| ~~Local root `verify`~~ done — suite has since grown to 1275 tests / 105 files per the 2026-10-03 audit ( `FEATURES.md:4` ) | ~~PASS (1275 tests, 105 files, 97.9% avg coverage, 0 clones)~~ |
| ~~Frozen-lockfile install~~ done — CI installs with `--frozen-lockfile` ( `.github/workflows/ci.yml:32` ) | ~~PASS~~ |
| ~~Security audit~~ done — advisory no longer fires: `pnpm audit` in `website/` reports no unignored findings ( re-verified 2026-11-20 ) | ~~**FAIL: 1 high advisory introduced, no patch available**~~ |
| ~~Deployed~~ done — deployed 2026-10-23 and verified live ( `website/IMPROVEMENTS.md:7` ) | ~~NO~~ |
| ~~Pushed / CI~~ done — long since pushed; `v1.2.0` tagged 2026-11-19 | ~~NO~~ |

Artifacts produced by the last build:

| File                          | Size     |
| ----------------------------- | -------- |
| ~~`website/dist/llms.txt`~~ done — regenerated on every build; presence gated by `website/scripts/check-links.mjs:87` | ~~1,126 B~~ |
| ~~`website/dist/llms-full.txt`~~ done — same gate ( `website/scripts/check-links.mjs:88` ) | ~~75,626 B~~ |
| ~~`website/dist/llms-small.txt`~~ done — same gate ( `website/scripts/check-links.mjs:89` ) | ~~64,622 B~~ |

Documentation pages in the collection: 20 (19 real docs + `404.md`).

---

## 1. The three questions, answered honestly

### 1.1 What did I forget?

~~1. **I forgot to run `pnpm audit` while adding the dependency.** I only ran it at report time and discovered a new high-severity advisory (`braces` <= 3.0.3, GHSA-vfj7-8cjw-p6xm, no patched version) pulled in through `starlight-llms-txt > micromatch > braces`.~~ **NOT-DO — moot — the `braces` advisory no longer fires; `pnpm audit` in `website/` is clean ( 2026-11-20 ).**
~~2. **I forgot the old `/llms.txt` contract.** The hand-rolled endpoint listed every documentation page with title, URL, and description. The plugin's `/llms.txt` only links the doc sets. That is a functional regression I did not anticipate or call out when recommending the switch.~~ **Won't implement — per-page index never restored; the plugin's sets-only entrypoint stands ( `website/dist/llms.txt` ).**
~~3. **I forgot that `astro build` is not idempotent here.** Running the website gate against an existing `dist/` failed with `ERR_MODULE_NOT_FOUND ... dist/.prerender/chunks/rss_*.mjs`. I worked around it by trashing `dist` and `.astro`, but did not fix the script.~~ **NOT-DO — duplicate of §7 item 4 below ( gate cleaning — harvested ).**
~~4. **I forgot UI chrome leaks into the generated corpus.** `llms-full.txt` contains 106 `[Section titled ...]` anchor lines, and `llms-small.txt` contains 43. These come from Starlight's `<a class="sl-anchor-link">` elements and are pure noise for an LLM.~~ **NOT-DO — duplicate of §7 item 2 below ( anchor noise — harvested ).**
~~5. **I forgot `pnpm run check-examples`.** It is a CI gate after the website check, and my root TypeScript restore changed the toolchain.~~ done — `check-examples` now runs in CI ( `.github/workflows/ci.yml:38` )
~~6. **I forgot to verify `node_modules` against the lockfile before trusting gates.** `pnpm list` reported TypeScript 7.0.2 while the lockfile said 6.0.3; only `pnpm install --force` relinked it.~~ **Superseded — AGENTS.md:206 manifest-drift detection playbook.**
~~7. **I forgot to update `website/README.md` and `website/IMPROVEMENTS.md`.** `README.md` still says `src/pages` contains "llms.txt endpoints" and lists only two required llms artifacts.~~ **NOT-DO — `IMPROVEMENTS.md` was updated; the README row is carried at §7 item 11 ( harvested ).**
~~8. **I forgot to decide what to do about the 404 page in `llms-full.txt`.** I documented the limitation instead of solving or escalating it.~~ **Won't implement — 404 still tails the full corpus by design; documented in `AGENTS.md:217`.**
~~9. **I forgot to diff old vs new LLM output before declaring success.** A simple diff would have surfaced both the lost page index and the anchor noise.~~ **NOT-DO — process lesson; the content-diff gap is tracked at §7 item 3.**

### 1.2 What could I have done better?

~~1. **Inspect the lockfile diff immediately after install.** `pnpm add` re-resolved unrelated entries (root `eslint` 10.12.0 -> 10.13.0, `jscpd` 5.4.1 -> 5.4.2, website `typescript` 6.0.3 -> 7.0.2). The manifest changes were pre-existing, but the stale lockfile had been hiding them; my install made them real.~~ **Superseded — AGENTS.md:206 drift playbook ( diff importer `specifier` values ).**
~~2. **Pin TypeScript before installing anything.** `astro check` refuses TS 7, so the website's `^7.0.2` range was a landmine. Exact `6.0.3` is the correct pin and should have been step zero.~~ **Superseded — AGENTS.md:206 exact TypeScript `6.0.3` pin doctrine.**
~~3. **Avoid `pnpm install --lockfile-only` mid-task.** It left pnpm's metadata inconsistent with `node_modules`, which caused the `--force` reinstall detour.~~ **Superseded — AGENTS.md:206 lockfile-consistency and reinstall steps.**
~~4. **Verify plugin output semantically, not just structurally.** I checked that three files existed and looked at the headers; I did not audit the body for regressions, duplicated headings, or lost index entries.~~ **NOT-DO — corpus content remains unasserted — routed with §7 item 3.**
~~5. **Add a content assertion to the gate in the same change.** "File exists" is a weak check for a generated corpus.~~ **NOT-DO — duplicate of §7 item 3 below ( harvested ).**
~~6. **Clean `dist`/`.astro` before the first gate run.** One failed gate run and one stack-trace investigation were avoidable.~~ **NOT-DO — duplicate of §7 item 4 below ( harvested ).**
~~7. **Keep the change set tightly scoped.** The root TypeScript restore was necessary, but it belongs in a separate commit with its own rationale, not bundled into a website feature.~~ **Won't implement — process note only; the auto-commit daemon bundles whatever is on disk.**
~~8. **Run audit and `check-examples` as part of the definition of done.**~~ done — audit runs via BuildFlow's `pnpm-audit` step and `check-examples` in CI ( `.github/workflows/ci.yml:38` )

### 1.3 What could I still improve?

~~1. **Fix the anchor-link noise** with `customSelectors: { all: [".sl-anchor-link"] }` and re-verify sizes.~~ **NOT-DO — duplicate of §7 item 2 below ( anchor noise — harvested ).**
~~2. **Restore a per-page index** in the LLM entrypoint (a separate generated `llms-index.txt`, or `customSets` per section).~~ **Won't implement — never restored; no consumer demand surfaced; sets-only entrypoint ( `website/dist/llms.txt` ).**
~~3. **Make the gate idempotent** by cleaning `dist`/`.astro` in `check` (using `trash`, not `rm`).~~ **NOT-DO — duplicate of §7 item 4 below ( harvested ).**
~~4. **Add `check:llms`** that asserts presence, non-trivial size, ordering, absence of `404` from `llms-small.txt`, and resolvable doc links.~~ **NOT-DO — duplicate of §7 item 3 below ( harvested ).**
~~5. **Extend `check-links.mjs`** to validate Markdown links inside the `.txt` artifacts, not just HTML `href`/`src`.~~ **Won't implement — never built; `check-links.mjs` validates HTML `href`/`src` only.**
~~6. **Decide the security posture** for the unpatchable `braces` advisory (documented dismissal with `auditConfig.ignoreGhsas`, or remove/block the plugin).~~ **NOT-DO — moot — website audit is clean today ( 2026-11-20 ).**
~~7. **Update README and IMPROVEMENTS**, and add the plugin to the website architecture notes.~~ **NOT-DO — duplicate of §7 item 11 below ( harvested ).**
~~8. **Deploy and verify live** after approval.~~ done — deployed and verified live 2026-10-23 ( `website/IMPROVEMENTS.md:7` )
~~9. **Run `check-examples` and CI** with the final dependency graph.~~ done — in CI ( `.github/workflows/ci.yml:38` )
~~10. **Add an audit step to CI or the release checklist** so this class of regression is caught automatically.~~ done — BuildFlow runs `pnpm-audit` on this repo ( green per the 2026-10-03 report addendum §6 )

---

## 2. a) FULLY DONE

| #  | Item                                                                                           | Evidence                                                                                                                                                                                  |
| -- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~1~~ done at `9cd4033d` | ~~Evaluated both candidate Astro plugins and selected the maintained one~~ | ~~`starlight-llms-txt` 0.12.0 (peer `astro ^7.0.0`, `starlight >=0.41.0`) matches our `astro ^7.4.2` / `starlight ^0.42.6`; `astro-llms-txt` 0.0.1-beta needs Astro 5 and has empty options~~ |
| ~~2~~ done at `9cd4033d` | ~~Installed the plugin as a website dependency~~ | ~~`website/package.json:48` (`^0.12.0`), committed in `9cd4033d`~~ |
| ~~3~~ done at `6242dfb1` | ~~Wired the plugin with project description, details, optional links, ordering, and 404 handling~~ | ~~`website/astro.config.mjs:4`, `:63-90`~~ |
| ~~4~~ done at `6242dfb1` | ~~Removed the hand-rolled routes that would shadow injected routes~~ | ~~`src/pages/llms.txt.ts` and `src/pages/llms-full.txt.ts` deleted in `6242dfb1`~~ |
| ~~5~~ done at `6242dfb1` | ~~Generated all three endpoints from Starlight content~~ | ~~`dist/llms.txt`, `dist/llms-full.txt`, `dist/llms-small.txt` with sizes above~~ |
| ~~6~~ done at `6242dfb1` | ~~Added `llms-small.txt` to the required-artifact list~~ | ~~`website/scripts/check-links.mjs:89`~~ |
| ~~7~~ done at `6e4d47c8` | ~~Documented the plugin, the routing collision hazard, and the 404 limitation~~ | ~~`AGENTS.md:213`, committed in `6e4d47c8`~~ |
| ~~8~~ done at `6242dfb1` | ~~Website gate passes~~ | ~~`astro check` 0 errors, 22 pages built, `html-validate` clean, 778 internal refs valid, CSP 22/22~~ |
| ~~9~~ done at `7b680f3b` | ~~Root `verify` passes~~ | ~~1275 tests, 105 files, 4799 assertions, coverage 97.9% average (min 75% per file), 0 clones~~ |
| ~~10~~ done at `7b680f3b` | ~~Frozen-lockfile install passes~~ | ~~`pnpm install --frozen-lockfile` reports "Lockfile is up to date"~~ |
| ~~11~~ done at `7b680f3b` | ~~Website TypeScript drift repaired~~ | ~~exact `6.0.3` in `website/package.json:54`; `astro check` works again~~ |
| ~~12~~ done at `7b680f3b` | ~~Root TypeScript restored to the documented 6.x line~~ | ~~root `package.json:134` now `6.0.3`; `eslint` and `tsc` both run again~~ |
| ~~13~~ done at `6242dfb1`, `7b680f3b`, `6e4d47c8` | ~~Committed state~~ | ~~`6242dfb1`, `7b680f3b`, `6e4d47c8`; working tree clean~~ |

Note on commits: the auto-commit daemon produced these commits, so file groupings are heuristic and several unrelated files landed together.

---

## 3. b) PARTIALLY DONE

| # | Item                           | Works now                                                            | Still open                                                                     | Effort |
| - | ------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------ |
| ~~1~~ done — deployed 2026-10-23 and live-verified ( `website/IMPROVEMENTS.md:7` ) | ~~LLM endpoints in production~~ | ~~Built and locally verified~~ | ~~Not deployed, not pushed, no live check~~ | ~~S~~ |
| ~~2~~ **Won't implement — per-page index never restored; the sets-only entrypoint stands.** | ~~`/llms.txt` entrypoint quality~~ | ~~Links small/full sets, description, optional links~~ | ~~Lost the previous per-page index (title + URL + description for all 19 docs)~~ | ~~M~~ |
| ~~3~~ **Won't implement — 404 still tails `llms-full.txt` by design; documented in `AGENTS.md:217`.** | ~~404 exclusion~~ | ~~Absent from `llms-small.txt`; demoted to the tail of `llms-full.txt`~~ | ~~Plugin has no full-file exclusion; 404 page still pollutes the full corpus~~ | ~~M~~ |
| ~~4~~ **NOT-DO — duplicate of §7 item 4 below ( harvested ).** | ~~Build reproducibility~~ | ~~`trash dist .astro` then build works~~ | ~~`pnpm run check` fails if `dist/` already exists; no clean step in scripts~~ | ~~S~~ |
| ~~5~~ done — advisory moot; website audit clean ( 2026-11-20 ) | ~~Dependency security~~ | ~~Advisory identified and scoped (build-time only)~~ | ~~No dismissal, no mitigation, no CI gate; audit not in verify~~ | ~~S~~ |
| ~~6~~ done — both now in CI ( `.github/workflows/ci.yml:38` and `:41` ) | ~~Verification breadth~~ | ~~Website check + root verify green~~ | ~~`check-examples` not run; CI not run~~ | ~~M~~ |
| ~~7~~ **NOT-DO — `AGENTS.md:216` and `website/IMPROVEMENTS.md:7` done; the README row is carried at §7 item 11.** | ~~Documentation~~ | ~~`AGENTS.md` updated~~ | ~~`website/README.md` and `website/IMPROVEMENTS.md` still describe the old setup~~ | ~~S~~ |
| ~~8~~ **NOT-DO — duplicate of §7 item 2 below ( harvested ).** | ~~Corpus quality~~ | ~~Content is MDX-aware and page descriptions are included~~ | ~~106 (full) / 43 (small) `Section titled` anchor lines leak as noise~~ | ~~S~~ |
| ~~9~~ done — pins + drift playbook in `AGENTS.md:206`; BuildFlow `pnpm-update` now skipped ( `.buildflow.yml` ) | ~~Toolchain hygiene~~ | ~~Versions now consistent with manifests~~ | ~~`pnpm peers check` never run; TypeScript 7 drift can recur via Dependabot~~ | ~~S~~ |

---

## 4. c) NOT STARTED

| #  | Item                                                 | Why not started                           | Still wanted?             |
| -- | ---------------------------------------------------- | ----------------------------------------- | ------------------------- |
| ~~1~~ done — deployed 2026-10-23 ( `website/IMPROVEMENTS.md:7` ) | ~~Deploy (`nix run .#deploy-website`)~~ | ~~Not authorized in this session~~ | ~~Yes, after review~~ |
| ~~2~~ done — pushed; `v1.2.0` tagged 2026-11-19 | ~~Push / CI validation~~ | ~~No explicit request~~ | ~~Yes~~ |
| ~~3~~ done — in CI ( `.github/workflows/ci.yml:38` ) | ~~`pnpm run check-examples`~~ | ~~Ran out of scope after root TS restore~~ | ~~Yes~~ |
| ~~4~~ **NOT-DO — duplicate of §7 item 3 below ( harvested ).** | ~~`check:llms` content test~~ | ~~Not planned during implementation~~ | ~~Yes~~ |
| ~~5~~ **Won't implement — never built; HTML-ref checking only ( `website/scripts/check-links.mjs` ).** | ~~Markdown link validation inside `.txt` artifacts~~ | ~~Not planned~~ | ~~Yes~~ |
| ~~6~~ **NOT-DO — duplicate of §7 item 4 below ( harvested ).** | ~~Clean-before-build in the `check` script~~ | ~~Discovered too late~~ | ~~Yes~~ |
| ~~7~~ done — moot: the advisory no longer fires ( website audit clean 2026-11-20 ) | ~~Audit dismissal record or plugin removal decision~~ | ~~Needs a risk decision~~ | ~~Yes~~ |
| ~~8~~ **Won't implement — never requested; no `customSets` in `website/astro.config.mjs`.** | ~~`customSets` (for example a Getting Started subset)~~ | ~~Not requested~~ | ~~Optional~~ |
| ~~9~~ **Won't implement — never restored; no consumer demand surfaced.** | ~~Per-page index endpoint~~ | ~~Discovered as a regression at report time~~ | ~~Yes, if consumers want it~~ |
| ~~10~~ **NOT-DO — duplicate of §7 item 11 below ( harvested ).** | ~~README / IMPROVEMENTS updates~~ | ~~Deprioritized~~ | ~~Yes~~ |
| ~~11~~ done — live endpoints verified 2026-10-23 ( `website/IMPROVEMENTS.md:7` ) | ~~Live post-deploy verification of the three endpoints~~ | ~~Blocked on deploy~~ | ~~Yes~~ |
| ~~12~~ **Won't implement — no record it was ever filed; the 404 tail persists ( `AGENTS.md:217` ).** | ~~Upstream issue for full-file `exclude` support~~ | ~~Not filed~~ | ~~Optional~~ |
| ~~13~~ **Won't implement — superseded by the manifest-drift playbook ( `AGENTS.md:206` ).** | ~~`pnpm peers check` triage~~ | ~~Not run~~ | ~~Yes~~ |
| ~~14~~ done — BuildFlow's `pnpm-audit` step runs on this repo ( green per the 2026-10-03 report addendum §6 ) | ~~Automated audit in CI~~ | ~~Not planned~~ | ~~Yes~~ |

---

## 5. d) TOTALLY FUCKED UP

### 5.1 A high-severity advisory was introduced, and it has no patch

- **What is broken:** `pnpm audit` reports `GHSA-vfj7-8cjw-p6xm` (high) for `braces <= 3.0.3`, reachable via `website > starlight-llms-txt > micromatch > braces`. `braces@3.0.3` is the latest published version, and the advisory lists **no patched version**.
- **Severity:** high per npm, low in practice. The path is build-time only, and `micromatch` receives our own config globs, not untrusted input. It still fails the previously clean audit state.
- **Root cause:** adding the plugin, which depends on `micromatch` for `promote`/`demote`/`exclude` glob matching.
- **Mitigation:** none applied. Options: document a dismissal (`auditConfig.ignoreGhsas` + justification), or drop the plugin until upstream ships a fix.

### 5.2 The LLM entrypoint lost its per-page index

- **What is broken:** the previous `/llms.txt` enumerated every doc with URL and description. The plugin's entrypoint only links `llms-small.txt` and `llms-full.txt`.
- **Severity:** medium. Consumers can still read everything through the full set, but the discoverable index is gone.
- **Root cause:** I evaluated the plugin on file coverage and MDX handling, not on output-contract parity.
- **Mitigation:** add a generated index route or `customSets`; or accept and document the new shape.

### 5.3 The website gate is not idempotent

- **What is broken:** `pnpm --filter typespec-asyncapi-website run check` failed on the second run with `Cannot find module .../dist/.prerender/chunks/rss_BFJsMgqd.mjs`.
- **Severity:** medium. Anyone running `check` after a build hits it; CI on a clean checkout is unaffected.
- **Root cause:** stale `dist/.prerender` chunks from the previous build, not cleared by `astro build`.
- **Mitigation:** trash `dist` and `.astro` before building (done manually, not in scripts).

### 5.4 The auto-commit history contains broken intermediate states

- **What is broken:** commits `9cd4033d`, `6242dfb1`, and `14d381da` landed while the dependency graph or scripts were mid-change. Several of them cannot pass `pnpm run lint` or `astro check` as-is (TypeScript 7.0.2 resolution, partially applied config).
- **Severity:** medium. `git bisect` and per-commit CI are unreliable for this window.
- **Root cause:** the auto-commit daemon commits whatever is on disk, including half-applied work, and mixes unrelated files (`flake.nix`, status docs, formatting).
- **Mitigation:** none; history is immutable in practice. Future work should reach a green state quickly and avoid long red windows.

### 5.5 Heading-anchor chrome is embedded in the corpus

- **What is broken:** `llms-full.txt` has 106 lines of `[Section titled "..."]` and `llms-small.txt` has 43. Each is a duplicate of the heading immediately above it.
- **Severity:** low to medium. It wastes context and adds noise to retrieval.
- **Root cause:** Starlight renders `<a class="sl-anchor-link">` inside every heading; the HTML-to-Markdown converter preserves it.
- **Mitigation:** `customSelectors: { all: [".sl-anchor-link"] }`; not applied yet.

### 5.6 Lockfile churn obscured the real change

- **What is broken:** the lockfile diff was `+56 / -258` lines, including re-resolution of ESLint, jscpd, and TypeScript, mixed with the new plugin.
- **Severity:** low to medium (reviewability, not correctness).
- **Root cause:** a stale lockfile plus a broad re-resolution during `pnpm add`.
- **Mitigation:** review lockfile diffs before running gates and split toolchain repairs into their own commit.

---

## 6. e) WHAT WE SHOULD IMPROVE

| #  | Practice                                                  | Impact | Suggested fix                                                                                      |
| -- | --------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
| ~~1~~ done — audits now run via BuildFlow's `pnpm-audit` step ( not skipped in `.buildflow.yml` ) | ~~Dependency additions skip security review~~ | ~~High~~ | ~~Add `pnpm audit` to the checklist for any `pnpm add`, and to CI~~ |
| ~~2~~ **Won't implement — artifact-diff ritual never institutionalized; the content-assertion gap is routed with §7 item 3.** | ~~"Build succeeded" is treated as "output is correct"~~ | ~~High~~ | ~~Diff generated artifacts against the previous version; assert structure and content~~ |
| ~~3~~ **NOT-DO — duplicate of §7 item 3 below ( harvested ).** | ~~Text artifacts are not gated~~ | ~~High~~ | ~~Add `check:llms` with structural assertions and link resolution~~ |
| ~~4~~ **NOT-DO — duplicate of §7 item 4 below ( harvested ).** | ~~Build scripts assume a clean tree~~ | ~~High~~ | ~~Make `check` clean the build cache first (use `trash`, never `rm`)~~ |
| ~~5~~ done — superseded by policy: `pnpm-update` skipped ( `.buildflow.yml` ) and the `AGENTS.md:206` playbook | ~~Lockfile diffs are not reviewed~~ | ~~Medium~~ | ~~Require a lockfile summary in the change description~~ |
| ~~6~~ done — pin doctrine + drift playbook in `AGENTS.md:206` | ~~Toolchain drift is repaired ad hoc~~ | ~~Medium~~ | ~~Keep exact pins (`typescript`) and add Dependabot major-version ignore~~ |
| ~~7~~ **NOT-DO — subsumed by the anchor-noise row at §7 item 2.** | ~~Plugin output is trusted without inspecting the converter~~ | ~~Medium~~ | ~~Check for UI chrome (anchors, TOC, pagination) after adoption~~ |
| ~~8~~ **NOT-DO — duplicate of §7 item 11 below ( harvested ).** | ~~Docs describe old structure~~ | ~~Medium~~ | ~~Update README/IMPROVEMENTS in the same change~~ |
| ~~9~~ done — a documented dismissal policy now exists ( `pnpm-workspace.yaml:17` ignoreGhsas with rationale ) | ~~Unpatchable advisories have no documented policy~~ | ~~Medium~~ | ~~Either dismiss with justification or block the dependency~~ |
| ~~10~~ **Won't implement — never built; `website/scripts/` carries no tests today.** | ~~Website scripts have no automated tests~~ | ~~Medium~~ | ~~Add `node:test` cases for `check-links`, `check-csp`, and a new `check-llms`~~ |
| ~~11~~ **Superseded — AGENTS.md:206 lockfile-consistency steps.** | ~~Install workflows can leave `node_modules` inconsistent~~ | ~~Medium~~ | ~~Prefer `pnpm add --filter`; verify with `pnpm list` + `--frozen-lockfile`; avoid `--lockfile-only`~~ |
| ~~12~~ **Won't implement — process note; the auto-commit daemon commits the tree as-is.** | ~~Scope discipline~~ | ~~Low~~ | ~~Keep website feature, toolchain repair, and formatting in separate commits~~ |

---

## 7. f) Up to 50 things to get done next

Impact: Critical / High / Medium / Low. Effort: S (<30 min) / M (30 min to 2 h) / L (>2 h).

| #  | Task                                                                                                      | Impact   | Effort | Category |
| -- | --------------------------------------------------------------------------------------------------------- | -------- | ------ | -------- |
| ~~1~~ **NOT-DO — moot — `pnpm audit` in `website/` reports no unignored findings ( 2026-11-20 ); plugin retained and deployed.** | ~~Decide the `braces` advisory policy: documented `auditConfig.ignoreGhsas` dismissal or remove the plugin~~ | ~~Critical~~ | ~~S~~ | ~~Security~~ |
| 2  | Add `customSelectors: { all: [".sl-anchor-link"] }` and rebuild                                           | High     | S      | Quality  |
| 3  | Add `check:llms` asserting 3 files, non-zero size, ordering, docs present, no 404 in `llms-small.txt`     | High     | M      | Quality  |
| 4  | Make `pnpm run check` clean `dist`/`.astro` first (via `trash`)                                           | High     | S      | Quality  |
| ~~5~~ **Won't implement — never built; `website/scripts/check-links.mjs` checks HTML `href`/`src` only.** | ~~Validate Markdown links inside `.txt` artifacts in `check-links.mjs`~~ | ~~High~~ | ~~M~~ | ~~Quality~~ |
| ~~6~~ done — `.github/workflows/ci.yml:38` | ~~Run `pnpm run check-examples` against the restored toolchain~~ | ~~High~~ | ~~M~~ | ~~Quality~~ |
| ~~7~~ done — deployed 2026-10-23 ( `website/IMPROVEMENTS.md:7` ) | ~~Deploy with `nix run .#deploy-website` after approval~~ | ~~High~~ | ~~S~~ | ~~Ops~~ |
| ~~8~~ done — live endpoints verified ( `website/IMPROVEMENTS.md:7` ) | ~~Verify live `/llms.txt`, `/llms-full.txt`, `/llms-small.txt` return 200 with `text/plain`~~ | ~~High~~ | ~~S~~ | ~~Ops~~ |
| ~~9~~ done — BuildFlow runs `pnpm-audit` ( not skipped in `.buildflow.yml` ; green per the 2026-10-03 addendum §6 ) | ~~Add `pnpm audit` to CI (or a scheduled job)~~ | ~~High~~ | ~~M~~ | ~~Security~~ |
| ~~10~~ **Won't implement — never restored; sets-only entrypoint ( `website/dist/llms.txt` ).** | ~~Restore a per-page documentation index in the LLM entrypoint if consumers need it~~ | ~~High~~ | ~~M~~ | ~~Feature~~ |
| 11 | Update `website/README.md`: remove "pages/ llms.txt endpoints", document plugin generation                | Medium   | S      | Docs     |
| ~~12~~ done — deploy recorded at `website/IMPROVEMENTS.md:7` and item 86 marked Done ( `:118` ) | ~~Update `website/IMPROVEMENTS.md` (mark plugin adoption, note 404 caveat)~~ | ~~Medium~~ | ~~S~~ | ~~Docs~~ |
| ~~13~~ **Won't implement — `404.md` remains in the docs collection and still tails `llms-full.txt` ; documented in `AGENTS.md:217`.** | ~~Move the 404 page out of the `docs` collection (`src/pages/404.astro`) if full-corpus cleanliness matters~~ | ~~Medium~~ | ~~M~~ | ~~Refactor~~ |
| ~~14~~ **Won't implement — never filed from this repo ( no trace in git history ); the 404 tail persists.** | ~~File an upstream issue for full-file `exclude` support in `starlight-llms-txt`~~ | ~~Medium~~ | ~~S~~ | ~~Upstream~~ |
| ~~15~~ **Won't implement — never requested; no `customSets` declared ( `website/astro.config.mjs` ).** | ~~Add a `customSets` entry for Getting Started (small-context subset)~~ | ~~Low~~ | ~~M~~ | ~~Feature~~ |
| ~~16~~ **Won't implement — `optionalLinks` still lists GitHub + npm only ( `website/astro.config.mjs` ).** | ~~Add `optionalLinks` for the changelog and security policy~~ | ~~Low~~ | ~~S~~ | ~~Docs~~ |
| ~~17~~ **Won't implement — no size-budget assertion was ever added to the gate.** | ~~Add a size budget assertion for `llms-full.txt` and `llms-small.txt`~~ | ~~Low~~ | ~~S~~ | ~~Quality~~ |
| ~~18~~ **Won't implement — promote/demote ordering was never put under test.** | ~~Add a test for `promote`/`demote` ordering~~ | ~~Low~~ | ~~S~~ | ~~Quality~~ |
| ~~19~~ **Won't implement — no small-vs-full size assertion exists.** | ~~Assert `llms-small.txt` is smaller than `llms-full.txt`~~ | ~~Low~~ | ~~S~~ | ~~Quality~~ |
| ~~20~~ **Won't implement — no Content-Type assertion exists; the endpoints are static files.** | ~~Assert response `Content-Type` for the three endpoints~~ | ~~Low~~ | ~~S~~ | ~~Quality~~ |
| ~~21~~ **NOT-DO — subsumed by the anchor-noise row at item 2.** | ~~Audit generated output for other sites' chrome (TOC, pagination, feedback widgets)~~ | ~~Medium~~ | ~~S~~ | ~~Quality~~ |
| ~~22~~ **Won't implement — no `/website` npm updater exists in `.github/dependabot.yml` ; TS drift came via BuildFlow `pnpm-update` ( now skipped in `.buildflow.yml` ).** | ~~Add a Dependabot ignore rule for TypeScript major bumps on `website/`~~ | ~~High~~ | ~~S~~ | ~~Quality~~ |
| ~~23~~ done — covered: CI's frozen-lockfile install fails on manifest drift ( `.github/workflows/ci.yml:32` ; playbook `AGENTS.md:206` ) | ~~Add a CI guard that `website` resolves TypeScript 6.x~~ | ~~Medium~~ | ~~S~~ | ~~Quality~~ |
| ~~24~~ **Won't implement — never run; superseded by the `AGENTS.md:206` drift playbook.** | ~~Run `pnpm peers check` and triage the reported peers~~ | ~~Medium~~ | ~~S~~ | ~~Quality~~ |
| ~~25~~ **Won't implement — no `/website` npm updater exists ( `.github/dependabot.yml` ).** | ~~Review whether `starlight-llms-txt` 0.x upgrades should be grouped in Dependabot~~ | ~~Low~~ | ~~S~~ | ~~Ops~~ |
| ~~26~~ done — `pnpm-update` is skipped in `.buildflow.yml` and dependency bumps are deliberate verified passes ( TODO_LIST §Dependency & Toolchain Refresh ) | ~~Re-check `pnpm-lock.yaml` diff discipline in future dependency PRs~~ | ~~Medium~~ | ~~S~~ | ~~Process~~ |
| ~~27~~ **NOT-DO — duplicate of item 11 ( README row — harvested ).** | ~~Add the plugin and its constraints to the website architecture section of README~~ | ~~Medium~~ | ~~S~~ | ~~Docs~~ |
| ~~28~~ **Won't implement — one-time verification recorded ( `website/IMPROVEMENTS.md:7` ); no standing checklist was built.** | ~~Add a post-deploy smoke checklist for LLM endpoints~~ | ~~Medium~~ | ~~S~~ | ~~Ops~~ |
| ~~29~~ **Won't implement — `llms.txt` verified 200 live ( `website/IMPROVEMENTS.md:7` ); link targets not re-audited.** | ~~Verify `llms.txt` optional links and set links after deploy~~ | ~~Medium~~ | ~~S~~ | ~~Ops~~ |
| ~~30~~ done — `disable404Route: true` holds ( `website/astro.config.mjs` ) | ~~Confirm `disable404Route` still holds with the new routes~~ | ~~Low~~ | ~~S~~ | ~~Quality~~ |
| ~~31~~ **Won't implement — moot; no `customSets` declared ( `website/astro.config.mjs` ).** | ~~Confirm `/_llms-txt/[slug].txt` emits nothing when `customSets` is empty~~ | ~~Low~~ | ~~S~~ | ~~Quality~~ |
| ~~32~~ **Won't implement — never evaluated; MDX-aware output has been acceptable.** | ~~Evaluate whether `rawContent: true` is preferable for our `.md`-only docs~~ | ~~Low~~ | ~~S~~ | ~~Feature~~ |
| ~~33~~ **Won't implement — never built; `website/scripts/` has no test files.** | ~~Add a `node:test` harness for website scripts~~ | ~~Medium~~ | ~~M~~ | ~~Quality~~ |
| ~~34~~ **Won't implement — never added; `check-links.mjs` asserts presence only.** | ~~Add a test for the 404 page's exclusion from `llms-small.txt`~~ | ~~Medium~~ | ~~S~~ | ~~Quality~~ |
| ~~35~~ **Won't implement — never added; no per-doc coverage assertion exists.** | ~~Add a test that all 19 docs appear in `llms-full.txt`~~ | ~~High~~ | ~~S~~ | ~~Quality~~ |
| ~~36~~ **NOT-DO — subsumed by item 5 ( markdown-link validation — never built ).** | ~~Add a test that every doc URL in `llms.txt` resolves~~ | ~~Medium~~ | ~~S~~ | ~~Quality~~ |
| ~~37~~ **NOT-DO — fix not applied; the noise persists — routed with item 2.** | ~~Add a note to AGENTS about the `sl-anchor-link` noise and its selector fix (after applying)~~ | ~~Low~~ | ~~S~~ | ~~Docs~~ |
| ~~38~~ **Won't implement — process note; the auto-commit daemon bundles commits regardless.** | ~~Split future toolchain repairs into their own commit~~ | ~~Low~~ | ~~S~~ | ~~Process~~ |
| ~~39~~ **Superseded — TODO_LIST §Dependency & Toolchain Refresh ( deliberate verified-pass policy ).** | ~~Add an explicit "definition of done" checklist for dependency additions~~ | ~~Medium~~ | ~~S~~ | ~~Process~~ |
| ~~40~~ **Won't implement — never checked; the plugin runs at build time only.** | ~~Confirm the new dev-only dependency adds nothing to the client bundle~~ | ~~Low~~ | ~~S~~ | ~~Quality~~ |
| ~~41~~ **Won't implement — caching posture never revisited; 1-hour TTL stands.** | ~~Consider immutable caching for `llms-*.txt` versus the current 1-hour TTL~~ | ~~Low~~ | ~~S~~ | ~~Ops~~ |
| ~~42~~ **Won't implement — never checked; no compression findings recorded.** | ~~Check the deployed files against Google/Firebase compression behavior~~ | ~~Low~~ | ~~S~~ | ~~Ops~~ |
| ~~43~~ **Won't implement — item 86 is marked Done without a cross-link ( `website/IMPROVEMENTS.md:118` ).** | ~~Add a `docs/status` cross-link from IMPROVEMENTS item 86 to this report~~ | ~~Low~~ | ~~S~~ | ~~Docs~~ |
| ~~44~~ done — CI runs the website gate on clean checkouts ( `.github/workflows/ci.yml:41` ) | ~~Verify the website gate on a truly clean clone (CI simulation)~~ | ~~Medium~~ | ~~S~~ | ~~Quality~~ |
| ~~45~~ done — standing gate green through `v1.2.0` ( 1275 tests per `FEATURES.md:4` ) | ~~Re-run root `verify` after `check-examples` and any selector change~~ | ~~Medium~~ | ~~M~~ | ~~Quality~~ |
| ~~46~~ **NOT-DO — duplicate of item 11 ( README row — harvested ).** | ~~Add an `llms` section to the website README script table~~ | ~~Medium~~ | ~~S~~ | ~~Docs~~ |
| ~~47~~ **NOT-DO — subsumed by item 2 ( anchor noise ).** | ~~Evaluate whether `customSelectors` should also strip Expressive Code UI elements~~ | ~~Low~~ | ~~S~~ | ~~Quality~~ |
| ~~48~~ **Won't implement — never added; the only documented dismissal is minimatch ( `pnpm-workspace.yaml:17` ).** | ~~Add an audit ignore-list policy section to SECURITY.md~~ | ~~Medium~~ | ~~S~~ | ~~Security~~ |
| ~~49~~ **NOT-DO — moot — the `braces` advisory no longer fires ( website audit clean 2026-11-20 ).** | ~~Track upstream `micromatch`/`braces` remediation and remove any dismissal once fixed~~ | ~~Medium~~ | ~~S~~ | ~~Security~~ |
| ~~50~~ done — deployed, verified, recorded ( `website/IMPROVEMENTS.md:7` ) | ~~Deploy, verify, then record the live state in IMPROVEMENTS~~ | ~~High~~ | ~~S~~ | ~~Ops~~ |

---

## 8. g) Questions I cannot answer myself

~~1. **Advisory policy:** should the unpatchable `braces` advisory be accepted with a documented `auditConfig.ignoreGhsas` dismissal (build-time only, trusted globs), or should we drop `starlight-llms-txt` until upstream resolves it? I can implement either, but the risk acceptance is yours.~~ **NOT-DO — moot — website audit clean; the advisory no longer fires ( 2026-11-20 ).**
~~2. **Entrypoint contract:** do you want `/llms.txt` to keep the previous per-page index (titles, URLs, descriptions), or is the plugin's doc-sets-only entrypoint acceptable? The old behavior was richer; the new one follows the plugin's opinion.~~ **Won't implement — the plugin's sets-only entrypoint stands ( `website/dist/llms.txt` ).**
~~3. **Deploy authorization:** should I deploy and push now (`nix run .#deploy-website`), or leave everything local for your review first?~~ done — deployed the same evening 2026-10-23 ( `website/IMPROVEMENTS.md:7` )

---

## 9. Evidence index

- Plugin config: `website/astro.config.mjs:4`, `:63-90`
- Dependency: `website/package.json:48`, `:54`
- Removed routes: `website/src/pages/` (only `index.astro`, `og/`, `rss.xml.ts`, `search.astro` remain)
- Required artifacts: `website/scripts/check-links.mjs:89`
- Memory: `AGENTS.md:213`
- Commits: `6242dfb1` (config + route removal + link checker), `7b680f3b` (TypeScript restore + lockfile), `6e4d47c8` (AGENTS)
- Advisory: GHSA-vfj7-8cjw-p6xm, `braces <= 3.0.3`, via `website > starlight-llms-txt > micromatch > braces`
- Anchor noise: 106 occurrences in `llms-full.txt`, 43 in `llms-small.txt`
