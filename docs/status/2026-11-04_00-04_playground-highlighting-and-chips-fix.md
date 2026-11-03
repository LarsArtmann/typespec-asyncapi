# Status Report: Playground Syntax Highlighting + Dead Example Chips

**Date:** 2026-11-04 00:04 CET
**Session scope:** Landing-page playground — add syntax highlighting (user request 1) and fix the non-clickable MQTT/WebSocket/Two-channels example chips (user request 2). No other project area touched.

## Scope line — what this report VERIFIED vs NOT verified

**Verified here (fresh commands, this session):**
- `pnpm exec vitest run test/unit/playground-ui.test.ts test/unit/hero-highlight.test.ts` → **9/9 passed** (23:54:39).
- `pnpm exec vitest run test/unit/playground-engine.test.ts` → **6/6 passed** against the freshly rebuilt engine bundle (23:56:43).
- `pnpm --filter typespec-asyncapi-website run check` → **green end-to-end**: astro check (typechecked the new TS client script), build (22 pages), html-validate, `links: 798 internal references across 22 pages are valid`, `csp: 22 pages carry a valid, hash-covered policy` (23:55:11).
- Built-artifact inspection of `dist/`: landing page loads the client wiring as a hashed `_astro/PlaygroundSection.*.js` module (4,166 bytes); **zero** references to the deleted `/js/playground.js`; backdrop marker ×1 and `data-example-source` ×4 all **inside** the `[data-playground]` div (depth-counted in the built HTML); bundle contains both highlighter rule sets (`text-amber`, `text-accent-light`, `import|using|namespace|model|op|extends`, `compileToAsyncAPI`); generated CSS contains `[data-syntax=true]` transparent-text rule, `caret-color:var(--color-accent)`, `[data-syntax=true]::selection` rule, and `scrollbar-width:none`.
- `nix build .#checks.x86_64-linux.format` → **green** after `nix fmt` (2 files changed: my test file + pre-existing `website/IMPROVEMENTS.md` drift).
- `pnpm run typecheck:test` → 0 errors. `pnpm run lint` → exit 0. `pnpm run duplicate` → `Found 0 exact clones with 0(0.00%) duplicated lines`.
- Engine bundle size re-measured: 1,117,130 bytes / **317,003 gzipped** — the "~310 KB gzipped" copy claim on the page is accurate.
- Chip-bug root cause traced with `git show 0f9ef3ae` — the example sources were **outside** the `[data-playground]` div from the commit that created the playground (born broken, not a later regression).

