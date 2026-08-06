# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## High Impact / Polish

| # | Task | Impact | Effort | Evidence |
|---|------|--------|--------|----------|
| 1 | Add golden file test with `@discriminator` polymorphic output — locks the `allOf`/`discriminator`/auto-required format for regression detection | Medium | 1h | No golden file covers polymorphic models; compliance tests verify behavior but don't lock exact output format |

## Recently Completed

- ~~Golden file fixture for `@useChannelBinding`~~ — DONE: `reusable-components.expected.yaml` updated with `channelBindings` + channel `bindings` $ref
- ~~AJV strictness investigation~~ — RESOLVED: test data used AsyncAPI 2.x security format; fixed to 3.1 `SecurityScheme` format with `compileAndValidateOrThrow`
- ~~`@tags` JSDoc examples~~ — DONE: added 3 usage examples in `lib/main.tsp`
- ~~AGENTS.md freshness pass~~ — DONE: test count (1010), line limit (400), coverage (97.3%), `@tags` rich objects, `@parameter` validation, trait richer fields documented
- ~~`storeTags` union type~~ — DONE: accepts `(string | Tag)[]` for API safety
- ~~Negative tests for `@useChannelBinding` and rich tags~~ — DONE: 3 new tests in `reusable-components-negative.test.ts`
- ~~`minimal-decorators.ts` line limit violation~~ — DONE: extracted `normalizeTagItem` to `decorator-helpers.ts` (397 lines)

Check `ROADMAP.md` for long-term aspirational ideas.
