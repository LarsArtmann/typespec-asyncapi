# Status Report: `starlight-llms-txt` integration

**Date:** 2026-10-23 14:13
**Scope:** this session only (LLM endpoint request -> plugin evaluation -> adoption -> verification)
**Overall state:** implemented locally, all local gates green, **not deployed, not pushed, not CI-verified**
**Working tree:** clean (auto-commit daemon committed every change)

---

## 0. Session verdict

| Metric | Value |
| --- | --- |
| Requested work | Add an LLM endpoint to the website |
| Delivered | 3 generated endpoints (`/llms.txt`, `/llms-full.txt`, `/llms-small.txt`) via `starlight-llms-txt@^0.12.0` |
| Local website gate | PASS (22 pages, 778 internal refs, CSP 22/22) |
| Local root `verify` | PASS (1275 tests, 105 files, 97.9% avg coverage, 0 clones) |
| Frozen-lockfile install | PASS |
| Security audit | **FAIL: 1 high advisory introduced, no patch available** |
| Deployed | NO |
| Pushed / CI | NO |

Artifacts produced by the last build:

| File | Size |
| --- | --- |
| `website/dist/llms.txt` | 1,126 B |
| `website/dist/llms-full.txt` | 75,626 B |
| `website/dist/llms-small.txt` | 64,622 B |

Documentation pages in the collection: 20 (19 real docs + `404.md`).

---

## 1. The three questions, answered honestly

### 1.1 What did I forget?

1. **I forgot to run `pnpm audit` while adding the dependency.** I only ran it at report time and discovered a new high-severity advisory (`braces` <= 3.0.3, GHSA-vfj7-8cjw-p6xm, no patched version) pulled in through `starlight-llms-txt > micromatch > braces`.
2. **I forgot the old `/llms.txt` contract.** The hand-rolled endpoint listed every documentation page with title, URL, and description. The plugin's `/llms.txt` only links the doc sets. That is a functional regression I did not anticipate or call out when recommending the switch.
3. **I forgot that `astro build` is not idempotent here.** Running the website gate against an existing `dist/` failed with `ERR_MODULE_NOT_FOUND ... dist/.prerender/chunks/rss_*.mjs`. I worked around it by trashing `dist` and `.astro`, but did not fix the script.
4. **I forgot UI chrome leaks into the generated corpus.** `llms-full.txt` contains 106 `[Section titled ...]` anchor lines, and `llms-small.txt` contains 43. These come from Starlight's `<a class="sl-anchor-link">` elements and are pure noise for an LLM.
5. **I forgot `pnpm run check-examples`.** It is a CI gate after the website check, and my root TypeScript restore changed the toolchain.
6. **I forgot to verify `node_modules` against the lockfile before trusting gates.** `pnpm list` reported TypeScript 7.0.2 while the lockfile said 6.0.3; only `pnpm install --force` relinked it.
7. **I forgot to update `website/README.md` and `website/IMPROVEMENTS.md`.** `README.md` still says `src/pages` contains "llms.txt endpoints" and lists only two required llms artifacts.
8. **I forgot to decide what to do about the 404 page in `llms-full.txt`.** I documented the limitation instead of solving or escalating it.
9. **I forgot to diff old vs new LLM output before declaring success.** A simple diff would have surfaced both the lost page index and the anchor noise.

### 1.2 What could I have done better?

1. **Inspect the lockfile diff immediately after install.** `pnpm add` re-resolved unrelated entries (root `eslint` 10.12.0 -> 10.13.0, `jscpd` 5.4.1 -> 5.4.2, website `typescript` 6.0.3 -> 7.0.2). The manifest changes were pre-existing, but the stale lockfile had been hiding them; my install made them real.
2. **Pin TypeScript before installing anything.** `astro check` refuses TS 7, so the website's `^7.0.2` range was a landmine. Exact `6.0.3` is the correct pin and should have been step zero.
3. **Avoid `pnpm install --lockfile-only` mid-task.** It left pnpm's metadata inconsistent with `node_modules`, which caused the `--force` reinstall detour.
4. **Verify plugin output semantically, not just structurally.** I checked that three files existed and looked at the headers; I did not audit the body for regressions, duplicated headings, or lost index entries.
5. **Add a content assertion to the gate in the same change.** "File exists" is a weak check for a generated corpus.
6. **Clean `dist`/`.astro` before the first gate run.** One failed gate run and one stack-trace investigation were avoidable.
7. **Keep the change set tightly scoped.** The root TypeScript restore was necessary, but it belongs in a separate commit with its own rationale, not bundled into a website feature.
8. **Run audit and `check-examples` as part of the definition of done.**

