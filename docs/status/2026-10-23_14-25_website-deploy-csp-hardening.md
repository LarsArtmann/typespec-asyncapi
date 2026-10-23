# Website deploy, CSP hardening, and build-warning cleanup - 2026-10-23 14:25 CEST

**Project:** `typespec-asyncapi`
**Scope:** `website/` (hosting, CSP, build pipeline), `flake.nix` (devShell + deploy app), docs
**Session:** deployment, CSP fix, toolchain repair, warning cleanup, live verification
**Current state:** working tree clean, website gate green, root `pnpm run verify` green, `nix flake check` green, site deployed and live-verified.

---

## 0. Evidence

| Command | Result |
| --- | --- |
| `date` | `2026-10-23 14:20 CEST` |
| `pnpm --filter typespec-asyncapi-website run check` | typecheck `0 errors`, build `22 page(s)`, `html-validate` pass, `links: 778 internal references across 22 pages are valid`, `csp: 22 pages carry a valid, hash-covered policy` |
| `pnpm run verify` (root, Node 24) | `1275 pass`, `0 fail`, coverage gate 97.9% average (45 files), `Found 0 clones` |
| `nix flake check` | `all checks passed!` (treefmt, cache-cold) |
| `nix run .#deploy-website` | build + link check + `firebase deploy` → `release complete` (26 files uploaded) |
| Cold rebuild (`trash .astro dist; pnpm run build`) | `Could not render /404` count: **0**; WARN count: **0** |
| Live `typespec-asyncapi.lars.software` | `/` 200, `/getting-started/installation` 301 → `/getting-started/installation/`, `/search/` 200, `/llms.txt` 200, `/.well-known/security.txt` 200, `/rss.xml` 200, `/nonexistent` 404 |
| Live CSP | `style-src 'self' <3 hashes>; style-src-attr 'unsafe-inline'` on `/`, `/search/`, `/guides/decorators/`, 404 |
| Live 404 body | custom copy present ("Search the docs"), `robots noindex` present |
| Toolchain | devShell `nodejs_24` (24.21.0), website TypeScript `6.0.3`, root TypeScript `7.0.2` |
| Backlog counters | `website/IMPROVEMENTS.md`: 144 ideas — 63 Done, 42 Next, 5 Decision, 34 Later |

---

## a) FULLY DONE

