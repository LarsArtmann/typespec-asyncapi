/**
 * Shared TypeSpec state and operation utilities
 * Extracted from duplicated operation discovery and state access logic
 */

import type {Model, Namespace, Operation, Program} from "@typespec/compiler"
import {$lib} from "../lib.js"
import {Effect} from "effect"
import type {ServerConfig} from "../decorators/server.js"
import type {MessageConfig} from "../decorators/message.js"
import type {ProtocolConfig} from "../decorators/protocol.js"
import type {SecurityConfig} from "../decorators/security.js"
import type {ServersObject} from "@asyncapi/parser/esm/spec-types/v3.js"

/**
 * Discover all operations from TypeSpec program
 * Extracted from asyncapi-emitter.ts and emitter-with-effect.ts
 */
export function discoverOperations(program: Program): Operation[] {
	const operations: Operation[] = []
	// Safe access with fallback that matches existing test patterns
	if (typeof program.getGlobalNamespaceType === 'function') {
		walkNamespace(program.getGlobalNamespaceType(), operations, program)
	} else {
		// For mock programs in tests, create a minimal namespace structure
		const mockNamespace = {
			operations: new Map(),
			namespaces: new Map(),
		}
		// Safe cast for test compatibility
		walkNamespace(mockNamespace as any, operations, program)
	}
	return operations
}

/**
 * Walk namespace hierarchy to find operations
 * Centralized namespace traversal logic
 */
export function walkNamespace(ns: Namespace, operations: Operation[], program: Program): void {
	// Collect operations from current namespace
	ns.operations.forEach((operation, name) => {
		operations.push(operation)
		Effect.log(`🔍 FOUND OPERATION: ${name} (kind: ${operation.kind})`)
	})

	// Recursively walk child namespaces
	ns.namespaces.forEach((childNs) => {
		walkNamespace(childNs, operations, program)
	})
}

/**
 * Get operation type from TypeSpec decorator state
 * Extracted common logic for @publish/@subscribe detection
 */
export function getOperationType(operation: Operation, program: Program): string | undefined {
	if (!program.stateMap || typeof program.stateMap !== 'function') {
		return undefined
	}
	const operationTypesMap = program.stateMap($lib.stateKeys.operationTypes)
	return operationTypesMap.get(operation) as string | undefined
}

/**
 * Get channel path from TypeSpec decorator state
 * Extracted common logic for @channel path detection
 */
export function getChannelPath(operation: Operation, program: Program): string | undefined {
	if (!program.stateMap || typeof program.stateMap !== 'function') {
		return undefined
	}
	const channelPathsMap = program.stateMap($lib.stateKeys.channelPaths)
	return channelPathsMap.get(operation) as string | undefined
}

/**
 * Determine AsyncAPI action from operation type
 * Centralized action mapping logic
 */
export function getAsyncAPIAction(operationType: string | undefined): "send" | "receive" {
	return operationType === "subscribe" ? "receive" : "send"
}

/**
 * Sanitize channel path to create valid AsyncAPI channel identifier
 * Extracted from integration-example.ts
 */
