# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## P0 — Spec Compliance

- [ ] **`scopes` → `availableScopes` runtime transformation:** The domain model type says `availableScopes` (correct per AsyncAPI 3.1), but the emitter passes through whatever key the user wrote. If a user writes `scopes:` in their `@security` decorator, the output contains `scopes:`, which FAILS AsyncAPI 3.1 JSON Schema validation. Accept both as input, always output `availableScopes`. Source: type-system self-review section (b).
- [ ] **Fix `SecurityScheme.in` type:** Currently `"user" | "password" | "query" | "header" | "cookie"`. AsyncAPI 3.1 API key `in` field only accepts `"query" | "header" | "cookie"`. The `"user" | "password"` values are for the `userPassword` scheme type, not the `in` field. Source: type-system self-review section (c) item 8.

## P0 — Dead Code

- [ ] **Remove dead coverage devDependencies:** `@vitest/coverage-v8`, `@vitest/coverage-istanbul`, `c8` are installed but non-functional (TypeSpec loads emitter from `dist/*.js` as opaque modules, so vitest can't instrument them).
- [ ] **Delete or wire `src/domain/models/bindings.ts`:** 177 lines of typed binding interfaces with zero imports from `src/`. Either wire into `processBindings()` for field-level validation, or delete as YAGNI. Source: type-system self-review section (c) item 1.
- [ ] **Delete or wire `supportsBindingPlacement()` / `BINDING_PLACEMENT`:** Defined in `src/constants/binding-versions.ts` but never called outside that file. Either wire into `processBindings()` to warn on misplaced bindings, or delete. Source: type-system self-review section (c) item 2.

## P1 — Type Safety

- [ ] **Set `engines.node` in package.json:** `import.meta.dirname` requires Node.js 20.11+. Add `"engines": { "node": ">=20.11" }` to package.json.
- [ ] **Remove dead state type fields:** `CorrelationIdData.property` (never read — only `.location` is used), `OperationTypeData.tags` (tags come from separate state map), `OperationTypeData.description` (never emitted). Source: type-system self-review section (c) items 12-13.
- [ ] **Consolidate `TagData` with `Tag[]`:** `state.ts` defines `TagData = { name: string }[]` which is identical to `Tag[]` from the domain model. Use one type. Source: type-system self-review section (c) item 15.
- [ ] **Narrow `ProtocolConfigData` union in `document-builder.ts`:** The discriminated union (`KafkaConfigData | WebSocketConfigData | MqttConfigData | GenericProtocolConfigData`) is defined but accessed as a generic bag of optional fields. Narrow via `switch` on `data.protocol` for type-safe access. Source: type-system self-review section (c) item 5.
- [ ] **Replace `type as { name: string }` casts:** 7+ instances in `document-builder.ts` bypass type safety. Use proper TypeSpec compiler type narrowing (`if (type.kind === "Operation")` etc.). Source: type-system self-review section (c) item 4.
- [ ] **Fix `intrinsicToSchema()` format inconsistency:** `int8/16/32` set `format` but `uint8/16/32/64` and `safeint` don't. Either add format or document why omitted. Source: type-system self-review section (c) item 14.
- [ ] **Map `OperationTypeData.type` to `OperationAction` via named function:** The inline ternary `opData.type === "publish" ? "send" : "receive"` should be a named function. Source: type-system self-review section (c) item 6.

## P2 — Validation Hardening

- [ ] **Wire `BINDING_PLACEMENT` into `processBindings()`:** Enforce which binding types are valid per protocol per object kind (channel/operation/message/server). Warn via diagnostic when a binding is misplaced (e.g., Kafka server binding on a message). Source: protocol-binding report section (e) item 1.
- [ ] **Close GitHub #160:** "Bun-Compatible Test Patterns" is moot after vitest migration. Close with comment.
- [ ] **Close GitHub #229:** "RFC 3986 URL Validation" partially addressed — pragmatic `isValidUrl()` shipped (rejects empty/whitespace/control chars, accepts AsyncAPI host-string format). Close with comment explaining the design decision, or leave open if stricter validation is desired.
