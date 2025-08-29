import { Schema, JSONSchema } from "@effect/schema";
import { Effect } from "effect";
import type { AsyncAPIEmitterOptions } from "./types/options.js";
import { validatePathTemplate } from "./path-templates.js";

// Export the interface type
export type { AsyncAPIEmitterOptions };

// EFFECT.TS SCHEMA DEFINITIONS - Type-safe validation with comprehensive error handling


/**
 * Variable configuration schema for server variables
 */
const VariableConfigSchema = Schema.Struct({
  description: Schema.optional(Schema.String),
  default: Schema.optional(Schema.String),
  enum: Schema.optional(Schema.Array(Schema.String)),
  examples: Schema.optional(Schema.Array(Schema.String))
});

/**
 * OAuth flow configuration schema
 */
const OAuthFlowConfigSchema = Schema.Struct({
  authorizationUrl: Schema.optional(Schema.String),
  tokenUrl: Schema.optional(Schema.String),
  refreshUrl: Schema.optional(Schema.String),
  availableScopes: Schema.optional(Schema.Record({
    key: Schema.String,
    value: Schema.String
  }))
});

/**
 * OAuth flows configuration schema
 */
const OAuthFlowsConfigSchema = Schema.Struct({
  implicit: Schema.optional(OAuthFlowConfigSchema),
  password: Schema.optional(OAuthFlowConfigSchema),
  clientCredentials: Schema.optional(OAuthFlowConfigSchema),
  authorizationCode: Schema.optional(OAuthFlowConfigSchema)
});

/**
 * Security scheme configuration schema with branded types
 */
const SecuritySchemeConfigSchema = Schema.Struct({
  type: Schema.Literal("oauth2", "apiKey", "httpApiKey", "http", "plain", "scram-sha-256", "scram-sha-512", "gssapi"),
  description: Schema.optional(Schema.String),
  name: Schema.optional(Schema.String),
  in: Schema.optional(Schema.Literal("user", "password", "query", "header", "cookie")),
  scheme: Schema.optional(Schema.String),
  bearerFormat: Schema.optional(Schema.String),
  flows: Schema.optional(OAuthFlowsConfigSchema)
});

/**
 * Server configuration schema
 */
const ServerConfigSchema = Schema.Struct({
  host: Schema.String,
  protocol: Schema.String,
  description: Schema.optional(Schema.String),
  variables: Schema.optional(Schema.Record({
    key: Schema.String,
    value: VariableConfigSchema
  })),
  security: Schema.optional(Schema.Array(Schema.String)),
  bindings: Schema.optional(Schema.Record({
    key: Schema.String,
    value: Schema.Unknown
  }))
});

/**
 * Versioning configuration schema
 */
const VersioningConfigSchema = Schema.Struct({
  "separate-files": Schema.optional(Schema.Boolean),
  "file-naming": Schema.optional(Schema.Literal("suffix", "directory", "prefix")),
  "include-version-info": Schema.optional(Schema.Boolean),
  "version-mappings": Schema.optional(Schema.Record({
    key: Schema.String,
    value: Schema.String
  })),
  "validate-version-compatibility": Schema.optional(Schema.Boolean)
});

/**
 * Main AsyncAPI Emitter Options Schema with Effect.TS
 * 
 * SECURITY: All schemas prevent arbitrary property injection through strict validation
 * TYPE SAFETY: Compile-time and runtime validation with comprehensive error messages
 */
