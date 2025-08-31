import "@typespec/compiler";
import "../dist/index.js";

using TypeSpec.Reflection;

namespace TypeSpec.AsyncAPI;

// Named types for AsyncAPI configurations

/**
 * Message binding configuration for different protocols
 */
model MessageBindingConfig {
  // Kafka message bindings
  key?: { type?: string; enum?: string[]; };
  schemaIdLocation?: "header" | "payload";
  
  // WebSocket message bindings
  bindingVersion?: string;
  
  // HTTP message bindings  
  statusCode?: int32;
  headers?: Record<string>;
  
  // AMQP message bindings
  contentEncoding?: string;
  messageType?: string;
  
  // MQTT message bindings
  retain?: boolean;
  
  // Generic bindings
  ...Record<unknown>;
}

/**
 * Protocol binding configuration for different protocols
 */
model ProtocolBindingConfig {
  // Kafka bindings
  topic?: string;
  key?: { type?: string; enum?: string[]; };
  schemaIdLocation?: "header" | "payload";
  groupId?: string;
  clientId?: string;
  
  // WebSocket bindings  
  method?: "GET" | "POST";
  query?: Record<string>;
  headers?: Record<string>;
  
  // HTTP bindings
  type?: "request" | "response";
  statusCode?: int32;
  
  // AMQP bindings
  exchange?: { name?: string; type?: string; };
  queue?: { name?: string; durable?: boolean; };
  
  // MQTT bindings
  qos?: 0 | 1 | 2;
  retain?: boolean;
  
  // Redis bindings
  channel?: string;
  
  // Generic properties
  ...Record<unknown>;
}

/**
 * OAuth2 flow configuration
 */
model OAuth2Flow {
  authorizationUrl?: string;
  tokenUrl?: string;
  availableScopes: Record<string>;
  refreshUrl?: string;
}

/**
 * Security scheme configuration
 */
model SecuritySchemeConfig {
  type: "apiKey" | "http" | "oauth2" | "openIdConnect";
  
  // API Key scheme
  in?: "user" | "password" | "query" | "header" | "cookie";
  name?: string;
  
  // HTTP scheme  
  scheme?: "basic" | "bearer" | "digest";
  bearerFormat?: string;
  
  // OAuth2 scheme
  flows?: {
    implicit?: OAuth2Flow;
    password?: OAuth2Flow;
    clientCredentials?: OAuth2Flow;
    authorizationCode?: OAuth2Flow;
  };
  
  // OpenID Connect
  openIdConnectUrl?: string;
  
  // Generic properties
  description?: string;
  ...Record<unknown>;
}

/**
 * Server variable configuration
 */
model ServerVariable {
  default?: string;
  description?: string;
  examples?: string[];
  enum?: string[];
}

/**
 * Server tag configuration
 */
model ServerTag {
  name: string;
  description?: string;  
  externalDocs?: { url: string; description?: string; };
}

/**
 * Server binding configuration
 */
model ServerBindingConfig {
  // Kafka server bindings
  schemaRegistryUrl?: string;
  schemaRegistryVendor?: string;
  
  // MQTT server bindings
  clientId?: string;
  cleanSession?: boolean;
  lastWill?: {
    topic: string;
    qos?: 0 | 1 | 2;
    retain?: boolean;
  };
  keepAlive?: int32;
  
  // Generic bindings
  ...Record<unknown>;
}

/**
 * Server configuration
 */
model ServerConfig {
  url: string;
  protocol?: "kafka" | "websocket" | "http" | "https" | "amqp" | "amqps" | "mqtt" | "mqtts" | "redis";
  description?: string;
  variables?: Record<ServerVariable>;
  security?: Array<Record<string[]>>;
  tags?: Array<ServerTag>;
  bindings?: ServerBindingConfig;
}

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
 * Apply message metadata to a model representing an AsyncAPI message
 * @param config Message configuration with name, title, contentType, description, etc.
 */
extern dec message(target: Model, config?: {
  name?: valueof string;
  title?: valueof string;
  summary?: valueof string;
  description?: valueof string;
  contentType?: valueof string;
  examples?: unknown[];
  headers?: valueof string;
  correlationId?: valueof string;
  bindings?: MessageBindingConfig;
});

/**
 * Define protocol-specific binding configuration for operations or models
 * @param config Protocol configuration with type and binding details
 */
extern dec protocol(target: Operation | Model, config: {
  protocol: "kafka" | "websocket" | "http" | "amqp" | "mqtt" | "redis";
  binding: ProtocolBindingConfig;
  version?: valueof string;
  description?: valueof string;
});

/**
 * Apply security scheme information to operations or models
 * @param config Security configuration with name and scheme details
 */
extern dec security(target: Operation | Model, config: {
  name: valueof string;
  scheme: SecuritySchemeConfig;
  scopes?: valueof string[];
  metadata?: {
    description?: valueof string;
    externalDocs?: { url: valueof string; description?: valueof string; };
    ...Record<unknown>;
  };
});

/**
 * Define a server configuration for the AsyncAPI specification
 * @param name The server name/identifier
 * @param config Server configuration with url, protocol, and optional description
 */
extern dec server(target: Namespace, name: valueof string, config: ServerConfig);