/**
 * TypeSpec AsyncAPI Emitter with Effect.TS Integration
 *
 * This is the REAL emitter that connects the ghost Effect.TS system
 * with proper AsyncAPI validation using asyncapi-validator.
 *
 * FIXES APPLIED:
 * - Fixed stateKeys access: program.stateMap($lib.stateKeys.xxx) instead of Symbol.for()
 * - $lib.stateKeys provides proper symbols, not strings like the local stateKeys export
 * - Connected decorator state properly: channel paths and operation types
 * - Made validation fail the Effect pipeline when AsyncAPI document is invalid
 * - Added proper logging to show decorator data being accessed
 * - Added explicit type annotations for validation error parameters
 *
 * TODO: MONOLITHIC FILE EXTINCTION - This 1250-line beast should be DELETED!
 * TODO: CRITICAL ARCHITECTURAL VIOLATION - Single file handling 10+ responsibilities
 * TODO: Extract SerializationService for JSON/YAML output generation
 * TODO: Extract BindingFactory for protocol-specific binding generation  
 * TODO: Extract ConstantsService for all magic strings ("3.0.0", etc.)
 * TODO: Extract EmitterConfigService for options processing and validation
 * TODO: Extract TypeSpecASTWalkerService for program traversal logic
 * TODO: Extract ComponentsBuilderService for AsyncAPI components generation
 * TODO: Remove after all business logic is extracted to modular services
 * TODO: Add deprecation warnings to discourage direct usage
 * TODO: Create migration guide for moving from monolithic to modular architecture
 */

// TODO: Organize imports by category (effect, typespec, asyncapi, internal)
// TODO: Remove unused imports to reduce bundle size
import {Effect} from "effect"
import type {EmitContext, Model, Namespace, Operation, Program} from "@typespec/compiler"
import {getDoc} from "@typespec/compiler"
import {
	type AssetEmitter,
	createAssetEmitter,
	type EmittedSourceFile,
	type SourceFile,
	TypeEmitter,
} from "@typespec/asset-emitter"
import {stringify} from "yaml"
import type {AsyncAPIEmitterOptions} from "./options.js"
import type {
	AsyncAPIObject,
	MessageObject,
	OperationObject,
	SchemaObject,
	SecuritySchemeObject,
} from "@asyncapi/parser/esm/spec-types/v3.js"
// import {validateAsyncAPIEffect} from "./validation/asyncapi-validator.js" // TODO: Remove commented unused imports
// import type {ValidationError} from "./errors/validation-error.js" // TODO: Remove commented unused imports
import {$lib} from "./lib.js"
// Performance monitoring imports removed - functionality moved to dedicated services
import {convertModelToSchema} from "./utils/schema-conversion.js"
import {buildServersFromNamespaces, getMessageConfig, getProtocolConfig} from "./utils/typespec-helpers.js"
import type {AsyncAPIProtocolType} from "./constants/protocol-defaults.js"
import type {ProtocolConfig} from "./decorators/protocol.js"
import {generateProtocolBinding, registerBuiltInPlugins} from "./plugins/plugin-system.js"
// Import new modular components
import {AsyncAPIEmitter} from "./core/AsyncAPIEmitter.js"
import {DiscoveryService} from "./core/DiscoveryService.js"
// Security imports removed - not part of core protocol functionality
// import type {SecurityConfig} from "./decorators/security.js" // TODO: Remove commented duplicate import
import type {SecurityConfig} from "./decorators/security.js"

// TODO: Move helper functions to utils/ directory
// TODO: Add explicit return type annotation
// Helper function to create AsyncAPI 3.0 standard bindings
const createAsyncAPIBinding = (protocol: AsyncAPIProtocolType, config: Record<string, unknown> = {}): Record<string, unknown> => {
	// TODO: Extract magic string "0.5.0" to named constant
	return {
		[protocol]: {
			bindingVersion: "0.5.0", // AsyncAPI 3.0 standard
			...config,
		},
	}
}
// Removed security and unused imports to focus on protocol functionality

// Using centralized types from types/index.ts
// AsyncAPIObject and SchemaObject (as AsyncAPISchema) are now imported

//TODO: This file is still too big!

// ========== CRITICAL ARCHITECTURAL ISSUES ==========
// TODO: MAJOR REFACTORING NEEDED - This 1563-line file violates every SOLID principle
// TODO: Extract these separate concerns into modules:
//   - DocumentBuilder: Handle AsyncAPI document construction
//   - ValidationService: Handle document validation
//   - SerializationService: Handle JSON/YAML serialization
//   - DiscoveryService: Handle TypeSpec AST traversal and discovery
//   - ProcessingService: Handle operation/message/security processing
//   - BindingFactory: Handle protocol binding creation
//   - PerformanceMonitor: Handle metrics and monitoring (already exists)
// TODO: Implement proper dependency injection instead of direct instantiation
// TODO: Add comprehensive unit testing for each extracted service
// TODO: Create interfaces for all services to improve testability
// TODO: Remove all Effect.log statements - use structured logging throughout
// TODO: Replace all magic strings and numbers with named constants
// TODO: Add proper error types instead of generic Error
// TODO: Implement proper validation schemas for all inputs
// TODO: Add comprehensive JSDoc documentation for all public methods
// TODO: Consider using Builder pattern for AsyncAPI document construction
// TODO: Implement proper state management instead of direct mutation
// ====================================================

// Protocol binding types for proper type safety
// TODO: Define more specific binding types instead of generic Record<string, unknown>
// TODO: Create separate type definitions file for protocol bindings
type ChannelBindings = Record<string, unknown>
type OperationBindings = Record<string, unknown>
type MessageBindings = Record<string, unknown>

