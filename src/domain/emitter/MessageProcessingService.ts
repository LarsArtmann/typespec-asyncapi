/**
 * Message Processing Service
 * 
 * Handles transformation of TypeSpec message models into AsyncAPI message structures.
 * Extracted from ProcessingService.ts for single responsibility principle.
 */

import { Effect } from "effect"
import type { Model, Program } from "@typespec/compiler"
import type { AsyncAPIObject, MessageObject } from "@asyncapi/parser/esm/spec-types/v3.js"
import { convertModelToSchema } from "../../utils/schema-conversion.js"
import { getMessageConfig } from "../../utils/typespec-helpers.js"
import { railwayLogging } from "../../utils/effect-helpers.js"

/**
 * Process a single TypeSpec message model into AsyncAPI message
 */
export const processSingleMessageModel = (
	messageModel: Model,
	asyncApiDoc: AsyncAPIObject,
	program: Program
): Effect.Effect<string, never> =>
	Effect.gen(function* () {
		const messageConfig = getMessageConfig(program, messageModel)
		
		// Convert message model to JSON schema
		const schema = yield* Effect.sync(() => 
			convertModelToSchema(messageModel, program)
		)

		// Generate message name
		const messageName = messageModel.name || `${messageConfig.type}Message`

		// Create AsyncAPI message object
		const message: MessageObject = {
			name: messageName,
			title: messageConfig.title || messageName,
			description: messageConfig.description,
			contentType: messageConfig.contentType || "application/json",
			payload: schema
		}

		// Add to AsyncAPI document components
		asyncApiDoc.components = asyncApiDoc.components || {}
		asyncApiDoc.components.messages = asyncApiDoc.components.messages || {}
		asyncApiDoc.components.messages[messageName] = message

		// Add schema to components if not already present
		if (schema && typeof schema === 'object' && schema !== null) {
			asyncApiDoc.components.schemas = asyncApiDoc.components.schemas || {}
			asyncApiDoc.components.schemas[`${messageName}Schema`] = schema
		}

		yield* railwayLogging.logDebugGeneration("message", messageName, {
			contentType: message.contentType,
			hasPayload: !!schema
		})

		return messageName
	})

/**
 * Process multiple message models and add them to AsyncAPI document
 */
export const processMessageModels = (
	messageModels: Model[],
	asyncApiDoc: AsyncAPIObject,
	program: Program
): Effect.Effect<number, never> =>
	Effect.gen(function* () {
		yield* Effect.log(`🎯 Processing ${messageModels.length} message models with functional composition...`)

		// Process each message model in parallel for performance
		yield* Effect.all(
			messageModels.map(model =>
				processSingleMessageModel(model, asyncApiDoc, program)
			)
		)

		yield* railwayLogging.logBatchCompletion(messageModels.length, 0, 0)
		return messageModels.length
	})

/**
 * Extract message metadata for enhanced AsyncAPI generation
 */
export const extractMessageMetadata = (
	messageModel: Model,
	program: Program
): Effect.Effect<{
		name: string
		title?: string
		description?: string
		contentType?: string
		hasSchema: boolean
	}, never> =>
	Effect.gen(function* () {
		const messageConfig = getMessageConfig(program, messageModel)
		const schema = convertModelToSchema(messageModel, program)

		return {
			name: messageModel.name || `${messageConfig.type}Message`,
			title: messageConfig.title,
			description: messageConfig.description,
			contentType: messageConfig.contentType,
			hasSchema: !!schema
		}
	})