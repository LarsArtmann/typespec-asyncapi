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
import { Effect } from "effect";

// AsyncAPI and TypeSpec types
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";
import { buildServersFromNamespaces } from "../../utils/typespec-helpers.js";

// Standardized error handling
import {
  type StandardizedError,
  createError,
  failWith,
  railway,
  emitterErrors,
} from "../../utils/standardized-errors.js";

// Domain services
import { DocumentBuilder } from "./DocumentBuilder.js";
import { DiscoveryService } from "./DiscoveryService.js";
import { orchestrateAsyncAPITransformation } from "./ProcessingService.js";
import { ValidationService } from "../validation/ValidationService.js";
import type { DiscoveryResult } from "./DiscoveryResult.js";
import type { PipelineContext } from "../../application/services/PipelineContext.js";

// Validation result helpers for computing counts (NO SPLIT BRAIN!)
import {
  getChannelCount,
  getOperationCount,
  getSchemaCount,
} from "../models/validation-result.js";

import type { IPipelineService } from "../../application/services/PipelineService.js";

/**
 * Effect.TS-based emission pipeline with plugin integration
 *
 * REFACTORED: Now implements IPipelineService interface for dependency injection
 * REFACTORED: Services will be injected instead of hard-coded instantiation
 */
export class EmissionPipeline implements IPipelineService {
  private readonly documentBuilder: DocumentBuilder;
  private readonly discoveryService: DiscoveryService;
  private readonly validationService: ValidationService;

  /**
   * Constructor with minimal initialization
   */
  constructor() {
    // Initialize private properties synchronously
    this.documentBuilder = new DocumentBuilder();
    this.discoveryService = new DiscoveryService();
    this.validationService = new ValidationService();
  }

  /**
   * Execute the complete emission pipeline with REAL business logic integration
   * Using Effect.TS Railway programming for comprehensive error handling
   */
  executePipeline(
    context: PipelineContext,
  ): Effect.Effect<void, StandardizedError> {
    return Effect.gen(
      function* (this: EmissionPipeline) {
        // Validate context parameter with proper error handling
        if (!context) {
          return yield* failWith(
            createError({
              what: "Cannot execute pipeline without valid context",
              reassure: "This is a parameter validation issue",
              why: "executePipeline requires a valid PipelineContext instance",
              fix: "Ensure the context parameter is properly initialized before calling executePipeline",
              escape:
                "Create a new PipelineContext with required program and asyncApiDoc properties",
              severity: "error" as const,
              code: "INVALID_PIPELINE_CONTEXT",
              context: { contextProvided: !!context },
            }),
          );
        }

        yield* Effect.log(`🚀 Starting emission pipeline stages...`);

        // Stage 1: Discovery
        yield* Effect.log(`🚀 About to start Stage 1: Discovery`);
        const discoveryResult = yield* this.executeDiscoveryStage(context);
        yield* Effect.log(`✅ Completed Stage 1: Discovery`);

        // Stage 2: Processing
        yield* Effect.log(`🚀 About to start Stage 2: Processing`);
        yield* this.executeProcessingStage(context, discoveryResult);
        yield* Effect.log(`✅ Completed Stage 2: Processing`);

        // Stage 3: Document Generation (updates context.asyncApiDoc in-place)
        yield* Effect.log(`🚀 About to start Stage 3: Generation`);
        yield* this.executeGenerationStage(context, discoveryResult);
        yield* Effect.log(`✅ Completed Stage 3: Generation`);

        // Stage 4: Validation
        yield* this.executeValidationStage(context);

        yield* Effect.log(
          `✅ All emission pipeline stages completed successfully`,
        );
      }.bind(this),
    );
  }

  /**
   * Stage 1: Discovery - Find all TypeSpec elements using REAL DiscoveryService
   */
  private executeDiscoveryStage(context: PipelineContext) {
    return Effect.gen(
      function* (this: EmissionPipeline) {
        yield* Effect.log(`🔍 Stage 1: Discovery with REAL DiscoveryService`);

        // Use REAL DiscoveryService with complete AST traversal logic
        const result = yield* this.discoveryService.executeDiscovery(
          context.program,
        );

        yield* Effect.log(
          `📊 Discovery stage complete: ${result.operations.length} operations, ${result.messageModels.length} messages, ${result.securityConfigs.length} security configs`,
        );

        return result;
      }.bind(this),
    );
  }

