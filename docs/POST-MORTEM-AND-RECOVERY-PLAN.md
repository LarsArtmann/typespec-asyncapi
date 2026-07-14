# Post-Mortem: Why This Project Struggled & How to ACTUALLY Make It Work

**Date:** 2026-07-14 | **Based on:** 885 commits, 407 docs, 2,480 LOC of source, deep code/spec/library research

---

## Executive Summary

The emitter already produces AsyncAPI 3.0 output, but **the output is spec-invalid** due to incorrect `$ref` patterns. The project's 2-year struggle was caused by **process failure, not technical impossibility**: analysis paralysis (407 docs), over-engineering (Effect.TS, plugin systems, all eventually removed), and documentation/code drift. This document is the definitive analysis and execution plan — **no further planning documents should be created.**

---

## Part 1: Root Cause Analysis

### 1. Analysis Paralysis (THE #1 killer)

**Evidence:**

- 407 markdown files in `docs/` — **1 doc per 6 lines of source code**
- 150+ files in `docs/planning/` — nearly all titled "COMPREHENSIVE_EXECUTION_PLAN" or "PARETO_EXECUTION_PLAN"
- The project's own status report admits: _"120+ minutes, 0 code changes"_ (2025-12-03)
- Every session created a new plan instead of executing the existing one

### 2. Over-Engineering & Chasing Perfection

| Detour                                                                 | Time invested     | Outcome                                 |
| ---------------------------------------------------------------------- | ----------------- | --------------------------------------- |
| Effect.TS (error handling, logging, schemas)                           | Weeks             | Fully removed from src/                 |
| Plugin system (`PluginSystem.ts`)                                      | Days              | Deleted — skeleton never worked         |
| Performance monitoring (`PerformanceMonitor.ts`)                       | Days              | Deleted — excluded from build           |
| Branded types / DDD domain models                                      | Planning sessions | Never shipped                           |
| Multiple emitter rewrites (string-concat → TypeEmitter → Alloy → back) | Weeks             | Current TypeEmitter approach is correct |

### 3. Test Infrastructure Hell

- 6+ overlapping test helper files in `test/utils/`
- Tests that spawn `npx tsp compile` via `child_process` — fails on NixOS
- Virtual FS vs real FS mismatch
- BDD infrastructure (Ginkgo-style) built but never functional
- Ghost tests for deleted modules
- **The test infrastructure became more complex than the emitter itself**

### 4. Scope Sprawl Instead of Vertical Slices

11 decorators defined, most only partially wired. 15+ emitter options defined but only 6 read. The CONSUMER_PERSPECTIVE.md documented 5 decorators that store data but never emit it.

### 5. Documentation/Code Drift

- `FEATURES.md` claimed "7 pass / 88 fail" — actual was **311 pass / 8 fail**
- `TODO_LIST.md` referenced deleted files (`emitter-alloy.tsx`, `PluginSystem.ts`)
- Examples used non-existent `@asyncapi({...})` decorator
- Docs referenced APIs that don't exist (`ProtocolPlugin`, `pluginRegistry`)

---

## Part 2: Current State (Verified 2026-07-14)

| Area           | Status               | Details                                  |
| -------------- | -------------------- | ---------------------------------------- |
| **Build**      | WORKING              | 0 TypeScript errors                      |
| **Tests**      | **319 pass, 0 fail** | All 8 previously-failing CLI tests fixed |
| **Lint**       | Not verified         | Needs check                              |
| **Source LOC** | 2,480                | 16 files                                 |
| **Doc files**  | 407                  | **PROBLEM: must be archived**            |

### What the emitter produces today

```yaml
asyncapi: 3.0.0
info:
  title: Generated API
  version: 1.0.0
servers:
  production:
    host: api.example.com
    protocol: https
channels:
  orders.created:
    address: orders.created
operations:
  publishOrderCreated:
    action: send
    channel:
      $ref: "#/channels/orders.created"
    messages:
      - $ref: "#/components/messages/publishOrderCreated" # ← WRONG per spec
components:
  messages:
    publishOrderCreated: ...
  schemas:
    OrderCreated: ...
```

### Spec compliance issues found

