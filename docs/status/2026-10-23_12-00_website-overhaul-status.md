# Website Overhaul Status - 2026-10-23 12:00 CEST

**Project:** `typespec-asyncapi`
**Scope:** `website/` (landing page + Starlight docs + hosting config + CI)
**Session:** website audit, 140-idea backlog, implementation pass, verification
**Current state:** build and website gate are green; changes are staged but not committed or deployed.

> **Update (annotation, 2026-10-23 12:45):** deployed to `hosting:typespec-asyncapi` with `firebase deploy --only hosting:typespec-asyncapi --project lars-software` (110 files in `dist`). Live route matrix on `typespec-asyncapi.lars.software` verified: `/` 200, `/getting-started/installation/` 200, `/getting-started/installation` 301 → trailing slash, `/search/` 200, `/llms.txt` 200, `/llms-full.txt` 200, `/rss.xml` 200, `/sitemap-index.xml` 200, `/.well-known/security.txt` 200, `/manifest.json` 200, `/opensearch.xml` 200, `/humans.txt` 200, `/docs` 301 → `/getting-started/installation/`, `/nonexistent` 404 with `robots noindex` + `data-pagefind-ignore`. Root `pnpm run verify` re-run after deploy: 1275 tests / 105 files pass, coverage gate 97.9% average, 0 jscpd clones.

> **Update (annotation, 2026-10-23 13:10):** fixed the Shiki/CSP build warning, which exposed a real bug. `scripts/fix-csp.mjs` stripped hashes with `/style-src[^;"]*/`, which also matched the `style-src-attr` prefix and emitted the invalid directive `style-src -attr`; browsers ignore it, so every inline `style` attribute (all Expressive Code token colors, Starlight icon sizes) would have been blocked had the split existed earlier. The policy is now scoped deliberately: `style-src 'self' <hashes>` for inline `<style>` elements, `style-src-attr 'unsafe-inline'` for attributes (CSP cannot hash/nonce attributes), `script-src` hash-only. `fix-csp.mjs` no longer touches style directives and is idempotent about script hashes; `scripts/check-csp.mjs` (wired into `pnpm run check` and CI) fails on malformed directive names, `'unsafe-inline'` in `script-src`/`style-src`, a missing `style-src-attr`, or any inline block without a hash. Two expected upstream warnings are filtered by `website/astro-logger.mjs`; the custom 404 now actually renders (needed `starlight({ disable404Route: true })`). Also fixed while verifying: `website/package.json` had drifted back to TypeScript `^7.0.2`, which makes `astro check` abort the whole gate, and the nix devShell/deploy app pinned `nodejs_22` (22.23.3) which Astro 7.4.2 rejects — both now on TS 6.0.3 and Node 24. Re-deployed via `nix run .#deploy-website`; live pages serve `style-src 'self' <hashes>; style-src-attr 'unsafe-inline'`, gate green (778 links, CSP 22/22 pages), root verify green on Node 24.

---

## 0. Evidence and verification

Commands run in this session:

```bash
cd website
nix shell nixpkgs#nodejs -c pnpm run typecheck   # 0 errors, 1 deprecation hint
nix shell nixpkgs#nodejs -c pnpm run build       # 22 pages, CSP patched 22/22
nix shell nixpkgs#nodejs -c pnpm run check:html  # exit 0
nix shell nixpkgs#nodejs -c pnpm run check:links # 778 refs across 22 pages valid
nix shell nixpkgs#nodejs -c pnpm run check       # entire gate green
nix shell nixpkgs#nodejs -c node scripts/sync-stats.mjs # 30 decorators, 22 protocols, 19 bindings, 36 diagnostics, 15 examples
nix shell nixpkgs#nodejs -c pnpm exec astro preview stop # stopped a daemon I had left running
```

Additional checks:

- `firebase.json` and `public/manifest.json` parse as valid JSON.
- `public/og.png` is 1200x630, 298 KB.
- `dist/og/*.png` generated for every docs page; sampled `examples.png` is 1200x630, 57 KB.
- `sync-stats.mjs` is deterministic (`git diff --exit-code` clean on a second run).
- Live site checks before the pass found every docs URL returning a 301 from `/foo/` to `/foo`, so canonicals and sitemap entries were pointing at redirecting URLs.
- Preview server returned 200 for `/`, `/search/`, `/examples/`, `/faq/`, `/llms.txt`, `/llms-full.txt`, `/404.html`, `/pagefind/pagefind.js`, `/sitemap-index.xml`, `/.well-known/security.txt`.

