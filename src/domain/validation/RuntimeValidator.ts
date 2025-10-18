/**
 * Runtime Validation Schema Definition
 * 
 * Defines @effect/schema schemas for runtime validation of TypeSpec-generated
 * AsyncAPI specifications. Provides compile-time and runtime type safety for all
 * AsyncAPI data structures.
 * 
 * @author TypeSpec AsyncAPI Emitter Team
 * @since v1.1.0
 */

import { Schema } from "@effect/schema"
import type { AsyncAPIObject, ServerObject, ChannelObject, OperationObject, MessageObject, SchemaObject, SecuritySchemeObject } from "../types/branded-types.js"

/**
 * Schema for AsyncAPI version validation
 * Ensures version follows semantic versioning
 */
export const AsyncAPIVersionSchema = Schema.String.pipe(
  Schema.maxLength(50),
  Schema.pattern(/^[0-9]+\.[0-9]+\.[0-9]+$/)
)

/**
 * Schema for AsyncAPI info section validation
 */
export const InfoSectionSchema = Schema.Struct({
  title: Schema.String.pipe(Schema.minLength(1)),
  version: Schema.String.pipe(Schema.minLength(1)),
  description: Schema.String.pipe(Schema.optional()),
  termsOfService: Schema.String.pipe(Schema.optional()),
  contact: Schema.Struct({
    name: Schema.String.pipe(Schema.minLength(1)),
    url: Schema.String.pipe(Schema.optional()),
    email: Schema.String.pipe(Schema.optional())
  }).pipe(Schema.optional()),
  license: Schema.Struct({
    name: Schema.String.pipe(Schema.minLength(1)),
    url: Schema.String.pipe(Schema.optional()),
    identifier: Schema.String.pipe(Schema.optional())
  }).pipe(Schema.optional())
})

/**
 * Schema for server URL validation
 */
export const ServerURLSchema = Schema.String.pipe(
  Schema.pattern(/^[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+$/)
)

/**
 * Schema for server protocol validation
 */
export const ServerProtocolSchema = Schema.Literal("amqp", "amqps", "http", "https", "kafka", "mqtt", "secure-mqtt", "mqtt5", "redis", "nats", "stomp", "stomps", "ws", "wss", "wssecures")

/**
 * Schema for server object validation
 */
export const ServerObjectSchema: Schema.Schema<ServerObject> = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1)),
  url: ServerURLSchema,
  protocol: ServerProtocolSchema,
  description: Schema.String.pipe(Schema.optional()),
  variables: Schema.record(Schema.String, Schema.String).pipe(Schema.optional()),
  security: Schema.Array(Schema.String).pipe(Schema.optional()),
  bindings: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional()),
  tags: Schema.Array(Schema.Struct({
    name: Schema.String,
    description: Schema.String.pipe(Schema.optional())
  })).pipe(Schema.optional())
})

/**
 * Schema for channel object validation
 */
export const ChannelObjectSchema: Schema.Schema<ChannelObject> = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1)),
  description: Schema.String.pipe(Schema.optional()),
  subscribe: Schema.Unknown.pipe(Schema.optional()),
  publish: Schema.Unknown.pipe(Schema.optional()),
  parameters: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional()),
  bindings: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional()),
  tags: Schema.Array(Schema.Struct({
    name: Schema.String,
    description: Schema.String.pipe(Schema.optional())
  })).pipe(Schema.optional())
})

/**
 * Schema for operation object validation
 */
export const OperationObjectSchema: Schema.Schema<OperationObject> = Schema.Struct({
  operationId: Schema.String.pipe(Schema.optional()),
  summary: Schema.String.pipe(Schema.optional()),
  description: Schema.String.pipe(Schema.optional()),
  tags: Schema.Array(Schema.String).pipe(Schema.optional()),
  bindings: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional()),
  message: Schema.Unknown.pipe(Schema.optional()),
  traits: Schema.Array(Schema.Unknown).pipe(Schema.optional())
})

/**
 * Schema for message object validation
 */
export const MessageObjectSchema: Schema.Schema<MessageObject> = Schema.Struct({
  messageId: Schema.String.pipe(Schema.optional()),
  name: Schema.String.pipe(Schema.optional()),
  title: Schema.String.pipe(Schema.optional()),
  summary: Schema.String.pipe(Schema.optional()),
  description: Schema.String.pipe(Schema.optional()),
  contentType: Schema.String.pipe(Schema.optional()),
  payload: Schema.Unknown.pipe(Schema.optional()),
  schemaFormat: Schema.String.pipe(Schema.optional()),
  headers: Schema.Unknown.pipe(Schema.optional()),
  bindings: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional()),
  tags: Schema.Array(Schema.Struct({
    name: Schema.String,
    description: Schema.String.pipe(Schema.optional())
  })).pipe(Schema.optional()),
  traits: Schema.Array(Schema.Unknown).pipe(Schema.optional())
})

/**
 * Schema for schema object validation
 */
