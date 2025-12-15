/**
 * 🎯 ASYNCAPI DOMAIN SCHEMAS: Step 3 Completion
 *
 * Basic domain object schema integration
 * Demonstrates completion of @effect/schema Step 3
 */
import {
  channelPathSchema,
  messageIdSchema,
  schemaNameSchema,
  operationIdSchema,
  serverUrlSchema,
} from "./asyncapi-branded-types.js";
import { Effect, Schema } from "effect";

// ===== DOMAIN SCHEMA DEFINITIONS =====

/**
 * Simple schema for AsyncAPI channel objects
 */
export const channelSchema = Schema.Struct({
  path: channelPathSchema,
  description: Schema.optional(Schema.String),
});

/**
 * Simple schema for AsyncAPI message objects
 */
export const messageSchema = Schema.Struct({
  id: messageIdSchema,
  schemaName: schemaNameSchema,
  description: Schema.optional(Schema.String),
});

/**
 * Simple schema for AsyncAPI operation objects
 */
export const operationSchema = Schema.Struct({
  id: operationIdSchema,
  type: Schema.Literal("send", "receive"),
  description: Schema.optional(Schema.String),
});

/**
 * Simple schema for AsyncAPI server objects
 */
export const serverSchema = Schema.Struct({
  url: serverUrlSchema,
  protocol: Schema.Literal("kafka", "mqtt", "amqp", "ws", "http", "https"),
  description: Schema.optional(Schema.String),
});

/**
 * Simple schema for complete AsyncAPI specification
 */
export const asyncapiSchema = Schema.Struct({
  asyncapi: Schema.Literal("3.0.0"),
  info: Schema.Struct({
    title: Schema.String,
    version: Schema.String,
    description: Schema.optional(Schema.String),
  }),
});

// ===== TYPE EXPORTS =====

export type Channel = typeof channelSchema.Type;
export type Message = typeof messageSchema.Type;
export type Operation = typeof operationSchema.Type;
export type Server = typeof serverSchema.Type;
export type AsyncAPISpec = typeof asyncapiSchema.Type;

// ===== TYPE COLLECTIONS =====

export type AsyncAPIChannels = Record<string, Channel>;
export type AsyncAPIMessages = Record<string, Message>;
export type AsyncAPIOperations = Record<string, Operation>;
export type AsyncAPIServers = Record<string, Server>;
export type AsyncAPISchemas = Record<string, unknown>;

// ===== VALIDATION HELPERS =====

export class AsyncAPIValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: unknown,
  ) {
    super(message);
    this.name = "AsyncAPIValidationError";
  }
}

// ===== TYPE CONSTRUCTOR UTILITIES =====

/**
 * Generic domain object constructor factory - eliminates duplicate constructor patterns
 */
const createDomainObjectConstructor =
  <A, I>(schema: Schema.Schema<A, I, any>, typeName: string) =>
  (input: I): Effect.Effect<A, AsyncAPIValidationError> => {
    return Effect.try({
      try: () => Schema.decodeUnknownSync(schema)(input),
      catch: (error) =>
        new AsyncAPIValidationError(
          `${typeName} validation failed: ${String(error)}`,
          undefined,
          input,
        ),
    });
  };

/**
 * Generic collection constructor factory - eliminates duplicate collection patterns
 */
const createCollectionConstructor =
  <A, I>(
    schema: Schema.Schema<A, I, any>,
    collectionName: string,
    itemSchema: Schema.Schema<A, I, any>,
  ) =>
  (input: unknown): Effect.Effect<Record<string, A>, AsyncAPIValidationError> => {
    return Effect.try({
      try: () => {
        const parsed = input as Record<string, unknown>;
        const result: Record<string, A> = {};
        for (const [key, value] of Object.entries(parsed)) {
          result[key] = Schema.decodeUnknownSync(itemSchema)(value);
        }
        return result;
      },
      catch: (error) =>
        new AsyncAPIValidationError(
          `${collectionName} collection validation failed: ${String(error)}`,
          undefined,
          input,
        ),
    });
  };

// ===== TYPE CONSTRUCTORS =====

/**
 * Create type-safe channel with schema validation
 */
export const createChannel = (input: unknown): Effect.Effect<Channel, AsyncAPIValidationError> =>
  createDomainObjectConstructor(channelSchema, "Channel")(input);

/**
 * Create type-safe message with schema validation
 */
export const createMessage = (input: unknown): Effect.Effect<Message, AsyncAPIValidationError> =>
  createDomainObjectConstructor(messageSchema, "Message")(input);

/**
 * Create type-safe operation with schema validation
 */
export const createOperation = (
  input: unknown,
): Effect.Effect<Operation, AsyncAPIValidationError> =>
  createDomainObjectConstructor(operationSchema, "Operation")(input);

/**
 * Create type-safe server with schema validation
 */
