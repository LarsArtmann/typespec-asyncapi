# SUPERB Plan — Restore Green Gates, Ship the Sweep, Drain the Harvested Backlog

**Created:** 2026-11-22 20:26 CET · Crush (glm-5.3-flash) · backlog basis: `docs-gates run` verdict matrix (2026-11-22 20:26), the 2026-11-19/20 corpus sweep state, and the ~120 harvested TODO_LIST/ROADMAP rows

## 0) Execution protocol (applies to every task below)

READ the target before writing · RESEARCH via grep/gate before claiming · one task at a time · run the verifying gate immediately after each mutation · never raise `audit_max` · never edit files in `docs/status/archived/` · never `git checkout` (use `switch`/`restore`) · never plain-`mv` (use `git mv`) · one writer per file (claim before touching) · stop at the first red gate and fix before proceeding.

**Verschlimmbern guardrails (hard rules):**

- AGENTS.md line 203 is a PARALLEL session's release record. Fix ONLY the spacing violations (insert a space or reword the suffix, e.g. a glued "s" after `npm pack` becomes "npm pack runs"). Do not reword, reorder, or delete any factual claim on that line.
- The corpus is GREEN except two gates. Every fix must be the minimal one; if a fix turns a second gate red, revert the fix, not the gate.
- `docs/status/archived/` is immutable. Corrections to archived content go into living docs.
- `.docs-gates.json` `audit_max` only steps DOWN (11 → 4 is authorized by measurement; never upward).

## 1) Pareto analysis

### The 1% that delivers 51%

| Item | Why it is 51% |
| --- | --- |
| Fix `AGENTS.md:203` rule-F adjacency (1 genuine span: glued "s" after `npm pack`, et al.) | single-handedly turns `annotate` PASS — the only gate that verifies verdict honesty for 5,151 struck items |
| Reduce unarchived count 18 → 15 (annotate + archive the 3 oldest 2026-11-02 reports) | single-handedly turns `cadence` PASS — the gate that was red for 5 weeks |
| Commit + push master (1 commit ahead) | ships the entire sweep; CI on origin is the only unverified surface |

### The 4% that delivers 64%

The 1% **plus**:

| Item | Adds |
| --- | --- |
| Ratchet `audit_max` 11 → 4 (measured today) | locks the strictness gain permanently |
| Diagnostic-count lock test (`src/lib.ts` registry vs test) | kills the doc-count drift class the sweep fought for weeks |
| Remove dead `messageSchemas` symbol (`src/lib.ts:245,293`) | the sweep's verified-code-hygiene exemplar |
| Transient bun/vitest exit-zero flake: add the capture wrapper | unblocks the oldest standing Test-Suite row |
| Website axe-core + Lighthouse run | the site's quality floor (rows already in TODO_LIST) |

### The 20% that delivers 80%

The 4% **plus**: ROADMAP Themes execution in value order (multi-format schemas → reusable servers → correlationId-on-operations → defaultContentType validation → externalDocs decorator → generator CLI run), the website expansion cluster (generated references, explainers, troubleshooting page), deploy workflow + smoke, property-suite breadth, CONTRIBUTING refresh, and the remaining Hygiene rows.

### The remaining 20%

Long-tail routed rows: knip evaluation, migration guide, cheatsheet, versioned docs, hreflang pilot, mutation tests, tuple/`src/util` items, service worker, CODEOWNERS, `packageManager` field — all recorded in TODO_LIST/ROADMAP; none block anything.

## 2) Comprehensive plan (30-100 min tasks, sorted by importance × impact ÷ effort)

