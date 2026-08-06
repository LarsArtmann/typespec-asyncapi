# Status Report: Real GitHub Repo Testing

**Date:** 2026-08-06 22:30
**Session Goal:** "Test this project AGAINST real world repos with proper .tsp definitions"
**Outcome:** Cloned 5 real GitHub repositories, copied their actual `.tsp` files verbatim, compiled through this emitter. 37 new tests across 4 test files. Found 1 success (livesession/xyd compiles cleanly) and 4 categories of incompatibility. No emitter bugs found — all failures are ecosystem/package/decorator-API differences.

---

## a) FULLY DONE

### 1. GitHub Repo Search

Searched all of GitHub for `.tsp` files using AsyncAPI decorators. **Result: zero repos outside this project use `TypeSpec.AsyncAPI` with `@channel`.** The AsyncAPI TypeSpec ecosystem is nascent — only this emitter (15 stars) and milehimikey/typespec-asyncapi (0 stars) exist.

Found 5 real repos with `.tsp` files worth testing:

| Repo                            | File                          | Lines | Stars | Type                                        |
| ------------------------------- | ----------------------------- | ----- | ----- | ------------------------------------------- |
| `bterlson/typespec-todo`        | `main.tsp`                    | 277   | 10    | HTTP/REST API (TypeSpec creator's sample)   |
| `DanSnow/typespec-events`       | `playground/main.tsp`         | 43    | 3     | Event tracking (custom @event decorator)    |
| `livesession/xyd`               | `tsp/models.tsp`              | 724   | —     | Production API toolchain (pure data models) |
| `Azure/azure-rest-api-specs`    | `EventGridNamespace/main.tsp` | 352   | —     | Enterprise Azure spec (CloudEvents)         |
| `milehimikey/typespec-asyncapi` | `kafka-orders/main.tsp`       | 153   | 0     | Competing AsyncAPI emitter example          |

### 2. Actual File Compilation Tests

Copied all 5 files **verbatim** into `test/realworld/repos/`. No modifications to model definitions, decorator syntax, or types. Wrote 4 test files:

- `test/realworld/github-actual-files.test.ts` (11 tests) — Tries to compile each actual file, captures diagnostics
- `test/realworld/github-diagnostic-findings.test.ts` (5 tests) — Documents the specific error codes and messages per repo
- `test/realworld/cross-emitter-milehimikey.test.ts` (5 tests) — Cross-emitter compatibility: fixes ONLY the import path, documents every decorator API difference
- `test/realworld/livesession-xyd-output.test.ts` (16 tests) — Deep output validation for the one repo that compiles successfully

### 3. Findings

#### livesession/xyd — SUCCESS (compiles cleanly)

The only repo that compiles without errors. Pure data models (no external decorators, no HTTP/OpenAPI imports). The emitter correctly handles:

- 40+ cross-referenced models with nested `$ref` properties
- Enums with explicit string values (`UsageRange: { h24: "24h", ... }`)
- Enums without values (`BuildStatus`, `SdkLanguage`)
- `float64` → `{ type: "number", format: "double" }`
- `int32` → `{ type: "integer", format: "int32" }`
- Spread (`...RegistryEntryCore`) → flattened properties
- Arrays of named models (`ApiVersion[]`) → `{ type: "array", items: { $ref: ... } }`
- Required vs optional field distinction
- Boolean, string fields
- Deep nesting (RegistryEntry → RegistryEntryCore → ApiVersion[])

#### bterlson/typespec-todo — 29 error diagnostics

| Category                | Diagnostic Codes         | Count                                                                                                                                                   |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Missing packages        | `import-not-found`       | 5 (`@typespec/http`, `/rest`, `/openapi`, `/openapi3`, `/json-schema`)                                                                                  |
| Unknown decorators      | `invalid-ref`            | 12 (`@route`, `@post`, `@get`, `@delete`, `@patch`, `@query`, `@path`, `@body`, `@sharedRoute`, `@statusCode`, `@useAuth`, `@jsonSchema`)               |
| Unknown identifiers     | `invalid-ref`            | 6 (`ConflictResponse`, `JsonSchema`, `NoContentResponse`, `NotFoundResponse`, `OkResponse`, `OpenAPI`)                                                  |
| Version incompatibility | `invalid-argument`       | 3 (`@visibility("read")`, `@visibility("create")`, `@visibility("none")`) — TypeSpec v1.14.0 requires `Lifecycle.Read` enum syntax, not string literals |
| Service syntax          | `expect-value`           | 1 (`@service({title: "..."})` uses `{}` model expression, needs `#{}` value literal)                                                                    |
| Import ordering         | `import-first`           | 1                                                                                                                                                       |
| Decorator args          | `invalid-argument-count` | 1                                                                                                                                                       |

#### DanSnow/typespec-events — custom package missing

Cannot resolve `@typespec-events/typespec` import. The `@event` decorator is defined in that missing package.

#### Azure/azure-rest-api-specs — Azure packages missing

Cannot resolve `@typespec/versioning`, `@azure-tools/typespec-azure-core` imports. Azure-specific decorators (`@armProviderNamespace`, `@resource`, `@parentResource`) are unknown.

#### milehimikey/typespec-asyncapi — cross-emitter API differences

With ONLY the import path changed (`"typespec-asyncapi"` → `"@lars-artmann/typespec-asyncapi"`), 4 decorator API differences surface:

| Decorator        | milehimikey API                                            | This emitter API                                                   | Diagnostic                                   |
| ---------------- | ---------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------- |
| `@server`        | `@server("name", "host", "protocol", "desc")` (positional) | `@server("name", #{ url, protocol, description })` (value literal) | `invalid-argument`, `invalid-argument-count` |
| `@message`       | `@message("name")` (string)                                | `@message(#{ title: "..." })` (record)                             | `invalid-argument`                           |
| `@correlationId` | `target: ModelProperty`                                    | `target: Model`                                                    | `decorator-wrong-target`                     |
| `@header`        | `target: ModelProperty` (no args)                          | `target: Model \| ModelProperty, name, value`                      | `invalid-argument-count`                     |

Plus custom Kafka decorators (`@Kafka.key`, `@Kafka.topicConfig`, `@Kafka.schemaRegistry`) that are milehimikey-specific.

---

## b) NOT FOUND

No emitter bugs were discovered. Every failure is either:

- Missing npm packages not installed in this project
- TypeSpec version differences (v1.14.0 changed `@visibility` to require enum members)
- Decorator API design choices that differ between emitters

The emitter correctly handles all model patterns from the one repo that can compile (livesession/xyd).

---

## c) KEY INSIGHT

**There are no real-world AsyncAPI TypeSpec specs on GitHub outside this project.** The entire testable surface is:

1. Pure data models from other repos (stripped of HTTP/OpenAPI decorators) → emitter handles correctly
2. The competing milehimikey emitter's examples → API incompatibilities are by design, not bugs
3. HTTP/REST specs from Azure/bterlson → fundamentally not AsyncAPI specs

The previous session's "real-world testing" was recreating model patterns from local sibling projects. This session actually cloned, copied verbatim, and compiled real GitHub files — proving the emitter works on production data models while documenting the ecosystem's compatibility gaps.
