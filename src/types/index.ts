/**
 * SINGLE SOURCE OF TRUTH: AsyncAPI 3.0 Type Definitions
 *
 * This file consolidates ALL AsyncAPI type definitions used throughout the codebase.
 * It serves as the centralized type system to eliminate schema split-brain syndrome.
 *
 * Based on AsyncAPI 3.0.0 specification:
 * https://www.asyncapi.com/docs/reference/specification/v3.0.0
 */

// ==========================================
// CORE ASYNCAPI 3.0 DOCUMENT STRUCTURE
// ==========================================

//TODO: this file is getting to big, it there not TypeScript lib that already has all this for us that we can just use???


/**
 * Root AsyncAPI 3.0 Document
 * The foundation of all AsyncAPI specifications
 */
export type AsyncAPIDocument = {
	/** AsyncAPI specification version (must be 3.0.0) */
	asyncapi: "3.0.0";

	/** Unique identifier for the AsyncAPI document */
	id?: string;

	/** General information about the API */
	info: InfoObject;

	/** Default server for the API (optional in 3.0) */
	defaultContentType?: string;

	/** Available servers for this API */
	servers?: Record<string, ServerObject>;

	/** Available channels for this API */
	channels?: Record<string, ChannelObject>;

	/** Available operations for this API */
	operations?: Record<string, OperationObject>;

	/** Reusable components for the specification */
	components?: ComponentsObject;
}

/**
 * General information about the API
 */
export type InfoObject = {
	/** Title of the API */
	title: string;

	/** Version of the API */
	version: string;

	/** Description of the API */
	description?: string;

	/** Terms of service for the API */
	termsOfService?: string;

	/** Contact information for the API */
	contact?: ContactObject;

	/** License information for the API */
	license?: LicenseObject;

	/** Additional tags for the API */
	tags?: TagObject[];

	/** Additional external documentation */
	externalDocs?: ExternalDocumentationObject;
}

/**
 * Contact information for the API
 */
export type ContactObject = {
	/** Contact name */
	name?: string;

	/** Contact URL */
	url?: string;

	/** Contact email */
	email?: string;
}

/**
 * License information for the API
 */
export type LicenseObject = {
	/** License name */
	name: string;

	/** License URL */
	url?: string;

	/** License identifier from SPDX */
	identifier?: string;
}

/**
 * Tag metadata
 */
export type TagObject = {
	/** Tag name */
	name: string;

	/** Tag description */
	description?: string;

	/** Additional external documentation */
	externalDocs?: ExternalDocumentationObject;
}

/**
 * External documentation reference
 */
export type ExternalDocumentationObject = {
	/** Documentation description */
	description?: string;

	/** Documentation URL */
	url: string;
}

// ==========================================
// SERVER OBJECTS
// ==========================================

/**
 * Server configuration
 */
export type ServerObject = {
	/** Server hostname */
	host: string;

	/** Communication protocol */
	protocol: string;

	/** Protocol version */
	protocolVersion?: string;

	/** Path segment for the server URL */
	pathname?: string;

	/** Server description */
	description?: string;

	/** Server title */
	title?: string;

	/** Server summary */
	summary?: string;

	/** Variable substitutions for the server */
	variables?: Record<string, ServerVariableObject>;

	/** Security requirements for the server */
	security?: SecurityRequirementObject[];

	/** Tags for grouping servers */
	tags?: TagObject[];

	/** Additional external documentation */
	externalDocs?: ExternalDocumentationObject;

	/** Protocol-specific bindings */
	bindings?: ServerBindingsObject | ReferenceObject;
}

/**
 * Server variable for URL templating
 */
export type ServerVariableObject = {
	/** Enumeration of possible values */
	enum?: string[];

	/** Default value */
	default?: string;

	/** Variable description */
	description?: string;

	/** Example values */
	examples?: string[];
}

// ==========================================
// CHANNEL OBJECTS
// ==========================================

/**
 * Communication channel configuration
 */
