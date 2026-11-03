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

1. **Favicon.** Header/docs now show the pipeline marks; `website/public/favicon.svg` and the manifest icons are still the old teal squircle + chevrons. Two identities now coexist. Deliberate (a two-tile mark is mush at 16 px) but unresolved.
2. **The gallery is stale.** Card 57 renders the 160×100 draft (block 90 px wide, arrow at x=16, letter-spacing 2). The shipped lockup is 126×112 (block 88, arrow at x=20, tracking 1.5). Anyone opening the contact sheet sees the older design as "the pick".
3. **Provenance / attribution.** `docs/logo-sources/` holds trademarked artwork with no LICENSE/attribution file, no source URLs, no pinned commit SHAs.
4. **Visual QA.** I never looked at the header, the lockup on the page, or `/og/home.png`. "stddev ≈ 25 in the top strip" proves pixels exist, not that the composition is good.
5. **Formatting of the new files.** I did not verify treefmt cleanliness before declaring done — and when I finally ran it, I ran it incorrectly (see §5.1).
6. **npm rendering.** `<picture>` + `prefers-color-scheme` is safe on GitHub; npm's README renderer is untested. If it strips `<picture>`, the npm package page shows no logo at all.
7. **CHANGELOG entry** for a public-facing brand change.
8. **Page title inconsistency.** `docs/logo-concepts.html` says "50 logo concepts" while it holds 59 cards (50 + 9 experiments).

### 1.2 What could I have done better?

1. **Verified the brand source first.** I downloaded `icons/raw/tsp-logo.svg` believing it was the TypeSpec mark; it is the VS Code extension's "TSP" text tile. The real mark was in `website/public/img/favicon.svg`. The dead file is still committed.
2. **Read the formatter's flags before running them.** `-c` is `--clear-cache`, not "check"; `--fail-on-change` still wrote. AGENTS.md prescribes this exact command as a verification step — that documentation is now suspect.
3. **Not called a statistic "verified".** The OG card, header and lockup each deserved 10 seconds of actual looking.
4. **Generated clean code.** The two `.astro` components ship with ragged indentation (first AA polygon 6-space, rest 8-space) because a template literal concatenated pre-indented strings.
5. **Committed the generators.** Every asset was produced by throwaway `/tmp/*.mjs` scripts; nothing reproducible is in the repo.
6. **Held one palette.** The gallery uses a teal accent system (`--aa: #2DD4BF`); the shipped brand uses AsyncAPI's real gradient (`#2DCCFD → #A829E2 → #E50E99`). Two palettes, zero documentation of which wins.
7. **Tested the mark at its real size** (22 px in the header) before choosing it.

### 1.3 What can I still improve?

1. One brand-token source + a generator with a `--check` mode that fails CI when `assets/brand/*`, the two Astro components and the Starlight copy drift.
2. A favicon-scale harness (16/24/32/48) as a mandatory gate for any brand change.
3. Screenshot-based visual regression for `/`, `/og/home.png`, docs header, light + dark.
4. A horizontal lockup, PNG fallbacks, and a GitHub social preview.
5. Fix the treefmt exclude/check story so "verification" cannot mutate the repo.

---

## 2. a) FULLY DONE (verifiable)

