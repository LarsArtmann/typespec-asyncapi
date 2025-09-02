/**
 * DiscoveryService - TypeSpec AST Traversal and Discovery
 * 
 * Extracted from 1,800-line monolithic emitter to handle TypeSpec AST traversal
 * and discovery of operations, message models, and security configurations.
 * 
 * REAL BUSINESS LOGIC EXTRACTED from lines 431-608 of AsyncAPIEffectEmitter class
 * This is the HEART of the emitter - where TypeSpec definitions are discovered
 */

import { Effect } from "effect"
import type { Model, Namespace, Operation, Program } from "@typespec/compiler"
import type { SecurityConfig } from "../decorators/security.js"
import { $lib } from "../lib.js"

/**
 * Discovery results containing all discovered TypeSpec elements
 */
export type DiscoveryResult = {
	operations: Operation[]
	messageModels: Model[]
	securityConfigs: SecurityConfig[]
}

/**
 * DiscoveryService - Core TypeSpec AST Discovery Engine
 * 
 * Handles systematic traversal of TypeSpec namespaces to discover:
 * - Operations with @publish/@subscribe decorators
 * - Models with @message decorators
 * - Security configurations with @security decorators
 * 
 * Uses Effect.TS for functional error handling and logging
 */
export class DiscoveryService {

	/**
	 * Discover all operations in TypeSpec program
	 * 
	 * EXTRACTED FROM MONOLITHIC FILE: lines 431-488 (discoverOperationsEffectSync)
	 * This is the REAL implementation that was working in the 1,800-line file
	 * 
	 * @param program - TypeSpec program to traverse
	 * @returns Effect containing discovered operations
	 */
	discoverOperations(program: Program) {
		return Effect.gen(function* () {
			Effect.log(`🔍 Starting synchronous operation discovery...`)

			const discoveryOperation = Effect.sync(() => {
				const operations: Operation[] = []

				// Recursive namespace walker - REAL business logic
				const walkNamespace = (ns: Namespace | null) => {
					if (!ns) return
					
					if (ns.operations) {
						ns.operations.forEach((op: Operation, name: string) => {
							operations.push(op)
							Effect.log(`🔍 Found operation: ${name}`)
						})
					}

					if (ns.namespaces) {
						ns.namespaces.forEach((childNs: Namespace) => {
							walkNamespace(childNs)
						})
					}
				}

				// Safe access to global namespace - handles both real and test scenarios
				if (typeof program.getGlobalNamespaceType === 'function') {
					walkNamespace(program.getGlobalNamespaceType())
				}

				Effect.log(`📊 Total operations discovered: ${operations.length}`)
				return operations
			})

			const operations = yield* discoveryOperation
			return operations
		}).pipe(Effect.mapError(error => new Error(`Operation discovery failed: ${error}`)))
	}

	/**
	 * Discover message models with @message decorators
	 * 
	 * EXTRACTED FROM MONOLITHIC FILE: lines 570-607 (discoverMessageModelsEffectSync)
	 * Uses TypeSpec stateMap to access decorator state - CRITICAL for proper functionality
	 * 
	 * @param program - TypeSpec program to traverse
	 * @returns Effect containing discovered message models
	 */
	discoverMessageModels(program: Program) {
		return Effect.sync(() => {
			const messageModels: Model[] = []
			// Access decorator state - this is HOW decorators work in TypeSpec
			const messageConfigsMap = program.stateMap($lib.stateKeys.messageConfigs)
			
			Effect.log(`🔍 DiscoveryService: messageConfigsMap size = ${messageConfigsMap.size}`)
			Effect.log(`🔍 DiscoveryService: stateKeys.messageConfigs = ${String($lib.stateKeys.messageConfigs)}`)

			// Recursive walker for models - specialized for message discovery
			const walkNamespaceForModels = (ns: Namespace | null) => {
				if (!ns) return
				if (ns.models) {
					Effect.log(`🔍 DiscoveryService: Checking namespace with ${ns.models.size} models`)
					ns.models.forEach((model: Model, name: string) => {
						Effect.log(`🔍 DiscoveryService: Checking model ${name}, has @message: ${messageConfigsMap.has(model)}`)
						// Check if model has @message decorator via stateMap
						if (messageConfigsMap.has(model)) {
							messageModels.push(model)
							Effect.log(`🎯 Found message model: ${name}`)
						}
					})
				} else {
					Effect.log(`🔍 DiscoveryService: Namespace has no models`)
				}

				if (ns.namespaces) {
					ns.namespaces.forEach((childNs: Namespace) => {
						walkNamespaceForModels(childNs)
					})
				}
			}

			// Safe traversal with proper namespace access
			if (typeof program.getGlobalNamespaceType === 'function') {
				walkNamespaceForModels(program.getGlobalNamespaceType())
			}

			Effect.log(`📊 Total message models discovered: ${messageModels.length}`)
			return messageModels
		})
	}

