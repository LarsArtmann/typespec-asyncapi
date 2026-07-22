# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## P0 — Correctness

- [x] **`@service` decorator compatibility:** `@service` is a core TypeSpec decorator that requires value-literal syntax (`#{title: "..."}`), not model-expression syntax (`{title: "..."}`). The emitter now reads the `@service` title via `listServices()` and uses it for `info.title` (emitter options take precedence). See `test/decorators/service.test.ts`.
- [ ] **Remove dead coverage devDependencies:** `@vitest/coverage-v8`, `@vitest/coverage-istanbul`, `c8` are installed but non-functional (TypeSpec loads emitter from `dist/*.js` as opaque modules, so vitest can't instrument them).

## P1 — Type Safety

- [ ] **Set `engines.node` in package.json:** `import.meta.dirname` requires Node.js 20.11+. Add `"engines": { "node": ">=20.11" }` to package.json.
