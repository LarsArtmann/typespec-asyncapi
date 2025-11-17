/**
 * Operation Processing Service
 * 
 * Handles transformation of TypeSpec operations into AsyncAPI channel structures.
 * Extracted from ProcessingService.ts for single responsibility principle.
 */

import { Effect } from "effect"
import type { Operation, Program } from "@typespec/compiler"
import { getDoc } from "@typespec/compiler"
import type { AsyncAPIObject, OperationObject } from "@asyncapi/parser/esm/spec-types/v3.js"
import { createChannelDefinition } from "../../utils/asyncapi-helpers.js"
import { railwayLogging } from "../../utils/effect-helpers.js"

// 🔥 CRITICAL FIX: Apply branded types to eliminate type safety waste
import { ChannelName, OperationName } from "../../types/branded-types.js"

/**
 * Process a single TypeSpec operation into AsyncAPI operation
 */
export const processSingleOperation = (
	operation: Operation,
	asyncApiDoc: AsyncAPIObject,
	program: Program
): Effect.Effect<{ channelName: ChannelName; operation: OperationObject; messageSchema?: Record<string, unknown> }, never> =>
	Effect.gen(function* () {
		yield* railwayLogging.logDebugGeneration("operation", operation.name, {
			type: operation.returnType?.kind || 'unknown',
			parameters: operation.parameters?.properties?.size || 0
		})

		// 🔥 CRITICAL FIX: Apply branded types for type safety
		// Extract operation metadata using TypeSpec helpers
		const operationInfo = {
			name: operation.name as OperationName,
			description: getDoc(program, operation) ?? `Generated from TypeSpec operation: ${operation.name}`,
			summary: getDoc(program, operation) ?? `${operation.name} operation`
		}

		// Generate channel name from operation
		const channelDefinition = createChannelDefinition(operation, program)
		const channelName: ChannelName = channelDefinition.name

		// Convert parameters to JSON schema if present
		const parameters = operation.parameters?.properties
			? Array.from(operation.parameters.properties.entries()).map(([paramName, paramModel]) => {
					const schemaType = paramModel.type.kind === "String" ? "string" :
														paramModel.type.kind === "Number" ? "number" :
														paramModel.type.kind === "Boolean" ? "boolean" : "string"
					
					return {
						name: paramName,
						schema: { type: schemaType },
						description: `Parameter: ${paramName}`,
						location: "message" as const
					}
				})
			: []

		// Convert return type to JSON schema  
		const messageSchema = operation.returnType
			? {
					type: "object",
					properties: operation.returnType.kind === "Model" && operation.returnType.properties?.size > 0
						? Object.fromEntries(
								Array.from(operation.returnType.properties.entries()).map(([propName, propModel]) => [
										propName,
										propModel.type.kind === "String" ? { type: "string" } :
										propModel.type.kind === "Number" ? { type: "number" } :
										propModel.type.kind === "Boolean" ? { type: "boolean" } : { type: "string" }
								])
							)
						: undefined
				}
			: undefined

		// Generate protocol-specific bindings
		const protocolBinding = undefined // TODO: Implement when protocol decorators work

		// Create AsyncAPI operation object using extracted metadata
		const asyncApiOperation: OperationObject = {
			action: "send", // TODO: Extract from operation type
			channel: { $ref: `#/channels/${channelName}` },
			summary: operationInfo.summary,
			description: operationInfo.description,
		}

		yield* railwayLogging.logDebugGeneration("channel", channelName, {
			operation: operation.name,
			hasBindings: !!protocolBinding,
			hasParameters: !!parameters,
			hasMessage: !!messageSchema
		})

		return {
			channelName,
			operation: asyncApiOperation,
			messageSchema
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
			asyncApiDoc.channels = asyncApiDoc.channels ?? {}
			
			// Create message components if message schema exists
			if (result.messageSchema) {
				asyncApiDoc.components = asyncApiDoc.components ?? {}
				asyncApiDoc.components.messages = asyncApiDoc.components.messages ?? {}
				asyncApiDoc.components.messages[`${result.channelName}Message`] = {
					name: `${result.channelName}Message`,
					title: `${result.channelName} Message`,
					description: `Message for ${result.channelName} operations`,
					contentType: "application/json",
					payload: result.messageSchema
				}
			}
			
			// Create AsyncAPI 3.0 compliant channel
			const channelObject = {
				description: `Channel for ${result.channelName} operations`,
				address: `/${result.channelName}`,
				messages: result.messageSchema ? {
					[`${result.channelName}Message`]: {
						$ref: `#/components/messages/${result.channelName}Message`,
					},
				} : undefined,
				operations: {
					[result.operation.action]: result.operation
				}
			}
			
			asyncApiDoc.channels[result.channelName] = channelObject
		}

		yield* Effect.log(`✅ Processed ${operations.length} operations successfully`)
		return operations.length
	})

// extractOperationMetadata was a ghost function - never called, just had TODO placeholders
// Metadata extraction is now properly integrated into processSingleOperation above