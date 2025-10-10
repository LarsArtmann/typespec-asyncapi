/**
 * Branded Types for TypeSpec AsyncAPI Emitter
 *
 * Branded types provide compile-time type safety by distinguishing between
 * different string types that would otherwise be indistinguishable.
 *
 * Benefits:
 * - Prevents mixing up channel names with operation names
 * - Catches bugs at compile time
 * - Self-documenting code
 * - No runtime overhead
 *
 * @example
 * ```typescript
 * // ❌ Without branded types - can mix up strings:
 * function getChannel(name: string) { ... }
 * const operationName = "publishEvent"
 * getChannel(operationName) // Compiles but semantically wrong!
 *
 * // ✅ With branded types - type error:
 * function getChannel(name: ChannelName) { ... }
 * const operationName: OperationName = "publishEvent" as OperationName
 * getChannel(operationName) // Type error! Can't pass OperationName as ChannelName
 * ```
 */

/**
 * Branded type for AsyncAPI channel names
 *
 * Channel names are unique identifiers for message channels in AsyncAPI.
 * They must be valid AsyncAPI channel identifiers.
 *
 * @example "user.events", "orders.created", "notifications.sent"
 */
export type ChannelName = string & { readonly __brand: 'ChannelName' }

/**
 * Branded type for AsyncAPI operation names
 *
 * Operation names are unique identifiers for operations in AsyncAPI.
 * They correspond to TypeSpec operation names.
 *
 * @example "publishUserEvent", "subscribeOrderCreated"
 */
export type OperationName = string & { readonly __brand: 'OperationName' }

/**
 * Branded type for AsyncAPI message names
 *
 * Message names are unique identifiers for messages in AsyncAPI.
 * They are typically derived from operation or model names.
 *
 * @example "UserEventMessage", "OrderCreatedMessage"
 */
export type MessageName = string & { readonly __brand: 'MessageName' }

/**
 * Branded type for AsyncAPI schema names
 *
 * Schema names are unique identifiers for schema components in AsyncAPI.
 * They correspond to TypeSpec model names.
 *
 * @example "UserEvent", "OrderCreated", "Address"
 */
export type SchemaName = string & { readonly __brand: 'SchemaName' }

/**
 * Branded type for AsyncAPI server names
 *
 * Server names are unique identifiers for servers in AsyncAPI.
 *
 * @example "production", "staging", "kafka-broker"
 */
export type ServerName = string & { readonly __brand: 'ServerName' }

/**
 * Branded type for AsyncAPI security scheme names
 *
 * Security scheme names are unique identifiers for security schemes.
 *
 * @example "apiKey", "oauth2", "bearer"
 */
export type SecuritySchemeName = string & { readonly __brand: 'SecuritySchemeName' }

/**
 * Type guard: Check if string is valid channel name format
 *
 * Channel names should follow certain conventions:
 * - Alphanumeric, dots, hyphens, underscores
 * - Not empty
 * - No leading/trailing whitespace
 *
 * @param value - String to validate
 * @returns true if valid channel name format
 */
export function isValidChannelName(value: string): value is ChannelName {
	if (!value || typeof value !== 'string') return false
	if (value.trim() !== value) return false // No leading/trailing whitespace
	if (value.length === 0) return false
	// Allow alphanumeric, dots, hyphens, underscores, slashes (for paths)
	return /^[a-zA-Z0-9._\-/]+$/.test(value)
}

/**
 * Type guard: Check if string is valid operation name format
 *
 * Operation names should be valid JavaScript identifiers.
 *
 * @param value - String to validate
 * @returns true if valid operation name format
 */
export function isValidOperationName(value: string): value is OperationName {
	if (!value || typeof value !== 'string') return false
	if (value.trim() !== value) return false
	// Must be valid JavaScript identifier
	return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value)
}

/**
 * Type guard: Check if string is valid schema name format
 *
 * Schema names should be valid TypeScript type names.
 *
 * @param value - String to validate
 * @returns true if valid schema name format
 */
export function isValidSchemaName(value: string): value is SchemaName {
	if (!value || typeof value !== 'string') return false
	if (value.trim() !== value) return false
	// Must start with uppercase letter (TypeScript convention)
	return /^[A-Z][a-zA-Z0-9_]*$/.test(value)
}

/**
 * Create branded channel name (unsafe - no validation)
 *
 * Use this when you're certain the string is valid.
 * Prefer `toChannelName()` which validates.
 *
 * @param value - String to brand
 * @returns Branded ChannelName
 */
export function brandChannelName(value: string): ChannelName {
	return value as ChannelName
}

/**
 * Create branded operation name (unsafe - no validation)
 *
 * @param value - String to brand
 * @returns Branded OperationName
 */
export function brandOperationName(value: string): OperationName {
	return value as OperationName
}

/**
 * Create branded message name (unsafe - no validation)
 *
 * @param value - String to brand
 * @returns Branded MessageName
 */
export function brandMessageName(value: string): MessageName {
	return value as MessageName
}

/**
 * Create branded schema name (unsafe - no validation)
 *
 * @param value - String to brand
 * @returns Branded SchemaName
 */
export function brandSchemaName(value: string): SchemaName {
	return value as SchemaName
}

/**
 * Create branded server name (unsafe - no validation)
 *
 * @param value - String to brand
 * @returns Branded ServerName
 */
export function brandServerName(value: string): ServerName {
	return value as ServerName
}

/**
 * Create branded security scheme name (unsafe - no validation)
 *
 * @param value - String to brand
 * @returns Branded SecuritySchemeName
 */
export function brandSecuritySchemeName(value: string): SecuritySchemeName {
	return value as SecuritySchemeName
}

/**
 * Convert string to ChannelName with validation
 *
 * @param value - String to convert
 * @returns ChannelName if valid
 * @throws {Error} If validation fails
 */
export function toChannelName(value: string): ChannelName {
	if (!isValidChannelName(value)) {
		throw new Error(
			`Invalid channel name: "${value}". Must be alphanumeric with dots, hyphens, underscores, or slashes.`
		)
	}
	return value
}

/**
 * Convert string to OperationName with validation
 *
 * @param value - String to convert
 * @returns OperationName if valid
 * @throws {Error} If validation fails
 */
export function toOperationName(value: string): OperationName {
	if (!isValidOperationName(value)) {
		throw new Error(
			`Invalid operation name: "${value}". Must be a valid JavaScript identifier.`
		)
	}
	return value
}

/**
 * Convert string to SchemaName with validation
 *
 * @param value - String to convert
 * @returns SchemaName if valid
 * @throws {Error} If validation fails
 */
export function toSchemaName(value: string): SchemaName {
	if (!isValidSchemaName(value)) {
		throw new Error(
			`Invalid schema name: "${value}". Must start with uppercase letter.`
		)
	}
	return value
}

/**
 * Utility: Convert branded type back to string
 *
 * @param branded - Any branded string type
 * @returns Plain string
 */
export function unbrand<T extends string>(branded: T): string {
	return branded as string
}
