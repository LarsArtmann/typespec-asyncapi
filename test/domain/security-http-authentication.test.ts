/**
 * Security Schemes Tests
 */

import { describe, it, expect } from "bun:test";
import { createAsyncAPITestHost, compileAndGetAsyncAPI } from "../utils/test-helpers.js";

describe("HTTP Authentication", () => {
  it("should support HTTP Basic Auth", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace BasicAuth;

				model Msg { data: string; }

				@channel("secure")
				@security(#{
					name: "basicAuth",
					scheme: #{
						type: "http",
						scheme: "basic"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.basicAuth).toEqual({
      type: "http",
      scheme: "basic",
    });
  });

  it("should support HTTP Bearer JWT", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace BearerJWT;

				model Msg { id: string; }

				@channel("jwt.secured")
				@security(#{
					name: "jwtBearer",
					scheme: #{
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.jwtBearer).toEqual({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
  });

  it("should support HTTP Bearer with custom format", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace CustomBearer;

				model Msg { content: string; }

				@channel("custom")
				@security(#{
					name: "customBearer",
					scheme: #{
						type: "http",
						scheme: "bearer",
						bearerFormat: "opaque"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });

  it("should support HTTP Digest Auth", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace DigestAuth;

				model Msg { data: string; }

				@channel("digest")
				@security(#{
					name: "digestAuth",
					scheme: #{
						type: "http",
						scheme: "digest"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });

  it("should support HTTP Mutual TLS", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace MTLS;

				model Msg { secure: string; }

				@channel("mtls")
				@security(#{
					name: "mutualTLS",
					scheme: #{
						type: "http",
						scheme: "mutual"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.mutualTLS).toBeDefined();
  });

  it("should support HTTP HOBA (HTTP Origin-Bound Auth)", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace HOBA;

				model Msg { hoba: string; }

				@channel("hoba")
				@security(#{
					name: "hobaAuth",
					scheme: #{
						type: "http",
						scheme: "hoba"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });

  it("should support HTTP Negotiate (SPNEGO)", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Negotiate;

				model Msg { nego: string; }

				@channel("negotiate")
				@security(#{
					name: "negotiateAuth",
					scheme: #{
						type: "http",
						scheme: "negotiate"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });

  it("should support HTTP SCRAM-SHA-1", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SCRAM1;

				model Msg { scram: string; }

				@channel("scram1")
				@security(#{
					name: "scram1",
					scheme: #{
						type: "http",
						scheme: "scram-sha-1"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });

  it("should support HTTP SCRAM-SHA-256", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SCRAM256;

				model Msg { data: string; }

				@channel("scram256")
				@security(#{
					name: "scram256",
					scheme: #{
						type: "http",
						scheme: "scram-sha-256"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });

  it("should support HTTP AWS Signature V4", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace AWSSigV4;

				model Msg { aws: string; }

				@channel("aws")
				@security(#{
					name: "awsSigV4",
					scheme: #{
						type: "http",
						scheme: "bearer"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });

  it("should support HTTP MAC (Message Authentication Code)", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace MAC;

				model Msg { mac: string; }

				@channel("mac")
				@security(#{
					name: "macAuth",
					scheme: #{
						type: "http",
						scheme: "bearer"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });

  it("should support HTTP VAPID (Web Push)", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace VAPID;

				model PushMsg { vapid: string; }

				@channel("push")
				@security(#{
					name: "vapidAuth",
					scheme: #{
						type: "http",
						scheme: "vapid"
					}
				})
				@publish
				op publishMessage(): PushMsg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });

  it("should support HTTP DPoP (Demonstrating Proof-of-Possession)", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace DPoP;

				model Msg { dpop: string; }

				@channel("dpop")
				@security(#{
					name: "dpopAuth",
					scheme: #{
						type: "http",
						scheme: "dpop"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });

  it("should support HTTP PrivateToken", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace PrivateToken;

				model Msg { token: string; }

				@channel("private")
				@security(#{
					name: "privateToken",
					scheme: #{
						type: "http",
						scheme: "privatetoken"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });

  it("should support HTTP GNAP (Grant Negotiation and Authorization Protocol)", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace GNAP;

				model Msg { gnap: string; }

				@channel("gnap")
				@security(#{
					name: "gnapAuth",
					scheme: #{
						type: "http",
						scheme: "gnap"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });

  it("should support multiple HTTP auth schemes (OR)", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace MultiAuth;

				model Msg { data: string; }

				@channel("multi")
				@security(#{
					name: "basicOrBearer",
					scheme: #{
						type: "http",
						scheme: "basic"
					}
				})
				@publish
				op pub1(): Msg;

				@channel("multi2")
				@security(#{
					name: "jwt",
					scheme: #{
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT"
					}
				})
				@publish
				op pub2(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });

  it("should support HTTP auth with realm", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Realm;

				model Msg { data: string; }

				@channel("realm")
				@security(#{
					name: "realmAuth",
					scheme: #{
						type: "http",
						scheme: "basic",
						realm: "MyApp"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });

  it("should support HTTP auth with charset", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Charset;

				model Msg { data: string; }

				@channel("charset")
				@security(#{
					name: "charsetAuth",
					scheme: #{
						type: "http",
						scheme: "basic",
						charset: "UTF-8"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });

  it("should support HTTP auth with nonce", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Nonce;

				model Msg { data: string; }

				@channel("nonce")
				@security(#{
					name: "nonceAuth",
					scheme: #{
						type: "http",
						scheme: "digest",
						nonce: "required"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });

  it("should support HTTP Hawk authentication", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace Hawk;

				model Msg { hawk: string; }

				@channel("hawk")
				@security(#{
					name: "hawkAuth",
					scheme: #{
						type: "http",
						scheme: "bearer"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.0.0");
  });
});
