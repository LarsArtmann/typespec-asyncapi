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
		yield* railwayLogging.logDebugGeneration("security-scheme", config.type, config)

		// Create AsyncAPI security scheme based on type
		const securityScheme: SecuritySchemeObject = createSecuritySchemeFromConfig(config)

		// Add to AsyncAPI document components
		asyncApiDoc.components = asyncApiDoc.components || {}
		asyncApiDoc.components.securitySchemes = asyncApiDoc.components.securitySchemes || {}
		asyncApiDoc.components.securitySchemes[config.type] = securityScheme

		yield* railwayLogging.logDebugGeneration("security-scheme", `Added ${config.type}`, {
			schemeType: config.scheme,
			description: config.description
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
	switch (config.scheme) {
		case "oauth2":
			return {
				type: "oauth2",
				description: config.description,
				flows: config.flows || {
					implicit: {
						authorizationUrl: config.authorizationUrl || "",
						scopes: config.scopes || []
					}
				}
			}

		case "apiKey":
			return {
				type: "apiKey",
				description: config.description,
				name: config.name || "X-API-Key",
				in: config.in || "header",
				scheme: config.scheme || "Bearer"
			}

		case "http":
			return {
				type: "http",
				description: config.description,
				scheme: config.httpScheme || "bearer",
				bearerFormat: config.bearerFormat || "JWT"
			}

		case "openIdConnect":
			return {
				type: "openIdConnect",
				description: config.description,
				openIdConnectUrl: config.openIdConnectUrl || "",
				bearerFormat: config.bearerFormat || "JWT"
			}

		default:
			// Default to apiKey for unknown schemes
			return {
				type: "apiKey",
				description: config.description || "API key authentication",
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
		yield* railwayLogging.logDebugGeneration("security-scheme", config.type, config)

		return {
			type: config.type,
			description: config.description,
			scheme: config.scheme || "apiKey",
			hasFlows: !!(config.flows && Object.keys(config.flows).length > 0)
		}
	})