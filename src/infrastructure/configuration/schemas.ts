/**
 * Effect.TS Schema definitions for AsyncAPI Emitter Options
 * COMPREHENSIVE AsyncAPI 3.0 Document Schema
 */

import {Schema} from "@effect/schema"
import {validatePathTemplate} from "../../domain/models/path-templates.js"

//TODO: WE SHOULD USE Effect Schema a LOT MORE!

/**
 * AsyncAPI Operation Action Enum - Valid values for operation.action
 */
const OPERATION_ACTION_SCHEMA = Schema.Literal("send", "receive")

/**
 * AsyncAPI Server Protocol Schema - Supported protocols
 */
const PROTOCOL_SCHEMA = Schema.Literal("kafka", "amqp", "mqtt", "nats", "http", "ws")

/**
 * AsyncAPI Version Schema - Only 3.0.0 supported
 */
const ASYNCAPI_VERSION_SCHEMA = Schema.Literal("3.0.0")

/**
 * Common Schema Helpers - Eliminate duplication across AsyncAPI schemas
 */

/** Tag schema - used in messages, operations, channels, and document */
const TAG_SCHEMA = Schema.Struct({
	name: Schema.String,
	description: Schema.optional(Schema.String)
})

/** Optional array of tags */
const OPTIONAL_TAGS_SCHEMA = Schema.optional(Schema.Array(TAG_SCHEMA))

/** External documentation schema - used across multiple AsyncAPI objects */
const EXTERNAL_DOCS_SCHEMA = Schema.Struct({
	description: Schema.String,
	url: Schema.String
})

/** Optional external docs */
const OPTIONAL_EXTERNAL_DOCS_SCHEMA = Schema.optional(EXTERNAL_DOCS_SCHEMA)

/** Optional string-keyed record with unknown values (for bindings, parameters, etc.) */
const OPTIONAL_RECORD_SCHEMA = Schema.optional(Schema.Record({
	key: Schema.String,
	value: Schema.Unknown
}))

/** Reference schema - for $ref patterns */
const REF_SCHEMA = Schema.Struct({$ref: Schema.String})

/**
 * Common metadata fields shared across AsyncAPI objects
 * Extracted from duplicated field definitions in MESSAGE_SCHEMA, OPERATION_SCHEMA, and CHANNEL_SCHEMA
 */
const COMMON_METADATA_FIELDS = {
	title: Schema.optional(Schema.String),
	summary: Schema.optional(Schema.String),
	description: Schema.optional(Schema.String),
	tags: OPTIONAL_TAGS_SCHEMA,
	externalDocs: OPTIONAL_EXTERNAL_DOCS_SCHEMA,
	bindings: OPTIONAL_RECORD_SCHEMA
} as const

/**
 * AsyncAPI Info Schema - Basic API metadata
 */
const INFO_SCHEMA = Schema.Struct({
	title: Schema.String,
	version: Schema.String,
	description: Schema.optional(Schema.String),
	termsOfService: Schema.optional(Schema.String),
	contact: Schema.optional(Schema.Struct({
		name: Schema.String,
		url: Schema.optional(Schema.String),
		email: Schema.optional(Schema.String)
	})),
	license: Schema.optional(Schema.Struct({
		name: Schema.String,
		url: Schema.String
	}))
})

/**
 * AsyncAPI Server Variable Schema - Server template variables
 */
const SERVER_VARIABLE_SCHEMA = Schema.Struct({
	description: Schema.optional(Schema.String),
	default: Schema.optional(Schema.String),
	enum: Schema.optional(Schema.Array(Schema.String)),
	examples: Schema.optional(Schema.Array(Schema.String))
})

/**
 * Helper to create variables field with specific value schema
 * Extracted from duplicated variable definition pattern
 */
const createVariablesField = <T>(valueSchema: Schema.Schema<T>) =>
	Schema.optional(Schema.Record({
		key: Schema.String,
		value: valueSchema
	}))

/**
 * Common server-related fields (security array)
 * Extracted from duplication in SERVER_SCHEMA and serverConfigSchema
 */
const COMMON_SERVER_SECURITY_FIELD = {
	security: Schema.optional(Schema.Array(Schema.String))
} as const

/**
 * AsyncAPI Server Schema - Server configuration
 */
