# Status Report: Favicon replacement, brand-pipeline extension, double deploy

**Date:** 2026-11-04 17:42 CET
**Session scope:** Production deploy, root-cause of the broken favicon, replacement of the favicon with the shipped compact mark (generator-owned), ADR/AGENTS/brand-README documentation, full gate re-run, redeploy, and post-hoc raster QA of the new favicons.
**Companion request:** brutal self-review (what was forgotten / done better / still improvable) folded into sections (d)/(e) and the explicit answers below.

---

## Scope line — what this report VERIFIED vs did NOT verify

**VERIFIED (fresh command output this session):**

| Claim | Verified via |
| --- | --- |
| Deploy #1 + #2 succeeded | `nix run .#deploy-website` output: build complete, 798 links valid, CSP 22/22, `release complete`, 113 → 114 files |
| Live favicon is the new mark | `fetch https://typespec-asyncapi.lars.software/favicon.svg` returned the generated `taaFavicon*` SVG |
| Brand artifacts consistent | `pnpm run brand:check` → `brand assets up to date (11 files)` |
| oxlint clean | `pnpm run lint:ox` → 331 files, no findings |
| Formatting clean | `nix fmt` (1 file auto-fixed) then `nix build .#checks.x86_64-linux.format` → FORMAT_OK; `nix flake check` → "all checks passed!" |
| Website gate green | `pnpm --filter typespec-asyncapi-website run check`: astro check + build, html-validate, 798 internal links, CSP valid on 22 pages |
| 16px / 32px / 192px raster legibility | sharp renders viewed as images this session (see section d, item 3) |
| Manifest wired | `rg 'rel="manifest"'` → `website/src/layouts/LandingLayout.astro:88` |
| Work committed | `git status` clean; daemon commit `a411ff37` ("chore: auto-commit 7 changed file(s)") |

**NOT VERIFIED (and why):**

- **Full `pnpm run verify` was NOT run.** The favicon work touched no `src/` code; I ran the gates that cover the surfaces I changed (brand, oxlint, website, flake). The convention says run the full gate before a *release* — no release happened — but the honest position is: full gate unrun this session.
- **Browser-matrix favicon rendering NOT verified.** I rastered PNGs and looked at them; I did not open Chrome/Firefox/Safari tab bars, bookmarks, or an iOS home screen. 16px renderer output ≠ 16px browser rendering (downscaling algorithms differ).
- **`og.png` (305 KB, Sep 19) and `screenshots/` (empty dir) NOT investigated** — noticed during a `ls`, deliberately not researched per your scope instruction. Flagged, not concluded.
- **Apple-touch-icon / .ico / Safari pinned-tab behavior NOT implemented or tested** — does not exist yet.
- **`nix develop` inside `website/` is BROKEN** (verified failing: `md-go-validator` input requires go ≥ 1.27.1, nixpkgs ships 1.26.8). Root flake devShell works and was used instead. I did not fix the website flake — out of session scope, listed in (f).

---

## Executive summary

You asked "why is the favicon fucked up?" — root cause: `website/public/favicon.svg` was the **legacy Aug-22 teal squircle** that predates the entire brand system. ADR 0002 had it parked as an open decision because the shipped two-tile mark was assumed illegible at 16px and the glyph choice was gated on the unresolved trademark question. You overruled the gate: "How about our fucking new logo?"

The favicon is now the **shipped compact mark itself**, generator-owned like every other brand artifact: `favicon.svg` (mark scaled-to-fit on a transparent 36×36 canvas) and `favicon-maskable.svg` (mark at 35% inside the maskable safe circle over brand ink `#0a0908`). Brand artifacts went 8 → 11; ADR 0002's open question became Decision 6; the site was rebuilt, re-gated, and redeployed twice. Raster QA done in THIS report confirms the 16px legibility claim that was originally shipped claim-by-faith.

---

## a) FULLY DONE

