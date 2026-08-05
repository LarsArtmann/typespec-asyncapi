# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## High Impact

| # | Task | Impact | Effort | Evidence |
| --- | ---- | ------ | ------ | -------- |
| 1 | Server binding support — `@server` currently emits host/protocol/description but no bindings. Enable `@bindings` on server target, wire through `server-builder.ts` | High | 2-4h | `src/builders/server-builder.ts` (41 lines) has no binding handling. `@bindings` decorator targets `Operation \| Model` only (`src/minimal-decorators.ts`). `BINDING_PLACEMENT` already supports `server` kind for applicable protocols. |
| 2 | `@operationId` / `@messageId` decorators for explicit naming control — currently auto-generated from TypeSpec names | Medium | 2-3h | `src/builders/operation-builder.ts` uses `opType.name` for operation key. `src/builders/message-builder.ts:28` uses `data.messageId ?? name`. No decorator to override. |
| 3 | `@bindings` support for `Namespace` target — enables server binding placement validation (dependency for #1) | Medium | 1-2h | `src/minimal-decorators.ts` `@bindings` targets `Operation \| Model`. Namespace target needed for server bindings. `src/namespace-decorators.ts` already handles `@server` and `@defaultContentType` on Namespace. |

## Medium Impact

| # | Task | Impact | Effort | Evidence |
| --- | ---- | ------ | ------ | -------- |
| 4 | AsyncAPI Studio compatibility verification — round-trip: emit → import into Studio → validate | Medium | 2-3h | No test exists. `@asyncapi/parser` has Bun incompatibility (AJV `new Function()` issue, see AGENTS.md Gotchas). Manual verification or alternative parser needed. |
| 5 | Consolidate ESLint and oxlint configs if rule conflicts emerge — currently complementary with zero conflicts | Low | 1h | `bun run lint` runs `eslint src && oxlint . --deny-warnings`. AGENTS.md documents dual-linter strategy. Monitor for contradictions. |
| 6 | BDD test step definitions — `test/bdd/support/world.ts` has 6 unimplemented TODO stubs (channel, security, protocol, compilation, binding validation) | Medium | 2-3h | `test/bdd/support/world.ts:65,72,78,83,88,106` — all marked `// TODO: Implement`. BDD infrastructure exists but steps are stubs. |

## Low Impact / Long-term

| # | Task | Impact | Effort | Evidence |
| --- | ---- | ------ | ------ | -------- |
| 7 | Plugin/hook system for custom binding extensions (#32 RFC) | Low | 4-8h | Design RFC needed. Protocol bindings currently defined in code, not extensible at runtime (Non-Goal in ROADMAP). |
| 8 | `@typespec/versioning` support (#163) | Low | 3-5h | TypeSpec versioning decorator not integrated. Would enable API versioning in AsyncAPI output. |
| 9 | AsyncAPI generator ecosystem compatibility | Low | 2-4h | Verify emitter output works with `@asyncapi/generator` for code generation. |
| 10 | OpenAPI 3.x cross-emitter type sharing | Low | 4-6h | `src/shared/` module exists but no OpenAPI emitter consumes it yet. |
