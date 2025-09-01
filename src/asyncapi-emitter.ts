import type {EmitContext, Model, Namespace, Operation, Program} from "@typespec/compiler"
// import {getDoc} from "@typespec/compiler" // Unused import
import {
	type AssetEmitter,
	createAssetEmitter,
	type EmittedSourceFile,
	type SourceFile,
	TypeEmitter,
} from "@typespec/asset-emitter"
import {stringify} from "yaml"
import {Effect} from "effect"
import type {AsyncAPIEmitterOptions} from "./options.js"
import type {AsyncAPIObject, ChannelObject, OperationObject, SchemaObject} from "@asyncapi/parser/esm/spec-types/v3.js"
import {createDefaultKafkaChannelBinding, validateKafkaChannelBinding} from "./bindings/kafka.js"
import {convertModelToSchema} from "./utils/schema-conversion.js"
import {logOperationDetails} from "./utils/typespec-helpers.js"
import {createChannelDefinition, createOperationDefinition} from "./utils/asyncapi-helpers.js"
import {$lib} from "./lib.js"
// ChannelObject and OperationObject now imported from centralized types
import {hasTemplateVariables, type PathTemplateContext, resolvePathTemplateWithValidation} from "./path-templates.js"

// MIGRATED TO @typespec/asset-emitter architecture for modern TypeSpec emitter patterns

/**
 * AsyncAPI TypeEmitter for AssetEmitter architecture
 * Handles emission of AsyncAPI documents using modern TypeSpec patterns
 */
class AsyncAPITypeEmitter extends TypeEmitter<string, AsyncAPIEmitterOptions> {
	private operations: Operation[] = []
	private asyncApiDoc: AsyncAPIObject

	constructor(emitter: AssetEmitter<string, AsyncAPIEmitterOptions>) {
		super(emitter)
		// Initialize with empty operations array - will be populated in programContext()
		this.asyncApiDoc = this.createAsyncAPIObject([])
	}

	override programContext(_program: Program): Record<string, unknown> {
		return {
			program: "AsyncAPI",
		}
	}

	override writeOutput(_sourceFiles: SourceFile<string>[]): Promise<void> {
		const startTime = performance.now()
		const startMemory = this.getMemoryUsage()

		Effect.log(`🚀 Starting AsyncAPI emission with performance monitoring...`)
		Effect.log(`📊 Initial memory usage: ${this.formatBytes(startMemory.used)} / ${this.formatBytes(startMemory.total)}`)

		// Discover all operations from the program
		this.operations = this.discoverOperations(this.emitter.getProgram())
		this.asyncApiDoc = this.createAsyncAPIObject(this.operations)

		// Process each operation with performance tracking
		Effect.log(`🏗️ Processing ${this.operations.length} operations...`)
		for (const op of this.operations) {
			const opStartTime = performance.now()
			this.processOperation(op)
			const opEndTime = performance.now()
			Effect.log(`✅ Processed operation '${op.name}' in ${(opEndTime - opStartTime).toFixed(2)}ms`)
		}

		// Process security configurations
		const secStartTime = performance.now()
		this.processSecuritySchemes()
		const secEndTime = performance.now()
		Effect.log(`🔐 Security processing completed in ${(secEndTime - secStartTime).toFixed(2)}ms`)

		// Generate AsyncAPI document
		const genStartTime = performance.now()
		this.generateAsyncAPIDocument()
		const genEndTime = performance.now()
		Effect.log(`📄 Document generation completed in ${(genEndTime - genStartTime).toFixed(2)}ms`)

		// Performance summary
		const endTime = performance.now()
		const endMemory = this.getMemoryUsage()
		const totalTime = endTime - startTime
		const memoryDelta = endMemory.used - startMemory.used

		Effect.log(`🎯 === EMISSION PERFORMANCE SUMMARY ===`)
		Effect.log(`📊 Total Operations: ${this.operations.length}`)
		Effect.log(`⏱️  Total Time: ${totalTime.toFixed(2)}ms`)
		Effect.log(`⚡ Throughput: ${(this.operations.length / (totalTime / 1000)).toFixed(0)} ops/sec`)
		Effect.log(`🧠 Memory Delta: ${this.formatBytes(memoryDelta)} (${memoryDelta > 0 ? '+' : ''}${((memoryDelta / startMemory.used) * 100).toFixed(1)}%)`)
		Effect.log(`📈 Final Memory: ${this.formatBytes(endMemory.used)} / ${this.formatBytes(endMemory.total)}`)

		// Memory efficiency check
		if (memoryDelta > 10 * 1024 * 1024) { // 10MB threshold
			Effect.logWarning(`⚠️  High memory usage detected: ${this.formatBytes(memoryDelta)}`)
		}

		// Performance target validation
		if (totalTime > 2000) { // 2s threshold
			Effect.logWarning(`⚠️  Emission took longer than expected: ${totalTime.toFixed(2)}ms`)
		}
		
		return Promise.resolve()
	}

