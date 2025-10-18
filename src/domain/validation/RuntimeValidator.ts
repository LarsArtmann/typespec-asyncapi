/**
 * Simplified Runtime Validation Schema Definition
 * 
 * Basic validation schemas for AsyncAPI specifications using Effect.TS
 */

import { Schema } from "@effect/schema"

// Basic types for validation
export interface AsyncAPIObject {
  asyncapi: string
  info: {
    title: string
    version: string
  }
  servers?: Record<string, any>
  channels?: Record<string, any>
}

export interface ServerObject {
  name: string
  url: string
  protocol: string
}

export interface ChannelObject {
  name: string
  description?: string
}

export interface OperationObject {
  operationId?: string
  summary?: string
}

export interface MessageObject {
  messageId?: string
  name?: string
  contentType?: string
}

export interface SchemaObject {
  type?: string
  format?: string
  title?: string
}

export interface SecuritySchemeObject {
  type: string
  description?: string
}

/**
 * Basic validation schemas
 */
export const AsyncAPIVersionSchema = Schema.String.pipe(
  Schema.pattern(/^[0-9]+\.[0-9]+\.[0-9]+$/)
)

export const InfoSectionSchema = Schema.Struct({
  title: Schema.String.pipe(Schema.minLength(1)),
  version: Schema.String.pipe(Schema.minLength(1))
})

export const ServerObjectSchema: Schema.Schema<ServerObject> = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1)),
  url: Schema.String.pipe(Schema.minLength(1)),
  protocol: Schema.String.pipe(Schema.minLength(1))
})

export const ChannelObjectSchema: Schema.Schema<ChannelObject> = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1))
})

export const OperationObjectSchema: Schema.Schema<OperationObject> = Schema.Struct({})
export const MessageObjectSchema: Schema.Schema<MessageObject> = Schema.Struct({})
export const SchemaObjectSchema: Schema.Schema<SchemaObject> = Schema.Struct({})
export const SecuritySchemeObjectSchema: Schema.Schema<SecuritySchemeObject> = Schema.Struct({
  type: Schema.String.pipe(Schema.minLength(1))
})

export const AsyncAPIObjectSchema: Schema.Schema<AsyncAPIObject> = Schema.Struct({
  asyncapi: AsyncAPIVersionSchema,
  info: InfoSectionSchema,
  servers: Schema.record(Schema.String, ServerObjectSchema).pipe(
    Schema.optionalWith({ defaultValue: undefined })
  ),
  channels: Schema.record(Schema.String, ChannelObjectSchema).pipe(
    Schema.optionalWith({ defaultValue: undefined })
  )
})

/**
 * Runtime validator functions
 */
export const validateAsyncAPIObject = (data: unknown) => 
  Schema.decodeUnknown(AsyncAPIObjectSchema)(data)

export const validateServerObject = (data: unknown) => 
  Schema.decodeUnknown(ServerObjectSchema)(data)

export const validateChannelObject = (data: unknown) => 
  Schema.decodeUnknown(ChannelObjectSchema)(data)

export const validateOperationObject = (data: unknown) => 
  Schema.decodeUnknown(OperationObjectSchema)(data)

export const validateMessageObject = (data: unknown) => 
  Schema.decodeUnknown(MessageObjectSchema)(data)

export const validateSchemaObject = (data: unknown) => 
  Schema.decodeUnknown(SchemaObjectSchema)(data)

export const validateSecuritySchemeObject = (data: unknown) => 
  Schema.decodeUnknown(SecuritySchemeObjectSchema)(data)