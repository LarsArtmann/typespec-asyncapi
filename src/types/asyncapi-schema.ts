/**
 * Effect Schema Definitions for AsyncAPI 3.0 Documents
 *
 * Provides runtime validation and compile-time type inference for AsyncAPI documents.
 * Uses Effect Schema for:
 * - Runtime validation with clear error messages
 * - Compile-time type inference
 * - Branded types for type safety
 * - Transformation pipelines
 *
 * @see https://asyncapi.com/docs/reference/specification/v3.0.0
 * @see https://effect.website/docs/schema/introduction
 */

import { Schema } from '@effect/schema'

/**
 * AsyncAPI 3.0.0 version literal
 */
export const AsyncAPIVersionSchema = Schema.Literal('3.0.0').pipe(
	Schema.annotations({
		identifier: 'AsyncAPIVersion',
		description: 'AsyncAPI specification version (must be "3.0.0")',
	})
)

/**
 * Info object schema
 * Contains metadata about the AsyncAPI document
 */
export const InfoSchema = Schema.Struct({
	title: Schema.String.pipe(
		Schema.minLength(1),
		Schema.maxLength(200),
		Schema.annotations({
			description: 'The title of the AsyncAPI document',
		})
	),
	version: Schema.String.pipe(
		Schema.minLength(1),
		Schema.maxLength(50),
		Schema.pattern(/^\d+\.\d+\.\d+$/),
		Schema.annotations({
			description: 'The version of the API (semantic versioning)',
		})
	),
	description: Schema.optional(
		Schema.String.pipe(
			Schema.maxLength(5000),
			Schema.annotations({
				description: 'A description of the AsyncAPI document',
			})
		)
	),
	termsOfService: Schema.optional(
		Schema.String.pipe(
			Schema.pattern(/^https?:\/\/.+/),
			Schema.annotations({
				description: 'A URL to the Terms of Service for the API',
			})
		)
	),
	contact: Schema.optional(
		Schema.Struct({
			name: Schema.optional(Schema.String),
			url: Schema.optional(Schema.String.pipe(Schema.pattern(/^https?:\/\/.+/))),
			email: Schema.optional(Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))),
		})
	),
	license: Schema.optional(
		Schema.Struct({
			name: Schema.String,
			url: Schema.optional(Schema.String.pipe(Schema.pattern(/^https?:\/\/.+/))),
		})
	),
}).pipe(
	Schema.annotations({
		identifier: 'AsyncAPIInfo',
		description: 'Metadata about the AsyncAPI document',
	})
)

/**
 * Reference object schema
 * Used for $ref pointers throughout AsyncAPI
 */