### 1.3 What could I still improve?

1. **Fix the anchor-link noise** with `customSelectors: { all: [".sl-anchor-link"] }` and re-verify sizes.
2. **Restore a per-page index** in the LLM entrypoint (a separate generated `llms-index.txt`, or `customSets` per section).
3. **Make the gate idempotent** by cleaning `dist`/`.astro` in `check` (using `trash`, not `rm`).
4. **Add `check:llms`** that asserts presence, non-trivial size, ordering, absence of `404` from `llms-small.txt`, and resolvable doc links.
5. **Extend `check-links.mjs`** to validate Markdown links inside the `.txt` artifacts, not just HTML `href`/`src`.
6. **Decide the security posture** for the unpatchable `braces` advisory (documented dismissal with `auditConfig.ignoreGhsas`, or remove/block the plugin).
7. **Update README and IMPROVEMENTS**, and add the plugin to the website architecture notes.
8. **Deploy and verify live** after approval.
9. **Run `check-examples` and CI** with the final dependency graph.
10. **Add an audit step to CI or the release checklist** so this class of regression is caught automatically.

---

## 2. a) FULLY DONE

| # | Item | Evidence |
| --- | --- | --- |
| 1 | Evaluated both candidate Astro plugins and selected the maintained one | `starlight-llms-txt` 0.12.0 (peer `astro ^7.0.0`, `starlight >=0.41.0`) matches our `astro ^7.4.2` / `starlight ^0.42.6`; `astro-llms-txt` 0.0.1-beta needs Astro 5 and has empty options |
| 2 | Installed the plugin as a website dependency | `website/package.json:48` (`^0.12.0`), committed in `9cd4033d` |
| 3 | Wired the plugin with project description, details, optional links, ordering, and 404 handling | `website/astro.config.mjs:4`, `:63-90` |
| 4 | Removed the hand-rolled routes that would shadow injected routes | `src/pages/llms.txt.ts` and `src/pages/llms-full.txt.ts` deleted in `6242dfb1` |
| 5 | Generated all three endpoints from Starlight content | `dist/llms.txt`, `dist/llms-full.txt`, `dist/llms-small.txt` with sizes above |
| 6 | Added `llms-small.txt` to the required-artifact list | `website/scripts/check-links.mjs:89` |
| 7 | Documented the plugin, the routing collision hazard, and the 404 limitation | `AGENTS.md:213`, committed in `6e4d47c8` |
| 8 | Website gate passes | `astro check` 0 errors, 22 pages built, `html-validate` clean, 778 internal refs valid, CSP 22/22 |
| 9 | Root `verify` passes | 1275 tests, 105 files, 4799 assertions, coverage 97.9% average (min 75% per file), 0 clones |
| 10 | Frozen-lockfile install passes | `pnpm install --frozen-lockfile` reports "Lockfile is up to date" |
| 11 | Website TypeScript drift repaired | exact `6.0.3` in `website/package.json:54`; `astro check` works again |
| 12 | Root TypeScript restored to the documented 6.x line | root `package.json:134` now `6.0.3`; `eslint` and `tsc` both run again |
| 13 | Committed state | `6242dfb1`, `7b680f3b`, `6e4d47c8`; working tree clean |

Note on commits: the auto-commit daemon produced these commits, so file groupings are heuristic and several unrelated files landed together.

---

## 3. b) PARTIALLY DONE

| # | Item | Works now | Still open | Effort |
| --- | --- | --- | --- | --- |
| 1 | LLM endpoints in production | Built and locally verified | Not deployed, not pushed, no live check | S |
| 2 | `/llms.txt` entrypoint quality | Links small/full sets, description, optional links | Lost the previous per-page index (title + URL + description for all 19 docs) | M |
| 3 | 404 exclusion | Absent from `llms-small.txt`; demoted to the tail of `llms-full.txt` | Plugin has no full-file exclusion; 404 page still pollutes the full corpus | M |
| 4 | Build reproducibility | `trash dist .astro` then build works | `pnpm run check` fails if `dist/` already exists; no clean step in scripts | S |
| 5 | Dependency security | Advisory identified and scoped (build-time only) | No dismissal, no mitigation, no CI gate; audit not in verify | S |
| 6 | Verification breadth | Website check + root verify green | `check-examples` not run; CI not run | M |
| 7 | Documentation | `AGENTS.md` updated | `website/README.md` and `website/IMPROVEMENTS.md` still describe the old setup | S |
| 8 | Corpus quality | Content is MDX-aware and page descriptions are included | 106 (full) / 43 (small) `Section titled` anchor lines leak as noise | S |
| 9 | Toolchain hygiene | Versions now consistent with manifests | `pnpm peers check` never run; TypeScript 7 drift can recur via Dependabot | S |

