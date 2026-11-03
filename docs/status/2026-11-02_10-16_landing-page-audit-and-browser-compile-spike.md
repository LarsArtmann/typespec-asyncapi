# Landing-Page Audit and Browser-Compile Spike

**Date:** 2026-11-02 10:16 CET
**Branch:** `master`
**HEAD:** `e02bec85` (`chore: auto-commit 1 changed file(s) (heuristic)`)
**`origin/master`:** `27c5dd69`
**Local ahead by:** 3 commits — none pushed, so the tip of `master` still has no CI run
**Scope:** this session only — the landing-page structure audit, the logo-consumer audit, and the TypeSpec-in-the-browser bundling spike
**Code changed:** none intentionally. **One 1.9 MB build artifact got committed by the auto-commit daemon** (see §4.1).

---

## 0. Action Log

| #  | Action                                                             | Result                                                                        |
| -- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| 1  | Loaded `modern-web-guidance` SKILL.md                              | Mandatory for HTML/CSS/client-JS; no guide matched a compiler-in-browser demo |
| 2  | `git status`, `git log`, listed `website/src/components`           | 17 components; tree clean at start                                            |
| 3  | Read `website/src/pages/index.astro`                               | 5 render stages identified                                                    |
| 4  | Read `HeroSection.astro`, `Sections.astro`, `PipelineLockup.astro` | Hero composition mapped                                                       |
| 5  | Read `ShowcaseSection.astro`, `FeatureGrid.astro`                  | Confirmed `#demo` is the TypeSpec→AsyncAPI block                              |
| 6  | Read `PipelineSection.astro`, `ComparisonSection.astro`            | Lockup lives here, not in the hero                                            |
| 7  | Read `Section.astro`, `global.css` animation section               | Found `data-animate` stamping                                                 |
| 8  | Read `website/public/js/animations.js`                             | Confirmed IntersectionObserver fade-in                                        |
| 9  | Read `website/src/data/stats.ts`, `hero-code.ts`                   | Version 1.1.0; 30 decorators, 22 protocols                                    |
| 10 | Read `Logo.astro`                                                  | 72×36 mark, used by Header + Footer                                           |
| 11 | Grepped who imports `Logo` / `PipelineLockup`                      | PipelineLockup → PipelineSection only                                         |
| 12 | `ls assets/brand/`                                                 | 4 lockups + mark + README                                                     |
| 13 | `git log --diff-filter=A -- .spike`                                | **`e02bec85` added my scratch bundle to git**                                 |
| 14 | `git cat-file -s HEAD:.spike/out2.js`                              | 1,923,564 bytes                                                               |
| 15 | `git branch -r --contains <spike commit>`                          | No remote contains it (unpushed)                                              |
| 16 | `grep` node builtins in our `dist/`                                | None — emitter is browser-bundleable                                          |
| 17 | `grep` node builtins in `@typespec/compiler`                       | `url` ×10, `path` ×5, `util` ×3, `fs` ×2, `os` ×1, `crypto` ×1                |
| 18 | esbuild bundle of `@typespec/compiler` core                        | **0 unresolved, 1,923,564 B raw / 359,150 B gzip**                            |
| 19 | esbuild bundle of `@typespec/compiler/testing`                     | **Fails** — `assert`, `url`, `fs/promises`                                    |
| 20 | `du -sh` on dists                                                  | compiler 6.7 M, asset-emitter 284 K, our dist 988 K                           |
| 21 | Read `assets/brand/README.md:25-50`                                | Consumer table contains two false claims                                      |

---

## 1. (a) FULLY DONE

1. **Loaded the mandatory web skill before any web work.** Cost: one read. Benefit: I did not invent a "modern" pattern for the demo.
2. **Mapped the landing page's exact render order**, with file:line anchors:
   `HeroSection` → `ShowcaseSection` (`#demo`) → `FeatureGrid` → `PipelineSection` → `ComparisonSection` → `UseCasesSection` → `CTASection`.
   Source: `website/src/pages/index.astro:13-26`, `website/src/components/Sections.astro:9-14`.
