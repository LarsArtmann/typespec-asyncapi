# ADR 0003: Import AsyncAPI into TypeSpec through a separate conversion pipeline

**Status:** Proposed

**Date:** 2026-11-18

## Context

This package emits AsyncAPI 3.1 from TypeSpec. It does not import existing descriptions. The [migration guide](../../website/src/content/docs/getting-started/migration.md) currently asks users to model their API by hand and diff the emitted document against the original. An importer should produce editable TypeSpec and tell users where that same comparison will show meaningful differences. It should not promise a byte-identical or lossless round trip.

The companion [AsyncAPI 3.1 import mapping](asyncapi-3.1-import-mapping.md) inventories specification objects and distinguishes existing TypeSpec mappings, emitter options, and gaps.

The reference implementation is [`@typespec/openapi3`][upstream] at commit [`3b98b20a`][revision], inspected in the sibling TypeSpec checkout. The next two sections describe what that revision does; the proposal that follows is for this repository. No importer is implemented by this ADR.

## Reference implementation: CLI and conversion API

`@typespec/openapi3` publishes the `tsp-openapi3` executable via `package.json`'s `bin` field. `cmd/tsp-openapi3.js` is a Node shebang shim that imports the compiled CLI and exits with status 1 if `main()` rejects. There is **no `convert` subcommand**.

```text
tsp-openapi3 <path> --output-dir <directory> [--namespace <name>]
tsp-openapi3 --help
```

| Surface | Observed behavior |
| --- | --- |
| `<path>` | Exactly one positional; the documented entry point is a local YAML or JSON file, resolved relative to the caller's working directory. |
| `--output-dir` | Required. The action creates the directory and writes a single fixed-name `main.tsp`; there is no overwrite guard, stdout mode, or generated `tspconfig.yaml`. |
| `--namespace` | Optional. A nonempty override replaces the namespace derived from `info.title`, not the original service title. Both go through the same stripping function, which removes spaces and most punctuation rather than validating a qualified TypeSpec name. |
| `--help` and errors | Node's `util.parseArgs` parses options. Once parsing succeeds, help takes precedence over required-argument checks and exits 0. Missing required arguments or excess positionals print usage and diagnostics to stdout and exit 1. Parser errors instead reach the outer stderr handler. |

Both entry points ultimately call `createContext` → `transform` → `generateMain` → `formatTypeSpec` (100-column print width, two-space indentation), but their input and failure contracts differ:

| Stage | CLI: `convertAction(host, args)` | Library: `convertOpenAPI3Document(document, options)` |
| --- | --- | --- |
| Entry | Internal file action with a `NodeHost`-based host for output I/O. | Public export from package root; accepts a typed OpenAPI 3.0/3.1/3.2 document and returns `Promise<string>`. |
| References | Scalar `json-magic` bundles the entry document with file, URL, YAML, and JSON plugins, with tree shaking disabled. The injected output host does not mediate those reads. No CLI flag disables fetching external references. | Scalar `openapi-parser` dereferences the object. The optional `disableExternalRefs` callback rejects refs not beginning with `#`. The code checks that dereferencing returned a specification, but hands the **original** `document` to `createContext`, not the returned `specification`. Do not assume the API has the CLI's effective bundling semantics. |
| Errors and output | Generation errors reach the internal-error handler. On formatting failure it still writes the unformatted file, then reports an internal error and exits 1. Transforms use `console` for warnings; the action does not return structured diagnostics. | No output file. A missing dereference result throws; a formatting exception is caught and the unformatted string is returned without a diagnostic. |

Neither entry point compiles the result before returning. Formatting is not semantic validation. The CLI casts the bundled object to document types and checks for a missing result, rather than performing a separate OpenAPI schema validation step. The API's wider type union and selected 3.2 test cases are not a guarantee of full 3.2 feature coverage.

Source: [executable shim][bin], [CLI argument parser][cli], [file and document actions][convert], and [public exports][index].

## Reference implementation: model, map, render

### Representation and pass ordering

The converter is not the OpenAPI emitter run backwards. `interfaces.ts` defines a converter-owned `TypeSpecProgram`, not the compiler's AST or checked `Program`. It holds service info, servers, tags, declarations, operations, nested namespaces, and a slot for augmentations. Declarations are a discriminated union of alias, enum, model, scalar, and union. Records carry scope, doc text, directives and decorators as needed. This is a hybrid intermediate representation: property types, request bodies, and responses retain OpenAPI data for the rendering stage to interpret.

