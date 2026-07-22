# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

All items from the 2026-07-21 Pareto plan have been completed.

## P0 — Correctness

- [x] **Fix diagnostic registry split-brain:** All 14 diagnostic codes now declared in `src/lib.ts` and fired via `$lib.reportDiagnostic()` with compile-time validation. 6 dead codes removed. Prefix inconsistency fixed.
- [x] **Consolidate split-brain version constants:** `src/constants/index.ts` deleted entirely (zero importers). Single source of truth: `ASYNCAPI_SPEC_VERSION` in `src/document-builder.ts:31`.

## P1 — Type safety

- [x] **Tighten `ServerObject.protocol`:** Changed from `string` to `AsyncAPIProtocol` (`src/domain/models/asyncapi-document.ts`). Runtime values were always valid via `normalizeProtocol()`.
- [x] **Tighten `OperationObject.bindings`:** Changed from `Record<string, unknown>` to `ProtocolBindings`, matching `MessageObject` and `ChannelObject`.
- [x] **Compile external `.tsp` specs through the emitter:** 16 test patterns covering branded types, generics, spread, deep inheritance, enums, unions, multi-server, edge cases. All pass. Key finding: `@service({})` is not registered and silently kills output.

## P2 — Feature gaps (from open-issues review)

- [x] **URL validation for `@server` URLs:** `isValidUrl()` helper added to `decorator-helpers.ts`. Rejects empty/whitespace/control-character URLs. Accepts schemeless hostnames (valid AsyncAPI pattern). Wired into `$server` decorator with `invalid-server-url` diagnostic.
- [x] **Error type hierarchy review** (GitHub #54): **Closed as YAGNI.** Only 2 `throw new Error()` calls exist. Validation errors use TypeSpec diagnostics, not exceptions. Effect.TS (referenced in issue) no longer in codebase.
