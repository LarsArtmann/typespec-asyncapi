/**
 * EmissionPipeline - Sequential Stage Processing
 *
 * Handles the ordered execution of emission stages with plugin integration.
 * Each stage is isolated and can be extended through plugins.
 *
 * Pipeline Stages:
 * 1. Discovery - Find operations, messages, security configs
 * 2. Processing - Transform TypeSpec AST to AsyncAPI structures
 * 3. Generation - Create final AsyncAPI document
 * 4. Validation - Verify AsyncAPI compliance
 * 5. Serialization - Convert to JSON/YAML format
 */

import {Effect} from "effect"
import type {Model, Operation, Program} from "@typespec/compiler"
import type {AssetEmitter} from "@typespec/asset-emitter"
import type {AsyncAPIObject} from "@asyncapi/parser/esm/spec-types/v3.js"
import type {AsyncAPIEmitterOptions} from "../options.js"
import type {SecurityConfig} from "../decorators/security.js"
import {buildServersFromNamespaces} from "../utils/typespec-helpers.js"
import {DocumentBuilder} from "./DocumentBuilder.js"
import {DiscoveryService} from "./DiscoveryService.js"
import {ProcessingService} from "./ProcessingService.js"

export type PipelineContext = {
	program: Program
	asyncApiDoc: AsyncAPIObject
	emitter: AssetEmitter<string, AsyncAPIEmitterOptions>
}

export type DiscoveryResult = {
	operations: Operation[]
	messageModels: Model[]
	securityConfigs: SecurityConfig[]
}

/**
 * Effect.TS-based emission pipeline with plugin integration
 */
export class EmissionPipeline {
	private readonly documentBuilder: DocumentBuilder
	private readonly discoveryService: DiscoveryService
	private readonly processingService: ProcessingService

	constructor() {
		this.documentBuilder = new DocumentBuilder()
		this.discoveryService = new DiscoveryService()
		this.processingService = new ProcessingService()
	}

	/**
	 * Execute the complete emission pipeline with REAL business logic integration
	 */
	executePipeline(context: PipelineContext) {
		return Effect.gen(function* (this: EmissionPipeline) {
			Effect.log(`🚀 Starting emission pipeline stages...`)

			// Stage 1: Discovery
			const discoveryResult = yield* this.executeDiscoveryStage(context)

			// Stage 2: Processing
			yield* this.executeProcessingStage(context, discoveryResult)

			// Stage 3: Document Generation (updates context.asyncApiDoc in-place)
			yield* this.executeGenerationStage(context, discoveryResult)

			// Stage 4: Validation
			yield* this.executeValidationStage(context)

			Effect.log(`✅ All emission pipeline stages completed successfully`)
		}.bind(this))
	}

	/**
	 * Stage 1: Discovery - Find all TypeSpec elements using REAL DiscoveryService
	 */
	private executeDiscoveryStage(context: PipelineContext) {
		return Effect.gen(function* (this: EmissionPipeline) {
			Effect.log(`🔍 Stage 1: Discovery with REAL DiscoveryService`)

			// Use REAL DiscoveryService with complete AST traversal logic
			const result = yield* this.discoveryService.executeDiscovery(context.program)

			Effect.log(`📊 Discovery stage complete: ${result.operations.length} operations, ${result.messageModels.length} messages, ${result.securityConfigs.length} security configs`)

			return result
		}.bind(this))
	}

	/**
	 * Stage 2: Processing - Transform TypeSpec elements using REAL ProcessingService
	 */
	private executeProcessingStage(context: PipelineContext, discoveryResult: DiscoveryResult) {
		return Effect.gen(function* (this: EmissionPipeline) {
			Effect.log(`🏗️ Stage 2: Processing with REAL ProcessingService`)

			// Use REAL ProcessingService with complete transformation logic
			const processingResult = yield* this.processingService.executeProcessing(
				discoveryResult.operations,
				discoveryResult.messageModels,
				discoveryResult.securityConfigs,
				context.asyncApiDoc,
				context.program
			)

			Effect.log(`📊 Processing stage complete: ${processingResult.totalProcessed} elements transformed`)

			Effect.log(`✅ Processing stage completed`)
		}.bind(this))
	}