1. **Create a context per conversion.** `utils/context.ts` owns the input document, root namespace, logger, schema-expression generator, and reference/usage registries. `getByRef` looks up recognized component collections and warns on unsupported kinds. Lookup and expression naming split on `/`; they are not a general RFC 6901 resolver. Reference naming qualifies schemas with the service namespace inside nested scopes and uses `Parameters` and `Responses` for those component categories. Dotted names become namespace paths; `printIdentifier` escapes individual segments.
2. **Analyze usages before declarations.** `transforms/transforms.ts` scans operations for referenced multipart bodies and their encodings, referenced error payloads used under 4xx/5xx responses, and, for versions after 3.1, referenced SSE event schemas. The same component shape may need different TypeSpec annotations based on its use.
3. **Build the declaration and operation graph.** Transforms collect schemas, reusable responses, and reusable parameters before transforming paths. Namespaces group declarations and operations by scope; service info, tags, and servers are transformed separately. A used response component is keyed by both reference and status code, since the same response can be reused with different statuses.
4. **Render source, then format.** `generate-main.ts` assembles imports, `using` statements, a decorated file namespace, root declarations and operations, nested namespaces, and generated helpers. It includes HTTP/OpenAPI imports unconditionally and Streams/SSE/Events imports when needed. Smaller generators handle models, operations, response expressions and decorators. The decorator renderer distinguishes escaped string literals from tagged raw TypeSpec value expressions, deduplicates rendered decorators, and emits directives separately.

Source: [intermediate representation and entry points][convert], [context and naming helpers][utils], [transform passes][transforms], and [source generators][generators].

### Representative mapping rules

| OpenAPI input | Generated TypeSpec and tradeoffs |
| --- | --- |
| `info`, servers, tag metadata | `@service` preserves the title; `@info` carries version and other selected metadata; server URLs, descriptions, and variables become `@server`; root tags become `@tagMetadata` and operation tags become `@tag`. Selected native 3.2 tag fields also read from compatibility extensions in older documents. |
| Named schemas | A component `$ref` becomes an alias. Non-nullable string enums become enums; other enum and alternative shapes become unions. Object and array components become models (named arrays use `model … is …`); primitive components become scalars. `required` controls `?`; typed `additionalProperties` becomes a `Record<T>` spread in a named model, and `true` uses `unknown` as the element type. |
| Inline schemas and composition | The expression generator maps primitives and formats, refs, `const`, enum literals, array item types, object shapes, and composition. It emits `anyOf`/`oneOf` as unions, using `@oneOf` where applicable, and inline `allOf` as an intersection. For named `allOf` it collects inline properties and spreads referenced models; it uses `extends` for a single discriminator-bearing base and falls back to spreading if several bases qualify. Duplicate fields can require manual repair. |
| Nullability and annotations | Handles 3.0 `nullable`, two-member nullable type arrays, and nullable `anyOf`/`oneOf` cases. Shape-based simplification can unwrap a sole inline object alternative even when accompanied by null; a ref plus an object remains a union. Selected constraints become standard decorators, schema titles become `@summary`, `deprecated` becomes `#deprecated`, and read/write flags become lifecycle visibility. Defaults and supported `$ref` siblings are handled at use sites; defaults that target enum members may need a member expression, not a quoted string. |
| Paths, operation identity, and parameters | Each supported route/verb pair maps to `@route`, a verb decorator, and an `op`. A missing `operationId` gets a generated name, warning, and `FIXME`. Path- and operation-level parameters are merged with the latter winning for the same location/name (or identical ref). Reusable parameters are models under `Parameters` and are spread into signatures. Decorators encode parameter location and selected serialization styles and paging extensions. |
| Request bodies | Media entries become body types; the converter emits an explicit content-type header unless the only media type is `application/json`. Compatible alternatives are combined as a union; mixed multipart and non-multipart requests split into `@sharedRoute` operations with suffixed names. Multipart uses `@multipartBody` and `HttpPart` mapping informed by the usage scan. This is an example of a deliberate one-to-many translation, not a generic rule to apply to event messages. |
| Responses | Operation return types union response variants. The renderer uses built-in HTTP response models for known statuses where possible, or composes status, headers, and body into model expressions; default response helpers represent error cases. Used reusable responses get named `Responses` models keyed by ref and status. Those reusable models pick JSON content if present, otherwise the first media entry, unlike inline response rendering, which can generate a variant per media entry. Selected 3.2 event-stream responses use `SSEStream<T>` and event-union annotations instead. |

