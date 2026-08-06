# Status Report: Bun → pnpm Migration

**Date:** 2026-08-06 12:38
**Session Scope:** Migrating package manager and script runner from Bun to pnpm
**Final State:** Functional, verified, pushed to remote

---

## A. FULLY DONE

| # | Item | Verification |
|---|------|-------------|
| 1 | All `bun run`/`bun x`/`bunx`/`bun audit`/`bun update` replaced with `pnpm` equivalents in `package.json` scripts | `grep -c "bun " package.json` → only `bun test --coverage` in `test:coverage` (intentional) |
| 2 | `bun.lock` deleted, `pnpm-lock.yaml` generated | `ls bun.lock bun.lockb` → not found |
| 3 | `tsx` added as devDependency for running `.ts` scripts directly | `pnpm run build` succeeds |
| 4 | `flake.nix` updated: both `default` and `ci` shells now have `pkgs.pnpm`, `pkgs.bun`, `pkgs.nodejs_22` | Verified via `nix develop .#default` |
| 5 | `.pre-commit-config.yaml` updated: `bunx` → `pnpm exec`, `bun test` → `pnpm test`, `bun.lockb` → `pnpm-lock.yaml` | `grep bunx .pre-commit-config.yaml` → 0 results |
| 6 | `.gitignore` comment updated from `bun install` to `pnpm install` | Verified |
| 7 | `AGENTS.md` fully updated: Quick Start, Critical Constraints, coverage explanation | Read-verified |
| 8 | `README.md` updated: install instructions use `npm`/`pnpm`, dev section uses `pnpm`, `bunx tsp` → `npx tsp` | Read-verified |
| 9 | Source file regeneration comments updated (`generated-bindings.ts`, `binding-versions.ts`, `binding-field-validator.ts`, `generate-binding-specs.ts`, `coverage-gate.ts`) | `grep -r "bun run scripts" src/ scripts/` → 0 results |
| 10 | Coverage investigation: tested vitest V8, c8, vitest `--pool=forks` — all failed to capture `dist/` loaded via TypeSpec virtual FS | Documented in plan doc with root cause analysis |
| 11 | `bun test --coverage` kept as sole coverage mechanism (97.0% avg, 36 files, 75% min gate) | `pnpm run verify` passes |
| 12 | `vitest.config.ts` cleaned: removed failed V8 coverage config block | Diff verified |
| 13 | Full `pnpm run verify` gate passes inside `nix develop .#default` | 0 TS errors, 0 lint warnings, 949 tests, 97.0% coverage, 0 clones |
| 14 | Planning document written at `docs/planning/2026-08-06_11-03_SUPERB-BUN-TO-PNPM-MIGRATION.md` with Pareto breakdown, mermaid graph, risk assessment, and investigation findings | Written and updated with actual results |
| 15 | All commits pushed to remote | `git push` succeeded |

---

## B. PARTIALLY DONE

| # | Item | What's Done | What's Missing |
|---|------|------------|----------------|
| 1 | **Historical doc cleanup** | Active docs (`AGENTS.md`, `README.md`) updated | **316 bun references in `docs/_archive/`, 280 in `docs/status/` + `docs/planning/`** remain. These are point-in-time snapshots — updating them would rewrite history falsely. Decision: leave as-is. |
| 2 | **`CHANGELOG.md` / `TODO_LIST.md` / `ROADMAP.md`** | Not touched | Still reference `bun run verify` in 3 places. These are living docs but historical entries — could add a migration entry to CHANGELOG. |
| 3 | **`pnpm-workspace.yaml`** | Created by `pnpm install` with `allowBuilds` for esbuild + `@scarf/scarf` | Not documented in AGENTS.md. Future contributors may be confused by its presence. |

---

## C. NOT STARTED

| # | Item | Impact |
|---|------|--------|
| 1 | No GitHub Actions CI workflow exists | No CI to update — `flake.nix ci` shell is the only CI definition |
| 2 | `pnpm publish` flow not tested | `prepublishOnly` script calls `pnpm run` commands but actual `npm publish` not tested |
| 3 | `.npmrc` file | `.gitignore` ignores `.npmrc` but pnpm may need one for registry config or `shamefully-hoist` settings if peer dep issues arise |
| 4 | Renovate/Dependabot config | No automated dependency update config to update from `bun` to `pnpm` commands |

---

## D. TOTALLY FUCKED UP

