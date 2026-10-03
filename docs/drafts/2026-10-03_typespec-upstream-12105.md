<!-- Canonical local copy of the posted upstream filing (the /tmp draft was disposable). -->
<!-- Posted: https://github.com/microsoft/typespec/issues/12105 (2026-10-03T12:34:33Z) -->
> [!NOTE]
> This filing was drafted by GLM-5.3-flash and GLM-5.3 via Crush, with multiple rounds of feedback from me. The failure behind it was found and reported by a user in [LarsArtmann/typespec-asyncapi#252](https://github.com/LarsArtmann/typespec-asyncapi/issues/252).
>
> - [x] MANUALLY REVIEWED by `@Lars Artmann` at `2026-10-03 14:34 CEST`

**TL;DR:** Verb-less operations silently get an implicit GET/POST; non-REST programs then fail with `duplicate-operation` errors that never name the cause. Please surface the implicit verb: warn when it is chosen, and name the operations in `duplicate-operation` errors.

## Problem

In mixed programs that combine REST (`@typespec/http` + `@typespec/openapi3`) with event-style operations (no HTTP verb — e.g. for an AsyncAPI emitter), every verb-less operation under a `@service` namespace silently gets an implicit HTTP verb and becomes a REST endpoint. Verb-less with a request body → POST, otherwise → GET. The user sees neither the chosen verb nor a signal; downstream, two event operations in one service collide as `duplicate-operation` errors whose message ("Duplicate operation routed at `get /api/v1`") does not hint that verb-less non-REST operations are the cause.

Minimal repro (`@typespec/http` 1.16.0, `@typespec/compiler` 1.16.0):

```typespec
import "@typespec/http";
using TypeSpec.Http;

@service(#{title: "Demo"})
@route("/api/v1")
namespace Demo {
  @get op explicitGet(): string;          // GET  /api/v1/explicit-get
  op verblessNoBody(): string;            // GET  /api/v1/verbless-no-body  (silent)
  op verblessWithBody(@body body: string): string;  // POST /api/v1/verbless-with-body  (silent)
  op verblessQueryOnly(@query q: string): string;   // GET  /api/v1/verbless-query-only (silent)
}
```

Resolved via `getAllHttpServices` (verified empirically, zero diagnostics emitted):

| operation            | declared              | resolved route |
| -------------------- | --------------------- | -------------- |
| `explicitGet`        | `@get`                | GET (expected) |
| `verblessNoBody`     | nothing               | **GET**        |
| `verblessWithBody`   | `@body`               | **POST**       |
| `verblessQueryOnly`  | `@query`              | **GET**        |

Source of the fallback: `@typespec/http` `dist/src/parameters.js` `getOperationParameters` — verb selector → `getOperationVerb` → overload base → "POST if there is a body and GET otherwise". The real-world trigger: a TypeSpec program authored for both OpenAPI and AsyncAPI (community `@lars-artmann/typespec-asyncapi` emitter, [LarsArtmann/typespec-asyncapi#252](https://github.com/LarsArtmann/typespec-asyncapi/issues/252)) — event operations are verb-less by design, so all of them phantom-route as REST and the OpenAPI output breaks with duplicate-operation errors.

## Goal

Make the implicit verb decision visible before it collides:

- [ ] A warning (or at least linter rule) when a verb-less operation under a `@service` namespace resolves to an implicit verb, nameable as "no explicit verb; defaulted to GET/POST"
- [ ] `duplicate-operation` errors that name the involved operations' declared verbs, so "routed at `get /api/v1`" is traceable to the verb-less source operation
- [ ] A documented escape for non-REST operations in a `@service` namespace (today the only workaround is moving them outside the service subtree)

## Why the default exists (researched upstream history)

- The fallback is deliberate and documented in source: [`packages/http/src/parameters.ts`](https://github.com/microsoft/typespec/blob/main/packages/http/src/parameters.ts) carries the comment "If no verb is explicitly specified, it is POST if there is a body and GET otherwise", and even acknowledges the edge case ("In that rare case, GET is chosen arbitrarily").
- It is taught as the intended terse style in the docs: the [HTTP Operations guide](https://typespec.io/docs/libraries/http/operations/) ("Operation verb → Default behavior: … `@get` otherwise") and its own examples (`op list(): Pet[];` routed as GET with no verb decorator) rely on it. The older REST resource-routing guide states the same default.
- It dates to the original routing-model redesign ([#90](https://github.com/microsoft/typespec/pull/90), Nov 2021), which was built around auto-routed resource CRUD operations (`list` → GET, `create` → POST); the default removes boilerplate for exactly that shape. The behavior survived the `@typespec/http` library split ([#1668](https://github.com/microsoft/typespec/pull/1668)) unchanged.
- We found no issue, PR, or discussion that revisits the implicit-verb choice for non-REST operations. Searches over open and closed issues and discussions for "verbless" / "verb-less", "implicit GET", "default HTTP verb", and "without explicit HTTP verb" return nothing; the resource-CRUD origin above is the only rationale on record.
- The friction is not hypothetical: [LarsArtmann/typespec-asyncapi#252](https://github.com/LarsArtmann/typespec-asyncapi/issues/252) shows a user's mixed REST + events program failing with `duplicate-operation` errors and no output from either emitter.

## Proposal

Smallest correct change: extend the existing route-uniqueness validation to also report the implicit-verb case once per operation (`no-explicit-verb`-style diagnostic, warning severity). That alone would have turned a confusing duplicate-route error into a one-line fix for the mixed-program case.

---

💘 Generated with Crush

