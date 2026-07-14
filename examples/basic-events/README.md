# Basic Events Example

Minimal event-driven chat API showing core AsyncAPI decorators.

## Usage

```bash
tsp compile examples/basic-events
```

Output: `tsp-output/@lars-artmann/typespec-asyncapi/asyncapi.yaml`

## What it demonstrates

- `@server` decorator for Kafka server configuration
- `@channel` + `@publish` / `@subscribe` for bidirectional messaging
- Multiple channels with distinct message payloads
- Model → message → schema mapping