3. **Located the exact element the user was complaining about.** `HeroSection.astro:82-93` — a `code-preview` card titled `api.tsp` (line 87) containing TypeSpec **input only** (no AsyncAPI output anywhere above the fold).
4. **Proved the duplication.** The hero snippet and `ShowcaseSection.astro:5-15` both use `import "@lars-artmann/typespec-asyncapi"`, `using TypeSpec.AsyncAPI`, `@channel`, `op`. Same example, two paint jobs.
5. **Explained the "slightly animated" effect precisely.** `Section.astro:43` sets `data-animate` on every section; `global.css:81` starts those at `opacity:0; transform:translateY(20px)`; `public/js/animations.js:14-25` adds `.animate-fade-in` at `threshold: 0.1`. So the api.tsp → asyncapi.yaml block slides up as the visitor scrolls — the duplicate announces itself late.
6. **Answered the logo question with a consumer audit.** `assets/brand/lockup-horizontal-{dark,light}.svg` (352×54, shipped last session) is imported by **nothing**. Header/Footer use `Logo.astro` (72×36 mark). The only wordmark rendered anywhere is the **stacked** 126×112 `PipelineLockup`, used at `PipelineSection.astro:5-7` inside the "How it works" section, roughly 3 viewports down.
7. **Disproved the "GitHub Pages" hypothesis** by reading the component graph instead of the DNS: the site is Firebase-hosted, so no `has_pages` setting could have linked it.
8. **Measured browser-bundle feasibility instead of guessing.** `@typespec/compiler` core (1.17.0) bundles for `--platform=browser` with **zero** unresolved builtins: 1,923,564 B raw, 359,150 B gzip. This is the single most useful fact produced this session.
9. **Narrowed the blocker.** Only `@typespec/compiler/testing` is Node-bound (`assert`, `url`, `fs/promises`). The core compiler is not. So the browser path is "write a `CompilerHost`", not "port the compiler".
10. **Confirmed our own emitter is browser-safe at the import level** — zero `node:` specifiers in `dist/src`.
11. **Recovered from two tool-path failures without repeating them**: `.bin/esbuild` does not exist at the root (esbuild 0.28.1 lives under `.pnpm`), and an entry file in `/tmp` cannot resolve repo `node_modules` — both diagnosed, not retried blindly.
12. **Produced a correction to the user's mental model**: the hero does not show "api.tsp → AsyncAPI"; it shows api.tsp only, and the arrow is a scroll away.

---

## 2. (b) PARTIALLY DONE

1. **Browser-demo design.** Feasibility is proven with a number; there is no design, no host implementation, no ADR, and no decision on lazy-load trigger, worker usage, or CSP impact.
2. **Logo fix.** Diagnosed down to the file and line. Not implemented. No horizontal lockup Astro component exists.
3. **Hero restructure.** Diagnosed and specified in prose. Not implemented — not one line of `HeroSection.astro` changed.
4. **`assets/brand/README.md` correction.** Found, and then **mis-cited in my reply** (see §4.4). Still unfixed in the repo.
5. **Answering the first message in full.** Two of three questions were answered in the first reply; the logo question was only answered after the user pushed back a second time.
6. **The `270+-test compliance suite` claim.** Noticed while reading `HeroSection.astro:67`. Not verified, not corrected, not wired to a generated stat.
7. **The esbuild spike.** It built. It was never executed. Bundling success is not runtime success.

---

## 3. (c) NOT STARTED

1. No intentional source changes — zero files in `src/`, `website/src/`, or `scripts/` were written.
2. **No todo list** was created for a task that clearly needed one.
3. No verification gate was run: not `pnpm run verify`, not `pnpm --filter typespec-asyncapi-website run check`, not `pnpm run brand:check`, not `nix flake check`.
4. The 3 local commits were not pushed.
5. No CSP analysis for a lazily loaded ~1.9 MB module.
6. No in-memory `CompilerHost`.
7. No TypeSpec stdlib inlining strategy.
8. No plan for registering `@lars-artmann/typespec-asyncapi` as a loadable library in a virtual FS.
9. The bundle was never executed — no proof that `compile()` returns.
10. No parity check between browser output and `tsp compile` output.
11. No progressive-enhancement plan (what a no-JS visitor sees).
12. No performance budget for the landing page.
13. No accessibility plan for a live demo (output announcements, keyboard path).
14. No `Worker` isolation plan.
15. No build-time snapshot of the real emitted AsyncAPI for the hero example.
16. `.spike/` was not removed and not git-ignored.