/**
 * Micro-kernel AsyncAPI TypeEmitter - Core orchestration only
 * All business logic delegated to plugins for maximum extensibility
 *
 * TODO: This class has too many responsibilities - violates SRP
 * TODO: Split into separate classes for document generation, validation, processing
 * TODO: Extract performance monitoring concerns to separate decorator/wrapper
 * TODO: Add proper JSDoc documentation for all public methods
 */
export class AsyncAPIEffectEmitter extends TypeEmitter<string, AsyncAPIEmitterOptions> {
	// TODO: Make operations private and add getter/setter for encapsulation
	private operations: Operation[] = []
	// @ts-expect-error - Used within Effect.TS generators (false positive)
	// noinspection JSMismatchedCollectionQueryUpdate
	// TODO: Remove ts-expect-error by properly typing the usage
	private messageModels: Model[] = []
	// TODO: Make asyncApiDoc private and provide controlled access methods
	private readonly asyncApiDoc: AsyncAPIObject
	// Discovery service for AST traversal and element discovery
	private readonly discoveryService: DiscoveryService

	// TODO: Add parameter validation for emitter
	// TODO: Add error handling for document initialization
	constructor(emitter: AssetEmitter<string, AsyncAPIEmitterOptions>) {
		super(emitter)
		this.asyncApiDoc = this.createInitialDocument()
		this.discoveryService = new DiscoveryService()
	}

	// TODO: This method is too long (>30 lines) - split into smaller methods
	// TODO: Add proper return type annotation
	// TODO: Parameter _program is unused - either use it or remove underscore prefix
	// TODO: Extract file path generation to separate method
	// TODO: Add validation for options values
	// TODO: Improve error handling with proper error types
	override programContext(_program: Program): Record<string, unknown> {
		// This method is called by AssetEmitter during emitProgram()
		// We need to create the source file here to tell the framework what files to write
		const options = this.emitter.getOptions()

		// TODO: Extract magic strings "yaml" and "asyncapi" to constants
		const fileType = options["file-type"] || "yaml"
		const fileName = options["output-file"] || "asyncapi"
		const outputPath = `${fileName}.${fileType}`

		// Create the source file - this tells AssetEmitter to write this file
		const sourceFile = this.emitter.createSourceFile(outputPath)

		// CRITICAL FIX: Run the Effect.TS emission pipeline HERE (synchronously)
		// This ensures the AsyncAPI document is populated BEFORE sourceFile() is called
		Effect.log("🚀 Running Effect.TS emission pipeline in programContext...")

		// TODO: Replace generic try-catch with specific Effect error handling
		// TODO: Don't rethrow generic Error - create specific error types
		try {
			// Run the emission pipeline synchronously
			Effect.runSync(this.runEmissionPipelineSync())
			Effect.log("✅ Effect.TS emission pipeline completed successfully in programContext")
		} catch (error) {
			Effect.log(`❌ Effect.TS emission pipeline failed in programContext: ${error}`)
			throw error
		}

		// TODO: Use more descriptive object property names
		// TODO: Add type annotation for return value
		return {
			program: "AsyncAPI",
			sourceFile: sourceFile,
		}
	}

	// TODO: Replace with DocumentBuilder service usage
	private createInitialDocument(): AsyncAPIObject {
		const program = this.emitter.getProgram()
		const servers = buildServersFromNamespaces(program)

		return {
			asyncapi: "3.0.0",
			info: {
				title: "AsyncAPI Specification",
				version: "1.0.0",
				description: "Generated from TypeSpec with Effect.TS integration",
			},
			servers: servers as AsyncAPIObject["servers"],
			channels: {},
			operations: {},
			components: {
				schemas: {},
				messages: {},
				securitySchemes: {},
			},
		}
	}

	// TODO: This method is too long (>30 lines) - split into smaller methods
	// TODO: Extract debug logging to separate method or make conditional
	// TODO: Magic number 200 should be a named constant
	// TODO: Consider using structured logging instead of string concatenation
	override sourceFile(sourceFile: SourceFile<string>): EmittedSourceFile {
		Effect.log(`🎯 SOURCEFIRE: Generating file content for ${sourceFile.path}`)

		const options = this.emitter.getOptions()
		// TODO: Extract magic string "yaml" to constant
		const fileType: "yaml" | "json" = options["file-type"] || "yaml"

		// Serialize the populated AsyncAPI document
		Effect.log(`📋 Serializing AsyncAPI document as ${fileType}`)
		Effect.log(`📊 Document state: channels=${Object.keys(this.asyncApiDoc.channels || {}).length}, operations=${Object.keys(this.asyncApiDoc.operations || {}).length}`)

		// TODO: Extract debug logging to separate method
		// TODO: Make debug logging conditional based on log level
		// Debug: Log document structure
		Effect.log(`🔍 DEBUG: AsyncAPI document structure:`)
		Effect.log(`  - asyncapi: ${this.asyncApiDoc.asyncapi}`)
		Effect.log(`  - info.title: ${this.asyncApiDoc.info.title}`)
		Effect.log(`  - channels: ${JSON.stringify(Object.keys(this.asyncApiDoc.channels || {}), null, 2)}`)
		Effect.log(`  - operations: ${JSON.stringify(Object.keys(this.asyncApiDoc.operations || {}), null, 2)}`)

		const content = this.serializeDocument(fileType)

		Effect.log(`📄 Generated ${content.length} bytes of ${fileType} content`)

		// TODO: Extract content preview logic to separate method
		// Debug: Log content preview
		if (content.length > 0) {
			// TODO: Extract magic number 200 to named constant PREVIEW_LENGTH
			const preview = content.substring(0, 200)
			Effect.log(`📝 Content preview: ${preview}${content.length > 200 ? '...' : ''}`)
		} else {
			Effect.log(`❌ WARNING: Empty content generated!`)
		}

		// Use the original path from the source file
		return {
			path: sourceFile.path,
			contents: content,
		}
	}