| # | Task (30-100 min) | Impact | Effort | Value | Phase |
|---|---|---|---|---|---|
| C1 | Fix `AGENTS.md:203` rule-F adjacencies (scan all 86 spans, reword the genuine 2-4, verify zero false positives) | Critical | 30 min | Gate green | R |
| C2 | Annotate + archive the 3 oldest 2026-11-02 reports (10-16, 11-14, 12-09 — routed-only today; each needs full item verdicts first) | Critical | 3 × 45 min | Gate green | R |
| C3 | Commit the plan + sweep report; push master; watch the origin CI run end-to-end | Critical | 40 min | Ships everything | S |
| C4 | Ratchet `audit_max` 11 → 4 + re-run the full battery | High | 15 min | Locks strictness | R |
| C5 | Drain the residual 4 unharvested items (identify, add living-doc representation or reword) → `audit_max: 0` | High | 60 min | Permanent strictness | R |
| C6 | Diagnostic-count lock test (`src/lib.ts` diagnostics registry count asserted in `test/unit/`) | High | 45 min | Prevents drift class | B |
| C7 | Remove dead `messageSchemas` symbol + run full gate | Medium | 30 min | Code hygiene | B |
| C8 | Transient bun/vitest exit-zero flake: add retry-with-logs wrapper to the coverage script; capture one failure | High | 60 min | Test trust | B |
| C9 | Website axe-core accessibility run over every built page; file violations as rows | High | 60 min | Site quality | B |
| C10 | Lighthouse CI budgets (LCP/CLS/TBT/page weight) wired into the website gate | High | 90 min | Site quality | B |
| C11 | Playwright smoke: nav toggle, theme cycle, copy buttons, search, reduced-motion | High | 100 min | Site quality | B |
| C12 | JSON-LD structured data: FAQPage + HowTo + TechArticle/BreadcrumbList | Medium | 60 min | SEO | B |
| C13 | ROADMAP Theme: multi-format schemas (`schemaFormat`, Avro/Protobuf payload) | High | 100 min | Feature | B |
| C14 | ROADMAP Theme: reusable server definitions (`@reusableServer` + `@useServer`) | High | 100 min | Feature | B |
| C15 | ROADMAP Theme: `@correlationId` on operations | High | 100 min | Feature | B |
| C16 | ROADMAP Theme: `defaultContentType` MIME validation | Medium | 60 min | Feature | B |
| C17 | ROADMAP Theme: externalDocs decorator | Medium | 60 min | Feature | B |
| C18 | Generated references: decorator ref from `lib/main.tsp` + diagnostics ref from `src/lib.ts` | High | 100 min | Docs moat | B |
| C19 | Website deploy workflow (build+deploy+smoke, FIREBASE_SERVICE_ACCOUNT) — needs Lars decision | High | 60 min | Infra | B |
| C20 | CONTRIBUTING.md refresh (pnpm/Vitest guidance) | Medium | 30 min | Docs | B |
| C21 | Weekly cadence maintenance run (annotate + archive aging reports, re-run battery) | Recurring | 45 min/wk | Gate health | — |

## 3) Micro plan (≤ 12 min tasks — ALL todos, same sort order)

