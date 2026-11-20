# Gap Analysis: TypeSpec & AsyncAPI Feature Coverage
> **Live remainder:** none — every item resolved in the 2026-11-19/20 corpus sweep (verdicts inline; routed work lives in TODO_LIST.md / ROADMAP.md).

**Date:** 2026-08-05 18:20
**Session type:** Research / Gap analysis
**Trigger:** User asked "What are things the LATEST typespec and/or LATEST asyncapi supports that we DON'T?"

---

## What This Session Did

> **Update (later sessions same day):** This gap analysis drove the current TODO_LIST.md and ROADMAP.md. The 16 unhandled TypeSpec stdlib constraint decorators (`@pattern`, `@minValue`, etc.) are now TODO_LIST item #1 (highest impact). The dead `nullable` field is TODO_LIST item #4. Tuple of named models bug was fixed (`0226deb`). Binding protocol gap was fixed (`49b4241`).

Performed a systematic gap analysis comparing the project's current capabilities against:

~~1. **Latest TypeSpec compiler** (1.14.0 — we're on 1.13.0)~~ done — compiler since upgraded far past 1.14: `@typespec/compiler` ^1.17.0 (`package.json`)
~~2. **Latest AsyncAPI spec** (3.1.0 — we target this, but miss many fields)~~ done — ~270 compliance tests now validate against the official 3.1 schema (`test/compliance/`)
~~3. **TypeSpec built-in stdlib decorators** (16 constraint/metadata decorators — none handled)~~ done — all 16 now handled table-driven in `src/constraint-mapper.ts`

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

| Field                                   | In Type? | Actually Generated? | Notes                                                                                                     |
| --------------------------------------- | -------- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| ~~`type`, `properties`, `required`~~ done — core generation locked by `test/compliance/type-mapping-completeness.test.ts` | ~~YES~~ | ~~YES~~ | ~~Core functionality~~ |
| ~~`description`~~ done — `@doc` mapping locked by `test/compliance/doc-propagation.test.ts` | ~~YES~~ | ~~YES~~ | ~~Via `@doc`~~ |
| ~~`items`~~ done — array `items` mapping locked by `test/compliance/type-mapping-completeness.test.ts` | ~~YES~~ | ~~YES~~ | ~~Arrays~~ |
| ~~`enum`~~ done — enum/string unions locked by `test/compliance/type-mapping-completeness.test.ts` | ~~YES~~ | ~~YES~~ | ~~Enums and string unions~~ |
| ~~`anyOf`~~ done — mixed unions still `anyOf`; model unions `oneOf` (`src/schema-fragments.ts`) | ~~YES~~ | ~~YES~~ | ~~Non-const unions~~ |
| ~~`additionalProperties`~~ done — `Record<>` inline mapping in `src/intrinsic-mapping.ts` | ~~YES~~ | ~~YES~~ | ~~`Record<>` types~~ |
| ~~`$ref`~~ done — `$ref` chain locked by `test/compliance/ref-chain.test.ts` | ~~YES~~ | ~~YES~~ | ~~Named model references~~ |
| ~~`format`~~ done — `@format` override now honored per `test/compliance/constraint-decorators.test.ts` | ~~YES~~ | ~~PARTIAL~~ | ~~Only hardcoded scalar formats (int32, date-time, etc.). `@format` decorator ignored~~ |
| ~~`allOf`~~ done — model inheritance emits `allOf` per `test/compliance/model-composition.test.ts` | ~~YES~~ | ~~**NO**~~ | ~~Declared but never generated~~ |
| ~~`oneOf`~~ done — model unions emit `oneOf` per `test/compliance/polymorphism.test.ts` | ~~YES~~ | ~~**NO**~~ | ~~Declared but never generated~~ |
| ~~`nullable`~~ done — field removed from `JsonSchema` in `src/domain/models/asyncapi-document.ts` | ~~YES~~ | ~~**NO**~~ | ~~Declared but AsyncAPI 3.1 (Draft-07) doesn't use `nullable` — this is an OpenAPI 3.0 concept. Dead field.~~ |
| ~~`readOnly` / `writeOnly`~~ done — implemented from `@visibility` in `src/constraint-mapper.ts`; locked by `test/compliance/constraint-decorators.test.ts` | ~~YES~~ | ~~**NO**~~ | ~~Could map to TypeSpec visibility but never checked~~ |
| ~~`deprecated`~~ done — `isDeprecated()` applied in `src/constraint-mapper.ts` | ~~YES~~ | ~~**NO**~~ | ~~`@deprecated` decorator exists in TypeSpec but we never call `isDeprecated()`~~ |
| ~~`default`~~ done — `=` defaults map to `default` in `src/constraint-mapper.ts` | ~~YES~~ | ~~**NO**~~ | ~~TypeSpec default values not extracted~~ |
| ~~`minimum` / `maximum`~~ done — locked by `test/compliance/constraint-decorators.test.ts` numeric constraints | ~~YES~~ | ~~**NO**~~ | ~~`@minValue` / `@maxValue` not handled~~ |
| ~~`exclusiveMinimum` / `exclusiveMaximum`~~ done — locked by `test/compliance/constraint-decorators.test.ts` exclusive constraints | ~~YES~~ | ~~**NO**~~ | ~~`@minValueExclusive` / `@maxValueExclusive` not handled~~ |
| ~~`minLength` / `maxLength`~~ done — locked by `test/compliance/constraint-decorators.test.ts` string constraints | ~~YES~~ | ~~**NO**~~ | ~~`@minLength` / `@maxLength` not handled~~ |
| ~~`minItems` / `maxItems`~~ done — locked by `test/compliance/constraint-decorators.test.ts` array constraints | ~~YES~~ | ~~**NO**~~ | ~~`@minItems` / `@maxItems` not handled~~ |
| ~~`pattern`~~ done — locked by `test/compliance/constraint-decorators.test.ts` `@pattern` → `pattern` | ~~YES~~ | ~~**NO**~~ | ~~`@pattern` not handled~~ |
| ~~`uniqueItems`~~ **Won't implement — never given a dedicated mapping; settable case-by-case via `@jsonSchemaExtension` (`src/extension-decorators.ts`).** | ~~YES~~ | ~~**NO**~~ | ~~Never generated~~ |
| ~~`example` / `examples`~~ done — `@example` mapping locked by `test/compliance/constraint-decorators.test.ts` | ~~YES~~ | ~~**NO**~~ | ~~`@example` not handled~~ |
| ~~`discriminator`~~ done — `@discriminator` mapping locked by `test/compliance/polymorphism.test.ts` | ~~YES~~ | ~~**NO**~~ | ~~`@discriminator` not handled~~ |
| ~~`xml`~~ done — field removed from `JsonSchema` in `src/domain/models/asyncapi-document.ts` | ~~YES~~ | ~~**NO**~~ | ~~Never generated~~ |
| ~~`externalDocs`~~ **Won't implement — no schema-level generator; `info.externalDocs` option and rich tag " `externalDocs` " cover the shipped needs (`src/document-builder.ts`).** | ~~YES~~ | ~~**NO**~~ | ~~Never generated~~ |
| ~~`const`~~ done — const values locked by `test/compliance/polymorphism.test.ts` | ~~YES~~ | ~~YES~~ | ~~String/numeric/boolean literals~~ |
| ~~`title`~~ done — `@summary` maps to `title` in `src/constraint-mapper.ts` | ~~YES~~ | ~~**NO**~~ | ~~`@summary` not handled for schema properties~~ |

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

| Decorator            | Compiler API                         | JSON Schema Output           | Impact                                   |
| -------------------- | ------------------------------------ | ---------------------------- | ---------------------------------------- |
| ~~`@pattern`~~ done — `@pattern` handled in `src/constraint-mapper.ts` | ~~`getPattern()`~~ | ~~`pattern`~~ | ~~HIGH — validation rules silently dropped~~ |
| ~~`@minValue`~~ done — `@minValue` handled in `src/constraint-mapper.ts` | ~~`getMinValue()`~~ | ~~`minimum`~~ | ~~HIGH~~ |
| ~~`@maxValue`~~ done — `@maxValue` handled in `src/constraint-mapper.ts` | ~~`getMaxValue()`~~ | ~~`maximum`~~ | ~~HIGH~~ |
| ~~`@minValueExclusive`~~ done — `@minValueExclusive` handled in `src/constraint-mapper.ts` | ~~`getMinValueExclusive()`~~ | ~~`exclusiveMinimum`~~ | ~~HIGH~~ |
| ~~`@maxValueExclusive`~~ done — `@maxValueExclusive` handled in `src/constraint-mapper.ts` | ~~`getMaxValueExclusive()`~~ | ~~`exclusiveMaximum`~~ | ~~HIGH~~ |
| ~~`@minLength`~~ done — `@minLength` handled in `src/constraint-mapper.ts` | ~~`getMinLength()`~~ | ~~`minLength`~~ | ~~HIGH~~ |
| ~~`@maxLength`~~ done — `@maxLength` handled in `src/constraint-mapper.ts` | ~~`getMaxLength()`~~ | ~~`maxLength`~~ | ~~HIGH~~ |
| ~~`@minItems`~~ done — `@minItems` handled in `src/constraint-mapper.ts` | ~~`getMinItems()`~~ | ~~`minItems`~~ | ~~MEDIUM~~ |
| ~~`@maxItems`~~ done — `@maxItems` handled in `src/constraint-mapper.ts` | ~~`getMaxItems()`~~ | ~~`maxItems`~~ | ~~MEDIUM~~ |
| ~~`@format`~~ done — `@format` override honored in `src/constraint-mapper.ts` | ~~`getFormat()`~~ | ~~`format` (override)~~ | ~~MEDIUM~~ |
| ~~`@deprecated`~~ done — `#deprecated` → `deprecated` via `isDeprecated()` in `src/constraint-mapper.ts` | ~~`getDeprecated()` / `isDeprecated()`~~ | ~~`deprecated: true`~~ | ~~MEDIUM~~ |
| ~~`@example`~~ done — `getExamples()` mapped to `examples` in `src/constraint-mapper.ts` | ~~`getExamples()`~~ | ~~`examples` / `example`~~ | ~~MEDIUM~~ |
| ~~`@summary`~~ done — mapped, but to `title` keyword (`src/constraint-mapper.ts`) | ~~`getSummary()`~~ | ~~`summary`~~ | ~~LOW~~ |
| ~~`@discriminator`~~ done — `@discriminator` handled in `src/builders/operation-discovery.ts` and `src/schema-fragments.ts` | ~~`getDiscriminator()`~~ | ~~`discriminator`~~ | ~~MEDIUM (polymorphism)~~ |
| ~~`@encode`~~ done — `@encode` consumed via `getEncode()` for example/default serialization (`src/constraint-mapper.ts`) | ~~`getEncode()`~~ | ~~Custom encoding~~ | ~~LOW~~ |
| ~~`@secret`~~ **Won't implement — never implemented; no `@secret` handling exists in `src/` and no living doc tracks it.** | ~~(no getter, stored as state)~~ | ~~Should flag sensitive fields~~ | ~~LOW~~ |

### AsyncAPI Info Object Fields

| Field                 | Description            | Status                                              |
| --------------------- | ---------------------- | --------------------------------------------------- |
| ~~`info.contact`~~ done — supported via emitter options (`src/document-builder.ts`) | ~~`{ name, email, url }`~~ | ~~**Not generated** — no decorator, no emitter option~~ |
| ~~`info.license`~~ done — supported via emitter options (`src/document-builder.ts`) | ~~`{ name, url }`~~ | ~~**Not generated** — no decorator, no emitter option~~ |
| ~~`info.termsOfService`~~ done — supported via emitter options (`src/document-builder.ts`) | ~~URL string~~ | ~~**Not generated**~~ |
| ~~`info.externalDocs`~~ done — supported via emitter options (`src/document-builder.ts`) | ~~`{ url, description }`~~ | ~~**Not generated**~~ |
| ~~`info.tags`~~ done — `info.tags` populated from `@tags` state (`src/document-builder.ts`) | ~~Document-level tags~~ | ~~**Not generated**~~ |

### JSON Schema Draft-07 Keywords

| Keyword             | Status                                      |
| ------------------- | ------------------------------------------- |
| ~~`not`~~ **Won't implement — no negation generator; `not` only declared in `JsonSchema`; `@jsonSchemaExtension` is the escape hatch.** | ~~**Never generated** (schema negation)~~ |
| ~~`contains`~~ **Won't implement — no array-contains generator; `@jsonSchemaExtension` is the escape hatch.** | ~~**Never generated** (array contains)~~ |
| ~~`propertyNames`~~ **Won't implement — no generator; `@jsonSchemaExtension` is the escape hatch.** | ~~**Never generated**~~ |
| ~~`patternProperties`~~ **Won't implement — no regex-keyed property generator; `@jsonSchemaExtension` is the escape hatch.** | ~~**Never generated**~~ |
| ~~`multipleOf`~~ **Won't implement — no dedicated mapping; settable via `@jsonSchemaExtension` (`src/extension-decorators.ts`).** | ~~**Never generated**~~ |
| ~~`$id`~~ **Won't implement — no schema `$id` generator; the `asyncapi-id` option covers the root document `id` only.** | ~~**Never generated** (schema identification)~~ |

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

~~1. **The `nullable` field in `JsonSchema` is a lie.** It's declared as `nullable?: boolean` but AsyncAPI 3.1 uses JSON Schema Draft-07, which does NOT have `nullable`. This is an OpenAPI 3.0 concept. It should be removed or the type should use `type: ["string", "null"]` instead. Dead code that misleads.~~ done — removed from `JsonSchema` (`src/domain/models/asyncapi-document.ts`)

~~2. **The `xml` field in `JsonSchema` is dead code.** Declared but never generated. No decorator reads it. No test covers it.~~ done — removed from `JsonSchema` (`src/domain/models/asyncapi-document.ts`)

~~3. **`readOnly` / `writeOnly` in `JsonSchema` are dead code.** Declared but never generated. These could map to TypeSpec visibility (`@visibility("read")` / `@visibility("write")`) but the emitter never checks visibility.~~ done — implemented from `@visibility` visibility classes (`src/constraint-mapper.ts`)

~~4. **12 of 18 `components` sub-objects are declared in the type but never populated.** This gives a false sense of completeness — the types suggest support that doesn't exist.~~ done — traits, bindings, parameters, correlationIds, and tags now populated (`src/use-decorators.ts`, `src/builders/components-builder.ts`)

~~5. **`components.parameters` is declared but never populated** despite the emitter extracting channel path parameters. Parameters are only emitted inline on channels, never as reusable components.~~ done — `@parameter` populates `components.parameters` (`src/use-decorators.ts`)

---

## WHAT WE SHOULD IMPROVE

### Architecture / Design

~~1. **Delegate schema generation to `@typespec/json-schema`** — The official `@typespec/json-schema` package handles ALL constraint decorators (`@pattern`, `@minValue`, etc.) correctly. We could use it as a dependency and get all of this for free, instead of reimplementing a subset. This would be the single highest-leverage architectural change.~~ **Won't implement — evaluated and rejected: constraints implemented natively in `src/constraint-mapper.ts`; the in-house emitter is retained per ROADMAP §EFv1.**

~~2. **Read TypeSpec built-in `@tag` (singular)** — We only read our custom `@tags` (plural, array). The built-in `@tag` is the standard. Both should work.~~ **Won't implement — never adopted; custom `@tags` accepts strings and rich tag objects (FEATURES.md §Decorator System).**

~~3. **Remove dead fields from `JsonSchema`** — `nullable`, `xml`, `readOnly`, `writeOnly`, `uniqueItems`, `discriminator` are declared but never generated. Either implement them or remove them to stop misleading readers.~~ done — largely resolved: `nullable`/`xml` removed, `readOnly`/`writeOnly`/`discriminator` implemented; only `uniqueItems` stays declared-only

~~4. **Add missing component types to `ComponentsObject`** — operationTraits, messageTraits, operationBindings, messageBindings, channelBindings, serverBindings, replies, replyAddresses, externalDocs, serverVariables.~~ done — ComponentsObject now declares traits, bindings, parameters, correlationIds, and tags (`src/domain/models/asyncapi-document.ts`)

~~5. **Consider `auto dec` migration** — TypeSpec 1.14.0's auto decorators eliminate boilerplate. Many of our 16 decorator implementations are thin wrappers around `storeX()` calls that could be `auto dec`.~~ **Won't implement — never migrated; all 30 decorators remain JS-backed `extern dec` for compile-time validation (`lib/main.tsp`).**

### Testing

~~6. **No test verifies constraint decorator output** — There is no test that compiles `model Foo { @minValue(0) age: int32 }` and checks for `minimum: 0` in the output. If one existed, it would immediately expose the gap.~~ done — `test/compliance/constraint-decorators.test.ts` compiles specs and asserts output

~~7. **No test verifies `@deprecated` propagation** — Same gap.~~ done — `#deprecated` propagation locked by `test/compliance/constraint-decorators.test.ts`

~~8. **No test verifies `@example` propagation** — Same gap.~~ done — `@example` propagation locked by `test/compliance/constraint-decorators.test.ts`

### Process / Session Quality

~~9. **I should have empirically verified claims.** I asserted `@pattern` is ignored by reading code, but never compiled a test spec to confirm. One quick `compileAsyncAPI()` call would have been conclusive.~~ **NOT-DO — process note; compile-based empirical verification now exists (`test/compliance/constraint-decorators.test.ts`).**

~~10. **I should have checked `@typespec/json-schema` as a potential solution** during the analysis, not just identified the problem.~~ **NOT-DO — process note; the evaluation happened later — in-house emitter retained (ROADMAP §EFv1).**

~~11. **I should have read FEATURES.md / TODO_LIST.md FIRST** to understand what the project already claims before presenting "discoveries" that may be known gaps.~~ **NOT-DO — process note; TODO_LIST.md preamble records the 2026-08-21 and 2026-09-13 re-verification passes.**

---

## Up to 50 Things We Should Get Done Next

### Tier 1: Critical Functional Gaps (Constraint Decorators)

~~1. **Handle `@pattern`** → `pattern` in `propertyToSchema()` / `modelDeclaration()`~~ done — `@pattern` locks in `test/compliance/constraint-decorators.test.ts`
~~2. **Handle `@minValue`** → `minimum`~~ done — minimum locks in `test/compliance/constraint-decorators.test.ts`
~~3. **Handle `@maxValue`** → `maximum`~~ done — maximum locks in `test/compliance/constraint-decorators.test.ts`
~~4. **Handle `@minValueExclusive`** → `exclusiveMinimum`~~ done — exclusiveMinimum locks in `test/compliance/constraint-decorators.test.ts`
~~5. **Handle `@maxValueExclusive`** → `exclusiveMaximum`~~ done — exclusiveMaximum locks in `test/compliance/constraint-decorators.test.ts`
~~6. **Handle `@minLength`** → `minLength`~~ done — minLength locks in `test/compliance/constraint-decorators.test.ts`
~~7. **Handle `@maxLength`** → `maxLength`~~ done — maxLength locks in `test/compliance/constraint-decorators.test.ts`
~~8. **Handle `@minItems`** → `minItems`~~ done — minItems locks in `test/compliance/constraint-decorators.test.ts`
~~9. **Handle `@maxItems`** → `maxItems`~~ done — maxItems locks in `test/compliance/constraint-decorators.test.ts`
~~10. **Handle `@format`** → `format` (custom override on scalar)~~ done — format override locks in `test/compliance/constraint-decorators.test.ts`
~~11. **Evaluate `@typespec/json-schema` as schema generation backend** — may eliminate items 1-10~~ **Won't implement — evaluation outcome: rejected; constraints were implemented natively instead (`src/constraint-mapper.ts`, ROADMAP §EFv1).**
~~12. **Add tests for each constraint decorator** — compile + assert output~~ done — per-decorator tests: `test/compliance/constraint-decorators.test.ts` (~40 AJV-validated tests)

### Tier 2: High-Value Missing Features

~~13. **Handle `@deprecated`** → `deprecated: true` on schema properties and messages~~ done — `#deprecated` directive sets `deprecated` (`src/constraint-mapper.ts`)
~~14. **Handle `@example`** → `examples` array on messages and schemas~~ done — examples on schemas (`src/constraint-mapper.ts`) and message-level examples (`src/builders/message-builder.ts`)
~~15. **Handle `@discriminator`** → `discriminator` field for polymorphic unions~~ done — discriminator emitted with auto-required enforcement (`src/schema-fragments.ts`, `test/compliance/polymorphism.test.ts`)
~~16. **Handle `@summary`** → `summary` on schemas, messages, operations~~ done — maps to title on schemas (`src/constraint-mapper.ts`) and summary on operations (`src/builders/operation-builder.ts`)
~~17. **Read built-in `@tag` (singular)** in addition to custom `@tags`~~ done — never adopted; `@tags` accepts strings and rich tag objects (FEATURES.md §Decorator System)
~~18. **Add `info.contact` support** — decorator or emitter option~~ done — `info.contact` emitter option (`src/document-builder.ts`, `test/compliance/info-object.test.ts`)
~~19. **Add `info.license` support** — decorator or emitter option~~ done — `info.license` emitter option (`src/document-builder.ts`, `test/compliance/info-object.test.ts`)
~~20. **Add `info.termsOfService` support** — emitter option~~ done — `info.termsOfService` emitter option (`src/document-builder.ts`, `test/compliance/info-object.test.ts`)
~~21. **Add `externalDocs` support** — `@externalDocs` decorator on all applicable targets~~ done — `info.externalDocs` option plus rich tag externalDocs objects (`src/document-builder.ts`, `test/compliance/info-object.test.ts`)
~~22. **Add `@parameter` decorator** for explicit channel parameters (not just auto-extracted from `{var}`)~~ done — `@parameter` decorator for reusable channel parameters (`src/use-decorators.ts`)

### Tier 3: AsyncAPI Component Coverage

~~23. **Populate `components.parameters`** for reusable channel parameters~~ done — `components.parameters` populated by `@parameter` (`src/use-decorators.ts`)
~~24. **Add traits support** — `@trait` decorator, `components.operationTraits` / `components.messageTraits`~~ done — `@operationTrait` / `@messageTrait` define named traits (`src/use-decorators.ts`)
~~25. **Add reusable bindings** — `components.operationBindings`, `components.messageBindings`, etc.~~ done — `@reusableBinding` defines reusable bindings (`src/use-decorators.ts`)
~~26. **Populate `operation.security`** — per-operation security requirements~~ done — `@operationSecurity` emits operation-level security refs (`src/decorators.ts`)
~~27. **Add `operation.traits`** reference support~~ done — `@useOperationTrait` refs traits from operations (`src/use-decorators.ts`)
~~28. **Add `message.traits`** reference support~~ done — `@useMessageTrait` refs traits from models (`src/use-decorators.ts`)
~~29. **Add `reply.channel`** support — reply referencing a different channel~~ **Won't implement — never built; `@reply` emits address and messages on the operation's own channel (`src/builders/operation-builder.ts`).**
~~30. **Populate `server.protocolVersion`** from `@server` config~~ done — `protocolVersion` from `@server` config (`src/builders/server-builder.ts`, `test/integration/asyncapi-3.1-features.test.ts`)
~~31. **Populate `server.tags`** from `@tags` on namespace~~ done — namespace tags propagate to `server.tags` (`src/builders/server-builder.ts`)

### Tier 4: Schema Quality

~~32. **Remove `nullable` from `JsonSchema`** — dead OpenAPI 3.0 concept in AsyncAPI 3.1~~ done — `nullable` removed from `JsonSchema` (`src/domain/models/asyncapi-document.ts`)
~~33. **Remove `xml` from `JsonSchema`** — dead field, never generated~~ done — `xml` removed from `JsonSchema` (`src/domain/models/asyncapi-document.ts`)
~~34. **Implement or remove `readOnly`/`writeOnly`** — map to `@visibility` or delete~~ done — implemented from `@visibility` classes (`src/constraint-mapper.ts`, `test/compliance/constraint-decorators.test.ts`)
~~35. **Add `multipleOf` support** — via `@multipleOf` or custom decorator~~ **Won't implement — no dedicated mapping; settable via `@jsonSchemaExtension` (`src/extension-decorators.ts`).**
~~36. **Add `patternProperties` support** — for regex-keyed object properties~~ **Won't implement — no regex-keyed property generator; `@jsonSchemaExtension` is the escape hatch.**
~~37. **Add `not` schema support** — schema negation~~ **Won't implement — `not` only declared in `JsonSchema`; no negation generator exists.**
~~38. **Verify recursive/circular model handling** — `type Tree { children: Tree[] }`~~ done — recursion/self-`$ref` exercised by `test/e2e/complex-nested-schemas.test.ts` and `test/unit/shared-schema-types.test.ts` circular-entity tests
~~39. **Add `$id` to schema objects** — for schema identification~~ **Won't implement — no schema `$id` generator; the `asyncapi-id` option covers the root `id` only.**
~~40. **Add `default` values** — TypeSpec property defaults → `default` in schema~~ done — `=` defaults map to `default` (`src/constraint-mapper.ts`)

### Tier 5: TypeSpec Ecosystem & Version

~~41. **Upgrade to `@typespec/compiler` 1.14.0** — auto decorators, memory leak fix, entrypoint fix~~ done — `@typespec/compiler` now ^1.17.0 (`package.json`)
~~42. **Migrate simple decorators to `auto dec`** — reduces boilerplate~~ **Won't implement — never migrated; all 30 decorators stay JS-backed `extern dec` for compile-time validation (`lib/main.tsp`).**
~~43. **Evaluate `@typespec/http` interop** — `@route` → channel addresses, `@parameter` extraction~~ done — mixed programs get route-table ownership (`src/builders/http-route-facts.ts`, `test/integration/mixed-http-emitters.test.ts`)
~~44. **Add `@encode` support** — custom scalar encoding~~ done — `@encode` consumed for example/default serialization (`src/constraint-mapper.ts`)
~~45. **Add `@encodedName` support** — property rename in output~~ done — `@encodedName` drives wire keys (`src/schema-emitter.ts`, `test/compliance/encoded-names.test.ts`)
~~46. **Add `@secret` awareness** — flag sensitive fields (masking, warning)~~ **Won't implement — never implemented; no `@secret` handling exists in `src/` and nothing tracks it.**
~~47. **Handle `@error` models** — error response semantics~~ **Won't implement — never implemented; `@error` models have no AsyncAPI error-response mapping.**

### Tier 6: Advanced / Future

48. **Multi-format schema support** — `schemaFormat: "application/avro+json"`, Avro schema embedding **→ ROADMAP §Spec Compliance Depth — multi-format schemas raw idea**
~~49. **AsyncAPI Studio round-trip verification** — emit → import → validate → export → compare~~ done — in substance — `test/validation/studio-compatibility.test.ts` parses emitted output via `@asyncapi/parser`
~~50. **Channel→server linking** — `channel.servers` array referencing server names~~ done — `@useChannelServer` binds channels to named servers (`src/use-decorators.ts`)

---

## Questions I Cannot Answer Myself

### 1. Should we delegate schema generation to `@typespec/json-schema`?

The official `@typespec/json-schema` emitter handles all constraint decorators, `@discriminator`, `@example`, format overrides, etc. correctly. We could use it as a backend instead of maintaining our own `AsyncAPISchemaEmitter`. **The question is whether this introduces unwanted coupling, licensing concerns, or output format incompatibilities** (it targets JSON Schema 2020-12 vs our Draft-07). I cannot determine the tradeoffs without studying its output format in depth.

### 2. Is there an official AsyncAPI + TypeSpec integration effort we should align with?

I checked `@asyncapi/typespec-library` on pnpm (404). But AsyncAPI Initiative and Microsoft may have a planned or in-progress official TypeSpec library. **If one exists or is planned, our project's positioning (independent vs. contributory) changes fundamentally.** I cannot determine this without insider knowledge of the AsyncAPI Initiative's roadmap.

### 3. What's the target user persona — are they migrating from OpenAPI/TypeSpec HTTP, or greenfield AsyncAPI?

This determines priority ordering. If users are migrating from `@typespec/http` / OpenAPI, then `@typespec/http` interop (`@route` → channels, `@parameter` extraction, `@visibility` → `readOnly`/`writeOnly`) is critical. If greenfield, constraint decorators (`@pattern`, `@minValue`) are more critical because that's what they'll reach for first. **I cannot infer the user base composition from the codebase alone.**
