/**
 * AsyncAPI Emitter Options
 *
 * Single source of truth for all configuration.
 */

export type AsyncAPIEmitterOptions = {
  /** Target AsyncAPI specification version */
  version: string;

  /** Target AsyncAPI specification version */
  "asyncapi-version"?: "3.0.0";

  /** Generated document title */
  title?: string;

  /** Generated document description */
  description?: string;

  /** Output file name without extension */
  "output-file"?: string;

  /** Output file format (json, yaml) */
  "file-type"?: "json" | "yaml";

  /** Output directory for generated files */
  "output-dir"?: string;

  /** Protocol binding configurations */
  "protocol-bindings"?: Array<
    "http" | "ws" | "mqtt" | "kafka" | "amqp" | "nats" | "redis" | "stomp" | "jms"
  >;

  /** Versioning configuration */
  versioning?: {
    enabled?: boolean;
    strategy?: "semantic" | "timestamp" | "custom";
  };

  /** Security scheme configurations */
  "security-schemes"?: Array<"apiKey" | "http" | "oauth2" | "openIdConnect">;

  /** Whether to include debug information */
  debug?: boolean;

  /** Whether to validate generated AsyncAPI against schema */
  validate?: boolean;

  /** Whether to include source map information */
  "source-maps"?: boolean;

  /** Whether to omit unreachable types from output */
  "omit-unreachable-types"?: boolean;

  /** Whether to include source information in output */
  "include-source-info"?: boolean;

  /** Whether to validate the generated spec */
  "validate-spec"?: boolean;
};

/**
 * Backward compatibility alias for test imports
 */
export type EmitterOptions = AsyncAPIEmitterOptions;
