import type {AsyncAPIProtocolType} from "../../constants/index.js"
import type {Effect} from "effect"

/**
 * Protocol plugin interface - comprehensive AsyncAPI 3.0 support
 * Enhanced to support all binding types (server, channel, operation, message)
 *
 * TODO: FUCKING USE GENERICS WHAT SHIT IS THIS!!! unknown & Error everywhere!!!! LOSING ALL benefits of Effect!!!!
 */
export type ProtocolPlugin = {
	readonly name: AsyncAPIProtocolType
	readonly version: string

	/**
	 * Generate protocol-specific bindings for operations
	 */
	generateOperationBinding?: (operation: unknown) => Effect.Effect<Record<string, unknown>, Error>

	/**
	 * Generate protocol-specific bindings for messages
	 */
	generateMessageBinding?: (message: unknown) => Effect.Effect<Record<string, unknown>, Error>

	/**
	 * Generate protocol-specific server configuration
	 */
	generateServerBinding?: (server: unknown) => Effect.Effect<Record<string, unknown>, Error>

	/**
	 * Generate protocol-specific channel configuration (for Kafka topics, etc.)
	 */
	generateChannelBinding?: (channel: unknown) => Effect.Effect<Record<string, unknown>, Error>

	/**
	 * Validate protocol-specific configuration
	 */
	validateConfig?: (config: unknown) => Effect.Effect<boolean, Error>
}