1. **Deploy #1** (pre-favicon tree, `4ba536a6`): build, 798-link check, CSP 22/22, Firebase release complete.
2. **Favicon root-cause diagnosis:** legacy teal squircle identified (file dated Aug 22, gradient id `taa-mark`, zero relation to shipped palette), ADR 0002 open-decision located and quoted.
3. **Favicon replaced with the shipped mark:**
   - `scripts/generate-brand-assets.ts`: new `renderFaviconSvg(maskable)` + `FAVICON_*` constants; reuses `markBody`/`tileAt` primitives so favicon geometry cannot drift from the logo.
   - `website/public/favicon.svg` — mark scaled-to-fit (`translate(0 9) scale(0.5)`), transparent, zero horizontal padding.
   - `website/public/favicon-maskable.svg` — mark at 35% scale centered in the maskable safe circle (half-diagonal 14.09 ≤ 14.4 = 0.4·36) over `#0a0908`.
   - `website/public/manifest.json`: `maskable` entry repointed from `/favicon.svg` (which was a lie — the unpadded file is not maskable-safe) to `/favicon-maskable.svg`.
4. **Brand pipeline integrity:** artifact count 8 → 11, `pnpm run brand:check` byte-gates all eleven; the two favicons are generator outputs, so hand-editing them now fails the gate.
5. **Documentation resolved, not just edited:** ADR 0002 favicon row moved from "Explicitly not decided yet" to **Decision 6 (2026-11-04)** including the accepted tradeoff (glyph detail degrades below ~24px; colour story is the identity at tab size). `AGENTS.md` brand bullet updated (Eleven outputs, favicon clause rewritten from "intentionally unchanged" to decided). `assets/brand/README.md` file table gained both favicon rows with consumers.
6. **Gates:** `brand:check`, `lint:ox` (0 findings), `nix fmt` + format check, full `nix flake check` ("all checks passed!"), website gate (astro check, html-validate, 798 links, CSP) — all green.
7. **Deploy #2 + live verification:** 114 files released; live `/favicon.svg` fetched over HTTP and byte-confirmed as the new mark.
8. **Raster QA (this report):** favicon rendered at 16/32/48px and maskable at 192px via sharp + root-devShell node, and visually inspected: 16px = two-tile colour story reads, glyphs gone; 32px = "TSP" legible, arrow visible; 192px maskable = fully inside safe circle, both tiles crisp. The ADR's tab-size claim is now evidence-backed.

## b) PARTIALLY DONE

1. **"Favicon QA" (the ADR block item):** artifacts are correct-by-construction and raster-QA'd, but browser-matrix QA (real tab bars, dark/light themes, iOS home screen, Safari) is not done — renderer output is a proxy, not the thing itself.
2. **The work the favicon decision UNBLOCKED:** ADR 0002 said the favicon question blocks "apple-touch icons, web manifest, favicon QA". I resolved the blocker and shipped none of the unblocked work — no `apple-touch-icon`, no `.ico`, no raster maskable PNGs, no Safari `mask-icon`. Deliberate (your instruction: report, then wait), but it is unfinished follow-through.
3. **Test coverage:** `test/unit/brand-assets.test.ts` was NOT extended to the two new favicons or to manifest↔file consistency. The generator gate protects the files; nothing protects the *wiring* (manifest icons, layout links).
4. **Gate coverage:** relevant-subset gates green (see scope line); full `pnpm run verify` unrun. Defensible for a no-`src/` change, but the convention exists precisely so "defensible" never becomes "skipped".
5. **Legacy teal retirement:** favicon teal is gone; the site accent (`--color-accent: #14b8a6` in `global.css` + `starlight.css`) and the manifest `theme_color` are still legacy teal. Deferred as a site-wide design decision — the site now tells two brand stories (teal accent, mark palette) and that needs YOUR call, not mine.
6. **Commit hygiene:** the harness forbids me committing without your say-so, so the daemon landed the whole coherent favicon change as `a411ff37 chore: auto-commit 7 changed file(s) (heuristic)`. The work is committed; the *history* is poor. A follow-up `git commit --amend`-style rewrite is possible only if you ask.

## c) NOT STARTED

None of these existed as intentions before this session's discoveries; all are now explicit backlog:

- Apple-touch-icon (180×180 PNG) + `.ico` fallback + Safari pinned-tab `mask-icon`
- Raster maskable PNGs (192/512) in the manifest for Android install quality
- Favicon cache-busting (`?v=<hash>` on the layout links — favicons cache brutally hard)
- Favicon/manifest wiring tests (`brand-assets.test.ts` extension)
- `manifest.json` linked from the **Starlight docs layout** — currently only `LandingLayout` links it (verified by grep), so the PWA surface is narrower than the manifest implies
- Site accent migration teal → brand palette (needs your decision, see (g) Q2)
- `manifest.json` `theme_color` → brand ink/plum
- ADR 0002: trademark posture decision (open), npm surface decision (open), Status field still "Proposed"
- Derived artifact counts (kill the hardcoded "eleven" in three documents — see split-brains)
- `og.png` legacy audit, `screenshots/` empty-dir removal, `public/js/*` reference check
- Website flake devShell fix (`md-go-validator` go ≥ 1.27.1 vs nixpkgs 1.26.8)

## d) TOTALLY FUCKED UP

**Nothing shipped is broken.** Production serves correct, verified files; every gate that covers what I touched is green. But brutal honesty requires three entries:

1. **I shipped a legibility claim I had not looked at.** The ADR decision and my summary asserted "the plum→gradient tile colour story is the identity at tab size" — written *before* any pixel existed as evidence. That is exactly the failure mode `verify-external-claims` exists for, applied to my own output. I closed the gap with raster QA in this report and the claim held (16px: colour story reads; 32px: glyphs return) — but the correct order was render-then-claim, and it cost a 30-second detour through two broken sharp environments (bun can't dlopen sharp's libstdc++; `website/` flake devShell is broken upstream) before the root devShell worked. Claim-by-faith first, evidence after, is backwards.
2. **Three wasted round-trips on the question tool.** I called it with `options` instead of `choices`, then with a missing `description`, before reading the schema and getting it right. Pure process noise in front of you.
3. **Transient split-brain in AGENTS.md:** one edit added the favicons while the sentence still said "Eight outputs:", fixed to "Eleven" in the immediately following edit. Never shipped in that state (the daemon commits fast enough that this was luck, not discipline). Also: the change you cared about most landed as `chore: auto-commit 7 changed file(s) (heuristic)` — correct per harness rules, bad for history.

## e) WHAT WE SHOULD IMPROVE

1. **Render-and-look before legibility language.** Any claim about how something *looks* gets a raster + view first. Cost: one sharp call. This session proves the tooling exists and the failure mode is real.
2. **Stop hardcoding artifact counts in prose.** "Eight/eleven artifacts" now lives in ADR 0002, `assets/brand/README.md`, and `AGENTS.md` — three places that drift on the next artifact. The generator should print the count (like `sync-stats.mjs` does for test counts: "derived, not typed") or the docs should stop counting.
3. **Gate the wiring, not just the bytes.** `brand:check` byte-compares files; nothing checks that `manifest.json` icons point at existing files, or that layouts link what exists. One small vitest file closes it.
4. **A favicon decision unblocks work — harvest it immediately.** ADR "Blocks" columns should feed `TODO_LIST.md` the moment a decision lands, or the unblocked work rots (this session: blocker resolved, unblocked work untouched).
5. **Full `verify` when touching repo-root scripts,** not only the gates for the surfaces visibly changed — the generator is TypeScript in the repo root and only LSP diagnostics covered it.
6. **Read the tool schema once, not three times.** The question-tool fumbling was avoidable by reading the error message properly the first time.
7. **Native-module scripts run in the root devShell,** not bun: sharp needs real node + libstdc++ (`bun -e` fails with `ERR_DLOPEN_FAILED`; `nix develop .#default -c node` works). This belongs in AGENTS.md gotchas — recorded as item (f)#33.
8. **Coherent changes deserve real commit messages.** When you say "commit", brand changes should be one described commit, not daemon heuristic noise.

### Brutal self-review — direct answers

