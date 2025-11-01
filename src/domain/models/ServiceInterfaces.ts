/**
 * Standardized Service Interfaces - Type System Architecture
 * 
 * Fixes code duplication and interface mismatches by providing:
 * 1. Consistent service contracts across all components
 * 2. Type-safe document mutation patterns
 * 3. Standardized error handling
 * 4. Performance monitoring integration
 * 5. Proper dependency injection interfaces
 */

import type { Program, Operation, Model, Namespace } from "@typespec/compiler"
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"
import type { StandardizedError } from "../../utils/standardized-errors.js"
import type { SecurityConfig } from "./securityConfig.js"

/**
 * Performance metrics for service monitoring
 */
export interface ServiceMetrics {
	operations: number
	messageModels: number
	securityConfigs: number
	totalProcessed: number
	executionTime: number
	memoryUsage: number
	cacheHits: number
	cacheMisses: number
}

/**
 * Immutable document update pattern
 * Ensures no side effects in document mutations
 */
export interface DocumentUpdate<T = unknown> {
	type: 'channels' | 'operations' | 'messages' | 'schemas' | 'components'
	path: string[]
	value: T
	metadata?: {
		timestamp: Date
		service: string
		operation: string
	}
}

/**
 * Enhanced discovery result with document reference
 * Fixes missing asyncApiDoc property issue
 */
export interface EnhancedDiscoveryResult {
	operations: Operation[]
	messageModels: Model[]
	securityConfigs: SecurityConfig[]
	asyncApiDoc: AsyncAPIObject  // CRITICAL FIX: Document reference
	metrics: ServiceMetrics
	cache: Map<string, unknown>
}

/**
 * Enhanced processing result with document mutations
 * Fixes processing return type inconsistencies
 */
export interface EnhancedProcessingResult {
	asyncApiDoc: AsyncAPIObject
	operationsProcessed: number
	messageModelsProcessed: number
	securityConfigsProcessed: number
	totalProcessed: number
	documentUpdates: DocumentUpdate[]
	metrics: ServiceMetrics
}

/**
 * Unified service context for all components
 * Eliminates parameter passing duplication
 */
export interface ServiceContext {
	program: Program
	asyncApiDoc: AsyncAPIObject
	cache: Map<string, unknown>
	metrics: ServiceMetrics
	errorHandler: (error: StandardizedError) => void
	logger: (level: 'info' | 'warn' | 'error', message: string, meta?: unknown) => void
}

/**
 * Standardized service interface
 * Ensures consistent patterns across all services
 */
export interface AsyncAPIService {
	/** Initialize service with context */
	initialize(context: ServiceContext): Effect.Effect<void, StandardizedError>
	
	/** Execute primary service function */
	execute(context: ServiceContext): Effect.Effect<unknown, StandardizedError>
	
	/** Get service metrics */
	getMetrics(): ServiceMetrics
	
	/** Cleanup service resources */
	cleanup(): Effect.Effect<void, StandardizedError>
}

/**
 * Plugin registry interface
 * Replaces complex plugin system with simple contract
 */
export interface PluginRegistry {
	/** Register a new plugin */
	registerPlugin(name: string, plugin: unknown): void
	
	/** Get plugin by name */
	getPlugin<T = unknown>(name: string): T | undefined
	
	/** List all registered plugins */
	listPlugins(): string[]
	
	/** Check if plugin exists */
	hasPlugin(name: string): boolean
}

/**
 * Protocol binding interface
 * Standardizes protocol plugin contracts
 */
export interface ProtocolBinding {
	name: string
	version: string
	
	/** Check if binding handles specific protocol */
	canHandle(protocol: string): boolean
	
	/** Apply protocol-specific bindings */
	applyBindings(operation: Operation, document: AsyncAPIObject): Effect.Effect<void, StandardizedError>
	
	/** Validate binding configuration */
	validate(config: unknown): Effect.Effect<boolean, StandardizedError>
}

// Re-export existing types for convenience
export type { SecurityConfig }