---

## 4. (d) TOTALLY FUCKED UP

### 4.1 A 1.9 MB build artifact is now committed to git

`.spike/out2.js` is **1,923,564 bytes**, committed by the auto-commit daemon in `e02bec85`
(`git cat-file -s HEAD:.spike/out2.js` → `1923564`).

It is unpushed — `git branch -r --contains` returns nothing — but it is in local history and the very next `git push` will carry it to GitHub permanently. The repo's own convention is that generated bundles do not belong in git; the emitter already ships a 988 K `dist/` that is git-ignored.

Cause, in order:

1. I wrote the first spike entry in `/tmp/tsp-spike`, which cannot resolve repo `node_modules`.
2. Instead of fixing resolution or using a git-ignored location, I moved the scratch dir **into the repo** as `.spike/`.
3. I never added `.spike/` to `.gitignore` before writing into it.
4. A daemon that commits every ~30 seconds was already documented as running, and I did not check `git status` after the build.

Three independent things had to go wrong for this to land, and all three did.

### 4.2 I misattributed the brand README error I was reporting

I told the user `assets/brand/README.md:35` claims the **horizontal** lockup is "Consumed by: website hero".

That is wrong. Line 35 is the **stacked** lockup row (`lockup-stacked-dark.svg` → "website hero, gallery snapshot"); line 41 is `PipelineLockup.astro` → "Landing page hero". The horizontal lockups are documented correctly (README only). Both hero claims _are_ false — the component renders in `PipelineSection`, mid-page — but I cited the wrong row and the wrong artifact while correcting someone else's documentation. Correction errors are worse than the original error.

### 4.3 "Bundles" was reported as if it meant "works"

I measured a build and described a demo. Nothing was executed. If `compile()` throws on a missing host method or a dynamic `import()`, 359 KB of gzip is worthless. The number is real; the implication was not.

### 4.4 The hero height was an estimate presented as a measurement

I wrote that the hero is "≈ full viewport". I did not open a browser, did not run Lighthouse, did not measure. The structural argument stands regardless (`pt-36` + badge row + H1 + 2 paragraphs + 2 CTAs + install line + a ~300 px code card), but the number was invented.

### 4.5 No todo list on a multi-step task

The task was explicitly decomposed into steps and I tracked them in prose. The result is exactly what the format prevents: I lost track of the cleanup step and the verification step, and shipped neither.

### 4.6 Zero verification

For a session whose only deliverable was claims, none of the claims were checked against a gate. `brand:check` in particular would have caught the doc drift I was reporting.

### 4.7 Three commits left unpushed

The tip of `master` therefore still has no CI run — the exact blind spot the previous report (`docs/status/2026-11-02_06-06_ci-green-but-security-red.md`) was written about. I read that report's lesson and then reproduced the failure.

---

## 5. (e) WHAT WE SHOULD IMPROVE

### 5.1 Spike discipline: git-ignore before you create

The rule should be mechanical, not a judgement call:

- Scratch work that must live inside the repo goes in a path that is **already** in `.gitignore`, committed first.
- `/tmp` is not a workaround — Node resolution breaks, and that failure is what pushed the mess into the repo.
- After **every** command that produces files, run `git status --short`. With a 30 s auto-commit daemon, "later" does not exist.

Candidate ignored paths: `.scratch/`, `.spike/`, `tmp/`.

### 5.2 The auto-commit daemon is a hazard, not a convenience

It committed a 1.9 MB minified bundle within one cycle. Its heuristic is "any changed file", with no size cap, no path allowlist, and no generated-artifact detection. Concrete hardening:

| Guard                       | Where               | Effect                                                |
| --------------------------- | ------------------- | ----------------------------------------------------- |
| Max blob size (e.g. 512 KB) | daemon / pre-commit | Refuses to stage bundles and lockfile blobs           |
| Path allowlist              | daemon              | Never touches `.scratch/`, `tmp/`, `*.log`, `.crush/` |
| Generated-file detection    | pre-commit          | Skips `dist/`, `*.min.js`, `.out.css`                 |
| `git status` post-condition | every agent command | Surfaces the race immediately                         |

### 5.3 Answer every part of a multi-part question in one pass

The user asked three questions. I answered two and let the third wait for a follow-up. That is a cheap failure with a real cost: the user had to re-ask.

### 5.4 Verify before asserting, especially when correcting

Every factual sentence should carry the command that produced it. When the sentence is a _correction of someone else's documentation_, the bar is higher, because being confidently wrong about a wrong claim destroys the whole audit.

### 5.5 Separate "it builds" from "it runs"

Cheap next step the first time: execute the bundle in Node with a stubbed `window`, or in a headless browser. A bundler that resolves imports proves module graph health, nothing more.

### 5.6 Report measurements with method

"359 KB gzip" is only meaningful with the tool (`esbuild 0.28.1`), the flags (`--bundle --format=esm --platform=browser`), and the metric (`gzip -c | wc -c`). Without them the number is not reproducible.

### 5.7 The landing page has a structural problem, not a content problem

The hero duplicates a section that exists 300 px below it, and the CTA points downward at its own duplicate. Any fix that only changes wording will leave the duplication intact. The page needs one owner for the transformation: the hero.

### 5.8 Documentation that names consumers must be checked against imports

`assets/brand/README.md` has a "Consumed by" column with two false entries. A doc table that asserts a relationship nobody verifies is worse than no table. Either add a `brand:check` assertion that each named consumer actually imports the artifact, or drop the column and let `grep` answer the question.

---

## 6. (f) UP TO 50 THINGS TO GET DONE NEXT

Ranked by impact ÷ effort. Items 1–4 are cleanup of this session's damage and should precede everything else.

