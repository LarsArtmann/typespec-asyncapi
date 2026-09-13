---
title: Emitter Options
description: Output file, format, pretty-printing, split-schemas, and version options in tspconfig.yaml.
---

All options live under `options."@lars-artmann/typespec-asyncapi"` in `tspconfig.yaml`, or on the command line via `--option @lars-artmann/typespec-asyncapi.<option>=<value>`.

## Options

| Option          | Type               | Default    | Purpose                                                                       |
| --------------- | ------------------ | ---------- | ----------------------------------------------------------------------------- |
| `output-file`   | `string`           | `asyncapi` | Base filename (without extension)                                             |
| `file-type`     | `string` or object | `yaml`     | `"json"`, `"yaml"`, `"yml"`, or `{ format: "json", pretty: true, indent: 2 }` |
| `split-schemas` | `boolean`          | `false`    | Split schemas into individual files under `schemas/`                          |
| `asyncapi-id`   | `string`           | unset      | Root document `id` (e.g. `"urn:com:example:api"`); omitted when unset         |
| `version`       | `string`           | unset      | Overrides `info.version` (highest precedence)                                 |

## Examples

Pretty JSON:

```yaml
options:
  "@lars-artmann/typespec-asyncapi":
    file-type: { format: "json", pretty: true, indent: 2 }
```

Split schemas with a URN id:

```yaml
options:
  "@lars-artmann/typespec-asyncapi":
    split-schemas: true
    asyncapi-id: "urn:com:example:api"
```

## Output location

Output lands in `tsp-output/@lars-artmann/typespec-asyncapi/` by convention (`emitter-output-dir` from the package manifest). With `split-schemas`, schema files land in a `schemas/` subdirectory with all `$ref` pointers rewritten.

## Where to go next

- [Multi-File Output](/guides/split-schemas/) — split schemas in depth
- [Versioning](/guides/versioning/) — the `version` precedence chain
- [Installation](/getting-started/installation/) — wiring the emitter
