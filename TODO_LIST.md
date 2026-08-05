# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## High Impact

| #   | Task                                                                                                                                                  | Impact | Effort | Evidence                                                                                                                                                                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | AsyncAPI Studio compatibility verification — round-trip: emit → import into Studio → validate                                                         | High   | 2-3h   | No test exists. `@asyncapi/parser` has Bun incompatibility (AJV `new Function()` issue, see AGENTS.md Gotchas). Manual verification or alternative parser needed.                                                                 |
| 2   | BDD test step definitions — `test/bdd/support/world.ts` has 6 unimplemented TODO stubs (channel, security, protocol, compilation, binding validation) | Medium | 2-3h   | `test/bdd/support/world.ts:65,72,78,83,88,106` — all marked `// TODO: Implement`. BDD infrastructure exists but step definitions are stubs. `user-behaviors.test.ts` tests utilities directly, bypassing the step infrastructure. |

## Medium Impact

| #   | Task                                                                                                                    | Impact | Effort | Evidence                                                                                                                                        |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 3   | Consolidate ESLint and oxlint configs if rule conflicts emerge — currently complementary with zero conflicts            | Low    | 1h     | `bun run lint` runs `eslint src && oxlint . --deny-warnings`. AGENTS.md documents dual-linter strategy. Monitor for contradictions.             |
| 4   | AsyncAPI generator ecosystem compatibility — verify emitter output works with `@asyncapi/generator` for code generation | Medium | 2-4h   | No integration test against `@asyncapi/generator`. Output validates against AsyncAPI 3.1 JSON Schema but generator compatibility is unverified. |

## Low Impact / Long-term

| #   | Task                                                                                                                                        | Impact | Effort | Evidence                                                                                                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | `@typespec/versioning` library support (#163) — custom `@apiVersion` decorator exists but the TypeSpec versioning library is not integrated | Low    | 3-5h   | `@apiVersion` implemented (`src/minimal-decorators.ts:283`, tested in `test/decorators/api-version.test.ts`). `@typespec/versioning` library integration would enable API evolution tracking. |
| 6   | OpenAPI 3.x cross-emitter type sharing — `src/shared/` module exists but no OpenAPI emitter consumes it yet                                 | Low    | 4-6h   | `src/shared/` exports `JsonSchema`, `SchemaMap`, `generateSchemas`, `extractValue`, `intrinsicToSchema`, `AsyncAPISchemaEmitter`. No external consumer.                                       |

> **Removed:** Plugin/hook system for custom binding extensions (#32 RFC) — explicitly listed as a Non-Goal in ROADMAP.md. Protocol bindings are defined in code, not extensible at runtime.
