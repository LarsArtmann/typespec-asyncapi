# Status Report — Issue #252: Mixed OpenAPI/AsyncAPI Emitter Support
> **Live remainder:** none — every item resolved in the 2026-11-19/20 corpus sweep (verdicts inline; routed work lives in TODO_LIST.md / ROADMAP.md).

**Date:** 2026-10-03 06:31 CEST
**Scope:** This session only — issue #252 review, root-cause analysis, and the follow-up improvement work. No unrelated research.
**Session result:** Verify gate GREEN (build, lint, typecheck:test, 1249 tests / 0 fail, coverage 98.0% avg over 44 files / 75% per-file floor, jscpd 0 clones, 15/15 examples AJV-valid).

---

## a) FULLY DONE

~~1. **Issue #252 reproduced exactly** — the reporter's spec shape yields their two `@typespec/http/duplicate-operation` errors verbatim.~~ done — `test/integration/mixed-http-emitters.test.ts:41` locks the reporter's spec verbatim
~~2. **Root cause chain verified at source level** (compiler/http 1.16.0):~~ done — AGENTS.md line 190 documents the verified root-cause chain
   - `@typespec/http` has a program-level `$onValidate` that HTTP-routes every op under a `@service` namespace on _every_ compile — proven to fire with `noEmit` and with either emitter disabled. The reporter's guess ("OpenAPI emitter fallback logic") was close but the trigger is library-level validation.
   - Blockless `namespace A.B;` is a file-level ambient scope and later _dotted_ declarations resolve relative to it (`namespace A.B.C {}` → `A.B.A.B.C`). The reporter's second `namespace Service.Backend {}` block actually nests. Verified via namespace-tree dump.
   - Verb-less ops default to GET; route-less ops under a service default to `/`.
~~3. **Phantom-GET leak proven** — the reporter's "worked so far" single-event setup silently emits `GET /api/v1` / `operationId: Events_receivePing` into the OpenAPI document.~~ done — the suite now has 20 tests (`test/integration/mixed-http-emitters.test.ts`)
~~4. **Reverse leak discovered and fixed** — bare REST ops at global-depth-1 namespaces were discovered as AsyncAPI channels (`getThing` appeared in `channels`). Guard added in `src/builders/operation-discovery.ts` (skip bare ops under `@service` when http is loaded AND decorated ops exist; pure minimal specs unchanged).~~ done — `examples/mixed-rest-events/` exists and passes `check-examples`
~~5. **New warning `event-op-in-service-namespace`** — `src/lib.ts` code + `src/builders/cross-emitter-validation.ts` (warns when event ops sit inside a service subtree while http is loaded; http/https AsyncAPI servers exempt as intentional AsyncAPI-over-HTTP; `#suppress`-able), wired into `document-builder.ts`.~~ done — AGENTS gotchas and the FEATURES mixed-emitter row exist
~~6. **Test infrastructure** — `@typespec/http` auto-detection in `test/utils/test-helpers.ts` (mirrors the versioning pattern); 7 new tests in `test/integration/mixed-http-emitters.test.ts`, all passing.~~ done — posted 2026-10-03 (TODO_LIST: issuecomment-5970180678)
~~7. **`examples/mixed-rest-events/`** — canonical split pattern emitting both OpenAPI 3.1 and AsyncAPI 3.1 from one spec; verified clean separation (`getHealth`/`createOrder` REST-only, `health/pong`/`orders/created` AsyncAPI-only); passes `check-examples` (now 15 examples).~~ done — verify gate green; 1.1.0 shipped through it the same day
~~8. **Docs updated** — AGENTS.md: two new gotchas (ambient-namespace relative nesting; http routing semantics + shipped mitigations). FEATURES.md: mixed-emitter row, examples count 14→15, diagnostics count corrected.~~ done — AGENTS gotchas and the FEATURES mixed row exist (AGENTS lines 169 and 190)
~~9. **Issue reply drafted** (twice: pre- and post-implementation wording) — NOT posted, awaiting go-ahead.~~ done — posted 2026-10-03 (TODO_LIST: issuecomment-5970180678)
~~10. **Full verify gate green** after all changes.~~ done — gate green; 1.1.0 shipped through it the same day

