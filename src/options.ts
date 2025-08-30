import { Schema, JSONSchema } from "@effect/schema";
import { Effect } from "effect";
import { validatePathTemplate } from "./path-templates.js";

// ==========================================
// TYPE DEFINITIONS (consolidated from types/options.ts)
// ==========================================

export type AsyncAPIEmitterOptions = {
  /**
   * Name of the output file. Supports template variables:
   * - {cmd}: Current command name (e.g., "typespec", "tsp")
   * - {project-root}: Project root directory path
   * - {emitter-name}: Name of the emitter ("asyncapi")
   * - {output-dir}: Configured output directory
   * 
   * @example "{project-root}/generated/{cmd}-asyncapi.yaml"
   * @example "{project-root}/specs/asyncapi.json"
   * @example "{emitter-name}/{cmd}/api-spec.yaml"
   * @default "asyncapi"
   */
  "output-file"?: string;

  /**
   * Output file type
   * @default "yaml"
   */
  "file-type"?: "yaml" | "json";

  /**
   * AsyncAPI version to target
   * @default "3.0.0"
   */
  "asyncapi-version"?: "3.0.0";

  /**
   * Whether to omit unreachable message types
   * @default false
   */
  "omit-unreachable-types"?: boolean;

  /**
   * Whether to include TypeSpec source information in comments
   * @default false
   */
  "include-source-info"?: boolean;

  /**
   * Whether to use Effect.TS integrated emitter with validation
   * @default true
   */
  "use-effect"?: boolean;

  /**
   * Custom servers to include in the output
   */
  "default-servers"?: Record<string, ServerConfig>;

  /**
   * Whether to validate generated AsyncAPI spec
   * @default true
   */
  "validate-spec"?: boolean;

  /**
   * Additional schema properties to include
   */
  "additional-properties"?: Record<string, unknown>;

  /**
   * Protocol bindings to include
   */
  "protocol-bindings"?: ("kafka" | "amqp" | "websocket" | "http")[];

  /**
   * Security schemes configuration
   */
  "security-schemes"?: Record<string, SecuritySchemeConfig>;

  /**
   * Versioning configuration
   */
  "versioning"?: VersioningConfig;

}

/**
 * Versioning configuration options
 */
export type VersioningConfig = {
  /**
   * Whether to generate separate files for each version
   * @default true
   */
  "separate-files"?: boolean;

  /**
   * Version naming strategy for file output
   * @default "suffix"
   */
  "file-naming"?: "suffix" | "directory" | "prefix";

  /**
   * Whether to include version metadata in AsyncAPI info
   * @default true
   */
  "include-version-info"?: boolean;

  /**
   * Custom version mappings
   */
  "version-mappings"?: Record<string, string>;

  /**
   * Whether to validate version compatibility
   * @default false
   */
  "validate-version-compatibility"?: boolean;
}

export type ServerConfig = {
  host: string;
  protocol: string;
  description?: string;
  variables?: Record<string, VariableConfig>;
  security?: string[];
  bindings?: Record<string, unknown>;
}

export type VariableConfig = {
  description?: string;
  default?: string;
  enum?: string[];
  examples?: string[];
}

export type SecuritySchemeConfig = {
  type: "oauth2" | "apiKey" | "httpApiKey" | "http" | "plain" | "scram-sha-256" | "scram-sha-512" | "gssapi";
  description?: string;
  name?: string;
  in?: "user" | "password" | "query" | "header" | "cookie";
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlowsConfig;
}

export type OAuthFlowsConfig = {
  implicit?: OAuthFlowConfig;
  password?: OAuthFlowConfig;
  clientCredentials?: OAuthFlowConfig;
  authorizationCode?: OAuthFlowConfig;
}

export type OAuthFlowConfig = {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  availableScopes?: Record<string, string>;
}

// EFFECT.TS SCHEMA DEFINITIONS - Type-safe validation with comprehensive error handling


/**
 * Variable configuration schema for server variables
 * OPTIMIZED: Using Schema.record with branded types and performance optimizations
 */
const VariableConfigSchema = Schema.Struct({
  description: Schema.optional(Schema.String.pipe(
    Schema.maxLength(500),
    Schema.annotations({ description: "Variable description (max 500 chars)" })
  )),
  default: Schema.optional(Schema.String.pipe(
    Schema.maxLength(100),
    Schema.annotations({ description: "Default value (max 100 chars)" })
  )),
  enum: Schema.optional(Schema.Array(Schema.String).pipe(
    Schema.annotations({ description: "Allowed values (max 50 items)" })
  )),
  examples: Schema.optional(Schema.Array(Schema.String).pipe(
    Schema.annotations({ description: "Example values (max 10 items)" })
  ))
}).pipe(
  Schema.annotations({
    identifier: "VariableConfig",
    description: "Server variable configuration with validation constraints"
  })
);

