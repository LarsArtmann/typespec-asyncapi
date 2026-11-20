# Brand Identity & Logo System — Status Report

**When:** 2026-11-02 01:20 CET (Monday)
**Session scope:** logo concept exploration → direction chosen (concept 57) → brand assets built → README + website integration → verification.
**Emitter source was not touched.** This report covers only this session's work and what it revealed.
**Snapshot warning:** point-in-time record. Annotate, never rewrite (repo convention for `docs/status/**`).

---

## 0. Executive verdict

The identity is **shipped and gate-verified** on four surfaces (README, landing header, "How it works", docs header) plus OG cards. Three real defects remain: the gallery you were shown is **stale relative to what shipped**, the **favicon is now from a different identity system**, and **no human eye has looked at the rendered result** (my verification was statistical, not visual). One process accident happened during this report's preparation: the repo's prescribed formatting-verification command **rewrote 9 files** — reverted, tree is clean, but the command and a broken exclude need fixing.

---

## 1. Direct answers to your three questions

### 1.1 What did I forget?

~~1. **Favicon.** Header/docs now show the pipeline marks; `website/public/favicon.svg` and the manifest icons are still the old teal squircle + chevrons. Two identities now coexist. Deliberate (a two-tile mark is mush at 16 px) but unresolved.~~ done — favicon is the new mark — ADR 0002 decision 6 (website/public/favicon.svg + favicon-maskable.svg)
~~2. **The gallery is stale.** Card 57 renders the 160×100 draft (block 90 px wide, arrow at x=16, letter-spacing 2). The shipped lockup is 126×112 (block 88, arrow at x=20, tracking 1.5). Anyone opening the contact sheet sees the older design as "the pick".~~ done — card 57 refreshed from lockup-stacked-dark.svg and carries a shipped chip
~~3. **Provenance / attribution.** `docs/logo-sources/` holds trademarked artwork with no LICENSE/attribution file, no source URLs, no pinned commit SHAs.~~ done — assets/brand/README.md provenance section pins source commits
~~4. **Visual QA.** I never looked at the header, the lockup on the page, or `/og/home.png`. "stddev ≈ 25 in the top strip" proves pixels exist, not that the composition is good.~~ done — raster review happened and found the arrow-shaft gradient bug (ADR 0002 context)
~~5. **Formatting of the new files.** I did not verify treefmt cleanliness before declaring done — and when I finally ran it, I ran it incorrectly (see §5.1).~~ done — generator output has uniform indentation; brand:check byte-locks it
6. **npm rendering.** `<picture>` + `prefers-color-scheme` is safe on GitHub; npm's README renderer is untested. If it strips `<picture>`, the npm package page shows no logo at all.
~~7. **CHANGELOG entry** for a public-facing brand change.~~ done — CHANGELOG [1.2.0] carries the identity entries
~~8. **Page title inconsistency.** `docs/logo-concepts.html` says "50 logo concepts" while it holds 59 cards (50 + 9 experiments).~~ done — title now reads 50 concepts + 9 official-mark experiments (docs/logo-concepts.html)

### 1.2 What could I have done better?

~~1. **Verified the brand source first.** I downloaded `icons/raw/tsp-logo.svg` believing it was the TypeSpec mark; it is the VS Code extension's "TSP" text tile. The real mark was in `website/public/img/favicon.svg`. The dead file is still committed.~~ done — tsp-logo.svg removed 2026-11-02 (AGENTS.md logo bullet)
~~2. **Read the formatter's flags before running them.** `-c` is `--clear-cache`, not "check"; `--fail-on-change` still wrote. AGENTS.md prescribes this exact command as a verification step — that documentation is now suspect.~~ done — AGENTS.md treefmt bullet documents that nix fmt rewrites and -c means clear-cache
~~3. **Not called a statistic "verified".** The OG card, header and lockup each deserved 10 seconds of actual looking.~~ **NOT-DO — process lesson; raster review ran as a one-off (report §11 5.5).**
~~4. **Generated clean code.** The two `.astro` components ship with ragged indentation (first AA polygon 6-space, rest 8-space) because a template literal concatenated pre-indented strings.~~ done — components regenerated with uniform indentation plus a GENERATED FILE banner
~~5. **Committed the generators.** Every asset was produced by throwaway `/tmp/*.mjs` scripts; nothing reproducible is in the repo.~~ done — scripts/generate-brand-assets.ts is the committed single source
~~6. **Held one palette.** The gallery uses a teal accent system (`--aa: #2DD4BF`); the shipped brand uses AsyncAPI's real gradient (`#2DCCFD → #A829E2 → #E50E99`). Two palettes, zero documentation of which wins.~~ done — palette recorded with pinned commits; favicon and manifest use the official gradient
~~7. **Tested the mark at its real size** (22 px in the header) before choosing it.~~ done — sub-24 px degradation documented and accepted (ADR 0002 decision 6)

### 1.3 What can I still improve?