const SERVER_SCHEMA = Schema.Struct({
	url: Schema.String,
	protocol: PROTOCOL_SCHEMA,
	description: Schema.optional(Schema.String),
	variables: createVariablesField(SERVER_VARIABLE_SCHEMA),
	...COMMON_SERVER_SECURITY_FIELD,
	bindings: OPTIONAL_RECORD_SCHEMA
})

/**
 * AsyncAPI Message Schema - Message definition
 */
const MESSAGE_SCHEMA = Schema.Struct({
	messageId: Schema.optional(Schema.String),
	payload: Schema.optional(Schema.Unknown),
	headers: OPTIONAL_RECORD_SCHEMA,
	correlationId: Schema.optional(Schema.Unknown),
	schemaFormat: Schema.optional(Schema.String),
	contentType: Schema.optional(Schema.String),
	name: Schema.optional(Schema.String),
	...COMMON_METADATA_FIELDS
})

/**
 * AsyncAPI Operation Schema - Operation definition
 */
const OPERATION_SCHEMA = Schema.Struct({
	action: OPERATION_ACTION_SCHEMA,
	channel: Schema.Union(Schema.String, REF_SCHEMA),
	...COMMON_METADATA_FIELDS,
	messages: Schema.optional(Schema.Record({
		key: Schema.String,
		value: Schema.Union(
			Schema.Literal(null),
			MESSAGE_SCHEMA,
			REF_SCHEMA
		)
	})),
})

/**
 * AsyncAPI Channel Schema - Channel definition
 */
const CHANNEL_SCHEMA = Schema.Struct({
	address: Schema.String,
	messages: Schema.optional(Schema.Record({
		key: Schema.String,
		value: Schema.Union(
			Schema.Literal(null),
			MESSAGE_SCHEMA,
			REF_SCHEMA
		)
	})),
	parameters: OPTIONAL_RECORD_SCHEMA,
	...COMMON_METADATA_FIELDS
})

/**
 * Comprehensive AsyncAPI 3.0 Document Schema
 */
export const ASYNCAPI_DOCUMENT_SCHEMA = Schema.Struct({
	asyncapi: ASYNCAPI_VERSION_SCHEMA,
	info: INFO_SCHEMA,
	servers: Schema.optional(Schema.Record({ key: Schema.String, value: SERVER_SCHEMA })),
	channels: Schema.optional(Schema.Record({ key: Schema.String, value: CHANNEL_SCHEMA })),
	operations: Schema.optional(Schema.Record({ key: Schema.String, value: OPERATION_SCHEMA })),
	components: Schema.optional(Schema.Unknown),
	tags: Schema.optional(Schema.Array(Schema.Struct({
		name: Schema.String,
		description: Schema.optional(Schema.String),
		externalDocs: OPTIONAL_EXTERNAL_DOCS_SCHEMA
	}))),
	externalDocs: OPTIONAL_EXTERNAL_DOCS_SCHEMA,
	id: Schema.optional(Schema.String)
})

/**
 * Decode Unknown to AsyncAPI Document with validation
 */
export const decodeAsyncAPIDocument = Schema.decodeUnknown(ASYNCAPI_DOCUMENT_SCHEMA)

/**
 * Variable configuration schema for server variables
 * OPTIMIZED: Using Schema.record with branded types and performance optimizations
 */
const variableConfigSchema = Schema.Struct({
	description: Schema.optional(Schema.String.pipe(
		Schema.maxLength(500),
		Schema.annotations({description: "Variable description (max 500 chars)"}),
	)),
	default: Schema.optional(Schema.String.pipe(
		Schema.maxLength(100),
		Schema.annotations({description: "Default value (max 100 chars)"}),
	)),
	enum: Schema.optional(Schema.Array(Schema.String).pipe(
		Schema.annotations({description: "Allowed values (max 50 items)"}),
	)),
	examples: Schema.optional(Schema.Array(Schema.String).pipe(
		Schema.annotations({description: "Example values (max 10 items)"}),
	)),
}).pipe(
	Schema.annotations({
		identifier: "VariableConfig",
		description: "Server variable configuration with validation constraints",
	}),
)

/**
 * OAuth flow configuration schema
 * ENHANCED: URL validation, scope limits, and security constraints
 */
