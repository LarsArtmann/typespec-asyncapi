// TODO: Add file header comment explaining the purpose of this TypeSpec library file
// TODO: Consider adding version information in the header comment
// TODO: Add import validation to ensure "../dist/index.js" exists before TypeSpec compilation
import "../dist/index.js";

// TODO: Add comment explaining why TypeSpec.Reflection is needed
using TypeSpec.Reflection;

// TODO: Add JSDoc comment for the namespace explaining its purpose and scope
// TODO: Consider adding namespace-level metadata like version, description
namespace TypeSpec.AsyncAPI;

/**
 * Specify the channel path for a message operation
 * @param path The channel path (e.g., "/user/{userId}/messages" or "user.signup")
 * 
 * TODO: Add @example showing typical usage patterns
 * TODO: Add @since version annotation
 * TODO: Add validation rules documentation (path format constraints)
 * TODO: Document supported path variable syntax in detail
 */
// TODO: Add runtime validation for path parameter format
// TODO: Consider making path parameter more strongly typed (template literal type)
extern dec channel(target: Operation, path: valueof string);

/**
 * Mark an operation as a publish operation (sends messages to the channel)
 * 
 * TODO: Add @example showing typical usage with @channel decorator
 * TODO: Add @since version annotation
 * TODO: Document relationship with @channel decorator requirement
 * TODO: Add validation note about mutual exclusivity with @subscribe
 */
// TODO: Add compile-time validation to ensure target is an Operation
// TODO: Consider adding optional parameter for publish-specific metadata
extern dec publish(target: Operation);

/**
 * Mark an operation as a subscribe operation (receives messages from the channel)
 * 
 * TODO: Add @example showing typical usage with @channel decorator
 * TODO: Add @since version annotation  
 * TODO: Document relationship with @channel decorator requirement
 * TODO: Add validation note about mutual exclusivity with @publish
 */
// TODO: Add compile-time validation to ensure target is an Operation
// TODO: Consider adding optional parameter for subscribe-specific metadata
extern dec subscribe(target: Operation);

/**
 * Apply message metadata to a model representing an AsyncAPI message
 * @param config Message configuration with name, title, contentType, description, etc.
 * 
 * TODO: Add @example showing typical message configuration structure
 * TODO: Add @since version annotation
 * TODO: Document specific config properties that are supported
 * TODO: Add validation rules for config object structure
 */
// TODO: Replace Record<unknown> with strongly typed interface for config
// TODO: Add compile-time validation to ensure target is a Model
// TODO: Consider making config parameter required instead of optional
extern dec message(target: Model, config?: Record<unknown>);

/**
 * Define protocol-specific binding configuration for operations or models
 * @param config Protocol configuration with type and binding details
 * 
 * TODO: Add @example showing Kafka, AMQP, WebSocket binding configurations
 * TODO: Add @since version annotation
 * TODO: Document supported protocol types (kafka, amqp, websocket, http)
 * TODO: Add validation rules for protocol-specific config structure
 */
// TODO: Replace Record<unknown> with strongly typed union of protocol config interfaces
// TODO: Add compile-time validation for supported protocol types
// TODO: Consider separate decorators for each protocol type (@kafka, @amqp, etc.)
extern dec protocol(target: Operation | Model, config: Record<unknown>);

/**
 * Apply security scheme information to operations or models
 * @param config Security configuration with name and scheme details
 * 
 * TODO: Add @example showing OAuth2, API key, JWT security configurations
 * TODO: Add @since version annotation
 * TODO: Document supported security scheme types
 * TODO: Add validation rules for security config structure
 */
// TODO: Replace Record<unknown> with strongly typed security config interface
// TODO: Add compile-time validation for AsyncAPI 3.0 security scheme types
// TODO: Consider validation for security scheme name uniqueness
extern dec security(target: Operation | Model, config: Record<unknown>);

/**
 * Define a server configuration for the AsyncAPI specification
 * @param name The server name/identifier
 * @param config Server configuration with url, protocol, and optional description
 * 
 * TODO: Add @example showing typical server configuration structure
 * TODO: Add @since version annotation
 * TODO: Document required config properties (url, protocol)
 * TODO: Add validation rules for server config structure
 */
// TODO: Replace Record<unknown> with strongly typed server config interface
// TODO: Add compile-time validation for server name uniqueness within namespace
// TODO: Add validation for URL format and protocol support
// TODO: Consider making config parameter more strongly typed with required fields
extern dec server(target: Namespace, name: valueof string, config: Record<unknown>);