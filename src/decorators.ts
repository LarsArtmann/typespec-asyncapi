/**
 * TypeSpec AsyncAPI Decorators - Public API exports
 * 
 * This module exports all AsyncAPI decorators for TypeSpec library integration.
 * These exports make decorators available when using "import "@lars-artmann/typespec-asyncapi" 
 * in TypeSpec files and provide the JavaScript implementations for the extern dec declarations 
 * in lib/main.tsp.
 */

// Core decorator implementations
export { $channel } from "./domain/decorators/channel.js"
export { $publish } from "./domain/decorators/publish.js"
export { $subscribe } from "./domain/decorators/subscribe.js"
export { $message } from "./domain/decorators/message.js"
export { $server } from "./domain/decorators/server.js"
export { $protocol } from "./domain/decorators/protocol.js"
export { $security } from "./domain/decorators/security.js"

// Additional decorators
export { $tags } from "./domain/decorators/tags.js"
export { $correlationId } from "./domain/decorators/correlation-id.js"
export { $bindings } from "./domain/decorators/cloud-bindings.js"
export { $header } from "./domain/decorators/header.js"