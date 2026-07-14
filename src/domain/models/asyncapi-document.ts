/**
 * AsyncAPI 3.0 Document Type Definitions
 *
 * Strongly-typed model for the AsyncAPI 3.0.0 specification.
 * Replaces Record<string, unknown> throughout the emitter.
 * Based on https://www.asyncapi.com/docs/reference/specification/v3.0.0
 */

export type Ref = { $ref: string };

export interface InfoObject {
  title: string;
  version: string;
  description?: string;
}

export interface ServerObject {
  host: string;
  protocol: string;
  protocolVersion?: string;
  pathname?: string;
  description?: string;
  title?: string;
  summary?: string;
  variables?: Record<string, { enum?: string[]; default?: string; description?: string }>;
  security?: SecurityScheme[];
  tags?: Tag[];
  bindings?: Record<string, unknown>;
}

export interface ChannelObject {
  address: string | null;
  messages?: Record<string, Ref>;
  title?: string;
  summary?: string;
  description?: string;
  servers?: Ref[];
  parameters?: Record<string, ParameterObject | Ref>;
  tags?: Tag[];
  bindings?: Record<string, unknown>;
}

export interface OperationObject {
  action: "send" | "receive";
  channel: Ref;
  title?: string;
  summary?: string;
  description?: string;
  security?: SecurityScheme[];
  tags?: Tag[];
  bindings?: Record<string, unknown>;
  traits?: Ref[];
  messages?: Ref[];
  reply?: OperationReply;
}

export interface OperationReply {
  address?: { location: string; description?: string } | Ref;
  channel?: Ref;
  messages?: Ref[];
}

export interface MessageObject {
  headers?: SchemaObject | Ref;
  payload?: SchemaObject | Ref;
  correlationId?: CorrelationIdObject | Ref;
  contentType?: string;
  name?: string;
  title?: string;
  summary?: string;
  description?: string;
  tags?: Tag[];
  bindings?: Record<string, unknown>;
  traits?: Ref[];
  examples?: Array<{ headers?: unknown; payload?: unknown }>;
}

export interface SchemaObject {
  type?: string;
  format?: string;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  description?: string;
  items?: SchemaObject;
  enum?: unknown[];
  anyOf?: SchemaObject[];
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  additionalProperties?: boolean | SchemaObject;
  const?: unknown;
  $ref?: string;
  [key: string]: unknown;
}

export interface CorrelationIdObject {
  location: string;
  description?: string;
}

export interface ParameterObject {
  location?: string;
  description?: string;
  schema?: SchemaObject;
  enum?: unknown[];
  default?: unknown;
  examples?: unknown[];
}

export interface Tag {
  name: string;
  description?: string;
}

export interface SecurityScheme {
  type: string;
  description?: string;
  name?: string;
  in?: string;
  scheme?: string;
  bearerFormat?: string;
  flows?: Record<string, unknown>;
  openIdConnectUrl?: string;
}

export interface ComponentsObject {
  schemas?: Record<string, SchemaObject>;
  servers?: Record<string, ServerObject | Ref>;
  channels?: Record<string, ChannelObject | Ref>;
  operations?: Record<string, OperationObject | Ref>;
  messages?: Record<string, MessageObject | Ref>;
  securitySchemes?: Record<string, SecurityScheme | Ref>;
  parameters?: Record<string, ParameterObject | Ref>;
  correlationIds?: Record<string, CorrelationIdObject | Ref>;
  tags?: Record<string, Tag | Ref>;
}

export interface AsyncAPIDocument {
  asyncapi: "3.0.0";
  info: InfoObject;
  id?: string;
  servers?: Record<string, ServerObject>;
  defaultContentType?: string;
  channels: Record<string, ChannelObject>;
  operations?: Record<string, OperationObject>;
  components?: ComponentsObject;
}