| # | What Happened | Impact | Fixed? |
|---|--------------|--------|--------|
| 1 | **vitest V8 coverage attempt** | Added `@vitest/coverage-v8`, configured `vitest.config.ts` with V8 provider — FAILED. 12 of 33 files below 75% gate because vitest's module graph can't see TypeSpec's virtual FS `dist/` loading. | Fixed: removed `@vitest/coverage-v8`, reverted vitest.config.ts, reverted to `bun test --coverage` |
| 2 | **c8 attempt** | Added `c8` as devDep, created `.c8rc.json`, tried `c8 vitest run` and `c8 vitest run --pool=forks` — FAILED. Zero project files captured because vitest's Vite transform masks file:// URLs from V8 coverage data. | Fixed: removed c8, deleted `.c8rc.json` |
| 3 | **pnpm build approval failure** | First `pnpm install` failed with `ERR_PNPM_IGNORED_BUILDS` for esbuild and `@scarf/scarf`. Tried `pnpm.onlyBuiltDependencies` in package.json — wrong location for pnpm v11. | Fixed: used `pnpm-workspace.yaml` `allowBuilds` key |
| 4 | **Auto-git daemon committed intermediate failures** | Commits `173a40b` and `77e069f` contain broken intermediate states (c8 migration, then vitest migration). These are in git history on remote. | NOT FIXED — these are historical commits, cannot rewrite without force-push. The final commit `7584db4` has the correct state. |

---

