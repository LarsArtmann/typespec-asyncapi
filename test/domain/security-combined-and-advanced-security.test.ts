/**
 * Security Schemes Tests
 */

import { describe, it, expect } from "bun:test";
import { createAsyncAPITestHost, compileAndGetAsyncAPI } from "../utils/test-helpers.js";

describe("Combined & Advanced Security", () => {
  it("should support multiple security schemes (AND)", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace MultiSecurity;

				model Msg { data: string; }

				@channel("multi1")
				@security(#{
					name: "apiKey",
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
    expect(spec?.asyncapi).toBe("3.1.0");
    // Assert actual security scheme output
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.apiKey).toBeDefined();
    expect(securitySchemes?.apiKey.type).toBe("apiKey");
  });

  it("should support security with rate limiting", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace RateLimitedSecurity;

				model Msg {
					rateLimit: int32;
					remaining: int32;
				}

				@channel("ratelimit")
				@security(#{
					name: "rateLimited",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key",
						rateLimit: 1000,
						rateLimitWindow: 3600
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
    expect(securitySchemes?.rateLimited).toBeDefined();
    expect(securitySchemes?.rateLimited.type).toBe("apiKey");
  });

  it("should support security with IP restrictions", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace IPRestricted;

				model Msg {
					allowedIPs: string[];
					data: string;
				}

				@channel("iprestrict")
				@security(#{
					name: "ipRestricted",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key",
						ipWhitelist: #["192.168.1.0/24", "10.0.0.0/8"]
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
    expect(securitySchemes?.ipRestricted).toBeDefined();
    expect(securitySchemes?.ipRestricted.type).toBe("apiKey");
  });

  it("should support security with geographic restrictions", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace GeoRestricted;

				model Msg {
					allowedRegions: string[];
					data: string;
				}

				@channel("georestrict")
				@security(#{
					name: "geoRestricted",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key",
						allowedRegions: #["US", "EU", "APAC"]
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
    expect(securitySchemes?.geoRestricted).toBeDefined();
    expect(securitySchemes?.geoRestricted.type).toBe("apiKey");
  });

  it("should support security with time-based access", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace TimeBasedSecurity;

				model Msg {
					validFrom: utcDateTime;
					validUntil: utcDateTime;
				}

				@channel("timebased")
				@security(#{
					name: "timeBased",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-API-Key",
						timeRestricted: true
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
    expect(securitySchemes?.timeBased).toBeDefined();
    expect(securitySchemes?.timeBased.type).toBe("apiKey");
  });

  it("should support security with MFA requirements", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace MFASecurity;

				model Msg {
					mfaToken: string;
					data: string;
				}

				@channel("mfa")
				@security(#{
					name: "mfaRequired",
					scheme: #{
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
						mfaRequired: true
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
    expect(securitySchemes?.mfaRequired).toBeDefined();
    expect(securitySchemes?.mfaRequired.type).toBe("http");
  });

  it("should support security with device fingerprinting", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace DeviceFingerprint;

				model Msg {
					deviceId: string;
					fingerprint: string;
				}

				@channel("device")
				@security(#{
					name: "deviceFingerprint",
					scheme: #{
						type: "apiKey",
						in: "header",
						name: "X-Device-ID",
						fingerprintRequired: true
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
    expect(securitySchemes?.deviceFingerprint).toBeDefined();
    expect(securitySchemes?.deviceFingerprint.type).toBe("apiKey");
  });

  it("should support security with risk-based authentication", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace RiskBased;

				model Msg {
					riskScore: float64;
					requiresStepUp: boolean;
				}

				@channel("riskbased")
				@security(#{
					name: "riskBased",
					scheme: #{
						type: "http",
						scheme: "bearer",
						bearerFormat: "JWT",
						riskBasedAuth: true,
						riskThreshold: 0.7
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
    expect(securitySchemes?.riskBased).toBeDefined();
    expect(securitySchemes?.riskBased.type).toBe("http");
  });
});
