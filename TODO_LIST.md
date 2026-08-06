# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## High Impact / Spec Compliance

| #  | Task                                                                                              | Impact | Effort | Evidence                                                                                                                                   |
| -- | ------------------------------------------------------------------------------------------------- | ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | Populate `components.channelBindings` — requires designing a channel-targeting mechanism (channels are derived from `@channel` addresses, not first-class TypeSpec types). Blocked on API design decision. | High   | 4-6h   | `src/domain/models/asyncapi-document.ts:318` declares `channelBindings?`; no population code. ROADMAP documents the design problem.         |
| 2  | Extract operation trait `security` and message trait `headers`/`correlationId` — typed on trait objects but decorators only extract string metadata | High   | 2-3h   | `OperationTraitObject.security?` typed but `namedConfigDecorator` in `src/namespace-decorators.ts` only extracts strings                    |
| 3  | Validate `@parameter` `location` against the AsyncAPI runtime-expression pattern (`^\$message\.(header\|payload)#/...`) — any string is currently accepted | Medium | 1h     | `namedConfigDecorator` in `src/namespace-decorators.ts` extracts `location` without pattern validation                                      |

> **Completed items (see CHANGELOG [Unreleased]):**
>
> - ~~Populate `info.tags` from `state.tags`~~ — top-level document `tags` removed (NOT valid per AsyncAPI 3.1 schema); `info.tags` now populated from deduplicated tag state
> - ~~Validate `@discriminator` property is in `required`~~ — auto-added to `required` array via `??=` pattern in `schema-emitter.ts`
> - ~~Apply `state.tags` to channels and servers~~ — `channelTags` context map + `applyChannelDocs`; server tags from namespace state
> - ~~Normalize message `title`~~ — both `mergeExplicitMessages` and `registerMessage` now always set `title: msgData?.title ?? messageName`
> - ~~Populate `MessageObject.examples`~~ — `applyMessageExamples()` in `message-builder.ts` from `@example` on `@message` models
> - ~~Add `externalDocs` to `Tag` interface~~ — `Tag.externalDocs?` now typed; ready for future `@tags` enrichment
> - ~~Verify `@summary`/`@doc` channel propagation~~ — confirmed `discoverDecoratedOps` iterates ALL `state.channels` entries; tests added for channel-only and bare ops
> - ~~Add golden file test for reusable components~~ — `test/golden/reusable-components.test.ts` + `reusable-components.expected.yaml` (3 tests)
> - ~~Test `@useBinding` on Namespace with NO servers~~ — verifies no crash, `components.serverBindings` still populated
