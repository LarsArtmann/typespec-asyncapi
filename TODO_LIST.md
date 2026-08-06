# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## High Impact / Spec Compliance

| #   | Task                                                                                                                                | Impact | Effort | Evidence                                                                                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Populate `info.tags` and top-level document `tags` — declared on `InfoObject` and `DocumentBody` but never written; only `components.tags` is populated | High   | 1-2h   | `src/domain/models/asyncapi-document.ts:97,134` declare `tags?`; `src/document-builder.ts:126-127` only sets `components.tags`                                                          |
| 2   | Populate `components.channelBindings` — type exists but no decorator/builder populates it. Requires designing a channel-targeting mechanism (channels are derived from `@channel` addresses, not first-class TypeSpec types) | High   | 4-6h   | `src/domain/models/asyncapi-document.ts:318` declares `channelBindings?`; no population code anywhere in `src/builders/`                                                               |
| 3   | Validate `@discriminator` property is in `required` — AsyncAPI 3.1 spec: "the property name MUST be in the required property list". Currently emitted unconditionally; AJV passes but output can be spec-violating | High   | 1-2h   | No discriminator↔required logic exists: `grep -rn discriminator src/ \| grep required` → empty. `schema-emitter.ts` sets `discriminator` without checking `required`                    |
| 4   | Extract operation trait `security` and message trait `headers`/`correlationId` fields — typed on the trait objects but the `@operationTrait`/`@messageTrait` decorators only extract string metadata | High   | 2-3h   | `OperationTraitData.security?` and `MessageTraitObject` (via `Pick<MessageObject>`) are typed but `namedConfigDecorator` only extracts strings. `src/namespace-decorators.ts`           |
| 5   | Apply `state.tags` to channels and servers — `CommonMetadata.tags` exists but `channel-builder.ts`/`server-builder.ts` don't read tag state; tags only land on operations/messages | Medium | 1-2h   | `src/domain/models/asyncapi-document.ts` `CommonMetadata.tags`; `channel-builder.ts` and `server-builder.ts` have no `state.tags` reads                                                  |

## Medium Impact / Correctness

| #   | Task                                                                                                                                                       | Impact | Effort | Evidence                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 6   | Normalize message `title` between the two population paths — `mergeExplicitMessages` always sets `title`, `registerMessage` sets it only conditionally      | Medium | 30min  | `src/builders/message-builder.ts:24` (`title: data.title`) vs `src/builders/channel-builder.ts:39` (`...(msgData?.title ? ... : {})`) |
| 7   | Populate `MessageObject.examples` from `@example` on message models — the field is typed but never populated; schema-level `examples` is the only path     | Medium | 1-2h   | `grep examples src/builders/message-builder.ts` → empty. `MessageObject.examples?` typed in `asyncapi-document.ts`                |
| 8   | Add `externalDocs` to the `Tag` interface — AsyncAPI 3.1 spec includes it; current `Tag` only has `name`/`description`                                      | Medium | 30min  | `src/domain/models/asyncapi-document.ts` `Tag` interface lacks `externalDocs`                                                     |
| 9   | Validate `@parameter` `location` against the AsyncAPI runtime-expression pattern (`^\$message\.(header\|payload)#/...`) — any string is currently accepted | Medium | 1h     | `namedConfigDecorator` in `src/namespace-decorators.ts` extracts `location` without pattern validation                            |

## Low Impact / Testing & Polish

| #   | Task                                                                                                                                          | Impact | Effort | Evidence                                                                                                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 10  | Verify `@summary`/`@doc` channel propagation through ALL operation discovery paths — only `discoverDecoratedOps` sets `channelSummaries`       | Low    | 1h     | `src/builders/operation-discovery.ts` — `channelSummaries` populated in `discoverDecoratedOps`; `discoverChannelOnlyOps`/`discoverBareOps` unverified |
| 11  | Add golden file test for a spec using reusable components — locks the `components.*` output format for regression detection                    | Low    | 1-2h   | `test/golden/golden-file.test.ts` has no reusable-component fixture                                                                     |
| 12  | Test `@useBinding` on a Namespace with NO servers — verify no crash and empty `components.serverBindings`                                     | Low    | 30min  | `src/builders/components-builder.ts` `applyBindingToTarget` reads `state.servers`; no test covers the zero-server case                  |
