import "@typespec/compiler";
import "../dist/index.js";
//import "../dist/decorators/security.js"

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
extern dec message(target: Model, config?: Record<unknown>);

/**
 * Define protocol-specific binding configuration for operations or models
 * @param config Protocol configuration with type and binding details
 */
extern dec protocol(target: Operation | Model, config: Record<unknown>);

/**
 * Apply security scheme information to operations or models
 * @param config Security configuration with name and scheme details
 */
extern dec security(target: Operation | Model, config: Record<unknown>);

/**
 * Define a server configuration for the AsyncAPI specification
 * @param name The server name/identifier
 * @param config Server configuration with url, protocol, and optional description
 */
extern dec server(target: Namespace, name: valueof string, config: Record<unknown>);