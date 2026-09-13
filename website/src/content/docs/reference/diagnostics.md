---
title: Diagnostics
description: The 32 compile-time diagnostics (20 errors, 12 warnings) that catch invalid configuration before output.
---

All diagnostics are prefixed `@lars-artmann/typespec-asyncapi/` in compiler output. They fire at compile time — invalid configurations never reach the emitted document.

## Errors (20)

Compilation fails; no (or partial) output.

| Code                            | Meaning                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| `invalid-bindings-config`       | `@bindings` used without a configuration object                    |
| `invalid-correlationId-config`  | `@correlationId` missing its location path                         |
| `invalid-header-config`         | Invalid `@header` configuration                                    |
| `invalid-message-config`        | Invalid `@message` configuration                                   |
| `invalid-protocol-config`       | Invalid `@protocol` configuration                                  |
| `invalid-security-config`       | Invalid `@security` configuration                                  |
| `invalid-security-scheme-type`  | Scheme type not in the AsyncAPI 3.1 set (e.g. `sasl`, `mutualTLS`) |
| `invalid-server-config`         | Invalid `@server` configuration                                    |
| `invalid-server-url`            | Malformed server URL                                               |
| `invalid-tags-config`           | Tags without a `name`, or empty tag names                          |
| `missing-channel-path`          | Operation missing a `@channel` address                             |
| `server-protocol-required`      | Server config without a protocol                                   |
| `server-target-invalid`         | `@useChannelServer` references an unknown server                   |
| `server-url-required`           | Server config without a URL                                        |
| `unsupported-protocol`          | Protocol not among the 22 supported                                |
| `invalid-operation-id`          | Invalid `@operationId` value                                       |
| `invalid-message-id`            | Invalid `@messageId` value                                         |
| `invalid-trait-config`          | Invalid `@operationTrait` / `@messageTrait` configuration          |
| `invalid-parameter-config`      | Invalid `@parameter` configuration                                 |
| `invalid-channel-server-config` | Invalid `@useChannelServer` usage                                  |

## Warnings (12)

Compilation succeeds; the flagged issue is skipped or normalized in output.

| Code                                | Meaning                                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `invalid-binding-version`           | Binding version not valid for the protocol (valid versions listed)                       |
| `misplaced-binding`                 | Binding placed where the protocol defines none (e.g. Kafka channel binding on a message) |
| `schema-generation-failed`          | A schema could not be generated                                                          |
| `duplicate-schema-name`             | Model name collides with a generic instantiation name (last wins)                        |
| `invalid-json-schema-extension-key` | `@jsonSchemaExtension` key failed validation                                             |
| `invalid-extension-key`             | `@extension` key does not start with `x-`                                                |
| `unknown-binding-protocol`          | Binding for a protocol with no generated binding spec                                    |
| `invalid-binding-field`             | Binding field value failed spec-derived validation                                       |
| `invalid-parameter-location`        | `@parameter` location is not a `$message.` JSON pointer                                  |
| `invalid-default-content-type`      | Invalid `@defaultContentType` value                                                      |
| `conflicting-default-content-type`  | Multiple namespaces declare different default content types                              |
| `conflicting-api-version`           | Multiple namespaces declare different API versions                                       |

:::tip
In test assertions, diagnostic codes are library-prefixed: match with `d.code?.endsWith("<code>")` or the full `"@lars-artmann/typespec-asyncapi/<code>"` string.
:::

## Where to go next

- [Protocol Bindings](/guides/bindings/) — binding validation rules
- [Security](/guides/security/) — valid scheme types
- [Contributing](/contributing/) — how diagnostics are declared