| #  | Task                                                                                                | Why                                                 |
| -- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1  | Remove `.spike/` from the working tree and the index                                                | 1.9 MB of junk must not reach GitHub                |
| 2  | Add `.spike/` and `.scratch/` to `.gitignore` **before** any further spike                          | Prevents recurrence, not just this instance         |
| 3  | Decide the history question: rewrite the 3 unpushed commits or carry the blob                       | Irreversible either way — see §7.1                  |
| 4  | Push the local commits so the tip of `master` gets a CI run                                         | The previous report's own lesson                    |
| 5  | Actually **execute** the browser bundle to prove `compile()` returns                                | "Bundles" ≠ "works"                                 |
| 6  | Implement a minimal in-memory `CompilerHost` (`readFile`/`readDir`/`stat`/`realpath`/`getJsImport`) | The real blocker                                    |
| 7  | Inline the TypeSpec stdlib `.tsp` sources as a virtual FS                                           | Without it nothing compiles                         |
| 8  | Register our emitter as a loadable library in that host                                             | The whole point                                     |
| 9  | Verify in-browser output equals `tsp compile` output for the hero example                           | Otherwise the demo is fiction                       |
| 10 | Add a build-time snapshot of the real emitted AsyncAPI for the hero example                         | Enables a no-JS hero                                |
| 11 | Restructure the hero: TypeSpec input left, AsyncAPI output right, one arrow                         | Fixes the fold problem at its root                  |
| 12 | Delete the hero's input-only code card                                                              | Removes the duplicate                               |
| 13 | Demote `ShowcaseSection` to the interactive demo (or delete it)                                     | One owner per message                               |
| 14 | Repoint or remove the `#demo` anchor                                                                | The CTA must not point at a deleted block           |
| 15 | Add a `LockupHorizontal.astro` component to the brand generator                                     | The new logo has no component                       |
| 16 | Use the horizontal lockup in the hero                                                               | Answers the logo question concretely                |
| 17 | Fix `assets/brand/README.md:35` and `:41`                                                           | Two false consumer claims                           |
| 18 | Add a `brand:check` assertion that documented consumers really import the artifact                  | Kills this error class                              |
| 19 | Replace the hardcoded "270+-test compliance suite" with a generated stat                            | Unverified number in the H1 block                   |
| 20 | Add the test count to `scripts/sync-stats.mjs`                                                      | So it cannot drift again                            |
| 21 | Measure real above-the-fold height at 1280×800 and 390×844                                          | Replace the invented number                         |
| 22 | Run `pnpm --filter typespec-asyncapi-website run check`                                             | Website gate has not run this session               |
| 23 | Run `pnpm run brand:check`                                                                          | Would have caught §4.2's subject                    |
| 24 | Run `pnpm run verify`                                                                               | Root gate has not run this session                  |
| 25 | Run `nix flake check`                                                                               | Format/lint/duplication in a cold sandbox           |
| 26 | Analyse CSP impact of a lazily loaded module                                                        | `script-src` is hash-controlled                     |
| 27 | Choose the demo load trigger (click / intersection / idle)                                          | Must not regress LCP                                |
| 28 | Run the compiler in a `Worker`                                                                      | 1.9 MB parse on the main thread will jank           |
| 29 | Add a `noscript` path that still shows the transformation                                           | Progressive enhancement                             |
| 30 | Add `aria-live="polite"` to the output region                                                       | A live demo must announce                           |
| 31 | Make the demo editor keyboard-reachable and labelled                                                | Accessibility                                       |
| 32 | Never `set:html` user input; build DOM nodes                                                        | XSS via the demo editor                             |
| 33 | Cap demo input length                                                                               | Prevent UI lockup                                   |
| 34 | Add a "copy AsyncAPI" action to the demo                                                            | Same affordance as the current cards                |
| 35 | Add a "download .yaml" action                                                                       | Turns the demo into a tool                          |
| 36 | Verify `copy-code.js` still works after the hero rewrite                                            | It targets `#copy-btn`                              |
| 37 | Decide the honest label: full compiler vs documented subset                                         | Trust                                               |
| 38 | Write an ADR for in-browser compilation                                                             | Durable rationale                                   |
| 39 | Document the demo's guarantees on the docs site                                                     | Avoid implied parity                                |
| 40 | Port the demo to `/playground/` in the docs site                                                    | Reusable, not landing-only                          |
| 41 | Add a bundle-size budget check to the website gate                                                  | 1.9 MB should be deliberate                         |
| 42 | Add a Lighthouse/CWV budget for the landing page                                                    | The demo will move LCP                              |
| 43 | Add a pre-commit guard rejecting files over 512 KB                                                  | Structural fix for §4.1                             |
| 44 | Constrain the auto-commit daemon with a path allowlist                                              | Structural fix for §4.1                             |
| 45 | Add `.crush/` and build output to the ignore list if absent                                         | Check, do not assume                                |
| 46 | Re-read `docs/status/2026-11-02_06-06_ci-green-but-security-red.md` §6 and merge its 50 items       | Two backlogs are drifting apart                     |
| 47 | Harvest this report's §6 into `TODO_LIST.md`                                                        | Reports are snapshots; `TODO_LIST` is the live list |
| 48 | Add a `status-report` cross-check that tasks are not duplicated across snapshots                    | 90 status files now                                 |
| 49 | Verify the `examples` count (15) matches the docs claim                                             | Same drift class as #19                             |
| 50 | Add a link check for `#demo` anchors across the site                                                | Anchor rot after the restructure                    |

---

## 7. (g) THREE QUESTIONS I CANNOT ANSWER MYSELF

### 7.1 Purge the 1.9 MB blob from history, or carry it?

The three commits are unpushed. Two options:

- **Rewrite** (`git rebase -i` dropping the file, or `filter-repo`) — clean history, but rewriting anything is the kind of operation this repo's rules treat as dangerous, and the daemon may race it.
- **Carry** — remove the file going forward and accept a 1.9 MB blob in `master` forever.

