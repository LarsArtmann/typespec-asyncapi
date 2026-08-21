---
title: Related Tools
description: The ecosystem around typespec-asyncapi — TypeSpec, AsyncAPI tooling, and sibling emitters.
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

| Tool | Approach | AsyncAPI version |
| --- | --- | --- |
| typespec-asyncapi (this) | TypeSpec emitter, output AJV-validated | 3.1.0 |
| [tsp-asyncapi](https://www.npmjs.com/package/tsp-asyncapi) | TypeSpec emitter, direct-AST | 3.0.0 |
| Hand-written YAML | none | any |

The [comparison table on the landing page](/) covers capability differences in detail.

## Where to go next

- [Installation](/getting-started/installation/) — get started
- [Changelog](/changelog/) — current status
