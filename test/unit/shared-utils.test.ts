/**
 * Unit Tests: Shared Builder Utilities
 *
 * Tests the pure functions in src/builders/shared-utils.ts and the
 * reference helpers in src/domain/models/asyncapi-document.ts.
 * These functions have no dedicated unit tests — they are only
 * exercised indirectly through compilation.
 */

import {
  inferActionFromName,
  operationAction,
  extractChannelParameters,
  normalizeOAuth2Scopes,
  buildProtocolBinding,
} from "../../src/builders/shared-utils.js";
import {
  escapeRefToken,
  ref,
  refSchema,
  refMessage,
  refChannel,
} from "../../src/domain/models/asyncapi-document.js";
import type { SecurityScheme } from "../../src/domain/models/asyncapi-document.js";

describe("inferActionFromName", () => {
  it("infers send for 'publish' prefix", () => {
    expect(inferActionFromName("publishEvent")).toBe("send");
  });

  it("infers send for 'send' prefix", () => {
    expect(inferActionFromName("sendNotification")).toBe("send");
  });

  it("infers send for 'emit' prefix", () => {
    expect(inferActionFromName("emitMetric")).toBe("send");
  });

  it("infers send for 'produce' prefix", () => {
    expect(inferActionFromName("produceRecord")).toBe("send");
  });

  it("infers send for uppercase prefixes (case-insensitive)", () => {
    expect(inferActionFromName("PublishEvent")).toBe("send");
    expect(inferActionFromName("SEND_MESSAGE")).toBe("send");
    expect(inferActionFromName("Emit")).toBe("send");
    expect(inferActionFromName("PRODUCE")).toBe("send");
  });

  it("defaults to receive for unrecognized prefixes", () => {
    expect(inferActionFromName("subscribe")).toBe("receive");
    expect(inferActionFromName("consume")).toBe("receive");
    expect(inferActionFromName("handle")).toBe("receive");
    expect(inferActionFromName("onMessage")).toBe("receive");
  });

  it("defaults to receive for empty string", () => {
    expect(inferActionFromName("")).toBe("receive");
  });
});

describe("operationAction", () => {
  it("maps publish to send", () => {
    expect(operationAction("publish")).toBe("send");
  });

  it("maps subscribe to receive", () => {
    expect(operationAction("subscribe")).toBe("receive");
  });
});

describe("extractChannelParameters", () => {
  it("returns undefined for address without parameters", () => {
    expect(extractChannelParameters("events/orders")).toBeUndefined();
  });

  it("extracts single parameter", () => {
    const params = extractChannelParameters("users/{userId}");
    expect(params).toBeDefined();
    expect(params!["userId"]).toBeDefined();
    expect(params!["userId"].description).toContain("userId");
  });

  it("extracts multiple parameters", () => {
    const params = extractChannelParameters("orgs/{orgId}/users/{userId}");
    expect(params).toBeDefined();
    expect(Object.keys(params!)).toHaveLength(2);
    expect(params!["orgId"]).toBeDefined();
    expect(params!["userId"]).toBeDefined();
  });

  it("handles adjacent parameters", () => {
    const params = extractChannelParameters("{a}{b}");
    expect(params).toBeDefined();
    expect(Object.keys(params!)).toHaveLength(2);
  });
});

