/**
 * 🎯 ASYNCAPI DOMAIN TYPES: Complete Type Safety Infrastructure
 * 
 * Runtime validation with branded types integration
 * Production-ready type safety system
 */

import { Effect } from "effect"
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
function validateChannel(channel: unknown): Effect.Effect<void, AsyncAPIValidationError> {
  if (typeof channel !== 'object' || channel === null || Array.isArray(channel)) {
    return Effect.fail(new AsyncAPIValidationError('Channel must be an object', 'channel', channel));
  }
  return Effect.succeed(undefined);
}

/**
 * Validates a message structure
 */
function validateMessage(message: unknown): Effect.Effect<void, AsyncAPIValidationError> {
  if (typeof message !== 'object' || message === null || Array.isArray(message)) {
    return Effect.fail(new AsyncAPIValidationError('Message must be an object', 'message', message));
  }
  return Effect.succeed(undefined);
}

/**
 * Validates a schema structure
 */
function validateSchema(schema: unknown): Effect.Effect<void, AsyncAPIValidationError> {
  if (typeof schema !== 'object' || schema === null || Array.isArray(schema)) {
    return Effect.fail(new AsyncAPIValidationError('Schema must be an object', 'schema', schema));
  }
  return Effect.succeed(undefined);
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
): Effect.Effect<AsyncAPIChannels, AsyncAPIValidationError> => {
  return Effect.gen(function*() {
    // Runtime validation - channel structure verification
    for (const [path, channel] of Object.entries(channels)) {
      if (typeof path !== 'string' || !path.trim()) {
        return yield* Effect.fail(new AsyncAPIValidationError('Channel path must be a non-empty string', 'path', path));
      }
      
      yield* validateChannel(channel);
    }
  
    return channels as AsyncAPIChannels;
  });
};

/**
 * Create type-safe messages from Record<string, unknown> with validation
 */
export const createAsyncAPIMessages = (
  messages: Record<string, unknown>
): Effect.Effect<AsyncAPIMessages, AsyncAPIValidationError> => {
  return Effect.gen(function*() {
    // Runtime validation - message structure verification
    for (const [messageId, message] of Object.entries(messages)) {
      if (typeof messageId !== 'string' || !messageId.trim()) {
        return yield* Effect.fail(new AsyncAPIValidationError('Message ID must be a non-empty string', 'messageId', messageId));
      }
      
      yield* validateMessage(message);
    }
  
    return messages as AsyncAPIMessages;
  });
};

/**
 * Create type-safe schemas from Record<string, unknown> with validation
 */
export const createAsyncAPISchemas = (
  schemas: Record<string, unknown>
): Effect.Effect<AsyncAPISchemas, AsyncAPIValidationError> => {
  return Effect.gen(function*() {
    // Runtime validation - JSON Schema verification
    for (const [schemaName, schema] of Object.entries(schemas)) {
      if (typeof schemaName !== 'string' || !schemaName.trim()) {
        return yield* Effect.fail(new AsyncAPIValidationError('Schema name must be a non-empty string', 'schemaName', schemaName));
      }
      
      yield* validateSchema(schema);
      
      // Additional JSON Schema validation
      const schemaObj = schema as Record<string, unknown>;
      if (!('type' in schemaObj)) {
        return yield* Effect.fail(new AsyncAPIValidationError('Schema must have a type property', 'schema', schema));
      }
    }
  
    return schemas as AsyncAPISchemas;
  });
};

/**
 * Create type-safe operations from Record<string, unknown> with validation
 */
export const createAsyncAPIOperations = (
  operations: Record<string, unknown>
): Effect.Effect<AsyncAPIOperations, AsyncAPIValidationError> => {
  return Effect.gen(function*() {
    // Runtime validation - operation structure verification
    for (const [operationId, operation] of Object.entries(operations)) {
      if (typeof operationId !== 'string' || !operationId.trim()) {
        return yield* Effect.fail(new AsyncAPIValidationError('Operation ID must be a non-empty string', 'operationId', operationId));
      }
      
      if (typeof operation !== 'object' || operation === null || Array.isArray(operation)) {
        return yield* Effect.fail(new AsyncAPIValidationError('Operation must be an object', 'operation', operation));
      }
    }
  
    return operations as AsyncAPIOperations;
  });
};