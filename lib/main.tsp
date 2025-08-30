import "@typespec/compiler";

using TypeSpec.Reflection;

namespace AsyncAPI;

/**
 * Specify the channel path for a message operation
 * @param path The channel path (e.g., "/user/{userId}/messages" or "user.signup")
 */
extern dec $channel(target: Operation, path: valueof string);

/**
 * Mark an operation as a publish operation (sends messages to the channel)
 */
extern dec $publish(target: Operation);

/**
 * Mark an operation as a subscribe operation (receives messages from the channel)  
 */
extern dec $subscribe(target: Operation);

/**
 * Define a server configuration for the AsyncAPI specification
 * @param name The server name/identifier
 * @param config Server configuration with url, protocol, and optional description
 */
extern dec $server(target: Namespace, name: valueof string, config: Record<unknown>);