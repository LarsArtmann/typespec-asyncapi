---
title: Schema Generation
description: How TypeSpec models, scalars, constraints, unions, and generics become JSON Schema components.
---

Every TypeSpec scalar maps to the correct JSON Schema type and format. Named models, enums, and scalars are emitted as reusable `components.schemas` entries referenced by `$ref`.

## Scalar mapping

int8-64, uint8-64, float32/64, `dateTime` (`format: date-time`), `duration`, `bytes`, `url`, and more — roughly 30 intrinsic mappings.

Notable cases:

- `unknown`, `void`, `never` emit `{}` — the unconstrained schema, not `type: "string"`
- `null` emits `{ type: "null" }`, so `string | null` composes `anyOf: [{type: "string"}, {type: "null"}]`
- `decimal` emits `type: string` + `format: decimal` (JSON floats lose precision; the string form is the JSON Schema convention)

## Constraint decorators

All standard constraints map to validation keywords:

| TypeSpec | JSON Schema |
| --- | --- |
| `@minValue` / `@maxValue` | `minimum` / `maximum` |
| `@minValueExclusive` / `@maxValueExclusive` | `exclusiveMinimum` / `exclusiveMaximum` |
| `@minLength` / `@maxLength` | `minLength` / `maxLength` |
| `@pattern` | `pattern` |
| `@minItems` / `@maxItems` | `minItems` / `maxItems` |
| `#deprecated` | `deprecated: true` |
| `@summary` | `title` |
| `@example` | `examples` |
| `@visibility` | `readOnly` / `writeOnly` |
| `prop: Type = value` | `default` |

Validation keywords are skipped on `$ref` schemas (Draft-07 ignores siblings); metadata keywords (`description`, `title`, `examples`, `deprecated`, `default`) are valid `$ref` siblings and are applied.

## Inheritance and polymorphism

```typespec
model BaseEvent { id: string; }
model OrderEvent extends BaseEvent { amount: decimal; }
```

`OrderEvent` emits `allOf: [{ $ref: "#/components/schemas/BaseEvent" }]` with only its own properties. `@discriminator` adds the `discriminator` keyword and auto-adds the property to `required`.

## Unions

- All-model variants emit `oneOf` (exclusive); mixed variants (`string | int32`) emit `anyOf`
- String-literal unions emit `enum`
- Named unions are declared in `components.schemas` and receive `@doc`/`@summary` as `description`/`title`

## Generic models

Generic instantiations get stable, argument-derived schema names:

- `Page<User>` emits `components.schemas.PageUser`
- `Box<int32>` emits `BoxInt32`, `Page<Page<User>>` emits `PagePageUser`
- Anonymous or literal arguments (`Box<{ x: string }>`) inline instead of referencing
- `Record<string, T>` maps to `{ type: "object", additionalProperties }`
- A model named `PageUser` colliding with `Page<User>` triggers a `duplicate-schema-name` warning

## Arrays and records

- `Item[]` emits `items: { $ref: "#/components/schemas/Item" }`
- `Record<Item>` emits `additionalProperties: { $ref }`
- `Record<string>` maps to `{ type: "object", additionalProperties: { type: "string" } }`

## Custom JSON Schema keywords

`@jsonSchemaExtension(key, value)` attaches arbitrary keywords (`multipleOf`, vendor extensions) to any Model, ModelProperty, Union, Enum, or Scalar — inline and as `$ref` siblings. Repeatable; the outermost same-key application wins.

## Where to go next

- [Decorators](/guides/decorators/) — full decorator reference
- [Multi-File Output](/guides/split-schemas/) — one file per schema
- [polymorphism example](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples) — discriminator and union patterns
