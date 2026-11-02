# ADR: Brand identity and the single-source asset pipeline

**Status:** Proposed (interim implementation shipped)
**Date:** 2026-11-02

## Context

The project had no visual identity: a teal squircle-with-chevrons in the site
header, no README artwork, and no rule for how a mark should be produced or
kept in sync. 59 candidate concepts were drawn in `docs/logo-concepts.html`
(including five literal merges of the official marks and four pipeline
lockups), and concept 57 — "Annotated Pipeline": TypeSpec tile → `→ EMITS`
block → AsyncAPI tile — was chosen and shipped on the website, the README, the
Open Graph cards, and the Starlight header.

Two facts constrain the decision:

1. **The shipped mark is derivative.** Both tiles are official artwork
   (AsyncAPI `asyncapi/brand`, TypeSpec `microsoft/typespec`), not original
   design. Using them as the project's primary identity is a positioning and
   trademark question, not just a design one.
2. **The same geometry was copied into six places** by hand (two lockup
   variants, the compact mark, the Starlight copy, and two Astro components).
   The copies had already drifted, and one of them lost its arrowhead shaft to
   a gradient bug that no text-based check could see.

## Decision

**Interim (implemented, reversible):**

1. Ship the derivative pipeline lockup as the identity for the website and the
   README, with attribution and provenance recorded in `assets/brand/README.md`.
2. Treat one TypeScript geometry definition as the only source of truth.
   `scripts/generate-brand-assets.ts` emits all six artifacts; `pnpm run
   brand:check` is part of `pnpm run verify` and fails on any byte drift.
3. Keep `assets/brand/` out of the npm package (`package.json` `files` lists
   only `CHANGELOG.md`, `LICENSE`, `README.md`, `dist/`, `lib/`). The README
   therefore references absolute `raw.githubusercontent.com` URLs through a
   `prefers-color-scheme` `<picture>`.
4. Keep the SVG sources authoritative and rasterise only where a renderer
   cannot decode SVG (Open Graph cards), via `website/scripts/render-brand-png.mjs`
   with a pinned `sharp`.

**Explicitly not decided yet** (each blocks work; do not silently pick one):

| Open question | Blocks |
| --- | --- |
| Trademark posture: is a derivative lockup acceptable as the primary identity, or must the official marks stay documentation-only with an original synthesized mark (concept 25 / 50) as primary? | Horizontal lockup, social preview, ADR acceptance |
| Favicon: keep the legacy teal squircle, or a 16 px-optimised single tile (and which glyph)? | apple-touch icons, web manifest, favicon QA |
| npm surface: is GitHub-level fidelity enough, or must the npm package page render the mark natively? | shipping raster lockups, README structure, release checklist |

## Rationale

- **One generator, not six copies.** Geometry drift is silent until someone
  looks; a byte-comparing check in `verify` makes it loud for free.
- **Provenance is cheap and load-bearing.** Pinned source commits and a
  statement that the marks belong to their owners is the minimum defensible
  posture while the trademark question is open.
- **Rasterise late.** SVG for every surface that can render it; PNG only for
  CanvasKit, and produced by a committed script rather than an ad-hoc one.
- **Reversible.** If the trademark answer is "own mark only", the generator
  swaps the tiles in one place and every surface follows.

## Consequences

- Editing any brand file now means editing the generator; a hand edit fails
  `pnpm run brand:check`.
- The Astro components carry a `GENERATED FILE` banner and expose `id` /
  `decorative` props, so a page can render the mark twice without duplicate SVG
  gradient ids (the previous markup shipped duplicate ids on every page).
- The gallery card 57 is a point-in-time snapshot of the shipped lockup; it is
  refreshed by copying the generated `lockup-dark.svg`, not by hand-drawing.
- Open Graph cards show one logo only; there is no dark/light OG variant yet.
- npm's readme sanitizer behaviour is reasoned, not verified: `<picture>` is
  expected to be stripped with its `<img>` child kept. Re-check after the next
  publish.
