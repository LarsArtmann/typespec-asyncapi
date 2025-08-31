/**
 * OFFICIAL AsyncAPI 3.0 Type Definitions
 * 
 * REPLACED CUSTOM TYPES WITH OFFICIAL @asyncapi/parser TYPES!
 * 
 * This file now imports the official AsyncAPI 3.0 TypeScript types
 * from @asyncapi/parser instead of maintaining our own 1,028-line
 * custom type definitions.
 * 
 * Benefits:
 * - ✅ Eliminates 1,028 lines of custom type definitions
 * - ✅ Uses officially maintained types from AsyncAPI team
 * - ✅ Automatically stays up-to-date with AsyncAPI spec changes
 * - ✅ Reduces maintenance burden and potential type bugs
 * - ✅ Ensures 100% compliance with AsyncAPI 3.0 specification
 * 
 * Source: @asyncapi/parser v3.4.0
 * Spec: AsyncAPI 3.0.0 specification
 */

// Import and re-export official AsyncAPI 3.0 types in single statement
export type {
	// Core Document Types
	AsyncAPIObject,
	InfoObject,
	ContactObject,
	LicenseObject,
	
	// Server Types
	ServersObject,
	ServerObject,
	ServerVariableObject,
	ServerBindingsObject,
	
	// Channel Types
	ChannelsObject,
	ChannelObject,
	ChannelBindingsObject,
	
	// Operation Types
	OperationsObject,
	OperationObject,
	OperationTraitObject,
	OperationReplyObject,
	OperationReplyAddressObject,
	OperationBindingsObject,
	
	// Message Types
	MessagesObject,
	MessageObject,
	MessageTraitObject,
	MessageExampleObject,
	MessageBindingsObject,
	
	// Component Types
	ComponentsObject,
	
	// Schema Types
	SchemaObject,
	AsyncAPISchemaObject,
	AsyncAPISchemaDefinition,
	MultiFormatSchemaObject,
	MultiFormatObject,
	
	// Security Types
	SecuritySchemeObject,
	
	// Parameter Types
	ParameterObject,
	ParametersObject,
	
	// Common Types
	ReferenceObject,
	TagObject,
	TagsObject,
	ExternalDocumentationObject,
	CorrelationIDObject,
	Binding,
	SpecificationExtensions,
	SpecificationExtension,
	
	// Utility Types
	AsyncAPIVersion,
	Identifier,
	DefaultContentType,
} from '@asyncapi/parser/esm/spec-types/v3';

// Import specific types for aliases (separate import to avoid conflicts)
import type { 
	AsyncAPIObject as ImportedAsyncAPIObject, 
	ChannelObject as ImportedChannelObject, 
	OperationObject as ImportedOperationObject, 
	MessageObject as ImportedMessageObject, 
	AsyncAPISchemaObject as ImportedAsyncAPISchemaObject
} from '@asyncapi/parser/esm/spec-types/v3';

// Legacy type aliases for backward compatibility
export type Channel = ImportedChannelObject;
export type Operation = ImportedOperationObject;
export type Message = ImportedMessageObject;
export type Schema = ImportedAsyncAPISchemaObject;

/**
 * Custom utility types that extend the official AsyncAPI types
 * These are project-specific types not covered by the official spec
 */

// Emitter-specific types (not part of official AsyncAPI spec)
export interface EmitterAsyncAPIObject extends ImportedAsyncAPIObject {
	// Extend with emitter-specific metadata
	'x-generated-from-typespec'?: {
		sourceFiles?: string;
		operationsFound?: string;
		note?: string;
	};
}

// Protocol binding type unions for better type safety
export type ProtocolType = 
	| 'http' 
	| 'ws' 
	| 'kafka' 
	| 'anypointmq' 
	| 'amqp' 
	| 'amqp1' 
	| 'mqtt' 
	| 'mqtt5' 
	| 'nats' 
	| 'jms' 
	| 'sns' 
	| 'sqs' 
	| 'stomp' 
	| 'redis' 
	| 'mercure' 
	| 'ibmmq' 
	| 'googlepubsub';

// File format types for emitter options
export type FileFormat = 'json' | 'yaml';

// Security scheme type enum
export type SecuritySchemeType = 
	| 'userPassword' 
	| 'apiKey' 
	| 'X509' 
	| 'symmetricEncryption' 
	| 'asymmetricEncryption' 
	| 'httpApiKey' 
	| 'http' 
	| 'oauth2' 
	| 'openIdConnect' 
	| 'plain' 
	| 'scram-sha-256' 
	| 'scram-sha-512' 
	| 'gssapi';

/**
 * MIGRATION NOTES:
 * 
 * This file went from 1,028 lines of custom type definitions to ~120 lines
 * by leveraging the official @asyncapi/parser types. This represents a 
 * massive reduction in maintenance overhead while ensuring type accuracy.
 * 
 * The official types are more comprehensive and battle-tested than our
 * custom implementations, providing better type safety and IntelliSense.
 */