---
title: Changelog
description: Release history for typespec-asyncapi.
head:
  - tag: meta
    attrs:
      property: og:image
      content: "https://typespec-asyncapi.lars.software/og/changelog.png"
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
      content: "Changelog — typespec-asyncapi"
  - tag: meta
    attrs:
      name: twitter:image
      content: "https://typespec-asyncapi.lars.software/og/changelog.png"

---

The full changelog lives in the repository:

- [CHANGELOG.md on GitHub](https://github.com/LarsArtmann/typespec-asyncapi/blob/master/CHANGELOG.md)

## Recent releases

### 1.1.0 — 2026-10-03

- Mixed `@typespec/http` programs now decide operation ownership from http's resolved route table, so bare REST operations no longer leak into the AsyncAPI document.
- Two diagnostics joined the surface: `bare-op-assumed-rest` and `bare-op-inference-deprecated`, and `event-op-in-service-namespace` now cites the concrete route.
- Deep bare-operation discovery works in arbitrarily nested namespaces.

### 1.0.0 — 2026-09-30

- Public API freeze under semver: 30 decorators, `EmitterOptions`, the output contract, and the `./shared` subpath.

## Current status

| Metric      | Value                                                 |
| ----------- | ----------------------------------------------------- |
| Version     | 1.1.0 (npm, `latest`)                                 |
| Tests       | 1275 passing (vitest)                                 |
| Coverage    | 98% average line coverage (gated at 75% per file)     |
| Decorators  | 30                                                    |
| Diagnostics | 36 codes (20 error + 16 warning)                      |
| Protocols   | 22 (bindings auto-generated from `@asyncapi/specs`)   |
| Examples    | 15 runnable projects, all CI-validated                |
| Output      | Validates against official AsyncAPI 3.1.0 JSON Schema |

## Where to go next

- [Contributing](/contributing/) — development setup
- [Architecture](/reference/architecture/) — how the emitter is put together
- [Related Tools](/related-tools/) — the surrounding ecosystem
