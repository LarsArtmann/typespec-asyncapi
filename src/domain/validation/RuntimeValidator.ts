/**
 * Simplified Runtime Validation Schema Definition
 * 
 * Basic validation schemas for AsyncAPI specifications using Effect.TS
 */

import { Schema } from "@effect/schema"

// Basic types for validation
export type AsyncAPIObject = {
  asyncapi: string
  info: {
    title: string
    version: string
  }
  servers?: Record<string, unknown>
  channels?: Record<string, unknown>
}

export type ServerObject = {
  name: string
  url: string
  protocol: string
}

export type ChannelObject = {
  name: string
  description?: string
}

export type OperationObject = {
  operationId?: string
  summary?: string
}

export type MessageObject = {
  messageId?: string
  name?: string
  contentType?: string
}

export type SchemaObject = {
  type?: string
  format?: string
  title?: string
}

export type SecuritySchemeObject = {
  type: string
  description?: string
}

/**
 * Basic validation schemas
 */
export const ASYNC_API_VERSION_SCHEMA = Schema.String.pipe(
  Schema.pattern(/^[0-9]+\.[0-9]+\.[0-9]+$/)
)

export const INFO_SECTION_SCHEMA = Schema.Struct({
  title: Schema.String.pipe(Schema.minLength(1)),
  version: Schema.String.pipe(Schema.minLength(1))
})

export const SERVER_OBJECT_SCHEMA: Schema.Schema<ServerObject> = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1)),
  url: Schema.String.pipe(Schema.minLength(1)),
  protocol: Schema.String.pipe(Schema.minLength(1))
})

export const CHANNEL_OBJECT_SCHEMA: Schema.Schema<ChannelObject> = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1))
})

export const OPERATION_OBJECT_SCHEMA: Schema.Schema<OperationObject> = Schema.Struct({})
export const MESSAGE_OBJECT_SCHEMA: Schema.Schema<MessageObject> = Schema.Struct({})
export const SCHEMA_OBJECT_SCHEMA: Schema.Schema<SchemaObject> = Schema.Struct({})
export const SECURITY_SCHEME_OBJECT_SCHEMA: Schema.Schema<SecuritySchemeObject> = Schema.Struct({
  type: Schema.String.pipe(Schema.minLength(1))
})

export const ASYNC_API_OBJECT_SCHEMA = Schema.Struct({
  asyncapi: ASYNC_API_VERSION_SCHEMA,
  info: INFO_SECTION_SCHEMA,
  servers: Schema.optional(
    Schema.Record({
      key: Schema.String,
      value: SERVER_OBJECT_SCHEMA
    })
  ),
  channels: Schema.optional(
    Schema.Record({
      key: Schema.String,
      value: CHANNEL_OBJECT_SCHEMA
    })
  )
})

/**
 * Runtime validator functions
 */
export const validateAsyncAPIObject = (data: unknown) => 
  Schema.decodeUnknown(ASYNC_API_OBJECT_SCHEMA)(data)

export const validateServerObject = (data: unknown) => 
  Schema.decodeUnknown(SERVER_OBJECT_SCHEMA)(data)

export const validateChannelObject = (data: unknown) => 
  Schema.decodeUnknown(CHANNEL_OBJECT_SCHEMA)(data)

export const validateOperationObject = (data: unknown) => 
  Schema.decodeUnknown(OPERATION_OBJECT_SCHEMA)(data)

export const validateMessageObject = (data: unknown) => 
  Schema.decodeUnknown(MESSAGE_OBJECT_SCHEMA)(data)

export const validateSchemaObject = (data: unknown) => 
  Schema.decodeUnknown(SCHEMA_OBJECT_SCHEMA)(data)

export const validateSecuritySchemeObject = (data: unknown) => 
  Schema.decodeUnknown(SECURITY_SCHEME_OBJECT_SCHEMA)(data)