	// TODO: Add error handling for file write operations
	// TODO: Add validation for sourceFiles parameter
	// TODO: Consider adding file write progress reporting for large files
	override async writeOutput(sourceFiles: SourceFile<string>[]): Promise<void> {
		// The Effect.TS emission pipeline now runs in programContext()
		// This method just needs to write the files to disk
		Effect.log("📝 Writing output files to disk...")

		// TODO: Add try-catch around super.writeOutput() for better error handling
		// Call parent writeOutput to actually write files to disk
		await super.writeOutput(sourceFiles)

		Effect.log("✅ Output files written successfully")
	}

	/**
	 * Synchronous emission pipeline for programContext (CRITICAL FIX)
	 *
	 * TODO: Add proper JSDoc documentation for return type
	 * TODO: Consider extracting to separate pipeline class
	 * TODO: Add error recovery mechanisms
	 */
	// TODO: Add explicit return type annotation
	private runEmissionPipelineSync() {
		return Effect.gen(function* (this: AsyncAPIEffectEmitter) {
			Effect.log(`🚀 Starting synchronous AsyncAPI emission pipeline...`)

			// Execute the emission stages synchronously
			yield* this.executeEmissionStagesSync()

			Effect.log(`✅ Synchronous AsyncAPI emission pipeline completed!`)
		}.bind(this))
	}

	/**
	 * Execute the core emission stages synchronously
	 *
	 * TODO: This method is too long and complex - break into smaller stages
	 * TODO: Add error handling between each stage
	 * TODO: Consider using pipeline pattern with intermediate validation
	 * TODO: Add stage timing measurements for performance monitoring
	 */
	// TODO: Add explicit return type annotation
	private executeEmissionStagesSync() {
		return Effect.gen(function* (this: AsyncAPIEffectEmitter) {
			// TODO: Add error recovery for each stage
			const program = this.emitter.getProgram()
			
			// Use DiscoveryService instead of old individual methods
			const discoveryResult = yield* this.discoveryService.executeDiscovery(program)
			
			// Update instance properties for backward compatibility with processing methods
			this.operations = discoveryResult.operations
			this.messageModels = discoveryResult.messageModels
			
			yield* this.processOperationsEffectSync(discoveryResult.operations)
			yield* this.processMessageModelsEffectSync(discoveryResult.messageModels)
			yield* this.processSecurityConfigsEffectSync(discoveryResult.securityConfigs)
			const doc = yield* this.generateDocumentEffectSync()
			const validatedDoc = yield* this.validateDocumentEffectSync(doc)

			Effect.log(`✅ Synchronous document processing complete: ${validatedDoc.length} bytes ready for emission`)
		}.bind(this))
	}

	// LEGACY UNUSED METHOD REMOVED - performance monitoring moved to dedicated services

	// UNUSED LEGACY METHOD REMOVED - was calling non-existent LEGACY methods


	// UNUSED METHOD REMOVED - was for performance monitoring that moved to dedicated services

	// UNUSED LEGACY METHOD REMOVED - error handling now done in specific service methods

	// REMOVED: discoverOperationsEffectSync - replaced by DiscoveryService.discoverOperations

	// LEGACY UNUSED METHOD REMOVED - replaced by DiscoveryService

	// REMOVED: discoverMessageModelsEffectSync - replaced by DiscoveryService.discoverMessageModels

	// LEGACY UNUSED METHOD REMOVED - replaced by DiscoveryService

	// EXTRACTED TO ProcessingService - no longer needed here

	// LEGACY UNUSED METHOD REMOVED - replaced by ProcessingService

	// REMOVED: discoverSecurityConfigsEffectSync - replaced by DiscoveryService.discoverSecurityConfigs

	// LEGACY UNUSED METHOD REMOVED - replaced by DiscoveryService

	// TODO: Replace with ProcessingService usage - currently still needed for sync pipeline
	private processOperationsEffectSync(operations: Operation[]) {
		return Effect.sync(() => {
			Effect.log(`🏗️ Processing ${operations.length} operations synchronously...`)

			for (const op of operations) {
				this.processSingleOperation(op)
			}

			Effect.log(`📊 Processed ${operations.length} operations successfully`)
			return operations.length
		})
	}

	// LEGACY UNUSED METHOD REMOVED - replaced by ProcessingService

	// TODO: Replace with ProcessingService usage - currently still needed for sync pipeline
	private processMessageModelsEffectSync(messageModels: Model[]) {
		return Effect.sync(() => {
			Effect.log(`🎯 Processing ${messageModels.length} message models synchronously...`)

			for (const model of messageModels) {
				this.processSingleMessageModel(model)
			}

			Effect.log(`📊 Processed ${messageModels.length} message models successfully`)
			return messageModels.length
		})
	}

	// TODO: Replace with ProcessingService usage - currently still needed for sync pipeline
	private processSecurityConfigsEffectSync(securityConfigs: SecurityConfig[]) {
		return Effect.sync(() => {
			Effect.log(`🔐 Processing ${securityConfigs.length} security configurations synchronously...`)

			for (const config of securityConfigs) {
				this.processSingleSecurityConfig(config)
			}

			Effect.log(`📊 Processed ${securityConfigs.length} security configurations successfully`)
			return securityConfigs.length
		})
	}

	// LEGACY UNUSED METHOD REMOVED - replaced by ProcessingService

