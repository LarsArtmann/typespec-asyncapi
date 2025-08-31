import type {DecoratorContext, Model, Operation} from "@typespec/compiler"
import {$lib, reportDiagnostic} from "../lib"
import {Effect} from "effect"

//TODO: Is there no OAuth TypeScript Types library we can use??


export type SecuritySchemeType =
	"apiKey"
	| "http"
	| "oauth2"
	| "openIdConnect"
	| "sasl"
	| "x509"
	| "symmetricEncryption"
	| "asymmetricEncryption";

export type ApiKeySecurityScheme = {
	type: "apiKey";
	/** Location of the API key */
	in: "user" | "password" | "query" | "header" | "cookie";
	/** Description of the security scheme */
	description?: string;
}

export type HttpSecurityScheme = {
	type: "http";
	/** HTTP authentication scheme */
	scheme: "basic" | "bearer" | "digest" | "hoba" | "mutual" | "negotiate" | "oauth" | "scram-sha-1" | "scram-sha-256" | "vapid";
	/** Bearer format (for bearer scheme) */
	bearerFormat?: string;
	/** Description of the security scheme */
	description?: string;
}

export type OAuth2SecurityScheme = {
	type: "oauth2";
	/** OAuth 2.0 flows */
	flows: {
		implicit?: {
			authorizationUrl: string;
			scopes: Record<string, string>;
		};
		password?: {
			tokenUrl: string;
			refreshUrl?: string;
			scopes: Record<string, string>;
		};
		clientCredentials?: {
			tokenUrl: string;
			refreshUrl?: string;
			scopes: Record<string, string>;
		};
		authorizationCode?: {
			authorizationUrl: string;
			tokenUrl: string;
			refreshUrl?: string;
			scopes: Record<string, string>;
		};
	};
	/** Description of the security scheme */
	description?: string;
}

export type OpenIdConnectSecurityScheme = {
	type: "openIdConnect";
	/** OpenID Connect URL */
	openIdConnectUrl: string;
	/** Description of the security scheme */
	description?: string;
}

export type SaslSecurityScheme = {
	type: "sasl";
	/** SASL mechanism */
	mechanism: "PLAIN" | "SCRAM-SHA-256" | "SCRAM-SHA-512" | "GSSAPI";
	/** Description of the security scheme */
	description?: string;
}

export type X509SecurityScheme = {
	type: "x509";
	/** Description of the security scheme */
	description?: string;
}

export type SymmetricEncryptionSecurityScheme = {
	type: "symmetricEncryption";
	/** Description of the security scheme */
	description?: string;
}

export type AsymmetricEncryptionSecurityScheme = {
	type: "asymmetricEncryption";
	/** Description of the security scheme */
	description?: string;
}

export type SecurityScheme =
	| ApiKeySecurityScheme
	| HttpSecurityScheme
	| OAuth2SecurityScheme
	| OpenIdConnectSecurityScheme
	| SaslSecurityScheme
	| X509SecurityScheme
	| SymmetricEncryptionSecurityScheme
	| AsymmetricEncryptionSecurityScheme;

export type SecurityConfig = {
	/** Security scheme name */
	name: string;
	/** Security scheme configuration */
	scheme: SecurityScheme;
	/** Required scopes (for OAuth2 and OpenID Connect) */
	scopes?: string[];
	/** Additional security metadata */
	metadata?: Record<string, unknown>;
}

/**
 * @security decorator for defining AsyncAPI security schemes
 *
 * Applies security scheme information to operations, channels, or servers.
 * Supports API key, HTTP auth, OAuth 2.0, OpenID Connect, SASL, X.509, and encryption schemes.
 *
 * @example
 * ```typespec
 * @security({
 *   name: "kafkaAuth",
 *   scheme: {
 *     type: "sasl",
 *     mechanism: "SCRAM-SHA-256"
 *   }
 * })
 * @server("kafka-server", "kafka://localhost:9092", "kafka")
 * namespace MyKafkaAPI;
 *
 * @security({
 *   name: "bearerAuth", 
 *   scheme: {
 *     type: "http",
 *     scheme: "bearer",
 *     bearerFormat: "JWT"
 *   }
 * })
 * @channel("user.events")
 * @publish
 * op publishUserEvent(@message event: UserEvent): void;
 * ```
 */
export function $security(
	context: DecoratorContext,
	target: Operation | Model,
	config: SecurityConfig,
): void {
	Effect.log(`=
 PROCESSING @security decorator on: ${target.kind} ${target.name || 'unnamed'}`)
	Effect.log(`=� Security config:`, config)
	Effect.log(`<�  Target type: ${target.kind}`)

	// Target is already constrained to Operation | Model - no validation needed

	// SecurityConfig type ensures name and scheme are defined by TypeScript
	// No runtime validation needed

	// Validate security scheme
	const validationResult = validateSecurityScheme(config.scheme)
	if (validationResult.errors.length > 0) {
		reportDiagnostic(context, target, "invalid-security-scheme", {
			scheme: validationResult.errors.join(", "),
		})
		return
	}

	if (validationResult.warnings.length > 0) {
		Effect.log(`�  Security scheme validation warnings:`, validationResult.warnings)
		validationResult.warnings.forEach(warning => {
			Effect.log(`�  ${warning}`)
		})
	}

	Effect.log(`=� Validated security config for ${config.name}:`, config)

	// Store security configuration in program state
	const securityMap = context.program.stateMap($lib.stateKeys.securityConfigs)
	securityMap.set(target, config)

	Effect.log(` Successfully stored security config for ${target.kind} ${target.name || 'unnamed'}`)
	Effect.log(`=� Total entities with security config: ${securityMap.size}`)
}

