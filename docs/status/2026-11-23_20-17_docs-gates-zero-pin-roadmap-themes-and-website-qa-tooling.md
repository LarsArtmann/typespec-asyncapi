# Status — Docs Gates at Zero, ROADMAP Themes Execution, Website QA Tooling

**Date:** 2026-11-23 20:17 CET
**Branch:** `master`, pushed through `8ffa62fa`
**Scope:** this session only — the SUPERB plan execution (C1-C21): restore the two red docs gates, drain the harvest backlog, execute the ROADMAP Themes cluster, and wire the website QA tooling.
**Backlog basis:** `docs/planning/2026-11-22_20-26_SUPERB-docs-gates-green-and-corpus-backlog.md`, the 2026-11-19/20 corpus sweep state, and the `docs-gates run` verdict matrix at session start (annotate FAIL, cadence FAIL, everything else green).

---

## Verdict matrix at session end

| Gate | Start of session | End of session |
| --- | --- | --- |
| freshness | PASS | PASS |
| audit-all | PASS (4 ≤ pin 11) | PASS (0, pin at **0**) |
| annotate | **FAIL** | PASS |
| routing | PASS | PASS |
| cadence | **FAIL** (18 unarchived) | PASS (15/15 ARCHIVE-HEALTHY) |
| stub/citations/stamps/vocabulary/agents | PASS | PASS |
| root `pnpm run verify` | not run this session | **rc=0** (1358 tests, 117 files, 0 clones, coverage healthy) |

---

## a) FULLY DONE

