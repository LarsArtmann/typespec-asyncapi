import type {DecoratorContext, Model, Operation} from "@typespec/compiler"
import {$lib, reportDiagnostic} from "../lib.js"
import {Effect} from "effect"
import type {SecurityConfig} from "./securityConfig.js"
import type {SecurityScheme} from "./securityScheme.js"
// TODO: DEAD IMPORT! COMMENTED IMPORT INDICATES INCOMPLETE REFACTORING!
// TODO: CRITICAL FAILURE - Either import and use effectLogging or remove the comment!
// import {effectLogging} from "../utils/effect-helpers.js"

//TODO: LIBRARY REINVENTION VIOLATION! "Is there no OAuth TypeScript Types library we can use??" 
//TODO: CRITICAL ARCHITECTURAL FAILURE - We're reinventing OAuth/SASL/OpenID standards instead of using existing libraries!
//TODO: BUSINESS LOGIC DISASTER - Custom security type definitions will diverge from standards and cause interoperability issues!
//TODO: MAINTAINABILITY NIGHTMARE - When OAuth 2.1 or new SASL mechanisms are added, we have to update THIS FILE instead of upgrading a library!
//TODO: RESEARCH IMMEDIATELY - Use @types/oauth2, @types/sasl, or standard security libraries!


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

	// Validate security scheme with null check
	if (!config?.scheme) {
		Effect.log(`❌ Security config or scheme is missing:`, { config, scheme: config?.scheme })
		reportDiagnostic(context, target, "invalid-security-scheme", {
			scheme: "Security configuration is missing scheme property",
		})
		return
	}

	const validationResult = validateSecurityScheme(config.scheme)
	if (validationResult.errors.length > 0) {
		reportDiagnostic(context, target, "invalid-security-scheme", {
			scheme: validationResult.errors.join(", "),
		})
		return
	}

	// TODO: Add logValidationWarnings method to effectLogging
	// yield* effectLogging.logValidationWarnings("Security scheme", validationResult.warnings)
	// TODO: Remove old duplication below - replaced with shared utility
	// if (false && validationResult.warnings.length > 0) {
//		Effect.log(`�  Security scheme validation warnings:`, validationResult.warnings)
//		validationResult.warnings.forEach(warning => {
//			Effect.log(`�  ${warning}`)
//		})
//	}

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
			//TODO: HARDCODED ARRAY! EXTRACT TO CONSTANT!
			//TODO: CRITICAL FAILURE - validApiKeyLocations array is defined inline instead of using constants!
			//TODO: BUSINESS LOGIC VIOLATION - API key locations should be configurable by AsyncAPI spec version!
			//TODO: MAINTAINABILITY DISASTER - When AsyncAPI adds new locations, we modify code instead of config!
			const validApiKeyLocations = ["user", "password", "query", "header", "cookie"]
			if (!validApiKeyLocations.includes(apiKeyScheme.in)) {
				errors.push(`Invalid API key location: ${apiKeyScheme.in}. Must be one of: ${validApiKeyLocations.join(", ")}`)
			}
			break
		}

		case "http": {
			const httpScheme = scheme
			//TODO: MORE HARDCODED BULLSHIT! HTTP SCHEMES ARRAY IS INLINE GARBAGE!
			//TODO: CRITICAL STANDARDS VIOLATION - HTTP auth schemes should come from IANA HTTP Authentication Scheme Registry!
			//TODO: MAINTAINABILITY FAILURE - When new HTTP auth schemes are standardized, we modify SOURCE CODE!
			//TODO: PROPER SOLUTION - Import from standards-compliant library or fetch from IANA registry!
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
			const flows = scheme.flows
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
			// openIdConnectUrl is required in the type, so this check is unnecessary
			try {
				new URL(scheme.openIdConnectUrl)
			} catch {
				errors.push("OpenID Connect URL must be a valid URL")
			}
			break
		}

		case "sasl": {
			const saslScheme = scheme
			//TODO: YET ANOTHER HARDCODED ARRAY! SASL MECHANISMS ARE STANDARDIZED BY IANA!
			//TODO: CRITICAL STANDARDS VIOLATION - SASL mechanisms should come from IANA SASL Mechanism Registry!
			//TODO: INCOMPLETE MECHANISM LIST - Missing EXTERNAL, ANONYMOUS, OTP, DIGEST-MD5, and others!
			//TODO: SECURITY RISK - Hardcoded list may exclude newer, more secure mechanisms!
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

//TODO: "COMMON" SECURITY SCHEMES ARE HARDCODED OPINIONATED GARBAGE!
//TODO: CRITICAL ARCHITECTURAL FAILURE - What's "common" for one application is wrong for another!
//TODO: NAMING VIOLATION - "bearerAuth" name is generic and will cause conflicts in real applications!
//TODO: BUSINESS LOGIC ASSUMPTION - JWT format assumption may not apply to all bearer tokens!
//TODO: CONFIGURATION DISASTER - These should be user-configurable templates, not hardcoded presets!
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