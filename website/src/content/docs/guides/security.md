---
title: Security
description: OAuth2, API keys, SASL, and the other AsyncAPI 3.1 security scheme types.
---

`@security` on a namespace declares schemes in `components.securitySchemes`; `@operationSecurity` attaches requirements to one operation as `$ref` pointers.

## Valid scheme types

The emitter matches AsyncAPI 3.1 exactly: `apiKey`, `asymmetricEncryption`, `gssapi`, `http`, `httpApiKey`, `oauth2`, `openIdConnect`, `plain`, `scramSha256`, `scramSha512`, `symmetricEncryption`, `userPassword`, `X509`.

Not valid (rejected with diagnostics): `sasl` (use the specific mechanism), `mutualTLS`, `external`, `oauthBearer`.

## OAuth2

```typespec
@security(#{
  name: "oauth2"
  scheme: #{
    type: "oauth2"
    flows: #{
      clientCredentials: #{
        tokenUrl: "https://auth.example.com/oauth/token"
        availableScopes: #{ read: "Read access", write: "Write access" }
      }
    }
  }
})
namespace SecureAPI;
```

:::note
AsyncAPI 3.1 uses `availableScopes` (a map of scope name to description), not OpenAPI's `scopes` array. The emitter accepts both input keys and always outputs `availableScopes`.
:::

## API keys

Two distinct schemes, straight from the AsyncAPI 3.1 schema:

- `apiKey` — `{ type, in }` with `in` limited to `"user"` or `"password"` (SASL-style, no `name`)
- `httpApiKey` — `{ type, name, in }`, all required, `in` limited to `"header"`, `"query"`, or `"cookie"`

## SASL mechanisms

`plain`, `scramSha256`, `scramSha512`, and `gssapi` accept `{ type, description? }` only.

## Attaching requirements to an operation

```typespec
@operationSecurity(#{ name: "oauth2" })
@channel("orders")
@publish
op placeOrder(): Order;
```

This attaches `{ $ref: "#/components/securitySchemes/oauth2" }` to the operation. The referenced scheme must also be declared with `@security`, or the ref dangles.

## Where to go next

- [Decorators](/guides/decorators/) — security decorator signatures
- [server-security example](https://github.com/LarsArtmann/typespec-asyncapi/tree/master/examples) — multi-scheme namespace security
- [Protocol Bindings](/guides/bindings/) — per-protocol binding placement