1. **C1 — annotate gate green.** Scanned all 43 code spans on the release-history line (AGENTS.md:203): exactly ONE genuine glued adjacency (`` `npm pack`s ``), reworded spacing-only to "runs `npm pack` on the EXACT published tarball" (zero factual changes). The same example text lived in the plan file (lines 11, 22) and was reworded there too. `docs-gates annotate .` → CLEAN.
2. **C2 — all three 2026-11-02 reports archived.** Research via two read-only subagents (verdicts-1016: 91 items; verdicts-1114: 104 items) plus coordinator work on 12-09 (77 items + §a results ledger). Every file passed `check-rows --strict` + `bare-rows` BEFORE `git mv`, carries a `> **Live remainder:** none —` banner, and resolves its §7 decision questions inline (blob carried in history; real compiler shipped as the playground in `0f9ef3ae`; horizontal lockup in the hero; stable-name cache header in `7f9bdba6`). `docs-gates cadence .` → 15/15 ARCHIVE-HEALTHY, oldest retained now 20d (2026-11-03).
3. **C3 — origin CI verified** green on the swept tree (run 45121557438, success).
4. **C4+C5 — audit-all drained to a ZERO pin.** The 4 residual open items (npmrc token line, dual-emitter AJV test, writer-claims protocol, dense-prose review) got 3 new TODO_LIST rows + 1 route to the existing Test-Suite row, then routed markers in the two reports. `freshness --audit-all` → 0 unharvested. `.docs-gates.json` ratcheted 11 → 4 → **0** (never upward).
5. **C6 — diagnostic-count lock test** (`test/unit/diagnostic-count.test.ts`): total, severity split, uniqueness/shape. It proved itself twice within the session by catching the 38→39 and 39→40 registry growths.
6. **C7 — dead `messageSchemas` removed** from `src/lib.ts` (state + symbol); zero references; build clean.
7. **C8 — coverage flake wrapper** (`scripts/coverage-run.ts`): summary-contract check (exit 0 + `N pass` + 0 fail + `Ran` line), 3 attempts, per-attempt logs under `coverage/flake-logs/`, `import.meta.main` guard, wired as `test:coverage`. Self-test catches crash/no-summary, masked fail-count, zero-pass. It earned its keep the same day by catching a real failure (see d6).
8. **C13 — multi-format message payloads, spec-true.** `@message` gains a raw `payload` passthrough; `schemaFormat` now emits the official 3.1 **Multi Format Schema Object** wrapper (`{ schemaFormat, schema }`) — the previous message-level `schemaFormat` placement was **rejected by the official schema** (AJV oneOf, verified against `@asyncapi/specs` 3.1.0 `multiFormatSchema.json`). Compliance + integration tests updated and AJV-validated.
9. **C14 — reusable servers (31st decorator).** `@reusableServer(name, config)` on Namespace → `components.servers`; `@useChannelServer` resolves names against `components.servers` FIRST (spec-true `#/components/servers/{name}` targets) with root-server fallback. Shared `buildServerObject`/`validateServerArgs`/`buildServerConfigEntry` extraction kept `@server` behavior identical. Two compliance tests.
10. **C15 — `@correlationId` on Operations.** Operation target applies the correlation to every referenced message (resolved through the `#/channels/{ch}/messages/{key}` → `#/components/messages/{name}` chain); explicit model-level config wins. New diagnostic `invalid-operation-correlationId-config` (39 codes: 23 error + 16 warning at this point); lock test updated.
11. **C16 — defaultContentType MIME validation locked.** The validation already existed (`invalid-default-content-type`); added the missing negative test (rejection) + parameters-acceptance test. 6/6.
12. **C17 — `@externalDocs` (32nd decorator).** Operation → `operation.externalDocs`, Model → `message.externalDocs`, Namespace → **`info.externalDocs`** (the 3.1 root has NO externalDocs — initially mis-assumed, caught by AJV, remapped). Non-absolute URLs warn (`invalid-external-docs-config`, 40 codes: 23 error + 17 warning) and are skipped. Extracted to `src/external-docs-decorator.ts` (max-lines).
13. **ROADMAP Themes §1: five ideas marked SHIPPED** with dates (multi-format schemas, reusable servers, correlationId-on-operations, defaultContentType validation, externalDocs). The remaining §1 idea (`@messageId` with publish) stays raw.
14. **C18 — generated references** (subagent rafael): `scripts/generate-references.ts` (parses `lib/main.tsp` externs, `src/lib.ts` diagnostics, `src/infrastructure/configuration/asyncAPIEmitterOptions.ts`) renders `/reference/decorators` (32 rows), `/reference/diagnostics` (40 rows — the old hand-written page claimed 38, the exact drift this kills), `/reference/emitter-options` (7 options). `references:generate` / `references:check` scripts; drift test `test/unit/generated-references.test.ts` (4/4); output is byte-deterministic AND dprint-stable; sidebar entry added; `scripts/generated-files.ts` extracted so brand + references share one check/write discipline (verified against both).
15. **C19 — deploy workflow draft** (`.github/workflows/deploy-website.yml`): `workflow_dispatch`-only, secret guard with actionable error, root build → website build → `firebase-tools@14.11.0` deploy → live header/content smoke. INERT until Lars decides (header comment lists the three decision points).
16. **C20 — CONTRIBUTING.md rewritten** for the pnpm + Vitest era: Nix devShell setup, full command table, build-before-test policy, coverage wrapper, golden regeneration, diagnostics-count rule, updated structure (builders/, shared/, scripts/), PR checklist.
17. **C9 — axe-core audit: 0 violations.** `website/scripts/axe-audit.mjs` (jsdom + axe-core script injection, WCAG 2.1 A/AA) over all **22 built pages → 0 rule violations, 0 nodes**. `audit:a11y` script added; axe-core + jsdom added as website devDeps.
18. **C12 — JSON-LD shipped (main scope).** FAQPage (12 real Q&As) on `/faq/`, HowTo (4 steps) on `/getting-started/quick-start/`, both via Starlight frontmatter `head` script tags, verified present in the built HTML after rebuild.
19. **Corpus/living-doc maintenance:** CHANGELOG Unreleased gained an Added section (8 bullets); TODO_LIST axe row closed, Lighthouse/Playwright/JSON-LD rows narrowed to their honest remainders; AGENTS.md gained the fontsource-IPv6 build flake note and the QA-tooling note.

