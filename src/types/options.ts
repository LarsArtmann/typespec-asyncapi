export interface AsyncAPIEmitterOptions {
  /**
   * Name of the output file
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
export interface VersioningConfig {
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

export interface ServerConfig {
  host: string;
  protocol: string;
  description?: string;
  variables?: Record<string, VariableConfig>;
  security?: string[];
  bindings?: Record<string, unknown>;
}

export interface VariableConfig {
  description?: string;
  default?: string;
  enum?: string[];
  examples?: string[];
}

export interface SecuritySchemeConfig {
  type: "oauth2" | "apiKey" | "httpApiKey" | "http" | "plain" | "scram-sha-256" | "scram-sha-512" | "gssapi";
  description?: string;
  name?: string;
  in?: "user" | "password" | "query" | "header" | "cookie";
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlowsConfig;
}

export interface OAuthFlowsConfig {
  implicit?: OAuthFlowConfig;
  password?: OAuthFlowConfig;
  clientCredentials?: OAuthFlowConfig;
  authorizationCode?: OAuthFlowConfig;
}

export interface OAuthFlowConfig {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  availableScopes?: Record<string, string>;
}