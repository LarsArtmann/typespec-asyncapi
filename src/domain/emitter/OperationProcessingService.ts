/**
 * Operation Processing Service
 * 
 * Handles transformation of TypeSpec operations into AsyncAPI channel structures.
 * Extracted from ProcessingService.ts for single responsibility principle.
 */

import { Effect } from "effect"
import type { Model, Operation, Program } from "@typespec/compiler"
import type { AsyncAPIObject, OperationObject } from "@asyncapi/parser/esm/spec-types/v3.js"
import { createChannelDefinition } from "../../utils/asyncapi-helpers.js"
import { convertModelToSchema, convertTypeToSchemaType } from "../../utils/schema-conversion.js"
import { getMessageConfig, getProtocolConfig } from "../../utils/typespec-helpers.js"
import { railwayLogging } from "../../utils/effect-helpers.js"
import { generateProtocolBinding } from "../../infrastructure/adapters/plugin-system.js"
import type { AsyncAPIProtocolType } from "../../infrastructure/adapters/protocol-type.js"

/**
 * Process a single TypeSpec operation into AsyncAPI operation
 */
export const processSingleOperation = (
	operation: Operation,
	asyncApiDoc: AsyncAPIObject,
	program: Program
): Effect.Effect<{ channelName: string; operation: OperationObject }, never> =>
	Effect.gen(function* () {
		yield* railwayLogging.logDebugGeneration("operation", operation.name, {
			type: operation.returnType?.kind || 'unknown',
			parameters: operation.parameters?.properties?.size || 0
		})

		// Extract operation metadata using TypeSpec helpers
		// For operations, we get configs differently since we don't have a Model
		const operationInfo = {} // TODO: Extract from operation decorators properly
		// TODO: Extract protocol info properly when protocol decorators work

		// Generate channel name from operation
		const channelDefinition = createChannelDefinition(operation, program)
		const channelName = channelDefinition.name

		// Convert parameters to JSON schema if present
		const parameters = operation.parameters?.properties
			? Array.from(operation.parameters.properties.entries()).map(([paramName, paramModel]) => ({
					name: paramName,
					schema: { type: "string" }, // TODO: Proper type conversion
					description: `Parameter: ${paramName}`,
					location: "message" as const
				}))
			: []

		// Convert return type to JSON schema  
		const messageSchema = operation.returnType
			? { type: "object" } // TODO: Proper type conversion
			: undefined

		// Generate protocol-specific bindings
		const protocolBinding = undefined // TODO: Implement when protocol decorators work

		// Create AsyncAPI operation object
		const asyncApiOperation: OperationObject = {
			action: "send", // TODO: Extract from operation type
			channel: { $ref: `#/channels/${channelName}` },
			summary: `${operation.name} operation`,
			description: `Generated from TypeSpec operation: ${operation.name}`,
		}

		yield* railwayLogging.logDebugGeneration("channel", channelName, {
			operation: operation.name,
			hasBindings: !!protocolBinding,
			hasParameters: !!parameters,
			hasMessage: !!messageSchema
		})

		return {
			channelName,
			operation: asyncApiOperation
		}
	})

/**
 * Process multiple operations and add them to AsyncAPI document
 */
export const processOperations = (
	operations: Operation[],
	asyncApiDoc: AsyncAPIObject,
	program: Program
): Effect.Effect<number, never> =>
	Effect.gen(function* () {
		yield* Effect.log(`🔄 Processing ${operations.length} operations with Effect.TS...`)

		// Process all operations in parallel for performance
		const operationResults = yield* Effect.all(
			operations.map(operation =>
				processSingleOperation(operation, asyncApiDoc, program)
			)
		)

		// Add channels and operations to AsyncAPI document
		for (const result of operationResults) {
			asyncApiDoc.channels = asyncApiDoc.channels || {}
			asyncApiDoc.channels[result.channelName] = {
				description: `Channel for ${result.channelName} operations`,
				address: `/${result.channelName}`,
			}
		}

		yield* Effect.log(`✅ Processed ${operations.length} operations successfully`)
		return operations.length
	})

/**
 * Extract operation metadata for enhanced AsyncAPI generation
 */
export const extractOperationMetadata = (
	operation: Operation,
	program: Program
): Effect.Effect<{
		name: string
		description?: string
		tags?: Array<{ name: string; description?: string }>
		protocol?: string
		contentType?: string
	}, never> =>
	Effect.gen(function* () {
		const messageConfig = {} // TODO: Extract from operation decorators properly
		const protocolInfo = {} // TODO: Extract from operation decorators properly

		return {
			name: operation.name,
			description: `${operation.name} operation metadata`,
		}
	})