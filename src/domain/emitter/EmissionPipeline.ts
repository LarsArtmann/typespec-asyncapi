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

// Core Effect.TS imports
import {Effect} from "effect"

// AsyncAPI and TypeSpec types
import type {AsyncAPIObject} from "@asyncapi/parser/esm/spec-types/v3.js"
import {buildServersFromNamespaces} from "../../utils/typespec-helpers.js"

// Standardized error handling
import {
	type StandardizedError,
	createError,
	failWith,
	railway,
	emitterErrors
} from "../../utils/standardized-errors.js"

// Domain services
import {DocumentBuilder} from "./DocumentBuilder.js"
import {DiscoveryService} from "./DiscoveryService.js"
import {ProcessingService} from "./ProcessingService.js"
import {ValidationService} from "../validation/ValidationService.js"
import type {DiscoveryResult} from "./DiscoveryResult.js"
import type {PipelineContext} from "../../application/services/PipelineContext.js"

import type { IPipelineService } from "../../application/services/PipelineService.js"

/**
 * Effect.TS-based emission pipeline with plugin integration
 * 
 * REFACTORED: Now implements IPipelineService interface for dependency injection
 * REFACTORED: Services will be injected instead of hard-coded instantiation
 */
export class EmissionPipeline implements IPipelineService {
	private readonly documentBuilder: DocumentBuilder
	private readonly discoveryService: DiscoveryService
	private readonly validationService: ValidationService

	/**
	 * Constructor with Effect.TS error handling for service initialization
	 * Service instantiation failures are critical system errors handled via Railway programming
	 * 
	 * ProcessingService is now functional with static methods - no instance needed
	 */
	constructor() {
		// Service initialization with Effect.TS Railway programming
		const initializationResult = Effect.runSync(
			Effect.gen(function* () {
				yield* Effect.log("🚀 Initializing EmissionPipeline services...")

				return {
					documentBuilder: new DocumentBuilder(),
					discoveryService: new DiscoveryService(),
					validationService: new ValidationService(),
				}
			}).pipe(
				Effect.catchAll((error: unknown) =>
					Effect.gen(function* () {
						yield* Effect.logError(`❌ Critical EmissionPipeline service initialization failed: ${String(error)}`)
						return yield* Effect.die(new Error(
							`Critical EmissionPipeline service initialization failed: ${String(error)}`
						))
					})
				)
			)
		)

		this.documentBuilder = initializationResult.documentBuilder
		this.discoveryService = initializationResult.discoveryService
		this.validationService = initializationResult.validationService
	}

	/**
	 * Execute the complete emission pipeline with REAL business logic integration
	 * Using Effect.TS Railway programming for comprehensive error handling
	 */
	executePipeline = (context: PipelineContext): Effect.Effect<void, StandardizedError> => {
		return Effect.gen(function* () {
			// Validate context parameter with proper error handling
			if (!context) {
				return yield* failWith(createError({
					what: "Cannot execute pipeline without valid context",
					reassure: "This is a parameter validation issue",
					why: "executePipeline requires a valid PipelineContext instance",
					fix: "Ensure the context parameter is properly initialized before calling executePipeline",
					escape: "Create a new PipelineContext with required program and asyncApiDoc properties",
					severity: "error" as const,
					code: "INVALID_PIPELINE_CONTEXT",
					context: { contextProvided: !!context }
				}))
			}

			yield* Effect.log(`🚀 Starting emission pipeline stages...`)

			// Stage 1: Discovery
			yield* Effect.log(`🚀 About to start Stage 1: Discovery`)
			const discoveryResult = yield* self.executeDiscoveryStage(context)
			yield* Effect.log(`✅ Completed Stage 1: Discovery`)

			// Stage 2: Processing
			yield* Effect.log(`🚀 About to start Stage 2: Processing`)
			yield* self.executeProcessingStage(context, discoveryResult)
			yield* Effect.log(`✅ Completed Stage 2: Processing`)

			// Stage 3: Document Generation (updates context.asyncApiDoc in-place)
			yield* Effect.log(`🚀 About to start Stage 3: Generation`)
			yield* self.executeGenerationStage(context, discoveryResult)
			yield* Effect.log(`✅ Completed Stage 3: Generation`)

			// Stage 4: Validation
			yield* self.executeValidationStage(context)

			yield* Effect.log(`✅ All emission pipeline stages completed successfully`)
		})
	}