Backlog status (`website/IMPROVEMENTS.md`):

| Status    |   Count |
| --------- | ------: |
| Done      |      59 |
| Next      |      42 |
| Later     |      34 |
| Decision  |       5 |
| **Total** | **140** |

---

## A) FULLY DONE

### 1. Audit and diagnosis

- Read the landing page, all 15 landing components, both stylesheets, the docs collection, `astro.config.mjs`, `firebase.json`, `.htmlvalidate.json`, all client scripts, the CSP patcher, and the OG route.
- Read every docs page and checked the sidebar, frontmatter, callouts, and "Where to go next" coverage.
- Built the site before changes to get a clean baseline.
- Fetched the live site and compared deployed copy with the repository.
- Found and fixed factual drift: 30 vs 36 diagnostics, 13 vs 15 examples, 1259 vs 1275 tests, "August 2026" comparison date.
- Found the quick-start `@server` example was invalid: it decorated an operation and used newline-separated `#{}` members.
- Found a 301 redirect on every docs link because Firebase used `trailingSlash: false` while Astro/Starlight canonicals and sitemap used `/foo/`.

### 2. Single source of truth for counts

- Added `website/scripts/sync-stats.mjs`.
- It reads `package.json`, `lib/main.tsp`, `src/lib.ts`, `src/constants/protocols.ts`, `src/constants/generated-bindings.ts`, and `examples/`.
- It writes `website/src/data/stats.ts` (version, decorators, protocols, bindings, diagnostics, examples).
- Wired it into `pnpm run build`.
- Excluded the generated file from treefmt to prevent formatter/generator ping-pong.
- Landing copy and feature cards now import from it.

### 3. Docs correctness

- Rewrote quick-start step 4 so `@server` targets the namespace and `#{}` members use commas.
- Added "When not to use it" and the TypeSpec 1.15 requirement to Installation.
- Corrected Contributing to 1,275 tests / 105 files and 15 examples.
- Added release highlights for 1.1.0 and 1.0.0 and an examples row to the changelog status table.
- Expanded the Related Tools comparison table and linked it from the landing comparison.
- Added FAQ, Examples, Architecture, and Migration Guide pages.
- Added all four to the sidebar.
- Added "Where to go next" links to the new pages.

### 4. SEO and metadata

- Added per-page OG frontmatter for every docs page, pointing at the generated `/og/<slug>.png` images.
- Added OG image type, width, height, alt, locale, and site name to the landing page.
- Added `twitter:site`, `twitter:creator`, `twitter:image`, and `twitter:image:alt`.
- Added an explicit robots policy.
- Added `rel=sitemap`, `rel=search` (OpenSearch), `rel=alternate` (`llms.txt`), and RSS discovery links.
- Added a JSON-LD `@graph`: `WebSite`, `SoftwareApplication`, `Person`, and a `SearchAction`.
- Added `website/src/pages/llms.txt.ts` and `llms-full.txt.ts` generated from the docs collection; 404 is filtered out.
- Added `website/src/pages/rss.xml.ts` generated from the root `CHANGELOG.md`.
- Added `public/opensearch.xml`.
- Added `public/.well-known/security.txt` and `public/humans.txt`.
- Expanded `public/manifest.json` with id, scope, language, categories, maskable icon, and shortcuts.
- Added `Disallow: /search/` to robots and excluded `/search/` from the sitemap.

### 5. Search, 404, and navigation

- Added `website/src/pages/search.astro` with Pagefind search, query-string support (`?q=`), debounced input, result excerpts, result count, and a no-JS fallback.
- Added a branded Starlight 404 (`src/content/docs/404.md`) with search and popular destinations; removed the conflicting `src/pages/404.astro`.
- Reworked the header breakpoints so the nav and toggle no longer both appear at tablet widths.
- Added Escape, outside-click, resize, and link-click closing for the mobile menu, with focus return.
- Added a search link to the landing header.
- Added Examples and FAQ links to the landing header.
- Added a footer nav and version display.

### 6. Accessibility, progressive enhancement, and interaction

