# typespec-asyncapi website

The public documentation site for `typespec-asyncapi`, live at <https://typespec-asyncapi.lars.software>.

## Stack

- **Astro 7** with **Starlight** for documentation
- **Tailwind CSS v4** for the landing page
- **astro-og-canvas** for per-page Open Graph images
- **Firebase Hosting** (target `typespec-asyncapi` in the shared `lars-software` project)

## Commands

Run inside `nix develop .#default` (or with `nix shell nixpkgs#nodejs`):

```bash
pnpm install
pnpm run dev          # local dev server
pnpm run build        # sync stats → build → CSP patch
pnpm run typecheck    # astro check
pnpm run check        # typecheck + build + HTML validation + link check
pnpm run preview      # serve the production build
```

`pnpm run build` runs `scripts/sync-stats.mjs` first. It reads the repository root (`package.json`, `lib/main.tsp`, `src/lib.ts`, `src/constants/`) and rewrites `src/data/stats.ts`, so version, decorator, protocol, binding, diagnostic, and example counts cannot drift from the source.

## What is checked

- `pnpm run typecheck` — Astro and TypeScript diagnostics, zero errors.
- `pnpm run check:html` — `html-validate` over every built page.
- `pnpm run check:links` — every internal `href`/`src` resolves to a built file, and required artifacts (`llms.txt`, `sitemap-index.xml`, `404.html`, `security.txt`) exist.
- CI runs the same `pnpm --filter typespec-asyncapi-website run check` step after the emitter gate.

## Layout

```text
src/
  components/        landing page sections and shared UI
  content/docs/      Markdown documentation (Starlight collection)
  data/              landing page content + generated stats
  pages/             landing, search, llms.txt endpoints, OG images
  styles/            global landing CSS + Starlight overrides
public/
  js/                small progressive-enhancement scripts (theme, nav, copy, animation)
  .well-known/       security.txt
  manifest.json      web app manifest
scripts/
  sync-stats.mjs     repository → src/data/stats.ts
  check-links.mjs    internal reference checker
  fix-csp.mjs        strips CSP style hashes so inline styles keep working
```

## Deploying

One command from anywhere in the repo:

```bash
nix run .#deploy-website
```

The flake app finds the repo root, builds this site, checks internal links, and deploys `hosting:typespec-asyncapi` to the `lars-software` project. Useful overrides:

| Env var / arg                | Effect                                                    |
| ---------------------------- | --------------------------------------------------------- |
| `FIREBASE_TARGET=<channel>`  | deploy a preview channel instead of the production target |
| `FIREBASE_PROJECT=<project>` | deploy to another Firebase project                        |
| `SKIP_CHECK=1`               | skip the internal link check before deploy                |
| `-- <flags>`                 | forwarded to `firebase deploy`                            |

Equivalent manual form, if you need it: `nix shell nixpkgs#nodejs -c pnpm run build` then `nix shell nixpkgs#nodejs nixpkgs#firebase-tools -c firebase deploy --only hosting:typespec-asyncapi --project lars-software`, run from `website/` (the Firebase CLI rejects the repo root — `firebase.json` lives here).

Firebase config lives in `firebase.json`; `trailingSlash: true` matches Astro's canonical URLs (every generated page URL ends in `/`), so internal navigation does not take a 301 hop.