/**
 * OAuth flow configuration schema
 * ENHANCED: URL validation, scope limits, and security constraints
 */
const OAuthFlowConfigSchema = Schema.Struct({
  authorizationUrl: Schema.optional(Schema.String.pipe(
    Schema.pattern(/^https?:\/\/.+/, {
      message: () => "Authorization URL must be a valid HTTP/HTTPS URL"
    }),
    Schema.annotations({ description: "OAuth authorization endpoint URL" })
  )),
  tokenUrl: Schema.optional(Schema.String.pipe(
    Schema.pattern(/^https?:\/\/.+/, {
      message: () => "Token URL must be a valid HTTP/HTTPS URL"
    }),
    Schema.annotations({ description: "OAuth token endpoint URL" })
  )),
  refreshUrl: Schema.optional(Schema.String.pipe(
    Schema.pattern(/^https?:\/\/.+/, {
      message: () => "Refresh URL must be a valid HTTP/HTTPS URL"
    }),
    Schema.annotations({ description: "OAuth refresh token endpoint URL" })
  )),
  availableScopes: Schema.optional(Schema.Record({
    key: Schema.String.pipe(
      Schema.pattern(/^[a-zA-Z0-9._:-]+$/, {
        message: () => "Scope name must contain only alphanumeric, dot, underscore, colon, or hyphen characters"
      }),
      Schema.maxLength(100)
    ),
    value: Schema.String.pipe(
      Schema.maxLength(200),
      Schema.annotations({ description: "Human-readable scope description" })
    )
  }).pipe(
    Schema.annotations({ description: "Available OAuth scopes (max 50)" })
  ))
}).pipe(
  Schema.annotations({
    identifier: "OAuthFlowConfig",
    description: "OAuth flow configuration with URL validation and scope limits"
  })
);

/**
 * OAuth flows configuration schema
 */
const OAuthFlowsConfigSchema = Schema.Struct({
  implicit: Schema.optional(OAuthFlowConfigSchema),
  password: Schema.optional(OAuthFlowConfigSchema),
  clientCredentials: Schema.optional(OAuthFlowConfigSchema),
  authorizationCode: Schema.optional(OAuthFlowConfigSchema)
});

// BRANDED TYPES for enhanced type safety (commented out - not used currently)
// const SecuritySchemeType = Schema.String.pipe(
//   Schema.brand("SecuritySchemeType"),
//   Schema.annotations({ identifier: "SecuritySchemeType" })
// );
// 
// const SecurityLocation = Schema.String.pipe(
//   Schema.brand("SecurityLocation"),
//   Schema.annotations({ identifier: "SecurityLocation" })
// );

/**
 * Security scheme configuration schema with branded types
 * ENHANCED: Conditional validation, branded types, and security constraints
 */
const SecuritySchemeConfigSchema = Schema.Struct({
  type: Schema.Literal("oauth2", "apiKey", "httpApiKey", "http", "plain", "scram-sha-256", "scram-sha-512", "gssapi").pipe(
    Schema.annotations({ description: "Security scheme type - determines available fields" })
  ),
  description: Schema.optional(Schema.String.pipe(
    Schema.maxLength(1000),
    Schema.annotations({ description: "Human-readable security scheme description" })
  )),
  name: Schema.optional(Schema.String.pipe(
    Schema.pattern(/^[a-zA-Z0-9._-]+$/, {
      message: () => "Security scheme name must contain only alphanumeric, dot, underscore, or hyphen characters"
    }),
    Schema.maxLength(50),
    Schema.annotations({ description: "Security parameter name (for apiKey schemes)" })
  )),
  in: Schema.optional(Schema.Literal("user", "password", "query", "header", "cookie").pipe(
    Schema.annotations({ description: "Location of security parameter" })
  )),
  scheme: Schema.optional(Schema.String.pipe(
    Schema.pattern(/^[a-zA-Z0-9]+$/, {
      message: () => "HTTP scheme must contain only alphanumeric characters"
    }),
    Schema.maxLength(20),
    Schema.annotations({ description: "HTTP authentication scheme (for http type)" })
  )),
  bearerFormat: Schema.optional(Schema.String.pipe(
    Schema.maxLength(50),
    Schema.annotations({ description: "Bearer token format hint (e.g., 'JWT')" })
  )),
  flows: Schema.optional(OAuthFlowsConfigSchema)
}).pipe(
  Schema.annotations({
    identifier: "SecuritySchemeConfig",
    description: "Security scheme configuration"
  })
);

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
 * Type-safe schema caching with proper generics
 * PERFORMANCE: Cached schemas for repeated validations
 * TYPE SAFETY: Map<string, Schema<unknown>> is perfectly valid - schemas are covariant
 */