| Issue                                                | Severity | Details                                                                                                  |
| ---------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| **Operation message $ref targets wrong path**        | CRITICAL | Spec requires `#/channels/{channelId}/messages/{messageId}`, we emit `#/components/messages/{messageId}` |
| **Channels missing `messages` map**                  | CRITICAL | Channels must declare which messages can flow through them                                               |
| **Message names use operation name, not model name** | HIGH     | `publishOrderCreated` should reference `OrderCreated` schema                                             |
| **`@tags` data stored but never emitted**            | MEDIUM   | Tags exist in state, never reach output                                                                  |
| **`@correlationId` data stored but never emitted**   | MEDIUM   | Same pattern                                                                                             |
| **`@header` data stored but never emitted**          | MEDIUM   | Same pattern                                                                                             |
| **`@bindings` data stored but never emitted**        | MEDIUM   | Same pattern                                                                                             |
| **No output validation**                             | HIGH     | `@asyncapi/specs` JSON schema available but never used                                                   |

---

## Part 3: How to ACTUALLY Make It Work — Execution Plan

### Principles

1. **No replanning.** Execute this plan. It is the only plan.
2. **No new frameworks.** The architecture is fine. Improve incrementally.
3. **No rewrites.** The emitter works. Fix the bugs.
4. **Spec compliance first.** Invalid output = useless emitter.
5. **Verify before claiming.** Always run `bun run build && bun test`.

### Available tools (already installed, just need wiring)

- `@asyncapi/specs` v6.11.1 — JSON Schema for AsyncAPI 3.0.0 validation
- `@asyncapi/parser` v3.6.0 — AsyncAPI document parser/validator
- `ajv` v8.20.0 — JSON Schema validator
- `yaml` v2.9.0 — YAML serialization

### Dead dependencies to remove

- `@alloy-js/core` — not imported in src/
- `@effect/schema` — Effect.TS remnant
- `effect` — only used in test/ (can be replaced)
- `@effect/eslint-plugin` — Effect.TS remnant

---

### Phase 0: Archive the Noise [Effort: 30 min | Impact: Unblocks everything]

**Step 1:** Move `docs/planning/`, `docs/status/`, `docs/sessions/`, `docs/architecture/`, `docs/adr/`, `docs/analysis/`, `archive/` into a single `docs/_archive/` directory. Keep only:

- This document
- `docs/map-typespec-to-asyncapi/` (useful reference)
- `docs/guides/getting-started.md` (fix later)
- `CONSUMER_PERSPECTIVE.md` (still relevant)

**Step 2:** Delete stale `FEATURES.md`, `TODO_LIST.md`, `PARTS.md`. They are so wrong they're actively harmful.

**Step 3:** Rewrite `AGENTS.md` with verified facts only.

---

### Phase 1: Fix Spec Compliance — $ref Patterns [Effort: 2h | Impact: CRITICAL]

This is the single most important fix. Without correct `$ref` patterns, the output is invalid AsyncAPI 3.0.

**Step 4:** Fix the operation → message `$ref` chain.

Current (WRONG):

```yaml
operations:
  publishOrderCreated:
    messages:
      - $ref: "#/components/messages/publishOrderCreated"
```

Required (CORRECT):

```yaml
channels:
  orders.created:
    address: orders.created
    messages:
      publishOrderCreated: # ← channel declares its messages
        $ref: "#/components/messages/publishOrderCreated"

operations:
  publishOrderCreated:
    action: send
    channel:
      $ref: "#/channels/orders.created"
    messages:
      - $ref: "#/channels/orders.created/messages/publishOrderCreated" # ← via channel
```

**Step 5:** Add `messages` map to every channel that has operations.

**Step 6:** Fix message name to use model name (from operation return type), not operation name.

Current: message `publishOrderCreated` → schema `$ref: #/components/schemas/publishOrderCreated` (WRONG — no such schema)
Required: message `OrderCreated` → schema `$ref: #/components/schemas/OrderCreated` (CORRECT)

**Step 7:** Update golden file and all tests to match corrected output.

---

### Phase 2: Wire Missing Decorator Data to Output [Effort: 2h | Impact: HIGH]

The data is already in state. These decorators store data but the emitter ignores it:

**Step 8:** Emit `@tags` → add `tags` arrays to messages, operations, and `components.tags`

**Step 9:** Emit `@correlationId` → add `correlationId` object to messages

**Step 10:** Emit `@header` → add `headers` schema to messages

**Step 11:** Emit `@bindings` → add `bindings` objects to channels, operations, and messages