---

## 4. c) NOT STARTED

| # | Item | Why not started | Still wanted? |
| --- | --- | --- | --- |
| 1 | Deploy (`nix run .#deploy-website`) | Not authorized in this session | Yes, after review |
| 2 | Push / CI validation | No explicit request | Yes |
| 3 | `pnpm run check-examples` | Ran out of scope after root TS restore | Yes |
| 4 | `check:llms` content test | Not planned during implementation | Yes |
| 5 | Markdown link validation inside `.txt` artifacts | Not planned | Yes |
| 6 | Clean-before-build in the `check` script | Discovered too late | Yes |
| 7 | Audit dismissal record or plugin removal decision | Needs a risk decision | Yes |
| 8 | `customSets` (for example a Getting Started subset) | Not requested | Optional |
| 9 | Per-page index endpoint | Discovered as a regression at report time | Yes, if consumers want it |
| 10 | README / IMPROVEMENTS updates | Deprioritized | Yes |
| 11 | Live post-deploy verification of the three endpoints | Blocked on deploy | Yes |
| 12 | Upstream issue for full-file `exclude` support | Not filed | Optional |
| 13 | `pnpm peers check` triage | Not run | Yes |
| 14 | Automated audit in CI | Not planned | Yes |

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

| # | Practice | Impact | Suggested fix |
| --- | --- | --- | --- |
| 1 | Dependency additions skip security review | High | Add `pnpm audit` to the checklist for any `pnpm add`, and to CI |
| 2 | "Build succeeded" is treated as "output is correct" | High | Diff generated artifacts against the previous version; assert structure and content |
| 3 | Text artifacts are not gated | High | Add `check:llms` with structural assertions and link resolution |
| 4 | Build scripts assume a clean tree | High | Make `check` clean the build cache first (use `trash`, never `rm`) |
| 5 | Lockfile diffs are not reviewed | Medium | Require a lockfile summary in the change description |
| 6 | Toolchain drift is repaired ad hoc | Medium | Keep exact pins (`typescript`) and add Dependabot major-version ignore |
| 7 | Plugin output is trusted without inspecting the converter | Medium | Check for UI chrome (anchors, TOC, pagination) after adoption |
| 8 | Docs describe old structure | Medium | Update README/IMPROVEMENTS in the same change |
| 9 | Unpatchable advisories have no documented policy | Medium | Either dismiss with justification or block the dependency |
| 10 | Website scripts have no automated tests | Medium | Add `node:test` cases for `check-links`, `check-csp`, and a new `check-llms` |
| 11 | Install workflows can leave `node_modules` inconsistent | Medium | Prefer `pnpm add --filter`; verify with `pnpm list` + `--frozen-lockfile`; avoid `--lockfile-only` |
| 12 | Scope discipline | Low | Keep website feature, toolchain repair, and formatting in separate commits |

---

## 7. f) Up to 50 things to get done next

Impact: Critical / High / Medium / Low. Effort: S (<30 min) / M (30 min to 2 h) / L (>2 h).

