/**
 * Shared AsyncAPI document generation utilities
 * Extracted from duplicated document generation logic
 */

import type {Operation, Program} from "@typespec/compiler"
import {getDoc} from "@typespec/compiler"
import {Effect} from "effect"
import type {AsyncAPIDocument, ChannelObject, OperationObject} from "../types/index"
import {getAsyncAPIAction, getChannelPath, getOperationType} from "./typespec-helpers"
import {convertModelToSchema} from "./schema-conversion"

/**
 * Create initial AsyncAPI document structure
 * Centralized document creation logic
 */
export function createAsyncAPIDocument(operations: Operation[], title?: string, description?: string): AsyncAPIDocument {
	return {
		asyncapi: "3.0.0" as const,
		info: {
			title: title ?? "Generated from TypeSpec",
			version: "1.0.0",
			description: description ?? `Generated AsyncAPI document with ${operations.length} operations`,
		},
		channels: {},
		operations: {},
		components: {
			schemas: {},
			messages: {},
		},
	} as AsyncAPIDocument
}

/**
 * Create channel definition from operation
 * Extracted from asyncapi-emitter.ts and emitter-with-effect.ts
 */
export function createChannelDefinition(op: Operation, program: Program): { name: string, definition: ChannelObject } {
	const channelName = `channel_${op.name}`
	const channelPath = getChannelPath(op, program)

	const definition: ChannelObject = {
		address: channelPath ?? `/${op.name.toLowerCase()}`,
		description: getDoc(program, op) ?? `Channel for ${op.name}`,
		messages: {
			[`${op.name}Message`]: {
				$ref: `#/components/messages/${op.name}Message`,
			},
		},
	}

	return {name: channelName, definition}
}

/**
 * Create operation definition from TypeSpec operation
 * Centralized operation definition creation
 */
export function createOperationDefinition(op: Operation, program: Program, channelName: string): OperationObject {
	const operationType = getOperationType(op, program)
	const action = getAsyncAPIAction(operationType)

	return {
		action,
		channel: {$ref: `#/channels/${channelName}`},
		summary: getDoc(program, op) ?? `Operation ${op.name}`,
		description: `Generated from TypeSpec operation with ${op.parameters.properties.size} parameters`,
	}
}

/**
 * Process operation and add to AsyncAPI document
 * Extracted common operation processing logic
 */
export function processOperationToDocument(
	operation: Operation,
	program: Program,
	document: AsyncAPIDocument,
): void {
	// Create channel
	const {name: channelName, definition: channelDef} = createChannelDefinition(operation, program)
	document.channels![channelName] = channelDef

	// Create operation
	document.operations![operation.name] = createOperationDefinition(operation, program, channelName)

	// Create message component
	if (!document.components?.messages) document.components!.messages = {}
	document.components!.messages[`${operation.name}Message`] = {
		name: `${operation.name}Message`,
		title: `${operation.name} Message`,
		summary: `Message for ${operation.name} operation`,
		contentType: "application/json",
	}

	// Process return type if it's a model
	if (operation.returnType.kind === "Model") {
		const model = operation.returnType
		if (!document.components?.schemas) document.components!.schemas = {}
		document.components!.schemas[model.name] = convertModelToSchema(model, program)

		// Link message to schema
		const message = document.components!.messages[`${operation.name}Message`]
		if (message && typeof message === 'object' && !('$ref' in message)) {
			(message as { payload?: { $ref?: string } }).payload = {
				$ref: `#/components/schemas/${model.name}`,
			}
		}
	}
}

/**
 * Generate content string for AsyncAPI document
 * Centralized content generation logic
 */
export function generateAsyncAPIContent(document: AsyncAPIDocument, fileType: "json" | "yaml", sourceInfo?: {
	sourceFiles?: string;
	operationsFound?: string
}): string {
	let content: string

	if (fileType === "json") {
		const docWithMeta = sourceInfo ? {
			...document,
			"x-generated-from-typespec": {
				sourceFiles: sourceInfo.sourceFiles || "none",
				operationsFound: sourceInfo.operationsFound || "none",
				note: "Generated from TypeSpec - NOT hardcoded!",
			},
		} : document

		content = JSON.stringify(docWithMeta, null, 2)
	} else {
		// For YAML, use comment headers if source info provided
		const header = sourceInfo ?
			`# Generated from TypeSpec - NOT hardcoded!\n# Source files: ${sourceInfo.sourceFiles || "none"}\n# Operations found: ${sourceInfo.operationsFound || "none"}\n\n` :
			""

		const {stringify} = require("yaml")
		content = header + stringify(document)
	}

	return content
}

/**
 * Log processing statistics
 * Centralized stats logging
 */
export function logProcessingStats(document: AsyncAPIDocument, operations: Operation[]): void {
	Effect.log(`\n📊 PROCESSING STATS:`)
	Effect.log(`  - Operations processed: ${operations.length}`)
	Effect.log(`  - Channels created: ${Object.keys(document.channels || {}).length}`)
	Effect.log(`  - Operations created: ${Object.keys(document.operations || {}).length}`)
	Effect.log(`  - Schemas generated: ${Object.keys(document.components?.schemas || {}).length}`)
	Effect.log(`  - Messages generated: ${Object.keys(document.components?.messages || {}).length}`)
}