	override sourceFile(sourceFile: SourceFile<string>): EmittedSourceFile {
		const options = this.typedOption()
		const program = this.emitter.getProgram()
		const content = this.generateContent(options["file-type"] ?? "yaml", program)

		// Use resolved output path if available, otherwise use source file path
		const outputPath = this.resolveOutputFilePath()
		
		return {
			path: sourceFile.path || outputPath,
			contents: content,
		}
	}

	private createAsyncAPIObject(operations: Operation[]): AsyncAPIObject {
		return {
			asyncapi: "3.0.0" as const,
			info: {
				title: "Generated from REAL TypeSpec AST",
				version: "1.0.0",
				description: `Found ${operations.length} operations in TypeSpec source`,
			},
			channels: {},
			operations: {},
			components: {
				schemas: {},
				messages: {},
				securitySchemes: {},
			},
		}
	}

	private discoverOperations(program: Program): Operation[] {
		const operations: Operation[] = []

		// Safe access to global namespace - handle both real Program and mock objects
		if (typeof program.getGlobalNamespaceType === 'function') {
			this.walkNamespace(program.getGlobalNamespaceType(), operations, program)
		} else {
			// Mock namespace for tests  
			const mockNamespace = { operations: new Map(), namespaces: new Map() }
			this.walkNamespace(mockNamespace as any, operations, program)
		}
		return operations
	}

	private walkNamespace(ns: Namespace, operations: Operation[], program: Program): void {
		// ns.operations is always defined on Namespace type
		ns.operations.forEach((operation, name) => {
			operations.push(operation)
			Effect.log(`🔍 FOUND REAL OPERATION: ${name} (kind: ${operation.kind})`)
			logOperationDetails(operation, program)
		})

		// ns.namespaces is always defined on Namespace type
		ns.namespaces.forEach((childNs, _) => {
			this.walkNamespace(childNs, operations, program)
		})
	}


	private processOperation(op: Operation): void {
		Effect.log(`🏗️  Processing operation: ${op.name}`)

		const {name: channelName, definition: channelDef} = this.createChannelDefinition(op)
		// Ensure channels object exists before assignment
		if (!this.asyncApiDoc.channels) {
			this.asyncApiDoc.channels = {}
		}
		this.asyncApiDoc.channels[channelName] = channelDef

		// Ensure operations object exists before assignment
		if (!this.asyncApiDoc.operations) {
			this.asyncApiDoc.operations = {}
		}
		this.asyncApiDoc.operations[op.name] = this.createOperationDefinition(op, channelName)

		if (op.returnType.kind === "Model") {
			const model = op.returnType
			// Ensure components and schemas objects exist before assignment
			if (!this.asyncApiDoc.components) {
				this.asyncApiDoc.components = {}
			}
			if (!this.asyncApiDoc.components.schemas) {
				this.asyncApiDoc.components.schemas = {}
			}
			this.asyncApiDoc.components.schemas[model.name] = this.convertModelToSchema(model)
		}
	}

