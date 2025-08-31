
//No re-exports! Use the real thing!

// Export working decorator functions
/** @deprecated use the real thing re-export will be removed */
export {$channel} from "./channel"
/** @deprecated use the real thing re-export will be removed */
export {$publish} from "./publish"
/** @deprecated use the real thing re-export will be removed */
export {$subscribe} from "./subscribe"
/** @deprecated use the real thing re-export will be removed */
export {$server} from "./server"

// Core AsyncAPI decorators - IMPLEMENTED
/** @deprecated use the real thing re-export will be removed */
export {$message} from "./message"
/** @deprecated use the real thing re-export will be removed */
export {$protocol} from "./protocol"
/** @deprecated use the real thing re-export will be removed */
export {$security} from "./security"


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