# Smoke Test Example

This is the **minimal** TypeSpec AsyncAPI example. If this doesn't work, the emitter is broken.

## What it tests

- Basic TypeSpec compilation
- AsyncAPI 3.0 generation
- Channel creation
- Operation generation
- Model conversion

## How to run

```bash
# From project root
tsp compile examples/smoke --emit @lars-artmann/typespec-asyncapi

# OR from examples/smoke directory
cd examples/smoke
tsp compile . --emit @lars-artmann/typespec-asyncapi
```

## Expected output

Should create: `tsp-output/@lars-artmann/typespec-asyncapi/asyncapi.yaml`

Content should have:

- `asyncapi: "3.0.0"`
- `channels.events`
- `operations.publishEvent`

## If it fails

The emitter is fundamentally broken and needs fixing before any other work.

## If it succeeds

The emitter works! Any test failures are test infrastructure issues, not emitter issues.
