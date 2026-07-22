/**
 * AsyncAPI 3.1.0 Spec Compliance: Servers and Security Schemes
 *
 * Validates that server configurations and all security scheme types
 * produce output that validates against the AsyncAPI 3.1.0 JSON Schema.
 *
 * Spec reference:
 *   https://www.asyncapi.com/docs/reference/specification/v3.1.0#serverObject
 *   https://www.asyncapi.com/docs/reference/specification/v3.1.0#securitySchemeObject
 */

import { compileAndValidateOrThrow } from "../utils/schema-validator.js";

describe("spec Compliance: Servers", () => {
  it("emits server with host and protocol (required fields)", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("prod", #{
        url: "kafka.broker.com:9092",
        protocol: "kafka"
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const servers = doc.servers as Record<string, Record<string, unknown>>;
    expect(servers.prod).toBeDefined();
    expect(servers.prod.host).toBe("kafka.broker.com:9092");
    expect(servers.prod.protocol).toBe("kafka");
  });

  it("normalizes websocket alias to ws", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("ws", #{
        url: "ws://localhost:8080",
        protocol: "websocket"
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const servers = doc.servers as Record<string, Record<string, unknown>>;
    expect(servers.ws.protocol).toBe("ws");
  });

  it("supports multiple servers", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("kafka-prod", #{
        url: "broker:9092",
        protocol: "kafka"
      })
      @server("ws-api", #{
        url: "ws.example.com",
        protocol: "ws"
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const servers = doc.servers as Record<string, unknown>;
    expect(Object.keys(servers)).toHaveLength(2);
  });

  it("extracts server variables from {var} pattern in host", async () => {
    const doc = await compileAndValidateOrThrow(`
      @server("prod", #{
        url: "{region}.example.com",
        protocol: "https"
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const servers = doc.servers as Record<string, Record<string, unknown>>;
    expect(servers.prod.variables).toBeDefined();
    const vars = servers.prod.variables as Record<string, unknown>;
    expect(vars.region).toBeDefined();
  });
});

describe("spec Compliance: Security Schemes", () => {
  it("emits userPassword security scheme", async () => {
    const doc = await compileAndValidateOrThrow(`
      @security(#{ name: "user-pass", scheme: #{ type: "userPassword" } })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const components = doc.components as Record<
      string,
      Record<string, Record<string, unknown>>
    >;
    const scheme = components.securitySchemes["user-pass"];
    expect(scheme.type).toBe("userPassword");
  });

  it("emits httpApiKey security scheme", async () => {
    const doc = await compileAndValidateOrThrow(`
      @security(#{ name: "api-key", scheme: #{ type: "httpApiKey", in: "header", name: "X-API-Key" } })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const components = doc.components as Record<
      string,
      Record<string, Record<string, unknown>>
    >;
    const scheme = components.securitySchemes["api-key"];
    expect(scheme.type).toBe("httpApiKey");
    expect(scheme.in).toBe("header");
    expect(scheme.name).toBe("X-API-Key");
  });

  it("emits http security scheme with bearerFormat", async () => {
    const doc = await compileAndValidateOrThrow(`
      @security(#{ name: "jwt", scheme: #{ type: "http", scheme: "bearer", bearerFormat: "JWT" } })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const components = doc.components as Record<
      string,
      Record<string, Record<string, unknown>>
    >;
    const scheme = components.securitySchemes["jwt"];
    expect(scheme.type).toBe("http");
    expect(scheme.scheme).toBe("bearer");
    expect(scheme.bearerFormat).toBe("JWT");
  });

  it("emits scramSha256 security scheme", async () => {
    const doc = await compileAndValidateOrThrow(`
      @security(#{ name: "scram", scheme: #{ type: "scramSha256" } })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const components = doc.components as Record<
      string,
      Record<string, Record<string, unknown>>
    >;
    expect(components.securitySchemes["scram"].type).toBe("scramSha256");
  });

  it("emits oauth2 security scheme with flows", async () => {
    const doc = await compileAndValidateOrThrow(`
      @security(#{
        name: "oauth",
        scheme: #{
          type: "oauth2",
          flows: #{
            clientCredentials: #{
              tokenUrl: "https://auth.example.com/token",
              availableScopes: #{
                readAccess: "read access",
                writeAccess: "write access"
              }
            }
          }
        }
      })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const components = doc.components as Record<
      string,
      Record<string, Record<string, unknown>>
    >;
    const scheme = components.securitySchemes.oauth;
    expect(scheme.type).toBe("oauth2");
    expect(scheme.flows).toBeDefined();
  });

  it("emits X509 security scheme", async () => {
    const doc = await compileAndValidateOrThrow(`
      @security(#{ name: "cert", scheme: #{ type: "X509" } })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const components = doc.components as Record<
      string,
      Record<string, Record<string, unknown>>
    >;
    expect(components.securitySchemes.cert.type).toBe("X509");
  });

  it("emits multiple security schemes on one target", async () => {
    const doc = await compileAndValidateOrThrow(`
      @security(#{ name: "cert", scheme: #{ type: "X509" } })
      @security(#{ name: "jwt", scheme: #{ type: "http", scheme: "bearer", bearerFormat: "JWT" } })
      namespace Test;
      model Event { id: string; }
      @channel("events")
      op publish(): Event;
    `);

    const components = doc.components as Record<
      string,
      Record<string, unknown>
    >;
    const schemes = components.securitySchemes as Record<string, unknown>;
    expect(Object.keys(schemes)).toHaveLength(2);
    expect(schemes.cert).toBeDefined();
    expect(schemes.jwt).toBeDefined();
  });
});
