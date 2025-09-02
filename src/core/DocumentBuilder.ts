/**
 * DocumentBuilder - AsyncAPI Document Construction Service
 * 
 * Extracted from 1,800-line monolithic emitter to handle AsyncAPI document construction
 * with proper initialization, server configuration, and component structure.
 * 
 * REAL BUSINESS LOGIC EXTRACTED from lines 178-201 of AsyncAPIEffectEmitter class
 */

import type { Program } from "@typespec/compiler"
import type { AsyncAPIObject } from "@asyncapi/parser/esm/spec-types/v3.js"
import { buildServersFromNamespaces } from "../utils/typespec-helpers.js"

/**
 * DocumentBuilder Service - Core AsyncAPI Document Construction
 * 
 * Handles the creation and initialization of AsyncAPI 3.0 documents with:
 * - Proper AsyncAPI 3.0.0 specification compliance
 * - Server configuration from TypeSpec namespaces
 * - Component structure initialization (schemas, messages, security)
 * - Configurable document metadata
 */
export class DocumentBuilder {
	/**
	 * Create initial AsyncAPI document structure
	 * 
	 * EXTRACTED FROM MONOLITHIC FILE: lines 178-201
	 * This is the REAL implementation that was working in the 1,800-line file
	 * 
	 * @param program - TypeSpec program for server namespace processing
	 * @returns Complete AsyncAPI document foundation
	 */
	createInitialDocument(program: Program): AsyncAPIObject {
		const servers = buildServersFromNamespaces(program)

		// TODO: Extract magic string "3.0.0" to named constant
		// TODO: Extract default info values to configuration object
		return {
			asyncapi: "3.0.0",
			info: {
				title: "AsyncAPI Specification", // TODO: Make configurable
				version: "1.0.0", // TODO: Make configurable
				description: "Generated from TypeSpec with Effect.TS integration", // TODO: Make configurable
			},
			// TODO: Add proper type assertion or validation instead of 'as' cast
			servers: servers as AsyncAPIObject["servers"],
			channels: {},
			operations: {},
			components: {
				schemas: {},
				messages: {},
				securitySchemes: {},
			},
		}
	}

	/**
	 * Update document info section with custom configuration
	 * 
	 * @param document - AsyncAPI document to update
	 * @param info - Custom info configuration
	 */
	updateDocumentInfo(
		document: AsyncAPIObject, 
		info: Partial<AsyncAPIObject["info"]>
	): void {
		document.info = {
			...document.info,
			...info,
		}
	}

	/**
	 * Ensure document has proper component structure
	 * 
	 * @param document - AsyncAPI document to initialize
	 */
	initializeComponents(document: AsyncAPIObject): void {
		if (!document.components) {
			document.components = {}
		}
		
		if (!document.components.schemas) {
			document.components.schemas = {}
		}
		
		if (!document.components.messages) {
			document.components.messages = {}
		}
		
		if (!document.components.securitySchemes) {
			document.components.securitySchemes = {}
		}
	}

	/**
	 * Initialize document structure for channels and operations
	 * 
	 * @param document - AsyncAPI document to initialize
	 */
	initializeDocumentStructure(document: AsyncAPIObject): void {
		if (!document.channels) {
			document.channels = {}
		}
		
		if (!document.operations) {
			document.operations = {}
		}
		
		this.initializeComponents(document)
	}
}