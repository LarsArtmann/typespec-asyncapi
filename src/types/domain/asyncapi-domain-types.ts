/**
 * 🎯 ASYNCAPI DOMAIN TYPES: Complete Type Safety Infrastructure
 * 
 * Runtime validation with branded types integration
 * Production-ready type safety system
 */

import type { 
  ChannelPath,
  MessageId, 
  SchemaName,
  OperationId,
  ServerUrl
} from "./asyncapi-branded-types.js";

// ===== VALIDATION HELPERS =====

/**
 * Validation error for domain types
 */
export class AsyncAPIValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown
  ) {
    super(message);
    this.name = 'AsyncAPIValidationError';
  }
}

/**
 * Validates a channel structure
 */
function validateChannel(channel: unknown): asserts channel is Record<string, unknown> {
  if (typeof channel !== 'object' || channel === null || Array.isArray(channel)) {
    throw new AsyncAPIValidationError('Channel must be an object', 'channel', channel);
  }
}

/**
 * Validates a message structure
 */
function validateMessage(message: unknown): asserts message is Record<string, unknown> {
  if (typeof message !== 'object' || message === null || Array.isArray(message)) {
    throw new AsyncAPIValidationError('Message must be an object', 'message', message);
  }
}

/**
 * Validates a schema structure
 */
function validateSchema(schema: unknown): asserts schema is Record<string, unknown> {
  if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) {
    throw new AsyncAPIValidationError('Schema must be an object', 'schema', schema);
  }
}

// ===== TYPE-SAFE RECORD REPLACEMENTS WITH BRANDED TYPES =====

/**
 * Type-safe channel collection using branded channel paths
 */
export type AsyncAPIChannels = Record<ChannelPath, unknown>;

/**
 * Type-safe message collection using branded message IDs
 */
export type AsyncAPIMessages = Record<MessageId, unknown>;

/**
 * Type-safe schema collection using branded schema names
 */
export type AsyncAPISchemas = Record<SchemaName, unknown>;

/**
 * Type-safe operation collection using branded operation IDs
 */
export type AsyncAPIOperations = Record<OperationId, unknown>;

/**
 * Type-safe server collection using branded server URLs
 */
export type AsyncAPIServers = Record<ServerUrl, unknown>;

// ===== TYPE CONSTRUCTORS WITH RUNTIME VALIDATION =====

/**
 * Create type-safe channels from Record<string, unknown> with validation
 */
export const createAsyncAPIChannels = (
  channels: Record<string, unknown>
): AsyncAPIChannels => {
  // Runtime validation - channel structure verification
  for (const [path, channel] of Object.entries(channels)) {
    if (typeof path !== 'string' || !path.trim()) {
      throw new AsyncAPIValidationError('Channel path must be a non-empty string', 'path', path);
    }
    
    validateChannel(channel);
  }
  
  return channels as AsyncAPIChannels;
};

/**
 * Create type-safe messages from Record<string, unknown> with validation
 */
export const createAsyncAPIMessages = (
  messages: Record<string, unknown>
): AsyncAPIMessages => {
  // Runtime validation - message structure verification
  for (const [messageId, message] of Object.entries(messages)) {
    if (typeof messageId !== 'string' || !messageId.trim()) {
      throw new AsyncAPIValidationError('Message ID must be a non-empty string', 'messageId', messageId);
    }
    
    validateMessage(message);
  }
  
  return messages as AsyncAPIMessages;
};

/**
 * Create type-safe schemas from Record<string, unknown> with validation
 */
export const createAsyncAPISchemas = (
  schemas: Record<string, unknown>
): AsyncAPISchemas => {
  // Runtime validation - JSON Schema verification
  for (const [schemaName, schema] of Object.entries(schemas)) {
    if (typeof schemaName !== 'string' || !schemaName.trim()) {
      throw new AsyncAPIValidationError('Schema name must be a non-empty string', 'schemaName', schemaName);
    }
    
    validateSchema(schema);
    
    // Additional JSON Schema validation
    const schemaObj = schema as Record<string, unknown>;
    if (!('type' in schemaObj)) {
      throw new AsyncAPIValidationError('Schema must have a type property', 'schema', schema);
    }
  }
  
  return schemas as AsyncAPISchemas;
};

/**
 * Create type-safe operations from Record<string, unknown> with validation
 */
export const createAsyncAPIOperations = (
  operations: Record<string, unknown>
): AsyncAPIOperations => {
  // Runtime validation - operation structure verification
  for (const [operationId, operation] of Object.entries(operations)) {
    if (typeof operationId !== 'string' || !operationId.trim()) {
      throw new AsyncAPIValidationError('Operation ID must be a non-empty string', 'operationId', operationId);
    }
    
    if (typeof operation !== 'object' || operation === null || Array.isArray(operation)) {
      throw new AsyncAPIValidationError('Operation must be an object', 'operation', operation);
    }
  }
  
  return operations as AsyncAPIOperations;
};