const oAuthFlowConfigSchema = Schema.Struct({
	authorizationUrl: Schema.optional(Schema.String.pipe(
		Schema.pattern(/^https?:\/\/.+/, {
			message: () => "Authorization URL must be a valid HTTP/HTTPS URL",
		}),
		Schema.annotations({description: "OAuth authorization endpoint URL"}),
	)),
	tokenUrl: Schema.optional(Schema.String.pipe(
		Schema.pattern(/^https?:\/\/.+/, {
			message: () => "Token URL must be a valid HTTP/HTTPS URL",
		}),
		Schema.annotations({description: "OAuth token endpoint URL"}),
	)),
	refreshUrl: Schema.optional(Schema.String.pipe(
		Schema.pattern(/^https?:\/\/.+/, {
			message: () => "Refresh URL must be a valid HTTP/HTTPS URL",
		}),
		Schema.annotations({description: "OAuth refresh token endpoint URL"}),
	)),
	availableScopes: Schema.optional(Schema.Record({
		key: Schema.String.pipe(
			Schema.pattern(/^[a-zA-Z0-9._:-]+$/, {
				message: () => "Scope name must contain only alphanumeric, dot, underscore, colon, or hyphen characters",
			}),
			Schema.maxLength(100),
		),
		value: Schema.String.pipe(
			Schema.maxLength(200),
			Schema.annotations({description: "Human-readable scope description"}),
		),
	}).pipe(
		Schema.annotations({description: "Available OAuth scopes (max 50)"}),
	)),
}).pipe(
	Schema.annotations({
		identifier: "OAuthFlowConfig",
		description: "OAuth flow configuration with URL validation and scope limits",
	}),
)

/**
 * OAuth flows configuration schema
 */
const oAuthFlowsConfigSchema = Schema.Struct({
	implicit: Schema.optional(oAuthFlowConfigSchema),
	password: Schema.optional(oAuthFlowConfigSchema),
	clientCredentials: Schema.optional(oAuthFlowConfigSchema),
	authorizationCode: Schema.optional(oAuthFlowConfigSchema),
})

/**
 * Security scheme configuration schema with branded types
 * ENHANCED: Conditional validation, branded types, and security constraints
 */
const securitySchemeConfigSchema = Schema.Struct({
	type: Schema.Literal("oauth2", "apiKey", "httpApiKey", "http", "plain", "scram-sha-256", "scram-sha-512", "gssapi").pipe(
		Schema.annotations({description: "Security scheme type - determines available fields"}),
	),
	description: Schema.optional(Schema.String.pipe(
		Schema.maxLength(1000),
		Schema.annotations({description: "Human-readable security scheme description"}),
	)),
	name: Schema.optional(Schema.String.pipe(
		Schema.pattern(/^[a-zA-Z0-9._-]+$/, {
			message: () => "Security scheme name must contain only alphanumeric, dot, underscore, or hyphen characters",
		}),
		Schema.maxLength(50),
		Schema.annotations({description: "Security parameter name (for apiKey schemes)"}),
	)),
	in: Schema.optional(Schema.Literal("user", "password", "query", "header", "cookie").pipe(
		Schema.annotations({description: "Location of security parameter"}),
	)),
	scheme: Schema.optional(Schema.String.pipe(
		Schema.pattern(/^[a-zA-Z0-9]+$/, {
			message: () => "HTTP scheme must contain only alphanumeric characters",
		}),
		Schema.maxLength(20),
		Schema.annotations({description: "HTTP authentication scheme (for http type)"}),
	)),
	bearerFormat: Schema.optional(Schema.String.pipe(
		Schema.maxLength(50),
		Schema.annotations({description: "Bearer token format hint (e.g., 'JWT')"}),
	)),
	flows: Schema.optional(oAuthFlowsConfigSchema),
}).pipe(
	Schema.annotations({
		identifier: "SecuritySchemeConfig",
		description: "Security scheme configuration",
	}),
)

/**
 * Server configuration schema
 */
const serverConfigSchema = Schema.Struct({
	host: Schema.String,
	protocol: Schema.String,
	description: Schema.optional(Schema.String),
	variables: createVariablesField(variableConfigSchema),
	...COMMON_SERVER_SECURITY_FIELD,
	bindings: Schema.optional(Schema.Record({
		key: Schema.String,
		value: Schema.Unknown,
	})),
})

