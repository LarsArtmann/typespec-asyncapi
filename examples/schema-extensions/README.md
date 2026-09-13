# Schema Extensions Example

JSON Schema keywords, wire-format renaming, and AsyncAPI `x-` extensions.

## Usage

```bash
tsp compile examples/schema-extensions
```

Output: `tsp-output/@lars-artmann/typespec-asyncapi/schema-extensions.yaml`

## What it demonstrates

- `@jsonSchemaExtension` for arbitrary JSON Schema validation keywords
  (`pattern`, `minimum`, `multipleOf`, `examples`, `additionalProperties`)
  on models and properties
- `@encodedName` for wire-format property keys that differ from the TypeSpec
  identifier (`paymentId` emitted as `Payment-Id`)
- `@extension` for AsyncAPI `x-` extensions at the document root (namespace),
  operation, and message levels
