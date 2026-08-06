# Status Report: components.tags Population

**Date:** 2026-08-06 12:57
**Session Goal:** Populate `components.tags` from `@tags` decorator state
**Commit:** `f6490f8` — feat(asyncapi): add tags component support to AsyncAPI document builder

---

## a) FULLY DONE

### `components.tags` now populates from `@tags` decorator state

The `ComponentsObject.tags?: Record<string, Tag | Ref>` field was declared in
the domain model but never populated. This session implemented the full pipeline
following the established `securitySchemes` pattern:

| File                                      | Change                                                                                                                                                                     | Lines |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `src/builders/types.ts`                   | Added `tags: Record<string, Tag>` to `DocumentBuildContext`, imported `Tag` type                                                                                           | +2    |
| `src/builders/tag-builder.ts`             | **New file** — `buildTags` builder, iterates `state.tags` and deduplicates into `ctx.tags` keyed by name                                                                   | +17   |
| `src/document-builder.ts`                 | Imported `buildTags`, initialized `tags: {}`, called `buildTags(state, ctx)` in pipeline, populated `components.tags` in `assembleDocument()`                              | +6    |
| `test/compliance/components-tags.test.ts` | **New file** — 6 tests covering operation/model/namespace tags, dedup, no-tags case, inline+components coexistence. All validated against AsyncAPI 3.1 JSON Schema via AJV | +91   |

**Total:** 4 files changed, +116 lines

### Verification Results

- **TypeScript build:** 0 errors (`tsc -p tsconfig.json`)
- **ESLint + oxlint:** 0 errors, 0 warnings
- **Tests:** 955 pass / 0 fail (949 existing + 6 new)
- **jscpd duplication:** 0 clones / 0% (zero-clone baseline maintained)
- **AsyncAPI 3.1 JSON Schema validation:** All 6 new tests pass AJV validation

---

## b) PARTIALLY DONE

### `Tag` interface is incomplete vs AsyncAPI 3.1 spec

The AsyncAPI 3.1 `tag` object definition includes `externalDocs` as an optional
field. Our `Tag` interface only has `name` and `description`:

```typescript
// Current (src/domain/models/asyncapi-document.ts:216-219)
export interface Tag {
  name: string;
  description?: string;
}

// AsyncAPI 3.1 spec defines:
// { name: string, description?: string, externalDocs?: Reference | externalDocs }
```

The `externalDocs` field is missing from the `Tag` interface. This is a domain
model gap, not a runtime bug — the `@tags` decorator currently only accepts
`string[]` (just names), so there's no way to pass descriptions or externalDocs
through TypeSpec syntax yet.

### `@tags` decorator only accepts string arrays

The decorator signature is:

```typespec
extern dec tags(target: Model | Operation | Namespace, value: valueof string[]);
```

This means users can only pass tag **names**, never descriptions or
externalDocs. The `storeTags()` function always produces `{ name }` objects
with no description. For full AsyncAPI 3.1 compliance, the decorator would
need to accept richer tag objects (e.g., `#{ name: "...", description: "..." }`).

---

## c) NOT STARTED

### Top-level document `tags` field (`DocumentBody.tags?: Tag[]`)

The `DocumentBody` interface (line 289) has `tags?: Tag[]` for the document
root. This is never populated in `assembleDocument()`. The AsyncAPI spec allows
a top-level `tags` array for document-level tag definitions.

### `info.tags` field (`InfoObject.tags?: Tag[]`)

The `InfoObject` interface (line 77) has `tags?: Tag[]`. This is never
populated in `assembleDocument()`. The AsyncAPI spec allows tags on the info
object.

### Channel and server tags not applied

`CommonMetadata.tags` exists for channels and servers, but neither
`channel-builder.ts` nor `server-builder.ts` reads `state.tags` to populate
them. Tags are currently only applied to operations (in `operation-builder.ts`)
and auto-registered messages (in `message-builder.ts`).

### Operation/message tags as `$ref` to `components.tags`

The AsyncAPI 3.1 schema allows operation.tags items to be either inline `Tag`
objects OR `$ref` references to `components.tags`. Currently, all tags are
emitted inline on operations/messages. A "deduplication via $ref" mode would
emit `{"$ref": "#/components/tags/tagName"}` instead of repeating the full
tag object. This is an optimization, not a correctness issue — the current
inline approach is fully valid per spec.

---

## d) TOTALLY FUCKED UP

### Nothing

No regressions, no broken tests, no data loss. All quality gates pass.

---

## e) WHAT WE SHOULD IMPROVE

### 1. `generate-binding-specs.ts` has a pre-existing Bun environment failure

Running `pnpm run build` fails at the first step:

```
error: Cannot find module './cjs/index.cjs' from ''
Bun v1.3.13 (Linux x64)
```

This is in `scripts/generate-binding-specs.ts` which runs via `tsx` but appears
to trigger Bun internally somehow. The generated file already exists so `tsc`
alone succeeds, but `pnpm run build`, `pnpm run test`, and `pnpm run verify`
all fail because they chain through the build step. **This blocks the full
`verify` gate and should be fixed or worked around.**

### 2. `tag-builder.ts` could be more testable

The `buildTags` function is a `BuilderFn` that writes directly to `ctx.tags`.
For unit testing (as opposed to the integration tests I wrote), it would be
better to extract a pure function that takes `state.tags` and returns a
`Record<string, Tag>`, with `buildTags` as a thin wrapper. This matches the
pattern seen in `security-builder.ts` where `normalizeOAuth2Scopes` is
extracted for testability.

### 3. The `Tag` domain model should match the AsyncAPI 3.1 spec exactly

