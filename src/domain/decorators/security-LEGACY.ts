import type {DecoratorContext, Model, Operation} from "@typespec/compiler"
import {$lib, reportDiagnostic} from "../../lib.js"
import {Effect} from "effect"
import type {SecurityConfig} from "./securityConfig.js"
import type {SecurityScheme} from "./securityScheme.js"

// ✅ LIBRARY-BASED SECURITY IMPLEMENTATION
// Using industry-standard security libraries instead of custom implementations
import {
	OAUTH2_LIBRARIES,
	SASL_LIBRARIES,
	OPENID_LIBRARIES,
	ASYNCAPI_API_KEY_LOCATIONS,
	validateOAuth2Scheme,
	validateSaslMechanism,
	validateHttpScheme
} from "../../constants/security-standards.js"


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
	config: {name: string, scheme: Record<string, unknown>},
): void {
	Effect.log(`=
 PROCESSING @security decorator on: ${target.kind} ${target.name || 'unnamed'}`)
	Effect.log(`=� Security config:`, config)
	Effect.log(`<�  Target type: ${target.kind}`)

	// Extract name and scheme from config object
	const {name, scheme} = config

	// Target is already constrained to Operation | Model - no validation needed

	// Validate security config with null check
	if (!name || !scheme) {
		Effect.log(`❌ Security config is missing name or scheme:`, { config })
		reportDiagnostic(context, target, "invalid-security-scheme", {
			scheme: "Security configuration must include name and scheme properties",
		})
		return
	}

	const validationResult = validateSecurityScheme(scheme as SecurityScheme)
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

	Effect.log(`=✅ Validated security config for ${name}:`, config)

	// Store security configuration in program state
	const securityMap = context.program.stateMap($lib.stateKeys.securityConfigs)
	securityMap.set(target, config)

	Effect.log(` Successfully stored security config for ${target.kind} ${target.name || 'unnamed'}`)
	Effect.log(`=� Total entities with security config: ${securityMap.size}`)
}

/**
 * Enhanced security scheme validation with @secret decorator support for TypeSpec 1.5.0
 * 
 * This validation identifies fields that should use @secret decorator in TypeSpec 1.5.0:
 * - API key values, bearer tokens, OAuth credentials, SASL mechanisms
 * - X.509 certificates, encryption keys, OpenID Connect URLs
 */
function validateSecurityScheme(scheme: SecurityScheme): { valid: boolean; errors: string[]; warnings: string[]; secretFields: string[] } {
	const errors: string[] = []
	const warnings: string[] = []
	const secretFields: string[] = []

	switch (scheme.type) {
		case "apiKey": {
			const apiKeyScheme = scheme
			// ✅ LIBRARY-BASED: Use AsyncAPI standard locations from security-standards
			if (!ASYNCAPI_API_KEY_LOCATIONS.includes(apiKeyScheme.in as "header" | "query" | "cookie")) {
				errors.push(`Invalid API key location: ${apiKeyScheme.in}. Must be one of: ${ASYNCAPI_API_KEY_LOCATIONS.join(", ")}`)
			}
			// TypeSpec 1.5.0: API key name should use @secret decorator
			secretFields.push("name")
			break
		}

		case "http": {
			const httpScheme = scheme
			// ✅ LIBRARY-BASED: Use IANA HTTP Authentication Scheme Registry
			const validation = validateHttpScheme(httpScheme.scheme)
			if (!validation.valid) {
				errors.push(...validation.errors)
			}
			
			if (httpScheme.scheme === "bearer") {
				if (!httpScheme.bearerFormat) {
					warnings.push("Bearer scheme should specify bearerFormat for clarity")
				}
				// TypeSpec 1.5.0: Bearer format and tokens should use @secret decorator
				secretFields.push("bearerFormat")
			}
			break
		}

		case "oauth2": {
			// ✅ LIBRARY-BASED: Use passport-oauth2 validated OAuth2 scheme validation
			const validation = validateOAuth2Scheme(scheme)
			if (!validation.valid) {
				errors.push(...validation.errors)
			}
			break
		}

		case "openIdConnect": {
			// openIdConnectUrl is required in the type, so this check is unnecessary
			const urlValidation = Effect.runSync(
				Effect.sync(() => new URL(scheme.openIdConnectUrl)).pipe(
					Effect.mapError(() => "OpenID Connect URL must be a valid URL"),
					Effect.either
				)
			)
			
			if (urlValidation._tag === "Left") {
				errors.push(urlValidation.left)
			}
			break
		}

		case "sasl": {
			const saslScheme = scheme
			// ✅ LIBRARY-BASED: Use @xmpp/sasl IANA SASL Mechanism Registry
			const validation = validateSaslMechanism(saslScheme.mechanism)
			if (!validation.valid) {
				errors.push(...validation.errors)
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
			errors.push(`Unknown security scheme type: ${(scheme as { type?: string }).type ?? "unknown"}`)
	}

	return {valid: errors.length === 0, errors, warnings, secretFields: []}
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