These are migration heuristics, not an inverse specification. For example, the root transform has no security-scheme or security-requirement pass, and the request-body IR records optionality that the current parameter renderer does not use. Ordinary schema-default code also has truthiness checks that can miss values such as `false`, `0`, or `""`. Preserve the layering, not these behaviors.

### How upstream tests it

| Test layer | What it verifies |
| --- | --- |
| Focused units | `context.test.ts`, `generate-type.test.ts`, `http-part-methods.test.ts`, and `utils/generate-operation-id.test.ts` exercise registries, type expression generation, multipart decisions, and name normalization/uniqueness without writing a project. |
| Converter API and rendering | `convert-openapi3-doc.test.ts` parameterizes core cases across 3.0.0, 3.1.0, and 3.2.0. Tests compare against expected snippets formatted with the same options or assert targeted source; cases include ref reuse, string escaping, defaults, and version-specific metadata. `namespace-option.test.ts` covers naming separately from service title. |
| Compiler-backed semantics | `utils/tsp-for-openapi3.ts` builds a minimal document from overrides, calls the public converter, places a fourslash marker on the expected namespace, and runs an in-memory TypeSpec `createTester` with the relevant libraries. It exposes the checked namespace, program, and diagnostics so tests such as `data-types.test.ts`, `parameters.test.ts`, and `paths.test.ts` can assert semantics, not just text. The convenience helper rejects unexpected diagnostics. |
| File action and fixtures | `cli-namespace-option.test.ts` uses real temp input/output files and cleanup, but calls `convertAction` directly. `specs.test.ts` recursively discovers `specs/**/service.yml` and `service.json`, uses real input reads with a recording output host, and byte-compares `output/<fixture>/main.tsp` against golden files. Missing and stale outputs are checked; `RECORD=true` (`pnpm run regen-specs` upstream) refreshes them. Fixtures include escaped identifiers, composition, multipart, servers, and SSE. |

The fixture suite locks what is written, not whether every fixture compiles or re-emits equivalent OpenAPI. The active file-action tests do not exercise the published executable's argument parser, stream behavior, or exit statuses. The spawn script under `utils/generate-typespec.ts` references a different executable name and should not be mistaken for that coverage. Source: [upstream converter tests][tests] and [compiler test host][test-host].

## Proposed decision for this package

Reuse TypeSpec's existing import functions wherever they preserve the AsyncAPI contract, with JSON Schema conversion as the first target. Own the AsyncAPI-specific graph and decorator mapping rather than duplicating schema conversion. Keep the importer independent of `src/emitter.ts`, the asset emitter, and TypeSpec's compiler internals. Share one conversion core between the executable and in-process tests; do not make a public programmatic API commitment until its result shape and compatibility policy are settled.

```text
CLI entry / file adapter
  -> parse JSON or YAML and validate the supported document version and shape
  -> resolve supported refs and index original keys and usages
  -> map the AsyncAPI graph and delegate payload schemas through a schema adapter
  -> render and format editable source
  -> return source and diagnostics; write only on success
```

- **CLI:** Propose a package `bin` named `tsp-asyncapi` with one local input path, required `--output-dir`, optional `--namespace`, and `--help`. Accept YAML and JSON and produce one formatted `main.tsp` first; do not generate or install a project implicitly. Use the original title independently of the namespace override. Treat argument, input, and output errors as nonzero exits with actionable stderr diagnostics; help exits 0. Refuse to overwrite an existing `main.tsp` by default, and do not write malformed or unformatted output on failure.
- **Resolution:** Start with AsyncAPI 3.1 and document-local `$ref` only. Resolve JSON Pointer tokens correctly, preserve identity of reusable and recursive declarations, and distinguish recursive schema references from unresolvable reference chains. Reject unsupported external refs explicitly rather than doing network or incidental filesystem I/O. Index keys before rendering and allocate stable collision-free TypeSpec identifiers without conflating them with the original wire names.
- **Mapping:** Represent the AsyncAPI graph explicitly: root metadata, servers, channels, operations, reusable messages, and payload schemas. Keep original IDs and addresses separate from source identifiers; pre-scan where a message or payload is used before choosing declarations. Preserve message and payload identity separately in the intermediate representation even if current emission cannot express both. Translate only confirmed representable constructs to existing decorators and TypeSpec syntax. Report unsupported fields and approximations with a stable diagnostic code and an input location (at least a JSON Pointer); do not silently flatten or synthesize missing contract details.
- **Rendering:** Use compiler identifier-printing and formatting helpers, with a single renderer for strings, documentation, and TypeSpec value literals. Keep user input out of raw source fragments. Quote or escape identifiers and keys as TypeSpec requires; test comment terminators, quotes, interpolation markers, reserved words, Unicode, and normalization collisions. Keep the emitted declaration ordering stable for the same input.

