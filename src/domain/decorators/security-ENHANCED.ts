/**
 * Enhanced @security decorator with TypeSpec State Map Integration
 * 
 * Fixes securitySchemes: {} issue by properly storing configurations
 * in TypeSpec state map for document generation processing.
 */

import type {DecoratorContext, Model, Operation, Program} from "@typespec/compiler"
import {$lib, reportDiagnostic} from "../../lib.js"
import {Effect} from "effect"
import type {SecurityConfig} from "./securityConfig.js"

// SECURITY CONFIGS STATE MAP KEY
export const SECURITY_CONFIGS_KEY = Symbol("security-configs")

/**
 * Enhanced security decorator implementation with state map integration
 */
export const $securityEnhanced = (context: DecoratorContext, target: Model | Operation, config: Record<unknown>) => {
	return Effect.gen(function* () {
		// Store security configuration in TypeSpec state map
		const stateMap = context.program.stateMap(SECURITY_CONFIGS_KEY)
		const existingConfigs = stateMap.get(target) || []
		
		// Validate and store security config
		const securityConfig = config as SecurityConfig
		if (!securityConfig.name || !securityConfig.scheme) {
			reportDiagnostic(context.program, {
				code: "invalid-security-scheme",
				message: "Security scheme must have 'name' and 'scheme' properties",
				target: target
			})
			return
		}
		
		existingConfigs.push(securityConfig)
		stateMap.set(target, existingConfigs)
		
		yield* Effect.logInfo(`🔐 Enhanced security scheme registered: ${securityConfig.name}`)
	})
}

/**
 * Get all security configurations from state map
 */
export const getSecurityConfigurations = (program: Program): Map<Model | Operation, SecurityConfig[]> => {
	return program.stateMap(SECURITY_CONFIGS_KEY)
}

/**
 * Process security configurations into AsyncAPI document
 */
export const processSecuritySchemes = (program: Program, asyncApiDoc: any) => {
	return Effect.gen(function* () {
		const securityConfigs = getSecurityConfigurations(program)
		
		if (securityConfigs.size === 0) {
			yield* Effect.logInfo("📋 No security configurations found")
			return
		}
		
		// Initialize security schemes in document
		if (!asyncApiDoc.components) {
			asyncApiDoc.components = {}
		}
		
		if (!asyncApiDoc.components.securitySchemes) {
			asyncApiDoc.components.securitySchemes = {}
		}
		
		// Process all security configurations
		for (const [target, configs] of securityConfigs) {
			for (const config of configs) {
				const securityScheme = {
					type: config.scheme.type,
					description: `Security scheme: ${config.name}`,
					...config.scheme
				}
				
				// Add to document
				asyncApiDoc.components.securitySchemes[config.name] = securityScheme
				
				yield* Effect.logInfo(`🔧 Processed security scheme: ${config.name} (${securityScheme.type})`)
			}
		}
		
		yield* Effect.logInfo(`✅ Security schemes processing complete: ${Object.keys(asyncApiDoc.components.securitySchemes).length} schemes`)
	})
}
