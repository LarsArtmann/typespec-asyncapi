# Advanced Decorators Example

Showcases advanced TypeSpec AsyncAPI features: message decorators, protocol bindings, security schemes, and correlation IDs.

## Usage

```bash
tsp compile examples/advanced
```

Output: `tsp-output/@lars-artmann/typespec-asyncapi/asyncapi.yaml`

## What it demonstrates

- `@message` decorator for message metadata (name, title, contentType)
- `@protocol` with Kafka, WebSocket, and HTTP bindings
- `@security` with OAuth2 flows
- `@correlationId` for message tracing
- `@tags` for operation categorization
- Nested model composition (preferences, settings, addresses)
