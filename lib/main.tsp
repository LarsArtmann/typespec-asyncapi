import "@typespec/compiler";

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
 * Define message properties for an operation
 * @param contentType Optional content type override for the message
 */
extern dec message(target: Operation, contentType?: valueof string);

/**
 * Define server configuration for AsyncAPI
 * @param name Server name identifier
 * @param config Server configuration object
 */
extern dec server(target: Namespace, name: valueof string, config: {
  host: valueof string,
  protocol: valueof string,
  description?: valueof string,
  variables?: Record<{
    description?: valueof string,
    default?: valueof string,
    enum?: valueof string[]
  }>
});

/**
 * Specify protocol-specific bindings
 * @param protocol Protocol name (kafka, amqp, websocket, http)
 * @param bindings Protocol-specific binding configuration
 */
extern dec protocol(target: Operation | Model, protocol: valueof string, bindings: Record<unknown>);

/**
 * Add security requirements to operations or entire service
 * @param schemes Array of security scheme names
 */
extern dec security(target: Operation | Namespace, schemes: valueof string[]);

/**
 * Define correlation ID for message tracking
 * @param location Location expression for correlation ID
 */
extern dec correlationId(target: Operation | Model, location: valueof string);

/**
 * Mark a model property as a message header
 */
extern dec header(target: ModelProperty);

/**
 * Mark a model as a message payload
 */  
extern dec payload(target: Model);

/**
 * Add AsyncAPI-specific tags
 * @param tags Array of tag objects
 */
extern dec tags(target: Operation | Model | Namespace, tags: valueof {
  name: string,
  description?: string
}[]);

/**
 * Add external documentation reference
 * @param url Documentation URL
 * @param description Optional description
 */
extern dec externalDocs(target: Operation | Model | Namespace, url: valueof string, description?: valueof string);

/**
 * Set default content type for messages
 * @param contentType MIME type (e.g., "application/json")
 */
extern dec contentType(target: Namespace, contentType: valueof string);