~~1. One brand-token source + a generator with a `--check` mode that fails CI when `assets/brand/*`, the two Astro components and the Starlight copy drift.~~ done — brand:check runs in pnpm run verify; test/unit/brand-assets.test.ts guards the components
~~2. A favicon-scale harness (16/24/32/48) as a mandatory gate for any brand change.~~ **Won't implement — favicon shipped as an SVG pair; no raster scale harness was ever demanded.**
~~3. Screenshot-based visual regression for `/`, `/og/home.png`, docs header, light + dark.~~ **Won't implement — no screenshot harness; guard is byte-level brand:check plus structural brand tests.**
~~4. A horizontal lockup, PNG fallbacks, and a GitHub social preview.~~ done — horizontal lockup shipped (assets/brand/lockup-horizontal-*.svg); raster lockups and social preview stay gated on ADR 0002 open questions
~~5. Fix the treefmt exclude/check story so "verification" cannot mutate the repo.~~ done — flake.nix excludes fixed (flat + globstar patterns); checks.format verifies without writing

---

## 2. a) FULLY DONE (verifiable)

| #  | Item                                                                                                                                                                                                                                                                                                                                    | Evidence                                                                                                                                                                |
| -- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~1~~ done at `f70feeb9` | ~~**Logo contact sheet** `docs/logo-concepts.html` — 59 cards (50 original concepts + 5 literal merges + 4 pipeline lockups), fully self-contained (Space Grotesk 400/700 + JetBrains Mono 400 embedded as base64, 148 077 bytes / 851 lines)~~ | ~~`html-validate` exit 0; 0 duplicate SVG ids; commit `f70feeb9` chain~~ |
| ~~2~~ done at `f70feeb9` | ~~**Interactive review surface** — Dark / Light / Checker tile toggle, global motion pause (auto-off under `prefers-reduced-motion`), 5 canvas marks drawn from seeded RNG, 1 rAF animation~~ | ~~gallery JS parses (`new Function`, 166 lines); manual code review~~ |
| ~~3~~ done at `f70feeb9` | ~~**Official marks sourced verbatim** — `docs/logo-sources/asyncapi-mark.svg` (asyncapi/brand, mark/primary), `docs/logo-sources/typespec-mark.svg` (microsoft/typespec `website/public/img/favicon.svg`)~~ | ~~downloaded via `gh api`, committed~~ |
| ~~4~~ done at `f70feeb9` | ~~**Section E — literal merges 51–55** using the official path data (lockup, gradient bridge, stacked double, diagonal splice, favicon stress 16/24/32/48)~~ | ~~rendered in gallery, ids unique~~ |
| ~~5~~ done at `f70feeb9` | ~~**Section F — pipeline lockups 56–59** ("46's idea × official marks"); you selected **57**~~ | ~~rendered in gallery~~ |
| ~~6~~ done — shipped, later renamed lockup-stacked-dark.svg / lockup-stacked-light.svg (assets/brand/) | ~~**Lockup v2 shipped** — `assets/brand/lockup-dark.svg` + `lockup-light.svg` (126×112): 8-unit vertical rhythm, 30 px tiles, drawn arrow (no text glyph), 88 px emit block with symmetric padding, cropped canvas (was 160×100 with dead space), official brand casing (`TypeSpec` / `AsyncAPI`), `<title>` for a11y, no version strings~~ | ~~`svgo` parse OK; ImageMagick content bbox **115×100 @ +6+6**~~ |
| ~~7~~ done — assets/brand/mark.svg exists (72 x 36, generator-owned) | ~~**Compact mark shipped** — `assets/brand/mark.svg` (72×36, background-agnostic, input→output arrow)~~ | ~~`svgo` OK; content bbox **72×26 @ +0+5**~~ |
| ~~8~~ done — website/public/brand-mark.png exists, regenerated by the committed render-brand-png.mjs | ~~**OG raster asset** — `website/public/brand-mark.png` 440×220 RGBA (CanvasKit cannot decode SVG)~~ | ~~`identify`: `channels=srgba opaque=False`; logo pixels confirmed in built card (top-strip σ ≈ 25)~~ |
| ~~9~~ done at `c9c1ffe4` | ~~**README hero** — `<picture>` with `prefers-color-scheme`, absolute `raw.githubusercontent` URLs (npm renders README outside the repo), 170×151 display~~ | ~~committed in `c9c1ffe4`~~ |
| ~~10~~ done — website/src/components/Logo.astro is generated from the mark | ~~**Landing header** — `Logo.astro` rewritten to the compact mark (44×22), Header updated~~ | ~~in `dist/index.html` (`taa-mark-aa` present)~~ |
| ~~11~~ done — website/src/components/PipelineLockup.astro generated, currentColor caption | ~~**"How it works" section** — new `PipelineLockup.astro`, theme-aware (`currentColor` caption), height 100~~ | ~~in `dist/index.html` (`taa-lockup-aa`, `text-text-primary`, `fill="currentColor">TypeSpec<`)~~ |
| ~~12~~ done — website/src/assets/brand-mark.svg wired via Starlight logo in astro config | ~~**Docs header** — Starlight `logo` option + `website/src/assets/brand-mark.svg` copy~~ | ~~`brand-mark` referenced in built docs pages~~ |
| ~~13~~ done — logo path ./public/brand-mark.png still wired in website/src/pages/og/[...slug].ts | ~~**OG cards** — `logo: { path: "./public/brand-mark.png", size: [220, 110] }` in `src/pages/og/[...slug].ts`~~ | ~~all 25 `/og/*.png` routes built, `og/home.png` 1200×630~~ |
| ~~14~~ done — website gate is a CI step (ci.yml: website typecheck, build, HTML validation, link check) | ~~**Website gate green**~~ | ~~`astro check` + build **22 pages**, `links: 798 internal references … valid`, `csp: 22 pages carry a valid, hash-covered policy`, html-validate silent, CSP patch 22/22~~ |
| ~~15~~ done — AGENTS.md brand identity system bullet (asset inventory + regeneration command) | ~~**Memory updated** — AGENTS.md brand-system bullet (asset inventory, regeneration command, favicon decision, font-fallback rationale)~~ | ~~commit chain~~ |

