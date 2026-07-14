# Comprehensive Protocols Example

> **Note:** This example is under reconstruction. It uses deprecated decorator syntax and does not currently compile.

Planned: comprehensive demonstration of all supported AsyncAPI protocols (Kafka, WebSocket, MQTT, HTTP, AMQP) with protocol-specific bindings and security configurations.

## Usage

```bash
tsp compile examples/comprehensive-protocols
```

## TODO

- Convert all `{}` to `#{}` value literal syntax
- Fix decorator targets (`@channel` on operations, not models)
- Remove multiple blockless namespace declarations
- Add `tspconfig.yaml` with emitter configuration
