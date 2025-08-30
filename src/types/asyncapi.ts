/**
 * AsyncAPI 3.0.0 Document structure
 */
export interface AsyncAPIDocument {
  asyncapi: "3.0.0";
  info: InfoObject;
  defaultContentType?: string;
  servers?: Record<string, ServerObject>;
  channels?: Record<string, ChannelObject>;
  operations?: Record<string, OperationObject>;
  components?: ComponentsObject;
}

export interface InfoObject {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: ContactObject;
  license?: LicenseObject;
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
}

export interface ContactObject {
  name?: string;
  url?: string;
  email?: string;
}

export interface LicenseObject {
  name: string;
  url?: string;
}

export interface TagObject {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentationObject;
}

export interface ExternalDocumentationObject {
  description?: string;
  url: string;
}

export interface ServerObject {
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

export interface ServerVariableObject {
  enum?: string[];
  default?: string;
  description?: string;
  examples?: string[];
}

export interface ChannelObject {
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

export interface OperationObject {
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

export interface OperationTraitObject {
  title?: string;
  summary?: string;
  description?: string;
  security?: SecurityRequirementObject[];
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
  bindings?: OperationBindings;
}

export interface OperationReplyObject {
  address?: RuntimeExpression;
  channel?: ReferenceObject;
  messages?: (MessageObject | ReferenceObject)[];
}

/**
 * Base interface for message common properties
 */
export interface MessageBaseObject {
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

export interface MessageObject extends MessageBaseObject {
  payload?: SchemaObject | ReferenceObject;
  traits?: (MessageTraitObject | ReferenceObject)[];
}

export interface MessageTraitObject extends MessageBaseObject {
  // Marker interface for message traits
}

export interface MessageExampleObject {
  name?: string;
  summary?: string;
  headers?: Record<string, unknown>;
  payload?: unknown;
}

export interface CorrelationIdObject {
  description?: string;
  location: string;
}

export interface ParameterObject {
  enum?: string[];
  default?: string;
  description?: string;
  examples?: string[];
  location?: string;
}

export interface ComponentsObject {
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

export interface OperationReplyAddressObject {
  description?: string;
  location: string;
}

export interface SchemaObject {
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

export interface ReferenceObject {
  $ref: string;
}

export interface SecuritySchemeObject {
  type: "userPassword" | "apiKey" | "X509" | "symmetricEncryption" | "asymmetricEncryption" | "httpApiKey" | "http" | "oauth2" | "openIdConnect" | "plain" | "scram-sha-256" | "scram-sha-512" | "gssapi";
  description?: string;
  name?: string;
  in?: "user" | "password" | "query" | "header" | "cookie";
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlowsObject;
  openIdConnectUrl?: string;
}

export interface OAuthFlowsObject {
  implicit?: OAuthFlowObject;
  password?: OAuthFlowObject;
  clientCredentials?: OAuthFlowObject;
  authorizationCode?: OAuthFlowObject;
}

export interface OAuthFlowObject {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  availableScopes?: Record<string, string>;
}

export interface SecurityRequirementObject {
  [name: string]: string[];
}

export type RuntimeExpression = string;

/**
 * Protocol Binding Types for AsyncAPI 3.0.0
 */

// Base interface for all protocol bindings
export interface BindingObject {
  bindingVersion?: string;
}

// Kafka Protocol Binding
export interface KafkaServerBinding extends BindingObject {
  schemaRegistryUrl?: string;
  schemaRegistryVendor?: string;
  clientId?: string;
  groupId?: string;
}

export interface KafkaChannelBinding extends BindingObject {
  topic?: string;
  partitions?: number;
  replicas?: number;
  topicConfiguration?: KafkaTopicConfiguration;
}

export interface KafkaOperationBinding extends BindingObject {
  groupId?: KafkaOperationGroupId;
  clientId?: KafkaOperationClientId;
}

export interface KafkaMessageBinding extends BindingObject {
  key?: KafkaMessageKey;
  schemaIdLocation?: "header" | "payload";
  schemaIdPayloadEncoding?: string;
  schemaLookupStrategy?: "TopicIdStrategy" | "RecordIdStrategy" | "TopicRecordIdStrategy";
}

export interface KafkaTopicConfiguration {
  "cleanup.policy"?: ("delete" | "compact")[];
  "retention.ms"?: number;
  "retention.bytes"?: number;
  "delete.retention.ms"?: number;
  "max.message.bytes"?: number;
  [key: string]: unknown;
}

export interface KafkaOperationGroupId {
  type?: "string" | "integer";
  enum?: string[] | number[];
  description?: string;
}

export interface KafkaOperationClientId {
  type?: "string" | "integer";
  enum?: string[] | number[];
  description?: string;
}

export interface KafkaMessageKey {
  type?: "string" | "integer";
  enum?: string[] | number[];
  description?: string;
}

// WebSocket Protocol Binding
export interface WebSocketChannelBinding extends BindingObject {
  method?: "GET" | "POST";
  query?: SchemaObject | ReferenceObject;
  headers?: SchemaObject | ReferenceObject;
}

export interface WebSocketMessageBinding extends BindingObject {
  // WebSocket messages don't typically have specific binding properties
  // but we keep this for consistency and future extensions
}

// HTTP Protocol Binding  
export interface HttpOperationBinding extends BindingObject {
  type?: "request" | "response";
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "CONNECT" | "TRACE";
  query?: SchemaObject | ReferenceObject;
  statusCode?: number;
}

export interface HttpMessageBinding extends BindingObject {
  headers?: SchemaObject | ReferenceObject;
  statusCode?: number;
}

// Protocol-specific binding collections
export interface ServerBindings {
  kafka?: KafkaServerBinding;
  [protocol: string]: BindingObject | undefined;
}

export interface ChannelBindings {
  kafka?: KafkaChannelBinding;
  ws?: WebSocketChannelBinding;
  [protocol: string]: BindingObject | undefined;
}

export interface OperationBindings {
  kafka?: KafkaOperationBinding;
  http?: HttpOperationBinding;
  [protocol: string]: BindingObject | undefined;
}

export interface MessageBindings {
  kafka?: KafkaMessageBinding;
  ws?: WebSocketMessageBinding;
  http?: HttpMessageBinding;
  [protocol: string]: BindingObject | undefined;
}