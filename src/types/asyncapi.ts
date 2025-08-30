/**
 * AsyncAPI 3.0.0 Document structure
 */
export type AsyncAPIDocument = {
  asyncapi: "3.0.0";
  info: InfoObject;
  defaultContentType?: string;
  servers?: Record<string, ServerObject>;
  channels?: Record<string, ChannelObject>;
  operations?: Record<string, OperationObject>;
  components?: ComponentsObject;
}

export type InfoObject = {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: ContactObject;
  license?: LicenseObject;
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
}

export type ContactObject = {
  name?: string;
  url?: string;
  email?: string;
}

export type LicenseObject = {
  name: string;
  url?: string;
}

export type TagObject = {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentationObject;
}

export type ExternalDocumentationObject = {
  description?: string;
  url: string;
}

export type ServerObject = {
  host: string;
  protocol: string;
  protocolVersion?: string;
  pathname?: string;
  description?: string;
  title?: string;
  summary?: string;
  variables?: Record<string, ServerVariableObject>;
  security?: SecurityRequirementObject[];
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
  bindings?: ServerBindings;
}

export type ServerVariableObject = {
  enum?: string[];
  default?: string;
  description?: string;
  examples?: string[];
}

export type ChannelObject = {
  address?: string;
  messages?: Record<string, MessageObject | ReferenceObject>;
  title?: string;
  summary?: string;
  description?: string;
  servers?: ReferenceObject[];
  parameters?: Record<string, ParameterObject | ReferenceObject>;
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
  bindings?: ChannelBindings;
}

export type OperationObject = {
  action: "send" | "receive";
  channel: ReferenceObject;
  title?: string;
  summary?: string;
  description?: string;
  security?: SecurityRequirementObject[];
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
  bindings?: OperationBindings;
  traits?: (OperationTraitObject | ReferenceObject)[];
  messages?: (MessageObject | ReferenceObject)[];
  reply?: OperationReplyObject;
}

export type OperationTraitObject = {
  title?: string;
  summary?: string;
  description?: string;
  security?: SecurityRequirementObject[];
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
  bindings?: OperationBindings;
}

export type OperationReplyObject = {
  address?: RuntimeExpression;
  channel?: ReferenceObject;
  messages?: (MessageObject | ReferenceObject)[];
}

/**
 * Base interface for message common properties
 */
export type MessageBaseObject = {
  headers?: SchemaObject | ReferenceObject;
  correlationId?: CorrelationIdObject | ReferenceObject;
  contentType?: string;
  name?: string;
  title?: string;
  summary?: string;
  description?: string;
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
  bindings?: MessageBindings;
  examples?: MessageExampleObject[];
}

export type MessageObject = {
  payload?: SchemaObject | ReferenceObject;
  traits?: (MessageTraitObject | ReferenceObject)[];
} & MessageBaseObject

export type MessageTraitObject = {
  // Marker interface for message traits
} & MessageBaseObject

export type MessageExampleObject = {
  name?: string;
  summary?: string;
  headers?: Record<string, unknown>;
  payload?: unknown;
}

export type CorrelationIdObject = {
  description?: string;
  location: string;
}

export type ParameterObject = {
  enum?: string[];
  default?: string;
  description?: string;
  examples?: string[];
  location?: string;
}

export type ComponentsObject = {
  schemas?: Record<string, SchemaObject | ReferenceObject>;
  servers?: Record<string, ServerObject>;
  channels?: Record<string, ChannelObject>;
  operations?: Record<string, OperationObject>;
  messages?: Record<string, MessageObject>;
  securitySchemes?: Record<string, SecuritySchemeObject>;
  parameters?: Record<string, ParameterObject>;
  correlationIds?: Record<string, CorrelationIdObject>;
  replies?: Record<string, OperationReplyObject>;
  replyAddresses?: Record<string, OperationReplyAddressObject>;
  externalDocs?: Record<string, ExternalDocumentationObject>;
  tags?: Record<string, TagObject>;
  operationTraits?: Record<string, OperationTraitObject>;
  messageTraits?: Record<string, MessageTraitObject>;
  serverBindings?: Record<string, ServerBindings>;
  channelBindings?: Record<string, ChannelBindings>;
  operationBindings?: Record<string, OperationBindings>;
  messageBindings?: Record<string, MessageBindings>;
}

export type OperationReplyAddressObject = {
  description?: string;
  location: string;
}

