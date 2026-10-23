---
title: FAQ
description: Straight answers about AsyncAPI versions, TypeSpec support, validation, mixed OpenAPI/AsyncAPI programs, and when not to use this emitter.
head:
  - tag: meta
    attrs:
      property: og:image
      content: "https://typespec-asyncapi.lars.software/og/faq.png"
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
      content: "FAQ — typespec-asyncapi"
  - tag: meta
    attrs:
      name: twitter:image
      content: "https://typespec-asyncapi.lars.software/og/faq.png"

---

## Is this production-ready?

Yes. v1.0.0 froze the public surface and v1.1.0 is the current release. The emitter is gated by 1,275 tests across 105 files, a 270+-test AsyncAPI 3.1.0 compliance suite, a 75% per-file coverage floor, and zero-clone duplication checks. Every emitted document in CI is validated with AJV against the official schema.

## Which AsyncAPI version does it emit?

**3.1.0**, the latest release. The output is validated against the official AsyncAPI 3.1.0 JSON Schema, not a hand-maintained approximation.

## Does it support AsyncAPI 2.x?

No. There is no 2.x output mode. The reference chains and component structure differ enough that downgrading would produce a different document, not a flag. If you need 2.x, keep it as a separate conversion step.

## How is this different from `tsp-asyncapi`?

Both are TypeSpec emitters. This one targets AsyncAPI **3.1.0**, validates every output against the official schema, generates binding metadata and placement rules from `@asyncapi/specs`, and ships reusable components plus split-schema output. See the [comparison snapshot](/related-tools/#alternative-emitters) for the current table.

## Can I use it together with `@typespec/openapi3`?

Yes. Model REST endpoints under a `@service` namespace and event operations in a sibling namespace outside that service subtree. `@typespec/http` routes every operation under a service as REST, so event operations placed inside one become phantom OpenAPI routes and collide as duplicate GETs. The emitter warns with `event-op-in-service-namespace` and excludes http-routed operations from the AsyncAPI document. See [Mixing with OpenAPI](/guides/mixing-with-openapi/).

## Where does the output go?

`tsp-output/@lars-artmann/typespec-asyncapi/asyncapi.yaml` by default. The `output-file` and `file-type` options rename and reformat it; `split-schemas` writes one file per schema under `schemas/`.

## How do I suppress a diagnostic?

Use the compiler's standard suppression:

```typespec
#suppress "@lars-artmann/typespec-asyncapi/bare-op-assumed-rest" "This op is intentionally REST-only"
```

See [Diagnostics](/reference/diagnostics/) for the full list and severity.

## Does it work with Bun, Deno, or the browser?

The TypeSpec compiler itself runs on Node.js. The emitter is plain ESM and has no Bun-specific runtime requirements, but the supported toolchain is Node.js 20.11+ with the `tsp` CLI. Bun is used in this repository only to collect coverage, not to run the emitter.

## Can I keep my existing AsyncAPI YAML?

Yes, as a reference while you migrate. There is no importer: model the same channels and messages in TypeSpec, then compare the emitted document to your hand-written one. [Migration guide](/getting-started/migration/).

## How do I version the emitted document?

Three sources, highest precedence first: the `version` emitter option, `@apiVersion`, then the latest value of a `@versioned` enum. See [Versioning](/guides/versioning/).

## Is the document spec-complete or just schema-valid?

Both are tested. AJV validation proves the document conforms to the AsyncAPI 3.1.0 JSON Schema; the compliance suite additionally asserts exact `$ref` chains, binding placements, security shapes, and schema output. Schema validity alone would not catch a semantically wrong `$ref`.

## Where do I report a bug?

[GitHub issues](https://github.com/LarsArtmann/typespec-asyncapi/issues). Include the TypeSpec input, the emitted output, and the diagnostics. Security reports go through [GitHub security advisories](https://github.com/LarsArtmann/typespec-asyncapi/security/advisories/new).

## Where to go next

- [Installation](/getting-started/installation/) — requirements and setup
- [Architecture](/reference/architecture/) — how the emitter is put together
- [Related Tools](/related-tools/) — the surrounding ecosystem