	/**
	 * Stage 1: Discovery - Find all TypeSpec elements using REAL DiscoveryService
	 */
	private executeDiscoveryStage = (context: PipelineContext) => {
		const self = this
		return Effect.gen(function* () {
			yield* Effect.log(`🔍 Stage 1: Discovery with REAL DiscoveryService`)

			// Use REAL DiscoveryService with complete AST traversal logic
			const result = yield* self.discoveryService.executeDiscovery(context.program)

			yield* Effect.log(`📊 Discovery stage complete: ${result.operations.length} operations, ${result.messageModels.length} messages, ${result.securityConfigs.length} security configs`)

			return result
		})
	}

	/**
	 * Stage 2: Processing - Transform TypeSpec elements using REAL ProcessingService
	 */
	private executeProcessingStage(context: PipelineContext, discoveryResult: DiscoveryResult) {
		return Effect.gen(function* () {
			yield* Effect.log(`🏗️ Stage 2: Processing with REAL ProcessingService`)

			// Use REAL ProcessingService with complete transformation logic (static methods)
			const processingResult = yield* ProcessingService.executeProcessing(
				discoveryResult.operations,
				discoveryResult.messageModels,
				discoveryResult.securityConfigs,
				context.asyncApiDoc,
				context.program
			)

			yield* Effect.log(`📊 Processing stage complete: ${processingResult.totalProcessed} elements transformed`)

			yield* Effect.log(`✅ Processing stage completed`)
			return processingResult
		})
	}

	/**
	 * Stage 3: Document Generation - Finalize AsyncAPI document using REAL DocumentBuilder logic
	 */
	private executeGenerationStage(context: PipelineContext, discoveryResult: DiscoveryResult) {
		const pipeline = this
		return Effect.gen(function* () {
			yield* Effect.log(`📄 Stage 3: Document Generation with DocumentBuilder`)

			// Use DocumentBuilder to ensure proper document structure with Effect.TS
			yield* pipeline.documentBuilder.initializeDocumentStructure(context.asyncApiDoc)
			
			// Update document info with discovered statistics using DocumentBuilder
			yield* pipeline.documentBuilder.updateDocumentInfo(context.asyncApiDoc, {
				description: `Generated from TypeSpec with ${discoveryResult.operations.length} operations, ${discoveryResult.messageModels.length} messages, ${discoveryResult.securityConfigs.length} security configs`
			})

			// Ensure servers are populated using DocumentBuilder patterns with Railway programming
			if (!context.asyncApiDoc.servers || Object.keys(context.asyncApiDoc.servers).length === 0) {
				const serversResult = yield* railway.trySync(
					() => buildServersFromNamespaces(context.program),
					{ context: { operation: "buildServersFromNamespaces" } }
				)
				
				if (serversResult && Object.keys(serversResult).length > 0) {
					// Use Object.assign to properly merge servers
					Object.assign(context.asyncApiDoc, { servers: serversResult as AsyncAPIObject["servers"] })
				}
			}

			// Note: Processing is now handled by ProcessingService in Stage 2
			// Generation stage focuses on document finalization only

			yield* Effect.log(`✅ Document generation completed - processed ${discoveryResult.operations.length} operations and ${discoveryResult.messageModels.length} messages`)
		})
	}

	/**
	 * Stage 4: Validation - Verify AsyncAPI compliance using REAL ValidationService
	 */
	private executeValidationStage(context: PipelineContext) {
		const pipeline = this
		return Effect.gen(function* () {
			yield* Effect.log(`🔍 Stage 4: Validation with REAL ValidationService`)

			// Use REAL ValidationService with comprehensive AsyncAPI 3.0 compliance checking
			const validationResult = yield* pipeline.validationService.validateDocument(context.asyncApiDoc)

			if (!validationResult.isValid) {
				yield* Effect.log(`❌ Validation failed with ${validationResult.errors.length} errors:`)
				for (const error of validationResult.errors) {
					yield* Effect.log(`  - ${error}`)
				}
				
				// Use standardized error instead of plain Error
				return yield* failWith(emitterErrors.invalidAsyncAPI(
					validationResult.errors,
					context.asyncApiDoc
				))
			} else {
				yield* Effect.log(`✅ Validation completed successfully - ${validationResult.channelsCount} channels, ${validationResult.operationsCount} operations, ${validationResult.messagesCount} messages`)
				
				// Log warnings using Railway programming
				if (validationResult.warnings && validationResult.warnings.length > 0) {
					yield* Effect.log(`⚠️ AsyncAPI document has ${validationResult.warnings.length} warnings:`)
					for (const warning of validationResult.warnings) {
						yield* Effect.log(`  - ${warning}`)
					}
				}
			}
		})
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