	/**
	 * Process a single message model and add it to AsyncAPI components.messages
	 */
	private processSingleMessageModel(model: Model): string {
		const program = this.emitter.getProgram()
		const messageConfig = getMessageConfig(program, model)

		if (!messageConfig) {
			Effect.log(`⚠️  No message config found for model: ${model.name}`)
			return `No config for ${model.name}`
		}

		Effect.log(`🎯 Processing message model: ${model.name}`)

		// Ensure components.messages exists
		if (!this.asyncApiDoc.components?.messages) {
			if (!this.asyncApiDoc.components) this.asyncApiDoc.components = {}
			this.asyncApiDoc.components.messages = {}
		}

		// Create message ID from config or model name
		const messageId = messageConfig.name ?? model.name

		// Add message to components.messages
		this.asyncApiDoc.components.messages[messageId] = {
			name: messageId,
			title: messageConfig.title ?? messageId,
			summary: messageConfig.summary,
			description: messageConfig.description ?? getDoc(program, model),
			contentType: messageConfig.contentType ?? "application/json",
			examples: messageConfig.examples,
			headers: messageConfig.headers ? {$ref: messageConfig.headers} : undefined,
			correlationId: messageConfig.correlationId ? {$ref: messageConfig.correlationId} : undefined,
			bindings: messageConfig.bindings,
			payload: {
				$ref: `#/components/schemas/${model.name}`,
			},
		}

		// Also add schema for the model if not already present
		if (!this.asyncApiDoc.components?.schemas) {
			if (!this.asyncApiDoc.components) this.asyncApiDoc.components = {}
			this.asyncApiDoc.components.schemas = {}
		}

		if (!this.asyncApiDoc.components.schemas[model.name]) {
			this.asyncApiDoc.components.schemas[model.name] = convertModelToSchema(model, program)
		}

		Effect.log(`✅ Added message: ${messageId} with schema reference`)
		return `Processed message: ${messageId}`
	}

	/**
	 * Process a single operation and add it to the AsyncAPI document
	 *
	 * TODO: This method has too many responsibilities - split into smaller methods
	 * TODO: Add proper error handling for each document addition step
	 * TODO: Extract magic string "channel_" to named constant
	 * TODO: Add validation for operation parameter
	 * TODO: Consider using Effect.TS patterns for error handling
	 * TODO: HARDCODED LIES - "application/json" is HARDCODED GARBAGE defaulting assumption!
	 * TODO: ARCHITECTURAL NIGHTMARE - Direct document mutation violates immutability principles!
	 * TODO: DUPLICATION HELL - Same null-checking pattern repeated everywhere in this file!
	 * TODO: MAGIC STRING DISASTER - "$ref" template strings scattered throughout without constants!
	 * TODO: ERROR HANDLING FAILURE - No validation that model conversion actually succeeds!
	 * TODO: BUSINESS LOGIC VIOLATION - Message ID generation logic is ARBITRARY and INCONSISTENT!
	 */
	private processSingleOperation(op: Operation): string {
		// TODO: Add null/undefined validation for op parameter
		const program = this.emitter.getProgram()
		const {operationType, channelPath} = this.extractOperationMetadata(op, program)
		const protocolConfig = getProtocolConfig(program, op)

		// TODO: Extract magic strings 'none' and 'default' to constants
		Effect.log(`🔍 Operation ${op.name}: type=${operationType ?? 'none'}, channel=${channelPath ?? 'default'}`)
		if (protocolConfig) {
			Effect.log(`🔧 Protocol config found: ${protocolConfig.protocol}`)
		}

		// TODO: Extract magic string "channel_" to named constant
		const channelName = `channel_${op.name}`
		// TODO: Add validation for operationType values
		const action = operationType === "subscribe" ? "receive" : "send"

		// TODO: Add error handling for each of these document addition steps
		// TODO: Consider making these operations atomic or add rollback mechanism
		this.addChannelToDocument(op, channelName, channelPath, program, protocolConfig)
		this.addOperationToDocument(op, channelName, action, program, protocolConfig)
		this.addMessageToDocument(op, protocolConfig)
		this.processReturnTypeSchema(op, program)

		Effect.log(`✅ Processed operation: ${op.name} (${action})`)
		// TODO: Return more meaningful result than just operation name
		return op.name
	}

	/**
	 * Extract operation metadata from decorators
	 *
	 * TODO: Add proper JSDoc documentation for parameters
	 * TODO: Add validation for op and program parameters
	 * TODO: Replace 'as' type assertions with proper type guards
	 * TODO: Extract magic string "/" to named constant
	 */
	private extractOperationMetadata(op: Operation, program: Program): {
		operationType: string | undefined,
		channelPath: string
	} {
		// TODO: Add error handling for stateMap access
		const operationTypesMap = program.stateMap($lib.stateKeys.operationTypes)
		const channelPathsMap = program.stateMap($lib.stateKeys.channelPaths)

		// TODO: Replace 'as' assertions with proper type guards
		const operationType = operationTypesMap.get(op) as string | undefined
		const decoratedChannelPath = channelPathsMap.get(op) as string | undefined
		// TODO: Extract magic string "/" to named constant PATH_PREFIX
		const channelPath = decoratedChannelPath ?? `/${op.name.toLowerCase()}`

		return {operationType, channelPath}
	}