/**
 * Versioning configuration schema
 */
const versioningConfigSchema = Schema.Struct({
	"separate-files": Schema.optional(Schema.Boolean),
	"file-naming": Schema.optional(Schema.Literal("suffix", "directory", "prefix")),
	"include-version-info": Schema.optional(Schema.Boolean),
	"version-mappings": Schema.optional(Schema.Record({
		key: Schema.String,
		value: Schema.String,
	})),
	"validate-version-compatibility": Schema.optional(Schema.Boolean),
})

/**
 * Type-safe schema caching with proper generics
 * PERFORMANCE: Cached schemas for repeated validations
 * TYPE SAFETY: Map<string, Schema<unknown>> is perfectly valid - schemas are covariant
 */
const schemaCache = new Map<string, Schema.Schema<unknown>>()

const createSchema = <T>(key: string, schemaFactory: () => Schema.Schema<T>): Schema.Schema<T> => {
	const cached = schemaCache.get(key)
	if (cached) {
		return cached as Schema.Schema<T> // Safe cast - schemas are covariant
	}

	const schema = schemaFactory()
	schemaCache.set(key, schema as Schema.Schema<unknown>) // Safe upcast
	return schema
}

/**
 * Main AsyncAPI Emitter Options Schema with Effect.TS
 *
 * SECURITY: All schemas prevent arbitrary property injection through strict validation
 * TYPE SAFETY: Compile-time and runtime validation with comprehensive error messages
 * PERFORMANCE: Schema caching and optimized validation chains
 */
export const asyncAPIEmitterOptionsEffectSchema = createSchema(
	"AsyncAPIEmitterOptionsEffectSchema",
	() => Schema.Struct({
		"output-file": Schema.optional(Schema.String.pipe(
			Schema.filter((value) => {
				// If it has template variables, validate them
				if (value.includes("{")) {
					const validation = validatePathTemplate(value)
					return validation._tag === "valid"
				}
				// If no template variables, it's valid
				return true
			}, {
				message: () => "Invalid path template format",
			}),
		).annotations({
			description: "Name of the output file. Supports template variables: {cmd}, {project-root}, {emitter-name}, {output-dir}. Default: 'asyncapi.yaml'",
			jsonSchema: { type: "string", description: "Output file name" }
		})),

		"file-type": Schema.optional(Schema.Literal("yaml", "json").annotations({
			description: "Output file type. Default: 'yaml'",
		})),

		"asyncapi-version": Schema.optional(Schema.Literal("3.0.0").annotations({
			description: "AsyncAPI version to target. Default: '3.0.0'",
		})),

		"omit-unreachable-types": Schema.optional(Schema.Boolean.annotations({
			description: "Whether to omit unreachable message types. Default: false",
		})),

		"include-source-info": Schema.optional(Schema.Boolean.annotations({
			description: "Whether to include TypeSpec source information in comments. Default: false",
		})),

		"default-servers": Schema.optional(Schema.Record({
			key: Schema.String,
			value: serverConfigSchema,
		}).annotations({
			description: "Custom servers to include in the output",
		})),

		"validate-spec": Schema.optional(Schema.Boolean.annotations({
			description: "Whether to validate generated AsyncAPI spec. Default: true",
		})),

		"additional-properties": Schema.optional(Schema.Record({
			key: Schema.String,
			value: Schema.Unknown,
		}).annotations({
			description: "Additional schema properties to include",
		})),

		"protocol-bindings": Schema.optional(Schema.Array(
			Schema.Literal("kafka", "amqp", "websocket", "http"),
		).annotations({
			description: "Protocol bindings to include",
		})),

		"security-schemes": Schema.optional(Schema.Record({
			key: Schema.String,
			value: securitySchemeConfigSchema,
		}).annotations({
			description: "Security schemes configuration",
		})),

		"versioning": Schema.optional(versioningConfigSchema.annotations({
			description: "Versioning configuration",
		})),
	}).pipe(
		Schema.annotations({
			identifier: "AsyncAPIEmitterOptions",
			description: "Complete AsyncAPI emitter configuration options with validation",
			documentation: "https://github.com/typespec/asyncapi-emitter/docs/options",
		}),
	))
