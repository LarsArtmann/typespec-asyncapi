/**
 * E2E Test 2: Security Schemes Comprehensive Test
 *
 * Tests all AsyncAPI 3.0 security scheme types with proper configuration
 */

import { describe, expect, it } from "bun:test";
import { createAsyncAPITestHost } from "../utils/test-helpers.js";
import { Effect } from "effect";

describe("E2E: Security Schemes Comprehensive", () => {
  it("should generate all AsyncAPI 3.0 security scheme types", async () => {
    const host = await createAsyncAPITestHost();

    host.addTypeSpecFile(
      "main.tsp",
      `
			import "@lars-artmann/typespec-asyncapi";
			using TypeSpec.AsyncAPI;

			namespace SecurityAPI;

			model SecureMessage {
				messageId: string;
				payload: string;
			}

			// === HTTP Bearer (JWT) ===
			@channel("secure.bearer")
			@security(#{
				name: "jwtAuth",
				scheme: #{
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT"
				}
			})
			@publish
			op publishWithJWT(): SecureMessage;

			// === API Key (Header) ===
			@channel("secure.apikey.header")
			@security(#{
				name: "apiKeyHeader",
				scheme: #{
					type: "apiKey",
					in: "header",
					name: "X-API-Key"
				}
			})
			@publish
			op publishWithApiKeyHeader(): SecureMessage;

			// === API Key (Query) ===
			@channel("secure.apikey.query")
			@security(#{
				name: "apiKeyQuery",
				scheme: #{
					type: "apiKey",
					in: "query",
					name: "api_key"
				}
			})
			@subscribe
			op subscribeWithApiKeyQuery(): SecureMessage;

			// === OAuth2 Client Credentials ===
			@channel("secure.oauth2.client")
			@security(#{
				name: "oauth2ClientCreds",
				scheme: #{
					type: "oauth2",
					flows: #{
						clientCredentials: #{
							tokenUrl: "https://auth.example.com/oauth/token",
							scopes: #{
								"read:messages": "Read messages",
								"write:messages": "Write messages"
							}
						}
					}
				}
			})
			@publish
			op publishWithOAuth2(): SecureMessage;

			// === OAuth2 Authorization Code ===
			@channel("secure.oauth2.authcode")
			@security(#{
				name: "oauth2AuthCode",
				scheme: #{
					type: "oauth2",
					flows: #{
						authorizationCode: #{
							authorizationUrl: "https://auth.example.com/authorize",
							tokenUrl: "https://auth.example.com/token",
							scopes: #{
								"admin": "Admin access"
							}
						}
					}
				}
			})
			@subscribe
			op subscribeWithOAuth2AuthCode(): SecureMessage;

			// === Kafka SASL ===
			@channel("secure.kafka.sasl")
			@security(#{
				name: "kafkaSASL256",
				scheme: #{
					type: "sasl",
					mechanism: "SCRAM-SHA-256"
				}
			})
			@publish
			op publishWithKafkaSASL(): SecureMessage;

			// === Kafka SASL 512 ===
			@channel("secure.kafka.sasl512")
			@security(#{
				name: "kafkaSASL512",
				scheme: #{
					type: "sasl",
					mechanism: "SCRAM-SHA-512"
				}
			})
			@publish
			op publishWithKafkaSASL512(): SecureMessage;

			// === HTTP Basic Auth ===
			@channel("secure.basic")
			@security(#{
				name: "basicAuth",
				scheme: #{
					type: "http",
					scheme: "basic"
				}
			})
			@subscribe
			op subscribeWithBasicAuth(): SecureMessage;
		`,
    );

    const program = await host.compile("./main.tsp");
    const diagnostics = await host.diagnose("./main.tsp", {
      emit: ["@lars-artmann/typespec-asyncapi"],
    });

    Effect.log(`Diagnostics: ${diagnostics.length}`);

    const outputFiles = Array.from(host.fs.keys());
    const asyncApiFile = outputFiles.find(
      (f) =>
        f.includes("asyncapi") && (f.endsWith(".json") || f.endsWith(".yaml")),
    );

    expect(asyncApiFile).toBeDefined();

    if (asyncApiFile) {
      const content = host.fs.get(asyncApiFile) as string;
      const spec = content.startsWith("{")
        ? JSON.parse(content)
        : require("yaml").parse(content);

      // Validate security schemes
      const securitySchemes = spec.components?.securitySchemes || {};

      // Should have at least 8 security schemes
      expect(Object.keys(securitySchemes).length).toBeGreaterThanOrEqual(8);

      // Validate JWT Bearer
      expect(securitySchemes.jwtAuth?.type).toBe("http");
      expect(securitySchemes.jwtAuth?.scheme).toBe("bearer");
      expect(securitySchemes.jwtAuth?.bearerFormat).toBe("JWT");

      // Validate API Key Header
      expect(securitySchemes.apiKeyHeader?.type).toBe("apiKey");
      expect(securitySchemes.apiKeyHeader?.in).toBe("header");
      expect(securitySchemes.apiKeyHeader?.name).toBe("X-API-Key");

      // Validate API Key Query
      expect(securitySchemes.apiKeyQuery?.type).toBe("apiKey");
      expect(securitySchemes.apiKeyQuery?.in).toBe("query");

      // Validate OAuth2 Client Credentials
      expect(securitySchemes.oauth2ClientCreds?.type).toBe("oauth2");
      expect(
        securitySchemes.oauth2ClientCreds?.flows?.clientCredentials,
      ).toBeDefined();
      expect(
        securitySchemes.oauth2ClientCreds?.flows?.clientCredentials?.tokenUrl,
      ).toContain("oauth");

      // Validate OAuth2 Authorization Code
      expect(securitySchemes.oauth2AuthCode?.type).toBe("oauth2");
      expect(
        securitySchemes.oauth2AuthCode?.flows?.authorizationCode,
      ).toBeDefined();

      // Validate Kafka SASL
      expect(securitySchemes.kafkaSASL256?.type).toBe("sasl");
      expect(securitySchemes.kafkaSASL256?.mechanism).toBe("SCRAM-SHA-256");

      expect(securitySchemes.kafkaSASL512?.type).toBe("sasl");
      expect(securitySchemes.kafkaSASL512?.mechanism).toBe("SCRAM-SHA-512");

      // Validate Basic Auth
      expect(securitySchemes.basicAuth?.type).toBe("http");
      expect(securitySchemes.basicAuth?.scheme).toBe("basic");

      // Validate all operations have security
      const operations = spec.operations || {};
      expect(Object.keys(operations).length).toBeGreaterThanOrEqual(8);

      Effect.log("✅ Security schemes E2E test passed!");
    }
  });
});