## E. WHAT WE SHOULD IMPROVE

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | **Dual toolchain confusion** — `flake.nix` now has both `pnpm` and `bun`. A new contributor will wonder why both exist. The AGENTS.md explains it but it's non-obvious. | Medium | Low — document clearly |
| 2 | **No CI workflow** — No GitHub Actions. The `flake.nix ci` shell exists but there's no actual CI pipeline that runs `pnpm verify`. | High | Medium |
| 3 | **`nix develop` dependency** — All commands must run inside `nix develop .#default` because the system `node` is a Bun shim (`/home/lars/.local/bin/node` → `exec bun "$@"`). This is a Lars-environment issue, not a project issue, but it makes the onboarding friction higher. | Low | N/A |
| 4 | **`pnpm-workspace.yaml` undocumented** — The `allowBuilds` config is required for esbuild but not mentioned anywhere in AGENTS.md. | Low | Low |
| 5 | **Coverage tool coupling** — The project is permanently coupled to Bun for coverage because the TypeSpec compiler's virtual FS loading is invisible to every Node-based coverage tool. This is an upstream TypeSpec architecture issue, not fixable here. | Medium | N/A |
| 6 | **CHANGELOG not updated** — No entry for the bun→pnpm migration. | Low | Low |
| 7 | **`debug` script uses bare `node`** — `"debug": "node --inspect-brk ./dist/index.js"` assumes `node` resolves to real Node, not the Bun shim. Inside `nix develop` this works, outside it doesn't. | Low | Low |
| 8 | **Historical commits with broken intermediate states** — The auto-git daemon committed c8 migration (subsequently reverted) and vitest coverage migration (subsequently reverted). These are noise in git history. | Low | N/A (would require rebase) |
| 9 | **`README-test.md` deleted by auto-git** — There was a `README-test.md` that got cleaned up during the session. Not migration-related but happened during the session. | None | N/A |
| 10 | **No `.npmrc` for pnpm settings** — If peer dependency resolution issues arise (common with pnpm's strict mode), there's no `.npmrc` with `shamefully-hoist=true` or similar settings. | Low | Low |

---

## F. Up to 50 Things We Should Get Done Next

### High Priority (P0)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 1 | Add GitHub Actions CI workflow that runs `pnpm run verify` inside `nix develop` | Critical | Medium |
| 2 | Add CHANGELOG.md entry for the bun→pnpm migration | High | Low |
| 3 | Document `pnpm-workspace.yaml` and `allowBuilds` in AGENTS.md | Medium | Low |
| 4 | Test `pnpm publish` flow end-to-end (dry run) | High | Low |

### Medium Priority (P1)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 5 | Create `.npmrc` with sensible pnpm defaults (auto-install-peers, etc.) | Medium | Low |
| 6 | Update `CHANGELOG.md` historical `bun run verify` references → add note | Low | Low |
| 7 | Update `TODO_LIST.md` and `ROADMAP.md` `bun run verify` references | Low | Low |
| 8 | Fix `debug` script to use `pnpm exec node` or document nix develop requirement | Low | Low |
| 9 | Add `nix flake check` to verify flake.nix is valid after changes | Medium | Low |
| 10 | Consider adding `husky` pre-commit hook to run `pnpm run lint` (currently pre-commit uses separate hooks) | Medium | Medium |
| 11 | Add `engines.pnpm` field to `package.json` to enforce pnpm version | Low | Low |
| 12 | Consider `pnpm pack` to verify publishable package contents | Medium | Low |
| 13 | Add `package.json` `pnpm.ignoredBuiltDependencies` if more build-script deps appear | Low | Low |

### Low Priority (P2)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 14 | Audit all `docs/status/` reports for accuracy against current state | Low | Medium |
| 15 | Add a "Migration History" section to AGENTS.md | Low | Low |
| 16 | Consider whether `pkgs.typescript` is needed in flake.nix (tsc comes from pnpm) | Low | Low |
| 17 | Add VS Code `.vscode/settings.json` with pnpm as default package manager | Low | Low |
| 18 | Consider adding `tsx` as a global dev tool (already in devDeps, but document it) | Low | Low |
| 19 | Evaluate whether `bun test --coverage` could be replaced by instrumenting `dist/` before test runs (compile-time instrumentation) | Medium | High |
| 20 | Add a `preinstall` script that warns if not using pnpm | Low | Low |
| 21 | Document the TypeSpec virtual FS coverage problem in a dedicated doc (not just AGENTS.md) | Low | Low |
| 22 | Consider whether `@asyncapi/parser` Bun incompatibility note is still relevant (it's a coverage-only issue now) | Low | Low |
| 23 | Review whether `pnpm audit` output differs from `bun audit` in actionable findings | Low | Low |
| 24 | Consider `pnpm-store` location for NixOS (default `~/.local/share/pnpm/store`) | Low | Low |

### Backlog (P3)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| 25 | Investigate TypeSpec compiler `createTester` source to understand exactly how it loads `dist/` via virtual FS | Research | Medium |
| 26 | File upstream issue with TypeSpec team about coverage tooling compatibility | Medium | Low |
| 27 | Evaluate `mocha` + `nyc` as alternative test runner for coverage (istanbul instruments at compile time) | Low | High |
| 28 | Add `CODEOWNERS` file | Low | Low |
| 29 | Create CONTRIBUTING.md with pnpm setup instructions | Low | Low |
| 30 | Add `LICENSE` check to verify it's included in `pnpm pack` output | Low | Low |
| 31 | Consider monorepo setup if shared module grows (`pnpm-workspace.yaml` already exists) | Low | Medium |
| 32 | Evaluate `pnpm deploy` for production-like package publishing | Low | Medium |
| 33 | Add Renovate bot config for automated dependency updates | Low | Medium |
| 34 | Consider adding `tsx watch` as a proper dev server with hot reload documentation | Low | Low |
| 35 | Review whether `@typespec/compiler/testing` could be patched to support V8 coverage natively | Low | High |
| 36 | Add a `Makefile` alias or `just` target for `nix develop .#default --command pnpm run verify` for convenience | Low | Low |
| 37 | Evaluate whether the `ci` devShell needs `pkgs.typescript` | Low | Low |
| 38 | Consider adding `node-version` matrix testing (Node 20, 22, 24) | Low | Medium |
| 39 | Add a `prepare:ci` script that mirrors what CI would run | Low | Low |
| 40 | Document the `.gitignore` `.npmrc` exclusion — is it intentional? | Low | Low |
| 41 | Consider whether `bun.lock` should be in `.gitignore` as a safety net | Low | Low |
| 42 | Review `packageManager` field in `package.json` (pnpm supports `packageManager: "pnpm@11.18.0"`) | Low | Low |
| 43 | Add `bin` field to `package.json` if the emitter should be CLI-callable | Low | Low |
| 44 | Evaluate pnpm catalog feature for centralized version management | Low | Medium |
| 45 | Consider adding `overrides` documentation — pnpm supports `overrides` same as npm | Low | Low |
| 46 | Review whether `husky` hooks need updating for pnpm | Low | Low |
| 47 | Add a `doctor` or `diagnose` script that checks toolchain health | Low | Low |
| 48 | Consider whether the `effect-reports/` gitignore entry is still needed | Low | Low |
| 49 | Review all `2>/dev/null || true` patterns in scripts for correctness under pnpm | Low | Low |
| 50 | Add a `RELEASING.md` document with pnpm-based release steps | Low | Low |

---

## G. Questions

### 1. Should we squash the intermediate broken commits?

The auto-git daemon committed intermediate states (`173a40b` c8 migration, `77e069f` nodejs_22 addition, `2b29058` vitest switch) that were subsequently reverted within the same session. The final commit `7584db4` has the correct state. These intermediate commits are noise in git history. Should I squash them into a single clean commit? This would require a `git rebase -i` and `--force-with-lease` push.

### 2. Do you want the CHANGELOG.md / TODO_LIST.md / ROADMAP.md historical references updated?

These contain `bun run verify` in historical context (e.g., "Added `bun run verify` alias"). Updating them would make them current but lose historical accuracy. The alternative is adding a new CHANGELOG entry for the migration and leaving old entries as-is.

### 3. Is the Bun shim at `/home/lars/.local/bin/node` intentional?

During this session I discovered that `node` in your PATH resolves to a shell script that runs `bun`. This means pnpm, vitest, and all Node tools actually run under Bun outside of `nix develop`. This caused the initial `pnpm run build` failure (`Cannot find module './cjs/index.cjs'`). Is this intentional, or should `node` resolve to real Node.js?