1. **`nix run .#deploy-website` flake app** (`flake.nix`, `perSystem.apps`). Resolves the repo root with `git rev-parse --show-toplevel`, `cd`s into `website/` (the exact cause of the user's `Not in a Firebase app directory` error, since `firebase.json` lives there), runs `pnpm run build`, runs the link check, then `firebase deploy --only hosting:typespec-asyncapi --project lars-software`. Runtime inputs pinned by nix (`pnpm`, `nodejs_24`, `firebase-tools`, `git`, `coreutils`). Verified end to end twice.
2. **Production deploy performed and live-verified.** 110 files in `dist`, 26 uploaded on the second deploy. Route matrix and CSP confirmed against the custom domain, not just the release log.
3. **Root cause of the Shiki/CSP warning found and fixed.** `scripts/fix-csp.mjs` stripped hashes with `/style-src[^;"]*/g`, which also matched the `style-src-attr` prefix and rewrote it into the invalid directive `style-src -attr`. Browsers ignore an unknown directive, so every inline `style` attribute would have been blocked (all Expressive Code token colors, every `--sl-icon-size` style). The script was rewritten to touch only `script-src`, and is now idempotent (existing hashes are not duplicated, the empty-string hash is dropped only when present).
4. **CSP scoped by kind.** `astro.config.mjs` declares only `{ resource: "'unsafe-inline'", kind: "attribute" }`, producing `style-src 'self' <hashes>` plus `style-src-attr 'unsafe-inline'`. This is the supported mitigation for attribute-based highlighting: CSP cannot hash or nonce an attribute. It also silences Astro's `style-src`/`style-src-attr` shadowing warning.
5. **New gate: `website/scripts/check-csp.mjs`** wired into `pnpm run check` (and therefore CI). Fails on malformed directive names, stray `-attr`-style sources, `'unsafe-inline'` inside `script-src` or `style-src`, a missing `style-src-attr` when style attributes exist, and any inline `<style>`/`<script>` block whose sha256 is absent. Negative-tested by mutating a built page into `style-src -attr`, which produced two errors.
6. **Build output is warning-free.** `website/astro-logger.mjs` (Astro `logger.entrypoint`) filters exactly two expected upstream messages by prefix: the Shiki/CSP warning and Starlight's `The collection "i18n" does not exist or is empty`. Nothing else is suppressed; regex-based or scope-wide filtering was rejected.
7. **Custom 404 actually renders now.** Starlight injects a static `/404` route that shadowed `src/content/docs/404.md`; `starlight({ disable404Route: true })` fixes it. Confirmed on a cache-cold build (`Could not render /404` count 0) and live (`Search the docs`).
8. **Toolchain repaired.** `website/package.json` had drifted back to `typescript: ^7.0.2`, and `astro check` refuses TS 7, aborting the entire website gate before build. Pinned to `6.0.3` and force-relinked (`pnpm install --force --filter typespec-asyncapi-website`; a plain install reports "Already up to date"). Nix `nodejs_22` (22.23.3) is rejected by Astro 7.4.2 (`>=22.23.4` required), so devShells and the deploy app now use `nodejs_24`, matching CI's `node-version: "24"`.
9. **Docs updated:** `AGENTS.md` (deploy app, CSP scoping + `fix-csp.mjs` hazard, Node 24 requirement, TypeScript constraints, 404 routing, website gate), `website/README.md` (gate list, CSP section, deploy overrides), `website/IMPROVEMENTS.md` (new "Security headers and CSP" section, rows 141-144, counters 140 → 144), status report annotated.
10. **Deploy-target documentation corrected.** `FIREBASE_TARGET` was described as selecting a preview channel; `--only hosting:<name>` selects a Hosting *target*. Preview channels use `firebase hosting:channel:deploy <channel>` and are now documented as a separate, unbuilt flow.
11. **Environment hygiene:** no stray preview daemons left running; `dist` rebuilt from a clean `.astro` cache to prove the warnings were gone rather than cached away.

---

## b) PARTIALLY DONE

1. **Security headers.** CSP is scoped correctly for what it covers, but it only declares `font-src`, `script-src`, `style-src`, `style-src-attr`. There is no `default-src`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-src 'none'`, `manifest-src`, `worker-src`, or `upgrade-insecure-requests`. Directives that are absent are unrestricted, so the policy is narrower than it looks. `frame-ancestors 'none'` is a real header via `firebase.json`; everything else is a meta tag.
2. **Deploy preflight.** `nix run .#deploy-website` runs build + link check only. Typecheck, `html-validate`, and the new CSP check never run on the deploy path, so `SKIP_CHECK` is the only switch and it is misnamed now that there are four gate stages.
3. **Backlog bookkeeping.** Counters (63/42/5/34 of 144) are arithmetically consistent, but the "next five" list at the bottom of `IMPROVEMENTS.md` still starts with the demo video and does not mention the CSP/security items that were just completed, and it predates the new 141-144 rows.
4. **CSP enforcement proof.** The policy is now correct by construction and by static analysis of the built HTML, but nothing proves a browser honours it: no report-only phase, no violation reporting endpoint, no browser run.
5. **404 metadata.** The content 404 is now what ships, but `/og/404.png` is generated for a page that is `noindex` and should never be shared; whether that image is linked from the 404 head was not re-checked after the route switch.
6. **`i18n` collection warning.** Investigated and reverted on purpose: declaring `i18nLoader()` only trades the "collection does not exist" warning for `base directory ... does not exist`, because the directory is empty. Final state filters the message; the underlying upstream behaviour (Starlight calls `getCollection("i18n")` on a single-language site) is untouched.
7. **TypeScript policy.** `AGENTS.md` previously asserted root TS must stay on 6.x because TS 7 hard-errors in lint. Root is now pinned exact at `7.0.2` and lint is green, so the documented rule was replaced with the observed behaviour instead of restoring 6.0.3. That is a documentation fix, not a dependency decision.

---

## c) NOT STARTED

1. Preview-channel deploy app (`nix run .#preview-website`) and a PR-based preview workflow.
2. Post-deploy automated smoke test (the live route matrix is still a hand-run Node script).
3. Browser verification of the CSP change: no Chrome/Firefox/Safari run, no screenshot diff, no check that token colours and icon sizes still paint.
4. axe-core / pa11y accessibility run and Lighthouse CI budgets.
5. Playwright (or equivalent) smoke tests for nav, theme cycling, copy buttons, search, reduced motion.
6. `check-csp.mjs` unit test / fixture test in CI (negative case currently verified by hand).
7. Compressing `public/og.png` (305,190 bytes) and adding PNG `apple-touch-icon` + 192/512 manifest icons.
8. Structured data beyond the landing page (FAQPage, HowTo, TechArticle, BreadcrumbList).
9. Generated decorator/diagnostic/emitter-option references sourced from `lib/main.tsp`, `src/lib.ts`, and the options interface.
10. Demo video render and embed.
11. External-link checking (GitHub, npm, AsyncAPI docs) — `check-links.mjs` is internal-only.
12. `manifest-src`/`worker-src` and the rest of the missing CSP directives listed above.
13. Cleanup of `website/scripts/apply-og-frontmatter.mjs` (one-shot migration, undocumented, still in the tree).
14. Pagefind 404 exclusion proof: the index still reports 22 HTML files; that the 404/search pages are excluded from results was never demonstrated with a query.

---

## d) TOTALLY FUCKED UP

1. **A shipped script silently disabled a CSP directive.** `fix-csp.mjs` had been rewriting `style-src-attr` into `style-src -attr` since the hash-stripping pass. If the scoped directive had existed earlier, every inline style attribute would have been blocked in production and the site would have looked broken. The bug was latent only because the previous policy used a single `style-src` directive.
2. **I reported the 404 as fixed when it was not.** The earlier verification checked for `data-pagefind-ignore` in the 404 body and treated that as proof the custom page shipped. Starlight's own 404 also carries that attribute, so the check was a false positive; the content page had been shadowed the whole time and the build had been warning about it.
3. **The website gate was broken for an unknown period and nobody noticed.** `website/package.json` carried `typescript: ^7.0.2`, which makes `astro check` exit before build, yet the earlier session recorded "typecheck 0 errors". The gate only became visible as broken when it was actually re-run end to end today.
4. **Nix toolchain could not build the site at all.** The devShell pinned `nodejs_22` = 22.23.3 while Astro 7.4.2 requires `>=22.23.4`, so `nix develop -c pnpm run build` in `website/` failed before writing a page. CI was already on Node 24, so CI and the local toolchain disagreed.
5. **I documented a flag that does not do what I wrote.** `FIREBASE_TARGET=<channel>` was presented as a preview-channel deploy; `--only hosting:<name>` selects a Hosting target. Corrected in both `AGENTS.md` and `website/README.md`, but the wrong instruction was published first.
6. **Deploy happens without the full gate.** `nix run .#deploy-website` can publish a build that fails typecheck, HTML validation, or the CSP check, because it only runs the link check.
7. **Three blocking questions were never answered and I proceeded anyway.** Deployment authorization, next-pass priority, and competitor positioning from the previous report are still open; the deploy went ahead because the user typed the command themselves.

---

## e) WHAT WE SHOULD IMPROVE

1. **Stop letting automation own the verification story.** Re-run the actual gate before any "green" claim; a stale `node_modules` plus a broken manifest produced a green claim over a gate that could not run. Treat "gate passed" as a claim that needs a fresh timestamp.
2. **Tests must assert unique markers.** The 404 false positive came from asserting a marker that both candidate pages contain. Assert page-specific copy or a unique DOM id instead.
3. **Post-processing scripts are the most dangerous code in the repo.** `fix-csp.mjs` rewrites security policy with regexes. Every such script needs a scope assertion (here: never match `style-src-attr`) and a validator that fails loudly, which is what `check-csp.mjs` now provides.
4. **Deploy should be gated by the same checks as CI.** One command that builds, checks, deploys, then verifies live routes would remove the manual matrix entirely.
5. **Toolchain pins should be asserted, not remembered.** Node and TypeScript floors are documented in prose and drifted twice. A `pnpm run check:toolchain` (assert Node `>=22.23.4`, website TS 6.x) or an `engines` field would fail fast with a useful message.
6. **Security headers deserve the same single-source treatment as stats.** The directive list lives in `astro.config.mjs` and `firebase.json`, with no test that the union is what we intend.
7. **Browser verification is the missing half of CSP work.** A policy can be provably correct and still break the page; only a rendering check closes that loop.
8. **Message filtering should be visible.** `astro-logger.mjs` hides two warnings; the file documents why, but the build output no longer reminds anyone. Link it from `website/README.md` (done) and keep the allowlist at two entries.
9. **Deploy output should include the URL and the version deployed.** Currently the app prints Firebase's banner only; it could print the `stats.ts` version and the custom domain so the log is self-describing.

---

## f) Up to 50 things to do next

1. Add `preview-website` flake app (`firebase hosting:channel:deploy`).
2. Add a post-deploy live smoke test to the app (route matrix: 200/301/404, CSP present, `llms.txt`).
3. Make the deploy app run the full `pnpm run check` preflight instead of only links.
4. Rename `SKIP_CHECK` to `SKIP_PREFLIGHT` (or add `PREFLIGHT=full|links|none`).
5. Add `check:toolchain` asserting Node `>=22.23.4` and website TypeScript 6.x.
6. Add `engines` to `website/package.json`.
7. Add `default-src 'self'` to the CSP and verify hashes still cover every inline block.
8. Add `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-src 'none'`.
9. Add `manifest-src 'self'` and `worker-src 'self'`.
10. Add `upgrade-insecure-requests`.
11. Decide whether CSP stays a meta tag or moves to a Firebase header with per-page hashes generated at build time.
12. Add a CSP report-only rehearsal on a preview channel before tightening further.
13. Add a fixture test for `check-csp.mjs` (mutated page must fail; clean build must pass).
14. Add a fixture test for `fix-csp.mjs` idempotence (second run patches 0 files).
15. Investigate why `fix-csp.mjs` patches all 22 pages on every build (which inline scripts Astro leaves unhashed).
16. Move that inline script into `public/js/` and delete the script-hash patching entirely if possible.
17. Run Chrome + Firefox + Safari against production and confirm token colours and icon sizes paint under the new policy.
18. Add Playwright smoke tests: nav toggle (Escape/outside/resize), theme cycling, copy buttons, search query, reduced motion.
19. Add axe-core (or pa11y) to the website gate.
20. Add Lighthouse CI with budgets for LCP/CLS/TBT and page weight.
21. Compress `public/og.png` (305 KB) or replace it with a generated per-page image.
22. Add `apple-touch-icon.png` and 192/512 maskable icons.
23. Verify Pagefind excludes `/404/` and `/search/` by querying the built index.
24. Add external-link checking as a scheduled job, not a per-PR gate.
25. Add FAQPage JSON-LD to `faq.md`.
26. Add HowTo JSON-LD to `quick-start.md`.
27. Add TechArticle + BreadcrumbList JSON-LD to guide pages.
28. Add `article:modified_time` from git history.
29. Generate the decorator reference from `lib/main.tsp`.
30. Generate the diagnostics reference from `src/lib.ts` (kill the hand-maintained table).
31. Generate the emitter-options table from the options interface.
32. Add a troubleshooting page keyed by diagnostic code.
33. Render and embed the demo video with poster and captions.
34. Remove or document `scripts/apply-og-frontmatter.mjs`.
35. Decide whether the 404 should have its own OG image at all (currently generated, `noindex`).
36. Add a `check:headers` script comparing `firebase.json` header rules with the intended set.
37. Add `Strict-Transport-Security` preload eligibility check before submitting to the preload list.
38. Add `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` decisions to `firebase.json`.
39. Replace the `rm -rf` in the website `clean` script with a portable Node implementation.
40. Add a docs freshness check that fails when `stats.ts` drifts from source.
41. Add a release-time docs bump (version, counts, changelog section) as one script.
42. Add a `nix run .#check-website` app so the gate is discoverable from `nix flake show`.
43. Add flake `checks.website` running the website gate in the sandbox.
44. Add CI caching for the website build and Pagefind index.
45. Add a deploy notification step (GitHub deployment status or webhook) after release.
46. Reconcile root `typescript` 7.0.2 with the typescript-eslint peer range, or update the peer story once and for all.
47. Add a `dependabot.yml` entry that keeps `website/package.json` and the lockfile in one commit (the drift keeps recurring).
48. Add a smoke test that the deployed HTML contains the hashed inline scripts from `dist/` (detect a build that shipped unpatched).
49. Add `website/scripts/README.md` documenting every script's contract (build-time vs one-shot).
50. Re-run the whole session checklist as a scripted `docs-health` pass so the next report starts from evidence, not memory.

---

## g) Three questions I cannot answer myself

1. **CSP posture:** do you want the remaining directives (`default-src`, `object-src`, `base-uri`, `form-action`, `frame-src`, `upgrade-insecure-requests`) added now, accepting that an over-strict `default-src` can break font/image loading on a live site, or only after a browser verification pass?
2. **Deploy gating:** should `nix run .#deploy-website` refuse to deploy unless the full website gate passes (slower, safer), or keep the fast path and rely on CI/human discipline?
3. **TypeScript policy:** root is pinned at `7.0.2` while typescript-eslint's declared peer range is `>=4.8.4 <6.1.0` and lint currently passes anyway. Do you want root restored to `6.0.3` (documented policy), or is TS 7 the new intended baseline for the emitter while only `website/` stays on 6.0.3?