## b) PARTIALLY DONE

1. **C10 — Lighthouse budgets.** `website/lighthouserc.json` + `lighthouse.yml` wired, but ALL assertions are **warn-only** and UNCALIBRATED: this environment has no Chrome (blocked commands; NixOS), so the first real numbers must come from CI. The TODO row narrowed to "calibrate and flip to error".
2. **C11 — Playwright smoke.** Config + 4 specs (landing, search, FAQ JSON-LD, copy button) + `playwright.yml` written, but NOT locally verified: the bundled Chromium downloads on NixOS yet cannot launch (no nix-ld for system libs). The first CI runs failed on infra (see d3/d4); the bun fix is pushed and the newest run was pending at report time.
3. **C12 remainder.** TechArticle + BreadcrumbList JSON-LD NOT shipped (needs a layout-level breadcrumb derivation); the TODO row narrowed to that remaining scope.
4. **Dedupe pass.** jscpd back to **0 clones**, but only after six fix cycles (13 → 5 → 3 → 2 → 0) — see d5.

## c) NOT STARTED

1. **`references:check` is not wired into any CI gate** — the drift test exists, but nothing fails CI when someone edits `lib.ts`/`main.tsp` without regenerating.
2. **axe-audit is not in CI** (manual script only; 0 violations today, but unguarded).
3. **C21 weekly cadence run** — nothing to archive yet (battery green; oldest retained 20d vs 21d threshold), first real run due ~2026-11-24.
4. **Deploy workflow decision** (C19) — awaits Lars; the draft is inert.
5. **All remaining TODO_LIST rows** drained this session are recorded but untouched: live-headers script, hero contract tests, website README hero rule, exclude-tripwire + tmp-gitignore, video CI install, storyboard 270+, derived test counts, npmrc token cleanup, and the two repo: SKILLS/docs-gates rows.
6. **Playwright coverage of theme cycle + reduced-motion** (the plan's C11 listed five interactions; the shipped specs cover landing/search/JSON-LD/copy).

## d) TOTALLY FUCKED UP

1. **Master CI went red three times during this session, all self-inflicted.** (a) 15:52 — the auto-commit daemon swept mid-refactor files into a commit and pushed while I was still editing; CI ran on a broken intermediate state. (b/c) 19:08 + 19:12 — my own final state had `src/state-writers.ts` at **401 lines** (oxlint max-lines 400, `--deny-warnings`), one line over, because I verified the tree BEFORE the last extraction and the daemon's commit captured the post-extraction file. Root cause in all three: **tree-level verification is not push-stable when a daemon commits continuously** — the gate must run on the exact commit being pushed.
2. **Both new QA workflows shipped with two infra bugs each.** I authored `lighthouse.yml` and `playwright.yml` without dry-run-able verification: (1) no root `pnpm run build` before the website build → `Could not resolve ../../dist/src/index.js`; (2) no `oven-sh/setup-bun` step → exit 127 (the root build shells out to bun). ci.yml has both steps and I had read it — I still missed them. CI became the test bench: two extra red pushes before the fixes. The repo's own 12-09 lesson ("assert claims only after the gate ran") applies to workflow files too.
3. **A four-cycle jscpd chase.** The feature work introduced 13 clones; fixing them took six edit rounds (13→5→3→2→0), including a batched python edit whose state-writers mutation silently no-op'ed because an assert failed mid-script AFTER an earlier file in the same batch had been edited — partial application I then had to notice from the clone list. The discipline I state myself (run the gate after EACH mutation) was traded for batching, and it cost more than it saved. The formatter also re-cloned my fixes twice (dprint re-wrapping identical alias shapes; an import block made identical by adding `Program`) — the AGENTS.md "import blocks can clone too" precedent, re-learned hands-on.
4. **Unverified spec assumptions cost redesigns.** The multi-format feature was first built emitting message-level `schemaFormat` (the OLD behavior, provably spec-invalid); and `@externalDocs`' Namespace target first mapped to the document root (the 3.1 root has no externalDocs). Both were caught by the compliance gate — good — but reading the official schema FIRST (`multiFormatSchema.json`, root properties) would have avoided two redesign cycles.
5. **The Playwright spec file leaked into coverage discovery.** bun test sweeps all `*.spec.ts` from the root, so `website/tests/e2e/smoke.spec.ts` failed the coverage gate three attempts in a row ("Playwright Test did not expect test() to be called here") before I scoped the runner to `test/`. Adding a NEW test-file convention without checking every test runner's discovery boundary was the miss. On the plus side: the C8 wrapper turned what would have been a confusing CI failure into a captured, greppable log.
6. **The two hand-written reference pages lost their og:image frontmatter** when the generator overwrote them; `apply-og-frontmatter.mjs` is wired into nothing, so nothing restored it. Social-card metadata for `/reference/diagnostics` and `/reference/emitter-options` is degraded until the generator learns OG tags or the script is wired.

## e) WHAT WE SHOULD IMPROVE

1. **Verify the commit, not the tree.** Before every push: `git stash` nothing — run the quick gates (lint + duplicate) on the exact HEAD the daemon just committed, then push. Better: an owner decision to make the daemon commit-only during work sessions.
2. **A workflow-authoring template.** Every new workflow that runs pnpm scripts should copy ci.yml's full step set (checkout → pnpm → node 24 → **bun** → frozen install → root build) verbatim. Both of today's bugs were omissions of steps ci.yml already has.
3. **jscpd-first development.** `pnpm run duplicate` runs in ~10ms — run it right after adding builder/decorator code instead of discovering clones at the end of the full verify.
4. **Read the official spec schema before implementing spec-shaped features.** Both redesigns today (multi-format wrapper, root-vs-info externalDocs) were avoidable with a five-minute schema read.
5. **Static a11y auditing is a floor, not a ceiling.** jsdom+axe cannot see focus management or keyboard traps in the live playground; the Playwright suite should own interaction-level a11y once it runs green.
6. **Generators must own ALL metadata of the pages they emit** (frontmatter included) — otherwise byte-checks and OG tags fight.
7. **Sequence archive rituals before citing their paths.** One research verdict cited the pre-archive path of 12-09; the fix was trivial but the ordering rule (archive-dependent references resolved AFTER `git mv`) should be mechanical.

## f) UP TO 50 THINGS TO GET DONE NEXT

Ranked roughly by importance × impact ÷ effort. Items 1-3 are the red-window cleanup.

| # | Task | Why |
| --- | --- | --- |
| 1 | Confirm CI + Playwright + Lighthouse green on `8ffa62fa` (runs were pending; GitHub API was unreachable at report time) | master must end the session green |
| 2 | Verify the ci-alert tracking issue auto-closed after the green CI run | the 15:52 red run opened it |
| 3 | Fix the Playwright run's results-receiver upload failure (retry passed? or disable report upload) | the 16:28 failure was an upload error, not tests |
| 4 | Calibrate Lighthouse budgets from the first real CI scores; flip warn → error | the whole point of C10 |
| 5 | Wire `references:check` into CI (root verify or website gate) | generated pages can currently drift silently |
| 6 | Wire `audit:a11y` into CI as a non-blocking check, then blocking once stable | today's 0-violations baseline is unguarded |
| 7 | Restore og:image frontmatter for the two overwritten reference pages (fold OG tags into the generator) | social cards degraded |
| 8 | Pin `@lhci/cli` to an exact version (0.15.x floats) | repo discipline is SHA-pinned actions |
| 9 | Deploy workflow decision (Lars): auto-deploy on master vs dispatch-only; create FIREBASE_SERVICE_ACCOUNT; optional production environment | C19 is inert without it |
| 10 | TechArticle + BreadcrumbList JSON-LD (breadcrumb derivation in a Head override) | remaining C12 scope |
| 11 | Playwright: add theme-cycle + reduced-motion specs | plan's C11 listed five interactions |
| 12 | Playwright: move the copy assertion to a mocked-clipboard readback (closes TODO row 305) | current spec only clicks |
| 13 | Playwright: overlay-editor check in Safari/Firefox WebKit/Gecko projects | existing TODO row |
| 14 | Make the website build resilient to the fontsource IPv6 flake (set `--dns-result-order=ipv4first` in the build script itself) | bit me twice today |
| 15 | Storyboard 270+ copy + 04-receipt counter refresh (+ the 30-decorators chip is now 32) | minted TODO row |
| 16 | Replace typed FEATURES/ROADMAP test counts (1275) with a derived stat | minted TODO row; counts are stale |
| 17 | `scripts/check-live-headers.mjs` (status + Cache-Control + content marker per URL class) wired as the final deploy step | minted TODO row R1 |
| 18 | Hero contract tests: adversarial highlighter fixtures + `data-copy-target` equals `heroAsyncAPI` | minted TODO row R4 |
| 19 | Document the hero-fixture rule in website/README | minted TODO row R7 |
| 20 | CI tripwire for `minimumReleaseAgeExclude` + `.gitignore tmp-*.test.ts` | minted TODO row R5 |
| 21 | `website/video` CI install job (`npm ci` + audit) | standing gap; existing row |
| 22 | Clean the dead `~/.npmrc` token line on the local machine | minted TODO row |
| 23 | Writer-claims protocol in the SKILLS sweep template (repo: SKILLS) | minted TODO row |
| 24 | Dense-line mode follow-up in docs-gates (repo: SKILLS) | minted TODO row |
| 25 | Dual-emitter AJV integration test (both emitters, one program) | existing Test-Suite row |
| 26 | Property-suite breadth: unions of models, inheritance, generics, channel params | existing row |
| 27 | Negative-proof pass for e2e + P7/P8 (mutate one expectation, see red) | existing row |
| 28 | Intrinsic-output hardening goldens (unknown/nullable unions, never/void, AJV negative `type: null`) | existing row |
| 29 | Type-mapping tests for `Status[]`, `Map<T>`, `Set<T>` | existing row |
| 30 | End-to-end test importing `./shared` from built dist via the exports map | existing row |
| 31 | Extend the mixed-ownership property suite to the http-route fallback | existing row |
| 32 | Order-asserting P8 variant (or document sorted-by-design) | existing row |
| 33 | Coverage-average trend capture (wrapper logs per run; add a trend record) | 96.9% and drifting; existing row |
| 34 | `@messageId` with publish (the last unshipped §1 theme idea) | ROADMAP |
| 35 | Reactive streaming patterns theme (SSE, WS subprotocol, Kafka rebalance) | ROADMAP |
| 36 | Mixed-program strictness 2.0 (namespace-geometry fallback removal, tracked by `bare-op-inference-deprecated`) | ROADMAP |
| 37 | Docs-entropy CI guard theme (count drift guard — partially covered by today's locks) | ROADMAP |
| 38 | Upstream watch microsoft/typespec#12105 | ROADMAP |
| 39 | Playground UX cluster: share-permalink, engine retry, byte-size progress, fifth failing example, unsupported-stdlib explainer, decorator-diff affordance | minted ROADMAP §6 row |
| 40 | Verify the three reference pages appear in llms.txt sets correctly | starlight-llms-txt should pick them up |
| 41 | Add the QA tooling section (axe/playwright/lighthouse commands) to CONTRIBUTING | CONTRIBUTING was rewritten before they landed |
| 42 | Regenerate the website changelog page on the next release (it copies CHANGELOG) | Added section is new |
| 43 | Decide whether axe-audit should exit 1 (block) in CI | today it is report-only |
| 44 | Add an a11y statement page (0-violations baseline + contact) | cheap trust artifact |
| 45 | Confirm Dependabot sees the new website devDeps (axe-core, jsdom, playwright) with the lockfile in sync | new deps today |
| 46 | Purge/ignore `jscpd-report/` + `coverage/flake-logs/` working-tree artifacts if not already ignored | hygiene check |
| 47 | Diagnostics reference page: group or column the severity split (23/17) | readability |
| 48 | Emitter-options generator: cover the object forms (`file-type`) in the description column | generator currently lists 7 flat options |
| 49 | `getVersionedApiVersion` + version precedence: add a compliance test for the three-source precedence order | undocumented edge in document-builder |
| 50 | Repeat C21 weekly cadence maintenance on ~2026-11-24+ (oldest retained crosses 21d then) | the ritual this whole session restored |

## g) THREE QUESTIONS I CANNOT ANSWER MYSELF

1. **The daemon pushed broken intermediate states to master three times today** (CI red at 15:52, 19:08, 19:12 — twice from my own window, once purely from daemon timing). Do you want the daemon switched to commit-only during work sessions (push reserved for explicit pushes), or should sessions pause it around risky windows? The ci-alert workflow caught each failure, but the window stays open as long as push is automatic.
2. **Deploy automation decision (C19):** the draft workflow is dispatch-only and inert. Do you want auto-deploy on master push (requires creating the `FIREBASE_SERVICE_ACCOUNT` secret and, ideally, a protected "production" environment), or does `nix run .#deploy-website` stay the canonical manual path?
3. **Lighthouse budget policy:** the assertions are warn-only until calibrated. Once the first CI run reports real scores, should I pin those numbers and flip the assertions to error autonomously, or do you want to review the measured scores before they gate?

---

## Verification Log

```bash
$ date "+%Y-%m-%d %H:%M %Z"
2026-11-23 20:17 CET

$ docs-gates run .            → PASS — all ten gates green (freshness, audit-all @ 0,
                                annotate CLEAN, routing, cadence 15/15, stub, citations,
                                stamps, vocabulary, agents)
$ pnpm run verify             → rc=0 (build, eslint+oxlint --deny-warnings, typecheck:test,
                                brand:check, 1358 tests / 117 files, coverage-run healthy,
                                coverage gate 75%/file, jscpd 0 clones)
$ pnpm run references:check   → up to date (3 files)
$ pnpm run brand:check        → up to date (11 files)
$ node website/scripts/axe-audit.mjs → 22 page(s), 0 rule violation(s), 0 node(s)
$ git push origin master      → 8ffa62fa (workflows: setup-bun + root build added)
$ gh run list                 → CI/Playwright/Lighthouse re-triggered; newest runs PENDING
                                (api.github.com unreachable from this shell at report time)
```

**Facts worth carrying forward:**

1. `@asyncapi/specs` 3.1.0 ships a `multiFormatSchema.json` definition: non-JSON payloads are `{ schemaFormat, schema }` WRAPPERS on message payload, and the root document has no `externalDocs` (it lives on `info`). Both facts are now locked by compliance tests.
2. The coverage wrapper (`scripts/coverage-run.ts`) pays rent: its first real catch was the Playwright spec leaking into bun's discovery — a captured log instead of a mystery.

---

## Handoff

Master is pushed through `8ffa62fa` with the docs battery at all-green and the root gate at rc=0 as of the last local run. The three re-triggered CI workflows were pending at report time (GitHub API unreachable from this shell); items 1-3 of §f are the first actions of the next session. The library surface grew additively (32 decorators, 40 diagnostics) under semver — the next release's CHANGELOG section already carries the Added entries.
