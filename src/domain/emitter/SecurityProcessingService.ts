/**
 * Security Processing Service
 * 
 * Handles transformation of TypeSpec security configurations into AsyncAPI security schemes.
 * Extracted from ProcessingService.ts for single responsibility principle.
 */

import { Effect } from "effect"
import type { AsyncAPIObject, SecuritySchemeObject } from "@asyncapi/parser/esm/spec-types/v3.js"
import type { SecurityConfig } from "../decorators/securityConfig.js"
import { railwayLogging } from "../../utils/effect-helpers.js"

/**
 * Process a single TypeSpec security config into AsyncAPI security scheme
 */
export const processSingleSecurityConfig = (
	config: SecurityConfig,
	asyncApiDoc: AsyncAPIObject
): Effect.Effect<void, never> =>
	Effect.gen(function* () {
		yield* railwayLogging.logDebugGeneration("security-scheme", config.name, config)

		// Create AsyncAPI security scheme based on type
		const securityScheme: SecuritySchemeObject = createSecuritySchemeFromConfig(config)

		// Add to AsyncAPI document components
		asyncApiDoc.components ??= {}
		asyncApiDoc.components.securitySchemes ??= {}
		asyncApiDoc.components.securitySchemes[config.name] = securityScheme

		yield* railwayLogging.logDebugGeneration("security-scheme", `Added ${config.name}`, {
			schemeType: config.scheme.type,
			description: securityScheme.description
		})
	})

/**
 * Process multiple security configurations and add them to AsyncAPI document
 */
export const processSecurityConfigs = (
	securityConfigs: SecurityConfig[],
	asyncApiDoc: AsyncAPIObject
): Effect.Effect<number, never> =>
	Effect.gen(function* () {
		yield* Effect.log(`🔐 Processing ${securityConfigs.length} security configurations with functional composition...`)

		// Process each security config in parallel for performance
		yield* Effect.all(
			securityConfigs.map(config =>
				processSingleSecurityConfig(config, asyncApiDoc)
			)
		)

		yield* Effect.log(`📊 Processed ${securityConfigs.length} security configurations successfully`)
		return securityConfigs.length
	})

/**
 * Create AsyncAPI security scheme from TypeSpec security config
 */
const createSecuritySchemeFromConfig = (config: SecurityConfig): SecuritySchemeObject => {
	switch (config.scheme.type) {
		case "oauth2":
			return {
				type: "oauth2",
				description: `OAuth2 security: ${config.name}`,
				flows: {} // TODO: Implement proper OAuth flows
			}

		case "apiKey":
			return {
				type: "apiKey",
				description: `API Key security: ${config.name}`,
				name: config.name,
				in: config.scheme.in || "header"
			}

		case "http":
			return {
				type: "http",
				description: `HTTP security: ${config.name}`,
				scheme: "bearer", // TODO: Extract from config
				bearerFormat: "JWT" // TODO: Extract from config
			}

		case "openIdConnect":
			return {
				type: "openIdConnect",
				description: `OpenID Connect security: ${config.name}`,
				openIdConnectUrl: config.scheme.openIdConnectUrl || ""
			}

		default:
			// Default to apiKey for unknown schemes
			return {
				type: "apiKey",
				description: `API key authentication`,
				name: "Authorization",
				in: "header"
			}
	}
}

/**
 * Extract security metadata for enhanced AsyncAPI generation
 */
export const extractSecurityMetadata = (
	config: SecurityConfig
): Effect.Effect<{
		type: string
		description?: string
		scheme: string
		hasFlows: boolean
	}, never> =>
	Effect.gen(function* () {
		yield* railwayLogging.logDebugGeneration("security-scheme", config.name, config)

		return {
			type: config.scheme.type,
			description: `Security scheme: ${config.name}`,
			scheme: config.scheme.type,
			hasFlows: config.scheme.type === "oauth2" && !!config.scheme.flows
		}
	})