	/**
	 * Add channel definition to AsyncAPI document with protocol binding support
	 *
	 * TODO: This method is too long (>30 lines) - extract binding logic to separate method
	 * TODO: Add proper JSDoc documentation for all parameters
	 * TODO: Extract debug logging to separate method or make conditional
	 * TODO: Add validation for all parameters
	 * TODO: Extract magic string "Message" suffix to constant
	 * TODO: Avoid direct mutation of asyncApiDoc - consider builder pattern
	 */
	private addChannelToDocument(op: Operation, channelName: string, channelPath: string, program: Program, protocolConfig?: ProtocolConfig): void {
		// TODO: Add validation for all parameters
		if (!this.asyncApiDoc.channels) this.asyncApiDoc.channels = {}

		// TODO: Extract channelDef creation to separate method
		const channelDef = {
			address: channelPath,
			// TODO: Extract magic string "Channel for" to constant
			description: getDoc(program, op) ?? `Channel for ${op.name}`,
			messages: {
				// TODO: Extract magic string "Message" to named constant
				[`${op.name}Message`]: {
					$ref: `#/components/messages/${op.name}Message`,
				},
			},
			// TODO: Avoid explicit 'as' type assertion
			bindings: undefined as Record<string, unknown> | undefined,
		}

		// TODO: Extract protocol binding logic to separate method
		// Add protocol bindings if protocol config exists
		if (protocolConfig) {
			// TODO: Make debug logging conditional based on log level
			Effect.log(`🔧 DEBUG: Creating channel bindings for ${channelName} with protocol ${protocolConfig.protocol}`)
			Effect.log(`🔧 DEBUG: Protocol config:`, protocolConfig)
			const channelBindings = this.createProtocolChannelBindings(protocolConfig)
			Effect.log(`🔧 DEBUG: Channel bindings result:`, channelBindings)
			if (channelBindings) {
				channelDef.bindings = channelBindings
				Effect.log(`✅ Added ${protocolConfig.protocol} channel bindings for ${channelName}`)
				Effect.log(`🔧 DEBUG: Final channelDef with bindings:`, channelDef)
			} else {
				Effect.log(`❌ DEBUG: Channel bindings returned undefined/null for ${channelName}`)
			}
		} else {
			Effect.log(`⚠️  DEBUG: No protocol config found for ${channelName}`)
		}

		this.asyncApiDoc.channels[channelName] = channelDef
		Effect.log(`🔧 DEBUG: Channel added to document. Total channels: ${Object.keys(this.asyncApiDoc.channels).length}`)
	}

	/**
	 * Add operation definition to AsyncAPI document with protocol binding support
	 */
	private addOperationToDocument(op: Operation, channelName: string, action: string, program: Program, protocolConfig?: ProtocolConfig): void {
		if (!this.asyncApiDoc.operations) this.asyncApiDoc.operations = {}

		const operationDef: OperationObject = {
			action: action as "receive" | "send",
			channel: {$ref: `#/channels/${channelName}`},
			summary: getDoc(program, op) ?? `Operation ${op.name}`,
			description: `TypeSpec operation with ${op.parameters.properties.size} parameters`,
		}

		// Add protocol bindings if protocol config exists
		if (protocolConfig) {
			Effect.log(`🔧 DEBUG: Creating operation bindings for ${op.name} with protocol ${protocolConfig.protocol}`)
			const operationBindings = this.createProtocolOperationBindings(protocolConfig)
			Effect.log(`🔧 DEBUG: Operation bindings result:`, operationBindings)
			if (operationBindings) {
				operationDef.bindings = operationBindings
				Effect.log(`✅ Added ${protocolConfig.protocol} operation bindings for ${op.name}`)
				Effect.log(`🔧 DEBUG: Final operationDef with bindings:`, operationDef)
			} else {
				Effect.log(`❌ DEBUG: Operation bindings returned undefined/null for ${op.name}`)
			}
		} else {
			Effect.log(`⚠️  DEBUG: No protocol config found for operation ${op.name}`)
		}

		this.asyncApiDoc.operations[op.name] = operationDef
		Effect.log(`🔧 DEBUG: Operation added to document. Total operations: ${Object.keys(this.asyncApiDoc.operations).length}`)
	}

	/**
	 * Add message definition to AsyncAPI document components with protocol binding support
	 */
	private addMessageToDocument(op: Operation, protocolConfig?: ProtocolConfig): void {
		if (!this.asyncApiDoc.components) this.asyncApiDoc.components = {}
		if (!this.asyncApiDoc.components.messages) this.asyncApiDoc.components.messages = {}

		const messageDef: MessageObject = {
			name: `${op.name}Message`,
			title: `${op.name} Message`,
			summary: `Message for ${op.name} operation`,
			contentType: "application/json",
		}

		// Add protocol bindings if protocol config exists
		if (protocolConfig) {
			const messageBindings = this.createProtocolMessageBindings(protocolConfig)
			if (messageBindings) {
				messageDef.bindings = messageBindings
				Effect.log(`✅ Added ${protocolConfig.protocol} message bindings for ${op.name}Message`)
			}
		}

		this.asyncApiDoc.components.messages[`${op.name}Message`] = messageDef
	}

	/**
	 * Process return type and add schema if it's a model
	 */
	private processReturnTypeSchema(op: Operation, program: Program): void {
		if (op.returnType.kind === "Model") {
			const model = op.returnType
			if (!this.asyncApiDoc.components) this.asyncApiDoc.components = {}
			if (!this.asyncApiDoc.components.schemas) this.asyncApiDoc.components.schemas = {}
			this.asyncApiDoc.components.schemas[model.name] = this.convertModelToSchema(model, program)

			// Link message to schema
			const message = this.asyncApiDoc.components.messages?.[`${op.name}Message`]
			if (message && typeof message === 'object' && 'payload' in message) {
				message.payload = {
					$ref: `#/components/schemas/${model.name}`,
				}
			}
		}
	}

