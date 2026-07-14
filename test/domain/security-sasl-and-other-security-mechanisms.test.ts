/**
 * Security Schemes Tests
 */

import { describe, it, expect } from "bun:test";
import {
  createAsyncAPITestHost,
  compileAndGetAsyncAPI,
  compileAsyncAPISpecRaw,
} from "../utils/test-helpers.js";

describe("SASL & Other Security Mechanisms", () => {
  it("should support SASL PLAIN", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SASLPlain;

				model Msg { data: string; }

				@channel("sasl")
				@security(#{
					name: "saslPlain",
					scheme: #{
						type: "sasl",
						mechanism: "PLAIN"
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
    expect(securitySchemes?.saslPlain).toBeDefined();
    expect(securitySchemes?.saslPlain.type).toBe("sasl");
  });

  it("should support SASL SCRAM-SHA-1", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SASLSCRAM1;

				model Msg { data: string; }

				@channel("scram1")
				@security(#{
					name: "saslScram1",
					scheme: #{
						type: "sasl",
						mechanism: "SCRAM-SHA-1"
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
    expect(securitySchemes?.saslScram1).toBeDefined();
    expect(securitySchemes?.saslScram1.type).toBe("sasl");
  });

  it("should support SASL SCRAM-SHA-256", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SASLSCRAM256;

				model Msg { data: string; }

				@channel("scram256")
				@security(#{
					name: "saslScram256",
					scheme: #{
						type: "sasl",
						mechanism: "SCRAM-SHA-256"
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
    expect(securitySchemes?.saslScram256).toBeDefined();
    expect(securitySchemes?.saslScram256.type).toBe("sasl");
  });

  it("should support SASL SCRAM-SHA-512", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SASLSCRAM512;

				model Msg { data: string; }

				@channel("scram512")
				@security(#{
					name: "saslScram512",
					scheme: #{
						type: "sasl",
						mechanism: "SCRAM-SHA-512"
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
    expect(securitySchemes?.saslScram512).toBeDefined();
    expect(securitySchemes?.saslScram512.type).toBe("sasl");
  });

  it("should support SASL GSSAPI (Kerberos)", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SASLGSSAPI;

				model Msg { data: string; }

				@channel("gssapi")
				@security(#{
					name: "saslGSSAPI",
					scheme: #{
						type: "sasl",
						mechanism: "GSSAPI"
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
    expect(securitySchemes?.saslGSSAPI).toBeDefined();
    expect(securitySchemes?.saslGSSAPI.type).toBe("sasl");
  });

  it("should support SASL EXTERNAL", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SASLExternal;

				model Msg { data: string; }

				@channel("external")
				@security(#{
					name: "saslExternal",
					scheme: #{
						type: "sasl",
						mechanism: "EXTERNAL"
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
    expect(securitySchemes?.saslExternal).toBeDefined();
    expect(securitySchemes?.saslExternal.type).toBe("sasl");
  });

  it("should support SASL OAUTHBEARER", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SASLOAuthBearer;

				model Msg { data: string; }

				@channel("oauth")
				@security(#{
					name: "saslOAuthBearer",
					scheme: #{
						type: "sasl",
						mechanism: "OAUTHBEARER"
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
    expect(securitySchemes?.saslOAuthBearer).toBeDefined();
    expect(securitySchemes?.saslOAuthBearer.type).toBe("sasl");
  });

  it("should support SASL CRAM-MD5", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SASLCRAMMD5;

				model Msg { data: string; }

				@channel("crammd5")
				@security(#{
					name: "saslCRAMMD5",
					scheme: #{
						type: "sasl",
						mechanism: "CRAM-MD5"
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
    expect(securitySchemes?.saslCRAMMD5).toBeDefined();
    expect(securitySchemes?.saslCRAMMD5.type).toBe("sasl");
  });

  it("should support SASL DIGEST-MD5", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SASLDigestMD5;

				model Msg { data: string; }

				@channel("digest")
				@security(#{
					name: "saslDigestMD5",
					scheme: #{
						type: "sasl",
						mechanism: "DIGEST-MD5"
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
    expect(securitySchemes?.saslDigestMD5).toBeDefined();
    expect(securitySchemes?.saslDigestMD5.type).toBe("sasl");
  });

  it("should support SASL ANONYMOUS", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace SASLAnonymous;

				model Msg { data: string; }

				@channel("anon")
				@security(#{
					name: "saslAnonymous",
					scheme: #{
						type: "sasl",
						mechanism: "ANONYMOUS"
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
    expect(securitySchemes?.saslAnonymous).toBeDefined();
    expect(securitySchemes?.saslAnonymous.type).toBe("sasl");
  });

  it("should support X.509 Client Certificates", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace X509;

				model Msg { data: string; }

				@channel("cert")
				@security(#{
					name: "x509",
					scheme: #{
						type: "X509",
						certificateValidation: true
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
    expect(securitySchemes?.x509).toBeDefined();
    expect(securitySchemes?.x509.type).toBe("X509");
  });

  it("should reject unsupported security scheme type 'asymmetricEncryption'", async () => {
    const { diagnostics } = await compileAsyncAPISpecRaw(`
      import "@lars-artmann/typespec-asyncapi";
      using TypeSpec.AsyncAPI;

      namespace AsymmetricKey;

      model Msg {
        publicKey: string;
        signature: string;
      }

      @channel("asymmetric")
      @security(#{
        name: "asymKey",
        scheme: #{
          type: "asymmetricEncryption",
          algorithm: "RSA-2048"
        }
      })
      @publish
      op publishMessage(): Msg;
    `);

    const errors = diagnostics.filter(
      (d) => d.severity === "error" && d.message.includes("Unsupported security scheme type"),
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("asymmetricEncryption");
  });

  it("should reject unsupported security scheme type 'symmetricEncryption'", async () => {
    const { diagnostics } = await compileAsyncAPISpecRaw(`
      import "@lars-artmann/typespec-asyncapi";
      using TypeSpec.AsyncAPI;

      namespace SymmetricKey;

      model Msg {
        keyId: string;
        encryptedData: bytes;
      }

      @channel("symmetric")
      @security(#{
        name: "symKey",
        scheme: #{
          type: "symmetricEncryption",
          algorithm: "AES-256-GCM"
        }
      })
      @publish
      op publishMessage(): Msg;
    `);

    const errors = diagnostics.filter(
      (d) => d.severity === "error" && d.message.includes("Unsupported security scheme type"),
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("symmetricEncryption");
  });

  it("should support Plain Text (No Authentication)", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace PlainText;

				model Msg { data: string; }

				@channel("plain")
				@security(#{
					name: "plain",
					scheme: #{
						type: "plain"
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
    expect(securitySchemes?.plain).toBeDefined();
    expect(securitySchemes?.plain.type).toBe("plain");
  });
});
