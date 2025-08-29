# TypeSpec AsyncAPI Emitter

A native TypeSpec emitter for generating AsyncAPI 3.0 specifications from TypeSpec definitions.

## ⚠️ Current Limitations

**VERSIONING NOT SUPPORTED**: This emitter does not currently support TypeSpec.Versioning decorators (`@added`, `@removed`, `@renamedFrom`). It generates a single AsyncAPI document without version-aware processing.

See [GitHub Issue #1](https://github.com/LarsArtmann/typespec-asyncapi/issues/1) for planned versioning support.

## Installation

```bash
bun install
```

## Usage

```bash
bun run build
cd examples/basic-events
tsp compile .
```

## Development

This project uses Bun as the JavaScript runtime and package manager.