export const AsyncAPIEmitterOptionsEffectSchema = Schema.Struct({
  "output-file": Schema.optional(Schema.String.pipe(
    Schema.filter((value) => {
      // If it has template variables, validate them
      if (value.includes("{")) {
        const validation = validatePathTemplate(value);
        return validation.isValid;
      }
      // If no template variables, it's valid
      return true;
    }, {
      message: (value) => {
        const validation = validatePathTemplate(value);
        return validation.errors.length > 0 
          ? `Invalid path template: ${validation.errors.join("; ")}`
          : "Invalid path template";
      }
    })
  ).annotations({
    description: "Name of the output file. Supports template variables: {cmd}, {project-root}, {emitter-name}, {output-dir}. Default: 'asyncapi.yaml'"
  })),
  
  "file-type": Schema.optional(Schema.Literal("yaml", "json").annotations({
    description: "Output file type. Default: 'yaml'"
  })),
  
  "asyncapi-version": Schema.optional(Schema.Literal("3.0.0").annotations({
    description: "AsyncAPI version to target. Default: '3.0.0'"
  })),
  
  "omit-unreachable-types": Schema.optional(Schema.Boolean.annotations({
    description: "Whether to omit unreachable message types. Default: false"
  })),
  
  "include-source-info": Schema.optional(Schema.Boolean.annotations({
    description: "Whether to include TypeSpec source information in comments. Default: false"
  })),
  
  "default-servers": Schema.optional(Schema.Record({
    key: Schema.String,
    value: ServerConfigSchema
  }).annotations({
    description: "Custom servers to include in the output"
  })),
  
  "validate-spec": Schema.optional(Schema.Boolean.annotations({
    description: "Whether to validate generated AsyncAPI spec. Default: true"
  })),
  
  "additional-properties": Schema.optional(Schema.Record({
    key: Schema.String,
    value: Schema.Unknown
  }).annotations({
    description: "Additional schema properties to include"
  })),
  
  "protocol-bindings": Schema.optional(Schema.Array(
    Schema.Literal("kafka", "amqp", "websocket", "http")
  ).annotations({
    description: "Protocol bindings to include"
  })),
  
  "security-schemes": Schema.optional(Schema.Record({
    key: Schema.String,
    value: SecuritySchemeConfigSchema
  }).annotations({
    description: "Security schemes configuration"
  })),
  
  "versioning": Schema.optional(VersioningConfigSchema.annotations({
    description: "Versioning configuration"
  }))
});

// VALIDATION FUNCTIONS - Effect.TS powered validation with comprehensive error handling

/**
 * Parse and validate AsyncAPI emitter options with Effect.TS
 * Returns Effect that either succeeds with validated options or fails with detailed errors
 */
export const parseAsyncAPIEmitterOptions = (input: unknown) =>
  Schema.decodeUnknown(AsyncAPIEmitterOptionsEffectSchema)(input);

// TYPE CONVERSION UTILITIES - Handle readonly/optional property differences

interface VersioningConfigInput {
  "separate-files"?: boolean;
  "file-naming"?: "suffix" | "directory" | "prefix";
  "include-version-info"?: boolean;
  "version-mappings"?: Record<string, string>;
  "validate-version-compatibility"?: boolean;
}

const convertVersioningConfig = (input: VersioningConfigInput | undefined): VersioningConfigInput | undefined => {
  if (!input) return input;
  
  const result: VersioningConfigInput = {};
  if (input["separate-files"] !== undefined) result["separate-files"] = input["separate-files"];
  if (input["file-naming"] !== undefined) result["file-naming"] = input["file-naming"];
  if (input["include-version-info"] !== undefined) result["include-version-info"] = input["include-version-info"];
  if (input["version-mappings"] !== undefined) {
    result["version-mappings"] = { ...input["version-mappings"] };
  }
  if (input["validate-version-compatibility"] !== undefined) {
    result["validate-version-compatibility"] = input["validate-version-compatibility"];
  }
  
  return result;
};

interface ServerConfigInput {
  host: string;
  protocol: string;
  description?: string;
  variables?: Record<string, {
    description?: string;
    default?: string;
    enum?: string[];
    examples?: string[];
  }>;
  security?: string[];
  bindings?: Record<string, unknown>;
}