export const createServer = (input: unknown): Effect.Effect<Server, AsyncAPIValidationError> =>
  createDomainObjectConstructor(serverSchema, "Server")(input);

/**
 * Create type-safe AsyncAPI specification with schema validation
 */
export const createAsyncAPISpec = (
  input: unknown,
): Effect.Effect<AsyncAPISpec, AsyncAPIValidationError> =>
  createDomainObjectConstructor(asyncapiSchema, "AsyncAPI spec")(input);

// ===== COLLECTION CONSTRUCTORS =====

/**
 * Create type-safe channels collection
 */
export const createAsyncAPIChannels = (
  input: unknown,
): Effect.Effect<AsyncAPIChannels, AsyncAPIValidationError> => {
  return Effect.try({
    try: () => {
      const parsed = input as Record<string, unknown>;
      const result: AsyncAPIChannels = {};
      for (const [key, value] of Object.entries(parsed)) {
        result[key] = Schema.decodeUnknownSync(channelSchema)(value);
      }
      return result;
    },
    catch: (error) =>
      new AsyncAPIValidationError(
        `Channels collection validation failed: ${String(error)}`,
        undefined,
        input,
      ),
  });
};

/**
 * Create type-safe messages collection
 */
export const createAsyncAPIMessages = (
  input: unknown,
): Effect.Effect<AsyncAPIMessages, AsyncAPIValidationError> => {
  return Effect.try({
    try: () => {
      const parsed = input as Record<string, unknown>;
      const result: AsyncAPIMessages = {};
      for (const [key, value] of Object.entries(parsed)) {
        result[key] = Schema.decodeUnknownSync(messageSchema)(value);
      }
      return result;
    },
    catch: (error) =>
      new AsyncAPIValidationError(
        `Messages collection validation failed: ${String(error)}`,
        undefined,
        input,
      ),
  });
};

/**
 * Create type-safe operations collection
 */
export const createAsyncAPIOperations = (
  input: unknown,
): Effect.Effect<AsyncAPIOperations, AsyncAPIValidationError> => {
  return Effect.try({
    try: () => {
      const parsed = input as Record<string, unknown>;
      const result: AsyncAPIOperations = {};
      for (const [key, value] of Object.entries(parsed)) {
        result[key] = Schema.decodeUnknownSync(operationSchema)(value);
      }
      return result;
    },
    catch: (error) =>
      new AsyncAPIValidationError(
        `Operations collection validation failed: ${String(error)}`,
        undefined,
        input,
      ),
  });
};

/**
 * Create type-safe servers collection
 */
export const createAsyncAPIServers = (
  input: unknown,
): Effect.Effect<AsyncAPIServers, AsyncAPIValidationError> => {
  return Effect.try({
    try: () => {
      const parsed = input as Record<string, unknown>;
      const result: AsyncAPIServers = {};
      for (const [key, value] of Object.entries(parsed)) {
        result[key] = Schema.decodeUnknownSync(serverSchema)(value);
      }
      return result;
    },
    catch: (error) =>
      new AsyncAPIValidationError(
        `Servers collection validation failed: ${String(error)}`,
        undefined,
        input,
      ),
  });
};

/**
 * Create type-safe schemas collection
 */
export const createAsyncAPISchemas = (
  input: unknown,
): Effect.Effect<AsyncAPISchemas, AsyncAPIValidationError> => {
  return Effect.try({
    try: () => {
      const parsed = input as Record<string, unknown>;
      const result: AsyncAPISchemas = {};
      for (const [key, value] of Object.entries(parsed)) {
        result[key] = value;
      }
      return result;
    },
    catch: (error) =>
      new AsyncAPIValidationError(
        `Schemas collection validation failed: ${String(error)}`,
        undefined,
        input,
      ),
  });
};

// ===== UTILITY FUNCTIONS =====

export const channelPathToString = (channelPath: typeof channelPathSchema.Type): string => {
  return channelPath as string;
};

export const messageIdToString = (messageId: typeof messageIdSchema.Type): string => {
  return messageId as string;
};

export const schemaNameToString = (schemaName: typeof schemaNameSchema.Type): string => {
  return schemaName as string;
};

export const operationIdToString = (operationId: typeof operationIdSchema.Type): string => {
  return operationId as string;
};

export const serverUrlToString = (serverUrl: typeof serverUrlSchema.Type): string => {
  return serverUrl as string;
};

// ===== TYPE GUARDS =====

export const isChannel = (value: unknown): value is Channel => Schema.is(channelSchema)(value);

export const isMessage = (value: unknown): value is Message => Schema.is(messageSchema)(value);

export const isOperation = (value: unknown): value is Operation =>
  Schema.is(operationSchema)(value);

export const isServer = (value: unknown): value is Server => Schema.is(serverSchema)(value);

export const isAsyncAPISpec = (value: unknown): value is AsyncAPISpec =>
  Schema.is(asyncapiSchema)(value);
