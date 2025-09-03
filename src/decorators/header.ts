import type {DecoratorContext, Model, ModelProperty} from "@typespec/compiler"
import {$lib} from "../lib.js"
import {Effect} from "effect"
import type {HeaderConfig} from "./headerConfig.js"

/**
 * @header decorator for marking model properties as message headers
 *
 * Marks a model property to be extracted from the message payload and
 * placed in the AsyncAPI message headers schema. This is useful for
 * metadata that should be accessible at the transport level.
 *
 * @example
 * ```typespec
 * model UserMessage {
 *   @header messageId: string;
 *   @header("correlation-id") correlationId?: string;
 *   @header traceId?: string;
 *   
 *   // These remain in payload
 *   userId: string;
 *   data: string;
 * }
 * ```
 */
export function $header(
	context: DecoratorContext,
	target: ModelProperty,
	name?: string,
): void {
	Effect.log(`📧 PROCESSING @header decorator on property: ${target.name}`)
	Effect.log(`📧 Custom header name:`, name)

	// Validate target is a ModelProperty
	if (target.kind !== 'ModelProperty') {
		Effect.log(`❌ @header can only be applied to model properties, not ${target.kind}`)
		return
	}

	// Get property information
	const propertyName = target.name
	const headerName = name || propertyName

	// Validate header name
	if (!isValidHeaderName(headerName)) {
		Effect.log(`❌ Invalid header name: ${headerName}`)
		return
	}

	// Build header configuration
	const headerConfig: HeaderConfig = {
		name: headerName,
		description: `Header extracted from property: ${propertyName}`,
		required: !target.optional,
		type: inferHeaderType(target)
	}

	// Store header configuration in program state
	const headersMap = context.program.stateMap($lib.stateKeys.messageHeaders)
	
	// Get existing headers for the parent model
	const parentModel = target.model
	if (!parentModel) {
		Effect.log(`❌ Could not find parent model for property ${propertyName}`)
		return
	}

	const existingHeaders = (headersMap.get(parentModel) as Map<string, HeaderConfig>) || new Map()
	existingHeaders.set(propertyName, headerConfig)
	
	headersMap.set(parentModel, existingHeaders)

	Effect.log(`✅ Successfully stored header config for property ${propertyName}`)
	Effect.log(`📧 Header name: ${headerConfig.name}`)
	Effect.log(`📧 Required: ${headerConfig.required}`)
	Effect.log(`📧 Type:`, headerConfig.type)
}

/**
 * Get header configuration for a model property
 */
export function getHeaderConfig(
	context: DecoratorContext,
	modelProperty: ModelProperty,
): HeaderConfig | undefined {
	const headersMap = context.program.stateMap($lib.stateKeys.messageHeaders)
	const parentModel = modelProperty.model
	
	if (!parentModel) return undefined
	
	const modelHeaders = headersMap.get(parentModel) as Map<string, HeaderConfig> | undefined
	return modelHeaders?.get(modelProperty.name)
}

/**
 * Get all header configurations for a model
 */
export function getModelHeaders(
	context: DecoratorContext,
	model: Model,
): Map<string, HeaderConfig> {
	const headersMap = context.program.stateMap($lib.stateKeys.messageHeaders)
	return (headersMap.get(model) as Map<string, HeaderConfig>) || new Map()
}

/**
 * Check if a model property is marked as a header
 */
export function isHeader(
	context: DecoratorContext,
	modelProperty: ModelProperty,
): boolean {
	return getHeaderConfig(context, modelProperty) !== undefined
}

/**
 * Validate header name according to HTTP header naming rules
 */
function isValidHeaderName(name: string): boolean {
	// HTTP header names are case-insensitive and consist of alphanumeric characters and hyphens
	// They cannot start or end with hyphens
	return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(name)
}

/**
 * Infer header type from TypeSpec model property type
 * TODO: Improve!
 */
function inferHeaderType(property: ModelProperty): HeaderConfig['type'] {
	// Get the property type
	const type = property.type
	
	// Default type configuration
	const defaultType: HeaderConfig['type'] = {
		type: 'string'
	}

	// Basic type inference based on TypeSpec intrinsic types
	if (type.kind === 'Intrinsic') {
		const typeName = String(type.name)
		
		if (typeName === 'string') {
			return { type: 'string' }
		} else if (['int32', 'int64', 'float32', 'float64', 'numeric'].includes(typeName)) {
			return { type: 'number' }
		} else if (typeName === 'boolean') {
			return { type: 'boolean' }
		} else {
			return defaultType
		}
	}

	// For other types, default to string
	return defaultType
}

/**
 * Generate AsyncAPI headers schema from header configurations
 */
export function generateHeadersSchema(
	headers: Map<string, HeaderConfig>,
): Record<string, unknown> {
	const schema: Record<string, unknown> = {}
	
	for (const [propertyName, config] of headers) {
		schema[config.name || propertyName] = {
			type: config.type?.type || 'string',
			description: config.description,
			...(config.type?.format && { format: config.type.format }),
			...(config.type?.pattern && { pattern: config.type.pattern })
		}
	}
	
	return schema
}

/**
 * Extract headers from a model and return the remaining payload properties
 */
export function extractHeaders(
	context: DecoratorContext,
	model: Model,
): { headers: Map<string, HeaderConfig>, payloadProperties: string[] } {
	const allHeaders = getModelHeaders(context, model)
	const payloadProperties: string[] = []
	
	// Identify properties that are NOT headers
	if (model.properties) {
		for (const [propName] of model.properties) {
			if (!allHeaders.has(propName)) {
				payloadProperties.push(propName)
			}
		}
	}
	
	return {
		headers: allHeaders,
		payloadProperties
	}
}