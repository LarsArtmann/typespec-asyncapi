# Gap Analysis: TypeSpec & AsyncAPI Feature Coverage

**Date:** 2026-08-05 18:20
**Session type:** Research / Gap analysis
**Trigger:** User asked "What are things the LATEST typespec and/or LATEST asyncapi supports that we DON'T?"

---

## What This Session Did

Performed a systematic gap analysis comparing the project's current capabilities against:
1. **Latest TypeSpec compiler** (1.14.0 — we're on 1.13.0)
2. **Latest AsyncAPI spec** (3.1.0 — we target this, but miss many fields)
3. **TypeSpec built-in stdlib decorators** (16 constraint/metadata decorators — none handled)

Methodology:
- Read `package.json`, all emitter source files, all builders, domain models, state management
- Extracted the full AsyncAPI 3.1.0 JSON Schema from `@asyncapi/specs` to enumerate every field
- Enumerated all TypeSpec stdlib decorators from `@typespec/compiler` internals
- Cross-referenced: for each spec field / decorator, checked if the codebase handles it

---

## FULLY DONE (Working, Verified by Reading Code)

- **AsyncAPI 3.1 document structure** — `asyncapi`, `info` (title, version, description), `channels`, `operations`, `components` (schemas, messages, securitySchemes), `servers`, `defaultContentType`
- **Core schema generation** — models → JSON Schema objects with properties, types, required fields, inheritance
- **Scalar type mapping** — all TypeSpec scalars mapped to JSON Schema types (int8-64, uint8-64, float32/64, decimal, dateTime, duration, bytes, url, etc.)
- **$ref chain** — operations → channels → components/messages → components/schemas (fully correct)
- **Named model references** — nested `$ref` for user-defined models, enums, scalars
- **16 custom decorators** — `@channel`, `@publish`, `@subscribe`, `@server`, `@message`, `@protocol`, `@security`, `@tags`, `@correlationId`, `@bindings`, `@header`, `@reply`, `@defaultContentType`, `@operationId`, `@messageId`, `@apiVersion`
- **19 protocol bindings** — all auto-generated from `@asyncapi/specs`, with key normalization, version auto-injection, field-level validation, placement validation
- **Security schemes** — 13 valid types matching AsyncAPI 3.1 spec exactly, OAuth2 `availableScopes` normalization
- **Multi-file output** — `split-schemas` option with `$ref` rewriting
- **TypeSpec versioning integration** — `@versioned` enum → `info.version` fallback
- **TypeSpec `@service` integration** — `listServices()` → `info.title` fallback
- **TypeSpec `@doc` propagation** — to channels, operations, messages, schema properties
- **TypeSpec `@tag` (built-in)** — NOT read; only our custom `@tags` decorator is used

---

## PARTIALLY DONE (Code Exists But Incomplete)

### Schema Object (`JsonSchema` interface in `asyncapi-document.ts`)
The `JsonSchema` interface **declares** 30+ fields, but the emitter only **generates** a subset:

| Field | In Type? | Actually Generated? | Notes |
|---|---|---|---|
| `type`, `properties`, `required` | YES | YES | Core functionality |
| `description` | YES | YES | Via `@doc` |
| `items` | YES | YES | Arrays |
| `enum` | YES | YES | Enums and string unions |
| `anyOf` | YES | YES | Non-const unions |
| `additionalProperties` | YES | YES | `Record<>` types |
| `$ref` | YES | YES | Named model references |
| `format` | YES | PARTIAL | Only hardcoded scalar formats (int32, date-time, etc.). `@format` decorator ignored |
| `allOf` | YES | **NO** | Declared but never generated |
| `oneOf` | YES | **NO** | Declared but never generated |
| `nullable` | YES | **NO** | Declared but AsyncAPI 3.1 (Draft-07) doesn't use `nullable` — this is an OpenAPI 3.0 concept. Dead field. |
| `readOnly` / `writeOnly` | YES | **NO** | Could map to TypeSpec visibility but never checked |
| `deprecated` | YES | **NO** | `@deprecated` decorator exists in TypeSpec but we never call `isDeprecated()` |
| `default` | YES | **NO** | TypeSpec default values not extracted |
| `minimum` / `maximum` | YES | **NO** | `@minValue` / `@maxValue` not handled |
| `exclusiveMinimum` / `exclusiveMaximum` | YES | **NO** | `@minValueExclusive` / `@maxValueExclusive` not handled |
| `minLength` / `maxLength` | YES | **NO** | `@minLength` / `@maxLength` not handled |
| `minItems` / `maxItems` | YES | **NO** | `@minItems` / `@maxItems` not handled |
| `pattern` | YES | **NO** | `@pattern` not handled |
| `uniqueItems` | YES | **NO** | Never generated |
| `example` / `examples` | YES | **NO** | `@example` not handled |
| `discriminator` | YES | **NO** | `@discriminator` not handled |
| `xml` | YES | **NO** | Never generated |
| `externalDocs` | YES | **NO** | Never generated |
| `const` | YES | YES | String/numeric/boolean literals |
| `title` | YES | **NO** | `@summary` not handled for schema properties |

### Server Object
- `server.protocolVersion` — **declared in type, never populated** from `@server` config
- `server.tags` — **declared in type, never populated**
- `server.externalDocs` — **not in type, not generated**
- `server.title` / `server.summary` — **declared in type, never populated**

### Channel Object
- `channel.servers` — **declared in type, never populated** (no channel→server linking)
- `channel.parameters` — only auto-extracted from `{param}` in addresses; no explicit `@parameter` decorator
- `channel.externalDocs` — **not in type, not generated**

### Operation Object
- `operation.security` — **declared in type, never populated** (security only at namespace/component level)
- `operation.traits` — **declared in type, never populated**
- `operation.externalDocs` — **not in type, not generated**

### Message Object
- `message.examples` — **declared in type, never populated** (`@example` ignored)
- `message.deprecated` — **not in type, not generated** (`@deprecated` ignored)
- `message.traits` — **declared in type, never populated**
- `message.externalDocs` — **not in type, not generated**

### Tag Object
- `tag.externalDocs` — **not in type, not generated**
- `tag.description` — **generated** (from `@tags` string arrays, but only as `{ name: string }` — descriptions never set)

### Components Object
Only **4 of 18** component types are populated:
- `components.schemas` — YES
- `components.messages` — YES
- `components.securitySchemes` — YES
- `components.servers` — YES (when servers exist)

**Never populated (12):**
- `components.channels` — declared, never used
- `components.operations` — declared, never used
- `components.parameters` — declared, never used
- `components.correlationIds` — declared, never used
- `components.tags` — declared, never used
- `components.operationTraits` — not declared
- `components.messageTraits` — not declared
- `components.operationBindings` — not declared
- `components.messageBindings` — not declared
- `components.channelBindings` — not declared
- `components.serverBindings` — not declared
- `components.replies` / `components.replyAddresses` / `components.externalDocs` / `components.serverVariables` — not declared

---

## NOT STARTED

### TypeSpec Built-in Decorators (16 decorators — NONE handled)

The compiler provides `getPattern()`, `getMinValue()`, `getMaxValue()`, `getMinLength()`, `getMaxLength()`, `getMinItems()`, `getMaxItems()`, `getFormat()`, `getDeprecated()`, `getExamples()`, `getSummary()`, `getDiscriminator()`, `getEncode()`, `isErrorModel()`, `getMediaTypeHint()` — **zero of these are called anywhere in the emitter**.

| Decorator | Compiler API | JSON Schema Output | Impact |
|---|---|---|---|
| `@pattern` | `getPattern()` | `pattern` | HIGH — validation rules silently dropped |
| `@minValue` | `getMinValue()` | `minimum` | HIGH |
| `@maxValue` | `getMaxValue()` | `maximum` | HIGH |
| `@minValueExclusive` | `getMinValueExclusive()` | `exclusiveMinimum` | HIGH |
| `@maxValueExclusive` | `getMaxValueExclusive()` | `exclusiveMaximum` | HIGH |
| `@minLength` | `getMinLength()` | `minLength` | HIGH |
| `@maxLength` | `getMaxLength()` | `maxLength` | HIGH |
| `@minItems` | `getMinItems()` | `minItems` | MEDIUM |
| `@maxItems` | `getMaxItems()` | `maxItems` | MEDIUM |
| `@format` | `getFormat()` | `format` (override) | MEDIUM |
| `@deprecated` | `getDeprecated()` / `isDeprecated()` | `deprecated: true` | MEDIUM |
| `@example` | `getExamples()` | `examples` / `example` | MEDIUM |
| `@summary` | `getSummary()` | `summary` | LOW |
| `@discriminator` | `getDiscriminator()` | `discriminator` | MEDIUM (polymorphism) |
| `@encode` | `getEncode()` | Custom encoding | LOW |
| `@secret` | (no getter, stored as state) | Should flag sensitive fields | LOW |

### AsyncAPI Info Object Fields

| Field | Description | Status |
|---|---|---|
| `info.contact` | `{ name, email, url }` | **Not generated** — no decorator, no emitter option |
| `info.license` | `{ name, url }` | **Not generated** — no decorator, no emitter option |
| `info.termsOfService` | URL string | **Not generated** |
| `info.externalDocs` | `{ url, description }` | **Not generated** |
| `info.tags` | Document-level tags | **Not generated** |

### JSON Schema Draft-07 Keywords

| Keyword | Status |
|---|---|
| `not` | **Never generated** (schema negation) |
| `contains` | **Never generated** (array contains) |
| `propertyNames` | **Never generated** |
| `patternProperties` | **Never generated** |
| `multipleOf` | **Never generated** |
| `$id` | **Never generated** (schema identification) |

### Other Missing Features

- **Recursive/circular model references** — self-referencing models (`type Tree { children: Tree[] }`) may not be handled correctly (untested this session)
- **Multi-format schemas** — AsyncAPI 3.1 defines `multiFormatSchema` and `avroSchema_v1` for Avro/Protobuf payload support. Not supported.
- **`schemaFormat` on messages** — AsyncAPI 3.1 allows `schemaFormat: "application/avro+json"` etc. Not supported.
- **Reusable traits** (operation traits, message traits) — not supported
- **Reusable bindings** (operation bindings, message bindings, channel bindings, server bindings as components) — not supported
- **TypeSpec 1.14.0 upgrade** — auto decorators, `.ts` module imports, memory leak fix, entrypoint resolution fix

---

## TOTALLY FUCKED UP

### Nothing is "fucked up" per se, but:

1. **The `nullable` field in `JsonSchema` is a lie.** It's declared as `nullable?: boolean` but AsyncAPI 3.1 uses JSON Schema Draft-07, which does NOT have `nullable`. This is an OpenAPI 3.0 concept. It should be removed or the type should use `type: ["string", "null"]` instead. Dead code that misleads.

2. **The `xml` field in `JsonSchema` is dead code.** Declared but never generated. No decorator reads it. No test covers it.

3. **`readOnly` / `writeOnly` in `JsonSchema` are dead code.** Declared but never generated. These could map to TypeSpec visibility (`@visibility("read")` / `@visibility("write")`) but the emitter never checks visibility.

4. **12 of 18 `components` sub-objects are declared in the type but never populated.** This gives a false sense of completeness — the types suggest support that doesn't exist.

5. **`components.parameters` is declared but never populated** despite the emitter extracting channel path parameters. Parameters are only emitted inline on channels, never as reusable components.

---

## WHAT WE SHOULD IMPROVE

### Architecture / Design

1. **Delegate schema generation to `@typespec/json-schema`** — The official `@typespec/json-schema` package handles ALL constraint decorators (`@pattern`, `@minValue`, etc.) correctly. We could use it as a dependency and get all of this for free, instead of reimplementing a subset. This would be the single highest-leverage architectural change.

2. **Read TypeSpec built-in `@tag` (singular)** — We only read our custom `@tags` (plural, array). The built-in `@tag` is the standard. Both should work.

3. **Remove dead fields from `JsonSchema`** — `nullable`, `xml`, `readOnly`, `writeOnly`, `uniqueItems`, `discriminator` are declared but never generated. Either implement them or remove them to stop misleading readers.

4. **Add missing component types to `ComponentsObject`** — operationTraits, messageTraits, operationBindings, messageBindings, channelBindings, serverBindings, replies, replyAddresses, externalDocs, serverVariables.

5. **Consider `auto dec` migration** — TypeSpec 1.14.0's auto decorators eliminate boilerplate. Many of our 16 decorator implementations are thin wrappers around `storeX()` calls that could be `auto dec`.

### Testing

6. **No test verifies constraint decorator output** — There is no test that compiles `model Foo { @minValue(0) age: int32 }` and checks for `minimum: 0` in the output. If one existed, it would immediately expose the gap.

7. **No test verifies `@deprecated` propagation** — Same gap.

8. **No test verifies `@example` propagation** — Same gap.

### Process / Session Quality

9. **I should have empirically verified claims.** I asserted `@pattern` is ignored by reading code, but never compiled a test spec to confirm. One quick `compileAsyncAPI()` call would have been conclusive.

10. **I should have checked `@typespec/json-schema` as a potential solution** during the analysis, not just identified the problem.

11. **I should have read FEATURES.md / TODO_LIST.md FIRST** to understand what the project already claims before presenting "discoveries" that may be known gaps.

---

## Up to 50 Things We Should Get Done Next

### Tier 1: Critical Functional Gaps (Constraint Decorators)

1. **Handle `@pattern`** → `pattern` in `propertyToSchema()` / `modelDeclaration()`
2. **Handle `@minValue`** → `minimum`
3. **Handle `@maxValue`** → `maximum`
4. **Handle `@minValueExclusive`** → `exclusiveMinimum`
5. **Handle `@maxValueExclusive`** → `exclusiveMaximum`
6. **Handle `@minLength`** → `minLength`
7. **Handle `@maxLength`** → `maxLength`
8. **Handle `@minItems`** → `minItems`
9. **Handle `@maxItems`** → `maxItems`
10. **Handle `@format`** → `format` (custom override on scalar)
11. **Evaluate `@typespec/json-schema` as schema generation backend** — may eliminate items 1-10
12. **Add tests for each constraint decorator** — compile + assert output

### Tier 2: High-Value Missing Features

13. **Handle `@deprecated`** → `deprecated: true` on schema properties and messages
14. **Handle `@example`** → `examples` array on messages and schemas
15. **Handle `@discriminator`** → `discriminator` field for polymorphic unions
16. **Handle `@summary`** → `summary` on schemas, messages, operations
17. **Read built-in `@tag` (singular)** in addition to custom `@tags`
18. **Add `info.contact` support** — decorator or emitter option
19. **Add `info.license` support** — decorator or emitter option
20. **Add `info.termsOfService` support** — emitter option
21. **Add `externalDocs` support** — `@externalDocs` decorator on all applicable targets
22. **Add `@parameter` decorator** for explicit channel parameters (not just auto-extracted from `{var}`)

### Tier 3: AsyncAPI Component Coverage

23. **Populate `components.parameters`** for reusable channel parameters
24. **Add traits support** — `@trait` decorator, `components.operationTraits` / `components.messageTraits`
25. **Add reusable bindings** — `components.operationBindings`, `components.messageBindings`, etc.
26. **Populate `operation.security`** — per-operation security requirements
27. **Add `operation.traits`** reference support
28. **Add `message.traits`** reference support
29. **Add `reply.channel`** support — reply referencing a different channel
30. **Populate `server.protocolVersion`** from `@server` config
31. **Populate `server.tags`** from `@tags` on namespace

### Tier 4: Schema Quality

32. **Remove `nullable` from `JsonSchema`** — dead OpenAPI 3.0 concept in AsyncAPI 3.1
33. **Remove `xml` from `JsonSchema`** — dead field, never generated
34. **Implement or remove `readOnly`/`writeOnly`** — map to `@visibility` or delete
35. **Add `multipleOf` support** — via `@multipleOf` or custom decorator
36. **Add `patternProperties` support** — for regex-keyed object properties
37. **Add `not` schema support** — schema negation
38. **Verify recursive/circular model handling** — `type Tree { children: Tree[] }`
39. **Add `$id` to schema objects** — for schema identification
40. **Add `default` values** — TypeSpec property defaults → `default` in schema

### Tier 5: TypeSpec Ecosystem & Version

41. **Upgrade to `@typespec/compiler` 1.14.0** — auto decorators, memory leak fix, entrypoint fix
42. **Migrate simple decorators to `auto dec`** — reduces boilerplate
43. **Evaluate `@typespec/http` interop** — `@route` → channel addresses, `@parameter` extraction
44. **Add `@encode` support** — custom scalar encoding
45. **Add `@encodedName` support** — property rename in output
46. **Add `@secret` awareness** — flag sensitive fields (masking, warning)
47. **Handle `@error` models** — error response semantics

### Tier 6: Advanced / Future

48. **Multi-format schema support** — `schemaFormat: "application/avro+json"`, Avro schema embedding
49. **AsyncAPI Studio round-trip verification** — emit → import → validate → export → compare
50. **Channel→server linking** — `channel.servers` array referencing server names

---

## Questions I Cannot Answer Myself

### 1. Should we delegate schema generation to `@typespec/json-schema`?

The official `@typespec/json-schema` emitter handles all constraint decorators, `@discriminator`, `@example`, format overrides, etc. correctly. We could use it as a backend instead of maintaining our own `AsyncAPISchemaEmitter`. **The question is whether this introduces unwanted coupling, licensing concerns, or output format incompatibilities** (it targets JSON Schema 2020-12 vs our Draft-07). I cannot determine the tradeoffs without studying its output format in depth.

### 2. Is there an official AsyncAPI + TypeSpec integration effort we should align with?

I checked `@asyncapi/typespec-library` on npm (404). But AsyncAPI Initiative and Microsoft may have a planned or in-progress official TypeSpec library. **If one exists or is planned, our project's positioning (independent vs. contributory) changes fundamentally.** I cannot determine this without insider knowledge of the AsyncAPI Initiative's roadmap.

### 3. What's the target user persona — are they migrating from OpenAPI/TypeSpec HTTP, or greenfield AsyncAPI?

This determines priority ordering. If users are migrating from `@typespec/http` / OpenAPI, then `@typespec/http` interop (`@route` → channels, `@parameter` extraction, `@visibility` → `readOnly`/`writeOnly`) is critical. If greenfield, constraint decorators (`@pattern`, `@minValue`) are more critical because that's what they'll reach for first. **I cannot infer the user base composition from the codebase alone.**
