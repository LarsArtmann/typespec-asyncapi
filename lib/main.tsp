// TypeSpec AsyncAPI Library Definition - Core decorator infrastructure
// Restored after critical infrastructure loss on 2025-10-25

import "@typespec/compiler";

// Core AsyncAPI namespace for all decorators
namespace TypeSpec.AsyncAPI {
  // Channel decorator for message routing
  model channel {
    /** Address pattern for the channel */
    address: string;
    
    /** Optional description of the channel */
    description?: string;
  }

  // Message decorator for message metadata
  model message {
    /** Name of the message */
    name: string;
    
    /** Optional title for the message */
    title?: string;
    
    /** Content type of the message */
    contentType?: string;
  }

  // Protocol decorator for protocol bindings
  model protocol {
    /** Protocol type (kafka, websocket, http, mqtt, etc.) */
    protocol: string;
    
    /** Protocol-specific binding configuration */
    binding: object;
  }

  // Security decorator for authentication
  model security {
    /** Name of the security scheme */
    name: string;
    
    /** Security scheme configuration */
    scheme: object;
  }

  // Server decorator for server configuration
  model server {
    /** Server name identifier */
    name: string;
    
    /** Server configuration object */
    config: object;
  }
}

// Export decorator types for external usage
export alias channel = TypeSpec.AsyncAPI.channel;
export alias message = TypeSpec.AsyncAPI.message;
export alias protocol = TypeSpec.AsyncAPI.protocol;
export alias security = TypeSpec.AsyncAPI.security;
export alias server = TypeSpec.AsyncAPI.server;
