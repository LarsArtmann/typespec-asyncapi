/**
 * Security Schemes Tests — SASL and other security mechanisms
 *
 * Uses correct AsyncAPI 3.1 security scheme types:
 * SASL mechanisms are the TYPE value directly (plain, scramSha256, scramSha512, gssapi).
 * See https://www.asyncapi.com/docs/reference/specification/v3.1.0#securitySchemeObject
 */

import {
  compileAndGetAsyncAPI,
  compileAsyncAPISpecRaw,
  createAsyncAPITestHost,
} from "../utils/test-helpers.js";

describe("sASL & Other Security Mechanisms", () => {
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
					type: "plain",
					username: "user",
					password: "pass"
				}
			})
			@publish
			op publishMessage(): Msg;
		`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.saslPlain).toBeDefined();
    expect(securitySchemes?.saslPlain.type).toBe("plain");
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
					type: "scramSha256",
					username: "user",
					password: "pass"
				}
			})
			@publish
			op publishMessage(): Msg;
		`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.saslScram256).toBeDefined();
    expect(securitySchemes?.saslScram256.type).toBe("scramSha256");
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
					type: "scramSha512",
					username: "user",
					password: "pass"
				}
			})
			@publish
			op publishMessage(): Msg;
		`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.saslScram512).toBeDefined();
    expect(securitySchemes?.saslScram512.type).toBe("scramSha512");
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
					type: "gssapi",
					principal: "kafka/node1@EXAMPLE.COM"
				}
			})
			@publish
			op publishMessage(): Msg;
		`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.saslGSSAPI).toBeDefined();
    expect(securitySchemes?.saslGSSAPI.type).toBe("gssapi");
  });

  it("should reject invalid SASL type 'external' (not in AsyncAPI 3.1)", async () => {
    const { diagnostics } = await compileAsyncAPISpecRaw(`
      import "@lars-artmann/typespec-asyncapi";
      using TypeSpec.AsyncAPI;

      namespace SASLExternal;

      model Msg { data: string; }

      @channel("external")
      @security(#{
        name: "saslExternal",
        scheme: #{
          type: "external"
        }
      })
      @publish
      op publishMessage(): Msg;
    `);

    const errors = diagnostics.filter(
      (d) =>
        d.severity === "error" &&
        d.message.includes("Unsupported security scheme type"),
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("external");
  });

  it("should reject invalid SASL type 'oauthBearer' (not in AsyncAPI 3.1)", async () => {
    const { diagnostics } = await compileAsyncAPISpecRaw(`
      import "@lars-artmann/typespec-asyncapi";
      using TypeSpec.AsyncAPI;

      namespace SASLOAuthBearer;

      model Msg { data: string; }

      @channel("oauth")
      @security(#{
        name: "saslOAuthBearer",
        scheme: #{
          type: "oauthBearer"
        }
      })
      @publish
      op publishMessage(): Msg;
    `);

    const errors = diagnostics.filter(
      (d) =>
        d.severity === "error" &&
        d.message.includes("Unsupported security scheme type"),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it("should reject invalid SASL type 'sasl' (generic — must specify mechanism as type)", async () => {
    const { diagnostics } = await compileAsyncAPISpecRaw(`
      import "@lars-artmann/typespec-asyncapi";
      using TypeSpec.AsyncAPI;

      namespace SASLGeneric;

      model Msg { data: string; }

      @channel("generic-sasl")
      @security(#{
        name: "saslGeneric",
        scheme: #{
          type: "sasl",
          mechanism: "PLAIN"
        }
      })
      @publish
      op publishMessage(): Msg;
    `);

    const errors = diagnostics.filter(
      (d) =>
        d.severity === "error" &&
        d.message.includes("Unsupported security scheme type"),
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain("sasl");
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
					type: "X509"
				}
			})
			@publish
			op publishMessage(): Msg;
		`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes).toBeDefined();
    expect(securitySchemes?.x509).toBeDefined();
    expect(securitySchemes?.x509.type).toBe("X509");
  });

  it("should support asymmetricEncryption security scheme", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
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
					type: "asymmetricEncryption"
				}
			})
			@publish
			op publishMessage(): Msg;
		`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes?.asymKey).toBeDefined();
    expect(securitySchemes?.asymKey.type).toBe("asymmetricEncryption");
  });

  it("should support symmetricEncryption security scheme", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
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
					type: "symmetricEncryption"
				}
			})
			@publish
			op publishMessage(): Msg;
		`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
    const securitySchemes = spec?.components?.securitySchemes;
    expect(securitySchemes?.symKey).toBeDefined();
    expect(securitySchemes?.symKey.type).toBe("symmetricEncryption");
  });

  it("should support userPassword security scheme", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
			import "@lars-artmann/typespec-asyncapi";
			using TypeSpec.AsyncAPI;

			namespace UserPasswordTest;

			model Msg { data: string; }

			@channel("userpw")
			@security(#{
				name: "userPw",
				scheme: #{
					type: "userPassword"
				}
			})
			@publish
			op publishMessage(): Msg;
		`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.components?.securitySchemes?.userPw?.type).toBe(
      "userPassword",
    );
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
			@publish
			op publishMessage(): Msg;
		`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    expect(spec?.asyncapi).toBe("3.1.0");
  });
});
