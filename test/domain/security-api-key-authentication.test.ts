/**
 * Security Schemes Tests
 */

import { describe, it, expect } from "bun:test";
import { createAsyncAPITestHost, compileAndGetAsyncAPI } from "../utils/test-helpers.js";

describe("API Key Authentication", () => {
  it("should support API Key in header", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace APIKeyHeader;

				model Msg { data: string; }

				@channel("apikey")
				@security(#{
					name: "apiKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.apiKey).toBeDefined();
    expect(securitySchemes?.apiKey.type).toBe("apiKey");
  });

  it("should support API Key in query parameter", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace APIKeyQuery;

				model Msg { data: string; }

				@channel("api")
				@security(#{
					name: "apiKeyQuery",
					scheme: #{
						type: "apiKey",
						in: "query",
						name: "api_key"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.apiKeyQuery).toEqual({
      type: "apiKey",
      in: "query",
      name: "api_key",
    });
  });

  it("should support API Key in cookie", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace APIKeyCookie;

				model Msg { data: string; }

				@channel("cookie")
				@security(#{
					name: "apiKeyCookie",
					scheme: #{
						type: "apiKey",
						in: "cookie",
						name: "session_key"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.apiKeyCookie).toBeDefined();
    expect(securitySchemes?.apiKeyCookie.type).toBe("apiKey");
  });

  it("should support multiple API keys", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace MultiAPIKey;

				model Msg { data: string; }

				@channel("multi1")
				@security(#{
					name: "key1",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key"
					}
				})
				@publish
				op pub1(): Msg;

				@channel("multi2")
				@security(#{
					name: "key2",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-Secret-Key"
					}
				})
				@publish
				op pub2(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.key1).toBeDefined();
    expect(securitySchemes?.key1.type).toBe("apiKey");
  });

  it("should support API Key with prefix", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace PrefixAPIKey;

				model Msg { data: string; }

				@channel("prefix")
				@security(#{
					name: "prefixKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "Authorization",
						prefix: "ApiKey "
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.prefixKey).toBeDefined();
    expect(securitySchemes?.prefixKey.type).toBe("apiKey");
  });

  it("should support API Key rotation", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace RotatingKey;

				model Msg {
					keyVersion: int32;
					data: string;
				}

				@channel("rotating")
				@security(#{
					name: "rotatingKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key-V2",
						rotating: true
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.rotatingKey).toBeDefined();
    expect(securitySchemes?.rotatingKey.type).toBe("apiKey");
  });

  it("should support API Key scopes", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace ScopedKey;

				model Msg { data: string; }

				@channel("scoped")
				@security(#{
					name: "scopedKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-Scoped-Key",
						scopes: "read,write"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.scopedKey).toBeDefined();
    expect(securitySchemes?.scopedKey.type).toBe("apiKey");
  });

  it("should support API Key rate limiting", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace RateLimitedKey;

				model Msg {
					rateLimit: int32;
					data: string;
				}

				@channel("ratelimited")
				@security(#{
					name: "rateLimitedKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key",
						rateLimit: 1000
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.rateLimitedKey).toBeDefined();
    expect(securitySchemes?.rateLimitedKey.type).toBe("apiKey");
  });

  it("should support API Key expiration", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace ExpiringKey;

				model Msg {
					expiresAt: utcDateTime;
					data: string;
				}

				@channel("expiring")
				@security(#{
					name: "expiringKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key",
						ttl: 3600
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.expiringKey).toBeDefined();
    expect(securitySchemes?.expiringKey.type).toBe("apiKey");
  });

  it("should support API Key IP whitelisting", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace IPWhitelist;

				model Msg {
					allowedIPs: string[];
					data: string;
				}

				@channel("ipwhitelist")
				@security(#{
					name: "ipWhitelistKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key",
						ipWhitelist: true
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.ipWhitelistKey).toBeDefined();
    expect(securitySchemes?.ipWhitelistKey.type).toBe("apiKey");
  });

  it("should support API Key usage tracking", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace UsageTracking;

				model Msg {
					usageCount: int64;
					data: string;
				}

				@channel("tracked")
				@security(#{
					name: "trackedKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key",
						tracking: true
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.trackedKey).toBeDefined();
    expect(securitySchemes?.trackedKey.type).toBe("apiKey");
  });

  it("should support API Key with CORS", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace CORSKey;

				model Msg { data: string; }

				@channel("cors")
				@security(#{
					name: "corsKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key",
						corsEnabled: true
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.corsKey).toBeDefined();
    expect(securitySchemes?.corsKey.type).toBe("apiKey");
  });

  it("should support API Key with environment (dev/staging/prod)", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace EnvKey;

				model Msg {
					environment: "dev" | "staging" | "prod";
					data: string;
				}

				@channel("env")
				@security(#{
					name: "envKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key",
						environment: "prod"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.envKey).toBeDefined();
    expect(securitySchemes?.envKey.type).toBe("apiKey");
  });

  it("should support API Key with request signing", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SignedKey;

				model Msg {
					signature: string;
					data: string;
				}

				@channel("signed")
				@security(#{
					name: "signedKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key",
						signed: true,
						algorithm: "HMAC-SHA256"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.signedKey).toBeDefined();
    expect(securitySchemes?.signedKey.type).toBe("apiKey");
  });

  it("should support API Key with custom validation", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace CustomValidation;

				model Msg { data: string; }

				@channel("validated")
				@security(#{
					name: "validatedKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key",
						validation: "custom-validator"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.validatedKey).toBeDefined();
    expect(securitySchemes?.validatedKey.type).toBe("apiKey");
  });

  it("should support API Key with webhook verification", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace WebhookKey;

				model WebhookMsg {
					webhookId: string;
					signature: string;
					data: Record<unknown>;
				}

				@channel("webhook")
				@security(#{
					name: "webhookKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-Webhook-Signature",
						webhook: true
					}
				})
				@subscribe
				op receiveWebhook(): WebhookMsg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.webhookKey).toBeDefined();
    expect(securitySchemes?.webhookKey.type).toBe("apiKey");
  });

  it("should support API Key with tenant isolation", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace TenantKey;

				model Msg {
					tenantId: string;
					data: string;
				}

				@channel("tenant")
				@security(#{
					name: "tenantKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-Tenant-Key",
						multiTenant: true
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.tenantKey).toBeDefined();
    expect(securitySchemes?.tenantKey.type).toBe("apiKey");
  });

  it("should support API Key with fallback authentication", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace FallbackKey;

				model Msg { data: string; }

				@channel("fallback")
				@security(#{
					name: "fallbackKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key",
						fallback: "basic"
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.fallbackKey).toBeDefined();
    expect(securitySchemes?.fallbackKey.type).toBe("apiKey");
  });

  it("should support API Key with conditional requirements", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace ConditionalKey;

				model Msg {
					requiresKey: boolean;
					data: string;
				}

				@channel("conditional")
				@security(#{
					name: "conditionalKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key",
						conditional: true
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.conditionalKey).toBeDefined();
    expect(securitySchemes?.conditionalKey.type).toBe("apiKey");
  });

  it("should support API Key with audit logging", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace AuditKey;

				model Msg {
					auditId: string;
					data: string;
				}

				@channel("audit")
				@security(#{
					name: "auditKey",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key",
						audit: true
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.auditKey).toBeDefined();
    expect(securitySchemes?.auditKey.type).toBe("apiKey");
  });
});