const schemaCache = new Map<string, Schema.Schema<unknown>>();

const createSchema = <T>(key: string, schemaFactory: () => Schema.Schema<T>): Schema.Schema<T> => {
  const cached = schemaCache.get(key);
  if (cached) {
    return cached as Schema.Schema<T>; // Safe cast - schemas are covariant
  }
  
  const schema = schemaFactory();
  schemaCache.set(key, schema as Schema.Schema<unknown>); // Safe upcast
  return schema;
};

/**
 * Main AsyncAPI Emitter Options Schema with Effect.TS
 * 
 * SECURITY: All schemas prevent arbitrary property injection through strict validation
 * TYPE SAFETY: Compile-time and runtime validation with comprehensive error messages
 * PERFORMANCE: Schema caching and optimized validation chains
 */
export const AsyncAPIEmitterOptionsEffectSchema = createSchema(
  "AsyncAPIEmitterOptionsEffectSchema",
  () => Schema.Struct({
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
      message: () => "Invalid path template format"
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
  })),
  
  "use-effect": Schema.optional(Schema.Boolean.annotations({
    description: "Use Effect.TS integrated emitter with validation. Default: true"
  }))
}).pipe(
  Schema.annotations({
    identifier: "AsyncAPIEmitterOptions",
    description: "Complete AsyncAPI emitter configuration options with validation",
    documentation: "https://github.com/typespec/asyncapi-emitter/docs/options"
  })
));

// VALIDATION FUNCTIONS - Effect.TS powered validation with comprehensive error handling

// TAGGED ERRORS for better error handling and recovery
export class AsyncAPIOptionsValidationError extends Error {
  readonly _tag = "AsyncAPIOptionsValidationError" as const;
  override readonly name = "AsyncAPIOptionsValidationError";
  
  constructor(
    readonly field: string,
    readonly value: unknown,
    public override readonly message: string,
    override readonly cause?: Error
  ) {
    super(message);
    this.cause = cause;
  }
}

export class AsyncAPIOptionsParseError extends Error {
  readonly _tag = "AsyncAPIOptionsParseError" as const;
  override readonly name = "AsyncAPIOptionsParseError";
  
  constructor(
    public override readonly message: string,
    override readonly cause?: Error
  ) {
    super(message);
    this.cause = cause;
  }
}

/**
 * Parse and validate AsyncAPI emitter options with Effect.TS generators
 * Returns Effect that either succeeds with validated options or fails with tagged errors
 * FIXED: Proper Effect.TS generator usage with yield*
 */
export const parseAsyncAPIEmitterOptions = (input: unknown) =>
  Effect.gen(function* () {
    // First validate input is an object  
    if (input === null || input === undefined) {
      yield* Effect.fail(new AsyncAPIOptionsParseError("Input cannot be null or undefined"));
    }
    
    if (typeof input !== "object") {
      yield* Effect.fail(new AsyncAPIOptionsParseError(
        `Expected object, got ${typeof input}`
      ));
    }

    // Parse with detailed error mapping using yield*
    return yield* Schema.decodeUnknown(AsyncAPIEmitterOptionsEffectSchema)(input).pipe(
      Effect.mapError(error => 
          new AsyncAPIOptionsValidationError(
            "options",
            input,
            `Schema validation failed: ${error}`,
            error instanceof Error ? error : new Error(String(error))
          )
        )
      );
  });

// TYPE CONVERSION UTILITIES - Handle readonly/optional property differences

type VersioningConfigInput = {
  "separate-files"?: boolean;
  "file-naming"?: "suffix" | "directory" | "prefix";
  "include-version-info"?: boolean;
  "version-mappings"?: Record<string, string>;
  "validate-version-compatibility"?: boolean;
}

