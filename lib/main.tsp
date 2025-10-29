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

  // Tags decorator for metadata
  extern dec tags(value: string[]);

  // Correlation ID decorator
  extern dec correlationId(value: {
    location: string;
    property?: string;
  });

  // Bindings decorator for protocol bindings
  extern dec bindings(value: object);

  // Header decorator for message headers
  extern dec header(value: {
    name: string;
    value: string | object;
  });
}

// Export decorator types for external usage
export namespace TypeSpec {
  namespace AsyncAPI {
    alias channel = TypeSpec.AsyncAPI.channel;
    alias message = TypeSpec.AsyncAPI.message;
    alias protocol = TypeSpec.AsyncAPI.protocol;
    alias security = TypeSpec.AsyncAPI.security;
    alias server = TypeSpec.AsyncAPI.server;
  }
}
