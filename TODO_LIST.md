# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## P1 — Type Safety

- [ ] **Set `engines.node` in package.json:** `import.meta.dirname` requires Node.js 20.11+. Add `"engines": { "node": ">=20.11" }` to package.json.
- [ ] **Remove dead state type fields:** `CorrelationIdData.property` (never read — only `.location` is used), `OperationTypeData.tags` (tags come from separate state map), `OperationTypeData.description` (never emitted). Source: type-system self-review section (c) items 12-13.
- [ ] **Consolidate `TagData` with `Tag[]`:** `state.ts` defines `TagData = { name: string }[]` which is identical to `Tag[]` from the domain model. Use one type. Source: type-system self-review section (c) item 15.
- [ ] **Narrow `ProtocolConfigData` union in `document-builder.ts`:** The discriminated union (`KafkaConfigData | WebSocketConfigData | MqttConfigData | GenericProtocolConfigData`) is defined but accessed as a generic bag of optional fields. Narrow via `switch` on `data.protocol` for type-safe access. Source: type-system self-review section (c) item 5.
- [ ] **Replace `type as { name: string }` casts:** 7+ instances in `document-builder.ts` bypass type safety. Use proper TypeSpec compiler type narrowing (`if (type.kind === "Operation")` etc.). Source: type-system self-review section (c) item 4.
- [ ] **Fix `intrinsicToSchema()` format inconsistency:** `int8/16/32` set `format` but `uint8/16/32/64` and `safeint` don't. Either add format or document why omitted. Source: type-system self-review section (c) item 14.
- [ ] **Map `OperationTypeData.type` to `OperationAction` via named function:** The inline ternary `opData.type === "publish" ? "send" : "receive"` should be a named function. Source: type-system self-review section (c) item 6.

## P2 — Validation Hardening

- [ ] **Add binding placement validation:** `BINDING_PLACEMENT` and `supportsBindingPlacement()` were deleted as dead code. If binding placement enforcement is needed in the future (warn when a binding is placed on the wrong target kind), re-introduce a placement matrix wired into `processBindings()` with proper diagnostics and test coverage.
- [ ] **Close GitHub #160:** "Bun-Compatible Test Patterns" is moot after vitest migration. Close with comment.
- [ ] **Close GitHub #229:** "RFC 3986 URL Validation" partially addressed — pragmatic `isValidUrl()` shipped (rejects empty/whitespace/control chars, accepts AsyncAPI host-string format). Close with comment explaining the design decision, or leave open if stricter validation is desired.