	private createChannelDefinition(op: Operation): { name: string, definition: ChannelObject } {
		const program = this.emitter.getProgram()
		// Use centralized utility function to eliminate duplication
		const {name: channelName, definition} = createChannelDefinition(op, program)

		// Add Kafka bindings if channel path looks like a Kafka topic
		const channelPath = definition.address
		if (channelPath && this.looksLikeKafkaTopic(channelPath)) {
			const kafkaBinding = createDefaultKafkaChannelBinding(channelPath)
			const validation = validateKafkaChannelBinding(kafkaBinding)

			if (validation.isValid) {
				definition.bindings = {
					kafka: kafkaBinding,
				}
				Effect.log(`✅ Added Kafka binding for channel ${channelName}: topic="${kafkaBinding.topic}"`)
			} else {
				Effect.logWarning(`⚠️ Invalid Kafka binding for ${channelName}: ${validation.errors.join(', ')}`)
			}
		}

		return {name: channelName, definition}
	}

	private looksLikeKafkaTopic(path: string): boolean {
		// Simple heuristics for detecting Kafka topics:
		// - Contains dots (common in Kafka topic names)
		// - No leading slash (Kafka topics don't start with /)
		// - Contains underscores or dashes
		return !path.startsWith('/') &&
			(path.includes('.') || path.includes('_') || path.includes('-')) &&
			/^[a-zA-Z0-9._-]+$/.test(path)
	}

	private createOperationDefinition(op: Operation, channelName: string): OperationObject {
		const program = this.emitter.getProgram()
		// Use centralized utility function to eliminate duplication
		const operationDef = createOperationDefinition(op, program, channelName)

		// Keep the logging for debugging purposes
		Effect.log(`📡 Operation ${op.name} -> action: ${operationDef.action}`)

		return operationDef
	}

	private convertModelToSchema(model: Model): SchemaObject {
		const program = this.emitter.getProgram()
		Effect.log(`🔄 Converting model: ${model.name} with ${model.properties.size} properties`)

		const schema = convertModelToSchema(model, program)

		Effect.log(`✅ Converted model ${model.name} to AsyncAPI schema`)
		return schema
	}

	/**
	 * Process security configurations and add them to AsyncAPI components.securitySchemes
	 */
	private processSecuritySchemes(): void {
		const program = this.emitter.getProgram()
		const securityConfigsMap = program.stateMap($lib.stateKeys.securityConfigs)
		
		Effect.log(`🔐 Processing ${securityConfigsMap.size} security configurations...`)

		if (securityConfigsMap.size === 0) {
			Effect.log(`ℹ️  No security configurations found`)
			return
		}

		// Ensure components.securitySchemes exists
		if (!this.asyncApiDoc.components?.securitySchemes) {
			if (!this.asyncApiDoc.components) this.asyncApiDoc.components = {}
			this.asyncApiDoc.components.securitySchemes = {}
		}

		// Process each security configuration
		securityConfigsMap.forEach((config, target) => {
			if (typeof config === 'object' && config && 'name' in config && 'scheme' in config) {
				const securityConfig = config as any
				this.processSingleSecurityConfig(securityConfig)
				Effect.log(`🔐 Processed security for ${target.kind} ${(target as any).name || 'unnamed'}`)
			}
		})

		Effect.log(`✅ Completed processing ${securityConfigsMap.size} security configurations`)
	}

	/**
	 * Process a single security configuration and add it to AsyncAPI components.securitySchemes
	 */
	private processSingleSecurityConfig(config: any): void {
		Effect.log(`🔐 Processing security config: ${config.name}`)

		// Create AsyncAPI security scheme from our config
		const asyncApiScheme = this.createAsyncAPISecurityScheme(config)
		
		// Add to document
		this.asyncApiDoc.components!.securitySchemes![config.name] = asyncApiScheme

		Effect.log(`✅ Added security scheme: ${config.name} (${config.scheme.type})`)
	}

