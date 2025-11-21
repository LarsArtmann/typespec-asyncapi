/**
 * 🎯 ASYNCAPI BRANDED TYPES: Compile-Time & Runtime Safety
 * 
 * Makes impossible states unrepresentable through schema-based branded types
 * Ensures type safety beyond generic Record<string, unknown> patterns
 * 
 * MIGRATION: Manual validation → @effect/schema validation
 */

import { Effect, Schema } from "effect"

// ===== SCHEMA-BASED BRANDED TYPES =====

/**
 * Schema for AsyncAPI channel paths with validation
 */
export const channelPathSchema = Schema.String.pipe(
  Schema.minLength(1),
  Schema.pattern(/^\//),
  Schema.brand("ChannelPath")
)

/**
 * Schema for AsyncAPI message identifiers with validation
 */
export const messageIdSchema = Schema.String.pipe(
  Schema.minLength(1),
  Schema.pattern(/^[a-zA-Z0-9._-]+$/),
  Schema.brand("MessageId")
)

/**
 * Schema for AsyncAPI schema names with validation
 */
export const schemaNameSchema = Schema.String.pipe(
  Schema.minLength(1),
  Schema.pattern(/^[a-zA-Z0-9._-]+$/),
  Schema.brand("SchemaName")
)

/**
 * Schema for AsyncAPI operation identifiers with validation
 */
export const operationIdSchema = Schema.String.pipe(
  Schema.minLength(1),
  Schema.pattern(/^[a-zA-Z0-9._-]+$/),
  Schema.brand("OperationId")
)

/**
 * Schema for AsyncAPI server URLs with validation
 */
export const serverUrlSchema = Schema.String.pipe(
  Schema.minLength(1),
  Schema.filter((value) => {
    // eslint-disable-next-line no-restricted-syntax -- URL constructor validation requires try/catch
    try {
      const url = new URL(value);
      return !!(url.protocol && url.hostname);
    } catch {
      return false;
    }
  }, {
    message: () => "Server URL must be a valid URL with protocol and hostname"
  }),
  Schema.brand("ServerUrl")
)

// ===== TYPE EXPORTS =====

/**
 * Branded type for AsyncAPI channel paths
 */
export type ChannelPathType = typeof channelPathSchema.Type

/**
 * Branded type for AsyncAPI message identifiers
 */
export type MessageType = typeof messageIdSchema.Type

/**
 * Branded type for AsyncAPI schema names
 */
export type SchemaNameType = typeof schemaNameSchema.Type

/**
 * Branded type for AsyncAPI operation identifiers
 */
export type OperationIdType = typeof operationIdSchema.Type

/**
 * Branded type for AsyncAPI server URLs
 */
export type ServerUrlType = typeof serverUrlSchema.Type

// ===== SCHEMA-BASED TYPE CONSTRUCTORS =====

/**
 * Create a branded channel path using schema validation
 */
export const createChannelPath = (path: string): Effect.Effect<typeof channelPathSchema.Type, Error> => 
  Effect.gen(function*() {
    return yield* Effect.try({
      try: () => Schema.decodeSync(channelPathSchema)(path),
      catch: (error) => new Error(`Channel path validation failed: ${String(error)}`)
    })
  })

/**
 * Create a branded message identifier using schema validation
 */
export const createMessageId = (messageId: string): Effect.Effect<typeof messageIdSchema.Type, Error> => 
  Effect.gen(function*() {
    return yield* Effect.try({
      try: () => Schema.decodeSync(messageIdSchema)(messageId),
      catch: (error) => new Error(`Message ID validation failed: ${String(error)}`)
    })
  })

/**
 * Create a branded schema name using schema validation
 */
export const createSchemaName = (schemaName: string): Effect.Effect<typeof schemaNameSchema.Type, Error> => 
  Effect.gen(function*() {
    return yield* Effect.try({
      try: () => Schema.decodeSync(schemaNameSchema)(schemaName),
      catch: (error) => new Error(`Schema name validation failed: ${String(error)}`)
    })
  })

/**
 * Create a branded operation identifier using schema validation
 */
export const createOperationId = (operationId: string): Effect.Effect<typeof operationIdSchema.Type, Error> => 
  Effect.gen(function*() {
    return yield* Effect.try({
      try: () => Schema.decodeSync(operationIdSchema)(operationId),
      catch: (error) => new Error(`Operation ID validation failed: ${String(error)}`)
    })
  })

/**
 * Create a branded server URL using schema validation
 */
export const createServerUrl = (url: string): Effect.Effect<typeof serverUrlSchema.Type, Error> => 
  Effect.gen(function*() {
    return yield* Effect.try({
      try: () => Schema.decodeSync(serverUrlSchema)(url),
      catch: (error) => new Error(`Server URL validation failed: ${String(error)}`)
    })
  })

// ===== SCHEMA-BASED TYPE GUARDS =====

/**
 * Type guard for ChannelPath using schema validation
 */
export const isChannelPath = (value: unknown): value is typeof channelPathSchema.Type => 
  Schema.is(channelPathSchema)(value)

/**
 * Type guard for MessageId using schema validation
 */
export const isMessageId = (value: unknown): value is typeof messageIdSchema.Type => 
  Schema.is(messageIdSchema)(value)

/**
 * Type guard for SchemaName using schema validation
 */
export const isSchemaName = (value: unknown): value is typeof schemaNameSchema.Type => 
  Schema.is(schemaNameSchema)(value)

/**
 * Type guard for OperationId using schema validation
 */
export const isOperationId = (value: unknown): value is typeof operationIdSchema.Type => 
  Schema.is(operationIdSchema)(value)

/**
 * Type guard for ServerUrl using schema validation
 */
export const isServerUrl = (value: unknown): value is typeof serverUrlSchema.Type => 
  Schema.is(serverUrlSchema)(value)

// ===== UTILITY FUNCTIONS =====

/**
 * Extract string value from branded ChannelPath
 */
export const channelPathToString = (channelPath: typeof channelPathSchema.Type): string => {
  return channelPath as string;
};

/**
 * Extract string value from branded MessageId
 */
export const messageIdToString = (messageId: typeof messageIdSchema.Type): string => {
  return messageId as string;
};

/**
 * Extract string value from branded SchemaName
 */
export const schemaNameToString = (schemaName: typeof schemaNameSchema.Type): string => {
  return schemaName as string;
};

/**
 * Extract string value from branded OperationId
 */
export const operationIdToString = (operationId: typeof operationIdSchema.Type): string => {
  return operationId as string;
};

/**
 * Extract string value from branded ServerUrl
 */
export const serverUrlToString = (serverUrl: typeof serverUrlSchema.Type): string => {
  return serverUrl as string;
};