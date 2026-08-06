# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## High Impact / Polish

| # | Task | Impact | Effort | Evidence |
|---|------|--------|--------|----------|
| 1 | Update golden file fixture to include `@useChannelBinding` output — locks the `components.channelBindings` format for regression detection | Medium | 1h | `test/golden/reusable-components.expected.yaml` has no `channelBindings` section; golden test doesn't cover the new decorator |
| 2 | Investigate AsyncAPI 3.1 JSON Schema strictness on operation trait `security` — AJV rejects valid `SecurityRequirement` arrays; trait security test uses `compileAndValidate` as workaround | Medium | 2-3h | `test/compliance/reusable-components.test.ts` — security trait test uses `compileAndValidate` not `compileAndValidateOrThrow` |
| 3 | AGENTS.md freshness pass — update decorator count (26), diagnostic codes (25), new `@useChannelBinding` decorator, `channelBindings` context field, line counts | Low | 1h | `AGENTS.md` says "25 decorators" and "24 codes"; real counts are now 26 and 25 |

## Low Impact / Future Enhancement

| # | Task | Impact | Effort | Evidence |
|---|------|--------|--------|----------|
| 4 | Document `@useChannelBinding` in FEATURES.md reusable components section | Low | 30min | `FEATURES.md` "Reusable Components" section lacks `@useChannelBinding` |
| 5 | Consider `@tags` overload in `lib/main.tsp` JSDoc — currently accepts rich tag objects but TypeSpec JSDoc could be more detailed | Low | 30min | `lib/main.tsp` `@tags` JSDoc mentions "tag strings or tag objects" but could show examples |
