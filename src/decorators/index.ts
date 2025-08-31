// Export working decorator functions
export { $channel } from "./channel.js";
export { $publish } from "./publish.js";
export { $subscribe } from "./subscribe.js";
export { $server } from "./server.js";

// Core AsyncAPI decorators - IMPLEMENTED
export { $message } from "./message.js";
export { $protocol } from "./protocol.js";
export { $security } from "./security.js";


// ARCHITECTURAL DECISION: Additional decorators not implemented for v1.0
// These decorators represent optional AsyncAPI features that are not required
// for core functionality. Implementation deferred to maintain focus on 
// essential features and avoid feature creep in the initial release.
//
//TODO: THESE NEED GitHub Issues & Implementation
// Future roadmap (post-v1.0):
// - $correlationId: Message correlation tracking
// - $header: Custom message headers
// - $payload: Advanced payload validation
// - $tags: Resource categorization
// - $externalDocs: External documentation links
// - $contentType: Message content type specification