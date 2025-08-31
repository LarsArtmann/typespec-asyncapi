// Export working decorator functions
export {$channel} from "./channel"
export {$publish} from "./publish"
export {$subscribe} from "./subscribe"
export {$server} from "./server"

// Core AsyncAPI decorators - IMPLEMENTED
export {$message} from "./message"
export {$protocol} from "./protocol"
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