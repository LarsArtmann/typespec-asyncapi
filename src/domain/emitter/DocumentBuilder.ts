/**
 * DocumentBuilder - AsyncAPI Document Construction Service
 *
 * Extracted from 1,800-line monolithic emitter to handle AsyncAPI document construction
 * with proper initialization, server configuration, and component structure.
 *
 * REAL BUSINESS LOGIC EXTRACTED from lines 178-201 of AsyncAPIEffectEmitter class
 *
 * MIGRATED TO EFFECT.TS RAILWAY PROGRAMMING (M016)
 * - Eliminates throw statements and try/catch blocks
 * - Implements What/Reassure/Why/Fix/Escape error pattern
 * - Provides comprehensive error context for debugging
 */

import type { Program } from "@typespec/compiler";
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";
import { buildServersFromNamespaces } from "../../utils/typespec-helpers.js";
import { Effect } from "effect";

// Constants - Import centralized constants to eliminate hardcoded values
import { ASYNCAPI_VERSIONS } from "../../constants/index.js";
import { DEFAULT_CONFIG } from "../../constants/defaults.js";

// Standardized error handling
import {
  type StandardizedError,
  createError,
  failWith,
  railway,
} from "../../utils/standardized-errors.js";

/**
/**
 * Validate document parameter - extracted to eliminate duplication
 */
function validateDocumentParameter(
  document: AsyncAPIObject | null | undefined,
  operationContext: string,
): Effect.Effect<void, StandardizedError> {
  if (!document) {
    return failWith(
      createError({
        what: `Cannot ${operationContext} on null/undefined document`,
        reassure: "This is a parameter validation issue",
        why: `${operationContext} requires a valid AsyncAPIObject instance`,
        fix: `Ensure the document parameter is properly initialized before calling ${operationContext}`,
        escape: "Create a new document using createInitialDocument first",
        severity: "error" as const,
        code: "INVALID_DOCUMENT_INSTANCE",
        context: { documentProvided: !!document, operation: operationContext },
      }),
    );
  }
  return Effect.succeed(undefined);
}

/**
 * DocumentBuilder Service - Core AsyncAPI Document Construction
 *
 * DocumentBuilder Service - Core AsyncAPI Document Construction
 *
 * Handles the creation and initialization of AsyncAPI 3.0 documents with:
 * - Proper AsyncAPI 3.0.0 specification compliance
 * - Server configuration from TypeSpec namespaces
 * - Component structure initialization (schemas, messages, security)
 * - Configurable document metadata
 * - Railway programming for comprehensive error handling
 */
export class DocumentBuilder {
  /**
   * Create initial AsyncAPI document structure with Railway programming
   *
   * EXTRACTED FROM MONOLITHIC FILE: lines 178-201
   * This is the REAL implementation that was working in the 1,800-line file
   * MIGRATED TO EFFECT.TS with comprehensive error handling
   *
   * @param program - TypeSpec program for server namespace processing
   * @returns Effect containing complete AsyncAPI document foundation or StandardizedError
   */
  createInitialDocument(
    program: Program,
  ): Effect.Effect<AsyncAPIObject, StandardizedError> {
    return Effect.gen(function* () {
      // Validate program parameter
      if (!program) {
        return yield* failWith(
          createError({
            what: "Cannot create AsyncAPI document without TypeSpec program",
            reassure: "This is a configuration issue, not a system error",
            why: "DocumentBuilder.createInitialDocument requires a valid TypeSpec Program instance",
            fix: "Ensure the TypeSpec compiler provides a valid Program instance",
            escape:
              "Use a minimal test program or check the TypeSpec compilation setup",
            severity: "error" as const,
            code: "INVALID_PROGRAM_INSTANCE",
            context: { programProvided: !!program },
          }),
        );
      }

      // Safe logging with program validation
      yield* Effect.log(
        `🏗️  DocumentBuilder.createInitialDocument called with valid program`,
      );

      // Process servers from namespaces with error handling

      const serversResult = yield* railway.trySync(
        () => buildServersFromNamespaces(program),
        { context: { operation: "buildServersFromNamespaces" } },
      );

      const servers = serversResult ?? {};
      yield* Effect.log(
        `🏗️  Generated servers: ${JSON.stringify(servers, null, 2)}`,
      );

      // Build document with Railway programming
      const documentResult = yield* railway.trySync(
        () => {
          // Using centralized AsyncAPI version constant instead of hardcoded string
          // Using centralized default configuration values
          const baseDocument = {
            asyncapi: ASYNCAPI_VERSIONS.CURRENT,
            info: {
              title: "AsyncAPI Specification",
              version: "1.0.0",
              description: `Generated from TypeSpec with ${DEFAULT_CONFIG.LIBRARY_NAME}`,
            },
            channels: {},
            operations: {},
            components: {
              schemas: {},
              messages: {},
              securitySchemes: {},
            },
          };

          // Create document with explicit typing
          const document: AsyncAPIObject = {
            ...baseDocument,
            ...(servers && Object.keys(servers).length > 0 ? { servers } : {}),
          };

          return document;
        },
        { context: { operation: "document creation" } },
      );

      return documentResult;
    });
  }

