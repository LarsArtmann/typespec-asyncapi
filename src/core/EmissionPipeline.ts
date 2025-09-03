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

// TODO: CRITICAL - Import organization inconsistent - group by source (TypeScript, @typespec, @asyncapi, local)
// TODO: CRITICAL - Effect import could be more specific - only Effect.gen and Effect.log are used
// TODO: CRITICAL - Missing validation that AsyncAPI parser version matches expected v3 types
import {Effect} from "effect"
import type {Model, Operation, Program} from "@typespec/compiler"
import type {AssetEmitter} from "@typespec/asset-emitter"
import type {AsyncAPIObject} from "@asyncapi/parser/esm/spec-types/v3.js"
import type {AsyncAPIEmitterOptions} from "../options.js"
import type {SecurityConfig} from "../decorators/security.js"
import {buildServersFromNamespaces} from "../utils/typespec-helpers.js"
// import {effectLogging} from "../utils/effect-helpers.js"
import {DocumentBuilder} from "./DocumentBuilder.js"
import {DiscoveryService} from "./DiscoveryService.js"
import {ProcessingService} from "./ProcessingService.js"
import {ValidationService} from "./ValidationService.js"

// TODO: CRITICAL - PipelineContext lacks validation or constraints - any values could be passed
// TODO: CRITICAL - Consider making PipelineContext immutable with readonly properties
export type PipelineContext = {
	program: Program
	asyncApiDoc: AsyncAPIObject
	emitter: AssetEmitter<string, AsyncAPIEmitterOptions>
}

// TODO: CRITICAL - DiscoveryResult arrays could be empty but no validation for minimum required elements
// TODO: CRITICAL - Consider adding metadata fields (discovery timestamp, source locations) for debugging
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
	private readonly validationService: ValidationService

	// TODO: CRITICAL - Constructor lacks error handling for service initialization failures  
	// TODO: CRITICAL - No dependency injection - services hardcoded making testing difficult
	// TODO: CRITICAL - Services created without configuration - should pass pipeline options
	constructor() {
		// TODO: CRITICAL - Service instantiation could throw but no try-catch wrapper
		// TODO: CRITICAL - No validation that services implement required interfaces
		this.documentBuilder = new DocumentBuilder()
		this.discoveryService = new DiscoveryService()
		this.processingService = new ProcessingService()
		this.validationService = new ValidationService()
	}

	/**
	 * Execute the complete emission pipeline with REAL business logic integration
	 */
	// TODO: CRITICAL - Method lacks explicit return type annotation
	// TODO: CRITICAL - No input validation for context parameter
	// TODO: CRITICAL - Pipeline execution not configurable - stages always run in same order
	executePipeline(context: PipelineContext) {
		// TODO: CRITICAL - Effect.gen pattern used but no error recovery between stages
		// TODO: CRITICAL - Pipeline failure in any stage stops entire process - no partial recovery
		return Effect.gen(function* (this: EmissionPipeline) {
			// TODO: CRITICAL - Log uses emoji and not awaited - may not appear in production
			Effect.log(`🚀 Starting emission pipeline stages...`)

			// Stage 1: Discovery
			Effect.log(`🚀 About to start Stage 1: Discovery`)
			const discoveryResult = yield* this.executeDiscoveryStage(context)
			Effect.log(`✅ Completed Stage 1: Discovery`)

			// Stage 2: Processing
			Effect.log(`🚀 About to start Stage 2: Processing`)
			yield* this.executeProcessingStage(context, discoveryResult)
			Effect.log(`✅ Completed Stage 2: Processing`)

			// Stage 3: Document Generation (updates context.asyncApiDoc in-place)
			Effect.log(`🚀 About to start Stage 3: Generation`)
			yield* this.executeGenerationStage(context, discoveryResult)
			Effect.log(`✅ Completed Stage 3: Generation`)

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
	 * Stage 4: Validation - Verify AsyncAPI compliance using REAL ValidationService
	 */
	private executeValidationStage(context: PipelineContext) {
		return Effect.gen(function* (this: EmissionPipeline) {
			Effect.log(`🔍 Stage 4: Validation with REAL ValidationService`)

			// Use REAL ValidationService with comprehensive AsyncAPI 3.0 compliance checking
			const validationResult = yield* this.validationService.validateDocument(context.asyncApiDoc)

			if (!validationResult.isValid) {
				Effect.log(`❌ Validation failed with ${validationResult.errors.length} errors:`)
				validationResult.errors.forEach((error: string) => Effect.log(`  - ${error}`))
				
				// TODO: Add logValidationWarnings method to effectLogging
			// yield* effectLogging.logValidationWarnings("AsyncAPI document", validationResult.warnings)
				
				yield* Effect.fail(new Error(`AsyncAPI document validation failed with ${validationResult.errors.length} errors`))
			} else {
				Effect.log(`✅ Validation completed successfully - ${validationResult.channelsCount} channels, ${validationResult.operationsCount} operations, ${validationResult.messagesCount} messages`)
				
				// TODO: Add logValidationWarnings method to effectLogging
			// yield* effectLogging.logValidationWarnings("AsyncAPI document", validationResult.warnings)
			}
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