export const ReferenceSchema = Schema.Struct({
	$ref: Schema.String.pipe(
		Schema.pattern(/^#\/.+/),
		Schema.annotations({
			description: 'A reference to another component (must start with #/)',
		})
	),
}).pipe(
	Schema.annotations({
		identifier: 'Reference',
		description: 'Reference to another component in the document',
	})
)

/**
 * JSON Schema object (simplified)
 * Represents a JSON Schema for message payloads
 */
export const JSONSchemaSchema = Schema.Struct({
	type: Schema.optional(Schema.String),
	description: Schema.optional(Schema.String),
	properties: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
	required: Schema.optional(Schema.Array(Schema.String)),
	items: Schema.optional(Schema.Unknown),
	format: Schema.optional(Schema.String),
	enum: Schema.optional(Schema.Array(Schema.Unknown)),
	$ref: Schema.optional(Schema.String),
}).pipe(
	Schema.annotations({
		identifier: 'JSONSchema',
		description: 'JSON Schema for message payloads',
	})
)

/**
 * Message object schema
 * Represents a message that can be sent/received
 */
export const MessageSchema = Schema.Struct({
	name: Schema.optional(Schema.String),
	title: Schema.optional(Schema.String),
	summary: Schema.optional(Schema.String),
	description: Schema.optional(Schema.String),
	contentType: Schema.optional(Schema.String),
	payload: Schema.optional(Schema.Unknown),
	headers: Schema.optional(Schema.Unknown),
	correlationId: Schema.optional(Schema.Unknown),
	tags: Schema.optional(Schema.Array(Schema.Struct({ name: Schema.String }))),
}).pipe(
	Schema.annotations({
		identifier: 'Message',
		description: 'A message that can be sent or received',
	})
)

/**
 * Channel object schema
 * Represents a channel (topic, queue, etc.)
 */
export const ChannelSchema = Schema.Struct({
	address: Schema.String.pipe(
		Schema.minLength(1),
		Schema.annotations({
			description: 'The address of the channel',
		})
	),
	description: Schema.optional(Schema.String),
	messages: Schema.optional(Schema.Record({key: Schema.String, value: Schema.Unknown})),
	servers: Schema.optional(Schema.Array(ReferenceSchema)),
	bindings: Schema.optional(Schema.Unknown),
	tags: Schema.optional(Schema.Array(Schema.Struct({ name: Schema.String }))),
}).pipe(
	Schema.annotations({
		identifier: 'Channel',
		description: 'A channel where messages are sent/received',
	})
)

/**
 * Operation object schema
 * Represents a send or receive operation
 */
export const OperationSchema = Schema.Struct({
	action: Schema.String.pipe(
		Schema.annotations({
			description: 'Whether this operation sends or receives messages',
		})
	),
	channel: Schema.Unknown.pipe(
		Schema.annotations({
			description: 'Reference to the channel this operation uses',
		})
	),
	summary: Schema.optional(Schema.String),
	description: Schema.optional(Schema.String),
	title: Schema.optional(Schema.String),
	messages: Schema.optional(Schema.Array(Schema.Unknown)),
	bindings: Schema.optional(Schema.Unknown),
	tags: Schema.optional(Schema.Array(Schema.Struct({ name: Schema.String }))),
	reply: Schema.optional(Schema.Unknown),
}).pipe(
	Schema.annotations({
		identifier: 'Operation',
		description: 'An operation to send or receive messages',
	})
)

/**
 * Server object schema
 * Represents a server where the API is available
 */
export const ServerSchema = Schema.Struct({
	host: Schema.String.pipe(
		Schema.minLength(1),
		Schema.annotations({
			description: 'The server host (e.g., kafka.example.com:9092)',
		})
	),
	protocol: Schema.String.pipe(
		Schema.minLength(1),
		Schema.annotations({
			description: 'The protocol (e.g., kafka, ws, amqp)',
		})
	),
	protocolVersion: Schema.optional(Schema.String),
	description: Schema.optional(Schema.String),
	variables: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
	security: Schema.optional(Schema.Array(Schema.Unknown)),
	bindings: Schema.optional(Schema.Unknown),
	tags: Schema.optional(Schema.Array(Schema.Struct({ name: Schema.String }))),
}).pipe(
	Schema.annotations({
		identifier: 'Server',
		description: 'A server where the API is available',
	})
)

/**
 * Components object schema
 * Container for reusable components
 */
export const ComponentsSchema = Schema.Struct({
	schemas: Schema.optional(Schema.Record({key: Schema.String, value: Schema.Unknown})),
	messages: Schema.optional(Schema.Record({key: Schema.String, value: Schema.Unknown})),
	securitySchemes: Schema.optional(Schema.Record({key: Schema.String, value: Schema.Unknown})),
	parameters: Schema.optional(Schema.Record({key: Schema.String, value: Schema.Unknown})),
	correlationIds: Schema.optional(Schema.Record({key: Schema.String, value: Schema.Unknown})),
	operationTraits: Schema.optional(Schema.Record({key: Schema.String, value: Schema.Unknown})),
	messageTraits: Schema.optional(Schema.Record({key: Schema.String, value: Schema.Unknown})),
	serverBindings: Schema.optional(Schema.Record({key: Schema.String, value: Schema.Unknown})),
	channelBindings: Schema.optional(Schema.Record({key: Schema.String, value: Schema.Unknown})),
	operationBindings: Schema.optional(Schema.Record({key: Schema.String, value: Schema.Unknown})),
	messageBindings: Schema.optional(Schema.Record({key: Schema.String, value: Schema.Unknown})),
}).pipe(
	Schema.annotations({
		identifier: 'Components',
		description: 'Reusable components for the AsyncAPI document',
	})
)

/**
 * Complete AsyncAPI 3.0.0 document schema
 * Root schema for the entire AsyncAPI document
 */
export const AsyncAPIDocumentSchema = Schema.Struct({
	asyncapi: AsyncAPIVersionSchema,
	info: InfoSchema,
	servers: Schema.optional(Schema.Record({key: Schema.String, value: Schema.Unknown})),
	channels: Schema.optional(Schema.Record({key: Schema.String, value: Schema.Unknown})),
	operations: Schema.optional(Schema.Record({key: Schema.String, value: Schema.Unknown})),
	components: Schema.optional(ComponentsSchema),
}).pipe(
	Schema.annotations({
		identifier: 'AsyncAPIDocument',
		description: 'Complete AsyncAPI 3.0.0 document',
		title: 'AsyncAPI 3.0.0 Document',
	})
)

/**
 * Type inference: Extract TypeScript type from schema
 * This is the compile-time type for AsyncAPI documents
 */
export type AsyncAPIDocument = typeof AsyncAPIDocumentSchema.Type

/**
 * Type inference: Extract input type (before validation)
 * Use this for raw data that needs validation
 */
export type AsyncAPIDocumentInput = typeof AsyncAPIDocumentSchema.Encoded

/**
 * Validation helper functions
 * Note: Actual decoding/validation will be done through test helpers
 * These are type-level definitions primarily
 */