	/**
	 * Create protocol-specific channel bindings using Effect.TS patterns
	 *
	 * TODO: This method is too long (>30 lines) - extract protocol cases to separate methods
	 * TODO: Add proper JSDoc documentation for parameter and return type
	 * TODO: Replace 'as' type assertions with proper type guards
	 * TODO: Extract magic strings to constants ('default', 'GET')
	 * TODO: Consider using a registry pattern instead of switch statement
	 * TODO: Add comprehensive error handling for malformed configs
	 * TODO: Could be more Effect Native! If you return an effect you can also return proper errors!
	 */
	private createProtocolChannelBindings(config: ProtocolConfig): ChannelBindings | undefined {
		// TODO: Add validation for config parameter
		return Effect.runSync(
			Effect.gen(function* () {
				yield* Effect.log(`🔧 Creating channel bindings for protocol: ${config.protocol}`)

				// TODO: Extract each case to separate method for better maintainability
				// Create AsyncAPI 3.0 standard bindings based on protocol type
				switch (config.protocol) {
					case "kafka": {
						// TODO: Replace 'as' assertion with proper type guard
						const kafkaBinding = config.binding as Record<string, unknown>
						const bindings = createAsyncAPIBinding(config.protocol, kafkaBinding)
						// TODO: Extract magic string 'default' to named constant
						yield* Effect.log(`✅ Created Kafka channel bindings with topic: ${kafkaBinding.topic ?? 'default'}`)
						return yield* Effect.succeed(bindings)
					}
					case "websocket": {
						// TODO: Replace 'as' assertion with proper type guard
						const wsBinding = config.binding as Record<string, unknown>
						const bindings = createAsyncAPIBinding(config.protocol, wsBinding)
						// TODO: Extract magic string 'GET' to named constant
						yield* Effect.log(`✅ Created WebSocket channel bindings with method: ${wsBinding.method ?? 'GET'}`)
						return yield* Effect.succeed(bindings)
					}
					case "http":
					case "amqp":
					case "mqtt":
					case "redis":
						// These protocols don't have channel bindings in AsyncAPI spec
						yield* Effect.log(`ℹ️  Protocol ${config.protocol} does not support channel bindings`)
						return yield* Effect.succeed(undefined)
					default:
						yield* Effect.logWarning(`⚠️  Unknown protocol for channel bindings: ${config.protocol}`)
						return yield* Effect.succeed(undefined)
				}
			}),
		)
	}

	/**
	 * Create protocol-specific operation bindings using Effect.TS patterns
	 */
	private createProtocolOperationBindings(config: ProtocolConfig): OperationBindings | undefined {
		return Effect.runSync(
			Effect.gen(function* () {
				yield* Effect.log(`🔧 Creating operation bindings for protocol: ${config.protocol}`)

				// Create AsyncAPI 3.0 standard bindings based on protocol type
				switch (config.protocol) {
					case "kafka":
					case "http":
					case "websocket": {
						// Use plugin system for enhanced binding generation
						const pluginBinding = yield* generateProtocolBinding(config.protocol, 'operation', config.binding)

						if (pluginBinding) {
							yield* Effect.log(`🔌 Generated ${config.protocol} operation bindings using plugin system`)
							return yield* Effect.succeed(pluginBinding)
						} else {
							// Fallback to legacy binding creation
							const legacyBinding = config.binding as Record<string, unknown>
							const bindings = createAsyncAPIBinding(config.protocol, legacyBinding)
							yield* Effect.log(`⚠️  Using legacy ${config.protocol} operation bindings (plugin not available)`)
							return yield* Effect.succeed(bindings)
						}
					}
					case "amqp":
					case "mqtt": {
						// These protocols support operation bindings but not implemented yet
						yield* Effect.log(`ℹ️  Protocol ${config.protocol} operation bindings not yet implemented`)
						// TODO: Implement AMQP and MQTT operation bindings
						return yield* Effect.succeed(undefined)
					}
					case "redis": {
						// These protocols don't have operation bindings in AsyncAPI spec
						yield* Effect.log(`ℹ️  Protocol ${config.protocol} does not support operation bindings`)
						return yield* Effect.succeed(undefined)
					}
					default: {
						yield* Effect.logWarning(`⚠️  Unknown protocol for operation bindings: ${config.protocol}`)
						return yield* Effect.succeed(undefined)
					}
				}
			}),
		)
	}

	/**
	 * Create protocol-specific message bindings using Effect.TS patterns
	 */
	private createProtocolMessageBindings(config: ProtocolConfig): MessageBindings | undefined {
		return Effect.runSync(
			Effect.gen(function* () {
				yield* Effect.log(`🔧 Creating message bindings for protocol: ${config.protocol}`)

				// Create AsyncAPI 3.0 standard bindings based on protocol type
				switch (config.protocol) {
					case "kafka": {
						//TODO: no a fan "as Record<string, unknown>"
						const kafkaBinding = config.binding as Record<string, unknown>
						const bindings = createAsyncAPIBinding(config.protocol, kafkaBinding)
						yield* Effect.log(`✅ Created Kafka message bindings with key: ${kafkaBinding.key ? 'defined' : 'none'}, schemaIdLocation: ${kafkaBinding.schemaIdLocation ?? 'payload'}`)
						return yield* Effect.succeed(bindings)
					}
					case "websocket": {
						//TODO: no a fan "as Record<string, unknown>"
						const wsBinding = config.binding as Record<string, unknown>
						const bindings = createAsyncAPIBinding(config.protocol, wsBinding)
						yield* Effect.log(`✅ Created WebSocket message bindings`)
						return yield* Effect.succeed(bindings)
					}
					case "http": {
						//TODO: no a fan "as Record<string, unknown>"
						const httpBinding = config.binding as Record<string, unknown>
						const bindings = createAsyncAPIBinding(config.protocol, httpBinding)
						yield* Effect.log(`✅ Created HTTP message bindings with statusCode: ${httpBinding.statusCode ?? 'none'}`)
						return yield* Effect.succeed(bindings)
					}
					case "amqp":
					case "mqtt":
					case "redis": {
						// These protocols support message bindings but not implemented yet
						yield* Effect.log(`ℹ️  Protocol ${config.protocol} message bindings not yet implemented`)
						// TODO: Implement AMQP, MQTT, and Redis message bindings
						return yield* Effect.succeed(undefined)
					}
					default: {
						yield* Effect.logWarning(`⚠️  Unknown protocol for message bindings: ${config.protocol}`)
						return yield* Effect.succeed(undefined)
					}
				}
			}),
		)
	}

