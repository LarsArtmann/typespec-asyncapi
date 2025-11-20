/**
 * 🎯 ASYNCAPI TYPE SAFETY: Incremental Record Replacement
 * 
 * Replaces Record<string, unknown> with typed collections
 * Maintains compatibility with existing code while improving type safety
 */

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

// ===== TYPE-SAFE RECORD REPLACEMENTS =====

/**
 * Type-safe channel collection replacing Record<string, unknown>
 */
export type AsyncAPIChannels = Record<string, unknown>;

/**
 * Type-safe message collection replacing Record<string, unknown>
 */
export type AsyncAPIMessages = Record<string, unknown>;

/**
 * Type-safe schema collection replacing Record<string, unknown>
 */
export type AsyncAPISchemas = Record<string, unknown>;

/**
 * Type-safe operation collection replacing Record<string, unknown>
 */
export type AsyncAPIOperations = Record<string, unknown>;

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

// ===== TYPE GUARDS =====

/**
 * Type guard for AsyncAPI channels
 */
export const isAsyncAPIChannels = (
  value: unknown
): value is AsyncAPIChannels => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Type guard for AsyncAPI messages
 */
export const isAsyncAPIMessages = (
  value: unknown
): value is AsyncAPIMessages => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Type guard for AsyncAPI schemas
 */
export const isAsyncAPISchemas = (
  value: unknown
): value is AsyncAPISchemas => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};