| # | Task | Impact | Effort | Category |
| --- | --- | --- | --- | --- |
| 1 | Decide the `braces` advisory policy: documented `auditConfig.ignoreGhsas` dismissal or remove the plugin | Critical | S | Security |
| 2 | Add `customSelectors: { all: [".sl-anchor-link"] }` and rebuild | High | S | Quality |
| 3 | Add `check:llms` asserting 3 files, non-zero size, ordering, docs present, no 404 in `llms-small.txt` | High | M | Quality |
| 4 | Make `pnpm run check` clean `dist`/`.astro` first (via `trash`) | High | S | Quality |
| 5 | Validate Markdown links inside `.txt` artifacts in `check-links.mjs` | High | M | Quality |
| 6 | Run `pnpm run check-examples` against the restored toolchain | High | M | Quality |
| 7 | Deploy with `nix run .#deploy-website` after approval | High | S | Ops |
| 8 | Verify live `/llms.txt`, `/llms-full.txt`, `/llms-small.txt` return 200 with `text/plain` | High | S | Ops |
| 9 | Add `pnpm audit` to CI (or a scheduled job) | High | M | Security |
| 10 | Restore a per-page documentation index in the LLM entrypoint if consumers need it | High | M | Feature |
| 11 | Update `website/README.md`: remove "pages/ llms.txt endpoints", document plugin generation | Medium | S | Docs |
| 12 | Update `website/IMPROVEMENTS.md` (mark plugin adoption, note 404 caveat) | Medium | S | Docs |
| 13 | Move the 404 page out of the `docs` collection (`src/pages/404.astro`) if full-corpus cleanliness matters | Medium | M | Refactor |
| 14 | File an upstream issue for full-file `exclude` support in `starlight-llms-txt` | Medium | S | Upstream |
| 15 | Add a `customSets` entry for Getting Started (small-context subset) | Low | M | Feature |
| 16 | Add `optionalLinks` for the changelog and security policy | Low | S | Docs |
| 17 | Add a size budget assertion for `llms-full.txt` and `llms-small.txt` | Low | S | Quality |
| 18 | Add a test for `promote`/`demote` ordering | Low | S | Quality |
| 19 | Assert `llms-small.txt` is smaller than `llms-full.txt` | Low | S | Quality |
| 20 | Assert response `Content-Type` for the three endpoints | Low | S | Quality |
| 21 | Audit generated output for other sites' chrome (TOC, pagination, feedback widgets) | Medium | S | Quality |
| 22 | Add a Dependabot ignore rule for TypeScript major bumps on `website/` | High | S | Quality |
| 23 | Add a CI guard that `website` resolves TypeScript 6.x | Medium | S | Quality |
| 24 | Run `pnpm peers check` and triage the reported peers | Medium | S | Quality |
| 25 | Review whether `starlight-llms-txt` 0.x upgrades should be grouped in Dependabot | Low | S | Ops |
| 26 | Re-check `pnpm-lock.yaml` diff discipline in future dependency PRs | Medium | S | Process |
| 27 | Add the plugin and its constraints to the website architecture section of README | Medium | S | Docs |
| 28 | Add a post-deploy smoke checklist for LLM endpoints | Medium | S | Ops |
| 29 | Verify `llms.txt` optional links and set links after deploy | Medium | S | Ops |
| 30 | Confirm `disable404Route` still holds with the new routes | Low | S | Quality |
| 31 | Confirm `/_llms-txt/[slug].txt` emits nothing when `customSets` is empty | Low | S | Quality |
| 32 | Evaluate whether `rawContent: true` is preferable for our `.md`-only docs | Low | S | Feature |
| 33 | Add a `node:test` harness for website scripts | Medium | M | Quality |
| 34 | Add a test for the 404 page's exclusion from `llms-small.txt` | Medium | S | Quality |
| 35 | Add a test that all 19 docs appear in `llms-full.txt` | High | S | Quality |
| 36 | Add a test that every doc URL in `llms.txt` resolves | Medium | S | Quality |
| 37 | Add a note to AGENTS about the `sl-anchor-link` noise and its selector fix (after applying) | Low | S | Docs |
| 38 | Split future toolchain repairs into their own commit | Low | S | Process |
| 39 | Add an explicit "definition of done" checklist for dependency additions | Medium | S | Process |
| 40 | Confirm the new dev-only dependency adds nothing to the client bundle | Low | S | Quality |
| 41 | Consider immutable caching for `llms-*.txt` versus the current 1-hour TTL | Low | S | Ops |
| 42 | Check the deployed files against Google/Firebase compression behavior | Low | S | Ops |
| 43 | Add a `docs/status` cross-link from IMPROVEMENTS item 86 to this report | Low | S | Docs |
| 44 | Verify the website gate on a truly clean clone (CI simulation) | Medium | S | Quality |
| 45 | Re-run root `verify` after `check-examples` and any selector change | Medium | M | Quality |
| 46 | Add an `llms` section to the website README script table | Medium | S | Docs |
| 47 | Evaluate whether `customSelectors` should also strip Expressive Code UI elements | Low | S | Quality |
| 48 | Add an audit ignore-list policy section to SECURITY.md | Medium | S | Security |
| 49 | Track upstream `micromatch`/`braces` remediation and remove any dismissal once fixed | Medium | S | Security |
| 50 | Deploy, verify, then record the live state in IMPROVEMENTS | High | S | Ops |

---

## 8. g) Questions I cannot answer myself

1. **Advisory policy:** should the unpatchable `braces` advisory be accepted with a documented `auditConfig.ignoreGhsas` dismissal (build-time only, trusted globs), or should we drop `starlight-llms-txt` until upstream resolves it? I can implement either, but the risk acceptance is yours.
2. **Entrypoint contract:** do you want `/llms.txt` to keep the previous per-page index (titles, URLs, descriptions), or is the plugin's doc-sets-only entrypoint acceptable? The old behavior was richer; the new one follows the plugin's opinion.
3. **Deploy authorization:** should I deploy and push now (`nix run .#deploy-website`), or leave everything local for your review first?

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