| #  | Item                                                                                                                                                                                                                                                                                                                                    | Evidence                                                                                                                                                                |
| -- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | **Logo contact sheet** `docs/logo-concepts.html` — 59 cards (50 original concepts + 5 literal merges + 4 pipeline lockups), fully self-contained (Space Grotesk 400/700 + JetBrains Mono 400 embedded as base64, 148 077 bytes / 851 lines)                                                                                             | `html-validate` exit 0; 0 duplicate SVG ids; commit `f70feeb9` chain                                                                                                    |
| 2  | **Interactive review surface** — Dark / Light / Checker tile toggle, global motion pause (auto-off under `prefers-reduced-motion`), 5 canvas marks drawn from seeded RNG, 1 rAF animation                                                                                                                                               | gallery JS parses (`new Function`, 166 lines); manual code review                                                                                                       |
| 3  | **Official marks sourced verbatim** — `docs/logo-sources/asyncapi-mark.svg` (asyncapi/brand, mark/primary), `docs/logo-sources/typespec-mark.svg` (microsoft/typespec `website/public/img/favicon.svg`)                                                                                                                                 | downloaded via `gh api`, committed                                                                                                                                      |
| 4  | **Section E — literal merges 51–55** using the official path data (lockup, gradient bridge, stacked double, diagonal splice, favicon stress 16/24/32/48)                                                                                                                                                                                | rendered in gallery, ids unique                                                                                                                                         |
| 5  | **Section F — pipeline lockups 56–59** ("46's idea × official marks"); you selected **57**                                                                                                                                                                                                                                              | rendered in gallery                                                                                                                                                     |
| 6  | **Lockup v2 shipped** — `assets/brand/lockup-dark.svg` + `lockup-light.svg` (126×112): 8-unit vertical rhythm, 30 px tiles, drawn arrow (no text glyph), 88 px emit block with symmetric padding, cropped canvas (was 160×100 with dead space), official brand casing (`TypeSpec` / `AsyncAPI`), `<title>` for a11y, no version strings | `svgo` parse OK; ImageMagick content bbox **115×100 @ +6+6**                                                                                                            |
| 7  | **Compact mark shipped** — `assets/brand/mark.svg` (72×36, background-agnostic, input→output arrow)                                                                                                                                                                                                                                     | `svgo` OK; content bbox **72×26 @ +0+5**                                                                                                                                |
| 8  | **OG raster asset** — `website/public/brand-mark.png` 440×220 RGBA (CanvasKit cannot decode SVG)                                                                                                                                                                                                                                        | `identify`: `channels=srgba opaque=False`; logo pixels confirmed in built card (top-strip σ ≈ 25)                                                                       |
| 9  | **README hero** — `<picture>` with `prefers-color-scheme`, absolute `raw.githubusercontent` URLs (npm renders README outside the repo), 170×151 display                                                                                                                                                                                 | committed in `c9c1ffe4`                                                                                                                                                 |
| 10 | **Landing header** — `Logo.astro` rewritten to the compact mark (44×22), Header updated                                                                                                                                                                                                                                                 | in `dist/index.html` (`taa-mark-aa` present)                                                                                                                            |
| 11 | **"How it works" section** — new `PipelineLockup.astro`, theme-aware (`currentColor` caption), height 100                                                                                                                                                                                                                               | in `dist/index.html` (`taa-lockup-aa`, `text-text-primary`, `fill="currentColor">TypeSpec<`)                                                                            |
| 12 | **Docs header** — Starlight `logo` option + `website/src/assets/brand-mark.svg` copy                                                                                                                                                                                                                                                    | `brand-mark` referenced in built docs pages                                                                                                                             |
| 13 | **OG cards** — `logo: { path: "./public/brand-mark.png", size: [220, 110] }` in `src/pages/og/[...slug].ts`                                                                                                                                                                                                                             | all 25 `/og/*.png` routes built, `og/home.png` 1200×630                                                                                                                 |
| 14 | **Website gate green**                                                                                                                                                                                                                                                                                                                  | `astro check` + build **22 pages**, `links: 798 internal references … valid`, `csp: 22 pages carry a valid, hash-covered policy`, html-validate silent, CSP patch 22/22 |
| 15 | **Memory updated** — AGENTS.md brand-system bullet (asset inventory, regeneration command, favicon decision, font-fallback rationale)                                                                                                                                                                                                   | commit chain                                                                                                                                                            |

---

## 3. b) PARTIALLY DONE (works, but with gaps)

| # | Item                           | What works                                  | What remains                                                                   | Effort               |
| - | ------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------ | -------------------- |
| 1 | **Gallery ↔ shipped identity** | 59 cards render and validate                | Card 57 still shows the 160×100 draft; no "shipped" badge; page title says 50  | S                    |
| 2 | **Icon system**                | header/docs/OG use the new mark             | favicon + manifest icons still the legacy teal squircle → split identity       | S–M (needs decision) |
| 3 | **OG card composition**        | builds, logo present, correct dimensions    | nobody has looked at it; logo/title spacing and balance unverified             | S                    |
| 4 | **README rendering**           | GitHub-safe markup, absolute URLs           | npm's renderer untested; `<picture>` may be stripped there                     | S–M                  |
| 5 | **Provenance**                 | sources named in AGENTS.md                  | no `assets/brand/README.md` with URLs + trademark note; no commit SHA pinning  | S                    |
| 6 | **Formatter compliance**       | site + assets verified functionally         | new `.astro` files have ragged indentation; treefmt behavior unverified (§5.1) | S                    |
| 7 | **Light-mode QA**              | `currentColor` wiring verified in HTML      | contrast of gradient caption / block on light theme not eyeballed              | S                    |
| 8 | **Title/count consistency**    | counts line says "+9 official-mark lockups" | `<title>`/H1 still says "50 logo concepts"                                     | S                    |