**Step 12:** Fix `storeTags` data structure — currently stores as comma-separated string `{ name: "tag1,tag2" }`. Should be `string[]`.

---

### Phase 3: Add Output Validation [Effort: 1h | Impact: HIGH]

**Step 13:** Wire `@asyncapi/specs` JSON Schema (3.0.0) + `ajv` to validate emitter output before writing. Emit diagnostic on validation failure.

**Step 14:** Add a test that validates every generated output against the AsyncAPI 3.0.0 JSON schema.

---

### Phase 4: Golden File Test [Effort: 30 min | Impact: HIGH]

**Step 15:** Create `test/golden/ecommerce.expected.yaml` with verified correct output.

**Step 16:** Write `test/golden/golden-file.test.ts` that compiles TypeSpec and asserts structural equality with the golden file.

This is the **single most valuable test in the project** — it catches regressions instantly.

---

### Phase 5: Fix Examples [Effort: 1h | Impact: MEDIUM]

**Step 17:** Fix 3 key examples to compile and produce correct output:

- `examples/basic-events/main.tsp` — remove ghost `@asyncapi` decorator, add `tspconfig.yaml`
- `examples/real-world/kafka-events.tsp` — fix namespace
- Create `examples/simple/main.tsp` — minimal working example with `tspconfig.yaml`

**Step 18:** Commit expected output alongside each example.

---

### Phase 6: Clean Dead Code & Dependencies [Effort: 30 min | Impact: MEDIUM]

**Step 19:** Remove dead source files:

- `src/domain/models/path-templates.ts` — not imported by emitter
- `src/domain/models/serialization-format-option.ts` — not imported by emitter
- `src/domain/` directory if empty after above

**Step 20:** Remove dead emitter options that are never read:

- `protocol-bindings`, `versioning`, `security-schemes`, `validate-spec`, `omit-unreachable-types`, `include-source-info`, `source-maps`, `debug`

**Step 21:** Remove dead dependencies: `@alloy-js/core`, `@effect/schema`, `@effect/eslint-plugin`

**Step 22:** Simplify `options.ts` — remove the 150-line schema validation that's never used at runtime.

---

### Phase 7: Type Safety Improvements [Effort: 2h | Impact: MEDIUM]

**Step 23:** Define AsyncAPI 3.0 document types instead of `Record<string, unknown>`:

```typescript
interface AsyncAPIDocument {
  asyncapi: "3.0.0";
  info: { title: string; version: string; description?: string };
  servers?: Record<string, Server>;
  channels: Record<string, Channel>;
  operations?: Record<string, Operation>;
  components?: Components;
}
```

**Step 24:** Remove `any` types from `emitter.ts` (currently ~15 uses of `any`)

**Step 25:** Use `@typespec/compiler` types properly instead of casting

---

### Phase 8: Documentation & Ship [Effort: 1h | Impact: MEDIUM]

**Step 26:** Write a proper README with working quickstart

**Step 27:** Ensure `bun run build && bun test` passes clean

**Step 28:** Remove all `console.log` debug spam from tests

**Step 29:** Tag as `v0.1.0-alpha`

---

## Part 4: Rules for Future Sessions

1. **NO NEW PLANNING DOCUMENTS.** This is the only plan. Execute it.
2. **NO NEW FRAMEWORKS.** No Effect.TS, no branded types, no DDD layers, no plugin systems.
3. **NO REWRITES.** The emitter works. Improve incrementally.
4. **ONE TEST AT A TIME.** No new test infrastructure. Use the existing helpers.
5. **VERIFY BEFORE CLAIMING.** Never claim "broken" without running `bun run build && bun test`.
6. **SHIP > PERFECT.** A working alpha with gaps is infinitely better than a perfect plan with no code.
7. **DELETE DOCS, NOT CODE.** When in doubt, delete documentation noise, not working code.
8. **SPEC COMPLIANCE IS NON-NEGOTIABLE.** Always validate output against `@asyncapi/specs` JSON schema.

---

## Part 5: The Meta-Lesson

This project has 885 commits and still claims v0.0.1. The emitter has been working for months but was never trusted because the documentation said it was broken. **The documentation was the bug.** Always verify actual behavior before trusting status reports.

The second meta-lesson: **the AsyncAPI 3.0 spec was never studied.** The emitter produces output that "looks right" but has incorrect `$ref` patterns. Always read the specification before writing code that targets it.