const convertServerConfig = (input: ServerConfigInput | undefined): ServerConfigInput | undefined => {
  if (!input) return input;
  
  const result: ServerConfigInput = {
    host: input.host,
    protocol: input.protocol
  };
  
  if (input.description !== undefined) result.description = input.description;
  if (input.variables !== undefined) {
    result.variables = Object.fromEntries(
      Object.entries(input.variables).map(([key, value]) => [
        key,
        {
          ...(value.description !== undefined && { description: value.description }),
          ...(value.default !== undefined && { default: value.default }),
          ...(value.enum !== undefined && { enum: [...value.enum] }),
          ...(value.examples !== undefined && { examples: [...value.examples] })
        }
      ])
    );
  }
  if (input.security !== undefined) result.security = [...input.security];
  if (input.bindings !== undefined) result.bindings = { ...input.bindings };
  
  return result;
};

interface SecuritySchemeConfigInput {
  type: "oauth2" | "apiKey" | "httpApiKey" | "http" | "plain" | "scram-sha-256" | "scram-sha-512" | "gssapi";
  description?: string;
  name?: string;
  in?: "user" | "password" | "query" | "header" | "cookie";
  scheme?: string;
  bearerFormat?: string;
  flows?: Record<string, {
    authorizationUrl?: string;
    tokenUrl?: string;
    refreshUrl?: string;
    availableScopes?: Record<string, string>;
  }>;
}

const convertSecuritySchemeConfig = (input: SecuritySchemeConfigInput | undefined): SecuritySchemeConfigInput | undefined => {
  if (!input) return input;
  
  const result: SecuritySchemeConfigInput = { type: input.type };
  
  if (input.description !== undefined) result.description = input.description;
  if (input.name !== undefined) result.name = input.name;
  if (input.in !== undefined) result.in = input.in;
  if (input.scheme !== undefined) result.scheme = input.scheme;
  if (input.bearerFormat !== undefined) result.bearerFormat = input.bearerFormat;
  if (input.flows !== undefined) {
    result.flows = Object.fromEntries(
      Object.entries(input.flows).map(([flowType, flowConfig]) => [
        flowType,
        {
          ...(flowConfig.authorizationUrl !== undefined && { authorizationUrl: flowConfig.authorizationUrl }),
          ...(flowConfig.tokenUrl !== undefined && { tokenUrl: flowConfig.tokenUrl }),
          ...(flowConfig.refreshUrl !== undefined && { refreshUrl: flowConfig.refreshUrl }),
          ...(flowConfig.availableScopes !== undefined && { availableScopes: { ...flowConfig.availableScopes } })
        }
      ])
    );
  }
  
  return result;
};

/**
 * Validate AsyncAPI emitter options with detailed error messages
 * For use in TypeSpec emitter integration
 */
export const validateAsyncAPIEmitterOptions = (input: unknown): Effect.Effect<AsyncAPIEmitterOptions, string> =>
  Effect.gen(function* () {
    const result = yield* Schema.decodeUnknown(AsyncAPIEmitterOptionsEffectSchema)(input);
    
    // Convert readonly properties with undefined to optional properties
    const converted: AsyncAPIEmitterOptions = {};
    
    if (result["output-file"] !== undefined) {
      converted["output-file"] = result["output-file"];
    }
    if (result["file-type"] !== undefined) {
      converted["file-type"] = result["file-type"];
    }
    if (result["asyncapi-version"] !== undefined) {
      converted["asyncapi-version"] = result["asyncapi-version"];
    }
    if (result["omit-unreachable-types"] !== undefined) {
      converted["omit-unreachable-types"] = result["omit-unreachable-types"];
    }
    if (result["include-source-info"] !== undefined) {
      converted["include-source-info"] = result["include-source-info"];
    }
    if (result["default-servers"] !== undefined) {
      converted["default-servers"] = Object.fromEntries(
        Object.entries(result["default-servers"]).map(([key, value]) => [
          key,
          convertServerConfig(value)
        ])
      );
    }
    if (result["validate-spec"] !== undefined) {
      converted["validate-spec"] = result["validate-spec"];
    }
    if (result["additional-properties"] !== undefined) {
      converted["additional-properties"] = { ...result["additional-properties"] };
    }
    if (result["protocol-bindings"] !== undefined) {
      converted["protocol-bindings"] = [...result["protocol-bindings"]];
    }
    if (result["security-schemes"] !== undefined) {
      converted["security-schemes"] = Object.fromEntries(
        Object.entries(result["security-schemes"]).map(([key, value]) => [
          key,
          convertSecuritySchemeConfig(value)
        ])
      );
    }
    if (result["versioning"] !== undefined) {
      converted["versioning"] = convertVersioningConfig(result["versioning"]);
    }
    
    return converted;
  }).pipe(
    Effect.mapError(error => `AsyncAPI Emitter Options Validation Error: ${error}`)
  );

