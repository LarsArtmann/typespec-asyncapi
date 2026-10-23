---
title: Multi-File Output
description: Split schemas into individual files with rewritten $ref pointers via split-schemas.
head:
  - tag: meta
    attrs:
      property: og:image
      content: "https://typespec-asyncapi.lars.software/og/guides/split-schemas.png"
  - tag: meta
    attrs:
      property: og:image:width
      content: "1200"
  - tag: meta
    attrs:
      property: og:image:height
      content: "630"
  - tag: meta
    attrs:
      property: og:image:alt
      content: "Multi-File Output — typespec-asyncapi"
  - tag: meta
    attrs:
      name: twitter:image
      content: "https://typespec-asyncapi.lars.software/og/guides/split-schemas.png"
---

For large specs, enable `split-schemas` to emit every schema into its own file under `schemas/`:

```bash
npx tsp compile api.tsp \
  --emit @lars-artmann/typespec-asyncapi \
  --option @lars-artmann/typespec-asyncapi.split-schemas=true
```

or in `tspconfig.yaml`:

```yaml
options:
  "@lars-artmann/typespec-asyncapi":
    split-schemas: true
```

## What changes

- Every `components.schemas` entry becomes `schemas/Name.yaml` (or `.json`)
- All `$ref` values are rewritten from `#/components/schemas/Name` to `schemas/Name.yaml` — in the main document and in the schema files themselves
- The main document keeps channels, operations, messages, and all other components inline

## When to use it

- Specs with dozens of schemas that become unreadable in one file
- Review diffs that should show one schema per change
- Downstream tools that consume per-schema files

:::tip
Both `split-schemas` and the `file-type` option compose — split JSON output works exactly like split YAML.
:::

## Where to go next

- [Emitter Options](/reference/emitter-options/) — all output options
- [split-schemas example](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples/split-schemas) — multi-file output in practice
- [Schema Generation](/guides/schemas/) — what lands in components.schemas
