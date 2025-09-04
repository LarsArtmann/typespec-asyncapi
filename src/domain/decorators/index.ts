// Domain Decorators - TypeSpec AsyncAPI Decorator Implementations
// Business logic for TypeSpec decorator processing

// Core AsyncAPI decorators
export { $channel } from './channel.js';
export { $publish } from './publish.js';
export { $subscribe } from './subscribe.js';
export { $server } from './server.js';
export { $message } from './message.js';
export { $security } from './security.js';
export { $protocol } from './protocol.js';

// Optional decorators
export { $header } from './header.js';
export { $correlationId } from './correlation-id.js';
export { $tags } from './tags.js';

// Binding decorators
export { $bindings } from './cloud-bindings.js';
export type * from './cloud-binding.js';

// Security scheme decorators
export type * from './apiKeySecurityScheme.js';
export type * from './httpSecurityScheme.js';
export type * from './OAuth2SecurityScheme.js';
export type * from './openIdConnectSecurityScheme.js';
export type * from './saslSecurityScheme.js';
export type * from './asymmetricEncryptionSecurityScheme.js';
export type * from './symmetricEncryptionSecurityScheme.js';
export type * from './x509SecurityScheme.js';

// Legacy decorator registration (to be refactored)
export { createAsyncAPIDecorators } from './legacy-index.js';