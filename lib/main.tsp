// TypeSpec AsyncAPI Library Definition - Core decorator infrastructure
// Restored after critical infrastructure loss on 2025-10-25

import "../dist/index.js";

using TypeSpec.Reflection;

// Core AsyncAPI namespace for all decorators
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
extern dec message(target: Model, config: Record<unknown>);

/**
 * Define protocol-specific binding configuration
 * @param config Protocol binding configuration object
 */
extern dec protocol(target: Operation | Model, config: Record<unknown>);

/**
 * Apply security scheme information
 * @param config Security configuration object containing name and scheme
 */
extern dec security(target: Operation | Namespace, config: Record<unknown>);

/**
 * Define server configuration
 * @param name Server name identifier
 * @param config Server configuration object
 */
extern dec server(target: Namespace, name: valueof string, config: Record<unknown>);

/**
 * Mark an operation as a publish operation (sends messages to the channel)
 */
extern dec publish(target: Operation);

/**
 * Mark an operation as a subscribe operation (receives messages from the channel)
 */
extern dec subscribe(target: Operation);

/**
 * Apply tags metadata for categorization
 * @param value Array of tag strings
 */
extern dec tags(target: unknown, value: valueof string[]);

/**
 * Specify correlation ID configuration
 * @param location Location of the correlation ID (e.g., "$message.header#/correlationId")
 * @param property Optional property path
 */
extern dec correlationId(target: Model, location: valueof string, property?: valueof string);

/**
 * Define protocol bindings (generic)
 * @param value Bindings configuration object
 */
extern dec bindings(target: Operation | Model, value: Record<unknown>);

/**
 * Define message header
 * @param name Header name
 * @param value Header value or configuration
 */
extern dec header(target: Model | ModelProperty, name: valueof string, value: valueof string | Record<unknown>);