export function sanitizeChannelId(channelPath: string): string {
	return channelPath
		.replace(/^\//, '') // Remove leading slash
		.replace(/\//g, '_') // Replace slashes with underscores
		.replace(/[^a-zA-Z0-9_-]/g, '_') // Replace invalid chars with underscores
		.replace(/_+/g, '_') // Collapse multiple underscores
		.replace(/^_|_$/g, '') // Remove leading/trailing underscores
		.toLowerCase()
}

/**
 * Log detailed operation information
 * Centralized operation logging from multiple files
 */
export function logOperationDetails(operation: Operation, program: Program): void {
	Effect.log(`  - Return type: ${operation.returnType.kind}`)
	Effect.log(`  - Parameters: ${operation.parameters.properties.size}`)

	const operationType = getOperationType(operation, program)
	const channelPath = getChannelPath(operation, program)

	if (operationType) {
		Effect.log(`  - Operation type: ${operationType}`)
	}

	if (channelPath) {
		Effect.log(`  - Channel path: ${channelPath}`)
	}

	operation.parameters.properties.forEach((param, paramName) => {
		Effect.log(`  - Parameter: ${paramName} (${param.type.kind})`)
	})
}

/**
 * Get server configurations from TypeSpec decorator state
 * CRITICAL MISSING FUNCTION - Required for AsyncAPI server generation
 */
export function getServerConfigs(program: Program, namespace: Namespace): Map<string, ServerConfig> | undefined {
	if (!program.stateMap || typeof program.stateMap !== 'function') {
		return undefined
	}
	const serverConfigsMap = program.stateMap($lib.stateKeys.serverConfigs)
	return serverConfigsMap.get(namespace) as Map<string, ServerConfig> | undefined
}

/**
 * Get all server configurations from all namespaces  
 * Used for building document-level servers object
 */
export function getAllServerConfigs(program: Program): Map<Namespace, Map<string, ServerConfig>> {
	// Handle cases where program doesn't have stateMap (like in tests)
	if (!program.stateMap || typeof program.stateMap !== 'function') {
		return new Map<Namespace, Map<string, ServerConfig>>()
	}
	
	const serverConfigsMap = program.stateMap($lib.stateKeys.serverConfigs)
	return serverConfigsMap as Map<Namespace, Map<string, ServerConfig>>
}

/**
 * Get message configuration from TypeSpec decorator state
 * CRITICAL MISSING FUNCTION - Required for AsyncAPI message generation
 */
export function getMessageConfig(program: Program, model: Model): MessageConfig | undefined {
	if (!program.stateMap || typeof program.stateMap !== 'function') {
		return undefined
	}
	const messageConfigsMap = program.stateMap($lib.stateKeys.messageConfigs)
	return messageConfigsMap.get(model) as MessageConfig | undefined
}

/**
 * Get protocol configuration from TypeSpec decorator state  
 * CRITICAL MISSING FUNCTION - Required for AsyncAPI protocol bindings
 */
export function getProtocolConfig(program: Program, target: Operation | Model): ProtocolConfig | undefined {
	if (!program.stateMap || typeof program.stateMap !== 'function') {
		return undefined
	}
	const protocolConfigsMap = program.stateMap($lib.stateKeys.protocolConfigs)
	return protocolConfigsMap.get(target) as ProtocolConfig | undefined
}

/**
 * Get security configuration from TypeSpec decorator state
 * CRITICAL MISSING FUNCTION - Required for AsyncAPI security schemes
 */
export function getSecurityConfig(program: Program, target: Operation | Model): SecurityConfig | undefined {
	if (!program.stateMap || typeof program.stateMap !== 'function') {
		return undefined
	}
	const securityConfigsMap = program.stateMap($lib.stateKeys.securityConfigs)
	return securityConfigsMap.get(target) as SecurityConfig | undefined
}

/**
 * Build AsyncAPI servers object from namespace-scoped server configurations
 * Implements namespace-qualified naming strategy from architecture decision
 */
export function buildServersFromNamespaces(program: Program): ServersObject {
	const servers: ServersObject = {}
	const allServerConfigs = getAllServerConfigs(program)
	
	for (const [namespace, serverConfigsMap] of allServerConfigs.entries()) {
		// Get namespace name, handle global namespace
		const namespaceName = namespace.name === "" || !namespace.name ? "Global" : namespace.name
		
		for (const [serverName, config] of serverConfigsMap.entries()) {
			// Use namespace-qualified naming: "ServiceA.prod", "ServiceB.prod"
			const qualifiedName = namespaceName === "Global" ? serverName : `${namespaceName}.${serverName}`
			
			servers[qualifiedName] = {
				host: extractHostFromUrl(config.url),
				protocol: config.protocol,
				description: config.description || `${namespaceName} ${serverName} server`
			} as const
		}
	}
	
	return servers
}

/**
 * Extract host from server URL (remove protocol prefix)
 * Utility for AsyncAPI server object generation
 */
function extractHostFromUrl(url: string): string {
	try {
		const urlObj = new URL(url)
		return urlObj.host
	} catch {
		// If URL parsing fails, return as-is
		return url
	}
}
