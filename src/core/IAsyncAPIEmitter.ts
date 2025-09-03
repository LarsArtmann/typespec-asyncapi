/**
 * AsyncAPI emitter interface for dependency injection and testing
 * 
 * Extracted from monolithic AsyncAPIEmitter to enable:
 * - Dependency injection and loose coupling
 * - Mock implementations for testing
 * - Contract-based development
 * - Interface segregation principle compliance
 */

import type { Program, Namespace } from "@typespec/compiler"
import type { SourceFile, EmittedSourceFile } from "@typespec/asset-emitter"
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"
import type { PluginRegistry } from "./PluginRegistry.js"

/**
 * Core AsyncAPI emitter interface defining emission contract
 */
export type IAsyncAPIEmitter = {
	/**
	 * Executes the complete AsyncAPI emission pipeline for a TypeSpec program
	 * TODO: Promise WHY??!?!?!
	 */
	programContext(program: Program): Promise<Record<string, unknown>>
	
	/**
	 * Handles TypeSpec namespace processing during emission
	 */
	namespace(namespace: Namespace): string
	
	/**
	 * Generates the final AsyncAPI document content for a source file
	 */
	sourceFile(sourceFile: SourceFile<string>): EmittedSourceFile
	
	/**
	 * Writes generated AsyncAPI files to the file system
	 */
	writeOutput(sourceFiles: SourceFile<string>[]): Promise<void>
	
	/**
	 * Retrieves the current AsyncAPI document state
	 */
	getDocument(): AsyncAPIObject
	
	/**
	 * Updates the AsyncAPI document state through an updater function
	 */
	updateDocument(updater: (doc: AsyncAPIObject) => void): void
	
	/**
	 * Retrieves the plugin registry for external plugin management
	 */
	getPluginRegistry(): PluginRegistry
}