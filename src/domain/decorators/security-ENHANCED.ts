/**
 * Enhanced @security decorator with TypeSpec State Map Integration
 * 
 * Fixes securitySchemes: {} issue by properly storing configurations
 * in TypeSpec state map for document generation processing.
 */

import type {DecoratorContext, Model, Operation, Program, Namespace} from "@typespec/compiler"
import {reportDiagnostic} from "../../lib.js"
import {Effect} from "effect"
import type {SecurityConfig} from "./securityConfig.js"

// SECURITY CONFIGS STATE MAP KEY
export const SECURITY_CONFIGS_KEY = Symbol("security-configs")

/**
 * Type guard functions to ensure type safety
 */
const isModel = (value: unknown): value is Model => {
	return typeof value === 'object' && value !== null && 'kind' in value && (value as any).kind === 'Model'
}

const isOperation = (value: unknown): value is Operation => {
	return typeof value === 'object' && value !== null && 'kind' in value && (value as any).kind === 'Operation'
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
	console.log(`🔐 Enhanced security scheme registered: ${securityConfig.name}`)
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
				const securitySchemeData = {
					description: `Security scheme: ${config.name}`,
					...config.scheme
				}
				
				// Add to document
				asyncApiDoc.components.securitySchemes[config.name] = securitySchemeData
				
				yield* Effect.logInfo(`🔧 Processed security scheme: ${config.name} (${(config.scheme as any).type})`)
			}
		}
		
		yield* Effect.logInfo(`✅ Security schemes processing complete: ${Object.keys(asyncApiDoc.components.securitySchemes).length} schemes`)
	})
}
