# Multi-Channel Example

AsyncAPI 3.0 specification with multiple channels and operations.

## Usage

```bash
tsp compile examples/multi-channel
```

Output: `tsp-output/@lars-artmann/typespec-asyncapi/asyncapi.yaml`

## What it demonstrates

- Multiple channels in a single namespace
- `@publish` / `@subscribe` across different topics
- Distinct message models per channel
- Spec-compliant `$ref` chain for multiple schemas
