/**
 * @security decorator for defining AsyncAPI security schemes
 * 
 * Enhanced implementation with TypeSpec State Map Integration
 * Fixes securitySchemes: {} issue by properly storing configurations
 * in TypeSpec state map for document generation processing.
 *
 * Applies security scheme information to operations, channels, or servers.
 * Supports API key, HTTP auth, OAuth 2.0, OpenID Connect, SASL, X.509, and encryption schemes.
 * Uses industry-standard security libraries instead of custom implementations.
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

import type {DecoratorContext, Model, Operation, Program} from "@typespec/compiler"
import {$lib, reportDiagnostic} from "../../lib.js"
import {Effect} from "effect"
import type {SecurityConfig} from "./securityConfig.js"

// ✅ LIBRARY-BASED SECURITY IMPLEMENTATION
// Using industry-standard security libraries instead of custom implementations
import {
	OAUTH2_LIBRARIES,
	SASL_LIBRARIES,
	OPENID_LIBRARIES,
	IANA_HTTP_SCHEMES,
	IANA_SASL_MECHANISMS,
	ASYNCAPI_API_KEY_LOCATIONS,
	validateOAuth2Scheme,
	validateSaslMechanism,
	validateHttpScheme
} from "../../constants/security-standards.js"

// SECURITY CONFIGS STATE MAP KEY
export const SECURITY_CONFIGS_KEY = Symbol("security-configs")

/**
 * Type guard functions to ensure type safety
 */
const isModel = (value: unknown): value is Model => {
	return typeof value === 'object' && value !== null && 'kind' in value && (value as Model & {kind: string}).kind === 'Model'
}

const isOperation = (value: unknown): value is Operation => {
	return typeof value === 'object' && value !== null && 'kind' in value && (value as Operation & {kind: string}).kind === 'Operation'
}

/**
 * Enhanced security scheme validation with @secret decorator support for TypeSpec 1.5.0
 * 
 * This validation identifies fields that should use @secret decorator in TypeSpec 1.5.0:
 * - API key values, bearer tokens, OAuth credentials, SASL mechanisms
 * - X.509 certificates, encryption keys, OpenID Connect URLs
 */
function validateSecurityScheme(scheme: any): { valid: boolean; errors: string[]; warnings: string[]; secretFields: string[] } {
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
			// TypeSpec 1.5.0: OAuth credentials should use @secret decorator
			secretFields.push("clientSecret", "tokenUrl", "authorizationUrl", "refreshUrl")
			break
		}

		case "openIdConnect": {
			const openIdConfig = scheme
			if (!openIdConfig.openIdConnectUrl) {
				errors.push("OpenID Connect scheme must have openIdConnectUrl")
			}
			// TypeSpec 1.5.0: OpenID URL should use @secret decorator
			secretFields.push("openIdConnectUrl")
			break
		}

		case "sasl": {
			const saslScheme = scheme
			// ✅ LIBRARY-BASED: Use @xmpp/sasl validated SASL mechanism validation
			if (saslScheme.mechanism) {
				const validation = validateSaslMechanism(saslScheme.mechanism)
				if (!validation.valid) {
					errors.push(...validation.errors)
				}
			}
			// TypeSpec 1.5.0: SASL credentials should use @secret decorator
			secretFields.push("username", "password", "token")
			break
		}

		case "userPassword":
			// TypeSpec 1.5.0: User/password should use @secret decorator
			secretFields.push("username", "password")
			break

		case "X509":
			// TypeSpec 1.5.0: Certificate details should use @secret decorator
			secretFields.push("certificateChain", "privateKey")
			break

		case "symmetricEncryption":
			// TypeSpec 1.5.0: Encryption keys should use @secret decorator
			secretFields.push("encryptionKey", "encryptionAlgorithm")
			break

		case "asymmetricEncryption":
			// TypeSpec 1.5.0: Encryption keys should use @secret decorator
			secretFields.push("publicKey", "privateKey", "encryptionAlgorithm")
			break

		case "httpApiKey": {
			// AsyncAPI 3.0 extension for HTTP API key authentication
			const httpApiKeyScheme = scheme
			if (!ASYNCAPI_API_KEY_LOCATIONS.includes(httpApiKeyScheme.in as "header" | "query" | "cookie")) {
				errors.push(`Invalid HTTP API key location: ${httpApiKeyScheme.in}. Must be one of: ${ASYNCAPI_API_KEY_LOCATIONS.join(", ")}`)
			}
			// TypeSpec 1.5.0: HTTP API key should use @secret decorator
			secretFields.push("name")
			break
		}

		default:
			warnings.push(`Unknown security scheme type: ${(scheme as any).type}`)
			break
	}

	return { valid: errors.length === 0, errors, warnings, secretFields }
}

/**
 * Enhanced security decorator implementation with state map integration
 */
export const $securityEnhanced = (context: DecoratorContext, target: Model | Operation, config: Record<string, unknown>) => {
	// Store security configuration in TypeSpec state map
	const stateMap = context.program.stateMap(SECURITY_CONFIGS_KEY)
	const existingConfigs = Array.from(stateMap.entries()).filter(([key]) => key === target).map(([, value]) => value as SecurityConfig[])[0] ?? []
	
	// Validate and store security config
	const securityConfig = config as SecurityConfig
	if (!securityConfig.name || !securityConfig.scheme) {
		reportDiagnostic(context, target, "invalid-security-scheme", {
			message: "Security scheme must have 'name' and 'scheme' properties"
		})
		return // TypeScript error expects void return
	}
	
	existingConfigs.push(securityConfig)
	stateMap.set(target, existingConfigs)
	
	// Log successful registration (TypeSpec decorators are synchronous)
	// Note: Effect.log used for TypeSpec decorator logging
	Effect.log(`🔐 Enhanced security scheme registered: ${securityConfig.name}`)
}

/**
 * Get all security configurations from state map
 */
export const getSecurityConfigurations = (program: Program): Map<Model | Operation, SecurityConfig[]> => {
	const stateMap = program.stateMap(SECURITY_CONFIGS_KEY)
	const result = new Map<Model | Operation, SecurityConfig[]>()
	
	for (const [key, value] of stateMap.entries()) {
		if (isModel(key) || isOperation(key)) {
			result.set(key, value as SecurityConfig[])
		}
	}
	
	return result
}

/**
 * Process security configurations into AsyncAPI document
 */
export const processSecuritySchemes = (program: Program, asyncApiDoc: Record<string, unknown>) => {
	return Effect.gen(function* () {
		const securityConfigs = getSecurityConfigurations(program)
		
		if (securityConfigs.size === 0) {
			yield* Effect.logInfo("📋 No security configurations found")
			return
		}
		
		// Initialize security schemes in document with type safety
		const doc = asyncApiDoc as {components?: {securitySchemes?: Record<string, unknown>}}
		doc.components ??= {}
		
		doc.components.securitySchemes ??= {}
		
		// Process all security configurations
		for (const [unusedTarget, configs] of securityConfigs) {
			for (const config of configs) {
				const securitySchemeData = {
					description: `Security scheme: ${config.name}`,
					...config.scheme
				}
				
				// Add to document with type safety
				doc.components.securitySchemes[config.name] = securitySchemeData
				
				// Type-safe scheme type logging
				const schemeType = (config.scheme as {type?: string}).type ?? 'unknown'
				yield* Effect.logInfo(`🔧 Processed security scheme: ${config.name} (${schemeType})`)
			}
		}
		
		yield* Effect.logInfo(`✅ Security schemes processing complete: ${Object.keys(doc.components.securitySchemes).length} schemes`)
	})
}