export type ChannelObject = {
	/** Channel address/topic name */
	address?: string;

	/** Available messages on this channel */
	messages?: Record<string, MessageObject | ReferenceObject>;

	/** Channel title */
	title?: string;

	/** Channel summary */
	summary?: string;

	/** Channel description */
	description?: string;

	/** Servers where this channel is available */
	servers?: (ServerObject | ReferenceObject)[];

	/** Channel parameters */
	parameters?: Record<string, ParameterObject | ReferenceObject>;

	/** Tags for grouping channels */
	tags?: TagObject[];

	/** Additional external documentation */
	externalDocs?: ExternalDocumentationObject;

	/** Protocol-specific bindings */
	bindings?: ChannelBindingsObject | ReferenceObject;
}

// ==========================================
// OPERATION OBJECTS
// ==========================================

/**
 * Operation performed on a channel
 */
export type OperationObject = {
	/** Type of operation (send/receive) */
	action: "send" | "receive";

	/** Reference to the channel */
	channel?: ChannelObject | ReferenceObject;

	/** Operation title */
	title?: string;

	/** Operation summary */
	summary?: string;

	/** Operation description */
	description?: string;

	/** Security requirements for the operation */
	security?: SecurityRequirementObject[];

	/** Tags for grouping operations */
	tags?: TagObject[];

	/** Additional external documentation */
	externalDocs?: ExternalDocumentationObject;

	/** Protocol-specific bindings */
	bindings?: OperationBindingsObject | ReferenceObject;

	/** Operation traits to apply */
	traits?: (OperationTraitObject | ReferenceObject)[];

	/** Messages for this operation */
	messages?: (MessageObject | ReferenceObject)[];

	/** Reply configuration for request/reply pattern */
	reply?: OperationReplyObject | ReferenceObject;
}

/**
 * Operation reply configuration
 */
export type OperationReplyObject = {
	/** Reply address */
	address?: OperationReplyAddressObject | ReferenceObject;

	/** Reference to the channel for replies */
	channel?: ChannelObject | ReferenceObject;

	/** Available reply messages */
	messages?: (MessageObject | ReferenceObject)[];
}

/**
 * Operation reply address configuration
 */
export type OperationReplyAddressObject = {
	/** Reply address description */
	description?: string;

	/** Runtime expression for the reply address */
	location: string;
}

/**
 * Reusable operation configuration
 */
export type OperationTraitObject = {
	/** Operation title */
	title?: string;

	/** Operation summary */
	summary?: string;

	/** Operation description */
	description?: string;

	/** Security requirements */
	security?: SecurityRequirementObject[];

	/** Operation tags */
	tags?: TagObject[];

	/** External documentation */
	externalDocs?: ExternalDocumentationObject;

	/** Protocol bindings */
	bindings?: OperationBindingsObject | ReferenceObject;
}

// ==========================================
// MESSAGE OBJECTS
// ==========================================

/**
 * Message configuration
 */
export type MessageObject = {
	/** Message headers schema */
	headers?: SchemaObject | ReferenceObject;

	/** Message payload schema */
	payload?: SchemaObject | ReferenceObject;

	/** Correlation ID for message tracking */
	correlationId?: CorrelationIdObject | ReferenceObject;

	/** Schema format identifier */
	schemaFormat?: string;

	/** Message content type */
	contentType?: string;

	/** Message name */
	name?: string;

	/** Message title */
	title?: string;

	/** Message summary */
	summary?: string;

	/** Message description */
	description?: string;

	/** Message tags */
	tags?: TagObject[];

	/** External documentation */
	externalDocs?: ExternalDocumentationObject;

	/** Protocol bindings */
	bindings?: MessageBindingsObject | ReferenceObject;

	/** Message examples */
	examples?: MessageExampleObject[];

	/** Message traits */
	traits?: (MessageTraitObject | ReferenceObject)[];
}

/**
 * Message example
 */
export type MessageExampleObject = {
	/** Example headers */
	headers?: Record<string, unknown>;

	/** Example payload */
	payload?: unknown;

	/** Example name */
	name?: string;

	/** Example summary */
	summary?: string;
}

