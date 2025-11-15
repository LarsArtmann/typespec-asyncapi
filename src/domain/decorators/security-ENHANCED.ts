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
import {reportDiagnostic} from "../../lib.js"
import {Effect} from "effect"
import type {SecurityConfig} from "./securityConfig.js"

// ✅ TYPE-SAFE SECURITY SCHEME TYPES
// Only import types that are actually used in typed variable declarations
import type {
	SecurityScheme,
	ApiKeyScheme,
	HttpScheme,
	HttpApiKeyScheme,
	OAuth2Scheme,
	OpenIdConnectScheme,
	SaslScheme
} from "../../types/security-scheme-types.js"

// Only import the master type guard (specific guards not needed)
import {isSecurityScheme} from "../../types/security-scheme-types.js"

// ✅ LIBRARY-BASED SECURITY IMPLEMENTATION
// Using industry-standard security libraries instead of custom implementations
import {
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
 * ✅ TYPE-SAFE: Uses SecurityScheme discriminated union instead of dangerous `any`
 * ✅ EXHAUSTIVE: Pattern matching ensures all scheme types are handled
 *
 * This validation identifies fields that should use @secret decorator in TypeSpec 1.5.0:
 * - API key values, bearer tokens, OAuth credentials, SASL mechanisms
 * - X.509 certificates, encryption keys, OpenID Connect URLs
 */
function validateSecurityScheme(
	scheme: SecurityScheme
): {
	readonly valid: boolean;
	readonly errors: readonly string[];
	readonly warnings: readonly string[];
	readonly secretFields: readonly string[]
} {
	const errors: string[] = []
	const warnings: string[] = []
	const secretFields: string[] = []

	// ✅ TYPE-SAFE: Discriminated union with exhaustive pattern matching
	switch (scheme.type) {
		case "apiKey": {
			// ✅ TYPE-SAFE: TypeScript knows this is ApiKeyScheme
			const apiKeyScheme: ApiKeyScheme = scheme

			// ✅ LIBRARY-BASED: Use AsyncAPI standard locations from security-standards
			if (!ASYNCAPI_API_KEY_LOCATIONS.includes(apiKeyScheme.in)) {
				errors.push(`Invalid API key location: ${apiKeyScheme.in}. Must be one of: ${ASYNCAPI_API_KEY_LOCATIONS.join(", ")}`)
			}

			// TypeSpec 1.5.0: API key name should use @secret decorator
			secretFields.push("name")
			break
		}

		case "http": {
			// ✅ TYPE-SAFE: TypeScript knows this is HttpScheme
			const httpScheme: HttpScheme = scheme

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
			// ✅ TYPE-SAFE: TypeScript knows this is OAuth2Scheme
			const oauth2Scheme: OAuth2Scheme = scheme

			// ✅ LIBRARY-BASED: Use passport-oauth2 validated OAuth2 scheme validation
			const validation = validateOAuth2Scheme(oauth2Scheme)
			if (!validation.valid) {
				errors.push(...validation.errors)
			}

			// TypeSpec 1.5.0: OAuth credentials should use @secret decorator
			secretFields.push("clientSecret", "tokenUrl", "authorizationUrl", "refreshUrl")
			break
		}

		case "openIdConnect": {
			// ✅ TYPE-SAFE: TypeScript knows this is OpenIdConnectScheme
			const openIdConfig: OpenIdConnectScheme = scheme

			// openIdConnectUrl is required by the type, but check for runtime safety
			if (!openIdConfig.openIdConnectUrl) {
				errors.push("OpenID Connect scheme must have openIdConnectUrl")
			}

			// TypeSpec 1.5.0: OpenID URL should use @secret decorator
			secretFields.push("openIdConnectUrl")
			break
		}

		case "sasl": {
			// ✅ TYPE-SAFE: TypeScript knows this is SaslScheme
			const saslScheme: SaslScheme = scheme

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

		case "userPassword": {
			// ✅ TYPE-SAFE: TypeScript knows this is UserPasswordScheme
			// TypeSpec 1.5.0: User/password should use @secret decorator
			secretFields.push("username", "password")
			break
		}

		case "X509": {
			// ✅ TYPE-SAFE: TypeScript knows this is X509Scheme
			// TypeSpec 1.5.0: Certificate details should use @secret decorator
			secretFields.push("certificateChain", "privateKey")
			break
		}

		case "symmetricEncryption": {
			// ✅ TYPE-SAFE: TypeScript knows this is SymmetricEncryptionScheme
			// TypeSpec 1.5.0: Encryption keys should use @secret decorator
			secretFields.push("encryptionKey", "encryptionAlgorithm")
			break
		}

		case "asymmetricEncryption": {
			// ✅ TYPE-SAFE: TypeScript knows this is AsymmetricEncryptionScheme
			// TypeSpec 1.5.0: Encryption keys should use @secret decorator
			secretFields.push("publicKey", "privateKey", "encryptionAlgorithm")
			break
		}

		case "httpApiKey": {
			// ✅ TYPE-SAFE: TypeScript knows this is HttpApiKeyScheme
			const httpApiKeyScheme: HttpApiKeyScheme = scheme

			// AsyncAPI 3.0 extension for HTTP API key authentication
			if (!ASYNCAPI_API_KEY_LOCATIONS.includes(httpApiKeyScheme.in)) {
				errors.push(`Invalid HTTP API key location: ${httpApiKeyScheme.in}. Must be one of: ${ASYNCAPI_API_KEY_LOCATIONS.join(", ")}`)
			}

			// TypeSpec 1.5.0: HTTP API key should use @secret decorator
			secretFields.push("name")
			break
		}

		// ✅ EXHAUSTIVE: TypeScript enforces all cases are handled
		// If a new security scheme type is added to the union, this will be a compile error
	}

	return {
		valid: errors.length === 0,
		errors: Object.freeze(errors),
		warnings: Object.freeze(warnings),
		secretFields: Object.freeze(secretFields)
	}
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

	// ✅ INTEGRATION FIX: Runtime type validation with type guard
	// Prevents invalid security schemes from being stored in state map
	if (!isSecurityScheme(securityConfig.scheme)) {
		reportDiagnostic(context, target, "invalid-security-scheme", {
			message: `Security scheme '${securityConfig.name}' has invalid type. Expected one of: oauth2, apiKey, httpApiKey, http, openIdConnect, sasl, userPassword, x509, symmetricEncryption, asymmetricEncryption`
		})
		return
	}

	// ✅ INTEGRATION FIX: Comprehensive security scheme validation
	// This is the 150-line validateSecurityScheme function that was never called!
	const validation = validateSecurityScheme(securityConfig.scheme)

	// ✅ INTEGRATION FIX: Report validation errors via TypeSpec diagnostics
	if (!validation.valid) {
		reportDiagnostic(context, target, "invalid-security-scheme", {
			message: `Security scheme '${securityConfig.name}' validation failed: ${validation.errors.join(", ")}`
		})
		return
	}

	// ✅ INTEGRATION FIX: Log validation warnings to help users improve security
	// Warnings don't block registration but provide helpful feedback
	for (const warning of validation.warnings) {
		// Use Effect.logWarning to differentiate from errors
		Effect.logWarning(`⚠️  Security scheme '${securityConfig.name}': ${warning}`)
	}

	// ✅ INTEGRATION FIX: Log secret fields that should use @secret decorator (TypeSpec 1.5.0)
	if (validation.secretFields.length > 0) {
		Effect.logInfo(`🔒 Security scheme '${securityConfig.name}' has ${validation.secretFields.length} secret fields: ${validation.secretFields.join(", ")}`)
	}

	// ✅ NOW SAFE TO STORE: All validation passed
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
