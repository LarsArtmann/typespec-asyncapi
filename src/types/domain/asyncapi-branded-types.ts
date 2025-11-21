/**
 * 🎯 ASYNCAPI BRANDED TYPES: Compile-Time & Runtime Safety
 * 
 * Makes impossible states unrepresentable through branded types
 * Ensures type safety beyond generic Record<string, unknown> patterns
 */

import { Effect } from "effect"

// ===== BRANDED TYPE UTILITIES =====

/**
 * Brand type utility for creating opaque types
 */
declare const brand: unique symbol;

/**
 * Create a branded type from a base type
 */
export type Branded<Type, Brand> = Type & { readonly [brand]: Brand };

// ===== ASYNCAPI DOMAIN BRANDED TYPES =====

/**
 * Branded type for AsyncAPI channel paths
 * Ensures channel paths are properly formatted and validated
 */
export type ChannelPath = Branded<string, 'ChannelPath'>;

/**
 * Branded type for AsyncAPI message identifiers  
 * Ensures message IDs are properly formatted and non-empty
 */
export type MessageId = Branded<string, 'MessageId'>;

/**
 * Branded type for AsyncAPI schema names
 * Ensures schema names are properly formatted and valid JSON Schema identifiers
 */
export type SchemaName = Branded<string, 'SchemaName'>;

/**
 * Branded type for AsyncAPI operation identifiers
 * Ensures operation IDs are properly formatted and unique within context
 */
export type OperationId = Branded<string, 'OperationId'>;

/**
 * Branded type for AsyncAPI server URLs
 * Ensures server URLs are properly formatted and valid
 */
export type ServerUrl = Branded<string, 'ServerUrl'>;

// ===== TYPE CONSTRUCTORS =====

/**
 * Create a branded channel path with validation
 */
export const createChannelPath = (path: string): Effect.Effect<ChannelPath, Error> => {
  if (typeof path !== 'string' || !path.trim()) {
    return Effect.fail(new Error(`Channel path must be a non-empty string, got: ${JSON.stringify(path)}`));
  }
  
  // Additional validation for AsyncAPI channel path format
  if (!path.startsWith('/')) {
    return Effect.fail(new Error(`Channel path must start with '/', got: ${path}`));
  }
  
  return Effect.succeed(path as ChannelPath);
};

/**
 * Create a branded message identifier with validation
 */
export const createMessageId = (messageId: string): Effect.Effect<MessageId, Error> => {
  if (typeof messageId !== 'string' || !messageId.trim()) {
    return Effect.fail(new Error(`Message ID must be a non-empty string, got: ${JSON.stringify(messageId)}`));
  }
  
  // Additional validation for message ID format
  if (!/^[a-zA-Z0-9._-]+$/.test(messageId)) {
    return Effect.fail(new Error(`Message ID contains invalid characters, got: ${messageId}`));
  }
  
  return Effect.succeed(messageId as MessageId);
};

/**
 * Create a branded schema name with validation
 */
export const createSchemaName = (schemaName: string): Effect.Effect<SchemaName, Error> => {
  if (typeof schemaName !== 'string' || !schemaName.trim()) {
    return Effect.fail(new Error(`Schema name must be a non-empty string, got: ${JSON.stringify(schemaName)}`));
  }
  
  // Additional validation for JSON Schema identifier format
  if (!/^[a-zA-Z0-9._-]+$/.test(schemaName)) {
    return Effect.fail(new Error(`Schema name contains invalid characters, got: ${schemaName}`));
  }
  
  return Effect.succeed(schemaName as SchemaName);
};

/**
 * Create a branded operation identifier with validation
 */
export const createOperationId = (operationId: string): Effect.Effect<OperationId, Error> => {
  if (typeof operationId !== 'string' || !operationId.trim()) {
    return Effect.fail(new Error(`Operation ID must be a non-empty string, got: ${JSON.stringify(operationId)}`));
  }
  
  // Additional validation for operation ID format
  if (!/^[a-zA-Z0-9._-]+$/.test(operationId)) {
    return Effect.fail(new Error(`Operation ID contains invalid characters, got: ${operationId}`));
  }
  
  return Effect.succeed(operationId as OperationId);
};

/**
 * Create a branded server URL with validation
 */
export const createServerUrl = (url: string): Effect.Effect<ServerUrl, Error> => {
  if (typeof url !== 'string' || !url.trim()) {
    return Effect.fail(new Error(`Server URL must be a non-empty string, got: ${JSON.stringify(url)}`));
  }
  
  // Basic URL validation using Effect.try
  const urlValidationError = (_error: unknown) => new Error(`Server URL must be a valid URL, got: ${url}`);
  return Effect.try({
    try: () => {
      new URL(url);
      return url as ServerUrl;
    },
    catch: urlValidationError
  });
};

// ===== TYPE GUARDS =====

/**
 * Type guard for ChannelPath
 */
export const isChannelPath = (value: unknown): value is ChannelPath => {
  return typeof value === 'string' && value.startsWith('/');
};

/**
 * Type guard for MessageId
 */
export const isMessageId = (value: unknown): value is MessageId => {
  return typeof value === 'string' && /^[a-zA-Z0-9._-]+$/.test(value);
};

/**
 * Type guard for SchemaName
 */
export const isSchemaName = (value: unknown): value is SchemaName => {
  return typeof value === 'string' && /^[a-zA-Z0-9._-]+$/.test(value);
};

// ===== UTILITY FUNCTIONS =====

/**
 * Extract string value from branded ChannelPath
 */
export const channelPathToString = (channelPath: ChannelPath): string => {
  return channelPath as string;
};

/**
 * Extract string value from branded MessageId
 */
export const messageIdToString = (messageId: MessageId): string => {
  return messageId as string;
};

/**
 * Extract string value from branded SchemaName
 */
export const schemaNameToString = (schemaName: SchemaName): string => {
  return schemaName as string;
};

/**
 * Extract string value from branded OperationId
 */
export const operationIdToString = (operationId: OperationId): string => {
  return operationId as string;
};

/**
 * Extract string value from branded ServerUrl
 */
export const serverUrlToString = (serverUrl: ServerUrl): string => {
  return serverUrl as string;
};