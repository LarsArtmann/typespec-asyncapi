# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## P2 — Validation Hardening

- [ ] **Add binding placement validation:** `BINDING_PLACEMENT` and `supportsBindingPlacement()` were deleted as dead code. If binding placement enforcement is needed in the future (warn when a binding is placed on the wrong target kind), re-introduce a placement matrix wired into `processBindings()` with proper diagnostics and test coverage. **Not actionable now** — no current use case. Revisit if users report misplaced bindings.
