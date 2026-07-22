// TypeSpec AsyncAPI Library Definition - Core decorator infrastructure
// Following exact @typespec/http library pattern for compatibility

import "../dist/src/tsp-index.js";

using TypeSpec.Reflection;

namespace TypeSpec.AsyncAPI;

/**
 * Specify the channel address/path for a message operation
 * @param address The channel address (e.g., "user.events" or "orders/{orderId}")
 */
extern dec channel(target: Operation, address: valueof string, description?: valueof string);

/**
 * Apply message metadata to a model representing an AsyncAPI message
 * @param config Message configuration object
 */
extern dec message(target: Model, config: {} | valueof Record<unknown>);

/**
 * Define protocol-specific binding configuration
 * @param config Protocol binding configuration object
 */
extern dec protocol(target: Operation | Model, config: {} | valueof Record<unknown>);

/**
 * Apply security scheme information
 * @param config Security configuration object containing name and scheme
 */
extern dec security(target: Operation | Namespace, config: {} | valueof Record<unknown>);

/**
 * Define server configuration
 * @param name Server name (used as key in AsyncAPI servers object)
 * @param config Server configuration object containing url and protocol
 */
extern dec server(target: Namespace, name: valueof string, config: valueof Record<unknown>);

/**
 * Mark an operation as a publish operation (sends messages to the channel)
 * @param config Optional message configuration
 */
extern dec publish(target: Operation, config?: Model);

/**
 * Mark an operation as a subscribe operation (receives messages from the channel)
 */
extern dec subscribe(target: Operation);

/**
 * Apply tags metadata for categorization
 * @param value Array of tag strings
 */
extern dec tags(target: Model | Operation | Namespace, value: valueof string[]);

/**
 * Specify correlation ID configuration
 * @param location Location of the correlation ID (e.g., "$message.header#/correlationId")
 */
extern dec correlationId(target: Model, location: valueof string);

/**
 * Define protocol bindings (generic)
 * @param value Bindings configuration object
 */
extern dec bindings(target: Operation | Model, value: {} | valueof Record<unknown>);

/**
 * Specify the default content type for all messages in the document
 * @param contentType The default content type (e.g., "application/json")
 */
extern dec defaultContentType(target: Namespace, contentType: valueof string);

/**
 * Define message header
 * @param name Header name
 * @param value Header value or configuration
 */
extern dec header(target: Model | ModelProperty, name: valueof string, value: valueof string | Model);

/**
 * Emitter options for `@lars-artmann/typespec-asyncapi`.
 *
 * Configure via tspconfig.yaml:
 * ```yaml
 * emit:
 *   - "@lars-artmann/typespec-asyncapi"
 * options:
 *   "@lars-artmann/typespec-asyncapi":
 *     output-file: "asyncapi"
 *     file-type: "yaml"
 * ```
 */
model EmitterOptions {
  /** Output file name without extension (default: "asyncapi") */
  "output-file"?: string;

  /** Output format: "yaml" or "json" (default: "yaml") */
  "file-type"?: "yaml" | "json";

  /** Document title (default: "Generated API") */
  title?: string;

  /** Document version (default: "1.0.0") */
  version?: string;

  /** Document description */
  description?: string;
}