/**
 * Reusable message configuration
 */
export type MessageTraitObject = {
	/** Message headers schema */
	headers?: SchemaObject | ReferenceObject;

	/** Correlation ID */
	correlationId?: CorrelationIdObject | ReferenceObject;

	/** Schema format */
	schemaFormat?: string;

	/** Content type */
	contentType?: string;

	/** Message name */
	name?: string;

	/** Message title */
	title?: string;

	/** Message summary */
	summary?: string;

	/** Message description */
	description?: string;

	/** Message tags */
	tags?: TagObject[];

	/** External documentation */
	externalDocs?: ExternalDocumentationObject;

	/** Protocol bindings */
	bindings?: MessageBindingsObject | ReferenceObject;

	/** Message examples */
	examples?: MessageExampleObject[];
}

/**
 * Correlation ID configuration for message tracking
 */
export type CorrelationIdObject = {
	/** Runtime expression for correlation ID */
	location: string;

	/** Correlation ID description */
	description?: string;
}

// ==========================================
// SCHEMA OBJECTS (JSON Schema Draft 7 + AsyncAPI extensions)
// ==========================================

/**
 * JSON Schema object for AsyncAPI specifications
 * Based on JSON Schema Draft 7 with AsyncAPI-specific extensions
 */
export type SchemaObject = {
	// Core JSON Schema properties
	type?: "null" | "boolean" | "object" | "array" | "number" | "string" | "integer";
	properties?: Record<string, SchemaObject>;
	items?: SchemaObject | SchemaObject[];
	required?: string[];
	additionalProperties?: boolean | SchemaObject;

	// String validation
	maxLength?: number;
	minLength?: number;
	pattern?: string;
	format?: string;

	// Numeric validation
	minimum?: number;
	maximum?: number;
	exclusiveMinimum?: number;
	exclusiveMaximum?: number;
	multipleOf?: number;

	// Array validation
	maxItems?: number;
	minItems?: number;
	uniqueItems?: boolean;

	// Object validation
	maxProperties?: number;
	minProperties?: number;

	// Generic validation
	enum?: unknown[];
	const?: unknown;

	// Schema composition
	allOf?: SchemaObject[];
	anyOf?: SchemaObject[];
	oneOf?: SchemaObject[];
	not?: SchemaObject;

	// Conditional schemas
	if?: SchemaObject;
	then?: SchemaObject;
	else?: SchemaObject;

	// Metadata
	title?: string;
	description?: string;
	default?: unknown;
	examples?: unknown[];

	// AsyncAPI-specific extensions
	discriminator?: string;
	readOnly?: boolean;
	writeOnly?: boolean;
	deprecated?: boolean;
}

// ==========================================
// PARAMETER OBJECTS
// ==========================================

/**
 * Parameter object for channels and operations
 */
export type ParameterObject = {
	/** Parameter description */
	description?: string;

	/** Parameter schema */
	schema?: SchemaObject | ReferenceObject;

	/** Parameter location in the channel address */
	location?: string;

	/** Parameter enumeration */
	enum?: string[];

	/** Default parameter value */
	default?: string;

	/** Parameter examples */
	examples?: string[];
}

// ==========================================
// SECURITY OBJECTS
// ==========================================

/**
 * Security requirement for operations
 */
export type SecurityRequirementObject = {
	[name: string]: string[];
}

/**
 * Security scheme definition
 */
export type SecuritySchemeObject = {
	/** Security scheme type */
	type: "userPassword" | "apiKey" | "X509" | "symmetricEncryption" | "asymmetricEncryption" |
		"httpApiKey" | "http" | "oauth2" | "openIdConnect" | "plain" | "scram-sha-256" |
		"scram-sha-512" | "gssapi";

	/** Security scheme description */
	description?: string;
}

/**
 * API Key security scheme
 */
export type ApiKeySecurityScheme = {
	type: "apiKey";
	/** Location of the API key */
	in: "user" | "password";
} & SecuritySchemeObject

