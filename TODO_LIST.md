# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.

---

- [ ] **Consolidate split-brain version constants:** `ASYNCAPI_VERSION` / `ASYNCAPI_VERSIONS` / `DEFAULT_CONFIG.version` in `src/constants/index.ts` are defined but never imported anywhere. `ASYNCAPI_SPEC_VERSION` in `src/document-builder.ts:31` is the live constant. Either wire the constants up to a single source of truth or delete the dead ones (verify with `lsp_references` first).
- [ ] **Verify `invalid-asyncapi-version` diagnostic is wired or remove it:** `src/lib.ts:9` defines a diagnostic (`"Only 3.1.0 is supported."`) that is never fired. Confirm it is reachable or remove it as dead code.
- [ ] **Tighten output document types to completion:** `ServerObject.protocol` is still `string` in `src/domain/models/asyncapi-document.ts` (should be `AsyncAPIProtocol`); `OperationObject.bindings` is `Record<string, unknown>` (should be `ProtocolBindings`). The internal `ProtocolConfigData` union is done, but the serialized document types are still loose.
- [ ] **Test the emitter against external `.tsp` files:** The original "test against real TypeSpec Specs" mandate only covered this project's own examples. Compile a representative sample from external projects to expose different failure modes than self-authored specs.