	/**
	 * Discover security configurations on operations and models
	 * 
	 * EXTRACTED FROM MONOLITHIC FILE: (discoverSecurityConfigsEffectSync)
	 * Finds @security decorators on operations and models using stateMap access
	 * 
	 * @param program - TypeSpec program to traverse
	 * @returns Effect containing discovered security configurations
	 */
	discoverSecurityConfigs(program: Program) {
		return Effect.sync(() => {
			const securityConfigs: SecurityConfig[] = []
			// Access security decorator state via stateMap
			const securityConfigsMap = program.stateMap($lib.stateKeys.securityConfigs)

			// Recursive walker for security configs
			const walkNamespaceForSecurity = (ns: Namespace | null) => {
				if (!ns) return
				// Check operations for security decorators
				if (ns.operations) {
					ns.operations.forEach((operation: Operation, name: string) => {
						if (securityConfigsMap.has(operation)) {
							const config = securityConfigsMap.get(operation) as SecurityConfig
							securityConfigs.push(config)
							Effect.log(`🔐 Found security config on operation: ${name}`)
						}
					})
				}

				// Check models for security decorators
				if (ns.models) {
					ns.models.forEach((model: Model, name: string) => {
						if (securityConfigsMap.has(model)) {
							const config = securityConfigsMap.get(model) as SecurityConfig
							securityConfigs.push(config)
							Effect.log(`🔐 Found security config on model: ${name}`)
						}
					})
				}

				// Recurse into child namespaces
				if (ns.namespaces) {
					ns.namespaces.forEach((childNs: Namespace) => {
						walkNamespaceForSecurity(childNs)
					})
				}
			}

			// Safe traversal with proper namespace access
			if (typeof program.getGlobalNamespaceType === 'function') {
				walkNamespaceForSecurity(program.getGlobalNamespaceType())
			}

			Effect.log(`📊 Total security configs discovered: ${securityConfigs.length}`)
			return securityConfigs
		})
	}

	/**
	 * Execute complete discovery process
	 * 
	 * Orchestrates all discovery methods to provide complete TypeSpec element discovery
	 * 
	 * @param program - TypeSpec program to traverse
	 * @returns Effect containing complete discovery results
	 */
	executeDiscovery(program: Program) {
		return Effect.gen(function* (this: DiscoveryService) {
			Effect.log(`🚀 Starting complete TypeSpec discovery process...`)

			// Execute all discovery operations
			const operations = yield* this.discoverOperations(program)
			const messageModels = yield* this.discoverMessageModels(program)
			const securityConfigs = yield* this.discoverSecurityConfigs(program)

			const result: DiscoveryResult = {
				operations,
				messageModels,
				securityConfigs
			}

			Effect.log(`✅ Discovery complete: ${operations.length} operations, ${messageModels.length} messages, ${securityConfigs.length} security configs`)

			return result
		}.bind(this))
	}
}