/**
 * HTTP API Key security scheme
 */
export type HttpApiKeySecurityScheme = {
	type: "httpApiKey";
	/** HTTP header name */
	name: string;
	/** Location of the key */
	in: "header" | "query" | "cookie";
} & SecuritySchemeObject

/**
 * HTTP security scheme
 */
export type HttpSecurityScheme = {
	type: "http";
	/** HTTP scheme */
	scheme: string;
	/** Bearer format (if scheme is bearer) */
	bearerFormat?: string;
} & SecuritySchemeObject

/**
 * OAuth2 security scheme
 */
export type OAuth2SecurityScheme = {
	type: "oauth2";
	/** OAuth2 flows */
	flows: OAuth2FlowsObject;
} & SecuritySchemeObject

/**
 * OAuth2 flows configuration
 */
export type OAuth2FlowsObject = {
	/** Implicit flow */
	implicit?: OAuth2FlowObject;
	/** Password flow */
	password?: OAuth2FlowObject;
	/** Client credentials flow */
	clientCredentials?: OAuth2FlowObject;
	/** Authorization code flow */
	authorizationCode?: OAuth2FlowObject;
}

/**
 * OAuth2 flow configuration
 */
export type OAuth2FlowObject = {
	/** Authorization URL (for implicit and authorizationCode flows) */
	authorizationUrl?: string;
	/** Token URL */
	tokenUrl?: string;
	/** Refresh URL */
	refreshUrl?: string;
	/** Available scopes */
	scopes: Record<string, string>;
}

/**
 * OpenID Connect security scheme
 */
export type OpenIdConnectSecurityScheme = {
	type: "openIdConnect";
	/** OpenID Connect URL */
	openIdConnectUrl: string;
} & SecuritySchemeObject

// ==========================================
// COMPONENTS OBJECT
// ==========================================

/**
 * Reusable components for the AsyncAPI specification
 */
export type ComponentsObject = {
	/** Reusable schemas */
	schemas?: Record<string, SchemaObject | ReferenceObject>;

	/** Reusable servers */
	servers?: Record<string, ServerObject | ReferenceObject>;

	/** Reusable channels */
	channels?: Record<string, ChannelObject | ReferenceObject>;

	/** Reusable operations */
	operations?: Record<string, OperationObject | ReferenceObject>;

	/** Reusable messages */
	messages?: Record<string, MessageObject | ReferenceObject>;

	/** Reusable security schemes */
	securitySchemes?: Record<string, SecuritySchemeObject | ReferenceObject>;

	/** Reusable parameters */
	parameters?: Record<string, ParameterObject | ReferenceObject>;

	/** Reusable correlation IDs */
	correlationIds?: Record<string, CorrelationIdObject | ReferenceObject>;

	/** Reusable operation replies */
	replies?: Record<string, OperationReplyObject | ReferenceObject>;

	/** Reusable reply addresses */
	replyAddresses?: Record<string, OperationReplyAddressObject | ReferenceObject>;

	/** Reusable external documentation */
	externalDocs?: Record<string, ExternalDocumentationObject | ReferenceObject>;

	/** Reusable tags */
	tags?: Record<string, TagObject | ReferenceObject>;

	/** Reusable operation traits */
	operationTraits?: Record<string, OperationTraitObject | ReferenceObject>;

	/** Reusable message traits */
	messageTraits?: Record<string, MessageTraitObject | ReferenceObject>;

	/** Reusable server bindings */
	serverBindings?: Record<string, ServerBindingsObject | ReferenceObject>;

	/** Reusable channel bindings */
	channelBindings?: Record<string, ChannelBindingsObject | ReferenceObject>;

	/** Reusable operation bindings */
	operationBindings?: Record<string, OperationBindingsObject | ReferenceObject>;

	/** Reusable message bindings */
	messageBindings?: Record<string, MessageBindingsObject | ReferenceObject>;
}

// ==========================================
// REFERENCE OBJECT
// ==========================================

