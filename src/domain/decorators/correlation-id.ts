import type {DecoratorContext, Model} from "@typespec/compiler"
import {$lib} from "../../lib.js"
import {Effect} from "effect"
import type {CorrelationIdConfig} from "./correlation-id-config.js"

/**
 * @correlationId decorator for message correlation tracking
 *
 * Defines correlation ID configuration for AsyncAPI messages to enable
 * request-response correlation, distributed tracing, and message tracking.
 * 
 * The correlation ID allows linking related messages across different channels
 * and services, enabling proper event sourcing, saga patterns, and debugging.
 *
 * @example
 * ```typespec
 * @correlationId(#{
 *   location: "$message.header#/correlationId",
 *   description: "Unique identifier for correlating request-response pairs",
 *   required: true,
 *   schema: #{ type: "string", format: "uuid" }
 * })
 * @message("UserRequest")
 * model UserRequestMessage {
 *   @header correlationId: string;
 *   userId: string;
 *   action: string;
 * }
 * ```
 */
export function $correlationId(
	context: DecoratorContext,
	target: Model,
	config: Record<string, unknown>,
): void {
	Effect.log(`🔗 PROCESSING @correlationId decorator on model: ${target.name}`)
	Effect.log(`🔗 Correlation config:`, config)

	// Validate target is a Model
	if (target.kind !== 'Model') {
		Effect.log(`❌ @correlationId can only be applied to models, not ${target.kind}`)
		return
	}

	// Validate required location field
	if (!config.location || typeof config.location !== 'string') {
		Effect.log(`❌ correlationId config must include location field (JSONPointer string)`)
		return
	}

	// Validate JSONPointer format
	const location = config.location
	if (!isValidJSONPointer(location)) {
		Effect.log(`❌ Invalid JSONPointer location: ${location}`)
		return
	}

	// Build correlation ID configuration with conditional properties
	const schemaConfig = validateCorrelationSchema(config.schema as Record<string, unknown> | undefined)
	const correlationConfig: CorrelationIdConfig = {
		location,
		required: Boolean(config.required),
		...(config.description ? { description: config.description as string } : {}),
		...(schemaConfig ? { schema: schemaConfig } : {}),
	}

	// Store correlation configuration in program state
	const correlationMap = context.program.stateMap($lib.stateKeys.correlationIds)
	correlationMap.set(target, correlationConfig)

	Effect.log(`✅ Successfully stored correlation ID config for model ${target.name}`)
	Effect.log(`🔗 Location: ${correlationConfig.location}`)
	Effect.log(`🔗 Required: ${correlationConfig.required}`)
	Effect.log(`🔗 Schema:`, correlationConfig.schema)
}

/**
 * Get correlation ID configuration for a model
 */
export function getCorrelationIdConfig(
	context: DecoratorContext,
	target: Model,
): CorrelationIdConfig | undefined {
	const correlationMap = context.program.stateMap($lib.stateKeys.correlationIds)
	return correlationMap.get(target) as CorrelationIdConfig | undefined
}

/**
 * Check if a model has correlation ID configuration
 */
export function hasCorrelationId(
	context: DecoratorContext,
	target: Model,
): boolean {
	const correlationMap = context.program.stateMap($lib.stateKeys.correlationIds)
	return correlationMap.has(target)
}

/**
 * Validate JSONPointer format according to RFC 6901
 */
function isValidJSONPointer(pointer: string): boolean {
	// JSONPointer must start with # or /
	if (!pointer.startsWith('#') && !pointer.startsWith('/')) {
		return false
	}

	// Common AsyncAPI message locations
	const validLocations = [
		'$message.header#/correlationId',
		'$message.payload#/correlationId',
		'$message.header#/messageId',
		'$message.header#/requestId',
		'$message.header#/traceId',
		'/correlationId',
		'/messageId',
		'/requestId',
		'#/correlationId',
		'#/messageId',
		'#/requestId'
	]

	return validLocations.includes(pointer) || 
		   pointer.startsWith('$message.header#/') ||
		   pointer.startsWith('$message.payload#/') ||
		   /^#\/[a-zA-Z][a-zA-Z0-9_]*$/.test(pointer) ||
		   /^\/[a-zA-Z][a-zA-Z0-9_]*$/.test(pointer)
}

