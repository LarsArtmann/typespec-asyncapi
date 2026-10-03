# Mixed REST + Events Example

One TypeSpec project emitting both an OpenAPI 3.1 document (REST routes) and
an AsyncAPI 3.1 document (WebSocket events) from the same types — the setup
from [issue #252](https://github.com/LarsArtmann/typespec-asyncapi/issues/252).

## Usage

```bash
tsp compile examples/mixed-rest-events
```

Output:

- `tsp-output/rest/@typespec/openapi3/openapi.yaml` — REST routes only
- `tsp-output/websocket/asyncapi.yaml` — event channels only

## Why the namespaces are split this way

`@typespec/http` routes **every** operation under a `@service` namespace as a
REST endpoint (verb-less operations default to GET). Event operations placed
inside the service namespace therefore leak into the OpenAPI document as
phantom GET endpoints and collide as duplicate routes.

The supported structure keeps the two concerns in separate namespace branches:

- `Service.Backend.Rest` carries `@service`, the HTTP server, and the routes.
- `Service.Backend.Events` is a sibling **outside** the service subtree and
  carries the AsyncAPI server and the `@publish`/`@subscribe` operations.

The emitter warns (`event-op-in-service-namespace`) when event operations
accidentally live inside the service namespace, so misplacements are caught
at compile time instead of surfacing as confusing `duplicate-operation`
errors from `@typespec/http`.

Note that the blockless `namespace Service.Backend;` at the top is a file-level
ambient namespace: later namespace declarations in the same file resolve
relative to it, which is why `Rest` and `Events` are declared with plain names.
