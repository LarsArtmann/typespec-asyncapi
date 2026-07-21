# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## P0 — Correctness

- [ ] **Fix diagnostic registry split-brain:** `src/lib.ts` declares 9 diagnostic codes, but `src/minimal-decorators.ts` fires a **different** set. **7 codes are fired but never declared** (`invalid-bindings-config`, `invalid-header-config`, `invalid-message-config`, `invalid-protocol-config`, `invalid-security-config`, `invalid-security-scheme-type`, `invalid-tags-config`) — these will fail TypeSpec library validation. **7 codes are declared but never fired** (`invalid-asyncapi-version`, `invalid-message-target`, `invalid-protocol-type`, `invalid-server-config`, `missing-protocol-type`, `missing-security-config`, `duplicate-server-name`) — dead config. Reconcile the registry with actual usage.
- [ ] **Consolidate split-brain version constants:** `ASYNCAPI_SPEC_VERSION` in `src/document-builder.ts:31` is the live runtime constant; `ASYNCAPI_VERSION`, `ASYNCAPI_VERSIONS`, and `DEFAULT_CONFIG.version` in `src/constants/index.ts:20-31` are defined but **never imported anywhere**. Collapse to a single source of truth and delete the dead exports.

## P1 — Type safety

- [ ] **Tighten `ServerObject.protocol`:** currently `string` (`src/domain/models/asyncapi-document.ts:38`); should be `AsyncAPIProtocol`. The internal `ProtocolConfigData.protocol` is already typed, but the serialized document type lets invalid values through.
- [ ] **Tighten `OperationObject.bindings`:** currently `Record<string, unknown>` (`src/domain/models/asyncapi-document.ts:70`); should be `ProtocolBindings` (matching `MessageObject` and `ChannelObject`). Inconsistent with the rest of the document model.
- [ ] **Compile external `.tsp` specs through the emitter:** the original "test against real TypeSpec Specs" mandate only exercised this project's own examples (shared author blind spots). Compile a representative sample (10-20 files) from the external projects in `/home/lars/projects/` and report failure modes. Bounds the open-ended mandate to a concrete deliverable.

## P2 — Feature gaps (from open-issues review)

- [ ] **RFC 3986 URL validation for `@server` URLs** (GitHub #229): no URL parsing exists in `src/`; malformed `@server` URLs pass through silently and only fail downstream JSON Schema validation. Add a compile-time diagnostic.
- [ ] **Error type hierarchy review** (GitHub #54): revisit the proposal against the current ~2,100-line codebase — the surface area is far smaller than when the issue was filed, so the hierarchy may be lighter than proposed.