### Reuse JSON Schema conversion before writing a local mapper

The pinned checkout exposes [`convertOpenAPI3Document`][index], a document-to-source API, but not its internal [`SchemaToExpressionGenerator`][generators], component-schema transform, or schema decorator helpers. [`@typespec/json-schema`][json-schema-index] exposes emission and decorators, not a JSON Schema importer. Use public compiler helpers such as `printIdentifier` and `formatTypeSpec` directly; do not deep-import unpublished converter modules.

1. **Evaluate the public converter behind an adapter first.** Prototype passing the supported payload schema graph as `components.schemas` in a minimal OpenAPI document. Give the adapter stable schema names and rewrite supported local references to those names without inlining shared or recursive schemas. Verify that we can extract and integrate the resulting declarations using supported compiler APIs, without copying the converter's HTTP/OpenAPI preamble or scraping generated text. Check that any required decorators preserve semantics when compiled with this emitter. Do not equate an OpenAPI Schema Object with every AsyncAPI payload dialect.
2. **If the document adapter is too coupled, prefer an upstream extraction.** Propose a supported schema-to-TypeSpec entry point shared by both importers. Candidate reusable pieces include primitive and format mapping, named declaration classification, schema expressions, defaults, and constraint decorators. Keep reference resolution, symbol naming, dialect selection, and unsupported-feature diagnostics explicit at that boundary, rather than inheriting OpenAPI's component path and fallback assumptions.
3. **Implement only gaps locally.** Keep AsyncAPI-specific metadata and fidelity checks on our side of the adapter. If no supported upstream path is viable for the initial scope, record the failed cases and implement only the uncovered mappings behind the same boundary. Do not fork the entire converter or maintain two implementations of a mapping that can be delegated safely.

Accept reuse based on compiler and semantic round-trip tests, not on whether the upstream converter returns source. Cover escaped and recursive refs, object/array constraints, false/zero/empty defaults, nullable vs optional properties, and `oneOf` vs `anyOf`. Check that generated declarations need no HTTP runtime dependency and that unsupported schemas are diagnosed instead of silently turning into `unknown`.

### AsyncAPI mapping boundaries to prove against the emitter

| Input | Candidate lowering and fidelity boundary |
| --- | --- |
| Root `info`, default content type, servers | `@service`, `@apiVersion`, `@defaultContentType`, and `@server`. The emitter's root `id` is an emitter option; a `main.tsp`-only CLI cannot promise to re-emit it. Check supported `info` and server fields individually rather than copying the OpenAPI metadata mapping. |
| Channels and operations | `send` → `@publish`, `receive` → `@subscribe`; use `@operationId` and explicit `@channel` instead of name-based inference. Keep channel key and address distinct in the graph: the current emitter derives both output key and address from `@channel`, so distinct keys, null addresses, or channels without operations need a diagnostic or an emitter extension. Channel metadata shared by multiple operations needs tests, not last-write-wins behavior. |
| Message references and payload | Start with named object payloads that can be emitted as TypeSpec models, with `@message`/`@messageId` where representable. Existing operation discovery gets message models from operation return types, including unions of models. Multiple message IDs for a shared payload, channel membership independent of operation membership, non-model payloads, and alternate schema formats are not automatically lossless. Do not duplicate schemas or invent wrapper payload fields just to satisfy the renderer. |
| Payload constraints and reuse | Use TypeSpec properties, standard constraints, `@encodedName`, `Record<T>`, and existing schema-extension support where semantics are verified. Explicitly test optional vs nullable, defaults including false/zero/empty, recursive and escaped refs, and `oneOf` exclusivity vs `anyOf` overlap. A syntactically valid TypeSpec union alone does not guarantee equivalent emitted validation. |
| Protocol and reusable metadata | Evaluate existing decorators for bindings, server refs, channel parameters, traits, headers, correlation IDs, security, replies, and extensions. Implement mappings incrementally with semantic checks. For example, emitted message headers are assembled from decorated header properties rather than an arbitrary input schema; a reply is not an HTTP response and must not be inferred from roles or naming. |