export type SchemaObject = {
  // JSON Schema Draft 2020-12 properties
  type?: "null" | "boolean" | "object" | "array" | "number" | "string" | "integer";
  title?: string;
  description?: string;
  default?: unknown;
  examples?: unknown[];
  
  // Object properties
  properties?: Record<string, SchemaObject | ReferenceObject>;
  required?: string[];
  additionalProperties?: boolean | SchemaObject | ReferenceObject;
  
  // Array properties  
  items?: SchemaObject | ReferenceObject;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  
  // String properties
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  
  // Number properties
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  
  // Generic properties
  enum?: unknown[];
  const?: unknown;
  
  // Composition
  allOf?: (SchemaObject | ReferenceObject)[];
  oneOf?: (SchemaObject | ReferenceObject)[];
  anyOf?: (SchemaObject | ReferenceObject)[];
  not?: SchemaObject | ReferenceObject;
  
  // Conditional
  if?: SchemaObject | ReferenceObject;
  then?: SchemaObject | ReferenceObject;
  else?: SchemaObject | ReferenceObject;
  
  // Metadata
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
}

export type ReferenceObject = {
  $ref: string;
}

export type SecuritySchemeObject = {
  type: "userPassword" | "apiKey" | "X509" | "symmetricEncryption" | "asymmetricEncryption" | "httpApiKey" | "http" | "oauth2" | "openIdConnect" | "plain" | "scram-sha-256" | "scram-sha-512" | "gssapi";
  description?: string;
  name?: string;
  in?: "user" | "password" | "query" | "header" | "cookie";
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlowsObject;
  openIdConnectUrl?: string;
}

export type OAuthFlowsObject = {
  implicit?: OAuthFlowObject;
  password?: OAuthFlowObject;
  clientCredentials?: OAuthFlowObject;
  authorizationCode?: OAuthFlowObject;
}

export type OAuthFlowObject = {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  availableScopes?: Record<string, string>;
}

export type SecurityRequirementObject = {
  [name: string]: string[];
}

export type RuntimeExpression = string;

/**
 * Protocol Binding Types for AsyncAPI 3.0.0
 */

// Base interface for all protocol bindings
export type BindingObject = {
  bindingVersion?: string;
}

// Kafka Protocol Binding
export type KafkaServerBinding = {
  schemaRegistryUrl?: string;
  schemaRegistryVendor?: string;
  clientId?: string;
  groupId?: string;
} & BindingObject

export type KafkaChannelBinding = {
  topic?: string;
  partitions?: number;
  replicas?: number;
  topicConfiguration?: KafkaTopicConfiguration;
} & BindingObject

export type KafkaOperationBinding = {
  groupId?: KafkaOperationGroupId;
  clientId?: KafkaOperationClientId;
} & BindingObject

export type KafkaMessageBinding = {
  key?: KafkaMessageKey;
  schemaIdLocation?: "header" | "payload";
  schemaIdPayloadEncoding?: string;
  schemaLookupStrategy?: "TopicIdStrategy" | "RecordIdStrategy" | "TopicRecordIdStrategy";
} & BindingObject

export type KafkaTopicConfiguration = {
  "cleanup.policy"?: ("delete" | "compact")[];
  "retention.ms"?: number;
  "retention.bytes"?: number;
  "delete.retention.ms"?: number;
  "max.message.bytes"?: number;
  [key: string]: unknown;
}

export type KafkaOperationGroupId = {
  type?: "string" | "integer";
  enum?: string[] | number[];
  description?: string;
}

export type KafkaOperationClientId = {
  type?: "string" | "integer";
  enum?: string[] | number[];
  description?: string;
}

export type KafkaMessageKey = {
  type?: "string" | "integer";
  enum?: string[] | number[];
  description?: string;
}

// WebSocket Protocol Binding
export type WebSocketChannelBinding = {
  method?: "GET" | "POST";
  query?: SchemaObject | ReferenceObject;
  headers?: SchemaObject | ReferenceObject;
} & BindingObject

export type WebSocketMessageBinding = {
  // WebSocket messages don't typically have specific binding properties
  // but we keep this for consistency and future extensions
} & BindingObject

// HTTP Protocol Binding  
export type HttpOperationBinding = {
  type?: "request" | "response";
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "CONNECT" | "TRACE";
  query?: SchemaObject | ReferenceObject;
  statusCode?: number;
} & BindingObject

export type HttpMessageBinding = {
  headers?: SchemaObject | ReferenceObject;
  statusCode?: number;
} & BindingObject

// Protocol-specific binding collections
export type ServerBindings = {
  kafka?: KafkaServerBinding;
  [protocol: string]: BindingObject | undefined;
}

export type ChannelBindings = {
  kafka?: KafkaChannelBinding;
  ws?: WebSocketChannelBinding;
  [protocol: string]: BindingObject | undefined;
}

export type OperationBindings = {
  kafka?: KafkaOperationBinding;
  http?: HttpOperationBinding;
  [protocol: string]: BindingObject | undefined;
}

export type MessageBindings = {
  kafka?: KafkaMessageBinding;
  ws?: WebSocketMessageBinding;
  http?: HttpMessageBinding;
  [protocol: string]: BindingObject | undefined;
}