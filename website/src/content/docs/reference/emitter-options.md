---
title: Emitter options
description: Generated from source on every run of scripts/generate-references.ts — never hand-edit.
---

> **Generated file** — produced by `scripts/generate-references.ts` (`pnpm run references:generate`). Never hand-edit; the drift test fails if this file is stale.

## Emitter options

| Option            | Type                                                                                                      | Description                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `"asyncapi-id"`   | string?                                                                                                   | Unique document identifier (AsyncAPI root `id`, e.g. a URN)       |
| `"file-type"`     | \| "json" \| "yaml" \| "yml" \| { format: "json" \| "yaml" \| "yml"; pretty?: boolean; indent?: number }? | Output file format (json, yaml, yml) or detailed format config    |
| `"output-dir"`    | string?                                                                                                   | Output directory for generated files                              |
| `"output-file"`   | string?                                                                                                   | Output file name without extension                                |
| `"split-schemas"` | boolean?                                                                                                  | Split schemas into individual files under a schemas/ subdirectory |
| `title`           | string?                                                                                                   | Generated document title                                          |
| `version`         | string?                                                                                                   | Target AsyncAPI specification version                             |