---

## 4. c) NOT STARTED

1. **Horizontal lockup** (tiles → arrow → tiles + wordmark) for banners, social previews, npm avatar.
2. **16 px-optimized favicon** + PNG icon set (16/32/180 apple-touch) + `manifest.json` icon entries.
3. **Raster lockups** (dark/light PNG @2×) for renderers that reject SVG or `<picture>`.
4. **Trademark-safe primary mark path** — shipping our own synthesized mark (concept 25 Outline Mark or 50 Lockup) instead of derivatives, if that becomes the preference.
5. **Brand generator with `--check`** — one definition → `assets/brand/*`, `Logo.astro`, `PipelineLockup.astro`, `website/src/assets/brand-mark.svg`, `brand-mark.png` + drift detection.
6. **Motion variant** — emit-arrow pulse / traveling dash in the hero (site already has animation + reduced-motion infrastructure).
7. **Image-AI exploration** you floated — never attempted (argued against on vector/legibility grounds); zero raster concepts were produced as evidence.
8. **Gallery curation** — finalist markers, shortlist/filter mode, favicon-safety flags.
9. **CHANGELOG entry** for the brand change.
10. **GitHub repo social preview** (1280×640) built from the lockup.
11. **Visual regression harness** (screenshot diff) for brand surfaces.
12. **Forced-colors / high-contrast support** (`forced-color-adjust`, currentColor fallbacks in static SVGs).
13. **Dead-artifact cleanup** — `docs/logo-sources/tsp-logo.svg` (extension tile, unused).
14. **LICENSE/attribution file** for `docs/logo-sources/` (Microsoft / AsyncAPI Initiative trademarks).
15. **treefmt exclude fix** — `docs/**/*.html` did not protect the gallery; decide `docs/planning/**`, `docs/analysis/**`, `website/IMPROVEMENTS.md`.
16. **Release-checklist item** — verify npm README rendering after next publish.

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

1. **Verify the brand source before designing.** The real TypeSpec mark was in the site's own favicon, not a repo `icons/` folder. One `view` would have saved a dead artifact.
2. **Make brand assets generated, not hand-mirrored.** Today: 1 source per artifact × 5 artifacts (assets, 2 components, Starlight copy, PNG). Add `scripts/brand/` + `--check` mode wired into `nix flake check`.
3. **Screenshot before "done".** Brand work without eyes on pixels is guesswork; the stddev check is a smoke test, not QA.
4. **Resolve the palette split-brain.** Gallery teal accent vs official AsyncAPI gradient — pick one as `--brand-*` tokens and derive everything.
5. **Static-SVG font policy.** SVG-as-image cannot load webfonts; we ship a fallback stack. Document the tradeoff and decide whether captions should be outlined paths for renderer parity.
6. **Treat "verification" commands as dangerous.** Add to AGENTS: how to check formatting without writing (`treefmt --ci` or `nix flake check` in a clean tree), and fix the html exclude.
7. **Name artifacts consistently** (`mark.svg` vs `brand-mark.svg` vs `lockup-dark.svg` — one prefix scheme).
8. **Stop shipping throwaway generators.** Every `/tmp/*.mjs` from this session should have been `scripts/brand/*.mjs` with a README line.
9. **Close the status-report loop.** §7 (f) must be harvested into `TODO_LIST.md`/`ROADMAP.md` (docs-health HARVEST) — not left entombed here.
10. **Pin one-off tooling.** `npx -y sharp-cli` / `svgo` bypass the repo's pinned-devtool rule. ImageMagick (`magick`/`identify`) is already present; prefer it, or add pinned devDeps.

---

## 7. f) Up to 50 next tasks (ranked by impact)

