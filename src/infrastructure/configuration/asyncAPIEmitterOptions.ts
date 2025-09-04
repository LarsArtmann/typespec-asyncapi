import type {ServerConfig} from "./serverConfig.js"
import type {SecuritySchemeConfig} from "./securitySchemeConfig.js"
import type {VersioningConfig} from "./versioningConfig.js"

//TODO: Can we do better with our Types?
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
	 * TODO: We should already have a named Type for this!
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