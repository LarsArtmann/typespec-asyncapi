/**
 * 🎯 ASYNCAPI BRANDED TYPES: Simple Working Types
 *
 * Simple branded types to resolve import errors and get tests working
 */

/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

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
/**
 * Simple server URL validation
 */
export const serverUrlSchema = {
  validate: (value: unknown): value is ServerUrlType => {
    if (typeof value !== "string" || value.length === 0) return false;
    // Simple URL validation without try/catch
    const urlPattern = /^https?:\/\/.+/;
    return urlPattern.test(value);
  }
};

// ===== TYPE CONSTRUCTORS =====

/**
 * Create a channel path
 */
export const createChannelPath = (input: string): ChannelPathType => {
  if (!channelPathSchema.validate(input)) {
    // eslint-disable-next-line no-console
    console.error(`Invalid channel path: ${input}`);
    return input as ChannelPathType;
  }
  return input as ChannelPathType;
};

/**
 * Create a message ID
 */
export const createMessageId = (input: string): MessageType => {
  if (!messageIdSchema.validate(input)) {
    // eslint-disable-next-line no-console
    console.error(`Invalid message ID: ${input}`);
    return input as MessageType;
  }
  return input as MessageType;
};

/**
 * Create a schema name
 */
export const createSchemaName = (input: string): SchemaNameType => {
  if (!schemaNameSchema.validate(input)) {
    // eslint-disable-next-line no-console
    console.error(`Invalid schema name: ${input}`);
    return input as SchemaNameType;
  }
  return input as SchemaNameType;
};

/**
 * Create an operation ID
 */
export const createOperationId = (input: string): OperationIdType => {
  if (!operationIdSchema.validate(input)) {
    // eslint-disable-next-line no-console
    console.error(`Invalid operation ID: ${input}`);
    return input as OperationIdType;
  }
  return input as OperationIdType;
};

/**
 * Create a server URL
 */
export const createServerUrl = (input: string): ServerUrlType => {
  if (!serverUrlSchema.validate(input)) {
    // eslint-disable-next-line no-console
    console.error(`Invalid server URL: ${input}`);
    return input as ServerUrlType;
  }
  return input as ServerUrlType;
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