# Merging `typespec-asyncapi` into `microsoft/typespec`

**Date:** 2026-09-13
**Scope:** Feasibility, effort estimate, risks, and alternatives for upstreaming this emitter as a first-party monorepo package (`@typespec/asyncapi`).
**Evidence:** All external claims verified live against `microsoft/typespec` via `gh api` on this date.

---

## TL;DR

| Question                    | Answer                                                                                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Is it technically feasible? | Yes, straightforwardly. Our architecture (asset-emitter based, vitest, oxlint) matches the monorepo's own emitter conventions.                                                                      |
| Active engineering effort   | ~8 to 15 focused days solo (mechanical migration + review cycles).                                                                                                                                  |
| The real gate               | Maintainer buy-in. Issue [#2463](https://github.com/microsoft/typespec/issues/2463) has asked for AsyncAPI support since Sep 2023 with strong demand and **no first-party commitment in ~3 years**. |
| Wall-clock time             | Weeks to months, dominated by the maintainer decision and review cycles, not code.                                                                                                                  |
| Recommendation              | Ask the gate question on #2463 first (1 day of work) before investing in any migration.                                                                                                             |

---

## 1. The real gate: maintainer buy-in

This is a product decision by the TypeSpec core team, not an engineering problem.

What the evidence shows:

- **Issue #2463 "POC TypeSpec to AsyncAPI"** was opened 2023-09-21 by `mikekistler` (Microsoft). It has 33 comments from a broad audience: `bterlson` (TypeSpec creator), `fmvilas` and `mario-guerra` (AsyncAPI co-founder / community lead), plus multiple enterprise adopters (SwissPost, others) asking for status and ETAs.
- **No PR exists.** A repo-wide search for AsyncAPI pull requests returns zero results.
- **The door is open but nobody has walked through it.** Lars already pitched the alpha (Aug 2025) and the 0.2.1-beta (Aug 2026) on that issue without a maintainer response committing to first-party adoption.
- **A competitor exists and was also just posted there:** `marvin-hsu` posted `tsp-asyncapi` (Aug 2026). Two third-party emitters circling the same issue may push maintainers to either pick one, accept one, or keep the "third-party emitters" status quo.
- **Earlier community feedback was harsh:** the v0.0.1-alpha was called "completely unusable" on the issue. The 0.2.x/0.3.x rewrite fixed this, but first impressions on that thread are a reputational headwind.
- Adjacent context: the monorepo now ships `@typespec/events` ("TypeSpec library providing events bindings"), showing Microsoft is investing in event-driven API design, but it is a library, not an AsyncAPI emitter. No naming collision with `TypeSpec.AsyncAPI`.
- Any PR to a Microsoft repo requires signing the **Microsoft CLA**. Under MIT, accepted contributions fall under Microsoft stewardship of the package name.

**Consequence:** Step zero is a one-day task: post a concise proposal on #2463 (scope, size, test evidence, differentiators, maintenance commitment) and explicitly ask whether the team wants `@typespec/asyncapi` as a first-party package. Everything else in this report is only worth doing after the answer is yes.

---

## 2. What we would be merging (source inventory)

Current state of this repo (measured 2026-09-13):

| Metric               | Value                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Version              | 0.3.0-beta.1 (`@lars-artmann/typespec-asyncapi`)                                                    |
| Source               | 45 files, ~7,100 LOC                                                                                |
| Tests                | 106 files, ~23,500 LOC, ~1,031 test cases (compliance, golden, property-based, realworld)           |
| Decorators           | 30 declared in `lib/main.tsp`                                                                       |
| Protocol coverage    | 22 protocols, 19 binding validators auto-generated from `@asyncapi/specs`                           |
| Runtime dependencies | `yaml` only (binding validation is codegen'd at build time from `@asyncapi/specs`, a devDependency) |
| Test runner          | vitest (same as monorepo)                                                                           |
| Node engines         | >=20.11 (monorepo requires >=22)                                                                    |

Architectural fit with the monorepo (verified from `packages/json-schema`, the closest sibling emitter):

- We use `@typespec/asset-emitter` (EFv1); the monorepo's own `openapi3` and `json-schema` emitters still use it too. EFv1 is acceptable today even though the repo also ships the newer `emitter-framework`.
- Tests use the same `createTester` / vitest patterns.
- Lint: the monorepo emitter packages use **oxlint only** (`oxlint . --deny-warnings`); we already run oxlint. Our extra ESLint `strictTypeChecked` layer is local-only and would be dropped or kept as an out-of-repo practice.

---

## 3. Target conventions the package must adopt

From `packages/json-schema/package.json` and the repo developer guide:

1. **Location and name:** `packages/asyncapi`, package `@typespec/asyncapi`, `author: Microsoft Corporation`, repo fields pointing at the monorepo.
2. **Build pipeline replaces ours:**
   ```
   gen-extern-signature (tspd)  ->  generated-defs/ for all 30 decorators
   tsc -p tsconfig.build.json
   lint-typespec-library (@typespec/library-linter, --warn-as-error)
   api-extractor
   ```
   Our bun-based `generate-binding-specs.ts` build step must be ported to a node/tsc-compiled script (no bun in the monorepo toolchain).
3. **House tooling:** pnpm workspaces with `catalog:` dependency versions, `mise.toml` toolchains, Node >=22, `peerDependencies: { "@typespec/compiler": "workspace:^" }`, `tspMain: lib/main.tsp`.
4. **Versioning/releases:** chronus change files (`pnpm change add`) per PR, lockstep monorepo releases, `CHANGELOG.json` + `CHANGELOG.md` generated. Our husky pre-commit gate, `postversion` npm push, and independent semver cadence are deleted.
5. **Docs:** README in house style, plus `regen-docs` via `tspd doc` publishing into `website/src/content/docs/docs/emitters/asyncapi/reference` (mirrors the json-schema emitter).
6. **CI:** Azure Pipelines with junit reporters and their coverage setup (`@vitest/coverage-v8`).
7. **CLMicrosoft CLA** signed once, applies to all future PRs.

---

## 4. Work breakdown (effort estimate)

Estimates assume solo work by someone who knows this codebase (i.e., us). "Days" = focused engineering days.

| #   | Work item                                                                                                                                      | Effort         | Risk              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------------- |
| 1   | Workspace plumbing: new `packages/asyncapi`, rename to `@typespec/asyncapi`, catalog versions, engines bump to Node 22, workspace registration | 0.5 to 1 d     | Low               |
| 2   | Build pipeline swap: `gen-extern-signature` over 30 decorators, `tsconfig.build.json`, api-extractor, `.tspd` config                           | 1 to 2 d       | Low               |
| 3   | Fix whatever `@typespec/library-linter` flags across `lib/main.tsp` (unknown until first run; decorator naming/declaration conventions)        | 0.5 to 2 d     | Medium            |
| 4   | Port binding-spec codegen off bun (node-compatible script, keep output byte-identical)                                                         | 0.5 to 1 d     | Low               |
| 5   | Lint consolidation: keep oxlint house config; retire or externalize the ESLint strict layer and jscpd gate                                     | 0.5 d          | Low               |
| 6   | Test alignment: vitest config convergence, junit reporters, Node 22, fast-check + ajv into catalog; decide coverage story (see risk R3)        | 1 to 3 d       | Medium            |
| 7   | Docs: house-style README, `regen-docs` target, website sidebar entry                                                                           | 0.5 to 1 d     | Low               |
| 8   | Examples: trim 13 workspace examples to a canonical few under `samples/` conventions                                                           | 0.5 d          | Low               |
| 9   | Release conversion: delete husky/postversion flow, adopt chronus change files                                                                  | 0.5 d          | Low               |
| 10  | Maintainer review cycles and fixes                                                                                                             | 2 to 5 d       | **High variance** |
| 11  | Optional: playground integration for a live AsyncAPI preview                                                                                   | 1 to 2 d       | Medium            |
|     | **Total (active engineering)**                                                                                                                 | **~8 to 15 d** |                   |

Not included: the wall-clock cost of the maintainer decision itself (historically: unbounded, see Section 1) and ongoing first-party maintenance duties (see R5).

Out of scope / not done: git history is **not** merged. The package lands as a new directory (conventionally squash-imported); this repo stays as the development/archive home or is retired after npm deprecation stubbing (`@lars-artmann/typespec-asyncapi` deprecate notice pointing to `@typespec/asyncapi`).

---

## 5. Risks and unknowns

- **R1. No maintainer commitment (dominant risk).** Three years of community demand has not produced a green light. The proposal on #2463 must directly answer "why should this be first-party" with maintenance commitment, and should acknowledge the competing `tsp-asyncapi` rather than ignore it.
- **R2. Scope negotiation.** Maintainers may want a minimal AsyncAPI 3.x emitter rather than 22-protocol binding validation. Our differentiators (spec-generated binding validation, `@typespec/versioning` support, split-schemas, ~1,000 AJV-locked tests) are the argument, but be ready to cut scope (e.g., drop protocol bindings to v2) to get acceptance.
- **R3. Coverage tooling mismatch.** Our per-file 75% coverage gate runs under bun because the TypeSpec compiler loads the emitter from `dist/` through a virtual filesystem that vitest's V8 coverage cannot see. The monorepo runs `@vitest/coverage-v8` and does not use bun. Expect to either lower/lose the per-file gate in-repo or restructure tests; do not promise the current gate survives the merge.
- **R4. Toolchain version drift.** Local devDeps (TypeScript ^6.0.3, vitest ^4, oxlint 1.x) must be reconciled with the monorepo `catalog:` pins; minor but check before estimating R3.
- **R5. Loss of autonomy.** Lockstep releases, chronus-only changes, CLA, and Microsoft stewardship of the name. Fast independent 0.x iteration ends; every compiler release becomes a peerDep-bump obligation on their cadence.
- **R6. EFv1 direction.** asset-emitter is acceptable today (openapi3/json-schema still use it), but if the team steers new emitters toward the emitter-framework, that would be a rewrite-level ask, not a port. Clarify in the proposal thread.

---

## 6. Alternatives to a full merge

| Option              | Description                                                                                                             | Tradeoff                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Third-party listing | Request inclusion in the official third-party emitters docs; stay independent                                           | Zero migration cost; no lockstep release burden; keeps 0.x agility               |
| AsyncAPI org home   | Propose the emitter under the asyncapi GitHub org (alongside generator/bindings tooling)                                | Spec-community legitimacy; still independent releases                            |
| Pre-alignment       | Adopt house build conventions (build pipeline, chronus-style changes, node 22) locally _now_ so a future merge is cheap | Small ongoing cost; keeps the merge door open                                    |
| Status quo          | Stay as is, keep engaging on #2463                                                                                      | Zero cost; risk that `tsp-asyncapi` wins mindshare on the canonical issue thread |

---

## 7. Recommendation

1. **This week (1 day):** Post a tight proposal on #2463: current 0.3.x capabilities, test/validation evidence, differentiators vs `tsp-asyncapi`, explicit maintenance commitment, and the direct question: "would the team accept `@typespec/asyncapi` as a first-party package?" (When drafting, follow the `verify-before-filing` and `github-voice` skills.)
2. **Only after a positive signal:** execute work items 1 to 9 (~6 to 10 days), open the PR, and budget 2 to 5 days for review cycles.
3. **If the answer is "prefer third-party":** pursue the third-party docs listing and pre-alignment, and treat a future first-party window as opportunistic.

The engineering is the cheap part. The decision is the expensive part; spend the first day buying the answer to it.

---

## Appendix A: Evidence trail

Commands and sources used (all run 2026-09-13):

- `gh api repos/microsoft/typespec/contents/packages` — package inventory (~50 packages incl. `asset-emitter`, `emitter-framework`, `json-schema`, `openapi3`, `events`).
- `gh api repos/microsoft/typespec/contents/packages/json-schema/package.json` — house emitter conventions (build chain, oxlint, vitest, catalog deps, engines node >=22, regen-docs target).
- `gh issue view 2463 --repo microsoft/typespec` — AsyncAPI demand thread: author, dates, participants, maintainer silence, competing emitter post, prior feedback on the alpha.
- `gh search prs --repo microsoft/typespec "asyncapi"` — zero results.
- `gh api repos/microsoft/typespec/contents/CONTRIBUTING.md` — pnpm/mise workflow, `pnpm change add` (chronus), `gen-extern-signature`.
- Local: `package.json`, LOC/test counts via `find`/`rg` (45 src files / 7,102 LOC; 106 test files / 23,460 LOC; ~1,031 cases).
