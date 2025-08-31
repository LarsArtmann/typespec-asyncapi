import "@typespec/compiler";
import "../dist/index.js";

using TypeSpec.Reflection;

namespace TypeSpec.AsyncAPI;

/**
 * Specify the channel path for a message operation
 * @param path The channel path (e.g., "/user/{userId}/messages" or "user.signup")
 */
extern dec channel(target: Operation, path: valueof string);

/**
 * Mark an operation as a publish operation (sends messages to the channel)
 */
extern dec publish(target: Operation);

/**
 * Mark an operation as a subscribe operation (receives messages from the channel)  
 */
extern dec subscribe(target: Operation);

/**
 * Apply message metadata to a model representing an AsyncAPI message
 * @param config Message configuration with name, title, contentType, description, etc.
 */
extern dec message(target: Model, config?: {
  name?: valueof string;
  title?: valueof string;
  summary?: valueof string;
  description?: valueof string;
  contentType?: valueof string;
  examples?: unknown[];
  headers?: valueof string;
  correlationId?: valueof string;
  bindings?: Record<unknown>;
});

/**
 * Define a server configuration for the AsyncAPI specification
 * @param name The server name/identifier
 * @param config Server configuration with url, protocol, and optional description
 */
extern dec server(target: Namespace, name: valueof string, config: Record<unknown>);