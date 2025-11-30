/**
 * Document Builder Service
 * 
 * Provides functionality to build AsyncAPI documents from TypeSpec programs
 */

import { Effect } from "effect";
import type { Program } from "@typespec/compiler";
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js";

/**
 * Document Builder class
 */
export class DocumentBuilder {
  /**
   * Create initial AsyncAPI document structure
   */
  createInitialDocument(program: Program): Effect.Effect<AsyncAPIObject, never, never> {
    return Effect.gen(function*() {
      yield* Effect.log("Creating initial AsyncAPI document");
      
      const document: AsyncAPIObject = {
        asyncapi: "3.0.0",
        info: {
          title: "AsyncAPI Specification",
          version: "1.0.0"
        },
        channels: {},
        operations: {},
        components: {
          schemas: {},
          messages: {},
          securitySchemes: {}
        }
      };
      
      return document;
    });
  }
  
  /**
   * Update document info section
   */
  updateDocumentInfo(
    document: AsyncAPIObject, 
    updates: Partial<{ title: string; version: string; description: string }>
  ): Effect.Effect<AsyncAPIObject, never, never> {
    return Effect.gen(function*() {
      yield* Effect.log("Updating document info");
      
      const updatedDocument = {
        ...document,
        info: {
          ...document.info,
          ...updates
        }
      };
      
      return updatedDocument;
    });
  }
}