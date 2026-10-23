---
title: Contributing
description: Development setup, verification gates, and release process.
head:
  - tag: meta
    attrs:
      property: og:image
      content: "https://typespec-asyncapi.lars.software/og/contributing.png"
  - tag: meta
    attrs:
      property: og:image:width
      content: "1200"
  - tag: meta
    attrs:
      property: og:image:height
      content: "630"
  - tag: meta
    attrs:
      property: og:image:alt
      content: "Contributing — typespec-asyncapi"
  - tag: meta
    attrs:
      name: twitter:image
      content: "https://typespec-asyncapi.lars.software/og/contributing.png"
---

Contributions are welcome — issues, docs improvements, and PRs.

## Development setup

```bash
git clone https://github.com/LarsArtmann/typespec-asyncapi
cd typespec-asyncapi
pnpm install
pnpm run build     # Build TypeScript (0 errors)
pnpm run lint      # ESLint + oxlint (0 errors, 0 warnings)
```

Run all commands inside `nix develop .#default` to get the pinned toolchain (pnpm + bun + Node.js). Use `pnpm` for package management and scripts.

## The verification gate

```bash
pnpm run verify
```

Runs the full gate: build, lint, test typecheck, 1275 tests (105 files), coverage gate (75% minimum per file), and clone detection (0% threshold). The CI runs exactly this — if it passes locally, it passes in CI.

:::note
Tests run via vitest, but coverage runs via `bun test --coverage`: the TypeSpec compiler loads the emitter from `dist/` through a virtual filesystem, and only Bun's native runtime coverage sees those dynamically loaded files.
:::

## Project layout

- `src/` — the emitter (schema generation, document builders, decorators, validation)
- `lib/main.tsp` — the TypeSpec library surface (30 decorators, `EmitterOptions` model)
- `test/` — compliance, golden, property, integration, e2e, realworld suites
- `examples/` — 15 runnable examples, all CI-validated
- `website/` — this documentation site (Astro + Starlight)

## Releasing

Releases publish automatically from the `release.yml` workflow: pushing a `v*` tag runs the full verify gate and publishes to npm with provenance attestation. Bump `package.json` and update `CHANGELOG.md` first.

## Where to go next

- [GitHub issues](https://github.com/LarsArtmann/typespec-asyncapi/issues) — open bugs and feature requests
- [Related Tools](/related-tools/) — the ecosystem around the emitter
