/**
 * Security Schemes Tests
 */

import {
  compileAndGetAsyncAPI,
  createAsyncAPITestHost,
} from "../utils/test-helpers.js";

describe("oAuth2 Flows", () => {
  it("should support OAuth2 Authorization Code flow", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2AuthCode;

				model Msg { data: string; }

				@channel("oauth")
				@security(#{
					name: "oauth2",
					scheme: #{
						type: "oauth2",
						flows: #{
							authorizationCode: #{
								authorizationUrl: "https://auth.example.com/authorize",
								tokenUrl: "https://auth.example.com/token",
								scopes: #{
									readAccess: "Read access",
									writeAccess: "Write access"
								}
							}
						}
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
    expect(securitySchemes?.oauth2).toBeDefined();
    expect(securitySchemes?.oauth2.type).toBe("oauth2");
    expect(securitySchemes?.oauth2.flows).toBeDefined();
  });

  it("should support OAuth2 Client Credentials flow", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2ClientCreds;

				model Msg { data: string; }

				@channel("client")
				@security(#{
					name: "oauth2Client",
					scheme: #{
						type: "oauth2",
						flows: #{
							clientCredentials: #{
								tokenUrl: "https://auth.example.com/token",
								scopes: #{
									apiRead: "API read",
									apiWrite: "API write"
								}
							}
						}
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
    expect(securitySchemes?.oauth2Client).toBeDefined();
    expect(securitySchemes?.oauth2Client.type).toBe("oauth2");
    expect(securitySchemes?.oauth2Client.flows).toBeDefined();
  });

  it("should support OAuth2 Implicit flow", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2Implicit;

				model Msg { data: string; }

				@channel("implicit")
				@security(#{
					name: "oauth2Implicit",
					scheme: #{
						type: "oauth2",
						flows: #{
							implicit: #{
								authorizationUrl: "https://auth.example.com/authorize",
								scopes: #{
									profile: "User profile",
									emailAccess: "Email access"
								}
							}
						}
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
    expect(securitySchemes?.oauth2Implicit).toBeDefined();
    expect(securitySchemes?.oauth2Implicit.type).toBe("oauth2");
  });

  it("should support OAuth2 Password flow (Resource Owner)", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2Password;

				model Msg { data: string; }

				@channel("password")
				@security(#{
					name: "oauth2Password",
					scheme: #{
						type: "oauth2",
						flows: #{
							password: #{
								tokenUrl: "https://auth.example.com/token",
								scopes: #{
									user: "User scope"
								}
							}
						}
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
    expect(securitySchemes?.oauth2Password).toBeDefined();
    expect(securitySchemes?.oauth2Password.type).toBe("oauth2");
  });

  it("should support OAuth2 with multiple flows", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2Multi;

				model Msg { data: string; }

				@channel("multi")
				@security(#{
					name: "oauth2Multi",
					scheme: #{
						type: "oauth2",
						flows: #{
							authorizationCode: #{
								authorizationUrl: "https://auth.example.com/authorize",
								tokenUrl: "https://auth.example.com/token",
								scopes: #{ readScope: "Read" }
							},
							clientCredentials: #{
								tokenUrl: "https://auth.example.com/token",
								scopes: #{ admin: "Admin" }
							}
						}
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
    expect(securitySchemes?.oauth2Multi).toBeDefined();
    expect(securitySchemes?.oauth2Multi.type).toBe("oauth2");
  });

  it("should support OAuth2 with PKCE", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2PKCE;

				model Msg { data: string; }

				@channel("pkce")
				@security(#{
					name: "oauth2PKCE",
					scheme: #{
						type: "oauth2",
						flows: #{
							authorizationCode: #{
								authorizationUrl: "https://auth.example.com/authorize",
								tokenUrl: "https://auth.example.com/token",
								pkce: true,
								scopes: #{ openid: "OpenID" }
							}
						}
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
    expect(securitySchemes?.oauth2PKCE).toBeDefined();
    expect(securitySchemes?.oauth2PKCE.type).toBe("oauth2");
    expect(securitySchemes?.oauth2PKCE.flows).toBeDefined();
  });

  it("should support OAuth2 with refresh tokens", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2Refresh;

				model Msg {
					refreshToken: string;
					data: string;
				}

				@channel("refresh")
				@security(#{
					name: "oauth2Refresh",
					scheme: #{
						type: "oauth2",
						flows: #{
							authorizationCode: #{
								authorizationUrl: "https://auth.example.com/authorize",
								tokenUrl: "https://auth.example.com/token",
								refreshUrl: "https://auth.example.com/refresh",
								scopes: #{ offlineAccess: "Offline access" }
							}
						}
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
    expect(securitySchemes?.oauth2Refresh.type).toBe("oauth2");
    expect(
      securitySchemes?.oauth2Refresh.flows?.authorizationCode,
    ).toBeDefined();
  });

  it("should support OAuth2 with OpenID Connect", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2OIDC;

				model Msg { data: string; }

				@channel("oidc")
				@security(#{
					name: "oauth2OIDC",
					scheme: #{
						type: "oauth2",
						flows: #{
							authorizationCode: #{
								authorizationUrl: "https://auth.example.com/authorize",
								tokenUrl: "https://auth.example.com/token",
								scopes: #{
									openid: "OpenID",
									profile: "Profile",
									emailScope: "Email"
								}
							}
						}
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
    expect(securitySchemes?.oauth2OIDC).toBeDefined();
    expect(securitySchemes?.oauth2OIDC.type).toBe("oauth2");
  });

  it("should support OAuth2 with dynamic scopes", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2DynamicScopes;

				model Msg {
					scopes: string[];
					data: string;
				}

				@channel("dynamic")
				@security(#{
					name: "oauth2Dynamic",
					scheme: #{
						type: "oauth2",
						flows: #{
							authorizationCode: #{
								authorizationUrl: "https://auth.example.com/authorize",
								tokenUrl: "https://auth.example.com/token",
								dynamicScopes: true,
								scopes: #{ resourceAll: "Resource access" }
							}
						}
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
    expect(securitySchemes?.oauth2Dynamic).toBeDefined();
    expect(securitySchemes?.oauth2Dynamic.type).toBe("oauth2");
    expect(securitySchemes?.oauth2Dynamic.flows).toBeDefined();
  });

  it("should support OAuth2 with audience restriction", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2Audience;

				model Msg {
					audience: string;
					data: string;
				}

				@channel("audience")
				@security(#{
					name: "oauth2Aud",
					scheme: #{
						type: "oauth2",
						flows: #{
							clientCredentials: #{
								tokenUrl: "https://auth.example.com/token",
								audience: "api.example.com",
								scopes: #{ api: "API" }
							}
						}
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
    expect(securitySchemes?.oauth2Aud).toBeDefined();
    expect(securitySchemes?.oauth2Aud.type).toBe("oauth2");
  });

  it("should support OAuth2 Device Authorization Grant", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2Device;

				model Msg {
					deviceCode: string;
					userCode: string;
				}

				@channel("device")
				@security(#{
					name: "oauth2Device",
					scheme: #{
						type: "oauth2",
						flows: #{
							deviceCode: #{
								deviceAuthorizationUrl: "https://auth.example.com/device",
								tokenUrl: "https://auth.example.com/token",
								scopes: #{ device: "Device" }
							}
						}
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
    expect(securitySchemes?.oauth2Device).toBeDefined();
    expect(securitySchemes?.oauth2Device.type).toBe("oauth2");
  });

  it("should support OAuth2 Token Exchange (RFC 8693)", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2TokenExchange;

				model Msg {
					subjectToken: string;
					actorToken: string;
				}

				@channel("exchange")
				@security(#{
					name: "oauth2Exchange",
					scheme: #{
						type: "oauth2",
						flows: #{
							tokenExchange: #{
								tokenUrl: "https://auth.example.com/token",
								scopes: #{ exchange: "Exchange" }
							}
						}
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
    expect(securitySchemes?.oauth2Exchange).toBeDefined();
    expect(securitySchemes?.oauth2Exchange.type).toBe("oauth2");
  });

  it("should support OAuth2 JWT Bearer Grant (RFC 7523)", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2JWTBearer;

				model Msg {
					assertion: string;
					data: string;
				}

				@channel("jwt-bearer")
				@security(#{
					name: "oauth2JWTBearer",
					scheme: #{
						type: "oauth2",
						flows: #{
							jwtBearer: #{
								tokenUrl: "https://auth.example.com/token",
								scopes: #{ service: "Service" }
							}
						}
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
    expect(securitySchemes?.oauth2JWTBearer).toBeDefined();
    expect(securitySchemes?.oauth2JWTBearer.type).toBe("oauth2");
  });

  it("should support OAuth2 SAML Bearer Grant (RFC 7522)", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2SAMLBearer;

				model Msg {
					samlAssertion: string;
					data: string;
				}

				@channel("saml-bearer")
				@security(#{
					name: "oauth2SAMLBearer",
					scheme: #{
						type: "oauth2",
						flows: #{
							samlBearer: #{
								tokenUrl: "https://auth.example.com/token",
								scopes: #{ saml: "SAML" }
							}
						}
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
    expect(securitySchemes?.oauth2SAMLBearer).toBeDefined();
    expect(securitySchemes?.oauth2SAMLBearer.type).toBe("oauth2");
  });

  it("should support OAuth2 with token introspection", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2Introspection;

				model Msg {
					introspectionUrl: string;
					data: string;
				}

				@channel("introspect")
				@security(#{
					name: "oauth2Introspect",
					scheme: #{
						type: "oauth2",
						flows: #{
							clientCredentials: #{
								tokenUrl: "https://auth.example.com/token",
								introspectionUrl: "https://auth.example.com/introspect",
								scopes: #{ introspect: "Introspect" }
							}
						}
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
    expect(securitySchemes?.oauth2Introspect).toBeDefined();
    expect(securitySchemes?.oauth2Introspect.type).toBe("oauth2");
  });

  it("should support OAuth2 with token revocation", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2Revocation;

				model Msg {
					revocationUrl: string;
					data: string;
				}

				@channel("revoke")
				@security(#{
					name: "oauth2Revoke",
					scheme: #{
						type: "oauth2",
						flows: #{
							authorizationCode: #{
								authorizationUrl: "https://auth.example.com/authorize",
								tokenUrl: "https://auth.example.com/token",
								revocationUrl: "https://auth.example.com/revoke",
								scopes: #{ revoke: "Revoke" }
							}
						}
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
    expect(securitySchemes?.oauth2Revoke).toBeDefined();
    expect(securitySchemes?.oauth2Revoke.type).toBe("oauth2");
  });

  it("should support OAuth2 with scope negotiation", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2ScopeNegotiation;

				model Msg {
					requestedScopes: string[];
					grantedScopes: string[];
				}

				@channel("negotiate")
				@security(#{
					name: "oauth2Negotiate",
					scheme: #{
						type: "oauth2",
						flows: #{
							authorizationCode: #{
								authorizationUrl: "https://auth.example.com/authorize",
								tokenUrl: "https://auth.example.com/token",
								scopeNegotiation: true,
								scopes: #{
									basic: "Basic access",
									advanced: "Advanced access"
								}
							}
						}
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
    expect(securitySchemes?.oauth2Negotiate).toBeDefined();
    expect(securitySchemes?.oauth2Negotiate.type).toBe("oauth2");
  });

  it("should support OAuth2 with consent management", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2Consent;

				model Msg {
					consentId: string;
					consents: string[];
				}

				@channel("consent")
				@security(#{
					name: "oauth2Consent",
					scheme: #{
						type: "oauth2",
						flows: #{
							authorizationCode: #{
								authorizationUrl: "https://auth.example.com/authorize",
								tokenUrl: "https://auth.example.com/token",
								consentUrl: "https://auth.example.com/consent",
								scopes: #{ consent: "Consent" }
							}
						}
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
    expect(securitySchemes?.oauth2Consent).toBeDefined();
    expect(securitySchemes?.oauth2Consent.type).toBe("oauth2");
  });

  it("should support OAuth2 with session management", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2Session;

				model Msg {
					sessionId: string;
					sessionState: string;
				}

				@channel("session")
				@security(#{
					name: "oauth2Session",
					scheme: #{
						type: "oauth2",
						flows: #{
							authorizationCode: #{
								authorizationUrl: "https://auth.example.com/authorize",
								tokenUrl: "https://auth.example.com/token",
								sessionManagement: true,
								scopes: #{ session: "Session" }
							}
						}
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
    expect(securitySchemes?.oauth2Session).toBeDefined();
    expect(securitySchemes?.oauth2Session.type).toBe("oauth2");
  });

  it("should transform legacy 'scopes' key to 'availableScopes' in output", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2ScopesNormalization;

				model Msg { data: string; }

				@channel("scopes-norm")
				@security(#{
					name: "oauth2LegacyScopes",
					scheme: #{
						type: "oauth2",
						flows: #{
							authorizationCode: #{
								authorizationUrl: "https://auth.example.com/authorize",
								tokenUrl: "https://auth.example.com/token",
								scopes: #{
									legacyRead: "Legacy read"
								}
							}
						}
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    const scheme = spec?.components?.securitySchemes?.oauth2LegacyScopes;
    expect(scheme).toBeDefined();
    const flow = scheme?.flows?.authorizationCode as
      Record<string, unknown> | undefined;
    expect(flow).toBeDefined();
    expect(flow?.availableScopes).toStrictEqual({ legacyRead: "Legacy read" });
    expect(flow?.scopes).toBeUndefined();
  });

  it("should pass through 'availableScopes' key unchanged in output", async () => {
    const host = await createAsyncAPITestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
				import "@lars-artmann/typespec-asyncapi";
				using TypeSpec.AsyncAPI;

				namespace OAuth2AvailableScopesPassthrough;

				model Msg { data: string; }

				@channel("avail-scopes")
				@security(#{
					name: "oauth2AvailScopes",
					scheme: #{
						type: "oauth2",
						flows: #{
							clientCredentials: #{
								tokenUrl: "https://auth.example.com/token",
								availableScopes: #{
									modernRead: "Modern read"
								}
							}
						}
					}
				})
				@publish
				op publishMessage(): Msg;
			`,
    );

    const spec = await compileAndGetAsyncAPI(host, "./main.tsp");
    expect(spec).toBeDefined();
    const scheme = spec?.components?.securitySchemes?.oauth2AvailScopes;
    expect(scheme).toBeDefined();
    const flow = scheme?.flows?.clientCredentials as
      Record<string, unknown> | undefined;
    expect(flow).toBeDefined();
    expect(flow?.availableScopes).toStrictEqual({ modernRead: "Modern read" });
    expect(flow?.scopes).toBeUndefined();
  });
});
