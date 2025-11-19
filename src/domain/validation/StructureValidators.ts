/**
 * Structure Validators - AsyncAPI Document Structure Validation
 *
 * Handles validation of AsyncAPI document structure compliance:
 * - Basic required fields (asyncapi, info)
 * - Info section (title, version, description)
 * - Channels section (address, messages)
 * - Operations section (action, channel)
 * - Components section (messages, schemas)
 *
 * Extracted from ValidationService.ts to maintain <350 line limit.
 * Part of Phase 1 architectural excellence improvements.
 */

import type { AsyncAPIObject, ReferenceObject } from "@asyncapi/parser/esm/spec-types/v3.js"

/**
 * Type guard to check if object is a reference
 *
 * @param obj - Object to check
 * @returns True if object is a ReferenceObject with $ref
 */
export const isReference = (obj: unknown): obj is ReferenceObject => {
	return obj != null && typeof obj === 'object' && '$ref' in obj
}

/**
 * Validate basic AsyncAPI document structure
 *
 * Checks for required top-level fields and AsyncAPI version compliance
 *
 * @param doc - AsyncAPI document to validate
 * @param errors - Array to collect error messages
 * @param warnings - Array to collect warning messages
 */
export const validateBasicStructure = (doc: AsyncAPIObject, errors: string[], warnings: string[]): void => {
	// Handle null/undefined document
	if (!doc) {
		errors.push("Document is null or undefined")
		return
	}

	// Validate AsyncAPI version
	if (!doc.asyncapi) {
		errors.push("Missing required 'asyncapi' field")
	} else if (!doc.asyncapi.startsWith('3.')) {
		warnings.push(`Using AsyncAPI version ${doc.asyncapi}, expected 3.x`)
	}

	// Validate required top-level fields
	if (!doc.info) {
		errors.push("Missing required 'info' section")
	}
}

/**
 * Validate info section compliance
 *
 * Ensures required fields (title, version) are present
 * and recommends optional fields (description)
 *
 * @param doc - AsyncAPI document to validate
 * @param errors - Array to collect error messages
 * @param warnings - Array to collect warning messages
 */
export const validateInfoSection = (doc: AsyncAPIObject, errors: string[], warnings: string[]): void => {
	if (!doc?.info) return

	// Required fields
	if (!doc.info.title) {
		errors.push("Missing required 'info.title' field")
	}

	if (!doc.info.version) {
		errors.push("Missing required 'info.version' field")
	}

	// Recommendations
	if (!doc.info.description) {
		warnings.push("Missing recommended 'info.description' field")
	}
}

/**
 * Validate channels section
 *
 * Ensures channels have required fields (address) and proper structure
 *
 * @param doc - AsyncAPI document to validate
 * @param errors - Array to collect error messages
 * @param warnings - Array to collect warning messages
 * @returns Number of channels found
 */
export const validateChannels = (doc: AsyncAPIObject, errors: string[], warnings: string[]): number => {
	if (!doc?.channels || Object.keys(doc.channels).length === 0) {
		warnings.push("No channels defined - document may be incomplete")
		return 0
	}

	const channelNames = Object.keys(doc.channels)

	channelNames.forEach(channelName => {
		const channel = doc.channels?.[channelName]
		if (!channel) return

		// Skip validation for references - they should be resolved externally
		if (isReference(channel)) {
			warnings.push(`Channel '${channelName}' is a reference ($ref) - cannot validate structure`)
			return
		}

		// Validate channel structure for actual ChannelObject
		if (!channel.address) {
			errors.push(`Channel '${channelName}' missing required 'address' field`)
		}

		// Validate messages reference
		if (channel.messages && Object.keys(channel.messages).length === 0) {
			warnings.push(`Channel '${channelName}' has empty messages section`)
		}
	})

	return channelNames.length
}

/**
 * Validate operations section
 *
 * Ensures operations have required fields (action, channel) and valid action types
 *
 * @param doc - AsyncAPI document to validate
 * @param errors - Array to collect error messages
 * @param warnings - Array to collect warning messages
 * @returns Number of operations found
 */
export const validateOperations = (doc: AsyncAPIObject, errors: string[], warnings: string[]): number => {
	if (!doc?.operations || Object.keys(doc.operations).length === 0) {
		warnings.push("No operations defined - document may be incomplete")
		return 0
	}

	const operationNames = Object.keys(doc.operations)

	operationNames.forEach(operationName => {
		const operation = doc.operations?.[operationName]
		if (!operation) return

		// Skip validation for references - they should be resolved externally
		if (isReference(operation)) {
			warnings.push(`Operation '${operationName}' is a reference ($ref) - cannot validate structure`)
			return
		}

		// Validate required fields for actual OperationObject
		if (!operation.action) {
			errors.push(`Operation '${operationName}' missing required 'action' field`)
		} else if (!['send', 'receive'].includes(operation.action)) {
			errors.push(`Operation '${operationName}' has invalid action '${operation.action}', must be 'send' or 'receive'`)
		}

		if (!operation.channel) {
			errors.push(`Operation '${operationName}' missing required 'channel' reference`)
		}
	})

	return operationNames.length
}

/**
 * Validate components section
 *
 * Ensures messages and schemas are properly defined
 *
 * @param doc - AsyncAPI document to validate
 * @param _errors - Array to collect error messages (currently unused)
 * @param warnings - Array to collect warning messages
 * @returns Object with message and schema counts
 */
export const validateComponents = (
	doc: AsyncAPIObject,
	_errors: string[],
	warnings: string[]
): { messagesCount: number, schemasCount: number } => {
	let messagesCount = 0
	let schemasCount = 0

	if (!doc?.components) {
		warnings.push("No components section defined")
		return { messagesCount, schemasCount }
	}

	// Validate messages
	if (doc.components.messages) {
		messagesCount = Object.keys(doc.components.messages).length

		Object.entries(doc.components.messages).forEach(([messageName, message]) => {
			// Skip validation for references
			if (isReference(message)) {
				warnings.push(`Message '${messageName}' is a reference ($ref) - cannot validate structure`)
				return
			}

			// Validate actual MessageObject
			if (!message.name) {
				warnings.push(`Message '${messageName}' missing 'name' field`)
			}
		})
	}

	// Validate schemas
	if (doc.components.schemas) {
		schemasCount = Object.keys(doc.components.schemas).length
	}

	return { messagesCount, schemasCount }
}
