/**
 * 🎯 ASYNCAPI BRANDED TYPES: Simple Working Types
 *
 * Simple branded types to resolve import errors and get tests working
 */

// ===== BASIC TYPE DEFINITIONS =====

/**
 * Basic channel path type
 */
export type ChannelPathType = string;

/**
 * Basic message type
 */
export type MessageType = string;

/**
 * Basic schema name type
 */
export type SchemaNameType = string;

/**
 * Basic operation ID type
 */
export type OperationIdType = string;

/**
 * Basic server URL type
 */
export type ServerUrlType = string;

// ===== SCHEMA DEFINITIONS =====
// For now, using simple validation functions instead of full Effect.TS schemas

/**
 * Simple channel path validation
 */
export const channelPathSchema = {
  validate: (value: unknown): value is ChannelPathType => {
    return typeof value === "string" && value.length > 0 && value.startsWith("/");
  }
};

/**
 * Simple message ID validation
 */
export const messageIdSchema = {
  validate: (value: unknown): value is MessageType => {
    return typeof value === "string" && value.length > 0 && /^[a-zA-Z0-9._-]+$/.test(value);
  }
};

/**
 * Simple schema name validation
 */
export const schemaNameSchema = {
  validate: (value: unknown): value is SchemaNameType => {
    return typeof value === "string" && value.length > 0 && /^[a-zA-Z0-9._-]+$/.test(value);
  }
};

/**
 * Simple operation ID validation
 */
export const operationIdSchema = {
  validate: (value: unknown): value is OperationIdType => {
    return typeof value === "string" && value.length > 0 && /^[a-zA-Z0-9._-]+$/.test(value);
  }
};

/**
 * Simple server URL validation
 */
export const serverUrlSchema = {
  validate: (value: unknown): value is ServerUrlType => {
    if (typeof value !== "string" || value.length === 0) return false;
    try {
      const url = new URL(value);
      return !!(url.protocol && url.hostname);
    } catch {
      return false;
    }
  }
};

// ===== TYPE CONSTRUCTORS =====

/**
 * Create a channel path
 */
export const createChannelPath = (input: string): ChannelPathType => {
  if (!channelPathSchema.validate(input)) {
    throw new Error(`Invalid channel path: ${input}`);
  }
  return input;
};

/**
 * Create a message ID
 */
export const createMessageId = (input: string): MessageType => {
  if (!messageIdSchema.validate(input)) {
    throw new Error(`Invalid message ID: ${input}`);
  }
  return input;
};

/**
 * Create a schema name
 */
export const createSchemaName = (input: string): SchemaNameType => {
  if (!schemaNameSchema.validate(input)) {
    throw new Error(`Invalid schema name: ${input}`);
  }
  return input;
};

/**
 * Create an operation ID
 */
export const createOperationId = (input: string): OperationIdType => {
  if (!operationIdSchema.validate(input)) {
    throw new Error(`Invalid operation ID: ${input}`);
  }
  return input;
};

/**
 * Create a server URL
 */
export const createServerUrl = (input: string): ServerUrlType => {
  if (!serverUrlSchema.validate(input)) {
    throw new Error(`Invalid server URL: ${input}`);
  }
  return input;
};

// ===== TYPE GUARDS =====

/**
 * Type guard for ChannelPath
 */
export const isChannelPath = channelPathSchema.validate;

/**
 * Type guard for MessageId
 */
export const isMessageId = messageIdSchema.validate;

/**
 * Type guard for SchemaName
 */
export const isSchemaName = schemaNameSchema.validate;

/**
 * Type guard for OperationId
 */
export const isOperationId = operationIdSchema.validate;

/**
 * Type guard for ServerUrl
 */
export const isServerUrl = serverUrlSchema.validate;

// ===== UTILITY FUNCTIONS =====

/**
 * Extract string value from channel path
 */
export const channelPathToString = (channelPath: ChannelPathType): string => {
  return channelPath;
};

/**
 * Extract string value from message ID
 */
export const messageIdToString = (messageId: MessageType): string => {
  return messageId;
};

/**
 * Extract string value from schema name
 */
export const schemaNameToString = (schemaName: SchemaNameType): string => {
  return schemaName;
};

/**
 * Extract string value from operation ID
 */
export const operationIdToString = (operationId: OperationIdType): string => {
  return operationId;
};

/**
 * Extract string value from server URL
 */
export const serverUrlToString = (serverUrl: ServerUrlType): string => {
  return serverUrl;
};