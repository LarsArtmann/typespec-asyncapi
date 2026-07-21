# Kafka Events Example

AsyncAPI 3.1 specification for a Kafka-based event streaming service.

## Usage

```bash
tsp compile examples/kafka
```

Output: `tsp-output/@lars-artmann/typespec-asyncapi/asyncapi.yaml`

## What it demonstrates

- Kafka protocol configuration with `@protocol`
- `@server` with Kafka broker URL
- `@channel` + `@publish` for producing events
- Model → message → schema mapping
