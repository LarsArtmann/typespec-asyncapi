---
title: Related Tools
description: The ecosystem around typespec-asyncapi — TypeSpec, AsyncAPI tooling, and sibling emitters.
head:
  - tag: meta
    attrs:
      property: og:image
      content: "https://typespec-asyncapi.lars.software/og/related-tools.png"
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
      content: "Related Tools — typespec-asyncapi"
  - tag: meta
    attrs:
      name: twitter:image
      content: "https://typespec-asyncapi.lars.software/og/related-tools.png"

---

## The TypeSpec ecosystem

- [TypeSpec](https://typespec.io/) — the language this emitter consumes. Install the compiler with `npm install -g @typespec/compiler`.
- [TypeSpec playground](https://typespec.io/playground) — experiment with the language in the browser
- [`@typespec/openapi3`](https://www.npmjs.com/package/@typespec/openapi3) — model REST APIs in the same TypeSpec sources; many teams run both emitters over one spec
- [`@typespec/versioning`](https://typespec.io/docs/libraries/versioning/overview/) — versioned API libraries (integrated: latest enum value feeds `info.version`)

## The AsyncAPI ecosystem

- [AsyncAPI Initiative](https://www.asyncapi.com/) — the specification this emitter targets
- [AsyncAPI Studio](https://studio.asyncapi.com/) — visualize and edit the emitted documents
- [AsyncAPI parser](https://github.com/asyncapi/parser-api) — programmatic validation of emitted specs
- [Spectral](https://github.com/stoplightio/spectral) — additional lint rules on top of schema validation
- [`@asyncapi/specs`](https://github.com/asyncapi/spec-bindings) — the binding schemas this emitter's validation is generated from

## Alternative emitters

| Tool                                                       | Approach                               | AsyncAPI version |
| ---------------------------------------------------------- | -------------------------------------- | ---------------- |
| typespec-asyncapi (this)                                   | TypeSpec emitter, output AJV-validated | 3.1.0            |
| [tsp-asyncapi](https://www.npmjs.com/package/tsp-asyncapi) | TypeSpec emitter, direct-AST           | 3.0.0            |
| Hand-written YAML                                          | none                                   | any              |

The [comparison table on the landing page](/) covers capability differences in detail. The short version, checked October 2026:

| Capability             | typespec-asyncapi                       | tsp-asyncapi           |
| ---------------------- | --------------------------------------- | ---------------------- |
| AsyncAPI version       | 3.1.0                                   | 3.0.0                  |
| Output validation      | AJV against the official 3.1.0 schema   | 15 property tests      |
| Protocols / bindings   | 22 protocols, 19 generated bindings     | 13, hand-written       |
| Reusable components    | 11 decorators across 7 component slots  | not supported          |
| Multi-file output      | `split-schemas` with `$ref` rewriting   | not supported          |
| Compile-time checks    | 36 diagnostics                          | deferred               |

Choose the other emitter if its 3.0 output or its docs site matters more than schema-validated 3.1 output; choose this one when validation, reusable components, and generated binding metadata are the priority.

## Where to go next

- [Installation](/getting-started/installation/) — get started
- [FAQ](/faq/) — versions, validation, and mixed-emitter questions
- [Architecture](/reference/architecture/) — how the emitter is put together
- [Changelog](/changelog/) — current status