- Fixed the invisible-content failure mode: sections are hidden only when `html.js` is present.
- Fixed reduced motion: the `js` class is now always added, and the reduced-motion rule wins over the fade-in animation.
- Added a skip link (already present) and kept it.
- Added visible focus styles for docs and landing.
- Raised section subtitle contrast from muted to secondary.
- Added `scope` attributes to comparison table headers.
- Added a mobile card layout for the comparison table.
- Added real copy buttons for the hero install command, hero code, and both showcase panes, with a `navigator.clipboard` path and a legacy fallback.
- Removed `ClientRouter` from the one-page landing layout; it added SPA machinery without a same-layout destination and made inline scripts fragile.
- Moved the animations script inside `<body>`; it previously rendered after `</html>`.
- Corrected theme-color values in `header.js` to the actual CSS background values.

### 7. Hosting, caching, and CI

- Set `firebase.json` to `trailingSlash: true`, matching Astro canonicals, sitemap entries, and internal links.
- Added `frame-ancestors 'none'` as a real CSP header.
- Added cache headers for `pagefind/**` and `**/*.@(json|xml|txt)`.
- Removed `"**/.*"` from the Firebase ignore list so `.well-known/security.txt` can deploy.
- Added `'wasm-unsafe-eval'` to the CSP script directive for Pagefind.
- Added `pnpm run check:html`, `pnpm run check:links`, and `pnpm run check`.
- Added `website/scripts/check-links.mjs`; it validates 778 internal refs and required artifacts.
- Added the website gate to `.github/workflows/ci.yml`.
- Added `website/README.md` with commands, layout, and deploy instructions.
- Updated `AGENTS.md` with the website gate, generated stats, trailing-slash rule, and formatter exclusion.

---

## B) PARTIALLY DONE

| Item                      | What is done                                                           | What is missing                                                                                                 |
| ------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Search                    | Page is built, Pagefind index is generated, query flow is typechecked. | No real browser test. The WASM/`pagefind.js` runtime and CSP behavior are unverified in Chrome/Firefox/Safari.  |
| Firebase trailing slash   | Config is consistent with Astro canonicals, sitemap, and links.        | Not tested against Firebase Hosting or emulator. Redirect behavior for `/docs/*` and legacy URLs is unverified. |
| `security.txt` deployment | File exists in `dist` and `check-links` requires it.                   | Not verified that Firebase uploads the dot-directory after removing `**/.*`.                                    |
| Per-page OG images        | Generated for all docs and referenced in frontmatter.                  | 404 has no OG image; visual quality of each generated card was not inspected.                                   |
| Accessibility             | Static contrast, focus, ARIA, reduced-motion, and no-JS fixes landed.  | No axe-core/pa11y/Lighthouse run. No screen-reader or keyboard-only pass.                                       |
| Performance               | Static asset cache rules and Pagefind cache rules added.               | No Lighthouse budget, bundle report, or image compression. Static `og.png` is still 298 KB.                     |
| CI                        | Website gate added to workflow.                                        | It has not run on GitHub. Root `pnpm run verify` and `nix flake check` were not run.                            |
| Comparison honesty        | The docs-site gap is acknowledged in Related Tools prose.              | It is not a row in the landing comparison and not backed by a dated source.                                     |
| `rss.xml`                 | Feed builds from the real changelog with escaped XML.                  | Descriptions contain raw Markdown; links point at GitHub anchors, not a local release page.                     |
| `llms-full.txt`           | Full docs corpus is generated.                                         | Whitespace is bloated (multiple blank lines) and there is no section index or size cap.                         |
| Backlog                   | 140 ideas written and statused.                                        | 81 remain not done; 5 need a product decision.                                                                  |

---

## C) NOT STARTED

- Demo video render and embed (the HyperFrames project exists but no MP4 is in `public/`).
- FAQPage, HowTo, TechArticle, and BreadcrumbList structured data.
- axe-core / pa11y / Lighthouse CI.
- Playwright browser tests for nav, theme, copy, and search.
- Visual regression screenshots.
- Generated decorator, diagnostic, and emitter-option references from source.
- Versioned docs and a version selector.
- TypeDoc API reference.
- Command palette / Cmd-K on the landing page.
- Interactive playground or StackBlitz embed.
- "Copy page as Markdown".
- Package-manager tabs in install snippets.
- "Was this page helpful?" widget.
- Preview-channel deploys on pull requests.
- Post-deploy smoke test.
- External-link monitoring.
- cspell/markdownlint.
- PNG app icons and `apple-touch-icon`.
- Service worker / offline docs.
- Analytics or privacy-friendly measurement.
- Social image compression.
- Image sitemap entries.
- `hreflang` and localization.
- Community links (Discussions, social, contributor wall, case studies).

---

## D) TOTALLY FUCKED UP

These are the honest failures and near-misses from this session.