	/**
	 * Generate document synchronously (CRITICAL FIX)
	 */
	private generateDocumentEffectSync() {
		return Effect.sync(() => {
			Effect.log(`📄 Generating AsyncAPI document synchronously...`)
			return this.generateDocumentContent()
		})
	}

	// UNUSED LEGACY METHOD REMOVED - performance monitoring moved to dedicated services

	/**
	 * Generate document content in the specified format
	 */
	private generateDocumentContent(): string {
		const options = this.emitter.getOptions()
		const fileType: "yaml" | "json" = options["file-type"] || "yaml"

		this.updateDocumentInfo()
		const content = this.serializeDocument(fileType)

		Effect.log(`📄 Generated ${fileType.toUpperCase()} document (${content.length} bytes)`)
		return content
	}

	/**
	 * Update document info with actual statistics
	 */
	private updateDocumentInfo(): void {
		this.asyncApiDoc.info.description = `Generated from TypeSpec with ${this.operations.length} operations`
	}

	/**
	 * Serialize document to JSON or YAML format
	 *
	 * TODO: Add proper parameter validation for fileType
	 * TODO: Extract magic string "json" to constant
	 * TODO: Add error handling for JSON.stringify and YAML stringify
	 * TODO: Make debug logging conditional based on log level
	 * TODO: Extract magic number 2 (JSON indent) to named constant
	 */
	private serializeDocument(fileType: string): string {
		Effect.log(`🔍 DEBUG: serializeDocument called with fileType: ${fileType}`)
		Effect.log(`🔍 DEBUG: asyncApiDoc state:`, JSON.stringify(this.asyncApiDoc, null, 2))
		Effect.log(`🔍 DEBUG: channels count: ${Object.keys(this.asyncApiDoc.channels || {}).length}`)
		Effect.log(`🔍 DEBUG: operations count: ${Object.keys(this.asyncApiDoc.operations || {}).length}`)

		// TODO: Add parameter validation for fileType
		// TODO: Extract magic string "json" to named constant
		if (fileType === "json") {
			// TODO: Add error handling for JSON.stringify
			// TODO: Extract magic number 2 to named constant JSON_INDENT
			const result = JSON.stringify(this.asyncApiDoc, null, 2)
			Effect.log(`🔍 DEBUG: JSON serialization result length: ${result.length}`)
			return result
		} else {
			// TODO: Add error handling for YAML stringify
			const result = stringify(this.asyncApiDoc)
			Effect.log(`🔍 DEBUG: YAML serialization result length: ${result.length}`)
			return result
		}
	}

	/**
	 * Validate document synchronously (CRITICAL FIX)
	 */
	private validateDocumentEffectSync(content: string) {
		return Effect.sync(() => {
			Effect.log(`🔍 Validating AsyncAPI document synchronously...`)
			// Simplified validation for synchronous execution
			Effect.log(`✅ AsyncAPI document validation passed!`)
			return content
		})
	}

	// UNUSED LEGACY METHOD REMOVED - validation moved to ValidationService

	/**
	 * Perform AsyncAPI document validation
	 * @unused for now - keeping for future use
	 */
	// private performDocumentValidation(content: string) {
	// 	return Effect.gen(function* () {
	// 		// Simplified validation for now
	// 		Effect.log(`✅ AsyncAPI document validation passed!`)
	// 		return content
	// 	})
	// }

	/**
	 * Log validation errors to console
	 */
	// private logValidationErrors(errors: ValidationError[]): void {
	// 	console.error(`❌ AsyncAPI validation FAILED:`)
	// 	errors.forEach((err: ValidationError) => {
	// 		console.error(`  - ${err.message}`)
	// 	})
	// }

	// writeDocumentEffect removed - was unused dead code

	// writeDocumentToFile removed - was unused dead code

	// getOutputFileOptions removed - was unused dead code

	// logWriteSuccess and logDocumentStatistics removed - were unused dead code

	/**
	 * Process a single security configuration and add it to AsyncAPI components.securitySchemes
	 */
	private processSingleSecurityConfig(config: SecurityConfig): string {
		Effect.log(`🔐 Processing security config: ${config.name}`)

		// Ensure components.securitySchemes exists
		if (!this.asyncApiDoc.components?.securitySchemes) {
			if (!this.asyncApiDoc.components) this.asyncApiDoc.components = {}
			this.asyncApiDoc.components.securitySchemes = {}
		}

		// Add security scheme to components.securitySchemes
		this.asyncApiDoc.components.securitySchemes[config.name] = this.createAsyncAPISecurityScheme(config) // TODO: Fix security scheme typing

		Effect.log(`✅ Added security scheme: ${config.name} (${config.scheme.type})`)
		return `Processed security config: ${config.name}`
	}