---

## 3. b) PARTIALLY DONE (works, but with gaps)

| # | Item                           | What works                                  | What remains                                                                   | Effort               |
| - | ------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------ | -------------------- |
| ~~1~~ done — card 57 shows shipped geometry + chip; title updated | ~~**Gallery ↔ shipped identity**~~ | ~~59 cards render and validate~~ | ~~Card 57 still shows the 160×100 draft; no "shipped" badge; page title says 50~~ | ~~S~~ |
| ~~2~~ done — favicon is the new mark (ADR 0002 decision 6) | ~~**Icon system**~~ | ~~header/docs/OG use the new mark~~ | ~~favicon + manifest icons still the legacy teal squircle → split identity~~ | ~~S–M (needs decision)~~ |
| ~~3~~ done — raster review done (report §11 5.5, corroborated by ADR 0002) | ~~**OG card composition**~~ | ~~builds, logo present, correct dimensions~~ | ~~nobody has looked at it; logo/title spacing and balance unverified~~ | ~~S~~ |
| ~~4~~ **Won't implement — deferred to the npm-surface decision (ADR 0002 open questions).** | ~~**README rendering**~~ | ~~GitHub-safe markup, absolute URLs~~ | ~~npm's renderer untested; `<picture>` may be stripped there~~ | ~~S–M~~ |
| ~~5~~ done — assets/brand/README.md pins sources + commits | ~~**Provenance**~~ | ~~sources named in AGENTS.md~~ | ~~no `assets/brand/README.md` with URLs + trademark note; no commit SHA pinning~~ | ~~S~~ |
| ~~6~~ done — generated output byte-locked; nix fmt semantics documented in AGENTS.md | ~~**Formatter compliance**~~ | ~~site + assets verified functionally~~ | ~~new `.astro` files have ragged indentation; treefmt behavior unverified (§5.1)~~ | ~~S~~ |
| ~~7~~ done — raster review covered the lockups (report §11 5.5) | ~~**Light-mode QA**~~ | ~~`currentColor` wiring verified in HTML~~ | ~~contrast of gradient caption / block on light theme not eyeballed~~ | ~~S~~ |
| ~~8~~ done — title and counts line now consistent (50 + 9) | ~~**Title/count consistency**~~ | ~~counts line says "+9 official-mark lockups"~~ | ~~`<title>`/H1 still says "50 logo concepts"~~ | ~~S~~ |

---

## 4. c) NOT STARTED

~~1. **Horizontal lockup** (tiles → arrow → tiles + wordmark) for banners, social previews, npm avatar.~~ done — assets/brand/lockup-horizontal-dark.svg + lockup-horizontal-light.svg (352 x 54)
~~2. **16 px-optimized favicon** + PNG icon set (16/32/180 apple-touch) + `manifest.json` icon entries.~~ done — favicon shipped as SVG any/maskable pair in website/public/manifest.json (ADR 0002 decision 6)
~~3. **Raster lockups** (dark/light PNG @2×) for renderers that reject SVG or `<picture>`.~~ **Won't implement — raster output is the OG brand-mark.png only (website/scripts/render-brand-png.mjs); lockups stay SVG.**
~~4. **Trademark-safe primary mark path** — shipping our own synthesized mark (concept 25 Outline Mark or 50 Lockup) instead of derivatives, if that becomes the preference.~~ **Won't implement — posture open by design — derivative lockup is the interim identity (ADR 0002).**
~~5. **Brand generator with `--check`** — one definition → `assets/brand/*`, `Logo.astro`, `PipelineLockup.astro`, `website/src/assets/brand-mark.svg`, `brand-mark.png` + drift detection.~~ done — scripts/generate-brand-assets.ts + brand:check in pnpm run verify
~~6. **Motion variant** — emit-arrow pulse / traveling dash in the hero (site already has animation + reduced-motion infrastructure).~~ **Won't implement — never added; hero lockup is static.**
~~7. **Image-AI exploration** you floated — never attempted (argued against on vector/legibility grounds); zero raster concepts were produced as evidence.~~ **Won't implement — argued against on legibility grounds in this report; never attempted.**
~~8. **Gallery curation** — finalist markers, shortlist/filter mode, favicon-safety flags.~~ done — shortlists recorded in the AGENTS.md logo bullet (25 / 22 / 50 + 52)
~~9. **CHANGELOG entry** for the brand change.~~ done — CHANGELOG [1.2.0] identity entries
~~10. **GitHub repo social preview** (1280×640) built from the lockup.~~ **Won't implement — blocked on the trademark posture (ADR 0002 open questions).**
~~11. **Visual regression harness** (screenshot diff) for brand surfaces.~~ **Won't implement — superseded by byte-level brand:check + test/unit/brand-assets.test.ts.**
~~12. **Forced-colors / high-contrast support** (`forced-color-adjust`, currentColor fallbacks in static SVGs).~~ **Won't implement — not implemented; no forced-colors handling in brand assets or website/src.**
~~13. **Dead-artifact cleanup** — `docs/logo-sources/tsp-logo.svg` (extension tile, unused).~~ done — tsp-logo.svg removed 2026-11-02
~~14. **LICENSE/attribution file** for `docs/logo-sources/` (Microsoft / AsyncAPI Initiative trademarks).~~ done — attribution + pinned commits in assets/brand/README.md provenance section
~~15. **treefmt exclude fix** — `docs/**/*.html` did not protect the gallery; decide `docs/planning/**`, `docs/analysis/**`, `website/IMPROVEMENTS.md`.~~ done — flat + globstar patterns in flake.nix; GLOB PITFALL documented
~~16. **Release-checklist item** — verify npm README rendering after next publish.~~ **Won't implement — deferred to the npm-surface decision (ADR 0002 open questions).**