/**
 * Reference to another component
 */
export type ReferenceObject = {
	/** Reference URI */
	$ref: string;
}

// ==========================================
// PROTOCOL BINDINGS
// ==========================================

/**
 * Server bindings for different protocols
 */
export type ServerBindingsObject = {
	/** HTTP server bindings */
	http?: Record<string, unknown>;

	/** WebSocket server bindings */
	ws?: Record<string, unknown>;

	/** Kafka server bindings */
	kafka?: Record<string, unknown>;

	/** AMQP server bindings */
	amqp?: Record<string, unknown>;

	/** AMQP 1.0 server bindings */
	amqp1?: Record<string, unknown>;

	/** MQTT server bindings */
	mqtt?: Record<string, unknown>;

	/** MQTT 5 server bindings */
	mqtt5?: Record<string, unknown>;

	/** NATS server bindings */
	nats?: Record<string, unknown>;

	/** JMS server bindings */
	jms?: Record<string, unknown>;

	/** SNS server bindings */
	sns?: Record<string, unknown>;

	/** SQS server bindings */
	sqs?: Record<string, unknown>;

	/** Solace server bindings */
	solace?: Record<string, unknown>;

	/** Redis server bindings */
	redis?: Record<string, unknown>;
}

/**
 * Channel bindings for different protocols
 */
export type ChannelBindingsObject = {
	/** HTTP channel bindings */
	http?: Record<string, unknown>;

	/** WebSocket channel bindings */
	ws?: Record<string, unknown>;

	/** Kafka channel bindings */
	kafka?: KafkaChannelBindingObject;

	/** AMQP channel bindings */
	amqp?: Record<string, unknown>;

	/** AMQP 1.0 channel bindings */
	amqp1?: Record<string, unknown>;

	/** MQTT channel bindings */
	mqtt?: Record<string, unknown>;

	/** MQTT 5 channel bindings */
	mqtt5?: Record<string, unknown>;

	/** NATS channel bindings */
	nats?: Record<string, unknown>;

	/** JMS channel bindings */
	jms?: Record<string, unknown>;

	/** SNS channel bindings */
	sns?: Record<string, unknown>;

	/** SQS channel bindings */
	sqs?: Record<string, unknown>;

	/** Solace channel bindings */
	solace?: Record<string, unknown>;

	/** Redis channel bindings */
	redis?: Record<string, unknown>;
}

/**
 * Operation bindings for different protocols
 */
export type OperationBindingsObject = {
	/** HTTP operation bindings */
	http?: Record<string, unknown>;

	/** WebSocket operation bindings */
	ws?: Record<string, unknown>;

	/** Kafka operation bindings */
	kafka?: KafkaOperationBindingObject;

	/** AMQP operation bindings */
	amqp?: Record<string, unknown>;

	/** AMQP 1.0 operation bindings */
	amqp1?: Record<string, unknown>;

	/** MQTT operation bindings */
	mqtt?: Record<string, unknown>;

	/** MQTT 5 operation bindings */
	mqtt5?: Record<string, unknown>;

	/** NATS operation bindings */
	nats?: Record<string, unknown>;

	/** JMS operation bindings */
	jms?: Record<string, unknown>;

	/** SNS operation bindings */
	sns?: Record<string, unknown>;

	/** SQS operation bindings */
	sqs?: Record<string, unknown>;

	/** Solace operation bindings */
	solace?: Record<string, unknown>;

	/** Redis operation bindings */
	redis?: Record<string, unknown>;
}

/**
 * Message bindings for different protocols
 */