// TYPESPEC COMPATIBILITY BRIDGE - Convert Effect.TS Schema to JSONSchema format

/**
 * JSON Schema representation for TypeSpec compatibility
 * Generated from Effect.TS Schema but maintains TypeSpec compiler compatibility
 * 
 * CRITICAL: This bridges Effect.TS validation with TypeSpec's expected JSONSchemaType format
 */
export const AsyncAPIEmitterOptionsSchema = (() => {
  try {
    // Convert Effect.TS Schema to JSON Schema format for TypeSpec compatibility
    const jsonSchema = JSONSchema.make(AsyncAPIEmitterOptionsEffectSchema);
    
    // Return JSON Schema with TypeSpec-compatible structure
    return {
      ...jsonSchema,
      type: "object",
      additionalProperties: false, // SECURITY: prevent arbitrary property injection
    };
  } catch (error) {
    // Fallback to manual JSON Schema if conversion fails
    return {
      type: "object",
      additionalProperties: false,
      properties: {
        "output-file": { type: "string", nullable: true },
        "file-type": { type: "string", enum: ["yaml", "json"], nullable: true },
        "asyncapi-version": { type: "string", enum: ["3.0.0"], nullable: true },
        "omit-unreachable-types": { type: "boolean", nullable: true },
        "include-source-info": { type: "boolean", nullable: true },
        "default-servers": { type: "object", additionalProperties: true, nullable: true },
        "validate-spec": { type: "boolean", nullable: true },
        "additional-properties": { type: "object", additionalProperties: true, nullable: true },
        "protocol-bindings": { 
          type: "array", 
          items: { type: "string", enum: ["kafka", "amqp", "websocket", "http"] },
          nullable: true 
        },
        "security-schemes": { type: "object", additionalProperties: true, nullable: true },
        "versioning": { type: "object", additionalProperties: false, nullable: true }
      }
    };
  }
})();

// UTILITY FUNCTIONS - Production-ready helpers

/**
 * Create validated AsyncAPI emitter options with defaults
 * Returns Effect that provides fully validated configuration
 */
export const createAsyncAPIEmitterOptions = (input: Partial<AsyncAPIEmitterOptions> = {}) =>
  Effect.gen(function* () {
    const defaults: AsyncAPIEmitterOptions = {
      "output-file": "asyncapi",
      "file-type": "yaml",
      "asyncapi-version": "3.0.0",
      "omit-unreachable-types": false,
      "include-source-info": false,
      "validate-spec": true
    };
    
    const merged = { ...defaults, ...input };
    const validated = yield* validateAsyncAPIEmitterOptions(merged);
    
    return validated;
  });

/**
 * Runtime type guard for AsyncAPI emitter options
 * Uses Effect.TS validation for type safety
 */
export const isAsyncAPIEmitterOptions = (input: unknown): input is AsyncAPIEmitterOptions =>
  Effect.runSync(
    Effect.gen(function* () {
      yield* parseAsyncAPIEmitterOptions(input);
      return true;
    }).pipe(
      Effect.catchAll(() => Effect.succeed(false))
    )
  );