/**
 * Validate security scheme configuration
 */
function validateSecurityScheme(scheme: SecurityScheme): { valid: boolean; errors: string[]; warnings: string[] } {
	const errors: string[] = []
	const warnings: string[] = []

	switch (scheme.type) {
		case "apiKey": {
			const apiKeyScheme = scheme
			const validApiKeyLocations = ["user", "password", "query", "header", "cookie"]
			if (!validApiKeyLocations.includes(apiKeyScheme.in)) {
				errors.push(`Invalid API key location: ${apiKeyScheme.in}. Must be one of: ${validApiKeyLocations.join(", ")}`)
			}
			break
		}

		case "http": {
			const httpScheme = scheme
			const validHttpSchemes = ["basic", "bearer", "digest", "hoba", "mutual", "negotiate", "oauth", "scram-sha-1", "scram-sha-256", "vapid"]
			if (!validHttpSchemes.includes(httpScheme.scheme)) {
				errors.push(`Invalid HTTP scheme: ${httpScheme.scheme}. Must be one of: ${validHttpSchemes.join(", ")}`)
			}
			if (httpScheme.scheme === "bearer" && !httpScheme.bearerFormat) {
				warnings.push("Bearer scheme should specify bearerFormat for clarity")
			}
			break
		}

		case "oauth2": {
			const oauth2Scheme = scheme
			const flows = oauth2Scheme.flows
			if (Object.keys(flows).length === 0) {
				errors.push("OAuth2 scheme must define at least one flow")
			}

			// Validate each flow
			Object.entries(flows).forEach(([flowType, flow]) => {
				if (flow) {
					if (flowType === "implicit" || flowType === "authorizationCode") {
						if (!("authorizationUrl" in flow && flow.authorizationUrl)) {
							errors.push(`${flowType} flow must have authorizationUrl`)
						}
					}
					if (flowType === "password" || flowType === "clientCredentials" || flowType === "authorizationCode") {
						if (!("tokenUrl" in flow && flow.tokenUrl)) {
							errors.push(`${flowType} flow must have tokenUrl`)
						}
					}
					if (Object.keys(flow.scopes).length === 0) {
						warnings.push(`${flowType} flow should define scopes`)
					}
				}
			})
			break
		}

		case "openIdConnect": {
			const oidcScheme = scheme
			// openIdConnectUrl is required in the type, so this check is unnecessary
			try {
				new URL(oidcScheme.openIdConnectUrl)
			} catch {
				errors.push("OpenID Connect URL must be a valid URL")
			}
			break
		}

		case "sasl": {
			const saslScheme = scheme
			const validSaslMechanisms = ["PLAIN", "SCRAM-SHA-256", "SCRAM-SHA-512", "GSSAPI"]
			if (!validSaslMechanisms.includes(saslScheme.mechanism)) {
				errors.push(`Invalid SASL mechanism: ${saslScheme.mechanism}. Must be one of: ${validSaslMechanisms.join(", ")}`)
			}
			break
		}

		case "x509":
		case "symmetricEncryption":
		case "asymmetricEncryption":
			// These schemes don't require additional validation beyond type
			break

		default:
			// TypeScript exhaustiveness check - this should never be reached
			errors.push(`Unknown security scheme type: ${(scheme as { type?: string }).type || "unknown"}`)
	}

	return {valid: errors.length === 0, errors, warnings}
}

/**
 * Get security configuration for a target
 */
export function getSecurityConfig(context: DecoratorContext, target: Operation | Model): SecurityConfig | undefined {
	const securityMap = context.program.stateMap($lib.stateKeys.securityConfigs)
	return securityMap.get(target) as SecurityConfig | undefined
}

/**
 * Check if a target has security configuration
 */
export function hasSecurityConfig(context: DecoratorContext, target: Operation | Model): boolean {
	const securityMap = context.program.stateMap($lib.stateKeys.securityConfigs)
	return securityMap.has(target)
}

/**
 * Get all security configurations in the program
 */
export function getAllSecurityConfigs(context: DecoratorContext): Map<Operation | Model, SecurityConfig> {
	return context.program.stateMap($lib.stateKeys.securityConfigs) as Map<Operation | Model, SecurityConfig>
}

/**
 * Common security schemes for quick setup
 */
export const commonSecuritySchemes = {
	/** JWT Bearer token authentication */
	jwtBearer: {
		name: "bearerAuth",
		scheme: {
			type: "http" as const,
			scheme: "bearer",
			bearerFormat: "JWT",
		},
	},

	/** Basic HTTP authentication */
	basicAuth: {
		name: "basicAuth",
		scheme: {
			type: "http" as const,
			scheme: "basic",
		},
	},

	/** API key in header */
	apiKeyHeader: {
		name: "apiKeyAuth",
		scheme: {
			type: "apiKey" as const,
			in: "header" as const,
		},
	},

	/** Kafka SASL authentication */
	kafkaSasl: {
		name: "kafkaAuth",
		scheme: {
			type: "sasl" as const,
			mechanism: "SCRAM-SHA-256" as const,
		},
	},

	/** OAuth 2.0 client credentials flow */
	oauth2ClientCredentials: {
		name: "oauth2Auth",
		scheme: {
			type: "oauth2" as const,
			flows: {
				clientCredentials: {
					tokenUrl: "https://example.com/oauth/token",
					scopes: {},
				},
			},
		},
	},
} as const