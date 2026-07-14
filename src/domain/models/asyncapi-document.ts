/**
 * AsyncAPI 3.0 Document Type Definitions
 *
 * Strongly-typed model for the AsyncAPI 3.0.0 specification.
 * Replaces Record<string, unknown> throughout the emitter.
 * Based on https://www.asyncapi.com/docs/reference/specification/v3.0.0
 */

export type Ref = { $ref: string };

/** Protocol-specific binding object keyed by protocol name. */
export type ProtocolBindings = Record<string, Record<string, unknown>>;

/** A single OAuth2 flow configuration. */
export type OAuth2Flow = {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
};

/** OAuth2 flow configurations keyed by flow type. */
export type OAuth2Flows = {
  implicit?: OAuth2Flow;
  password?: OAuth2Flow;
  clientCredentials?: OAuth2Flow;
  authorizationCode?: OAuth2Flow;
};

export type InfoObject = {
  title: string;
  version: string;
  description?: string;
};

export type ServerObject = {
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
  bindings?: ProtocolBindings;
};

export type ChannelObject = {
  address: string | null;
  messages?: Record<string, Ref>;
  title?: string;
  summary?: string;
  description?: string;
  servers?: Ref[];
  parameters?: Record<string, ParameterObject | Ref>;
  tags?: Tag[];
  bindings?: ProtocolBindings;
};

export type OperationObject = {
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
};

export type OperationReply = {
  address?: { location: string; description?: string } | Ref;
  channel?: Ref;
  messages?: Ref[];
};

export type MessageObject = {
  headers?: SchemaObject | Ref;
  payload?: SchemaObject | Ref;
  correlationId?: CorrelationIdObject | Ref;
  contentType?: string;
  name?: string;
  title?: string;
  summary?: string;
  description?: string;
  tags?: Tag[];
  bindings?: ProtocolBindings;
  traits?: Ref[];
  examples?: Array<{ headers?: unknown; payload?: unknown }>;
};

export type SchemaObject = {
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
};

export type CorrelationIdObject = {
  location: string;
  description?: string;
};

export type ParameterObject = {
  location?: string;
  description?: string;
  schema?: SchemaObject;
  enum?: unknown[];
  default?: unknown;
  examples?: unknown[];
};

export type Tag = {
  name: string;
  description?: string;
};

const SECURITY_SCHEME_TYPES = [
  "http",
  "apiKey",
  "oauth2",
  "openIdConnect",
  "mutualTLS",
  "plain",
  "scramSha256",
  "scramSha512",
  "gssapi",
  "external",
  "oauthBearer",
  "X509",
  "sasl",
] as const;

export type SecuritySchemeType = (typeof SECURITY_SCHEME_TYPES)[number];

export const VALID_SCHEME_TYPES: ReadonlySet<string> = new Set(SECURITY_SCHEME_TYPES);

export function isValidSchemeType(value: string): value is SecuritySchemeType {
  return VALID_SCHEME_TYPES.has(value);
}

export const SCHEME_TYPE_LIST: readonly SecuritySchemeType[] = SECURITY_SCHEME_TYPES;

export type SecurityScheme = {
  type: SecuritySchemeType;
  description?: string;
  name?: string;
  in?: "query" | "header" | "cookie";
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuth2Flows;
  openIdConnectUrl?: string;
};

export type ComponentsObject = {
  schemas?: Record<string, SchemaObject>;
  servers?: Record<string, ServerObject | Ref>;
  channels?: Record<string, ChannelObject | Ref>;
  operations?: Record<string, OperationObject | Ref>;
  messages?: Record<string, MessageObject | Ref>;
  securitySchemes?: Record<string, SecurityScheme | Ref>;
  parameters?: Record<string, ParameterObject | Ref>;
  correlationIds?: Record<string, CorrelationIdObject | Ref>;
  tags?: Record<string, Tag | Ref>;
};

export type AsyncAPIDocument = {
  asyncapi: "3.0.0";
  info: InfoObject;
  id?: string;
  servers?: Record<string, ServerObject>;
  defaultContentType?: string;
  channels: Record<string, ChannelObject>;
  operations?: Record<string, OperationObject>;
  components?: ComponentsObject;
};