**NOT verified here (honest gaps):**
- **No real-browser render.** Overlay alignment, caret visibility, selection styling, scrollbar hiding, and scroll-sync were verified statically (CSS/markup/bundle) and by round-trip tests — never by looking at the playground in Chrome/Firefox/Safari. The one visual claim I closed by grep is the `::selection` selector; everything visual beyond that is reasoning, not observation.
- **No DOM-level tests for the client script.** Debounce, stale-sequence guard, diagnostics rendering, copy handler, and the chips code path are untested as *executed JavaScript* (this was already the known gap #13/#23 in the 2026-11-02 report; I did not close it — my new test greps source structure, it does not run the DOM logic).
- `website/IMPROVEMENTS.md` formatter fix is **uncommitted** at report time (`git status`: 1 modified file) — auto-commit daemon should pick it up.
- No `pnpm run verify` single-pass full gate (coverage:gate etc. skipped as irrelevant — `src/` untouched — but "gate as a whole in one pass" was not run).
- Safari-specific behavior of `scrollbar-width: none` (supported since Safari 18.2) untested; older Safari would fall back to a glyph-shifting classic scrollbar.
- IME composition (CJK input) over the transparent textarea: reasoned safe (textarea owns input), untested.

---

## Session narrative (30 seconds)

User asked for playground syntax highlighting. During research I read the chip wiring and the markup but **missed** the bug the user then reported in the next message: the hidden `<pre data-example-source>` elements sit outside `[data-playground]`, so `root.querySelectorAll` found nothing and every chip except the default silently no-op'ed. Fixes shipped together: sources moved inside the root; client wiring converted from a static `public/js/playground.js` to an Astro-processed `<script>` importing the same `src/lib/highlight.ts` the hero uses; textarea-overlay highlighting for the input pane; `highlightYaml` for the output pane; regression locks in `test/unit/playground-ui.test.ts`; AGENTS.md memory updated.

---

## a) FULLY DONE

| # | Item | Evidence | Scope |
|---|------|----------|-------|
| a1 | Example chips fixed — hidden sources inside `[data-playground]` root; all 4 chips now resolve their source | Containment verified in **built** `dist/index.html` (depth-count: 4/4 inside); unit test `renders the example sources inside the [data-playground] root` | `PlaygroundSection.astro` |
| a2 | Playground syntax highlighting — output pane via shared `highlightYaml` (engine emits YAML only, `engine.ts:183`) | Round-trip test compiles the kafka example with the real emitter and asserts byte-exact highlighting; bundle contains YAML rules | `PlaygroundSection.astro`, reuses `src/lib/highlight.ts` |
| a3 | Input-pane overlay editor — backdrop `<pre aria-hidden data-playground-highlight>`, transparent textarea gated on `editor.dataset.syntax` (JS-set, no-JS users keep plain text), caret `accent`, selection `accent/30`, scroll+size sync (scroll event + ResizeObserver), editor scrollbars hidden in `global.css` | CSS verified in built `LandingLayout.css`; markup verified in built HTML; trailing-space line-height compensation documented in code | `PlaygroundSection.astro`, `global.css` |
| a4 | Single source of truth for highlight rules — client script imports `../lib/highlight`; `public/js/playground.js` deleted (trash, never `rm`) | `git show 4f39f9d3` (−179 lines playground.js); test locks `not.toContain("/js/playground.js")` + `existsSync == false` | website-wide |
| a5 | Client script now typechecked + hash-cached — processed `<script>` bundled by Astro into `_astro/*.js` (4.1 KB) instead of unhashed `/js/` | Built page loads `<script type="module" src="/_astro/PlaygroundSection...js">`; cache policy note: this *aligns* with the `_astro/** immutable` rule | `PlaygroundSection.astro` |
| a6 | Regression-lock test suite `test/unit/playground-ui.test.ts` (5 tests): root containment, shared-highlighter wiring, round-trips over ALL playground example sources, real-YAML round-trip, injection escaping (`<img onerror>` → `&lt;img`) | 5/5 passed twice (pre- and post-format) | `test/unit/` |
| a7 | Website gate fully green after the change (astro check + build + html + 798 links + CSP ×22) | Fresh run output quoted in scope line | `website/` |
| a8 | Format gate green; pre-existing `website/IMPROVEMENTS.md` table drift fixed via `nix fmt` | `nix build .#checks.x86_64-linux.format` → green; diff: only the 2 known files | repo-wide treefmt |
| a9 | Root gates: `typecheck:test` 0 errors, `lint` exit 0, `duplicate` 0 clones | Fresh runs 23:57–23:59 | root |
| a10 | Memory updated — AGENTS.md playground bullet now documents the new wiring, overlay mechanics, scrollbar rationale, containment rule, and the chip incident | commit `3a5acd99` | `AGENTS.md` |
| a11 | Prior session's "~310 KB gzipped" copy claim re-verified against the rebuilt bundle: 317,003 bytes gzipped — accurate | `gzip -c \| wc -c` fresh | `PlaygroundSection.astro` copy |

## b) PARTIALLY DONE

| # | Item | Works now | Open | Effort |
|---|------|-----------|------|--------|
| b1 | **Verification of the UI** | Static + unit + gate verification all green | No human-eye or screenshot verification of the actual rendered overlay in any browser; no dark/light screenshot | S–M (needs a browser harness — see g1) |
| b2 | **Client-script automated coverage** | Behavior is *reviewed* and *structurally locked* (source greps) | No jsdom/DOM tests executing the script: debounce, stale-sequence guard, diagnostics, copy, chips path all unexecuted | M |
| b3 | **Chip-bug root-cause learning** | Bug located, fixed, mechanically locked for THIS contract | The *general* class — "any `root.querySelector` contract between `.astro` markup and client JS" — is untested for the other 4 public scripts (`header.js`, `copy-code.js`, `animations.js`, `theme-init.js`) | S–M |
| b4 | **Formatter discipline** | Drift found and fixed | Root cause of WHY `IMPROVEMENTS.md` went unformatted (a writer skipped treefmt) uninvestigated; will recur | S |
| b5 | **Stale pointers in archived docs** | 2026-11-02 status report correctly documents the then-current `public/js/playground.js` | It also lists open items targeting that now-deleted file ("DOM tests for public/js/playground.js", §4.5 #47) — next HARVEST/ANNOTATE pass must redirect them to the bundled script; not annotated yet | S |
| b6 | **Highlighter capability** | Keywords, decorators, strings, numbers, YAML keys — same quality as hero | No comment rule (`//` and `/* */` render plain), no `#{}`/enum/discriminator-specific rules; YAML booleans/null uncolored | S |

## c) NOT STARTED

| # | Item | Why not started | Still wanted? |
|---|------|-----------------|---------------|
| c1 | Real-browser QA harness for the landing page (Playwright or manual screenshot loop) | Standing open question from the 2026-11-02 report (cost ~300 MB CI dep) — needs user decision, see g1 | Yes — this session's work is exactly the class of change it would have verified |
| c2 | jsdom DOM tests for the client wiring (b2) | Out of session scope; user's instruction was fix + verify, and static verification was achievable without new harness | Yes |
| c3 | HARVEST of this report's (f) list into `TODO_LIST.md`/`ROADMAP.md` | User instructed: report, then WAIT | Yes — next session |
| c4 | Annotating the 2026-11-02 status report (b5) | Archived docs are annotate-only; deferred to a docs-health pass | Yes |
| c5 | Investigating the IMPROVEMENTS.md formatter-miss root cause (b4) | Did not want to research unrelated processes mid-session per user instruction | Yes |
| c6 | Playground UX extras (Ctrl/Cmd+Enter compile, dirty-chip indicator, persistence) | Feature ideas, not defects; zero work done | Your call |
| c7 | Emitter-option exposure in the playground (json output, split-schemas) | Product scope decision, zero work done | Your call |

## d) TOTALLY FUCKED UP

Nothing is currently red — the working tree is green and gated. But three things deserve the strong label:

1. **The chips shipped broken and stayed broken for ~2 days** (born broken in `0f9ef3ae`, 2026-11-02). Root cause: the original session verified via HTTP 200s, engine-bundle tests, and build gates — *none of which can execute a click*. The bug was invisible to every existing gate. Mitigation now exists for this exact contract (containment test), but the *lesson* — UI interaction bugs survive every gate we have until something clicks or executes DOM code — is still unaddressed platform-wide (b2, c1).
2. **I read the broken code and did not see the bug.** In my first research pass I opened `PlaygroundSection.astro` and `playground.js` side by side and did not notice the pres were outside the root div. The user found it before I did, after I had already been asked to work on that exact component. A 30-second trace of `sources.get(id) === undefined → return` against the markup would have caught it. That is the personal failure of this session.
3. **The DOM layer of this website has zero executable coverage** (b2/c1 — 2026-11-02 report knew it, I added more DOM-dependent code anyway, still without executable coverage). The containment lock I added greps text; it cannot catch a *behavioral* regression (e.g., a future edit that breaks the scroll-sync or the sequence guard). We keep shipping client JS on trust.

## e) WHAT WE SHOULD IMPROVE

1. **"Markup↔script data-attribute contracts need locks"** — generalizable rule discovered here: whenever client JS reads DOM via selectors, a test must assert the contract. Mine greps the `.astro` source; a rendered-HTML test (build then parse `dist/index.html`) would be stronger and is what I actually did manually — promote that manual check into a permanent test.
2. **UI changes need eyes.** Process rule worth adopting: no UI change is "done" until a screenshot (dev server or built site) exists — even one manual `astro preview` + screenshot. Everything I verified was true, but none of it is *sight*.
3. **Reuse-before-new, confirmed working:** reusing `src/lib/highlight.ts` instead of copying rules into a static JS file avoided a hero/playground split brain — keep doing exactly this. Conversely, deleting `public/js/playground.js` in favor of a bundled script removed a whole class of "untested unhashed script" problems; consider migrating the other four `/js/*.js` scripts the same way.
4. **Daemon-committed work needs evidence trails:** the daemon committed my work in three chunks (`4f39f9d3`, `2868d110`, `3a5acd99`) with heuristic messages. Fine for the established workflow, but reports (like this one) are what carry the real mapping — keep writing them.
5. **Formatter misses recur** (IMPROVEMENTS.md this session; generated/website files historically per AGENTS.md). Every manifest/doc writer should end with a formatter run; this keeps being learned the expensive way.

## Brutal self-review (skill questions, answered honestly)

1. **What did you forget?** To see the chip bug while reading the code (worst one); browser-eyes verification; DOM-executable tests; annotating the stale 2026-11-02 report; investigating the formatter-miss root cause.
2. **Something stupid we do anyway?** We ship client JS with zero executable DOM tests and call gates "green" — green gates cannot click buttons. Also: heuristic daemon commit messages carry no meaning; only my report does.
3. **Could you have done better?** Traced the JS contract against the markup in step 1 (bug found before the user); built a rendered-HTML structural test instead of source-grep; taken one screenshot.
4. **Could you still improve?** Yes: items b1–b6, c1–c5.
5. **Did you lie?** No. Every "verified" claim above maps to a command run this session; the gaps are listed in the scope line, including the ones that make me look bad.
6. **How can we be less stupid?** Lock markup↔script contracts mechanically; get one browser screenshot per UI change; migrate remaining `/js/*.js` into processed scripts so they get typechecked.
7. **Ghost systems?** None created; the shared highlighter is wired into both hero and playground; deleted file has no dangling references (verified in dist/). The reverse ghost — *tests that check nothing executed* — is flagged in (d)3.
8. **Scope creep trap?** Held. I did not add emitter options, persistence, or a highlighter rewrite — the (f) list files them as proposals instead.
9. **Removed something useful?** `resize-y` kept; scrollbar affordance traded away deliberately (alignment > scrollbar) — if that tradeoff is wrong, it's a one-line CSS revert; flagged in g2.
10. **Split brains?** Fixed one (rules would have drifted between hero and playground). Remaining flagged: "~310 KB" copy is hand-maintained (today it matches, 317 KB — but nothing regenerates it); stale pointers in the archived status report (b5).
11. **Tests?** New: 5 structural/round-trip tests. Missing: executable DOM tests (b2), visual tests (c1). Round-trip tests prove the highlighter is lossless — good property to have kept from the hero suite.
12. **Re-verified inherited claims?** Yes, the ones this session relied on: engine size claim re-measured (was "~310 KB", is 317 KB — accurate); engine always-YAML claim re-read in `engine.ts:183`; cache-policy claims checked against `firebase.json`; the 2026-11-02 report's "playground.js has zero automated coverage" claim — confirmed still true when I arrived, and I only partially improved it.

## f) Up to 50 things we should get done next

**This session's direct follow-ups (high impact):**
1. Get eyes on it: screenshot playground in dark AND light theme, verify overlay alignment/caret/selection visually (S).
2. Rendered-HTML contract test: parse `dist/index.html` (like my manual depth-count) and lock backdrop+sources containment permanently (S).
3. jsdom tests executing the client script: chips select → textarea value + active state; debounce 350 ms; stale-sequence guard; diagnostics rendering; copy fallback (M).
4. Decide the Playwright question (2026-11-02 report's standing #3) — see g1 (S decision, L implementation).
5. HARVEST this (f) list into `TODO_LIST.md`/`ROADMAP.md` via docs-health (S).
6. ANNOTATE the 2026-11-02 status report: `public/js/playground.js` deleted, items #13/#23/#47 redirect to the bundled script (S).
7. Root-cause the IMPROVEMENTS.md formatter miss; if it was a tool/agent writer, add a post-write formatter step (S).
8. Commit-or-verify `website/IMPROVEMENTS.md` uncommitted change lands (daemon) (S).
9. Migrate `header.js`, `copy-code.js`, `animations.js`, `theme-init.js` into processed (typechecked, hashed) scripts like playground's (M).
10. Add structural contract locks for those four scripts' data attributes (M).
11. Verify the overlay in Safari/Firefox (scrollbar-width support, scroll sync) (S).
12. Decide scrollbar tradeoff explicitly (hidden vs synced-visible) — see g2 (S).
13. Run `pnpm run verify` once end-to-end for a single-pass green stamp including coverage:gate (S).
14. Consider `scrollbar-gutter: stable`/overlay alternatives if scrollbar hiding is rejected (S).
15. Add `//` and `/* */` comment rules to `TYPESPEC_RULES` (+ round-trip test) (S).
16. Color YAML booleans/null distinct from numbers/strings (+ test) (S).
17. Add `#{}` value-literal and `@`-decorator-argument color to distinguish from plain `@` decorators (S).
18. Generate the "~310 KB gzipped" copy from the actual bundle (sync-stats-style) instead of hand-maintained text (S).
19. Ctrl/Cmd+Enter in editor triggers compile (S).
20. "Dirty" indicator when editor content diverges from the selected example chip (S).
21. Handle IME composition sanity check for CJK input over the overlay (S).
22. Error-path visual check: force an engine load failure and confirm the pane message renders (S, manual or jsdom).
23. Add a11y check: screen-reader output of the overlay (textarea is the only labeled control — confirm backdrop `aria-hidden` holds in built HTML — already verified: it does).
24. Long-line horizontal scroll sync test with a 500-char line (jsdom can't measure; needs browser — bundle with #1) (S).
25. Consider exposing `file-type: json` example chip (engine change + UI chip) (M).

**Adjacent, known from project context (not researched this session — routing candidates for HARVEST):**
26. Docs-health pass over the website docs triggered by this session's AGENTS.md edit (verify no other bullet references the deleted file).
27. Evaluate splitting `website/src/lib/highlight.ts` rules per-language vs current combined file once rules grow (#15–17 push it).
28. Review whether `data-playground-highlight` should also highlight *diagnostics source lines* (link errors to editor lines — feature proposal).
29. Sweep `.astro` components for other JS-read DOM contracts beyond the header/footer scripts (#10).
30. Confirm `astro check` covers future edits to the client script (it does — processed script; add a note to AGENTS.md website section if not obvious).

**Smaller polish / proposals:**
31. Add `aria-live` polite announcement on compile completion beyond the status span (status already `role=status` — verify sufficiency).
32. Persist editor content across reloads (localStorage) — proposal, privacy-neutral (never uploaded anyway).
33. "Reset example" should also reset scroll position to top (check).
34. Show engine load progress state distinct from "Compiling…" (status text currently covers both — fine).
35. Keyboard focus trap review for the two panes (tab order: chips → editor → output → buttons).
36. Consider a "copy as JSON" variant if #25 lands.
37. Add favicons/meta sanity pass on the landing page after markup change (untouched this session — verify nothing regressed via html-validate — already green).
38. Pre-commit hook still bypassed by convention (`--no-verify` + manual verify) — consider a fast pre-commit subset for website-only changes.
39. Add the overlay-editor CSS contract (scrollbar rules) to a comment in `firebase.json`-adjacent cache docs? No — wrong file; document in AGENTS.md website section if touched again.
40. Measure render cost of highlight on a 1,000-line paste (property test with a big synthetic source; expect <5 ms) (S).
41. Guard `test/unit/playground-ui.test.ts` against prettier reformatting the `.astro` div layout (the literal `"<div\n  data-playground\n"` match is brittle — make the matcher whitespace-tolerant) (S).
42. Trim `website/IMPROVEMENTS.md` items this session obsoleted (if it lists playground highlighting or chip fixes — check during HARVEST).
43. Feed #1–#3 outcomes back into AGENTS.md gotchas (e.g., "overlay editors need scrollbar hiding" is already recorded; add "rendered-HTML lock pattern" if adopted).
44. Re-run `pnpm audit` after next dependency bump touching the website (standing hygiene, untouched here).
45. Verify CSP `style-src-attr` still only carries the Shiki mitigation (untouched; check-csp green — revisit only if styles change).
46. Track Astro version for changes to `<script>` bundling semantics (our fix relies on processed-script behavior).
47. Consider `content-visibility` on below-fold sections (perf; landing page change adjacent).
48. Review `dist/` size delta from this change (+4 KB JS, +~1 KB CSS — negligible; record in next perf note).
49. Ensure the auto-commit daemon's heuristic messages get at least a body when a session spans multiple logical changes (process note).
50. Close the loop: after #1–#3, update this report's b1/b2 to "done" via ANNOTATE, not rewrite (S).

## g) Questions I cannot figure out myself (max 3)

1. **Do you want a real-browser harness (Playwright) in CI for the landing page, or is jsdom + one manual screenshot per change the accepted bar?** This gates #1–#4 and determines whether "UI shipped without eyes" can ever be mechanically prevented. The 2026-11-02 report posed it; it is still unanswered and this session's bug class is the exact cost of leaving it open.
2. **Editor scrollbar: keep it hidden (current — pixel-perfect alignment, no scrollbar affordance) or show a synced decorative scrollbar on the backdrop?** I chose alignment over affordance; it is reversible in one CSS line, but it is a UX taste call I should not make alone.
3. **Should the playground grow into an emitter-options surface (json/split-schemas chips, maybe a mixed OpenAPI example that would require bundling `@typespec/http` into the engine), or stay a minimal 4-example compile demo?** This decides whether the engine bundle stays at ~310 KB gzipped or grows, and whether `@typespec/http` ever ships to the browser (which AGENTS.md currently forbids as a runtime dependency).

---

**Report file:** `docs/status/2026-11-04_00-04_playground-highlighting-and-chips-fix.md`
**Next step:** WAITING FOR INSTRUCTIONS. (f)-list harvest into `TODO_LIST.md` deferred until you say go.