## b) PARTIALLY DONE

~~1. **Issue #252 response** — analysis complete, reply drafted and refined, but not posted. The reporter is still waiting.~~ done — posted 2026-10-03 (TODO_LIST: issuecomment-5970180678)
~~2. **Repo hygiene after scratch work** — scratch repro scripts were trashed, but the auto-commit daemon committed them mid-session before deletion; history contains add+delete noise and stale LSP diagnostics polluted tool output for the rest of the session.~~ **NOT-DO — session-end hygiene note; nothing owed.**
~~3. **Docs consistency** — AGENTS.md/FEATURES.md updated, but CHANGELOG.md, TODO_LIST.md, ROADMAP.md, README.md, and examples/README.md were NOT touched (see c/e).~~ done — CHANGELOG entries landed at lines 145 and 185

## c) NOT STARTED

~~1. **CHANGELOG.md entry** for the new warning, the bare-op guard, and the example — required before any release; project has an established changelog.~~ done — CHANGELOG lines 145 and 185 carry the warning and leak-fix entries
~~2. **TODO_LIST/ROADMAP harvest** from this report's (f) list.~~ done — harvested: TODO_LIST Mixed-Emitter section cites the 10-03 reports
~~3. **README.md audit** — unknown whether README or examples/README.md enumerate diagnostics/examples counts that now drift. Not checked this session.~~ done — README carries current counts (README.md line 336)
~~4. **Website/docs-site content** — "Mixing with OpenAPI" page (AGENTS notes the competitor leads on docs site).~~ done — live at `website/src/content/docs/guides/mixing-with-openapi.md`
~~5. **Version bump + release** (1.0.1 vs 1.1.0 decision pending).~~ done — resolved as 1.1.0, shipped 2026-10-03
~~6. **Pre-tag frozen-lockfile verification** (AGENTS-documented release step; lockfile changed this session via the new example's deps — CI installability not explicitly re-verified with `--frozen-lockfile`).~~ done — exercised at the 1.1.0 tag; the ritual caught a live manifest re-drift (TODO_LIST Release)
~~7. **Suppression-path, @channel-only, nested-service, and nearest-server-escape tests** (see f).~~ done — all covered: suppress, nested-service, nearest-ancestor, no-server and bare-op cases at `mixed-http-emitters.test.ts:399`

## d) TOTALLY FUCKED UP (session failures, honestly)

~~1. **Wrong compiler-options shape wasted a full debug cycle** — I passed `emitters: {...}` (doesn't exist) to `compile()`; it was silently ignored, and I _initially misread the resulting output_ as evidence that our emitter triggered http validation. I nearly built the reply on a false premise. Caught only because zero output files appeared.~~ **NOT-DO — lesson logged.**
~~2. **Two repro variants invalidated by my own unknown** — variants C/D used dotted namespaces after a blockless one; intermediate conclusions ("events still collide when split out") were artifacts of the ambient-namespace trap I only discovered afterwards. I wrote TypeSpec I hadn't fully understood and debugged my own spec bugs thinking they were product behavior.~~ **NOT-DO — lesson logged; the ambient-namespace trap is documented in AGENTS.md.**
~~3. **Three of seven first-draft tests were vacuously passing** — the specs had `blockless-namespace-first` errors, which skip emit; the "no warning expected" assertions passed because _nothing_ ran. Only test 1 failing exposed it. Without that, fake coverage would have shipped.~~ **NOT-DO — lesson logged.**
~~4. **Scratch files in a tracked directory** — `scripts/scratch-*.ts` + generated fixtures landed in `scripts/`, got auto-committed, then trashed: noisy history plus permanent stale-LSP noise in every subsequent tool result.~~ **NOT-DO — lesson logged; scratch stays outside the repo now.**
~~5. **FEATURES.md count "fixed" twice** — first to 31 (20+11, assumed), then recounted to the true 34 (20+14). The file was already stale (33) before me; I nonetheless edited-by-assumption before measuring. AGENTS explicitly says count in lib.ts, never trust hardcoded numbers.~~ **NOT-DO — lesson logged; the count-in-source policy is AGENTS.md line 30.**
~~6. **Minor: variant E mislabeled** in the scratch matrix (described as "service on root covering Rest+Events"; it actually only wrapped Rest). No downstream damage — it duplicated variant F.~~ **NOT-DO — no downstream damage.**
~~7. **A multiedit on the test file accidentally deleted the import block** (old_string swallowed too much context). Caught immediately by re-viewing; zero damage, but it's the exact edit-tool failure mode the rules warn about.~~ **NOT-DO — caught immediately; zero damage.**

## e) WHAT WE SHOULD IMPROVE (self-review answers)

**What did you forget?**

- CHANGELOG entry (release-blocking), TODO_LIST harvest, README/examples-README count audit, and the AGENTS "Key Tests" list (doesn't mention `mixed-http-emitters.test.ts` yet).
- The pre-tag `pnpm install --frozen-lockfile && verify` ritual from AGENTS — the lockfile changed and I didn't run it.
- Nothing was left unwired: no ghost systems (validation is called in the pipeline, guard is in the discovery loop, both are test-exercised, example runs in CI).

**What could you have done better?**

- Verify the option knob actually applies before drawing conclusions from output (the `emitters:` bug).
- Write the ambient-namespace semantics test FIRST as a 6-line minimal spec; it would have invalidated variants C/D in one minute instead of an hour of misdirection.
- Structure negative-expectation tests so they fail when the phase under test never runs (e.g. additionally assert the AsyncAPI document was produced, or assert on total diagnostic shape). Three vacuous passes is a process failure, not bad luck.
- Keep scratch outside the repo (or in a gitignored dir) — the daemon commits everything.
- Count before editing counts.

**What could you still improve?**

- **Warning spam**: the warning fires per operation; a 50-event namespace under a service yields 50 warnings. Dedupe per (service, namespace) is a small UX win.
- **`findEnclosingServiceNamespace` recomputes `listServices` per bare op** in the discovery loop — O(ops × services × depth). Fine now (realworld suite + gate green), but memoize if benchmarks ever regress.
- **Escape-hatch semantics** ("nearest ancestor with any AsyncAPI server wins") are only documented in code — needs a locking test and one line in the message or docs.
- **Residual false positive**: events under a service with NO AsyncAPI server anywhere still warn. Intentional, but untested and undocumented.
- **Split-brain watch**: the validation iterates `state.channels`/`state.operations` directly instead of `ctx.discoveredOps` — correct today (state is the source of truth), but if discovery filtering ever diverges, the warning could fire for ops that aren't emitted. A comment or a shared iterator would pin the coupling.
- **Example gate gap**: `check-examples` only AJV-validates the AsyncAPI document; the mixed example's OpenAPI output is never schema-validated.

**Did you lie?** No — but two claims deserved more hedging than they got: "verified end-to-end" (true for the four repro variants + example, but variants C/D were initially wrong before rework), and the diagnostics-count fix needed two attempts to become true.

**How can we be less stupid?** Encode the three process lessons (below) as cross-project lessons in the crush-config repo; add the phase-ran assertion pattern to the test helper conventions in AGENTS.

## f) Next things (impact-ordered; DO NOW → TODO_LIST → ROADMAP routing)

| #  | Task                                                                                      | Route             | Impact                        |
| -- | ----------------------------------------------------------------------------------------- | ----------------- | ----------------------------- |
| ~~1~~ done — posted 2026-10-03 (TODO_LIST: issuecomment-5970180678) | ~~Post the issue #252 reply (final wording incl. new warning + example link)~~ | ~~DO NOW~~ | ~~Reporter unblocked~~ |
| ~~2~~ done — CHANGELOG lines 145 and 185 | ~~CHANGELOG.md entry for warning + bare-op guard + example~~ | ~~DO NOW~~ | ~~Release-blocking~~ |
| ~~3~~ done — resolved as 1.1.0, shipped 2026-10-03 | ~~Version call + release (1.0.1 vs 1.1.0)~~ | ~~DO NOW (decision)~~ | ~~Ships the fix~~ |
| ~~4~~ done — exercised at the 1.1.0 tag (TODO_LIST Release section) | ~~Pre-tag ritual: `pnpm install --lockfile-only && --frozen-lockfile && verify`~~ | ~~DO NOW~~ | ~~CI-proven release~~ |
| ~~5~~ done — harvested into TODO_LIST Mixed-Emitter the same day | ~~Harvest this list into TODO_LIST/ROADMAP~~ | ~~DO NOW~~ | ~~No entombed tasks~~ |
| ~~6~~ done — `@channel`-only case at `test/integration/mixed-http-emitters.test.ts:469` | ~~Test: `@channel`-only op (1b path) gets the warning~~ | ~~TODO_LIST~~ | ~~Coverage~~ |
| ~~7~~ done — suppression test at `test/integration/mixed-http-emitters.test.ts:435` | ~~Test: `#suppress` works for `event-op-in-service-namespace`~~ | ~~TODO_LIST~~ | ~~UX lock~~ |
| ~~8~~ done — innermost-service test at `test/integration/mixed-http-emitters.test.ts:499` | ~~Test: nested `@service` namespaces (inner service wins)~~ | ~~TODO_LIST~~ | ~~Semantics lock~~ |
| ~~9~~ done — nearest-ancestor cases at `test/integration/mixed-http-emitters.test.ts:534` and `:573` | ~~Test: nearest-ancestor server escape order (wss root + http inner → exempt)~~ | ~~TODO_LIST~~ | ~~Escape lock~~ |
| ~~10~~ done — no-server case at `test/integration/mixed-http-emitters.test.ts:608` | ~~Test: events under service with NO server → still warns (documented residual FP)~~ | ~~TODO_LIST~~ | ~~Honest lock~~ |
| ~~11~~ done — guard semantics locked at `test/integration/mixed-http-emitters.test.ts:250` and `:263` | ~~Test: two bare ops + http + NO decorated ops → both still discovered (guard semantics)~~ | ~~TODO_LIST~~ | ~~Regression lock~~ |
| ~~12~~ **Won't implement — no helper convention codified; the mixed tests assert documents and diagnostics together.** | ~~Assert "emit actually ran" in negative tests (asyncApiDoc non-null) — helper convention~~ | ~~TODO_LIST~~ | ~~Kills vacuous passes~~ |
| ~~13~~ done — `test/realworld/issue-252.test.ts` plus the verbatim case at `mixed-http-emitters.test.ts:41` | ~~Add the reporter's exact spec as `test/realworld/issue-252.tsp` fixture~~ | ~~TODO_LIST~~ | ~~Regression~~ |
| ~~14~~ done — `test/golden/mixed-rest-events.expected.yaml` | ~~Golden-file lock for `examples/mixed-rest-events` outputs (both documents)~~ | ~~TODO_LIST~~ | ~~Output stability~~ |
| ~~15~~ done — dedupe shipped: warns once per namespace (AGENTS line 73; test at line 326) | ~~Dedupe warning per (service, namespace) instead of per op~~ | ~~TODO_LIST~~ | ~~UX~~ |
| ~~16~~ done — README carries current counts (README.md line 336) | ~~Audit README.md + examples/README.md for count drift (diagnostics 34, examples 15)~~ | ~~TODO_LIST~~ | ~~Docs truth~~ |
| ~~17~~ done — AGENTS.md line 190 cites `mixed-http-emitters.test.ts` as the lock | ~~Add mixed-http-emitters to AGENTS "Key Tests" list~~ | ~~TODO_LIST~~ | ~~Docs truth~~ |
| ~~18~~ done — structural validation shipped: `validateOpenApiDocument` in `scripts/check-examples.ts:77` incl. the no-leak guarantee | ~~Validate the mixed example's OpenAPI output in `check-examples` (OpenAPI 3.1 AJV)~~ | ~~TODO_LIST~~ | ~~Gate gap~~ |
| ~~19~~ **Won't implement — never memoized; gate and realworld suite stayed green.** | ~~Memoize service-set computation in discovery loop~~ | ~~TODO_LIST~~ | ~~Perf (minor now)~~ |
| ~~20~~ done — coverage gate green at 98.1 percent average | ~~Per-file coverage check for `cross-emitter-validation.ts`; top up if near 75% floor~~ | ~~TODO_LIST~~ | ~~Gate margin~~ |
| ~~21~~ **Won't implement — no discovery-guard benchmark exists.** | ~~Benchmark discovery pre/post guard on large spec~~ | ~~TODO_LIST~~ | ~~Perf evidence~~ |
| ~~22~~ done — README line 328 links the mixing guide | ~~README FAQ: "Can I mix this with @typespec/openapi3?"~~ | ~~TODO_LIST~~ | ~~Discovery~~ |
| ~~23~~ done — live at `website/src/content/docs/guides/mixing-with-openapi.md` | ~~Website docs page: mixing with OpenAPI (competitor gap)~~ | ~~ROADMAP~~ | ~~Market~~ |
| ~~24~~ done — `test/property/mixed-ownership-properties.test.ts` locks zero cross-leak | ~~Property test: mixed http+events generator asserting zero cross-leak~~ | ~~ROADMAP~~ | ~~Invariant~~ |
| 25 **→ TODO_LIST §Mixed-Emitter — crush-config lessons commit row** | Commit session lessons to crush-config `references/lessons.md` | ROADMAP (Lars) | Cross-project |
| ~~26~~ **Won't implement — no marker shipped; no false-positive reports since.** | ~~Consider an `@asyncapiOnly`-style explicit marker if warning FPs ever surface in the wild~~ | ~~ROADMAP~~ | ~~Future API (post-1.0 caution)~~ |
| ~~27~~ **NOT-DO — process note; recorded.** | ~~LSP hygiene: `lsp_restart` at session start when stale file diagnostics appear~~ | ~~Process note~~ | ~~Session quality~~ |

## g) Questions I cannot answer myself

~~1. **Post the reply?** The issue #252 reply is drafted (analysis + fix + new-warning/example addendum). Post it as-is, or do you want to review the wording first?~~ done — posted 2026-10-03 (TODO_LIST: issuecomment-5970180678)
~~2. **Version:** new diagnostic + a conditional output change (bare-op guard) on top of v1.0.0 — `1.0.1` patch or `1.1.0` minor? And release now or batch with whatever's next?~~ done — resolved as 1.1.0, shipped 2026-10-03
~~3. **Cross-repo writes:** may I (a) commit the two process lessons to the crush-config repo's `references/lessons.md` (option-knob verification; vacuous-test trap), and (b) harvest this report's (f) list into TODO_LIST/ROADMAP now, or leave that to a docs-health pass?~~ done — harvest landed (TODO_LIST Mixed-Emitter); the lessons row tracks the crush-config commit

---

_Written by Crush. Point-in-time snapshot; ANNOTATE, never rewrite, when bringing it current._

---

## Appendix (2026-10-03, post-report session continuation)

The user asked whether the exact GitHub issue spec was a test. It was not — and adding it (now
`test/integration/mixed-http-emitters.test.ts`, "reports the issue #252 spec verbatim") exposed a
real defect in what this report called done:

- **(d) addendum:** the `event-op-in-service-namespace` warning originally ran in the emit
  pipeline. On the reporter's exact two-op spec, `@typespec/http`'s duplicate-operation ERRORS
  skip emitter execution entirely, so the warning fired 0 times for its target scenario
  (verified by the failing test: expected 2, got 0).
- **Fix shipped:** validation moved to a library `$onValidate` hook, registered via
  `src/tsp-index.ts` (the compiler binds hooks from the tsp-index module, not the package
  index — mirrored from `@typespec/http`'s wiring). The warning now fires during program
  validation, BEFORE emitters, and surfaces alongside http's errors.
- **Section (f) item 13 ("exact issue spec fixture") is DONE**; the verbatim-spec test asserts
  2 http duplicate errors AND 2 of our warnings.
- Gate re-verified after the change: 1250 tests green, coverage gate passed, 0 clones,
  15/15 examples (including re-running `check-examples` post-hook-change). The single
  property-test timeout seen mid-verification was self-inflicted (two concurrent gate runs);
  solo run passes 6/6.