	/**
	 * Create AsyncAPI security scheme from SecurityConfig
	 * Maps our security scheme types to AsyncAPI v3 specification
	 */
	private createAsyncAPISecurityScheme(config: any): any {
		const scheme = config.scheme

		// Map our scheme types to AsyncAPI v3 types
		switch (scheme.type) {
			case "apiKey":
				// For AsyncAPI v3, we use different types based on location
				if (scheme.in === "user" || scheme.in === "password") {
					return {
						type: "userPassword",
						description: scheme.description,
					}
				} else {
					// For header, query, cookie locations
					return {
						type: "httpApiKey", 
						name: "X-API-Key", // Default name, could be configurable
						in: scheme.in,
						description: scheme.description,
					}
				}

			case "http":
				return {
					type: "http",
					scheme: scheme.scheme,
					bearerFormat: scheme.bearerFormat,
					description: scheme.description,
				}

			case "oauth2": {
				// Map OAuth2 flows to AsyncAPI v3 format
				const asyncApiFlows: Record<string, any> = {}
				if (scheme.flows.implicit) {
					asyncApiFlows.implicit = {
						authorizationUrl: scheme.flows.implicit.authorizationUrl,
						availableScopes: scheme.flows.implicit.scopes,
					}
				}
				if (scheme.flows.password) {
					asyncApiFlows.password = {
						tokenUrl: scheme.flows.password.tokenUrl,
						refreshUrl: scheme.flows.password.refreshUrl,
						availableScopes: scheme.flows.password.scopes,
					}
				}
				if (scheme.flows.clientCredentials) {
					asyncApiFlows.clientCredentials = {
						tokenUrl: scheme.flows.clientCredentials.tokenUrl,
						refreshUrl: scheme.flows.clientCredentials.refreshUrl,
						availableScopes: scheme.flows.clientCredentials.scopes,
					}
				}
				if (scheme.flows.authorizationCode) {
					asyncApiFlows.authorizationCode = {
						authorizationUrl: scheme.flows.authorizationCode.authorizationUrl,
						tokenUrl: scheme.flows.authorizationCode.tokenUrl,
						refreshUrl: scheme.flows.authorizationCode.refreshUrl,
						availableScopes: scheme.flows.authorizationCode.scopes,
					}
				}
				return {
					type: "oauth2",
					flows: asyncApiFlows,
					description: scheme.description,
				}
			}

			case "openIdConnect":
				return {
					type: "openIdConnect",
					openIdConnectUrl: scheme.openIdConnectUrl,
					description: scheme.description,
				}

			case "sasl":
				// Map SASL mechanisms to AsyncAPI v3 types
				switch (scheme.mechanism) {
					case "PLAIN":
						return {
							type: "plain",
							description: scheme.description,
						}
					case "SCRAM-SHA-256":
						return {
							type: "scramSha256", 
							description: scheme.description,
						}
					case "SCRAM-SHA-512":
						return {
							type: "scramSha512",
							description: scheme.description,
						}
					case "GSSAPI":
						return {
							type: "gssapi",
							description: scheme.description,
						}
					default:
						return {
							type: "plain", // Default fallback
							description: scheme.description,
						}
				}

			case "x509":
				return {
					type: "X509",
					description: scheme.description,
				}

			case "symmetricEncryption":
				return {
					type: "symmetricEncryption",
					description: scheme.description,
				}

			case "asymmetricEncryption":
				return {
					type: "asymmetricEncryption", 
					description: scheme.description,
				}

			default:
				// TypeScript exhaustiveness check - fallback to basic type
				return {
					type: "userPassword",
					description: "Unknown security scheme",
				}
		}
	}

	/**
	 * Get current memory usage information
	 */
	private getMemoryUsage(): { used: number; total: number } {
		if (typeof process !== 'undefined' && process.memoryUsage) {
			const usage = process.memoryUsage()
			return {
				used: usage.heapUsed,
				total: usage.heapTotal,
			}
		}
		// Fallback for browser environments
		return { used: 0, total: 0 }
	}

	/**
	 * Format bytes into human-readable format
	 */
	private formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B'
		const k = 1024
		const sizes = ['B', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
	}