  /**
   * Update document info section with custom configuration using Railway programming
   *
   * @param document - AsyncAPI document to update
   * @param info - Custom info configuration
   * @returns Effect containing updated document or StandardizedError
   */
  updateDocumentInfo(
    document: AsyncAPIObject,
    info: Partial<AsyncAPIObject["info"]>,
  ): Effect.Effect<AsyncAPIObject, StandardizedError> {
    return Effect.gen(function* () {
      // Validate document parameter using extracted helper
      yield* validateDocumentParameter(document, "update document info");

      // Validate document.info exists
      if (!document.info) {
        return yield* failWith(
          createError({
            what: "Cannot update document info when info section is missing",
            reassure: "This can be fixed by initializing the document properly",
            why: "AsyncAPI document must have an info section to be valid",
            fix: "Use createInitialDocument to ensure proper document structure",
            escape:
              "Initialize document.info manually before calling updateDocumentInfo",
            severity: "error" as const,
            code: "MISSING_DOCUMENT_INFO",
            context: { documentProvided: !!document, infoProvided: !!info },
          }),
        );
      }

      // Safe info update with Railway programming
      return yield* railway.trySync(
        () => {
          document.info = {
            ...document.info,
            ...info,
          };
          return document;
        },
        {
          context: {
            operation: "document info update",
            infoKeys: Object.keys(info ?? {}),
          },
        },
      );
    });
  }

  /**
   * Ensure document has proper component structure using Railway programming
   *
   * @param document - AsyncAPI document to initialize
   * @returns Effect containing initialized document or StandardizedError
   */
  initializeComponents(
    document: AsyncAPIObject,
  ): Effect.Effect<AsyncAPIObject, StandardizedError> {
    return Effect.gen(function* () {
      // Validate document parameter using extracted helper
      yield* validateDocumentParameter(document, "initialize components");

      // Safe component initialization with Railway programming
      return yield* railway.trySync(
        () => {
          document.components ??= {};

          document.components.schemas ??= {};
          document.components.messages ??= {};
          document.components.securitySchemes ??= {};

          if (!document.components.schemas) {
            document.components.schemas = {};
          }

          if (!document.components.messages) {
            document.components.messages = {};
          }

          if (!document.components.securitySchemes) {
            document.components.securitySchemes = {};
          }

          return document;
        },
        { context: { operation: "components initialization" } },
      );
    });
  }

  /**
   * Initialize document structure for channels and operations using Railway programming
   *
   * @param document - AsyncAPI document to initialize
   * @returns Effect containing initialized document or StandardizedError
   */
  initializeDocumentStructure(
    document: AsyncAPIObject,
  ): Effect.Effect<AsyncAPIObject, StandardizedError> {
    return Effect.gen(
      function* (this: DocumentBuilder) {
        // Validate document parameter using extracted helper
        yield* validateDocumentParameter(
          document,
          "initialize document structure",
        );

        // Safe structure initialization with Railway programming
        const structureInitResult = yield* railway.trySync(
          () => {
            document.channels ??= {};
            document.operations ??= {};

            return document;
          },
          { context: { operation: "document structure initialization" } },
        );

        // Chain component initialization
        return yield* this.initializeComponents(structureInitResult);
      }.bind(this),
    );
  }
}