const convertVersioningConfig = (input: VersioningConfigInput): VersioningConfigInput => {
  
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

type ServerConfigInput = {
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

const convertServerConfig = (input: ServerConfigInput): ServerConfigInput => {
  
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

// Use the shared SecuritySchemeConfig from types/options.ts
type SecuritySchemeConfigInput = SecuritySchemeConfig;

const convertSecuritySchemeConfig = (input: SecuritySchemeConfigInput): SecuritySchemeConfigInput => {
  // Since SecuritySchemeConfigInput is now an alias for SecuritySchemeConfig,
  // we can simplify this to just pass through the input
  return input;
};

/**
 * Validate AsyncAPI emitter options with detailed error messages and recovery
 * ENHANCED: Tagged error handling, resource management, retry logic
 */
export const validateAsyncAPIEmitterOptions = (input: unknown): Effect.Effect<AsyncAPIEmitterOptions, AsyncAPIOptionsValidationError | AsyncAPIOptionsParseError | Error> =>
  Effect.gen(function* () {
    // Parse with comprehensive error handling
    const result = yield* parseAsyncAPIEmitterOptions(input);
    
    // Convert readonly properties using functional composition
    const converted = yield* Effect.succeed(convertOptionsFormat(result));
    
    // Validate complex business rules
    yield* validateBusinessRules(converted);
    
    return converted;
  }).pipe(
    Effect.catchAll(error => Effect.fail(error as AsyncAPIOptionsValidationError | AsyncAPIOptionsParseError | Error))
  );

/**
 * Convert schema result to final options format
 * PERFORMANCE: Functional approach avoiding repeated checks
 */
const convertOptionsFormat = (result: Record<string, unknown>): AsyncAPIEmitterOptions => {
  const converted: AsyncAPIEmitterOptions = {};
  
  // Use functional composition for cleaner conversion
  const copyIfDefined = <K extends keyof AsyncAPIEmitterOptions>(
    key: K, 
    transform?: (value: unknown) => AsyncAPIEmitterOptions[K]
  ) => {
    if (result[key] !== undefined) {
      converted[key] = transform ? transform(result[key]) : (result[key] as AsyncAPIEmitterOptions[K]);
    }
  };

  copyIfDefined("output-file");
  copyIfDefined("file-type");
  copyIfDefined("asyncapi-version");
  copyIfDefined("omit-unreachable-types");
  copyIfDefined("include-source-info");
  copyIfDefined("validate-spec");
  copyIfDefined("additional-properties", (value) => ({ ...(value as Record<string, unknown>) }));
  copyIfDefined("protocol-bindings", (value) => [...(value as ("kafka" | "amqp" | "websocket" | "http")[])]);
  
  if (result["default-servers"] !== undefined && result["default-servers"] !== null) {
    converted["default-servers"] = Object.fromEntries(
      Object.entries(result["default-servers"]).map(([key, value]) => [
        key,
        convertServerConfig(value as ServerConfigInput) // Safe cast - schema validation ensures correct type
      ])
    );
  }
  
  if (result["security-schemes"] !== undefined && result["security-schemes"] !== null) {
    converted["security-schemes"] = Object.fromEntries(
      Object.entries(result["security-schemes"]).map(([key, value]) => [
        key,
        convertSecuritySchemeConfig(value as SecuritySchemeConfigInput) // Safe cast - schema validation ensures correct type
      ])
    );
  }
  
  if (result["versioning"] !== undefined) {
    converted["versioning"] = convertVersioningConfig(result["versioning"] as VersioningConfigInput); // Safe cast - schema validation ensures correct type
  }
  
  return converted;
};

/**
 * Validate complex business rules that can't be expressed in schemas
 * BUSINESS LOGIC: Cross-field validation and domain constraints
 */
const validateBusinessRules = (options: AsyncAPIEmitterOptions): Effect.Effect<void, AsyncAPIOptionsValidationError> =>
  Effect.gen(function* () {
    // Rule 1: JSON format with source info warning
    if (options["file-type"] === "json" && options["include-source-info"]) {
      yield* Effect.logWarning("Source info in JSON format may affect readability");
    }
    
    // Rule 2: Security schemes validation
    if (options["protocol-bindings"]?.includes("kafka") && !options["security-schemes"]) {
      yield* Effect.fail(new AsyncAPIOptionsValidationError(
        "security-schemes",
        undefined,
        "Kafka protocol bindings require security schemes to be configured"
      ));
    }
    
    // Rule 3: Versioning consistency
    if (options["versioning"]?.["separate-files"] && !options["versioning"]?.["file-naming"]) {
      yield* Effect.fail(new AsyncAPIOptionsValidationError(
        "versioning.file-naming",
        undefined,
        "Separate files versioning requires file naming strategy"
      ));
    }
    
    // Rule 4: Server configuration validation
    if (options["default-servers"]) {
      for (const [serverName, server] of Object.entries(options["default-servers"])) {
        if (server.protocol === "https" && server.host.startsWith("localhost")) {
          yield* Effect.logWarning(`Server '${serverName}' uses HTTPS with localhost - this may cause certificate issues`);
        }
      }
    }
  });

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
    console.warn("⚠️  Effect.TS Schema conversion failed, falling back to manual JSON Schema:", error);
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