  /**
   * Stage 2: Processing - Transform TypeSpec elements using REAL ProcessingService
   */
  private executeProcessingStage(
    context: PipelineContext,
    discoveryResult: DiscoveryResult,
  ) {
    return Effect.gen(function* () {
      yield* Effect.log(`🏗️ Stage 2: Processing with REAL ProcessingService`);

      // Use REAL ProcessingService with complete transformation logic (static methods)
      const processingResult = yield* orchestrateAsyncAPITransformation(
        discoveryResult.operations,
        discoveryResult.messageModels,
        discoveryResult.securityConfigs,
        context.asyncApiDoc,
        context.program,
      );

      yield* Effect.log(
        `📊 Processing stage complete: ${processingResult.totalProcessed} elements transformed`,
      );

      yield* Effect.log(`✅ Processing stage completed`);
      return processingResult;
    });
  }

  /**
   * Stage 3: Document Generation - Finalize AsyncAPI document using REAL DocumentBuilder logic
   */
  private executeGenerationStage(
    context: PipelineContext,
    discoveryResult: DiscoveryResult,
  ) {
    return Effect.gen(
      function* (this: EmissionPipeline) {
        yield* Effect.log(
          `📄 Stage 3: Document Generation with DocumentBuilder`,
        );

        // Use DocumentBuilder to ensure proper document structure with Effect.TS
        yield* this.documentBuilder.initializeDocumentStructure(
          context.asyncApiDoc,
        );

        // Update document info with discovered statistics using DocumentBuilder
        yield* this.documentBuilder.updateDocumentInfo(context.asyncApiDoc, {
          description: `Generated from TypeSpec with ${discoveryResult.operations.length} operations, ${discoveryResult.messageModels.length} messages, ${discoveryResult.securityConfigs.length} security configs`,
        });

        // Ensure servers are populated using DocumentBuilder patterns with Railway programming
        if (
          !context.asyncApiDoc.servers ||
          Object.keys(context.asyncApiDoc.servers).length === 0
        ) {
          const serversResult = yield* railway.trySync(
            () => buildServersFromNamespaces(context.program),
            { context: { operation: "buildServersFromNamespaces" } },
          );

          if (serversResult && Object.keys(serversResult).length > 0) {
            // Use Object.assign to properly merge servers
            Object.assign(context.asyncApiDoc, {
              servers: serversResult as AsyncAPIObject["servers"],
            });
          }
        }

        // Note: Processing is now handled by ProcessingService in Stage 2
        // Generation stage focuses on document finalization only

        yield* Effect.log(
          `✅ Document generation completed - processed ${discoveryResult.operations.length} operations and ${discoveryResult.messageModels.length} messages`,
        );
      }.bind(this),
    );
  }

  /**
   * Stage 4: Validation - Verify AsyncAPI compliance using REAL ValidationService
   *
   * MIGRATED: Now uses discriminated union (_tag) instead of isValid boolean
   */
  private executeValidationStage(context: PipelineContext) {
    return Effect.gen(
      function* (this: EmissionPipeline) {
        yield* Effect.log(`🔍 Stage 4: Validation with REAL ValidationService`);

        // Use REAL ValidationService with comprehensive AsyncAPI 3.0 compliance checking
        const validationResult = yield* this.validationService.validateDocument(
          context.asyncApiDoc,
        );

        // Check discriminated union _tag instead of isValid boolean
        if (validationResult._tag === "Failure") {
          yield* Effect.log(
            `❌ Validation failed with ${validationResult.errors.length} errors:`,
          );
          for (const error of validationResult.errors) {
            yield* Effect.log(`  - ${error.message}`);
          }

          // Convert ValidationError[] to string[] for emitterErrors
          const validationErrorStrings = validationResult.errors.map(
            (err) => err.message,
          );

          // Use standardized error instead of plain Error
          return yield* failWith(
            emitterErrors.invalidAsyncAPI(
              validationErrorStrings,
              context.asyncApiDoc,
            ),
          );
        } else {
          // Success case - compute counts from value (NO SPLIT BRAIN!)
          const channelCount = getChannelCount(validationResult.value);
          const operationCount = getOperationCount(validationResult.value);
          const schemaCount = getSchemaCount(validationResult.value);
          yield* Effect.log(
            `✅ Validation completed successfully - ${channelCount} channels, ${operationCount} operations, ${schemaCount} schemas`,
          );

          // Success case has empty warnings array - no need to log
        }
      }.bind(this),
    );
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
