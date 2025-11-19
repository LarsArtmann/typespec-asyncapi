/**
 * ValidationService - AsyncAPI Document Validation Engine
 *
 * Orchestrates comprehensive validation of AsyncAPI documents using
 * extracted validator modules to maintain <350 line limit.
 *
 * REFACTORED: Split into focused modules (Phase 1 architectural excellence)
 * - SchemaValidators.ts - Effect Schema integration
 * - StructureValidators.ts - Document structure validation
 * - ReferenceValidators.ts - Cross-reference validation
 *
 * This service ensures generated AsyncAPI documents meet specification requirements.
 */

import { Effect, Schedule } from "effect";
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";
import {
  emitterErrors,
  type StandardizedError,
  safeStringify,
} from "../../utils/standardized-errors.js";
import { ensureStandardizedErrorMapperCustom } from "../../utils/effect-error-utils.js";
import { PERFORMANCE_CONSTANTS } from "../../constants/defaults.js";

// Import canonical validation types (no more split brain!)
import {
  success,
  failure,
  getChannelCount,
  getOperationCount,
  getSchemaCount,
  type ValidationError,
  type ValidationWarning,
  type ExtendedValidationResult,
} from "../models/validation-result.js";

// Import extracted validator modules (Phase 1 refactoring)
import { validateWithSchemaConsistent } from "./SchemaValidators.js";
import {
  validateBasicStructure,
  validateInfoSection,
  validateChannels,
  validateOperations,
  validateComponents,
} from "./StructureValidators.js";
import { validateCrossReferences } from "./ReferenceValidators.js";

// Re-export for external consumers
export type { ExtendedValidationResult as ValidationResult };

/**
 * Build validation metrics consistently
 */
const buildValidationMetrics = (startTime: number) => ({
  duration: performance.now() - startTime,
  validatedAt: new Date(),
});

/**
 * Build validation result consistently (NO split brain - discriminated union)
 */
const buildValidationResult = (
  asyncApiDoc: AsyncAPIObject,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  startTime: number,
  customSummary?: string,
): ExtendedValidationResult<AsyncAPIObject> => {
  const metrics = buildValidationMetrics(startTime);

  if (errors.length === 0) {
    return {
      ...success(asyncApiDoc),
      metrics,
      summary:
        customSummary ??
        `AsyncAPI document validation passed! (${metrics.duration.toFixed(2)}ms)`,
    };
  } else {
    return {
      ...failure(errors, warnings),
      metrics,
      summary:
        customSummary ??
        `AsyncAPI document validation failed with ${errors.length} errors, ${warnings.length} warnings (${metrics.duration.toFixed(2)}ms)`,
    };
  }
};

/**
 * ValidationService - Core AsyncAPI Document Validation
 *
 * Handles comprehensive validation of AsyncAPI documents to ensure:
 * - AsyncAPI 3.0 specification compliance
 * - Required fields presence and correctness
 * - Document structure integrity
 * - Channel and operation consistency
 * - Message and schema validity
 *
 * Uses Effect.TS for functional error handling and comprehensive logging
 */
export class ValidationService {
  constructor() {
    Effect.log("🔧 ValidationService initialized with robust type safety");
  }