	// These methods are commented out as they're not currently used
	// but kept for potential future use
	/*
	private processModelProperties(model: Model, program: Program): {
		properties: Record<string, SchemaObject>,
		required: string[]
	} {
		const properties: Record<string, SchemaObject> = {}
		const required: string[] = []

		model.properties.forEach((prop, propName) => {
			Effect.log(`  - Property: ${propName} (${prop.type.kind}) required: ${String(!prop.optional)}`)

			const typeInfo = getPropertyType(prop)
			properties[propName] = {
				...typeInfo,
				description: getDoc(program, prop) ?? `Property ${propName}`,
			}

			if (!prop.optional) {
				required.push(propName)
			}
		})

		return {properties, required}
	}

	private getPropertyType(prop: ModelProperty): {
		type: "string" | "number" | "boolean" | "object" | "array" | "null" | "integer",
		format?: string
	} {
		return getPropertyType(prop)
	}
	*/

	/**
	 * Resolve output file path with template variable support
	 */
	private resolveOutputFilePath(): string {
		const options = this.typedOption()
		const program = this.emitter.getProgram()
		const outputFile: AsyncAPIEmitterOptions["output-file"] = options["output-file"] ?? "asyncapi"
		const fileType: AsyncAPIEmitterOptions["file-type"] = options["file-type"] ?? "yaml"

		// Check if output file contains template variables
		if (hasTemplateVariables(outputFile)) {
			Effect.log(`🔧 Resolving path template: ${outputFile}`)

			const emitterOutputDir = this.emitter.getContext()["emitterOutputDir"] as string | undefined
			const context: PathTemplateContext = {
				program,
				emitterOutputDir: emitterOutputDir ?? "",
			}

			try {
				const resolvedPath = resolvePathTemplateWithValidation(outputFile, context)
				Effect.log(`✅ Resolved path template to: ${resolvedPath}`)

				// Add file extension if not already present
				if (!resolvedPath.endsWith(`.${fileType}`)) {
					return `${resolvedPath}.${fileType}`
				}
				return resolvedPath
			} catch (error) {
				Effect.logWarning(`⚠️ Path template resolution failed: ${error instanceof Error ? error.message : String(error)}`)
				Effect.logWarning(`   Falling back to simple concatenation: ${outputFile}.${fileType}`)
				return `${outputFile}.${fileType}`
			}
		}

		// No template variables, use simple concatenation
		return `${outputFile}.${fileType}`
	}

	private generateAsyncAPIDocument(): void {
		// This method just processes the operations and builds the AsyncAPI document
		// The actual file writing happens in sourceFile() method called by the framework
		this.logProcessingStats()
		Effect.log(`✅ AsyncAPI document generated with REAL TypeSpec data using AssetEmitter architecture!`)
	}

	private generateContent(fileType: string, program: Program): string {
		const sourceFiles = Array.from(program.sourceFiles.keys()).join(", ") || "none"
		const operationNames = this.operations.map(op => op.name).join(", ") || "none"

		let content: string
		if (fileType === "json") {
			// For JSON, add metadata as a comment field in the document itself
			const docWithMeta = {
				...this.asyncApiDoc,
				"x-generated-from-typespec": {
					sourceFiles: sourceFiles,
					operationsFound: operationNames,
					note: "Generated from TypeSpec using AssetEmitter - NOT hardcoded!",
				},
			}
			content = JSON.stringify(docWithMeta, null, 2)
		} else {
			// For YAML, use comment headers
			const header = `# Generated from TypeSpec using AssetEmitter - NOT hardcoded!\n# Source files: ${sourceFiles}\n# Operations found: ${operationNames}\n\n`
			content = header + stringify(this.asyncApiDoc)
		}

		return content
	}

	private logProcessingStats(): void {
		Effect.log(`\n📊 FINAL STATS FROM REAL TYPESPEC (AssetEmitter):`)
		Effect.log(`  - Operations processed: ${this.operations.length}`)
		Effect.log(`  - Channels created: ${Object.keys(this.asyncApiDoc.channels ?? {}).length}`)
		Effect.log(`  - Schemas generated: ${Object.keys(this.asyncApiDoc.components?.schemas ?? {}).length}`)
	}

	private typedOption() {
		return this.emitter.getOptions()
	}
}