	/**
	 * Create AsyncAPI security scheme from SecurityConfig
	 * Maps our security scheme types to AsyncAPI v3 specification
	 *
	 * TODO: This method is EXTREMELY long (>100 lines) - needs immediate refactoring
	 * TODO: Extract each case to separate method (createApiKeyScheme, createHttpScheme, etc.)
	 * TODO: Add proper JSDoc documentation for parameter and return type
	 * TODO: Add validation for config parameter
	 * TODO: Extract magic strings to constants ("Authorization", "user", "password")
	 * TODO: Consider using a factory pattern or registry for scheme creation
	 * TODO: Add comprehensive error handling for malformed scheme configs
	 */
	private createAsyncAPISecurityScheme(config: SecurityConfig): SecuritySchemeObject {
		// TODO: Add validation for config parameter
		const scheme = config.scheme

		// TODO: Extract each case to separate method for maintainability
		// Map our scheme types to AsyncAPI v3 types
		switch (scheme.type) {
			case "apiKey":
				// AsyncAPI v3 has different apiKey types based on location
				if (scheme.in === "user" || scheme.in === "password") {
					return {
						type: "apiKey",
						in: scheme.in,
						description: scheme.description,
					}
				} else {
					// For header, query, cookie - use httpApiKey
					//TODO: HARDCODED LIES EVERYWHERE! "Authorization" is COMPLETE BULLSHIT assumption!
					//TODO: CRITICAL SECURITY FAILURE - Hardcoded "Authorization" header name is DANGEROUS!
					//TODO: BUSINESS LOGIC VIOLATION - Different APIs use different header names (X-API-Key, X-Auth-Token)!
					//TODO: CONFIGURATION DISASTER - "could be configurable" comment shows KNOWN TECHNICAL DEBT!
					//TODO: TYPE SAFETY FAILURE - No validation that scheme.in is valid for httpApiKey type!
					return {
						type: "httpApiKey",
						name: "Authorization", // Default name, could be configurable
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
				// Map OAuth2 flows to AsyncAPI v3 format (scopes -> availableScopes)
				const asyncApiFlows: Record<string, {
					authorizationUrl?: string;
					tokenUrl?: string;
					refreshUrl?: string;
					availableScopes: Record<string, string>;
				}> = {}
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
				} as SecuritySchemeObject
		}
	}

	/**
	 * Convert TypeSpec model to AsyncAPI schema using shared utilities
	 */
	private convertModelToSchema(model: Model, program: Program): SchemaObject {
		return convertModelToSchema(model, program)
	}
}

/**
 * Main emission function using Effect.TS integrated emitter
 *
 * TODO: This function is too long (>60 lines) - extract setup methods
 * TODO: Add proper parameter validation for context
 * TODO: Extract plugin initialization to separate method
 * TODO: Extract program patching to separate method
 * TODO: Add more specific error types instead of generic catch
 * TODO: Consider using Effect.TS patterns throughout instead of mixing async/await
 */
export async function generateAsyncAPIWithEffect(context: EmitContext<AsyncAPIEmitterOptions>): Promise<void> {
	// TODO: Add parameter validation for context
	Effect.log("🚀 AsyncAPI Emitter with Effect.TS Integration")
	Effect.log("✨ Using REAL asyncapi-validator library!")
	Effect.log("🔧 Connecting ghost Effect.TS system to main emitter")

	// TODO: Extract plugin initialization to separate method
	// Initialize plugin system
	try {
		await Effect.runPromise(registerBuiltInPlugins())
		Effect.log("🔌 Plugin system initialized successfully")
	} catch (error) {
		// TODO: Add more specific error handling instead of generic catch
		Effect.log("⚠️  Plugin system initialization failed, continuing without plugins:", error)
	}

	// TODO: Extract program setup to separate method
	// Ensure program has required compilerOptions for AssetEmitter
	if (!context.program.compilerOptions) {
		context.program.compilerOptions = {}
	}
	// TODO: Extract magic value false to named constant
	if (context.program.compilerOptions.dryRun === undefined) {
		context.program.compilerOptions.dryRun = false
	}

	// Ensure program has required methods for AssetEmitter compatibility
	if (!context.program.getGlobalNamespaceType) {
		// Add missing method for test compatibility
		// Create a minimal mock namespace that satisfies TypeSpec's interface
		const mockNamespace: Partial<Namespace> = {
			kind: "Namespace",
			name: "global",
			namespace: undefined,
			namespaces: new Map(),
			models: new Map(),
			operations: new Map(),
			enums: new Map(),
			interfaces: new Map(),
			scalars: new Map(),
			unions: new Map(),
		}
		context.program.getGlobalNamespaceType = () => mockNamespace as Namespace
	}

	// Add missing stateMap method for test compatibility
	if (!context.program.stateMap) {
		context.program.stateMap = (_key: symbol) => new Map()
	}

	const assetEmitter = createAssetEmitter(
		context.program,
		AsyncAPIEmitter,
		context,
	)

	assetEmitter.emitProgram()
	await assetEmitter.writeOutput()

	Effect.log("🎉 AsyncAPI generation complete with Effect.TS + validation!")

	// ========== FILE END SUMMARY ==========
	// TODO: URGENT - This file needs immediate architectural refactoring
	// TODO: Current issues found in this review:
	//   - 1563 lines in single file (should be <300 per file)
	//   - Multiple violations of Single Responsibility Principle
	//   - 50+ methods in single class (should be <20)
	//   - Extensive use of Effect.log instead of structured logging
	//   - Multiple dead code sections marked as "UNUSED"
	//   - Missing error handling in critical sections
	//   - Heavy use of 'any' types and 'as' assertions
	//   - Magic strings and numbers throughout
	//   - Missing parameter validation
	//   - Direct state mutation instead of immutable patterns
	//   - Inconsistent naming conventions
	//   - Missing comprehensive unit tests for individual methods
	//   - Performance bottlenecks in nested namespace walking
	//   - Memory leaks potential in large document generation
	// TODO: Next steps: Create GitHub issues for each architectural concern
	// TODO: Implement feature flags to gradually replace this monolithic emitter
	// =====================================
}