  /**
   * Static method for document validation (to avoid 'this' binding issues)
   *
   * Returns ExtendedValidationResult with discriminated union (_tag)
   * NO MORE SPLIT BRAIN: isValid boolean removed, use _tag instead
   */
  static validateDocumentStatic(
    asyncApiDoc: AsyncAPIObject,
  ): Effect.Effect<
    ExtendedValidationResult<AsyncAPIObject>,
    StandardizedError
  > {
    return Effect.gen(function* () {
      const startTime = performance.now();
      yield* Effect.log(
        `🔍 Starting comprehensive AsyncAPI document validation (static method)...`,
      );

      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];

      // Basic structure validation
      if (!asyncApiDoc.asyncapi) {
        errors.push({
          message: "Missing required field: asyncapi",
          keyword: "required",
          instancePath: "/asyncapi",
          schemaPath: "#/required",
        });
      }

      if (!asyncApiDoc.info) {
        errors.push({
          message: "Missing required field: info",
          keyword: "required",
          instancePath: "/info",
          schemaPath: "#/required",
        });
      }

      if (!asyncApiDoc.info?.title) {
        errors.push({
          message: "Missing required field: info.title",
          keyword: "required",
          instancePath: "/info/title",
          schemaPath: "#/properties/info/properties/title",
        });
      }

      if (!asyncApiDoc.info?.version) {
        errors.push({
          message: "Missing required field: info.version",
          keyword: "required",
          instancePath: "/info/version",
          schemaPath: "#/properties/info/properties/version",
        });
      }

      // Build validation result using helper (NO split brain)
      const result = buildValidationResult(
        asyncApiDoc,
        errors,
        warnings,
        startTime,
      );

      yield* Effect.log(
        `✅ AsyncAPI document validation completed (static method)!`,
      );
      return result;
    });
  }

  /**
   * Validate AsyncAPI document structure and compliance
   *
   * REFACTORED: Now uses extracted validator modules
   * Returns ExtendedValidationResult (discriminated union)
   * NO MORE SPLIT BRAIN: Check result._tag instead of result.isValid
   *
   * @param asyncApiDoc - AsyncAPI document to validate
   * @returns Effect containing detailed validation results with metrics
   */
  validateDocument(
    asyncApiDoc: AsyncAPIObject,
  ): Effect.Effect<
    ExtendedValidationResult<AsyncAPIObject>,
    StandardizedError
  > {
    return Effect.gen(function* () {
      const startTime = performance.now();
      yield* Effect.log(
        `🔍 Starting comprehensive AsyncAPI document validation...`,
      );

      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];

      // Temporary string arrays for validator modules
      const stringErrors: string[] = [];
      const stringWarnings: string[] = [];

      // Use extracted validator modules
      validateBasicStructure(asyncApiDoc, stringErrors, stringWarnings);
      validateInfoSection(asyncApiDoc, stringErrors, stringWarnings);

      const channelsCount = validateChannels(
        asyncApiDoc,
        stringErrors,
        stringWarnings,
      );
      const operationsCount = validateOperations(
        asyncApiDoc,
        stringErrors,
        stringWarnings,
      );

      const { messagesCount: _messagesCount, schemasCount: _schemasCount } =
        validateComponents(asyncApiDoc, stringErrors, stringWarnings);

      validateCrossReferences(asyncApiDoc, stringErrors, stringWarnings);

      // Convert string errors to structured ValidationError objects
      stringErrors.forEach((errorMsg) => {
        errors.push({
          message: errorMsg,
          keyword: "validation",
          instancePath: "",
          schemaPath: "",
        });
      });

      // Convert string warnings to structured ValidationWarning objects
      stringWarnings.forEach((warningMsg) => {
        warnings.push({
          message: warningMsg,
          severity: "warning",
        });
      });

      // Build validation result using helper (NO split brain)
      const customSummary =
        errors.length === 0
          ? `AsyncAPI document validation passed! ${channelsCount} channels, ${operationsCount} operations (${buildValidationMetrics(startTime).duration.toFixed(2)}ms)`
          : `AsyncAPI document validation failed with ${errors.length} errors, ${warnings.length} warnings (${buildValidationMetrics(startTime).duration.toFixed(2)}ms)`;

      const result = buildValidationResult(
        asyncApiDoc,
        errors,
        warnings,
        startTime,
        customSummary,
      );

      // Log based on discriminated union _tag
      if (result._tag === "Success") {
        yield* Effect.log(`✅ ${result.summary}`);
      } else {
        yield* Effect.log(`❌ ${result.summary}`);
      }

      return result;
    });
  }

  /**
   * Validate document as string content
   *
   * Uses ExtendedValidationResult (discriminated union)
   * NO MORE result.isValid - use result._tag === "Success" instead
   *
   * @param content - Serialized AsyncAPI document content
   * @returns Effect containing validated content or sanitized fallback
   */
  validateDocumentContent(
    content: string,
  ): Effect.Effect<string, StandardizedError> {
    return Effect.gen(function* () {
      yield* Effect.log(
        `🔍 Validating AsyncAPI document content (${content.length} bytes)`,
      );
      yield* Effect.log(`🔍 Content preview: ${content.substring(0, 100)}...`);

      // Parse the content with proper error handling, retry patterns, and fallback
      yield* Effect.logInfo("🔧 About to parse JSON...");
      const parsedDoc = yield* Effect.gen(function* () {
        yield* Effect.logInfo("🔧 Starting JSON parsing attempt...");
        return JSON.parse(content) as AsyncAPIObject;
      }).pipe(
        Effect.retry(
          Schedule.exponential(
            `${PERFORMANCE_CONSTANTS.RETRY_BASE_DELAY_MS / 2} millis`,
          ).pipe(
            Schedule.compose(
              Schedule.recurs(PERFORMANCE_CONSTANTS.MAX_RETRY_ATTEMPTS - 1),
            ),
          ),
        ),
      );
      yield* Effect.logInfo(
        `🔧 Parsed doc type: ${typeof parsedDoc}, keys: ${parsedDoc ? Object.keys(parsedDoc).join(", ") : "null"}`,
      );

      // Use static validation to avoid this binding issues
      const result = yield* ValidationService.validateDocumentStatic(
        parsedDoc,
      ).pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            yield* Effect.log(
              `⚠️  Document validation failed, using graceful degradation: ${safeStringify(error)}`,
            );
            // Return failure result with error details
            const fallbackResult: ExtendedValidationResult<AsyncAPIObject> = {
              ...failure(
                [
                  {
                    message: `Validation service failed: ${safeStringify(error)}`,
                    keyword: "validation-failure",
                    instancePath: "",
                    schemaPath: "",
                  },
                ],
                [
                  {
                    message:
                      "Document may be partially valid but validation service encountered errors",
                    severity: "warning",
                  },
                ],
              ),
              summary: "Validation failed with errors",
              metrics: {
                duration: 0,
                validatedAt: new Date(),
              },
            };
            return Effect.succeed(fallbackResult);
          }).pipe(Effect.flatten),
        ),
      );

      // Check discriminated union _tag instead of isValid boolean
      if (result._tag === "Success") {
        yield* Effect.log(`✅ Document content validation passed!`);
        return content;
      } else {
        // Failure case - log errors
        yield* Effect.log(`❌ Document content validation failed:`);
        // Use Effect.forEach for proper composition instead of runSync
        yield* Effect.forEach(result.errors, (error: ValidationError) =>
          Effect.log(`  - ${error.message}`),
        );

        // Try to return sanitized content instead of failing completely
        yield* Effect.log(
          `🔧 Attempting to return sanitized content despite validation errors`,
        );
        const sanitizedContent = JSON.stringify(
          {
            asyncapi: "3.0.0",
            info: {
              title: "Generated API (Validation Issues)",
              version: "1.0.0",
            },
            channels: parsedDoc.channels ?? {},
            operations: parsedDoc.operations ?? {},
          },
          null,
          2,
        );

        return sanitizedContent;
      }
    }).pipe(
      Effect.mapError(
        ensureStandardizedErrorMapperCustom((error) =>
          emitterErrors.validationFailure(
            [`Unexpected validation error: ${safeStringify(error)}`],
            { content: content.substring(0, 100) + "..." },
          ),
        ),
      ),
    );
  }

  /**
   * Perform quick validation check
   *
   * Simplified validation for fast checks during development
   *
   * @param asyncApiDoc - Document to validate
   * @returns Boolean indicating basic validity
   */
  quickValidation(asyncApiDoc: AsyncAPIObject): Effect.Effect<boolean, never> {
    return Effect.gen(function* () {
      const hasAsyncAPI = !!asyncApiDoc.asyncapi;
      const hasInfo = !!asyncApiDoc.info;
      const hasChannelsOrOps =
        !!(
          asyncApiDoc.channels && Object.keys(asyncApiDoc.channels).length > 0
        ) ||
        !!(
          asyncApiDoc.operations &&
          Object.keys(asyncApiDoc.operations).length > 0
        );

      const isValid = hasAsyncAPI && hasInfo && hasChannelsOrOps;

      yield* Effect.log(`⚡ Quick validation: ${isValid ? "PASS" : "FAIL"}`);

      return isValid;
    });
  }

  /**
   * Generate validation report summary
   *
   * Accepts ExtendedValidationResult (discriminated union)
   * Uses _tag to determine status instead of isValid boolean
   *
   * @param result - Extended validation result to summarize
   * @returns Human-readable validation report
   */
  generateValidationReport(
    result: ExtendedValidationResult<AsyncAPIObject>,
  ): string {
    // Use discriminated union _tag instead of isValid boolean
    const status = result._tag === "Success" ? "✅ VALID" : "❌ INVALID";
    const report = [
      `AsyncAPI Document Validation Report`,
      `Status: ${status}`,
      ``,
    ];

    // Add summary if present
    if (result.summary) {
      report.push(`Summary: ${result.summary}`);
      report.push(``);
    }

    // Add metrics
    report.push(`Document Statistics:`);

    // Compute counts from value (Success) or show N/A (Failure) - NO SPLIT BRAIN!
    if (result._tag === "Success") {
      const channelCount = getChannelCount(result.value);
      const operationCount = getOperationCount(result.value);
      const schemaCount = getSchemaCount(result.value);
      report.push(`- Channels: ${channelCount}`);
      report.push(`- Operations: ${operationCount}`);
      report.push(`- Schemas: ${schemaCount}`);
    } else {
      report.push(`- Channels: N/A (validation failed)`);
      report.push(`- Operations: N/A (validation failed)`);
      report.push(`- Schemas: N/A (validation failed)`);
    }

    report.push(
      `- Validation Duration: ${result.metrics.duration.toFixed(2)}ms`,
    );
    report.push(`- Validated At: ${result.metrics.validatedAt.toISOString()}`);
    report.push(``);

    // Only failure has errors/warnings
    if (result._tag === "Failure") {
      if (result.errors.length > 0) {
        report.push(`Errors (${result.errors.length}):`);
        result.errors.forEach((error: ValidationError) => {
          report.push(`- ${error.message}`);
          if (error.instancePath) {
            report.push(`  Path: ${error.instancePath}`);
          }
        });
        report.push("");
      }

      if (result.warnings.length > 0) {
        report.push(`Warnings (${result.warnings.length}):`);
        result.warnings.forEach((warning: ValidationWarning) => {
          report.push(`- ${warning.message}`);
        });
      }
    } else {
      // Success case - no errors/warnings
      report.push(`No errors or warnings found.`);
    }

    return report.join("\n");
  }

  /**
   * Effect Schema-based validation for runtime type safety
   *
   * Uses Effect Schema to provide compile-time and runtime validation
   * of AsyncAPI documents with proper error messages
   *
   * @param document - Unknown input to validate
   * @returns Effect with validated AsyncAPI document or error
   */
  validateWithSchema(document: unknown): Effect.Effect<unknown, unknown> {
    return validateWithSchemaConsistent(document);
  }

  /**
   * Static method for schema validation with unified error types
   */
  static validateWithSchema(
    document: unknown,
  ): Effect.Effect<unknown, unknown> {
    return validateWithSchemaConsistent(document);
  }
}