Local evidence: [decorator definitions](../../lib/main.tsp), [operation discovery](../../src/builders/operation-discovery.ts), [channel assembly](../../src/builders/channel-builder.ts), and [message assembly](../../src/builders/message-builder.ts).

### Verification strategy

1. **Unit and focused integration tests:** Test parsing/version checks, pointer resolution and symbol allocation, graph mapping, diagnostics, and identifier/value rendering. Use compact inline input fixtures, asserting meaningful output and diagnostics for supported and unsupported cases.
2. **Compiler and round-trip tests:** Compile generated source with the repository's in-memory TypeSpec test helpers. For supported constructs, re-emit AsyncAPI, validate with the existing AsyncAPI schema harness, and compare the semantic contract: channel addresses and membership, operation IDs/actions, message and payload refs, wire property names, and constraints. Resolve or normalize reference/alias spelling only when it is semantically immaterial. Assert expected diagnostics for deliberate losses; don't normalize them away.
3. **Golden fixtures:** Keep representative JSON and YAML descriptions next to reviewed `.tsp` outputs, including multi-message channels and shared/recursive schemas. Golden text protects readability and layout; compiler and semantic tests protect behavior. Updates must be explicit, not performed during an ordinary test run.
4. **Executable smoke tests:** Add a small subprocess suite against the built bin for actual argv parsing, exit codes, stdout/stderr, output directory creation, and protection of an existing `main.tsp`. Test a malformed input and a rejected external ref with no output. Include one package-install smoke check before release to verify the shim and compiled modules are shipped. Keep mapping tests in-process.

## Alternatives and consequences

- **Direct document-to-string templates:** less code for a demo, but identifiers, shared objects, and unsupported semantics become difficult to reason about as soon as the same object has several uses. Use a small typed representation rather than a full independent compiler AST.
- **Adopt or fork the entire OpenAPI converter:** rejected. HTTP status, request, route, and OpenAPI version conventions do not belong in the AsyncAPI graph mapper. Reuse the schema conversion through a supported boundary rather than adopting the whole pipeline or depending on private modules.
- **Round-trip completeness before release:** not required to provide useful migration output. A supported subset plus actionable loss diagnostics is a smaller contract. The cost is a maintained support matrix and tests for both fidelity and deliberate omissions.

Before implementation settles the CLI contract, decide which unmappable constructs are fatal versus warnings, whether to expose a strict mode, and whether non-3.1 inputs should get an explicit upgrade path. Independent channel IDs, message/payload separation, and additional metadata should be evaluated as emitter changes separately from the initial import scope.

[upstream]: https://github.com/microsoft/typespec/tree/3b98b20aef4f9765d74eb637a1b0cc3688800e37/packages/openapi3
[revision]: https://github.com/microsoft/typespec/commit/3b98b20aef4f9765d74eb637a1b0cc3688800e37
[bin]: https://github.com/microsoft/typespec/blob/3b98b20aef4f9765d74eb637a1b0cc3688800e37/packages/openapi3/cmd/tsp-openapi3.js
[cli]: https://github.com/microsoft/typespec/tree/3b98b20aef4f9765d74eb637a1b0cc3688800e37/packages/openapi3/src/cli
[convert]: https://github.com/microsoft/typespec/tree/3b98b20aef4f9765d74eb637a1b0cc3688800e37/packages/openapi3/src/cli/actions/convert
[index]: https://github.com/microsoft/typespec/blob/3b98b20aef4f9765d74eb637a1b0cc3688800e37/packages/openapi3/src/index.ts
[json-schema-index]: https://github.com/microsoft/typespec/blob/3b98b20aef4f9765d74eb637a1b0cc3688800e37/packages/json-schema/src/index.ts
[utils]: https://github.com/microsoft/typespec/tree/3b98b20aef4f9765d74eb637a1b0cc3688800e37/packages/openapi3/src/cli/actions/convert/utils
[transforms]: https://github.com/microsoft/typespec/tree/3b98b20aef4f9765d74eb637a1b0cc3688800e37/packages/openapi3/src/cli/actions/convert/transforms
[generators]: https://github.com/microsoft/typespec/tree/3b98b20aef4f9765d74eb637a1b0cc3688800e37/packages/openapi3/src/cli/actions/convert/generators
[tests]: https://github.com/microsoft/typespec/tree/3b98b20aef4f9765d74eb637a1b0cc3688800e37/packages/openapi3/test/tsp-openapi3
[test-host]: https://github.com/microsoft/typespec/blob/3b98b20aef4f9765d74eb637a1b0cc3688800e37/packages/openapi3/test/test-host.ts
