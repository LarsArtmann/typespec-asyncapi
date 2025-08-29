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
  bindings?: Record<string, any>;
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
  bindings?: Record<string, any>;
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
  bindings?: Record<string, any>;
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
  bindings?: Record<string, any>;
}

export interface OperationReplyObject {
  address?: RuntimeExpression;
  channel?: ReferenceObject;
  messages?: (MessageObject | ReferenceObject)[];
}

export interface MessageObject {
  headers?: SchemaObject | ReferenceObject;
  payload?: SchemaObject | ReferenceObject;
  correlationId?: CorrelationIdObject | ReferenceObject;
  contentType?: string;
  name?: string;
  title?: string;
  summary?: string;
  description?: string;
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
  bindings?: Record<string, any>;
  examples?: MessageExampleObject[];
  traits?: (MessageTraitObject | ReferenceObject)[];
}

export interface MessageTraitObject {
  headers?: SchemaObject | ReferenceObject;
  correlationId?: CorrelationIdObject | ReferenceObject;
  contentType?: string;
  name?: string;
  title?: string;
  summary?: string;
  description?: string;
  tags?: TagObject[];
  externalDocs?: ExternalDocumentationObject;
  bindings?: Record<string, any>;
  examples?: MessageExampleObject[];
}

export interface MessageExampleObject {
  name?: string;
  summary?: string;
  headers?: Record<string, any>;
  payload?: any;
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
  serverBindings?: Record<string, Record<string, any>>;
  channelBindings?: Record<string, Record<string, any>>;
  operationBindings?: Record<string, Record<string, any>>;
  messageBindings?: Record<string, Record<string, any>>;
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
  default?: any;
  examples?: any[];
  
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
  enum?: any[];
  const?: any;
  
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