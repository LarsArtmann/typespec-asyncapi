// TODO: Add file header comment explaining the purpose of this TypeSpec library file
// TODO: Consider adding version information in the header comment
// TODO: Add import validation to ensure "../dist/index.js" exists before TypeSpec compilation
import "../index.js";

// TODO: Add comment explaining why TypeSpec.Reflection is needed
using TypeSpec.Reflection;

// TODO: Add JSDoc comment for the namespace explaining its purpose and scope
// TODO: Consider adding namespace-level metadata like version, description
namespace TypeSpec.AsyncAPI;

// TODO: Implement @asyncapi decorator for complete AsyncAPI document configuration
// extern dec asyncapi(target: Namespace, config: Record<unknown>);

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
 * Mark a model property as a message header
 * Headers are extracted from message payload and placed in AsyncAPI message headers schema
 * 
 * @example
 * ```typespec
 * model UserMessage {
 *   @header messageId: string;
 *   @header correlationId?: string;
 *   userId: string;
 *   data: string;
 * }
 * ```
 * 
 * TODO: Add @since version annotation
 * TODO: Document header naming conventions and restrictions
 * TODO: Add validation for supported header types
 */
// TODO: Add compile-time validation to ensure target is a ModelProperty
// TODO: Consider optional header name parameter for custom header mapping
// TODO: Implement @header decorator for message header extraction
// extern dec header(target: ModelProperty);

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

/**
 * Apply tags metadata to operations, models, or namespaces
 * @param tags Array of tag names for categorization and organization
 * 
 * @example
 * ```typespec
 * @tags(["user", "authentication", "v1"])
 * @channel("/auth/user-login")
 * @publish
 * op publishUserLogin(): UserLoginEvent;
 * ```
 * 
 * @since 1.0.0
 */
// TODO: Implement @tags decorator for resource categorization
// extern dec tags(target: Operation | Model | Namespace, tags: valueof string[]);

/**
 * Define correlation ID configuration for message tracking
 * @param config Correlation ID configuration with location and description
 * 
 * @example
 * ```typespec
 * @correlationId(#{
 *   location: "$message.header#/correlationId",
 *   description: "Unique identifier for correlating request-response pairs"
 * })
 * @message("UserRequest")
 * model UserRequestMessage {
 *   correlationId: string;
 *   userId: string;
 *   action: string;
 * }
 * ```
 * 
 * @since 1.0.0
 */
// TODO: Implement @correlationId decorator for message correlation tracking  
// extern dec correlationId(target: Model, config: Record<unknown>);

/**
 * Define bindings for specific protocols and cloud providers
 * @param bindingType The type of binding (kafka, amqp, websocket, aws-sns, aws-sqs, gcp-pubsub)
 * @param config Protocol-specific binding configuration
 * 
 * @example
 * ```typespec
 * @bindings("kafka", #{
 *   key: "userId",
 *   partitions: 3,
 *   replicas: 2,
 *   cleanup: "delete"
 * })
 * @channel("/user-events")
 * @publish
 * op publishUserEvent(): UserEvent;
 * ```
 * 
 * @since 1.0.0
 */
// TODO: Implement @bindings decorator for cloud provider specific bindings
// extern dec bindings(target: Operation | Model, bindingType: valueof string, config: Record<unknown>);