| #  | Task                                                                                              | Impact   | Effort | Category      |
| -- | ------------------------------------------------------------------------------------------------- | -------- | ------ | ------------- |
| 1  | Fix treefmt: verify correct check invocation, repair `docs/**/*.html` exclude, document in AGENTS | Critical | S      | Tooling       |
| 2  | Decide favicon direction (legacy teal vs new 16 px mark) and implement icons/manifest             | Critical | S–M    | Brand         |
| 3  | Decide trademark posture (derivative lockup vs own synthesized mark) and record an ADR            | Critical | S      | Legal/Docs    |
| 4  | Refresh gallery card 57 to the shipped v2 geometry + "shipped" badge                              | High     | S      | Cleanup       |
| 5  | Screenshot-QA `/og/home.png`, `/`, docs header in light + dark; fix spacing if wrong              | High     | S      | Quality       |
| 6  | Add `assets/brand/README.md`: sources, URLs, trademark note, regeneration command                 | High     | S      | Documentation |
| 7  | Verify npm README rendering of `<picture>`; add PNG/`<img>` fallback if broken                    | High     | S–M    | Quality       |
| 8  | Build the brand generator with `--check` (single definition → 5 artifacts)                        | High     | M      | Tooling       |
| 9  | Decide brand palette tokens (official gradient vs site teal) and wire into website config         | High     | S      | Design        |
| 10 | Hide/delete `docs/logo-sources/tsp-logo.svg`; rename with provenance                              | Medium   | S      | Cleanup       |
| 11 | Normalize generated `.astro` indentation                                                          | Medium   | S      | Quality       |
| 12 | Generate dark/light PNG lockups (@2×) for SVG-hostile renderers                                   | Medium   | S      | Quality       |
| 13 | Design horizontal lockup for banners/social/npm                                                   | Medium   | M      | Design        |
| 14 | Produce GitHub social preview (1280×640) from the lockup                                          | Medium   | S      | Branding      |
| 15 | Add 180×180 apple-touch + 32×32 PNG icons and manifest entries                                    | Medium   | S      | Branding      |
| 16 | Retitle gallery to "50 concepts + 9 official-mark experiments"                                    | Low      | S      | Cleanup       |
| 17 | Add CHANGELOG entry for the identity change                                                       | Low      | S      | Documentation |
| 18 | Add motion variant of the emit arrow (reduced-motion aware) to the hero                           | Low      | M      | Feature       |
| 19 | Add `forced-colors` / high-contrast handling to inline SVGs                                       | Low      | S      | A11y          |
| 20 | Outline lockup captions to paths for renderer parity (optional)                                   | Medium   | M      | Quality       |
| 21 | Add screenshot visual-regression tests for brand surfaces                                         | Medium   | L      | Testing       |
| 22 | Confirm Starlight logo height/alignment in docs header (both themes)                              | Medium   | S      | QA            |
| 23 | Verify compact mark legibility at 22 px; adjust or switch to single-tile variant if weak          | Medium   | S      | QA            |
| 24 | Curate the 59 cards: mark finalists, drop weak marks                                              | Medium   | S      | Cleanup       |
| 25 | Add shortlist/favicon-safety filter to the gallery                                                | Low      | M      | Feature       |
| 26 | Document README asset policy (absolute raw URLs + picture) in CONTRIBUTING                        | Low      | S      | Docs          |
| 27 | Add brand tokens to `website/src/data/config.ts`                                                  | Medium   | M      | Quality       |
| 28 | Re-verify shipped choice vs concept 52 (Gradient Bridge) in light of v2                           | Low      | S      | Design        |
| 29 | Add `brand:check` npm script (artifact existence + geometry hash compare)                         | Low      | M      | CI            |
| 30 | Add release-checklist item for npm README verification                                            | Medium   | S      | Release       |
| 31 | Add favicon-scale card to the gallery for the final mark                                          | Low      | S      | Design        |
| 32 | Remove gallery's cross-card filter reuse (card 58 borrows card 19's `m19f`)                       | Low      | S      | Cleanup       |
| 33 | Add `aria-live` for background toggle state in the gallery                                        | Low      | S      | A11y          |
| 34 | Pause the pulse canvas on `visibilitychange` / IntersectionObserver                               | Low      | S      | Perf          |
| 35 | Add `prettier-plugin-astro` (or explicit exclude) so `.astro` formatting is defined               | Low      | M      | Tooling       |
| 36 | Add brand-asset check to `nix flake check` (parse + bbox assertions)                              | Medium   | M      | CI            |
| 37 | Write "when to use lockup vs mark vs wordmark" usage note                                         | Low      | S      | Docs          |
| 38 | Decide whether `assets/brand` ships in the npm package or stays repo-only                         | Low      | S      | Packaging     |
| 39 | Verify README on GitHub dark/light (picture media query)                                          | Medium   | S      | QA            |
| 40 | Add OG dark/light variant strategy (og-canvas supports one logo)                                  | Low      | M      | Feature       |
| 41 | Audit alt text on all new SVG surfaces                                                            | Low      | S      | A11y          |
| 42 | Automate `brand-mark.png` regeneration in a committed script                                      | Medium   | S      | Tooling       |
| 43 | Add provenance SHA pinning for downloaded official assets                                         | Low      | S      | Documentation |
| 44 | Decide exclusion policy for `docs/planning/**`, `docs/analysis/**`, `website/IMPROVEMENTS.md`     | Medium   | S      | Tooling       |
| 45 | Run root `pnpm run verify` once to close the unverified-gate gap                                  | Low      | M      | Quality       |
| 46 | Evaluate ImageMagick `magick` for all rasterization (drop npx sharp-cli)                          | Low      | S      | Tooling       |
| 47 | Add example markdown snippet showing how to embed the lockup elsewhere                            | Low      | S      | Docs          |
| 48 | Review auto-commit daemon noise (9 heuristic commits this session)                                | Low      | S      | Process       |
| 49 | Add "brand source verification" step to the design workflow notes                                 | Low      | S      | Process       |
| 50 | Archive this session's decisions into `docs/adr/` (identity + asset strategy)                     | High     | S      | Docs          |

