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

import { z } from "@effect/schema"
import type { AsyncAPIObject, ServerObject, ChannelObject, OperationObject, MessageObject, SchemaObject, SecuritySchemeObject } from "../types/branded-types.js"

/**
 * Schema for AsyncAPI version validation
 * Ensures version follows semantic versioning
 */
export const AsyncAPIVersionSchema = Z.string().refine(
  (version) => {
    const versionRegex = /^(\d+)\.(\d+)\.(\d+)(-.+)?$/
    return versionRegex.test(version)
  },
  {
    message: "Invalid AsyncAPI version format. Expected semantic version (e.g., 3.0.0, 2.1.0)"
  }
)

/**
 * Schema for info section validation
 * Validates required fields and formats
 */
export const InfoSectionSchema = Z.object({
  title: Z.string().min(1, "Title is required and cannot be empty"),
  version: Z.string().min(1, "Version is required and cannot be empty"),
  description: Z.string().optional(),
  termsOfService: Z.string().url().optional(),
  contact: Z.object({
    name: Z.string().min(1, "Contact name is required"),
    url: Z.string().url().optional(),
    email: Z.string().email().optional()
  }).optional(),
  license: Z.object({
    name: Z.string().min(1, "License name is required"),
    url: Z.string().url().optional(),
    identifier: Z.string().optional()
  }).optional()
}).strict()

/**
 * Schema for server URL validation
 * Validates URL format and accessibility
 */
export const ServerURLSchema = Z.string().refine(
  (url) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },
  {
    message: "Invalid URL format"
  }
).url("Invalid URL format")

/**
 * Schema for server protocol validation
 * Validates against supported AsyncAPI protocols
 */
export const ServerProtocolSchema = Z.enum(["amqp", "amqps", "http", "https", "kafka", "mqtt", "secure-mqtt", "mqtt5", "redis", "nats", "stomp", "stomps", "ws", "wss", "wssecures"])

/**
 * Schema for server object validation
 * Validates server configuration with type safety
 */
export const ServerObjectSchema: Z.ZodType<ServerObject> = Z.object({
  name: Z.string().min(1, "Server name is required and cannot be empty"),
  url: ServerURLSchema,
  protocol: ServerProtocolSchema,
  description: Z.string().optional(),
  variables: Z.record(Z.string(), Z.string()).optional(),
  security: Z.array(Z.string()).optional(),
  bindings: Z.record(Z.string(), Z.any()).optional()
}).strict()

/**
 * Schema for channel address validation
 * Validates channel address patterns and formats
 */