1. **I left an Astro preview daemon running** on `localhost:4321` (`pid 292920`) after starting it for route checks. I stopped it during report preparation. It is stopped now.
2. **I shipped a reduced-motion bug in the first implementation.** The script only added `html.js` in the non-reduced branch, so the CSS reduced-motion override did not apply and users who requested reduced motion still got the fade-in. I caught and fixed this during report preparation; the final gate is green, but no browser has exercised it.
3. **I did not test anything in a real browser.** Search, mobile nav, theme cycling, copy buttons, and reduced motion are all unverified at runtime. This is the largest gap between "green build" and "working site".
4. **I changed production hosting behavior without a live check.** `trailingSlash: true` and the removal of `"**/.*"` are correct by reasoning, but not proven against Firebase Hosting, an emulator, or a preview channel.
5. **The site was not deployed.** All changes are local/staged. The live site still serves the old build.
6. **I did not run the root gate.** I ran the website gate, `astro check`, `html-validate`, and the link checker, but not `pnpm run verify` for the emitter. No emitter source changed, but the claim "the repository is green" would be overreach.
7. **I did not run full `nix flake check`.** I checked `nixfmt` on `flake.nix` only. The format sandbox and other flake checks are unverified.
8. **`check-links.mjs` is not a complete link checker.** It checks internal `href`/`src` targets, not fragments, not external URLs, and not `srcset`.
9. **`apply-og-frontmatter.mjs` is an undocumented one-shot migration script.** It is idempotent, but it sits in `scripts/` with no mention in the README and no reason to run again.
10. **`rss.xml` descriptions are raw Markdown.** They are XML-escaped, but a feed reader shows Markdown syntax rather than rendered prose.
11. **`llms-full.txt` has excessive blank lines.** It works; it is not polished.
12. **`public/og.png` is 298 KB.** It is only used for social previews, but it is heavier than necessary and was not optimized.
13. **Pagefind still reports "Found 22 HTML files"** even after adding `data-pagefind-ignore` to 404 and search. I did not inspect the index to prove those pages are excluded from results.
14. **No `apple-touch-icon` or PNG manifest icons.** The manifest references SVG only; some platforms will fall back poorly.
15. **The `legacyCopy` fallback uses deprecated `document.execCommand`.** It is intentional for old browsers, but it is still a deprecation hint in `astro check`.

---

## E) WHAT WE SHOULD IMPROVE

### Highest leverage

- **Verify the delivering layer.** Deploy to a Firebase preview channel and check `/`, a docs URL with and without a trailing slash, `/search/`, `/llms.txt`, `/.well-known/security.txt`, and a 404. A green build is not a deployed site.
- **Add browser-level tests.** Playwright for nav, theme, copy, search, and reduced motion. This is the only way to catch the class of bug found in item D2.
- **Add axe and Lighthouse CI.** The static fixes are good, but the gate should prove contrast, landmarks, focus order, and performance budgets.
- **Generate the reference pages from source.** Decorators, diagnostics, and emitter options are still hand-maintained and will drift again.
- **Render the demo video.** The HyperFrames project and storyboard already exist; the landing page is missing the strongest sales asset.

### Medium leverage

- Add FAQPage and TechArticle JSON-LD.
- Compress `og.png` and generate PNG app icons.
- Replace raw Markdown RSS descriptions with rendered plain text or HTML.
- Add preview deploys and a post-deploy smoke test.
- Add external-link and fragment checking.
- Add a "Was this page helpful?" widget and a prefilled docs issue template.
- Add package-manager tabs and a "Copy page as Markdown" button.
- Add a command palette and keyboard shortcut hint.
- Document or remove `apply-og-frontmatter.mjs`.

### Longer term

- Versioned docs and a version selector.
- TypeDoc API reference.
- Playground/StackBlitz embed.
- Offline docs via a service worker.
- Localization pilot.
- Case studies, testimonials, and a contributor wall once there is real social proof.

---

## F) NEXT 50 THINGS, IN PRIORITY ORDER