---

## 8. g) Questions I cannot answer myself (max 3)

1. **Trademark posture.** Should the project's primary identity be a **derivative lockup of the official TypeSpec + AsyncAPI marks** (what shipped), or should the **official marks stay documentation-only** and our own synthesized mark (concept 25 Outline Mark / 50 Lockup) become primary? I can implement either; I cannot decide the legal/positioning risk appetite. _(Blocks tasks 3, 13, 14, 50.)_
2. **Favicon direction.** Keep the **legacy teal squircle** (recognizable, 16 px-safe, but a different visual system), or invest in a **16 px-optimized single-tile mark** — and if so, which glyph: gradient arrow, AsyncAPI "A", TSP, or our hex-bolt? _(Blocks tasks 2, 15, 23.)_
3. **npm/PyPI surface requirement.** Is **GitHub fidelity sufficient**, or must npm's package page also render the logo? If yes, I will ship raster PNG lockups and a `<img>`-first structure instead of relying on `<picture>`. _(Blocks tasks 7, 12, 30.)_

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
| 5.1 `nix fmt` rewrote 9 files             | **Fixed**           | `nix build .#checks.x86_64-linux.format` passes; `AGENTS.md` now states `nix fmt` always rewrites and `-c` means `--clear-cache`                                                                                                                          |
| 5.2 `docs/**/*.html` exclusion inert      | **Fixed**           | Root cause proven with the real treefmt 2.6.0 binary on a scratch tree: the glob needs a separator, so `docs/x.html` was never matched; `docs/*.html` added, plus `docs/planning/**` and `docs/analysis/**`                                               |
| 5.3 Gallery stale                         | **Fixed**           | Card 57 is now the shipped 126 × 112 lockup (copied from `lockup-dark.svg`) and carries a `shipped` chip                                                                                                                                                  |
| 5.4 Wrong TypeSpec asset downloaded first | **Fixed**           | `docs/logo-sources/tsp-logo.svg` trashed; provenance pinned by commit SHA in `assets/brand/README.md`                                                                                                                                                     |
| 5.5 No visual verification                | **Fixed**           | The mark, both lockups, gallery card 57, the built header/footer marks and `dist/og/home.png` were rasterised and looked at. This found a real bug: the compact mark's arrow shaft painted nothing (zero-height bbox for an `objectBoundingBox` gradient) |
| 5.6 Ragged generated markup               | **Fixed**           | Both `.astro` components are generator output with uniform indentation                                                                                                                                                                                    |
| 5.7 Root gate not run                     | **Fixed**           | `pnpm run verify` green: 1275 tests, 97.9% coverage, 0 clones                                                                                                                                                                                             |
| 5.8 Unverified absolutes                  | **Partially fixed** | Regeneration command, palette and provenance are now recorded with pinned commits; the trademark posture stays open by design                                                                                                                             |

Also fixed while verifying: both manifests had drifted to `typescript: 7.0.2` (and six other specifiers) without a lockfile regeneration, so `pnpm install --frozen-lockfile` — what CI runs — would have failed. Manifests were restored to the locked specifiers.

The single-source rule supersedes the handoff note above: edit `scripts/generate-brand-assets.ts`, run `pnpm run brand:generate`; `pnpm run brand:check` (in `verify`) fails on any drift. The three open questions (§8) are unchanged and remain blocking for favicon, horizontal lockup, and the npm surface.