export const ChannelAddressSchema = Z.string().refine(
  (address) => {
    // Validate channel address doesn't contain invalid characters
    const invalidChars = /[<>{}[\]\\'"`]/g
    return !invalidChars.test(address)
  },
  {
    message: "Channel address contains invalid characters"
  }
).min(1, "Channel address cannot be empty")

/**
 * Schema for channel object validation
 * Validates channel configuration with type safety
 */
export const ChannelObjectSchema: Z.ZodType<ChannelObject> = Z.object({
  address: ChannelAddressSchema,
  title: Z.string().optional(),
  description: Z.string().optional(),
  summary: Z.string().optional(),
  tags: Z.array(Z.string()).optional(),
  parameters: Z.record(Z.string(), Z.any()).optional(),
  messages: Z.record(Z.string(), Z.any()).optional(),
  bindings: Z.record(Z.string(), Z.any()).optional()
}).strict()

/**
 * Schema for operation action validation
 * Validates against AsyncAPI operation actions
 */
export const OperationActionSchema = Z.enum(["send", "receive", "reply"])

/**
 * Schema for operation object validation
 * Validates operation configuration with type safety
 */
export const OperationObjectSchema: Z.ZodType<OperationObject> = Z.object({
  action: OperationActionSchema,
  title: Z.string().optional(),
  description: Z.string().optional(),
  summary: Z.string().optional(),
  tags: Z.array(Z.string()).optional(),
  bindings: Z.record(Z.string(), Z.any()).optional()
}).strict()

/**
 * Schema for message content-type validation
 * Validates MIME type formats
 */
export const MessageContentTypeSchema = Z.string().refine(
  (contentType) => {
    const contentTypeRegex = /^[a-zA-Z0-9][a-zA-Z0-9!#$&\']*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\'*\.-]*$/
    return contentTypeRegex.test(contentType)
  },
  {
    message: "Invalid content-type format. Expected format like 'application/json', 'text/plain'"
  }
)

/**
 * Schema for message object validation
 * Validates message configuration with type safety
 */
export const MessageObjectSchema: Z.ZodType<MessageObject> = Z.object({
  title: Z.string().optional(),
  summary: Z.string().optional(),
  description: Z.string().optional(),
  contentType: MessageContentTypeSchema,
  payload: Z.string().optional(),
  headers: Z.record(Z.string(), Z.string()).optional(),
  tags: Z.array(Z.string()).optional(),
  bindings: Z.record(Z.string(), Z.any()).optional(),
  examples: Z.array(Z.any()).optional()
}).strict()

/**
 * Schema for property type validation
 * Validates against AsyncAPI property types
 */
export const PropertyTypeSchema = Z.enum([
  "string", "number", "integer", "boolean", "array", "object", "null"
])

/**
 * Schema for schema object property validation
 * Validates schema property configuration
 */
export const SchemaPropertySchema = Z.object({
  type: PropertyTypeSchema,
  description: Z.string().optional(),
  title: Z.string().optional(),
  format: Z.string().optional(),
  default: Z.any().optional(),
  enum: Z.array(Z.string()).optional(),
  items: Z.any().optional(),
  properties: Z.record(Z.string(), Z.any()).optional(),
  required: Z.array(Z.string()).optional(),
  nullable: Z.boolean().optional(),
  writeOnly: Z.boolean().optional(),
  readOnly: Z.boolean().optional(),
  deprecated: Z.boolean().optional(),
  allOf: Z.array(Z.any()).optional(),
  oneOf: Z.array(Z.any()).optional(),
  anyOf: Z.array(Z.any()).optional(),
  not: Z.any().optional()
}).optional()

/**
 * Schema for schema object validation
 * Validates schema configuration with type safety
 */
export const SchemaObjectSchema: Z.ZodType<SchemaObject> = Z.object({
  type: PropertyTypeSchema,
  title: Z.string().optional(),
  description: Z.string().optional(),
  default: Z.any().optional(),
  enum: Z.array(Z.string()).optional(),
  items: Z.any().optional(),
  properties: Z.record(Z.string(), SchemaPropertySchema).optional(),
  required: Z.array(Z.string()).optional(),
  nullable: Z.boolean().optional(),
  writeOnly: Z.boolean().optional(),
  readOnly: Z.boolean().optional(),
  deprecated: Z.boolean().optional(),
  allOf: Z.array(Z.any()).optional(),
  oneOf: Z.array(Z.any()).optional(),
  anyOf: Z.array(Z.any()).optional(),
  not: Z.any().optional(),
  example: Z.any().optional(),
  components: Z.record(Z.string(), Z.any()).optional()
}).strict()

/**
 * Schema for security scheme type validation
 * Validates against AsyncAPI security scheme types
 */
export const SecuritySchemeTypeSchema = Z.enum([
  "apiKey",
  "oauth2",
  "openIdConnect",
  "http",
  "httpApiKey",
  "tls",
  "userPassword"
])

/**
 * Schema for API key security scheme validation
 */
export const ApiKeySecuritySchemeSchema = Z.object({
  type: Z.literal("apiKey"),
  description: Z.string().optional(),
  name: Z.string().min(1, "Security scheme name is required"),
  in: Z.enum(["header", "query"]),
  scheme: Z.string().optional(),
  bearerFormat: Z.string().optional(),
  apiKeyLocation: Z.string().optional(),
  "x-api-key-location": Z.string().optional()
}).strict()

/**
 * Schema for OAuth2 security scheme validation
 */
export const OAuth2SecuritySchemeSchema = Z.object({
  type: Z.literal("oauth2"),
  description: Z.string().optional(),
  name: Z.string().min(1, "OAuth2 scheme name is required"),
  in: Z.enum(["header", "query"]).optional(),
  flows: Z.object({
    implicit: Z.object({
      authorizationUrl: Z.string().url("Invalid authorization URL").optional(),
      tokenUrl: Z.string().url("Invalid token URL").optional(),
      refreshUrl: Z.string().url("Invalid refresh URL").optional(),
      scopes: Z.array(Z.string()).optional()
    }).optional(),
    password: Z.object({
      tokenUrl: Z.string().url("Invalid token URL").optional(),
      refreshUrl: Z.string().url("Invalid refresh URL").optional(),
      scopes: Z.array(Z.string()).optional()
    }).optional(),
    authorizationCode: Z.object({
      authorizationUrl: Z.string().url("Invalid authorization URL").optional(),
      tokenUrl: Z.string().url("Invalid token URL").optional(),
      refreshUrl: Z.string().url("Invalid refresh URL").optional(),
      scopes: Z.array(Z.string()).optional()
    }).optional(),
    clientCredentials: Z.object({
      tokenUrl: Z.string().url("Invalid token URL").optional(),
      scopes: Z.array(Z.string()).optional()
    }).optional()
  }).optional()
}).strict()

/**
 * Schema for HTTP security scheme validation
 */
export const HttpSecuritySchemeSchema = Z.object({
  type: Z.literal("http"),
  description: Z.string().optional(),
  name: Z.string().min(1, "HTTP security scheme name is required"),
  scheme: Z.string().optional(),
  bearerFormat: Z.string().optional()
}).strict()

/**
 * Schema for security scheme object validation
 * Validates security scheme configuration with type safety
 */
export const SecuritySchemeObjectSchema: Z.ZodType<SecuritySchemeObject> = Z.discriminatedUnion("type", [
  ApiKeySecuritySchemeSchema,
  OAuth2SecuritySchemeSchema,
  HttpSecuritySchemeSchema
])

/**
 * Schema for security schemes validation
 * Validates all security scheme configurations
 */
export const SecuritySchemesSchema = Z.record(Z.string(), SecuritySchemeObjectSchema).optional()

/**
 * Complete AsyncAPI object schema validation
 * Validates complete AsyncAPI specification with type safety
 */
export const AsyncAPIObjectSchema: Z.ZodType<AsyncAPIObject> = Z.object({
  asyncapi: AsyncAPIVersionSchema,
  info: InfoSectionSchema,
  servers: Z.record(Z.string(), ServerObjectSchema).optional(),
  channels: Z.record(Z.string(), ChannelObjectSchema),
  components: Z.object({
    messages: Z.record(Z.string(), MessageObjectSchema).optional(),
    schemas: Z.record(Z.string(), SchemaObjectSchema).optional(),
    securitySchemes: SecuritySchemesSchema,
    parameters: Z.record(Z.string(), Z.any()).optional()
  }).optional(),
  tags: Z.array(Z.object({
    name: Z.string().min(1, "Tag name is required"),
    description: Z.string().optional(),
    externalDocs: Z.object({
      url: Z.string().url().optional(),
      description: Z.string().optional()
    }).optional()
  })).optional()
}).strict()

/**
 * Validation result interface
 * Contains validation success status and detailed error information
 */
export interface ValidationResult {
  readonly isValid: boolean
  readonly errors: Array<{
    readonly path: string
    readonly message: string
    readonly code: string
    readonly severity: "error" | "warning" | "info"
  }>
  readonly warnings: Array<{
    readonly path: string
    readonly message: string
    readonly code: string
    readonly severity: "error" | "warning" | "info"
  }>
  readonly summary: {
    readonly totalErrors: number
    readonly totalWarnings: number
    readonly totalInfo: number
    readonly severity: "error" | "warning" | "info"
  }
}

/**
 * Runtime Validator for AsyncAPI specifications
 * Provides comprehensive validation with detailed error reporting
 */
export class RuntimeValidator {
  private static readonly schemas = {
    asyncapi: AsyncAPIObjectSchema,
    info: InfoSectionSchema,
    server: ServerObjectSchema,
    channel: ChannelObjectSchema,
    operation: OperationObjectSchema,
    message: MessageObjectSchema,
    schema: SchemaObjectSchema,
    securityScheme: SecuritySchemeObjectSchema
  }

  /**
   * Validate complete AsyncAPI specification
   * Validates the entire specification with detailed error reporting
   */
  static validateAsyncAPIObject(data: unknown): ValidationResult {
    const errors: Array<{path: string; message: string; code: string; severity: "error" | "warning" | "info"}> = []
    const warnings: Array<{path: string; message: string; code: string; severity: "error" | "warning" | "info"}> = []

    // Use safeParse for detailed error reporting
    const parseResult = AsyncAPIObjectSchema.safeParse(data)
    
    if (!parseResult.success) {
      errors.push({
        path: "root",
        message: parseResult.error.message,
        code: "VALIDATION_FAILED",
        severity: "error"
      })
      
      // Try to extract path information from error
      const pathInfo = this.extractPathFromError(parseResult.error)
      if (pathInfo) {
        errors[errors.length - 1].path = pathInfo
      }
    }

    // Count errors and determine overall severity
    const totalErrors = errors.length
    const totalWarnings = warnings.length
    const totalInfo = 0

    // Determine overall severity
    let severity: "error" | "warning" | "info" = "info"
    if (totalErrors > 0) severity = "error"
    else if (totalWarnings > 0) severity = "warning"

    return {
      isValid: totalErrors === 0,
      errors,
      warnings,
      summary: {
        totalErrors,
        totalWarnings,
        totalInfo,
        severity
      }
    }
  }

  /**
   * Validate specific schema with detailed error reporting
   */
  static validateSchema<T>(schema: Z.ZodType<T>, data: unknown, path: string = ""): ValidationResult {
    const errors: Array<{path: string; message: string; code: string; severity: "error" | "warning" | "info"}> = []
    const warnings: Array<{path: string; message: string; code: string; severity: "error" | "warning" | "info"}> = []

    const parseResult = schema.safeParse(data)
    
    if (!parseResult.success) {
      errors.push({
        path: path || "unknown",
        message: parseResult.error.message,
        code: "SCHEMA_VALIDATION_FAILED",
        severity: "error"
      })
    }

    const totalErrors = errors.length
    const totalWarnings = warnings.length
    const totalInfo = 0

    let severity: "error" | "warning" | "info" = "info"
    if (totalErrors > 0) severity = "error"
    else if (totalWarnings > 0) severity = "warning"

    return {
      isValid: totalErrors === 0,
      errors,
      warnings,
      summary: {
        totalErrors,
        totalWarnings,
        totalInfo,
        severity
      }
    }
  }

  /**
   * Validate server configuration with detailed error reporting
   */
  static validateServer(data: unknown, serverName?: string): ValidationResult {
    return this.validateSchema(ServerObjectSchema, data, serverName ? `servers.${serverName}` : "servers")
  }

  /**
   * Validate channel configuration with detailed error reporting
   */
  static validateChannel(data: unknown, channelName?: string): ValidationResult {
    return this.validateSchema(ChannelObjectSchema, data, channelName ? `channels.${channelName}` : "channels")
  }

  /**
   * Validate operation configuration with detailed error reporting
   */
  static validateOperation(data: unknown, operationName?: string): ValidationResult {
    return this.validateSchema(OperationObjectSchema, data, operationName ? `operations.${operationName}` : "operations")
  }

  /**
   * Validate message configuration with detailed error reporting
   */
  static validateMessage(data: unknown, messageName?: string): ValidationResult {
    return this.validateSchema(MessageObjectSchema, data, messageName ? `messages.${messageName}` : "messages")
  }

  /**
   * Validate schema configuration with detailed error reporting
   */
  static validateSchema(data: unknown, schemaName?: string): ValidationResult {
    return this.validateSchema(SchemaObjectSchema, data, schemaName ? `components.schemas.${schemaName}` : "components.schemas")
  }

  /**
   * Validate security scheme configuration with detailed error reporting
   */
  static validateSecurityScheme(data: unknown, schemeName?: string): ValidationResult {
    return this.validateSchema(SecuritySchemeObjectSchema, data, schemeName ? `components.securitySchemes.${schemeName}` : "components.securitySchemes")
  }

  /**
   * Extract path information from validation errors
   */
  private static extractPathFromError(error: unknown): string | null {
    if (error && typeof error === "object") {
      const errorObj = error as any
      if ("path" in errorObj) {
        return errorObj.path
      }
      if ("issue" in errorObj) {
        return errorObj.issue?.path || null
      }
    }
    return null
  }

  /**
   * Create validation summary with detailed reporting
   */
  static createSummary(results: ValidationResult[]): {
    totalSpecs: number
    validSpecs: number
    invalidSpecs: number
    totalErrors: number
    totalWarnings: number
    totalInfo: number
    overallSeverity: "error" | "warning" | "info"
    results: ValidationResult[]
  } {
    const totalSpecs = results.length
    const validSpecs = results.filter(r => r.isValid).length
    const invalidSpecs = results.filter(r => !r.isValid).length
    
    const totalErrors = results.reduce((sum, result) => sum + result.summary.totalErrors, 0)
    const totalWarnings = results.reduce((sum, result) => sum + result.summary.totalWarnings, 0)
    const totalInfo = results.reduce((sum, result) => sum + result.summary.totalInfo, 0)

    // Determine overall severity
    let overallSeverity: "error" | "warning" | "info" = "info"
    if (totalErrors > 0) overallSeverity = "error"
    else if (totalWarnings > 0) overallSeverity = "warning"

    return {
      totalSpecs,
      validSpecs,
      invalidSpecs,
      totalErrors,
      totalWarnings,
      totalInfo,
      overallSeverity,
      results
    }
  }

  /**
   * Validate multiple AsyncAPI specifications
   */
  static validateMultipleSpecs(data: unknown[]): ValidationResult[] {
    return data.map(spec => this.validateAsyncAPIObject(spec))
  }

  /**
   * Get schema for specific type
   */
  static getSchema(type: keyof typeof RuntimeValidator.schemas) {
    return RuntimeValidator.schemas[type]
  }
}

/**
 * Runtime validator factory
 * Creates instances of runtime validators for different purposes
 */
export class ValidatorFactory {
  /**
   * Create validator for AsyncAPI specification validation
   */
  static createAsyncAPIValidator() {
    return new AsyncAPIValidator()
  }

  /**
   * Create validator for server validation
   */
  static createServerValidator() {
    return new ServerValidator()
  }

  /**
   * Create validator for channel validation
   */
  static createChannelValidator() {
    return new ChannelValidator()
  }

  /**
   * Create validator for operation validation
   */
  static createOperationValidator() {
    return new OperationValidator()
  }

  /**
   * Create validator for message validation
   */
  static createMessageValidator() {
    return new MessageValidator()
  }

  /**
   * Create validator for schema validation
   */
  static createSchemaValidator() {
    return new SchemaValidator()
  }

  /**
   * Create validator for security scheme validation
   */
  static createSecuritySchemeValidator() {
    return new SecuritySchemeValidator()
  }
}

/**
 * AsyncAPI specification validator
 */
export class AsyncAPIValidator {
  /**
   * Validate AsyncAPI specification
   */
  validate(data: unknown): ValidationResult {
    return RuntimeValidator.validateAsyncAPIObject(data)
  }

  /**
   * Validate multiple specifications
   */
  validateMultiple(data: unknown[]): ValidationResult[] {
    return RuntimeValidator.validateMultipleSpecs(data)
  }

  /**
   * Get validation summary
   */
  getSummary(results: ValidationResult[]) {
    return RuntimeValidator.createSummary(results)
  }
}

/**
 * Server validator
 */
export class ServerValidator {
  /**
   * Validate server configuration
   */
  validate(data: unknown): ValidationResult {
    return RuntimeValidator.validateServer(data)
  }
}

/**
 * Channel validator
 */
export class ChannelValidator {
  /**
   * Validate channel configuration
   */
  validate(data: unknown): ValidationResult {
    return RuntimeValidator.validateChannel(data)
  }
}

/**
 * Operation validator
 */
export class OperationValidator {
  /**
   * Validate operation configuration
   */
  validate(data: unknown): ValidationResult {
    return RuntimeValidator.validateOperation(data)
  }
}

/**
 * Message validator
 */
export class MessageValidator {
  /**
   * Validate message configuration
   */
  validate(data: unknown): ValidationResult {
    return RuntimeValidator.validateMessage(data)
  }
}

/**
 * Schema validator
 */
export class SchemaValidator {
  /**
   * Validate schema configuration
   */
  validate(data: unknown): ValidationResult {
    return RuntimeValidator.validateSchema(data)
  }
}

/**
 * Security scheme validator
 */
export class SecuritySchemeValidator {
  /**
   * Validate security scheme configuration
   */
  validate(data: unknown): ValidationResult {
    return RuntimeValidator.validateSecurityScheme(data)
  }
}

/**
 * Validation error types
 */
export const ValidationErrors = {
  InvalidVersion: "INVALID_VERSION",
  InvalidTitle: "INVALID_TITLE", 
  InvalidURL: "INVALID_URL",
  InvalidProtocol: "INVALID_PROTOCOL",
  InvalidFormat: "INVALID_FORMAT",
  MissingRequiredField: "MISSING_REQUIRED_FIELD",
  InvalidType: "INVALID_TYPE",
  ValidationFailed: "VALIDATION_FAILED",
  SchemaValidationFailed: "SCHEMA_VALIDATION_FAILED"
} as const

/**
 * Validation error codes
 */
export const ValidationCodes = {
  INVALID_ASYNCAPI_VERSION: "INVALID_ASYNCAPI_VERSION",
  INVALID_INFO_TITLE: "INVALID_INFO_TITLE",
  INVALID_INFO_VERSION: "INVALID_INFO_VERSION",
  INVALID_SERVER_URL: "INVALID_SERVER_URL",
  INVALID_SERVER_PROTOCOL: "INVALID_SERVER_PROTOCOL",
  INVALID_CHANNEL_ADDRESS: "INVALID_CHANNEL_ADDRESS",
  INVALID_OPERATION_ACTION: "INVALID_OPERATION_ACTION",
  INVALID_MESSAGE_CONTENT_TYPE: "INVALID_MESSAGE_CONTENT_TYPE",
  INVALID_SCHEMA_TYPE: "INVALID_SCHEMA_TYPE",
  INVALID_SECURITY_SCHEME_TYPE: "INVALID_SECURITY_SCHEME_TYPE"
} as const

/**
 * Validation severity levels
 */
export const ValidationSeverity = {
  ERROR: "error",
  WARNING: "warning",
  INFO: "info"
} as const