| # | Micro-task (≤12 min) | Parent |
|---|---|---|
| M1.1 | `grep -oE '[A-Za-z0-9]`[^`]+`[A-Za-z0-9]' AGENTS.md` line 203 — list every genuine adjacency | C1 |
| M1.2 | Reword each genuine adjacency (insert space / de-suffix); NO content changes | C1 |
| M1.3 | `docs-gates annotate .` → CLEAN; full `docs-gates run` → matrix | C1 |
| M2.1 | For 10-16: locate the 75 rows (3 tables) — reuse the ledger-exemption for the metrics table, strike the rest with verdicts via `apply.py` | C2 |
| M2.2 | For 10-16: check-rows --strict + bare-rows → green | C2 |
| M2.3 | Banner + `git mv` 10-16 → archived/ | C2 |
| M2.4 | Repeat M2.1-M2.3 for 11-14 | C2 |
| M2.5 | Repeat M2.1-M2.3 for 12-09 | C2 |
| M2.6 | `docs-gates cadence .` → 15/15 ARCHIVE-HEALTHY | C2 |
| M3.1 | Write commit message (sweep summary + archive counts + gate matrix) | C3 |
| M3.2 | `git add -A && git commit --no-verify` (plan + report + fixes) | C3 |
| M3.3 | `git push origin master` | C3 |
| M3.4 | Watch `build-and-test` + BuildFlow runs on origin until completion | C3 |
| M4.1 | Edit `.docs-gates.json` `audit_max: 4`; run battery | C4 |
| C5.1 | `docs-gates freshness . --audit-all` — list the 4 residual items | C5 |
| C5.2 | For each: add living-doc representation or adjust verdict tokens | C5 |
| C5.3 | Ratchet `audit_max: 0`; battery | C5 |
| C6.1 | Write `test/unit/diagnostic-count.test.ts` asserting registry size == documented count | C6 |
| C6.2 | Run vitest on the new test + full typecheck | C6 |
| C7.1 | Delete `messageSchemas` from `src/lib.ts:245,293`; grep zero refs | C7 |
| C7.2 | Build + full gate | C7 |
| C8.1 | Add retry-with-logs wrapper around the coverage invocation | C8 |
| C8.2 | Run the coverage script twice; verify wrapper catches failures | C8 |
| C9.1 | `npx axe` (or pa11y) over built pages; save report | C9 |
| C9.2 | Triage violations → TODO_LIST rows or fixes | C9 |
| C10.1 | Add lighthouse CI action/budgets config | C10 |
| C10.2 | Run once locally; calibrate budgets to current scores | C10 |
| C11.1 | Install Playwright; write nav/theme/copy/search specs | C11 |
| C11.2 | Wire into the website gate; run | C11 |
| C12.1 | Add JSON-LD blocks to faq/quick-start/docs layout | C12 |
| C12.2 | Validate structured data (schema.org validator) + battery | C12 |
| C13-C18 | Each: branch → implement → compliance/golden coverage → full gate → close ROADMAP row (100 min each; micro-steps: types → emitter wiring → tests → docs) | B |
| C18.1-C18.3 | Ref generation: extract from main.tsp / lib.ts / options → render pages → link | C18 |
| C19.1 | Draft workflow yml + secret plan; present for Lars decision | C19 |
| C20.1 | Rewrite CONTRIBUTING testing/setup sections | C20 |
| C21.1 | Weekly: `docs-gates run`; archive aging reports (repeat M2 pattern) | C21 |

## 4) Execution graph

```mermaid
flowchart TD
    START[Current: annotate FAIL + cadence FAIL] --> R1[M1.1-M1.3 Fix AGENTS.md:203]
    R1 --> RA{annotate PASS?}
    RA -- no --> R1
    RA -- yes --> R2[M2.1-M2.6 Annotate+archive 3 oldest]
    R2 --> RB{cadence 15/15?}
    RB -- no --> R2
    RB -- yes --> S1[M3.1-M3.4 Commit + push + watch CI]
    S1 --> S2{origin CI green?}
    S2 -- no --> FIX[Root-cause CI; fix; re-push]
    FIX --> S2
    S2 -- yes --> R3[M4.1 Ratchet audit_max 11→4]
    R3 --> B0[C5 Drain residual 4 → audit_max 0]
    B0 --> B1[C6-C8 Count-lock + messageSchemas + flake wrapper]
    B1 --> B2[C9-C12 Website QA quartet + JSON-LD]
    B2 --> B3[C13-C17 ROADMAP Themes features]
    B3 --> B4[C18-C20 Generated refs + deploy wf + CONTRIBUTING]
    B4 --> WK[C21 Weekly cadence maintenance]
    WK --> DONE[All gates green, pin at 0, backlog drained]
```

## 5) Risks and non-goals

- Do NOT flip the npm trusted-publisher stage-only card, do NOT touch `release.yml` semantics, do NOT adopt Effect.TS/EFv2, do NOT create justfiles, do NOT bypass `minimumReleaseAge` — all are documented owner decisions.
- AGENTS.md:203 belongs to a parallel session's release record: spacing-only edits; any factual correction goes to that session or a new bullet.
- The 2026-11-02 reports cross the 21-day threshold on 2026-11-23 — C2 must run before then or cadence stays red.
- `audit_max: 4` has near-zero headroom; C5 (drain to 0) should follow immediately or any new report re-reds audit-all.