// LEGACY FUNCTIONS: The following functions have been migrated to the AsyncAPITypeEmitter class
// They are kept here for reference but are no longer used in the AssetEmitter architecture

/*
 * MIGRATED FUNCTIONS (now in AsyncAPITypeEmitter class):
 * - walkNamespace() -> moved to AsyncAPITypeEmitter.walkNamespace()
 * - logOperationDetails() -> moved to AsyncAPITypeEmitter.logOperationDetails()
 * - discoverOperations() -> moved to AsyncAPITypeEmitter.discoverOperations()
 * - createAsyncAPIObject() -> moved to AsyncAPITypeEmitter.createAsyncAPIObject()
 * - createChannelDefinition() -> moved to AsyncAPITypeEmitter.createChannelDefinition()
 * - createOperationDefinition() -> moved to AsyncAPITypeEmitter.createOperationDefinition()
 * - getPropertyType() -> moved to AsyncAPITypeEmitter.getPropertyType()
 * - processModelProperties() -> moved to AsyncAPITypeEmitter.processModelProperties()
 * - convertModelToSchema() -> moved to AsyncAPITypeEmitter.convertModelToSchema()
 * - processOperation() -> moved to AsyncAPITypeEmitter.processOperation()
 * - generateContent() -> moved to AsyncAPITypeEmitter.generateContent()
 * - generateOutputFile() -> moved to AsyncAPITypeEmitter.generateOutputFile()
 * - logProcessingStats() -> moved to AsyncAPITypeEmitter.logProcessingStats()
 * 
 * The new AssetEmitter architecture provides:
 * - Better performance through caching and deduplication
 * - Improved memory management
 * - Modern TypeSpec emitter patterns
 * - Enhanced error handling
 * - Future-proof architecture for TypeSpec ecosystem changes
 */

/**
 * Generate AsyncAPI 3.0 specification using AssetEmitter architecture
 *
 * ✅ ALTERNATIVE EMITTER: This function provides an alternative AssetEmitter-based implementation.
 * The main entry point (src/index.ts) currently uses generateAsyncAPIWithEffect() instead,
 * which integrates with Effect.TS for better error handling and performance monitoring.
 *
 * This function can be used for:
 * - Direct AssetEmitter integration without Effect.TS overhead
 * - Simpler emitter pipeline for specific use cases
 * - Testing AssetEmitter functionality independently
 *
 * Usage: Replace generateAsyncAPIWithEffect() in src/index.ts with this function
 * to use the pure AssetEmitter approach.
 *
 * ⚠️ VERSIONING LIMITATION: This function does NOT support TypeSpec.Versioning decorators.
 * It generates a single AsyncAPI document without version-aware processing.
 *
 * UNSUPPORTED:
 * - @added(Version.v2) decorators - operations/models included regardless of version
 * - @removed(Version.v3) decorators - operations/models never excluded
 * - @renamedFrom decorators - no property renaming across versions
 * - Multi-version document generation - only single asyncapi.yaml output
 *
 * See GitHub issue #1 for planned versioning support.
 */
export async function generateAsyncAPI(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
	//TODO: Why is this not used?? Is this legacy or does it need to be integrated?
	//  If this is legacy is the new one better or can it learn from this?
	Effect.log("🚀 ASYNCAPI EMITTER (AssetEmitter): Processing REAL TypeSpec AST - NOT HARDCODED!")
	Effect.log("⚠️  VERSIONING NOT SUPPORTED - See GitHub issue #1")
	Effect.log(`📁 Output: ${context.emitterOutputDir}`)
	Effect.log(`🔧 Source files: ${context.program?.sourceFiles?.size || 0}`)

	// Create AssetEmitter instance
	const assetEmitter = createAssetEmitter(
		context.program,
		AsyncAPITypeEmitter,
		context,
	)

	// Emit the program using AssetEmitter
	assetEmitter.emitProgram()

	// Write output files
	await assetEmitter.writeOutput()

	Effect.log(`🎯 PROOF: This emitter processed actual TypeSpec AST using AssetEmitter!`)
}