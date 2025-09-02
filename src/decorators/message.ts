import type {DecoratorContext, Model, ModelProperty} from "@typespec/compiler"
import {$lib} from "../lib.js"
import {Effect} from "effect"

//TODO: CRITICAL - Add AsyncAPI 3.0.0 Message Object compliance validation
//TODO: CRITICAL - Implement proper Effect.TS schema validation using @effect/schema
//TODO: CRITICAL - Add Message Trait support for reusable message configurations
//TODO: CRITICAL - Validate message payload schema structure against AsyncAPI spec
//TODO: CRITICAL - Add support for AsyncAPI Message Object fields (schemaFormat, messageId)
//TODO: CRITICAL - Implement proper validation for message bindings (protocol-specific)

//TODO: CRITICAL - Use proper branded types with schema validation instead of simple branding
type ExampleName = string & { readonly brand: 'ExampleName' };
type ExampleSummary = string & { readonly brand: 'ExampleSummary' };

export type MessageExample = {
	name?: ExampleName;
	summary?: ExampleSummary;
	//TODO: CRITICAL - 'unknown' type defeats type safety - should use proper schema validation
	value: unknown;
};

//TODO: CRITICAL - Missing required AsyncAPI Message Object fields (payload, schemaFormat, messageId)
//TODO: CRITICAL - Add validation for message name format (AsyncAPI naming conventions)
//TODO: CRITICAL - Add support for message traits inheritance
//TODO: CRITICAL - Validate contentType against RFC 2046 media type specifications
export type MessageConfig = {
	/** Unique identifier for the message */
	name?: string;
	/** Human readable title for the message */
	title?: string;
	/** Brief summary of the message */
	summary?: string;
	/** Detailed description of the message */
	description?: string;
	/** Content type of the message payload */
	contentType?: string;
	/** Examples of the message */
	examples?: Array<MessageExample>;
	/** Message headers schema reference */
	headers?: string;
	/** Correlation ID reference for message tracking */
	correlationId?: string;
	/** Message bindings for protocol-specific information */
	//TODO: CRITICAL - Should validate bindings structure per AsyncAPI protocol specifications
	bindings?: Record<string, unknown>;
}

/**
 * @message decorator for defining AsyncAPI message schemas
 *
 * Applies message metadata to TypeSpec models that represent AsyncAPI messages.
 * Supports content types, examples, headers, and correlation IDs.
 *
 * @example
 * ```typespec
 * @message(#{
 *   name: "UserRegistered",
 *   title: "User Registration Event",
 *   contentType: "application/json",
 *   description: "Emitted when a new user registers"
 * })
 * model UserRegisteredMessage {
 *   userId: string;
 *   email: string;
 *   timestamp: utcDateTime;
 * }
 * ```
 */
//TODO: CRITICAL - Add validation for AsyncAPI Message Object required fields
//TODO: CRITICAL - Implement proper Effect.TS monadic error handling
//TODO: CRITICAL - Add message schema validation against target Model structure
//TODO: CRITICAL - Validate message examples against actual message payload schema
export function $message(
	context: DecoratorContext,
	target: Model,
	config?: MessageConfig,
): void {
	Effect.log(`=
 PROCESSING @message decorator on model: ${target.name}`)
	Effect.log(`=� Message config:`, config)
	Effect.log(`<�  Target type: ${target.kind}`)

	//TODO: CRITICAL - This comment is misleading - should validate Model type constraints
	// Target is always Model type - no validation needed

	//TODO: CRITICAL - No validation for config structure - should use Effect.TS schema validation
	// Validate message configuration
	const messageConfig = config ?? {}

	//TODO: CRITICAL - Potential mutation of readonly config object
	// Extract message name from model name if not provided
	messageConfig.name ??= target.name

	Effect.log(`=� Processed message config:`, messageConfig)

	//TODO: CRITICAL - Hardcoded array should be extracted to constants with proper validation
	// Validate content type if provided
	if (messageConfig.contentType) {
		const validContentTypes = [
			"application/json",
			"application/xml",
			"text/plain",
			"application/avro",
			"application/protobuf",
			"application/octet-stream",
		]

		if (!validContentTypes.includes(messageConfig.contentType)) {
			Effect.log(`�  Potentially unsupported content type: ${messageConfig.contentType}`)
		}
	}

	//TODO: CRITICAL - No validation that messageMap exists or handles potential undefined
	// Store message configuration in program state
	const messageMap = context.program.stateMap($lib.stateKeys.messageConfigs)
	messageMap.set(target, messageConfig)

	Effect.log(` Successfully stored message config for model ${target.name}`)
	Effect.log(`=� Total models with message config: ${messageMap.size}`)
}

/**
 * Get message configuration for a model
 */
//TODO: CRITICAL - Unsafe type assertion 'as MessageConfig' defeats type safety
//TODO: CRITICAL - No validation that messageMap exists or handles potential undefined
export function getMessageConfig(context: DecoratorContext, target: Model): MessageConfig | undefined {
	const messageMap = context.program.stateMap($lib.stateKeys.messageConfigs)
	return messageMap.get(target) as MessageConfig | undefined
}

/**
 * Check if a model has message configuration
 */
//TODO: CRITICAL - No validation that messageMap exists or handles potential undefined
export function isMessage(context: DecoratorContext, target: Model): boolean {
	const messageMap = context.program.stateMap($lib.stateKeys.messageConfigs)
	return messageMap.has(target)
}

/**
 * @header decorator for marking model properties as message headers
 * 
 * Properties marked with @header are extracted from the message payload
 * and placed in the AsyncAPI message headers schema. This is useful for
 * protocol-level metadata that should be accessible without parsing the payload.
 * 
 * @example
 * ```typespec
 * @message("UserEvent")
 * model UserEventMessage {
 *   @header messageId: string;
 *   @header correlationId?: string;
 *   userId: string;
 *   eventData: string;
 * }
 * ```
 */
export function $header(
	context: DecoratorContext,
	target: ModelProperty
): void {
	Effect.log(`🏷️ PROCESSING @header decorator on property: ${target.name}`)
	Effect.log(`🏷️ Property type: ${target.type.kind}`)

	// Store header property in program state for later processing
	const headerMap = context.program.stateMap($lib.stateKeys.messageHeaders)
	
	// Create header metadata
	const headerInfo = {
		propertyName: target.name,
		type: target.type,
		optional: target.optional,
		model: target.model // Reference to the containing model
	}
	
	headerMap.set(target, headerInfo)

	Effect.log(`✅ Successfully stored header property ${target.name}`)
	Effect.log(`🏷️ Total header properties: ${headerMap.size}`)
}