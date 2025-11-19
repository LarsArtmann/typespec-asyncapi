/**
 * Schema Validators - Effect Schema Integration for Runtime Validation
 *
 * Handles runtime validation of AsyncAPI documents using Effect Schema
 * for compile-time and runtime type safety with proper error messages.
 *
 * Extracted from ValidationService.ts to maintain <350 line limit.
 * Part of Phase 1 architectural excellence improvements.
 */

import { Effect } from "effect";
import { decodeAsyncAPIDocument } from "../../infrastructure/configuration/schemas.js";

/**
 * Schema validation with consistent error handling
 *
 * @param document - Unknown document to validate against AsyncAPI schema
 * @returns Effect with validated document or structured error
 */
export const validateWithSchemaConsistent = (
  document: unknown,
): Effect.Effect<unknown, unknown> => {
  return Effect.flatten(
    Effect.map(
      Effect.try({
        try: () => decodeAsyncAPIDocument(document),
        catch: (error) => ({
          message: `Schema validation failed: ${error instanceof Error ? error.message : String(error)}`,
          keyword: "schema-validation",
          instancePath: "",
          schemaPath: "root",
        }),
      }),
      (result) => result,
    ),
  );
};

/**
 * Static method for schema validation with unified error types
 *
 * Provides both instance and static access patterns for flexibility
 *
 * @param document - Unknown document to validate
 * @returns Effect with validated document or error
 */
export const validateWithSchemaStatic = (
  document: unknown,
): Effect.Effect<unknown, unknown> => {
  return validateWithSchemaConsistent(document);
};