export const SchemaObjectSchema: Schema.Schema<SchemaObject> = Schema.Struct({
  type: Schema.String.pipe(Schema.optional()),
  format: Schema.String.pipe(Schema.optional()),
  title: Schema.String.pipe(Schema.optional()),
  description: Schema.String.pipe(Schema.optional()),
  default: Schema.Unknown.pipe(Schema.optional()),
  examples: Schema.Array(Schema.Unknown).pipe(Schema.optional()),
  required: Schema.Array(Schema.String).pipe(Schema.optional()),
  properties: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional()),
  additionalProperties: Schema.boolean().pipe(Schema.optional()),
  items: Schema.Unknown.pipe(Schema.optional()),
  minItems: Schema.Number.pipe(Schema.optional()),
  maxItems: Schema.Number.pipe(Schema.optional()),
  minLength: Schema.Number.pipe(Schema.optional()),
  maxLength: Schema.Number.pipe(Schema.optional()),
  pattern: Schema.String.pipe(Schema.optional()),
  minimum: Schema.Number.pipe(Schema.optional()),
  maximum: Schema.Number.pipe(Schema.optional()),
  exclusiveMinimum: Schema.Number.pipe(Schema.optional()),
  exclusiveMaximum: Schema.Number.pipe(Schema.optional()),
  multipleOf: Schema.Number.pipe(Schema.optional()),
  enum: Schema.Array(Schema.Unknown).pipe(Schema.optional()),
  const: Schema.Unknown.pipe(Schema.optional()),
  allOf: Schema.Array(Schema.Unknown).pipe(Schema.optional()),
  oneOf: Schema.Array(Schema.Unknown).pipe(Schema.optional()),
  anyOf: Schema.Array(Schema.Unknown).pipe(Schema.optional()),
  not: Schema.Unknown.pipe(Schema.optional()),
  discriminator: Schema.Unknown.pipe(Schema.optional()),
  externalDocs: Schema.Struct({
    url: Schema.String,
    description: Schema.String.pipe(Schema.optional())
  }).pipe(Schema.optional())
})

/**
 * Schema for security scheme object validation
 */
export const SecuritySchemeObjectSchema: Schema.Schema<SecuritySchemeObject> = Schema.Struct({
  type: Schema.String.pipe(Schema.minLength(1)),
  description: Schema.String.pipe(Schema.optional()),
  name: Schema.String.pipe(Schema.optional()),
  in: Schema.Literal("header", "query", "cookie").pipe(Schema.optional()),
  scheme: Schema.String.pipe(Schema.optional()),
  bearerFormat: Schema.String.pipe(Schema.optional()),
  flows: Schema.Unknown.pipe(Schema.optional()),
  openIdConnectUrl: Schema.String.pipe(Schema.optional()),
  scopes: Schema.record(Schema.String, Schema.String).pipe(Schema.optional()),
  bearerFormat: Schema.String.pipe(Schema.optional())
})

/**
 * Main AsyncAPI object schema
 */
export const AsyncAPIObjectSchema: Schema.Schema<AsyncAPIObject> = Schema.Struct({
  asyncapi: AsyncAPIVersionSchema,
  info: InfoSectionSchema,
  servers: Schema.record(Schema.String, ServerObjectSchema).pipe(Schema.optional()),
  channels: Schema.record(Schema.String, ChannelObjectSchema).pipe(Schema.optional()),
  components: Schema.Struct({
    messages: Schema.record(Schema.String, MessageObjectSchema).pipe(Schema.optional()),
    parameters: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional()),
    schemas: Schema.record(Schema.String, SchemaObjectSchema).pipe(Schema.optional()),
    securitySchemes: Schema.record(Schema.String, SecuritySchemeObjectSchema).pipe(Schema.optional()),
    operationTraits: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional()),
    messageTraits: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional()),
    serverVariables: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional()),
    channelTraits: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional()),
    operationBindings: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional()),
    messageBindings: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional()),
    serverBindings: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional()),
    channelBindings: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional()),
    correlationIds: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional()),
    reply: Schema.Unknown.pipe(Schema.optional()),
    extension: Schema.record(Schema.String, Schema.Unknown).pipe(Schema.optional())
  }).pipe(Schema.optional()),
  tags: Schema.Array(Schema.Struct({
    name: Schema.String,
    description: Schema.String.pipe(Schema.optional())
  })).pipe(Schema.optional()),
  externalDocs: Schema.Struct({
    url: Schema.String,
    description: Schema.String.pipe(Schema.optional())
  }).pipe(Schema.optional())
})

/**
 * Runtime validator functions using the schemas
 */
export const validateAsyncAPIObject = (data: unknown) => Schema.decodeUnknown(AsyncAPIObjectSchema)(data)
export const validateServerObject = (data: unknown) => Schema.decodeUnknown(ServerObjectSchema)(data)
export const validateChannelObject = (data: unknown) => Schema.decodeUnknown(ChannelObjectSchema)(data)
export const validateOperationObject = (data: unknown) => Schema.decodeUnknown(OperationObjectSchema)(data)
export const validateMessageObject = (data: unknown) => Schema.decodeUnknown(MessageObjectSchema)(data)
export const validateSchemaObject = (data: unknown) => Schema.decodeUnknown(SchemaObjectSchema)(data)
export const validateSecuritySchemeObject = (data: unknown) => Schema.decodeUnknown(SecuritySchemeObjectSchema)(data)