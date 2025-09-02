import type {DecoratorContext, Model} from "@typespec/compiler"
import {$lib} from "../lib.js"
import {Effect} from "effect"

type ExampleName = string & { readonly brand: 'ExampleName' };
type ExampleSummary = string & { readonly brand: 'ExampleSummary' };

export type MessageExample = {
	name?: ExampleName;
	summary?: ExampleSummary;
	value: unknown;
};

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
export function $message(
	context: DecoratorContext,
	target: Model,
	config?: MessageConfig,
): void {
	Effect.log(`=
 PROCESSING @message decorator on model: ${target.name}`)
	Effect.log(`=� Message config:`, config)
	Effect.log(`<�  Target type: ${target.kind}`)

	// Target is always Model type - no validation needed

	// Validate message configuration
	const messageConfig = config ?? {}

	// Extract message name from model name if not provided
	messageConfig.name ??= target.name

	Effect.log(`=� Processed message config:`, messageConfig)

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

	// Store message configuration in program state
	const messageMap = context.program.stateMap($lib.stateKeys.messageConfigs)
	messageMap.set(target, messageConfig)

	Effect.log(` Successfully stored message config for model ${target.name}`)
	Effect.log(`=� Total models with message config: ${messageMap.size}`)
}

/**
 * Get message configuration for a model
 */
export function getMessageConfig(context: DecoratorContext, target: Model): MessageConfig | undefined {
	const messageMap = context.program.stateMap($lib.stateKeys.messageConfigs)
	return messageMap.get(target) as MessageConfig | undefined
}

/**
 * Check if a model has message configuration
 */
export function isMessage(context: DecoratorContext, target: Model): boolean {
	const messageMap = context.program.stateMap($lib.stateKeys.messageConfigs)
	return messageMap.has(target)
}