1. Deploy to a Firebase preview channel and run the route matrix.
2. Verify `/foo` -> `/foo/` redirects and canonical behavior live.
3. Verify `/.well-known/security.txt` is actually uploaded.
4. Verify Pagefind search in Chrome, Firefox, and Safari.
5. Add Playwright smoke tests for nav, theme, copy, and search.
6. Add an axe-core gate over every built page.
7. Add Lighthouse CI budgets for performance, a11y, SEO, and best practices.
8. Add visual regression screenshots for landing, docs, search, and 404.
9. Fix any reduced-motion, contrast, or focus issues the browser tests reveal.
10. Render the 30-second demo video and embed it above the fold.
11. Add a poster frame, captions, and lazy loading for the video.
12. Add FAQPage JSON-LD to the FAQ.
13. Add HowTo JSON-LD to the Quick Start.
14. Add TechArticle and BreadcrumbList JSON-LD to docs pages.
15. Compress `public/og.png` and add PNG app icons.
16. Generate PNG `apple-touch-icon` and 192/512 manifest icons.
17. Render RSS descriptions as plain text or safe HTML.
18. Tighten `llms-full.txt` whitespace and add a section index.
19. Remove or document `apply-og-frontmatter.mjs`.
20. Add `og:image` to 404 or explicitly document why it is absent.
21. Add package-manager tabs to install snippets.
22. Add a "Copy page as Markdown" button.
23. Add a "Was this page helpful?" widget that opens a prefilled issue.
24. Add a docs issue template.
25. Add GitHub Discussions to the support paths.
26. Add a keyboard shortcut hint for search.
27. Add a command palette on the landing page.
28. Generate the decorator reference from `lib/main.tsp`.
29. Generate the diagnostics reference from `src/lib.ts`.
30. Generate the emitter-option reference from the options interface.
31. Add an AsyncAPI 3.0 vs 3.1 explainer.
32. Add a "TypeSpec vs hand-written YAML" long-form article.
33. Add a protocol explainer series (Kafka, MQTT, WebSocket).
34. Add a troubleshooting page keyed by diagnostic code.
35. Add a security and supply-chain page.
36. Add a support/maintenance policy page.
37. Add a glossary/domain-language page.
38. Add a printable one-page cheatsheet.
39. Add a docs landing page explaining the IA.
40. Add a "Start here" path for three personas.
41. Add versioned docs and a version selector.
42. Add TypeDoc API reference.
43. Add a playground or StackBlitz embed.
44. Add a service worker for offline docs.
45. Add `hreflang` and a localization pilot.
46. Add a Firebase preview deploy workflow for pull requests.
47. Add an automated production deploy with a post-deploy smoke test.
48. Add weekly external-link monitoring.
49. Add cspell and markdownlint to CI.
50. Add a quarterly docs freshness audit (counts, screenshots, competitor claims).

---

## G) THREE QUESTIONS I CANNOT ANSWER MYSELF

1. **Deployment authorization:** Should I deploy this pass now to the production Firebase target, or first to a preview channel for you to inspect? The trailing-slash and dotfile changes are the two items that need live validation, and I do not want to alter production hosting behavior without your call.
2. **Video priority:** The HyperFrames demo project already exists but has no rendered MP4. Do you want me to spend the next pass rendering and embedding it, or should the next pass stay on verification (browser tests, axe, Lighthouse) and docs generation?
3. **Positioning:** Should the site continue to explicitly concede that the competing emitter has the better docs site, or should we remove that concession and compete only on validation, components, and binding generation? This is a product/brand call, not a technical one.

---

## H) FINAL STATUS

**Working tree:** changes are staged; the new status report is untracked. No commit was made by me in this session; the auto-commit daemon has been staging files.

**New files from this session:**

- `website/IMPROVEMENTS.md`
- `website/README.md`
- `website/src/data/stats.ts` (generated)
- `website/src/data/accent-classes.ts`
- `website/src/content/docs/404.md`
- `website/src/content/docs/examples.md`
- `website/src/content/docs/faq.md`
- `website/src/content/docs/getting-started/migration.md`
- `website/src/content/docs/reference/architecture.md`
- `website/src/pages/llms.txt.ts`
- `website/src/pages/llms-full.txt.ts`
- `website/src/pages/rss.xml.ts`
- `website/src/pages/search.astro`
- `website/scripts/sync-stats.mjs`
- `website/scripts/check-links.mjs`
- `website/scripts/apply-og-frontmatter.mjs`
- `website/public/opensearch.xml`
- `website/public/humans.txt`
- `website/public/.well-known/security.txt`

**Deleted:** `website/src/pages/404.astro` (replaced by `src/content/docs/404.md`).

**Verified:** website build and gate are green: 22 pages, 778 internal refs, HTML valid, CSP patched, OG images 1200x630, stats deterministic.

**Not verified:** browser behavior, Firebase deploy behavior, root gate, full flake check.

**Waiting for instructions.**