- **What did you forget?** (1) Visual QA before shipping a visual claim; (2) the ADR-blocked work (apple-touch etc.) that my own decision unblocked; (3) that `manifest.json` is only linked from the landing layout — I verified wiring and stopped at the first hit; (4) sharp's runtime constraints until failure forced the issue.
- **What is stupid that we do anyway?** Hardcoded counts in three docs; a manifest that claims `maskable` without a maskable-safe file (fixed today, but the pattern — claiming properties nobody checks — is the stupid thing); two brand stories (teal accent + mark palette) on one site.
- **Could you have done better?** Yes: render first, one valid question-tool call, batch the ADR/AGENTS/README count edits as one multiedit pass per file, and either ask to commit properly or flag the daemon-message loss at the time.
- **Still improve?** All of (e), plus the (f) list below.
- **Did you lie to you / me?** No intentional lies. One claim-by-faith (16px legibility) shipped before evidence; now evidence-backed. The scope line above states every unverified boundary explicitly.
- **Ghost systems (capability that exists but is not wired in)?** (1) `favicon-maskable.svg` pre-fix manifest entry pointed at the wrong file — a capability that existed but wasn't reachable; fixed. (2) `manifest.json` itself is only wired on landing pages, so its PWA promises are half-wired site-wide. (3) `screenshots/` is an empty dir (dead). (4) `og.png` is a suspected legacy ghost — flagged, not verified.
- **Split brains?** (1) Artifact count duplicated in three documents. (2) Teal accent vs mark palette = two competing brand stories. (3) ADR "Decision 6 decided" vs Status field still "Proposed". (4) Favicon decision recorded in both ADR 0002 and AGENTS.md — mirror by design, drift-prone by nature.
- **Scope creep?** Resisted: teal accent, og.png, screenshots/, website flake — all noticed, none touched, all reported instead. The manifest edit was in-scope (it claimed `maskable` falsely); the docs edits are mandated by memory-maintenance rules.
- **Removed something useful?** No. The legacy favicon was replaced, not removed; nothing else was deleted.
- **Tests?** No new tests for new artifacts (gap, see (f)#6). Existing suites untouched and green.

---

## f) Things to get done next (impact-sorted; #1–#20 actionable, #21+ brainstorm/ROADMAP fuel)

| # | Item | Why / impact |
| --- | --- | --- |
| 1 | Apple-touch-icon 180×180 PNG generated via the sharp pipeline + `<link rel="apple-touch-icon">` | The single biggest unticked icon surface (iOS bookmarks/home screen); ADR explicitly lists it as unblocked now |
| 2 | Multi-size `.ico` fallback (16/32/48) | Safari/legacy-tool coverage; trivial to generate next to `brand-mark.png` |
| 3 | Raster maskable PNGs (192/512) in `manifest.json` | Android install prompts currently rely on SVG `"sizes":"any"`; PNGs are the safe path |
| 4 | Safari pinned-tab `mask-icon` (+ color) | Last major browser surface with no representation |
| 5 | Extend `test/unit/brand-assets.test.ts`: favicons byte-match generator; manifest icon entries point at existing files | Gates the wiring; the generator gate only gates bytes |
| 6 | Link `manifest.json` from the Starlight docs layout (site-wide) | Manifest is currently landing-only — half-wired capability |
| 7 | Favicon cache-busting (`?v=<content-hash>` in layout links) | Browser favicon caches are pathological; without busting the next favicon fix won't reach anyone |
| 8 | Post-deploy live check: fetch `/favicon.svg` + homepage in `deploy-website` app (node fetch, not curl) | Today's verification was manual; make the deploy self-verifying |
| 9 | Browser QA matrix pass: Chrome/FF/Safari, dark+light tab bars, bookmarks, iOS home screen | Close the "renderer ≠ browser" gap from the scope line |
| 10 | `manifest.json` `theme_color`: teal → brand ink/plum | Same legacy remnant family as the favicon was; PWA title bar still tells the old brand |
| 11 | Decide + migrate site accent off `#14b8a6` (needs Q2) | Ends the two-brand-stories split brain; touches `global.css` + `starlight.css` |
| 12 | Derive the artifact count in the generator; delete hardcoded counts from ADR/README/AGENTS.md | Kills the 3-doc drift trap permanently |
| 13 | ADR trademark posture decision (needs Q1) | Gates ADR acceptance; favicon now puts derivative marks in every browser tab, which raises the stakes |
| 14 | ADR npm-surface decision | Last open row; unblocks README/release-checklist work |
| 15 | ADR 0002 Status → Accepted (after 13) + add raster-QA evidence reference to Decision 6 | Status currently says "Proposed" while decisions 1–6 are shipped reality |
| 16 | `scripts/render-favicon-qa.mjs`: committed script rendering 16/32/192 QA PNGs | Makes visual QA repeatable instead of a one-off `node -e` |
| 17 | Audit + trash `website/public/og.png` (305 KB, Sep 19) if unreferenced; trash empty `screenshots/` | Public-dir hygiene; both suspected legacy ghosts (verify first) |
| 18 | Verify `public/js/{animations,copy-code,header,theme-init}.js` are all still referenced after the playground.js deletion era | Dead JS shipping to production is silent weight |
| 19 | Fix website flake devShell (`md-go-validator` go ≥ 1.27.1 vs nixpkgs 1.26.8) | `nix develop` inside `website/` is broken; pin go or patch the input |
| 20 | Verify Starlight docs pages actually render the favicon link (astro.config `favicon:`) in built HTML head | Confirms docs-page icon coverage, not just landing |
| 21 | 16px inset variant: 2-unit horizontal padding vs edge-to-edge (design A/B) | 16px render reads as a wide strip; padding might read more icon-like — taste call |
| 22 | `check-links.mjs`: assert favicon + manifest icons resolve | Extends the existing gate cheaply |
| 23 | `opensearch.xml` freshness check (dated Oct 23) | Small, verifiable, forgotten-corner hygiene |
| 24 | `humans.txt` freshness check | Same class |
| 25 | Record sharp-runtime gotcha in AGENTS.md (bun dlopen fails; root devShell node works) | Prevents the next 10-minute sharp detour |
| 26 | Record website-flake breakage in AGENTS.md until #19 lands | Same |
| 27 | Harvest this report's (f) into `TODO_LIST.md`/`ROADMAP.md` (docs-health HARVEST mode) | The skill mandates (f) not be entombed in a timestamped file |
| 28 | CHANGELOG note if any favicon/apple-touch work ships in a release window | Site-only today; becomes release-relevant when raster icons ship |
| 29 | Committed `render-brand-png`-style path for any new PNG icons (no ad-hoc npx) | The 2026-11-01 precedent: uncommitted scripts produced the old PNG |
| 30 | `Logo.astro` id-collision spot-check on pages rendering the mark twice (header + footer) | id-suffix mechanism exists; one grep-level audit confirms no page breaks it |
| 31 | Dark-tab-bar-only favicon variant (SVG `prefers-color-scheme` media query inside favicon.svg) | Brainstorm: brighter plum on dark tab bars |
| 32 | OG-card art refresh to the full pipeline lockup (currently compact mark PNG) | Brainstorm: richer social preview |
| 33 | Favicon manifest `id`/`scope` review for PWA installability score | Brainstorm: Lighthouse pass |
| 34 | Add the favicon "composition" row to `assets/brand/README.md` Compositions table (currently only in Files) | Doc completeness |
| 35 | Consider `sharp`-free rasterization (resvg CLI) to dodge the libstdc++ dance | Brainstorm: simpler QA tooling |
| 36 | Sweep for other legacy teal hexes site-wide (`#14b8a6`, `#2dd4bf`, `#0f766e` family) | Same split-brain family as #11, enumeration only |
| 37 | `docs/logo-concepts.html` card 57 snapshot: note it must be re-copied if the stacked lockup ever changes | Process guard, zero-work today |
| 38 | Annotate ADR Decision 6 with the three raster renders (16/32/192) as evidence artifacts | Turns this report's QA into permanent provenance |
| 39 | Generate `favicon.svg` from a shared square-composition helper if a third square slot ever appears | YAGNI guard: only if a third appears |
| 40 | Consider `theme-color` meta tag per layout (not just manifest) matching #10 | Browser UI tint on every page, not just installed PWA |

(Forty real items; per the skill, #21+ are brainstorm/ROADMAP fuel, not commitments.)

---

## g) Three questions I cannot figure out myself

1. **Trademark posture:** is the derivative lockup acceptable as primary identity *now that it sits in every browser tab as the favicon* — or do we pivot to a synthesized original mark (ADR concept 25/50) while the official marks stay documentation-only? This gates ADR acceptance and decides whether the favicon survives as-is.
2. **Site accent:** retire the legacy teal `#14b8a6` and migrate the site theme to the brand palette (plum/violet/gradient), or does teal stay as a deliberate accent? This touches `global.css` + `starlight.css` on every page and I will not pick a taste direction for you.
3. **Raster icon set:** do you want the full raster pipeline (apple-touch 180, `.ico`, maskable 192/512 PNGs) generated and wired, or is SVG-only acceptable for your actual browser matrix (Linux desktop, Chrome/FF)? This decides whether (f)#1–#4 happen at all.

---

**Status: report written. Waiting for instructions.**