export type MessageBindingsObject = {
	/** HTTP message bindings */
	http?: Record<string, unknown>;

	/** WebSocket message bindings */
	ws?: Record<string, unknown>;

	/** Kafka message bindings */
	kafka?: KafkaMessageBindingObject;

	/** AMQP message bindings */
	amqp?: Record<string, unknown>;

	/** AMQP 1.0 message bindings */
	amqp1?: Record<string, unknown>;

	/** MQTT message bindings */
	mqtt?: Record<string, unknown>;

	/** MQTT 5 message bindings */
	mqtt5?: Record<string, unknown>;

	/** NATS message bindings */
	nats?: Record<string, unknown>;

	/** JMS message bindings */
	jms?: Record<string, unknown>;

	/** SNS message bindings */
	sns?: Record<string, unknown>;

	/** SQS message bindings */
	sqs?: Record<string, unknown>;

	/** Solace message bindings */
	solace?: Record<string, unknown>;

	/** Redis message bindings */
	redis?: Record<string, unknown>;
}

// ==========================================
// KAFKA-SPECIFIC BINDING OBJECTS
// ==========================================

/**
 * Kafka field configuration for protocol bindings
 */
export type KafkaFieldConfig = {
	/** Field type */
	type: string;

	/** Field description */
	description?: string;

	/** Default value */
	default?: unknown;

	/** Enumeration values */
	enum?: unknown[];

	/** Field format */
	format?: string;
}

/**
 * Kafka channel binding
 */
export type KafkaChannelBindingObject = {
	/** Kafka topic name */
	topic?: string;

	/** Number of partitions */
	partitions?: number;

	/** Number of replicas */
	replicas?: number;

	/** Topic configuration */
	configs?: Record<string, string>;

	/** Binding version */
	bindingVersion?: string;
}

/**
 * Kafka operation binding
 */
export type KafkaOperationBindingObject = {
	/** Consumer group ID */
	groupId?: KafkaFieldConfig | SchemaObject;

	/** Client ID */
	clientId?: KafkaFieldConfig | SchemaObject;

	/** Binding version */
	bindingVersion?: string;
}

/**
 * Kafka message binding
 */
export type KafkaMessageBindingObject = {
	/** Message key schema */
	key?: KafkaFieldConfig | SchemaObject | ReferenceObject;

	/** Schema ID location */
	schemaIdLocation?: "payload" | "header";

	/** Schema ID payload encoding */
	schemaIdPayloadEncoding?: string;

	/** Schema lookup strategy */
	schemaLookupStrategy?: "TopicIdStrategy" | "RecordIdStrategy" | "TopicRecordIdStrategy";

	/** Binding version */
	bindingVersion?: string;
}

// ==========================================
// UTILITY TYPES
// ==========================================

/**
 * Union type of all security scheme objects
 */
export type SecurityScheme =
	| ApiKeySecurityScheme
	| HttpApiKeySecurityScheme
	| HttpSecurityScheme
	| OAuth2SecurityScheme
	| OpenIdConnectSecurityScheme
	| SecuritySchemeObject;

/**
 * Type guard to check if an object is a valid AsyncAPI document
 */
export function isAsyncAPIDocument(obj: unknown): obj is AsyncAPIDocument {
	return (
		obj !== null &&
		typeof obj === "object" &&
		"asyncapi" in obj &&
		(obj as { asyncapi: unknown }).asyncapi === "3.0.0" &&
		"info" in obj &&
		typeof (obj as { info: unknown }).info === "object" &&
		"title" in (obj as { info: { title?: unknown } }).info &&
		"version" in (obj as { info: { version?: unknown } }).info
	)
}

/**
 * Type guard to check if an object is a reference object
 */
export function isReferenceObject(obj: unknown): obj is ReferenceObject {
	return (
		obj !== null &&
		typeof obj === "object" &&
		"$ref" in obj &&
		typeof (obj as { $ref: unknown }).$ref === "string"
	)
}

// ==========================================
// RE-EXPORTS FOR COMPATIBILITY
// ==========================================

// Export legacy type names for backward compatibility
export type {SchemaObject as AsyncAPISchema}
export type {MessageObject as AsyncAPIMessage}
export type {ChannelObject as AsyncAPIChannel}
export type {OperationObject as AsyncAPIOperation}
export type {AsyncAPIDocument as AsyncAPIDocumentType}

// All interfaces are already exported through their individual declarations above
// No need for redundant export statements