---

## 5. d) TOTALLY FUCKED UP (radical honesty)

### 5.1 The prescribed "verification" command rewrote 9 files — Severity: MEDIUM

- **What happened:** `nix fmt -- --fail-on-change -c` (the command AGENTS.md prescribes as the drift check, "cache-cold") **formatted and wrote** changes to 9 files: `docs/logo-concepts.html` (851 → 3439 lines, +44 KB) and 8 unrelated historical markdown docs (`docs/analysis/…`, six `docs/planning/…`, `website/IMPROVEMENTS.md`).
- **Root cause:** `-c` is treefmt's `--clear-cache`, not a check flag; this treefmt version wrote despite `--fail-on-change`. The docs claim it is a safe verifier. Unknown whether the command ever was safe here.
- **Mitigation taken:** restored all 9 files to their committed bytes via `git show HEAD:<path>`; `git status` is clean; gallery back to 148 077 bytes / 851 lines.
- **What it proves:** AGENTS.md's formatting-verification guidance is wrong or version-stale. A "check" that mutates the tree is worse than no check.

### 5.2 `docs/**/*.html` prettier exclusion did not apply — Severity: MEDIUM

- **What happened:** the gallery is excluded from prettier in `flake.nix` (`excludes = ["docs/**/*.html", …]`) yet was reformatted anyway. Meanwhile `docs/status/**` files were untouched.
- **Root cause:** unknown — treefmt exclude semantics for `**` at a single directory level, or a treefmt-nix version behavior. Needs a 5-minute experiment.
- **Mitigation:** reverted. Do **not** run `nix fmt` again until this is understood.

### 5.3 The gallery is stale relative to what shipped — Severity: MEDIUM

- **What is wrong:** card 57 ≠ shipped lockup (different canvas, block width, arrow position, tracking). The artifact used to make the decision no longer depicts the decision.
- **Mitigation:** none yet — refresh card 57 / add a "shipped v2" card.

### 5.4 Wrong TypeSpec asset downloaded first — Severity: LOW

- **What is wrong:** `docs/logo-sources/tsp-logo.svg` is the VS Code extension icon (plum square + "TSP" text path), not the brand mark. Committed and dead.
- **Mitigation:** delete or rename to `typespec-extension-tile.svg` with a note.

### 5.5 No visual verification of any new surface — Severity: MEDIUM (public surfaces)

- **What is wrong:** OG card, landing header, "How it works" lockup, docs header: all asserted from DOM greps and a stddev statistic.
- **Mitigation:** screenshot `/og/home.png`, `/`, one docs page at both themes; adjust spacing if needed.

### 5.6 Ragged generated markup — Severity: LOW

- **What is wrong:** in `Logo.astro` and `PipelineLockup.astro` the AA-glyph block mixes 6-space and 8-space indentation (template-literal artifact).
- **Mitigation:** regenerate with normalized indentation or hand-fix.

### 5.7 Root gate not run — Severity: LOW

- **What is wrong:** `pnpm run verify` (build + lint + tests + coverage + duplication) was never run this session; only the website gate.
- **Justification:** zero `src/` changes. Still a deviation from the "run the full gate" rule.
- **Mitigation:** run it once before the next release/commit that touches emitter code; or add a docs-only fast path to the rule.

### 5.8 Unverified absolutes in AGENTS.md — Severity: LOW