describe("normalizeOAuth2Scopes", () => {
  it("renames scopes to availableScopes in implicit flow", () => {
    const scheme: SecurityScheme = {
      type: "oauth2",
      flows: {
        implicit: {
          authorizationUrl: "https://example.com/auth",
          scopes: { read: "read access" },
        },
      },
    };
    const result = normalizeOAuth2Scopes(scheme);
    expect(result.flows!.implicit!.availableScopes).toStrictEqual({
      read: "read access",
    });
    expect(
      (result.flows!.implicit as Record<string, unknown>).scopes,
    ).toBeUndefined();
  });

  it("renames scopes in all four flow types", () => {
    const scheme: SecurityScheme = {
      type: "oauth2",
      flows: {
        implicit: { authorizationUrl: "https://a.com", scopes: { a: "a" } },
        password: { tokenUrl: "https://t.com", scopes: { b: "b" } },
        clientCredentials: { tokenUrl: "https://t.com", scopes: { c: "c" } },
        authorizationCode: {
          authorizationUrl: "https://a.com",
          tokenUrl: "https://t.com",
          scopes: { d: "d" },
        },
      },
    };
    const result = normalizeOAuth2Scopes(scheme);
    expect(result.flows!.implicit!.availableScopes).toStrictEqual({ a: "a" });
    expect(result.flows!.password!.availableScopes).toStrictEqual({ b: "b" });
    expect(result.flows!.clientCredentials!.availableScopes).toStrictEqual({
      c: "c",
    });
    expect(result.flows!.authorizationCode!.availableScopes).toStrictEqual({
      d: "d",
    });
  });

  it("preserves already-normalized availableScopes", () => {
    const scheme: SecurityScheme = {
      type: "oauth2",
      flows: {
        implicit: {
          authorizationUrl: "https://a.com",
          availableScopes: { read: "read" },
        },
      },
    };
    const result = normalizeOAuth2Scopes(scheme);
    expect(result.flows!.implicit!.availableScopes).toStrictEqual({
      read: "read",
    });
  });

  it("returns scheme unchanged when no flows", () => {
    const scheme: SecurityScheme = { type: "oauth2" };
    const result = normalizeOAuth2Scopes(scheme);
    expect(result.flows).toBeUndefined();
  });

  it("does not modify the original scheme", () => {
    const scheme: SecurityScheme = {
      type: "oauth2",
      flows: {
        implicit: {
          authorizationUrl: "https://a.com",
          scopes: { read: "read" },
        },
      },
    };
    normalizeOAuth2Scopes(scheme);
    expect(
      (scheme.flows!.implicit as Record<string, unknown>).scopes,
    ).toBeDefined();
  });
});

describe("buildProtocolBinding", () => {
  it("builds kafka binding with auto-injected bindingVersion", () => {
    const result = buildProtocolBinding({
      protocol: "kafka",
      binding: { topic: "events" },
    });
    expect(result.kafka).toBeDefined();
    expect(result.kafka.topic).toBe("events");
    expect(result.kafka.bindingVersion).toBeDefined();
  });

  it("preserves explicit bindingVersion", () => {
    const result = buildProtocolBinding({
      protocol: "kafka",
      binding: { bindingVersion: "0.4.0" },
    });
    expect(result.kafka.bindingVersion).toBe("0.4.0");
  });

  it("normalizes wss to ws binding key", () => {
    const result = buildProtocolBinding({
      protocol: "wss",
      binding: {},
    });
    expect(result.ws).toBeDefined();
    expect(result.wss).toBeUndefined();
  });

  it("builds http binding", () => {
    const result = buildProtocolBinding({
      protocol: "http",
      binding: { method: "GET" },
    });
    expect(result.http).toBeDefined();
    expect(result.http.method).toBe("GET");
  });
});

describe("escapeRefToken (RFC 6901)", () => {
  it("escapes tilde to ~0", () => {
    expect(escapeRefToken("a~b")).toBe("a~0b");
  });

  it("escapes slash to ~1", () => {
    expect(escapeRefToken("a/b")).toBe("a~1b");
  });

  it("escapes both tilde and slash in correct order (tilde first)", () => {
    expect(escapeRefToken("a~/b")).toBe("a~0~1b");
  });

  it("handles string with no special chars unchanged", () => {
    expect(escapeRefToken("simpleName")).toBe("simpleName");
  });

  it("handles empty string", () => {
    expect(escapeRefToken("")).toBe("");
  });
});

describe("reference constructors", () => {
  it("ref creates a $ref object", () => {
    expect(ref("#/channels/test")).toStrictEqual({ $ref: "#/channels/test" });
  });

  it("refSchema creates components/schemas ref with escaping", () => {
    expect(refSchema("User")).toStrictEqual({
      $ref: "#/components/schemas/User",
    });
  });

  it("refSchema escapes special chars in name", () => {
    expect(refSchema("my/model")).toStrictEqual({
      $ref: "#/components/schemas/my~1model",
    });
  });

  it("refMessage creates components/messages ref", () => {
    expect(refMessage("UserCreated")).toStrictEqual({
      $ref: "#/components/messages/UserCreated",
    });
  });

  it("refChannel creates channels ref", () => {
    expect(refChannel("events")).toStrictEqual({
      $ref: "#/channels/events",
    });
  });

  it("refChannel escapes special chars", () => {
    expect(refChannel("orgs/users")).toStrictEqual({
      $ref: "#/channels/orgs~1users",
    });
  });
});