/**
 * Validate and normalize correlation ID schema
 */
function validateCorrelationSchema(
	schema: Record<string, unknown> | undefined,
): CorrelationIdConfig['schema'] | undefined {
	if (!schema) {
		return {
			type: 'string',
			format: 'uuid'
		}
	}

	const validTypes = ['string', 'number']
	const type = schema.type as string
	
	if (!validTypes.includes(type)) {
		Effect.log(`⚠️ Invalid correlation schema type: ${type}, defaulting to 'string'`)
		return {
			type: 'string',
			format: 'uuid'
		}
	}

	const validatedSchema: CorrelationIdConfig['schema'] = {
		type: type as 'string' | 'number'
	}

	// Add format validation for strings
	if (type === 'string') {
		const validFormats = ['uuid', 'custom']
		const format = schema.format as string
		if (format && validFormats.includes(format)) {
			validatedSchema.format = format as 'uuid' | 'custom'
		} else {
			validatedSchema.format = 'uuid'
		}

		// Add pattern validation
		if (schema.pattern && typeof schema.pattern === 'string') {
			try {
				new RegExp(schema.pattern) // Test if valid regex
				validatedSchema.pattern = schema.pattern
			} catch {
				Effect.log(`⚠️ Invalid regex pattern: ${schema.pattern}`)
			}
		}

		// Add length validation
		if (schema.minLength && typeof schema.minLength === 'number') {
			validatedSchema.minLength = Math.max(1, Math.floor(schema.minLength))
		}
		if (schema.maxLength && typeof schema.maxLength === 'number') {
			validatedSchema.maxLength = Math.max(1, Math.floor(schema.maxLength))
		}
	} else if (type === 'number') {
		const validFormats = ['int32', 'int64', 'custom']
		const format = schema.format as string
		if (format && validFormats.includes(format)) {
			validatedSchema.format = format as 'int32' | 'int64' | 'custom'
		} else {
			validatedSchema.format = 'int64'
		}
	}

	return validatedSchema
}

/**
 * Generate correlation ID examples based on schema configuration
 */
export function generateCorrelationIdExamples(
	config: CorrelationIdConfig,
): string[] {
	const schema = config.schema || { type: 'string', format: 'uuid' }
	
	if (schema.type === 'string') {
		switch (schema.format) {
			case 'uuid':
				return [
					'550e8400-e29b-41d4-a716-446655440000',
					'6ba7b810-9dad-11d1-80b4-00c04fd430c8',
					'123e4567-e89b-12d3-a456-426614174000'
				]
			case 'custom':
				if (schema.pattern) {
					return ['CORR-001', 'REQ-12345', 'TXN-ABCD-001']
				}
				return ['correlation-123', 'request-abc-456']
			default:
				return ['correlation-id-123', 'request-456']
		}
	} else {
		switch (schema.format) {
			case 'int32':
				return ['123456789', '987654321', '555000111']
			case 'int64':
				return ['1234567890123456', '9876543210987654', '5550001112223334']
			default:
				return ['123456', '789012', '345678']
		}
	}
}

/**
 * Validate correlation ID value against schema
 */
export function validateCorrelationIdValue(
	value: string | number,
	config: CorrelationIdConfig,
): boolean {
	const schema = config.schema || { type: 'string', format: 'uuid' }
	
	if (schema.type === 'string') {
		if (typeof value !== 'string') return false
		
		if (schema.minLength && value.length < schema.minLength) return false
		if (schema.maxLength && value.length > schema.maxLength) return false
		
		if (schema.pattern) {
			try {
				const regex = new RegExp(schema.pattern)
				if (!regex.test(value)) return false
			} catch {
				return false
			}
		}
		
		if (schema.format === 'uuid') {
			const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
			return uuidRegex.test(value)
		}
		
		return true
	} else {
		if (typeof value !== 'number') return false
		
		if (schema.format === 'int32') {
			return Number.isInteger(value) && value >= -2147483648 && value <= 2147483647
		} else if (schema.format === 'int64') {
			return Number.isInteger(value) && Number.isSafeInteger(value)
		}
		
		return Number.isFinite(value)
	}
}