- **What is wrong:** "the ONLY logo format astro-og-canvas/CanvasKit can decode" is stated as absolute (accurate for CanvasKit's image decoder, but over-claimed), and the entry implies exclusions protect `docs/**/*.html` — disproved above.
- **Mitigation:** tighten the wording once §5.2 is resolved.

---

## 6. e) WHAT WE SHOULD IMPROVE

~~1. **Verify the brand source before designing.** The real TypeSpec mark was in the site's own favicon, not a repo `icons/` folder. One `view` would have saved a dead artifact.~~ **NOT-DO — lesson recorded; correct sources now pinned in the AGENTS.md logo bullet.**
~~2. **Make brand assets generated, not hand-mirrored.** Today: 1 source per artifact × 5 artifacts (assets, 2 components, Starlight copy, PNG). Add `scripts/brand/` + `--check` mode wired into `nix flake check`.~~ done — scripts/generate-brand-assets.ts + brand:check (wired into pnpm run verify, not nix)
~~3. **Screenshot before "done".** Brand work without eyes on pixels is guesswork; the stddev check is a smoke test, not QA.~~ **NOT-DO — one-off raster review done (report §11 5.5); no standing rule adopted.**
~~4. **Resolve the palette split-brain.** Gallery teal accent vs official AsyncAPI gradient — pick one as `--brand-*` tokens and derive everything.~~ done — palette decided; official gradient is the identity (AGENTS.md brand bullet)
~~5. **Static-SVG font policy.** SVG-as-image cannot load webfonts; we ship a fallback stack. Document the tradeoff and decide whether captions should be outlined paths for renderer parity.~~ done — font fallback stack documented in the AGENTS.md brand bullet
~~6. **Treat "verification" commands as dangerous.** Add to AGENTS: how to check formatting without writing (`treefmt --ci` or `nix flake check` in a clean tree), and fix the html exclude.~~ done — AGENTS.md treefmt bullet (nix fmt rewrites; verify via checks.format)
~~7. **Name artifacts consistently** (`mark.svg` vs `brand-mark.svg` vs `lockup-dark.svg` — one prefix scheme).~~ done — renamed lockup-stacked-*; one generator owns all names
~~8. **Stop shipping throwaway generators.** Every `/tmp/*.mjs` from this session should have been `scripts/brand/*.mjs` with a README line.~~ done — generator committed as scripts/generate-brand-assets.ts
9. **Close the status-report loop.** §7 (f) must be harvested into `TODO_LIST.md`/`ROADMAP.md` (docs-health HARVEST) — not left entombed here. **→ TODO_LIST §Docs corpus sweep**
~~10. **Pin one-off tooling.** `npx -y sharp-cli` / `svgo` bypass the repo's pinned-devtool rule. ImageMagick (`magick`/`identify`) is already present; prefer it, or add pinned devDeps.~~ done — decision recorded: sharp 0.35.5 pinned via website/scripts/render-brand-png.mjs (ADR 0002)

---

## 7. f) Up to 50 next tasks (ranked by impact)

| #  | Task                                                                                              | Impact   | Effort | Category      |
| -- | ------------------------------------------------------------------------------------------------- | -------- | ------ | ------------- |
| ~~1~~ done — flake excludes + AGENTS.md treefmt bullet + checks.format | ~~Fix treefmt: verify correct check invocation, repair `docs/**/*.html` exclude, document in AGENTS~~ | ~~Critical~~ | ~~S~~ | ~~Tooling~~ |
| ~~2~~ done — favicon decided and shipped (ADR 0002 decision 6; website/public/favicon.svg) | ~~Decide favicon direction (legacy teal vs new 16 px mark) and implement icons/manifest~~ | ~~Critical~~ | ~~S–M~~ | ~~Brand~~ |
| ~~3~~ done — ADR 0002 records the interim derivative-lockup posture | ~~Decide trademark posture (derivative lockup vs own synthesized mark) and record an ADR~~ | ~~Critical~~ | ~~S~~ | ~~Legal/Docs~~ |
| ~~4~~ done — card 57 refreshed with shipped chip | ~~Refresh gallery card 57 to the shipped v2 geometry + "shipped" badge~~ | ~~High~~ | ~~S~~ | ~~Cleanup~~ |
| ~~5~~ done — raster review done; it found the arrow-shaft gradient bug (report §11 5.5) | ~~Screenshot-QA `/og/home.png`, `/`, docs header in light + dark; fix spacing if wrong~~ | ~~High~~ | ~~S~~ | ~~Quality~~ |
| ~~6~~ done — assets/brand/README.md provenance + trademark posture | ~~Add `assets/brand/README.md`: sources, URLs, trademark note, regeneration command~~ | ~~High~~ | ~~S~~ | ~~Documentation~~ |
| ~~7~~ **Won't implement — deferred to the npm-surface decision (ADR 0002 open questions).** | ~~Verify npm README rendering of `<picture>`; add PNG/`<img>` fallback if broken~~ | ~~High~~ | ~~S–M~~ | ~~Quality~~ |
| ~~8~~ done — single-source generator + brand:check in verify | ~~Build the brand generator with `--check` (single definition → 5 artifacts)~~ | ~~High~~ | ~~M~~ | ~~Tooling~~ |
| ~~9~~ done — palette decided (official gradient); tokens live in the generator, not config.ts | ~~Decide brand palette tokens (official gradient vs site teal) and wire into website config~~ | ~~High~~ | ~~S~~ | ~~Design~~ |
| ~~10~~ done — removed 2026-11-02; sources re-pinned in AGENTS.md | ~~Hide/delete `docs/logo-sources/tsp-logo.svg`; rename with provenance~~ | ~~Medium~~ | ~~S~~ | ~~Cleanup~~ |
| ~~11~~ done — components are generator output (uniform, GENERATED FILE banner) | ~~Normalize generated `.astro` indentation~~ | ~~Medium~~ | ~~S~~ | ~~Quality~~ |
| ~~12~~ **Won't implement — raster output is the OG brand-mark.png only; lockups stay SVG.** | ~~Generate dark/light PNG lockups (@2×) for SVG-hostile renderers~~ | ~~Medium~~ | ~~S~~ | ~~Quality~~ |
| ~~13~~ done — shipped — assets/brand/lockup-horizontal-*.svg | ~~Design horizontal lockup for banners/social/npm~~ | ~~Medium~~ | ~~M~~ | ~~Design~~ |
| ~~14~~ **Won't implement — blocked on the trademark posture (ADR 0002 open questions).** | ~~Produce GitHub social preview (1280×640) from the lockup~~ | ~~Medium~~ | ~~S~~ | ~~Branding~~ |
| ~~15~~ **Won't implement — favicon shipped as SVG any/maskable pair; no PNG icon set.** | ~~Add 180×180 apple-touch + 32×32 PNG icons and manifest entries~~ | ~~Medium~~ | ~~S~~ | ~~Branding~~ |
| ~~16~~ done — title updated to 50 concepts + 9 official-mark experiments | ~~Retitle gallery to "50 concepts + 9 official-mark experiments"~~ | ~~Low~~ | ~~S~~ | ~~Cleanup~~ |
| ~~17~~ done — CHANGELOG [1.2.0] identity entries | ~~Add CHANGELOG entry for the identity change~~ | ~~Low~~ | ~~S~~ | ~~Documentation~~ |
| ~~18~~ **Won't implement — never added; hero lockup is static.** | ~~Add motion variant of the emit arrow (reduced-motion aware) to the hero~~ | ~~Low~~ | ~~M~~ | ~~Feature~~ |
| ~~19~~ **Won't implement — not implemented; no forced-colors handling anywhere in brand surfaces.** | ~~Add `forced-colors` / high-contrast handling to inline SVGs~~ | ~~Low~~ | ~~S~~ | ~~A11y~~ |
| ~~20~~ **Won't implement — captions stay text with a documented fallback stack (AGENTS.md brand bullet).** | ~~Outline lockup captions to paths for renderer parity (optional)~~ | ~~Medium~~ | ~~M~~ | ~~Quality~~ |
| ~~21~~ **Won't implement — superseded by byte-level brand:check + test/unit/brand-assets.test.ts.** | ~~Add screenshot visual-regression tests for brand surfaces~~ | ~~Medium~~ | ~~L~~ | ~~Testing~~ |
| ~~22~~ done — Starlight logo wired to brand-mark.svg; header reviewed in the raster pass | ~~Confirm Starlight logo height/alignment in docs header (both themes)~~ | ~~Medium~~ | ~~S~~ | ~~QA~~ |
| ~~23~~ done — sub-24 px degradation documented and accepted (ADR 0002) | ~~Verify compact mark legibility at 22 px; adjust or switch to single-tile variant if weak~~ | ~~Medium~~ | ~~S~~ | ~~QA~~ |
| ~~24~~ done — shortlists in the AGENTS.md logo bullet (25 / 22 / 50 + 52) | ~~Curate the 59 cards: mark finalists, drop weak marks~~ | ~~Medium~~ | ~~S~~ | ~~Cleanup~~ |
| ~~25~~ **Won't implement — no interactive filter; shortlists recorded in AGENTS.md instead.** | ~~Add shortlist/favicon-safety filter to the gallery~~ | ~~Low~~ | ~~M~~ | ~~Feature~~ |
| ~~26~~ **Won't implement — asset rule lives in the AGENTS.md brand bullet, not CONTRIBUTING.** | ~~Document README asset policy (absolute raw URLs + picture) in CONTRIBUTING~~ | ~~Low~~ | ~~S~~ | ~~Docs~~ |
| ~~27~~ **Won't implement — no brand tokens in website/src/data/config.ts; palette owned by the generator.** | ~~Add brand tokens to `website/src/data/config.ts`~~ | ~~Medium~~ | ~~M~~ | ~~Quality~~ |
| ~~28~~ **Won't implement — ADR 0002 reaffirmed the shipped lockup; no side-by-side redo.** | ~~Re-verify shipped choice vs concept 52 (Gradient Bridge) in light of v2~~ | ~~Low~~ | ~~S~~ | ~~Design~~ |
| ~~29~~ done — brand:check script exists and runs in verify | ~~Add `brand:check` npm script (artifact existence + geometry hash compare)~~ | ~~Low~~ | ~~M~~ | ~~CI~~ |
| ~~30~~ **Won't implement — deferred to the npm-surface decision (ADR 0002 open questions).** | ~~Add release-checklist item for npm README verification~~ | ~~Medium~~ | ~~S~~ | ~~Release~~ |
| ~~31~~ **Won't implement — gallery's only favicon-stress card (55) predates the final mark.** | ~~Add favicon-scale card to the gallery for the final mark~~ | ~~Low~~ | ~~S~~ | ~~Design~~ |
| ~~32~~ done — cards keep their own defs (f57aa, f58sh); cross-card reuse gone | ~~Remove gallery's cross-card filter reuse (card 58 borrows card 19's `m19f`)~~ | ~~Low~~ | ~~S~~ | ~~Cleanup~~ |
| ~~33~~ done — aria-live toggle status present in the gallery | ~~Add `aria-live` for background toggle state in the gallery~~ | ~~Low~~ | ~~S~~ | ~~A11y~~ |
| ~~34~~ **Won't implement — no visibilitychange pause; the rAF loop runs as-is.** | ~~Pause the pulse canvas on `visibilitychange` / IntersectionObserver~~ | ~~Low~~ | ~~S~~ | ~~Perf~~ |
| ~~35~~ **Won't implement — astro components are byte-locked generator output; no prettier plugin added.** | ~~Add `prettier-plugin-astro` (or explicit exclude) so `.astro` formatting is defined~~ | ~~Low~~ | ~~M~~ | ~~Tooling~~ |
| ~~36~~ **Won't implement — guard shipped in the pnpm gate (brand:check + brand tests), not as a nix check.** | ~~Add brand-asset check to `nix flake check` (parse + bbox assertions)~~ | ~~Medium~~ | ~~M~~ | ~~CI~~ |
| ~~37~~ done — assets/brand/README.md compositions table (pick by slot shape) | ~~Write "when to use lockup vs mark vs wordmark" usage note~~ | ~~Low~~ | ~~S~~ | ~~Docs~~ |
| ~~38~~ done — decided — assets/ excluded from the npm package (ADR 0002 decision 4) | ~~Decide whether `assets/brand` ships in the npm package or stays repo-only~~ | ~~Low~~ | ~~S~~ | ~~Packaging~~ |
| ~~39~~ done — README hero uses prefers-color-scheme picture | ~~Verify README on GitHub dark/light (picture media query)~~ | ~~Medium~~ | ~~S~~ | ~~QA~~ |
| ~~40~~ **Won't implement — OG cards render one logo; no dark or light variant (ADR 0002).** | ~~Add OG dark/light variant strategy (og-canvas supports one logo)~~ | ~~Low~~ | ~~M~~ | ~~Feature~~ |
| ~~41~~ done — components expose id + decorative props; README img carries alt text | ~~Audit alt text on all new SVG surfaces~~ | ~~Low~~ | ~~S~~ | ~~A11y~~ |
| ~~42~~ done — committed — website/scripts/render-brand-png.mjs runs via brand:generate | ~~Automate `brand-mark.png` regeneration in a committed script~~ | ~~Medium~~ | ~~S~~ | ~~Tooling~~ |
| ~~43~~ done — pinned commits in assets/brand/README.md provenance section | ~~Add provenance SHA pinning for downloaded official assets~~ | ~~Low~~ | ~~S~~ | ~~Documentation~~ |
| ~~44~~ done — decided — docs/planning/** and docs/analysis/** excluded in flake.nix | ~~Decide exclusion policy for `docs/planning/**`, `docs/analysis/**`, `website/IMPROVEMENTS.md`~~ | ~~Medium~~ | ~~S~~ | ~~Tooling~~ |
| ~~45~~ done — verify green through v1.2.0 (CI runs pnpm run verify) | ~~Run root `pnpm run verify` once to close the unverified-gate gap~~ | ~~Low~~ | ~~M~~ | ~~Quality~~ |
| ~~46~~ **Won't implement — decision recorded: pinned sharp 0.35.5 in render-brand-png.mjs, not ImageMagick.** | ~~Evaluate ImageMagick `magick` for all rasterization (drop npx sharp-cli)~~ | ~~Low~~ | ~~S~~ | ~~Tooling~~ |
| ~~47~~ **Won't implement — no embed snippet; the picture + raw-URL pattern is documented in AGENTS.md.** | ~~Add example markdown snippet showing how to embed the lockup elsewhere~~ | ~~Low~~ | ~~S~~ | ~~Docs~~ |
| ~~48~~ **Won't implement — daemon auto-commits remain; failures alerted via ci-alert.yml.** | ~~Review auto-commit daemon noise (9 heuristic commits this session)~~ | ~~Low~~ | ~~S~~ | ~~Process~~ |
| ~~49~~ done — source-of-truth + pinned commits documented in the AGENTS.md logo bullet | ~~Add "brand source verification" step to the design workflow notes~~ | ~~Low~~ | ~~S~~ | ~~Process~~ |
| ~~50~~ done — docs/adr/0002-brand-identity-and-asset-pipeline.md | ~~Archive this session's decisions into `docs/adr/` (identity + asset strategy)~~ | ~~High~~ | ~~S~~ | ~~Docs~~ |

---

## 8. g) Questions I cannot answer myself (max 3)

1. **Trademark posture.** Should the project's primary identity be a **derivative lockup of the official TypeSpec + AsyncAPI marks** (what shipped), or should the **official marks stay documentation-only** and our own synthesized mark (concept 25 Outline Mark / 50 Lockup) become primary? I can implement either; I cannot decide the legal/positioning risk appetite. _(Blocks tasks 3, 13, 14, 50.)_ **→ TODO_LIST §Release (ADR npm-surface decision row)**
~~2. **Favicon direction.** Keep the **legacy teal squircle** (recognizable, 16 px-safe, but a different visual system), or invest in a **16 px-optimized single-tile mark** — and if so, which glyph: gradient arrow, AsyncAPI "A", TSP, or our hex-bolt? _(Blocks tasks 2, 15, 23.)_~~ done — decided 2026-11-04 — favicon is the compact mark (ADR 0002 decision 6)
3. **npm/PyPI surface requirement.** Is **GitHub fidelity sufficient**, or must npm's package page also render the logo? If yes, I will ship raster PNG lockups and a `<img>`-first structure instead of relying on `<picture>`. _(Blocks tasks 7, 12, 30.)_ **→ TODO_LIST §Release (ADR npm-surface decision row)**

---

## 9. Verification log (this session)

```
svgo  assets/brand/{lockup-dark,lockup-light,mark}.svg     → all parse OK
identify website/public/brand-mark.png                      → 440x220 srgba opaque=False
identify assets/brand/lockup-dark.svg                       → content bbox 115x100+6+6
identify assets/brand/mark.svg                              → content bbox 72x26+0+5
pnpm --filter typespec-asyncapi-website run check           → 22 pages built; 798 links valid;
                                                              22/22 CSP-valid; html-validate silent
grep dist/index.html                                        → taa-lockup-aa, taa-mark-aa,
                                                              text-text-primary, fill=currentColor
grep dist/**/*.html                                         → brand-mark (Starlight logo) referenced
identify website/dist/og/home.png                           → 1200x630, logo pixels present (σ≈25)
git log                                                     → 9 auto-commits (daemon), latest c9c1ffe4
git status                                                  → clean after restoring 9 formatter-touched files
```

**Not verified:** any rendered screenshot; npm README; `.astro` formatter compliance; root `pnpm run verify`.

---

## 10. Handoff

- §7 (f) is **not yet harvested**: `TODO_LIST.md` and `ROADMAP.md` were not updated from this report. Next session should run `docs-health` **HARVEST**.
- Do **not** run `nix fmt` until §5.1/§5.2 are fixed — it currently rewrites unrelated files.
- Shipped identity lives in `assets/brand/` (source artifacts) and is mirrored inline in `Logo.astro` + `PipelineLockup.astro`; any change must touch both.

---

## 11. Resolution (2026-11-02, later session)

Annotation, not a rewrite: this section records what changed after the report was written.

| Defect (§5)                               | Status              | Evidence                                                                                                                                                                                                                                                  |
| ----------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~5.1 `nix fmt` rewrote 9 files~~ done — checks.format green; AGENTS.md treefmt bullet documents -c semantics | ~~**Fixed**~~ | ~~`nix build .#checks.x86_64-linux.format` passes; `AGENTS.md` now states `nix fmt` always rewrites and `-c` means `--clear-cache`~~ |
| ~~5.2 `docs/**/*.html` exclusion inert~~ done — flake.nix carries docs/*.html + docs/**/*.html + the GLOB PITFALL note | ~~**Fixed**~~ | ~~Root cause proven with the real treefmt 2.6.0 binary on a scratch tree: the glob needs a separator, so `docs/x.html` was never matched; `docs/*.html` added, plus `docs/planning/**` and `docs/analysis/**`~~ |
| ~~5.3 Gallery stale~~ done — card 57 is the shipped 126 x 112 lockup with shipped chip | ~~**Fixed**~~ | ~~Card 57 is now the shipped 126 × 112 lockup (copied from `lockup-dark.svg`) and carries a `shipped` chip~~ |
| ~~5.4 Wrong TypeSpec asset downloaded first~~ done — tsp-logo.svg gone; provenance pinned in assets/brand/README.md | ~~**Fixed**~~ | ~~`docs/logo-sources/tsp-logo.svg` trashed; provenance pinned by commit SHA in `assets/brand/README.md`~~ |
| ~~5.5 No visual verification~~ done — corroborated — the raster pass found the arrow-shaft gradient bug (ADR 0002) | ~~**Fixed**~~ | ~~The mark, both lockups, gallery card 57, the built header/footer marks and `dist/og/home.png` were rasterised and looked at. This found a real bug: the compact mark's arrow shaft painted nothing (zero-height bbox for an `objectBoundingBox` gradient)~~ |
| ~~5.6 Ragged generated markup~~ done — components regenerated with uniform indentation | ~~**Fixed**~~ | ~~Both `.astro` components are generator output with uniform indentation~~ |
| ~~5.7 Root gate not run~~ done — verify green through v1.2.0 (CI runs pnpm run verify) | ~~**Fixed**~~ | ~~`pnpm run verify` green: 1275 tests, 97.9% coverage, 0 clones~~ |
| ~~5.8 Unverified absolutes~~ done — regeneration + provenance recorded; trademark open by design (ADR 0002) | ~~**Partially fixed**~~ | ~~Regeneration command, palette and provenance are now recorded with pinned commits; the trademark posture stays open by design~~ |

Also fixed while verifying: both manifests had drifted to `typescript: 7.0.2` (and six other specifiers) without a lockfile regeneration, so `pnpm install --frozen-lockfile` — what CI runs — would have failed. Manifests were restored to the locked specifiers.

The single-source rule supersedes the handoff note above: edit `scripts/generate-brand-assets.ts`, run `pnpm run brand:generate`; `pnpm run brand:check` (in `verify`) fails on any drift. The three open questions (§8) are unchanged and remain blocking for favicon, horizontal lockup, and the npm surface.
