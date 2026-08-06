# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## All Clear

All TODO items completed and verified this session. Check `ROADMAP.md` for long-term aspirational ideas.

## Recently Completed

- Golden file fixture for `@useChannelBinding` — locks `components.channelBindings` format
- Golden file test for `@discriminator` polymorphism — locks `allOf`/`discriminator`/auto-required format
- AJV strictness investigation — RESOLVED: test data used AsyncAPI 2.x security format; fixed to 3.1 `SecurityScheme` format with `compileAndValidateOrThrow`
- `@tags` JSDoc examples — added 3 usage examples in `lib/main.tsp`
- AGENTS.md freshness pass — test count (1010), line limit (400), coverage (97.3%), new features documented
- `storeTags` union type — accepts `(string | Tag)[]` for API safety
- Negative tests for `@useChannelBinding` and rich tags — 3 new tests
- `minimal-decorators.ts` line limit violation — extracted `normalizeTagItem` to `decorator-helpers.ts` (397 lines)
- ROADMAP replenished with 6 new aspirational ideas in Spec Compliance theme
