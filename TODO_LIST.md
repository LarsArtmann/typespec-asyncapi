# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## High Impact

| #   | Task                                                                                        | Impact                                                                                     | Effort | Evidence                                                    |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------- |
| T1  | Replace `bunx` with `bun x` in `package.json` scripts (`build`, `build:watch`, `typecheck`) | `bun run build` and `bun run test` fail on NixOS — `bunx` binary not available             | 5min   | `package.json:69,70,81`                                     |
| T2  | Propagate `@doc` to channel `description` in output                                         | AsyncAPI 3.1 channels support `description`; `@doc("...")` on channels is silently dropped | 30min  | `src/document-builder.ts` — no channel description emission |

## Medium Impact

| #   | Task                                                               | Impact                                                                                              | Effort | Evidence                               |
| --- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ------ | -------------------------------------- |
| T3  | Fix `CompilationResult.outputFiles` type to `Map<string, string>`  | Misleading union type `string \| { content: string }` caused `.content` access bugs in 4 test files | 10min  | `test/utils/test-helpers.ts:24`        |
| T4  | Replace 27 `toBeDefined()` with `not.toBeNull()` in external-specs | Weak assertions pass for `null`, masking compilation failures                                       | 15min  | `test/external/external-specs.test.ts` |