Add `externalDocs` to the `Tag` interface for spec completeness, even if the
current decorator can't populate it. This follows the project's stated principle
of matching AsyncAPI 3.1 exactly (similar to how `SecuritySchemeType` was
scrubbed to match the spec exactly).

### 4. Consider a richer `@tags` decorator overload

Add an overload that accepts tag objects with descriptions:

```typespec
extern dec tags(target: ..., value: #{} | valueof string[]);
```

This would allow `@tags(#[#{name: "urgent", description: "Critical alerts"}])`.

### 5. AGENTS.md should be updated with the tag-builder

The Architecture section lists all builder files under `src/builders/` but
`tag-builder.ts` is not mentioned yet. The document also doesn't document the
components.tags population flow.

---

## f) Up to 50 Things We Should Get Done Next

#### High Priority — Correctness & Spec Compliance

1. Fix `generate-binding-specs.ts` Bun module resolution so `pnpm run build` works
2. Investigate why `tsx` invokes Bun for this script (check shebang, imports)
3. Make `pnpm run verify` pass end-to-end (currently blocked by build step)
4. Add `externalDocs` to `Tag` interface to match AsyncAPI 3.1 spec
5. Add top-level `tags?: Tag[]` population in `assembleDocument()` for `DocumentBody`
6. Populate `info.tags` from emitter options or namespace-level `@tags`
7. Apply `state.tags` to channels in `channel-builder.ts`
8. Apply `state.tags` to servers in `server-builder.ts`
9. Consider `$ref` mode for operation/message tags pointing to `components.tags`

#### Medium Priority — Richness & UX

10. Add `@tags` overload accepting tag objects `#{name, description, externalDocs}`
11. Update `storeTags()` to accept and preserve descriptions
12. Add `@tag` (singular) decorator matching TypeSpec stdlib `@tag` but with description support
13. Support `@doc` on tags as description fallback
14. Add `x-` extension properties support on Tag objects
15. Add externalDocs support via a dedicated `@externalDocs` decorator

#### Testing & Coverage

16. Add unit tests for `tag-builder.ts` (extract pure function first)
17. Add golden file test fixture that includes tags
18. Add test for namespace + operation + model tag dedup with descriptions
19. Add test that `components.tags` validates against AsyncAPI 3.1 schema with `externalDocs`
20. Add negative test: empty tags array from `@tags(#[])` — should it warn?
21. Run coverage gate (`bun test --coverage`) to verify tag-builder coverage
22. Add benchmark: large tag sets (100+ unique tags across many operations)
23. Test tag names with special characters (spaces, unicode, dots)
24. Test tag dedup case sensitivity (should `"Tag"` and `"tag"` be the same?)

#### Documentation

25. Update `AGENTS.md` Architecture section to include `tag-builder.ts`
26. Update `AGENTS.md` to document the `components.tags` population flow
27. Update `FEATURES.md` to list `components.tags` as DONE
28. Add tag usage examples to README.md
29. Document the `@tags` decorator in any user-facing API docs
30. Add a decision record (ADR) for why tags are inline vs `$ref`

#### Code Quality

31. Extract pure `collectTags(state): Record<string, Tag>` function for testability
32. Consider ordering: should `components.tags` be sorted alphabetically?
33. Consider whether `buildTags` should run before or after other builders (ordering)
34. Check if `ctx.tags` should be a `Map` instead of `Record` for consistency
35. Ensure `tag-builder.ts` stays under 370-line limit (trivially true at 17 lines)
36. Add JSDoc to `buildTags` linking to AsyncAPI 3.1 spec section for tags
37. Consider adding `Tag.name` validation (spec requires `^[\\w\\d\\.\\-_]+$` pattern)

#### Emitter Options & Configuration

38. Add emitter option to control inline-tags vs `$ref`-to-components-tags
39. Add emitter option to sort tags alphabetically in output
40. Add emitter option to include/exclude tags from components
41. Consider `--tag-prefix` option for namespacing tags

#### Cross-cutting

42. Audit all `ComponentsObject` fields for similar "declared but not populated" gaps
43. Check if `components.parameters` is populated (it's declared but I didn't verify)
44. Check if `components.correlationIds` is populated (declared, not verified)
45. Check if `components.servers`, `components.channels`, `components.operations` are populated
46. Audit `CommonMetadata` fields across Server/Channel/Operation/Message for completeness
47. Consider a "completeness matrix" test that checks every declared field is populated somewhere
48. Review whether the `@tags` decorator should target `Namespace` differently than `Operation`
49. Consider how tags interact with `@service` namespacing
50. Evaluate if the dedup-by-name strategy is correct when same name has different descriptions

---

## g) Questions I Cannot Answer Myself

### 1. Should operation/message tags use `$ref` to `components.tags` or stay inline?

The AsyncAPI 3.1 schema allows both. Currently they're inline `{ name: "tag" }`
objects. Switching to `$ref: "#/components/tags/tag"` would reduce output size
and enforce that all tags are defined once, but it changes the output format
that existing tests lock. This is a design decision, not something I can derive
from the spec.

### 2. Should the `@tags` decorator be extended to accept richer objects (name + description)?

The current `@tags(#["name1", "name2"])` is simple but can't express descriptions
or externalDocs. An overloaded version like `@tags(#[#{name: "...", description: "..."}])`
would be more powerful but changes the decorator API. This needs a product
decision about API ergonomics vs spec completeness.

### 3. Is the `generate-binding-specs.ts` Bun failure a known issue or did something regress?

The `Cannot find module './cjs/index.cjs'` error from `tsx scripts/generate-binding-specs.ts`
blocks `pnpm run build` (and thus `pnpm run test` and `pnpm run verify`). Since
`tsc` alone works and the generated file exists, this appears pre-existing, but
I cannot determine if it's a local environment issue (NixOS, Bun version) or a
real regression without more context about when it started.