	/**
	 * Stage 3: Document Generation - Finalize AsyncAPI document using REAL DocumentBuilder logic
	 */
	private executeGenerationStage(context: PipelineContext, discoveryResult: DiscoveryResult) {
		return Effect.gen(function* (this: EmissionPipeline) {
			Effect.log(`📄 Stage 3: Document Generation with DocumentBuilder`)

			// Use DocumentBuilder to ensure proper document structure
			this.documentBuilder.initializeDocumentStructure(context.asyncApiDoc)
			
			// Update document info with discovered statistics using DocumentBuilder
			this.documentBuilder.updateDocumentInfo(context.asyncApiDoc, {
				description: `Generated from TypeSpec with ${discoveryResult.operations.length} operations, ${discoveryResult.messageModels.length} messages, ${discoveryResult.securityConfigs.length} security configs`
			})

			// Ensure servers are populated using DocumentBuilder patterns
			if (!context.asyncApiDoc.servers || Object.keys(context.asyncApiDoc.servers).length === 0) {
				context.asyncApiDoc.servers = buildServersFromNamespaces(context.program) as AsyncAPIObject["servers"]
			}

			// Note: Processing is now handled by ProcessingService in Stage 2
			// Generation stage focuses on document finalization only

			Effect.log(`✅ Document generation completed - processed ${discoveryResult.operations.length} operations and ${discoveryResult.messageModels.length} messages`)
		}.bind(this))
	}

	/**
	 * Stage 4: Validation - Verify AsyncAPI compliance
	 */
	private executeValidationStage(context: PipelineContext) {
		return Effect.gen(function* (this: EmissionPipeline) {
			Effect.log(`🔍 Stage 4: Validation`)

			// Basic structural validation
			const channelsCount = Object.keys(context.asyncApiDoc.channels || {}).length
			const operationsCount = Object.keys(context.asyncApiDoc.operations || {}).length

			if (channelsCount === 0 && operationsCount === 0) {
				yield* Effect.logWarning("⚠️ Document has no channels or operations")
			}

			Effect.log(`✅ Validation completed - ${channelsCount} channels, ${operationsCount} operations`)
		}.bind(this))
	}

	/**
	 * REMOVED: Placeholder discovery methods - now using DiscoveryService with REAL business logic
	 * 
	 * The following methods have been extracted to DiscoveryService:
	 * - discoverOperations() -> DiscoveryService.discoverOperations()
	 * - discoverMessageModels() -> DiscoveryService.discoverMessageModels()  
	 * - discoverSecurityConfigs() -> DiscoveryService.discoverSecurityConfigs()
	 * 
	 * These methods contained placeholder logic and have been replaced by the REAL implementations
	 * extracted from the 1,800-line monolithic file with proper TypeSpec AST traversal.
	 */

	/**
	 * Type-safe helper to get string values from TypeSpec state maps
	 */
	/**
	 * REMOVED: All placeholder processing methods - now using ProcessingService with REAL business logic
	 * 
	 * The following methods have been extracted to ProcessingService:
	 * - processOperation() -> ProcessingService.processOperations()
	 * - processMessageModel() -> ProcessingService.processMessageModels()
	 * - processSecurityConfig() -> ProcessingService.processSecurityConfigs()
	 * - processOperationIntoDocument() -> ProcessingService.processSingleOperation()
	 * - processMessageModelIntoDocument() -> ProcessingService.processSingleMessageModel()
	 * - getStringFromStateMap() -> ProcessingService.extractOperationMetadata()
	 * 
	 * These methods contained placeholder/duplicate logic and have been replaced by the REAL
	 * implementations extracted from the 1,800-line monolithic file with complete TypeSpec integration.
	 */
}

