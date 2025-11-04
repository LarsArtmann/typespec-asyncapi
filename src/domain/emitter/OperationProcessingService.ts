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
		const operationInfo = getMessageConfig(program, operation) || {}
		const protocolInfo = getProtocolConfig(program, operation) || {}

		// Generate channel name from operation
		const channelName = createChannelDefinition(operation.name)

		// Convert parameters to JSON schema if present
		const parameters = operation.parameters?.properties
			? Array.from(operation.parameters.properties.entries()).map(([paramName, paramModel]) => ({
					name: paramName,
					schema: convertModelToSchema(paramModel, program)
				}))
			: []

		// Convert return type to JSON schema  
		const messageSchema = operation.returnType
			? convertModelToSchema(operation.returnType, program)
			: undefined

		// Generate protocol-specific bindings
		const protocolBinding = protocolInfo.protocol
			? generateProtocolBinding(protocolInfo.protocol as AsyncAPIProtocolType, {
					channel: channelName,
					operation: operation.name,
					protocol: protocolInfo.protocol
				})
			: undefined

		// Create AsyncAPI operation object
		const asyncApiOperation: OperationObject = {
			summary: operationInfo.description || `${operation.name} operation`,
			description: operationInfo.description,
			parameters: parameters.map(param => ({
				name: param.name,
				schema: param.schema,
				description: `Parameter: ${param.name}`,
				location: "message" as const
			})),
			messages: messageSchema ? [{
				name: `${operation.name}Message`,
				payload: messageSchema,
				description: operationInfo.description,
				contentType: protocolInfo.contentType || "application/json"
			}] : undefined
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
				publish: result.operation.messages ? {
					operationId: result.operation.operationId || result.channelName,
					summary: result.operation.summary,
					description: result.operation.description,
					parameters: result.operation.parameters,
					messages: result.operation.messages
				} : undefined,
				bindings: result.operation.bindings
			}

			// Add message components if message schema exists
			if (result.operation.messages?.[0]?.payload) {
				asyncApiDoc.components = asyncApiDoc.components || {}
				asyncApiDoc.components.messages = asyncApiDoc.components.messages || {}
				asyncApiDoc.components.messages[`${result.channelName}Message`] = {
					name: `${result.channelName}Message`,
					title: `${result.channelName} Message`,
					description: `Message for ${result.channelName} operations`,
					contentType: result.operation.messages[0].contentType || "application/json",
					payload: result.operation.messages[0].payload
				}
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
		const messageConfig = getMessageConfig(program, operation)
		const protocolInfo = getProtocolConfig(program, operation)

		return {
			name: operation.name,
			description: messageConfig.description,
			tags: messageConfig.tags,
			protocol: protocolInfo.protocol,
			contentType: protocolInfo.contentType
		}
	})