I will not rewrite history without your word. Which way?

### 7.2 Real compiler or documented subset for the demo?

- **Real compiler**: proven to bundle at 359 KB gzip, but needs a `CompilerHost`, inlined stdlib, an emitter registration, and a Worker. Days of work. Output is guaranteed to match `tsp compile`.
- **Documented subset**: a purpose-built mini emitter, ~20 KB, hours of work, and it will drift from real behaviour the first time the emitter changes — unless its output is snapshot-locked against the real emitter on a corpus.

Which tradeoff do you want on a _landing page_?

### 7.3 Which lockup belongs in the hero?

- The **horizontal 352×54** you shipped yesterday (nothing consumes it today).
- The **stacked 126×112**, currently buried in "How it works".
- **Neither** — the H1 already says what the product does, and a logo above it may be noise.

This is a taste call I should not make for you.

---

## 8. Verification Log

```bash
$ date "+%Y-%m-%d %H:%M %Z"
2026-11-02 10:16 CET

$ git rev-list --count origin/master..master
3

$ git log --oneline --diff-filter=A -- .spike
e02bec85 chore: auto-commit 1 changed file(s) (heuristic)

$ git cat-file -s HEAD:.spike/out2.js
1923564

$ git branch -r --contains e02bec85
            # no remote contains it — unpushed

$ du -sh node_modules/@typespec/compiler/dist node_modules/@typespec/asset-emitter/dist dist
6.7M    node_modules/@typespec/compiler/dist
284K    node_modules/@typespec/asset-emitter/dist
988K    dist

# core compiler, browser target
$ node_modules/.pnpm/esbuild@0.28.1/node_modules/esbuild/bin/esbuild .spike/entry2.mjs \
    --bundle --format=esm --platform=browser --outfile=.spike/out2.js
# → no errors
$ ls -la .spike/out2.js && gzip -c .spike/out2.js | wc -c
-rw-r--r-- 1 lars users 1923564 .spike/out2.js
359150

# testing entrypoint, browser target
$ node_modules/.pnpm/esbuild@0.28.1/node_modules/esbuild/bin/esbuild .spike/entry.mjs \
    --bundle --format=esm --platform=browser --outfile=.spike/out.js
✘ [ERROR] Could not resolve "assert"          (testing/test-utils.js:1)
✘ [ERROR] Could not resolve "url"             (testing/test-utils.js:2)
✘ [ERROR] Could not resolve "assert"          (testing/expect.js:1)
✘ [ERROR] Could not resolve "assert"          (testing/test-host.js:1)
✘ [ERROR] Could not resolve "fs/promises"     (testing/test-host.js:2)

$ grep -rn "Logo\|PipelineLockup" website/src --include=*.astro | grep import
website/src/components/Footer.astro:2:import Logo from './Logo.astro';
website/src/components/Header.astro:2:import Logo from './Logo.astro';
website/src/components/PipelineSection.astro:3:import PipelineLockup from './PipelineLockup.astro';
# → lockup-horizontal-{dark,light}.svg have zero importers

$ grep -n "website hero\|Landing page hero" assets/brand/README.md
35:| `lockup-stacked-dark.svg` | ... | website hero, gallery snapshot |
41:| `../../website/src/components/PipelineLockup.astro` | ... | Landing page hero |
```

---

## 9. Handoff

**Nothing is broken by this session except the git history in §4.1.** No source file was modified; the website still renders exactly as before.

**The two facts worth carrying forward:**

1. `@typespec/compiler` core is browser-bundleable (359 KB gzip); `@typespec/compiler/testing` is not. The browser demo is a `CompilerHost` problem, not a compiler problem.
2. The hero's code card is a duplicate of a section 300 px below it and shows only the setup. The fix is structural: one owner for the transformation, above the fold.

**Blocked on §7.** All three questions are decision-shaped, not research-shaped. No further work should start until 7.1 is answered, because that one determines whether the next commit can even be pushed.

---

_Generated 2026-11-02 10:16 CET._
