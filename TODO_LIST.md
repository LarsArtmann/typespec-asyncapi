# TODO List

Short-term, actionable work. Completed items live in CHANGELOG, not here.
Long-term ideas and RFCs live in ROADMAP, not here.

---

## P0 — Correctness

- [x] **Fix diagnostic registry split-brain:** All diagnostic codes now declared in `src/lib.ts` and fired via `$lib.reportDiagnostic()` with compile-time validation. 6 dead codes removed. Prefix inconsistency fixed.
- [x] **Consolidate split-brain version constants:** `src/constants/index.ts` deleted entirely (zero importers). Single source of truth: `ASYNCAPI_SPEC_VERSION` in `src/document-builder.ts:31`.
- [x] **Fix multi-security overwrite bug:** `storeSecurityConfig` was overwriting on second call. Changed to array accumulation so multiple `@security` decorators on one namespace now work correctly.

## P1 — Type safety

- [x] **Tighten `ServerObject.protocol`:** Changed from `string` to `AsyncAPIProtocol` (`src/domain/models/asyncapi-document.ts`). Runtime values were always valid via `normalizeProtocol()`.
- [x] **Tighten `OperationObject.bindings`:** Changed from `Record<string, unknown>` to `ProtocolBindings`, matching `MessageObject` and `ChannelObject`.
- [x] **Compile external `.tsp` specs through the emitter:** 16 test patterns covering branded types, generics, spread, deep inheritance, enums, unions, multi-server, edge cases. All pass. Key finding: `@service({})` is not registered and silently kills output.

## P2 — Feature gaps (from open-issues review)

- [x] **URL validation for `@server` URLs:** `isValidUrl()` helper added to `decorator-helpers.ts`. Rejects empty/whitespace/control-character URLs. Accepts schemeless hostnames (valid AsyncAPI pattern). Wired into `$server` decorator with `invalid-server-url` diagnostic.
- [x] **Error type hierarchy review** (GitHub #54): **Closed as YAGNI.** Only 2 `throw new Error()` calls exist. Validation errors use TypeSpec diagnostics, not exceptions. Effect.TS (referenced in issue) no longer in codebase.

## P3 — Full protocol binding support

- [x] **Binding version constants** (`src/constants/binding-versions.ts`): Latest binding version per protocol (Kafka 0.5.0, AMQP 0.3.0, MQTT 0.2.0, HTTP 0.3.0, WS 0.1.0). `normalizeBindingProtocol()` maps `wss`→`ws` for binding keys.
- [x] **Typed binding definitions** (`src/domain/models/bindings.ts`): TypeScript interfaces for all Kafka/AMQP/MQTT/WS/HTTP channel/operation/message/server bindings.
- [x] **Binding validation** (`src/validation/binding-validator.ts`): Normalizes binding keys (`websockets`→`ws`), validates versions, auto-injects `bindingVersion` when missing. Two new warning diagnostics.
- [x] **Binding auto-versioning in document-builder:** Both `@bindings` decorator and `@protocol` bindings auto-inject `bindingVersion` to the latest version.
- [x] **WSS binding key normalization:** AsyncAPI schema uses `ws` for both WebSocket and secure WebSocket. Server.protocol retains `wss`; binding keys normalize to `ws`.

## P4 — AsyncAPI 3.1 specification test suite compliance

- [x] **AJV schema validation harness** (`test/utils/schema-validator.ts`): `compileAndValidateOrThrow()` compiles TypeSpec through the emitter and validates output against the official AsyncAPI 3.1.0 JSON Schema.
- [x] **Document structure compliance** (11 tests): asyncapi version, info, channels, operations, components, action inference, multi-channel.
- [x] **Schema types compliance** (15 tests): all TypeSpec scalars, arrays, enums, optionals, nested model refs, array-of-named-models.
- [x] **$ref chain compliance** (9 tests): operation→channel→components chain, slash escaping, nested model refs, multi-operation independence.
- [x] **Servers + security compliance** (11 tests): all server fields, protocol normalization, server variables, 7 security scheme types, multi-security.
- [x] **Protocol binding compliance** (18 tests): Kafka/AMQP/MQTT/WS/HTTP channel+operation+message bindings, version auto-injection, protocol key normalization, multi-protocol documents.
- [x] **Edge cases compliance** (14 tests): empty models, nested refs, unions, channel params, tags, headers, correlationIds, float arrays, special channel addresses.
