# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## High Impact / Polish

| # | Task | Impact | Effort | Evidence |
|---|------|--------|--------|----------|
| 1 | Update golden file fixture to include `@useChannelBinding` output — locks the `components.channelBindings` format for regression detection | Medium | 1h | `test/golden/reusable-components.expected.yaml` has no `channelBindings` section; golden test doesn't cover the new decorator |
| 2 | Investigate AsyncAPI 3.1 JSON Schema strictness on operation trait `security` — AJV rejects valid `SecurityRequirement` arrays; trait security test uses `compileAndValidate` as workaround | Medium | 2-3h | `test/compliance/reusable-components.test.ts` — security trait test uses `compileAndValidate` not `compileAndValidateOrThrow` |
| 3 | Add golden file test with `@discriminator` polymorphic output — locks the `allOf`/`discriminator`/auto-required format for regression detection | Medium | 1h | No golden file covers polymorphic models; compliance tests verify behavior but don't lock exact output format |

## Low Impact / Future Enhancement

| # | Task | Impact | Effort | Evidence |
|---|------|--------|--------|----------|
| 4 | Consider `@tags` overload in `lib/main.tsp` JSDoc — currently accepts rich tag objects but TypeSpec JSDoc could be more detailed | Low | 30min | `lib/main.tsp` `@tags` has no JSDoc; decorator accepts `valueof (string \| Record<unknown>)[]` but usage examples aren't documented |
