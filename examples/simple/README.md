# Simple Chat Example

Minimal AsyncAPI 3.1 specification for a WebSocket chat service.

## Usage

```bash
# From the project root
tsp compile examples/simple
```

Output: `tsp-output/@lars-artmann/typespec-asyncapi/asyncapi.yaml`

## What it demonstrates

- `@server` decorator for server configuration
- `@channel` + `@publish` / `@subscribe` for operations
- Model → message → schema mapping
- Spec-compliant `$ref` chain: operations → channels → components
