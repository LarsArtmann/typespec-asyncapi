/**
 * ProcessingService - TypeSpec to AsyncAPI Transformation Orchestration
 *
 * Orchestrates transformation of TypeSpec elements using extracted specialized services.
 * Implements single responsibility principle with proper service layering.
 *
 * Services:
 * - OperationProcessingService: Handles TypeSpec operations → AsyncAPI channels
 * - MessageProcessingService: Handles TypeSpec models → AsyncAPI messages
 * - SecurityProcessingService: Handles TypeSpec security → AsyncAPI security schemes
 */

import { Effect } from "effect";
import type { Model, Operation, Program } from "@typespec/compiler";
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";
import { processOperations } from "./OperationProcessingService.js";
import { processMessageModels } from "./MessageProcessingService.js";
import { processSecurityConfigs } from "./SecurityProcessingService.js";
import type { SecurityConfig } from "../decorators/securityConfig.js";

/**
 * Orchestrate complete TypeSpec to AsyncAPI transformation
 *
 * Coordinates all specialized processing services for comprehensive document generation.
 * Uses Effect.TS for proper functional composition and error handling.
 */
export const orchestrateAsyncAPITransformation = (
  operations: Operation[],
  messageModels: Model[],
  securityConfigs: SecurityConfig[],
  asyncApiDoc: AsyncAPIObject,
  program: Program,
): Effect.Effect<
  {
    operationsProcessed: number;
    messagesProcessed: number;
    securityProcessed: number;
    totalProcessed: number;
  },
  never
> =>
  Effect.gen(function* () {
    yield* Effect.log(
      "🚀 Orchestrating complete TypeSpec to AsyncAPI transformation...",
    );

    // Process all components in parallel for optimal performance
    const [operationsProcessed, messagesProcessed, securityProcessed] =
      yield* Effect.all([
        processOperations(operations, asyncApiDoc, program),
        processMessageModels(messageModels, asyncApiDoc, program),
        processSecurityConfigs(securityConfigs, asyncApiDoc),
      ]);

    const totalProcessed =
      operationsProcessed + messagesProcessed + securityProcessed;

    yield* Effect.log(`✅ Complete transformation orchestrated`, {
      operationsProcessed,
      messagesProcessed,
      securityProcessed,
      totalProcessed,
    });

    return {
      operationsProcessed,
      messagesProcessed,
      securityProcessed,
      totalProcessed,
    };
  });

/**
 * Validate transformation completeness
 */
export const validateTransformation = (
  transformed: {
    operationsProcessed: number;
    messagesProcessed: number;
    securityProcessed: number;
    totalProcessed: number;
  },
  expected: {
    operationCount: number;
    messageCount: number;
    securityCount: number;
  },
): Effect.Effect<boolean, never> =>
  Effect.gen(function* () {
    const isComplete =
      transformed.operationsProcessed === expected.operationCount &&
      transformed.messagesProcessed === expected.messageCount &&
      transformed.securityProcessed === expected.securityCount;

    yield* Effect.log(`🔍 Transformation validation`, {
      isComplete,
      expected,
      actual: transformed,
    });

    return isComplete;
  });

/**
 * Generate transformation summary
 */
export const generateTransformationSummary = (transformed: {
  operationsProcessed: number;
  messagesProcessed: number;
  securityProcessed: number;
  totalProcessed: number;
}): string => {
  const summary = [
    `📊 TypeSpec to AsyncAPI Transformation Complete`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🔄 Operations Processed: ${transformed.operationsProcessed}`,
    `📨 Messages Processed: ${transformed.messagesProcessed}`,
    `🔐 Security Schemes: ${transformed.securityProcessed}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `✨ Total Components: ${transformed.totalProcessed}`,
    `🎯 AsyncAPI Document Ready for Export`,
  ].join("\n");

  return summary;
};

/**
 * ProcessingService namespace export for backwards compatibility with tests
 * Provides a unified interface to all processing functions
 */
export const ProcessingService = {
  // Main orchestration functions
  orchestrate: orchestrateAsyncAPITransformation,
  executeProcessing: orchestrateAsyncAPITransformation, // Alias for tests

  // Individual processing functions (match test expectations)
  processOperations,
  processMessageModels,
  processSecurityConfigs,

  // Utility functions
  validate: validateTransformation,
  generateSummary: generateTransformationSummary,
};
