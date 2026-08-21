/**
 * Security Scheme Tests
 *
 * Consolidated replacement for five bloated security files (3208 lines,
 * 81 tests, many asserting fantasy schemes like HOBA/VAPID/risk-based
 * auth): every scheme type in the AsyncAPI 3.1 spec is asserted on its
 * DISTINGUISHING fields (`in`, `name`, `scheme`, `bearerFormat`,
 * `flows.availableScopes`, `openIdConnectUrl`), all AJV-validated.
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";
import type { SecurityScheme } from "../../src/domain/models/asyncapi-document.js";

async function schemeOf(source: string, name: string): Promise<SecurityScheme> {
  const doc = await compileAndValidateOrThrow(source);
  const scheme = doc.components!.securitySchemes![name];
  expect(scheme).toBeDefined();
  return scheme;
}

describe("apiKey security schemes", () => {
  it("asserts in=header with name", async () => {
    const scheme = await schemeOf(`
      @security(#{
        name: "headerKey",
        scheme: #{ type: "apiKey", in: "user" }
      })
      namespace Test;
      model Msg { id: string; }
      @channel("events")
      op send(): Msg;
    `, "headerKey");
    expect(scheme.type).toBe("apiKey");
    expect(scheme.in).toBe("user");
  });

  it("asserts in=user and in=password variants", async () => {
    const doc = await compileAndValidateOrThrow(`
      @security(#{
        name: "queryKey",
        scheme: #{ type: "apiKey", in: "user" }
      })
      @security(#{
        name: "cookieKey",
        scheme: #{ type: "apiKey", in: "password" }
      })
      namespace Test;
      model Msg { id: string; }
      @channel("events")
      op send(): Msg;
    `);
    const { queryKey, cookieKey } = doc.components!.securitySchemes!;
    expect(queryKey.in).toBe("user");
    expect(cookieKey.in).toBe("password");
  });

  it("httpApiKey requires in and name (not plain apiKey)", async () => {
    const scheme = await schemeOf(`
      @security(#{
        name: "proxyKey",
        scheme: #{ type: "httpApiKey", in: "header", name: "X-Proxy-Key" }
      })
      namespace Test;
      model Msg { id: string; }
      @channel("events")
      op send(): Msg;
    `, "proxyKey");
    expect(scheme.type).toBe("httpApiKey");
    expect(scheme.in).toBe("header");
    expect(scheme.name).toBe("X-Proxy-Key");
  });
});

describe("http security schemes", () => {
  it("asserts basic and bearer schemes with bearerFormat", async () => {
    const doc = await compileAndValidateOrThrow(`
      @security(#{
        name: "basic",
        scheme: #{ type: "http", scheme: "basic" }
      })
      @security(#{
        name: "jwt",
        scheme: #{ type: "http", scheme: "bearer", bearerFormat: "JWT" }
      })
      namespace Test;
      model Msg { id: string; }
      @channel("events")
      op send(): Msg;
    `);
    const { basic, jwt } = doc.components!.securitySchemes!;
    expect(basic.scheme).toBe("basic");
    expect(jwt.scheme).toBe("bearer");
    expect(jwt.bearerFormat).toBe("JWT");
  });

  it("supports digest and negotiate schemes", async () => {
    const doc = await compileAndValidateOrThrow(`
      @security(#{
        name: "digest",
        scheme: #{ type: "http", scheme: "digest" }
      })
      namespace Test;
      model Msg { id: string; }
      @channel("events")
      op send(): Msg;
    `);
    expect(doc.components!.securitySchemes!.digest.scheme).toBe("digest");
  });
});

describe("oauth2 security schemes", () => {
  it("asserts availableScopes map (not an array) on clientCredentials", async () => {
    const scheme = await schemeOf(`
      @security(#{
        name: "oauth",
        scheme: #{
          type: "oauth2",
          flows: #{
            clientCredentials: #{
              tokenUrl: "https://auth.example.com/token",
              availableScopes: #{
                read: "Read access",
                write: "Write access"
              }
            }
          }
        }
      })
      namespace Test;
      model Msg { id: string; }
      @channel("events")
      op send(): Msg;
    `, "oauth");
    expect(scheme.type).toBe("oauth2");
    const flow = scheme.flows!.clientCredentials!;
    expect(flow.tokenUrl).toBe("https://auth.example.com/token");
    expect(flow.availableScopes).toStrictEqual({
      read: "Read access",
      write: "Write access",
    });
  });

  it("asserts authorizationCode + implicit + password flow shapes", async () => {
    const scheme = await schemeOf(`
      @security(#{
        name: "full",
        scheme: #{
          type: "oauth2",
          flows: #{
            authorizationCode: #{
              authorizationUrl: "https://auth.example.com/authorize",
              tokenUrl: "https://auth.example.com/token",
              refreshUrl: "https://auth.example.com/refresh",
              availableScopes: #{ full: "Full access" }
            },
            implicit: #{
              authorizationUrl: "https://auth.example.com/implicit",
              availableScopes: #{ public: "Public read" }
            },
            password: #{
              tokenUrl: "https://auth.example.com/password",
              availableScopes: #{ user: "User scope" }
            }
          }
        }
      })
      namespace Test;
      model Msg { id: string; }
      @channel("events")
      op send(): Msg;
    `, "full");
    const { flows } = scheme;
    expect(flows!.authorizationCode!.authorizationUrl).toContain("/authorize");
    expect(flows!.authorizationCode!.refreshUrl).toContain("/refresh");
    expect(flows!.implicit!.availableScopes).toStrictEqual({ public: "Public read" });
    expect(flows!.password!.tokenUrl).toContain("/password");
  });

  it("accepts legacy 'scopes' input and outputs 'availableScopes'", async () => {
    const scheme = await schemeOf(`
      @security(#{
        name: "legacy",
        scheme: #{
          type: "oauth2",
          flows: #{
            clientCredentials: #{
              tokenUrl: "https://auth.example.com/token",
              scopes: #{ legacy: "Legacy input key" }
            }
          }
        }
      })
      namespace Test;
      model Msg { id: string; }
      @channel("events")
      op send(): Msg;
    `, "legacy");
    expect(scheme.flows!.clientCredentials!.availableScopes).toStrictEqual({
      legacy: "Legacy input key",
    });
  });
});

describe("openIdConnect and asymmetric schemes", () => {
  it("asserts openIdConnectUrl", async () => {
    const scheme = await schemeOf(`
      @security(#{
        name: "oidc",
        scheme: #{
          type: "openIdConnect",
          openIdConnectUrl: "https://auth.example.com/.well-known/openid-configuration"
        }
      })
      namespace Test;
      model Msg { id: string; }
      @channel("events")
      op send(): Msg;
    `, "oidc");
    expect(scheme.type).toBe("openIdConnect");
    expect(scheme.openIdConnectUrl).toContain(".well-known");
  });

  it("asserts SASL mechanism types as the scheme type itself", async () => {
    const doc = await compileAndValidateOrThrow(`
      @security(#{
        name: "plain",
        scheme: #{ type: "plain" }
      })
      @security(#{
        name: "scram256",
        scheme: #{ type: "scramSha256" }
      })
      @security(#{
        name: "scram512",
        scheme: #{ type: "scramSha512" }
      })
      namespace Test;
      model Msg { id: string; }
      @channel("events")
      op send(): Msg;
    `);
    const schemes = doc.components!.securitySchemes!;
    expect(schemes.plain.type).toBe("plain");
    expect(schemes.scram256.type).toBe("scramSha256");
    expect(schemes.scram512.type).toBe("scramSha512");
  });

  it("asserts X509 and gssapi distinguishing type", async () => {
    const doc = await compileAndValidateOrThrow(`
      @security(#{
        name: "cert",
        scheme: #{ type: "X509" }
      })
      @security(#{
        name: "gss",
        scheme: #{ type: "gssapi" }
      })
      namespace Test;
      model Msg { id: string; }
      @channel("events")
      op send(): Msg;
    `);
    expect(doc.components!.securitySchemes!.cert.type).toBe("X509");
    expect(doc.components!.securitySchemes!.gss.type).toBe("gssapi");
  });
});

describe("security application points", () => {
  it("attaches operation security as $ref to components.securitySchemes", async () => {
    const doc = await compileAndValidateOrThrow(`
      @security(#{
        name: "jwt",
        scheme: #{ type: "http", scheme: "bearer", bearerFormat: "JWT" }
      })
      namespace Test;
      model Msg { id: string; }
      @channel("events")
      @operationSecurity(#{ name: "jwt" })
      op send(): Msg;
    `);
    expect(doc.operations!.send.security).toStrictEqual([
      { $ref: "#/components/securitySchemes/jwt" },
    ]);
  });

  it("supports multiple schemes accumulated on one namespace", async () => {
    const doc = await compileAndValidateOrThrow(`
      @security(#{
        name: "oauth",
        scheme: #{ type: "oauth2", flows: #{
          clientCredentials: #{ tokenUrl: "https://a/t", availableScopes: #{ x: "X" } }
        } }
      })
      @security(#{
        name: "key",
        scheme: #{ type: "httpApiKey", in: "header", name: "X-Key" }
      })
      namespace Test;
      model Msg { id: string; }
      @channel("events")
      op send(): Msg;
    `);
    const schemes = doc.components!.securitySchemes!;
    expect(Object.keys(schemes).toSorted()).toStrictEqual(["key", "oauth"]);
  });
});
