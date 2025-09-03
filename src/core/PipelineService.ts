/**
 * Pipeline service interface for dependency injection and testing
 * 
 * Defines the contract for emission pipeline execution with:
 * - Stage-based processing (Discovery � Processing � Generation � Validation)
 * - Effect.TS error handling patterns
 * - Plugin integration points
 * - Performance monitoring support
 */

import type { Effect } from "effect"
import type { PipelineContext } from "./PipelineContext.js"

/**
 * Core pipeline service interface defining emission pipeline contract
 */
export type IPipelineService = {
	/**
	 * Execute the complete emission pipeline with REAL business logic integration
	 * 
	 * Processes TypeSpec programs through sequential stages:
	 * 1. Discovery - Find operations, messages, security configs
	 * 2. Processing - Transform TypeSpec AST to AsyncAPI structures
	 * 3. Generation - Create final AsyncAPI document
	 * 4. Validation - Verify AsyncAPI compliance
	 * 
	 * @param context Pipeline execution context with program and document state
	 * @returns Effect that succeeds on completion or fails with error details
	 */
	executePipeline(context: PipelineContext): Effect.Effect<void, Error>
}