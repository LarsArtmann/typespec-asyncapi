/**
 * AsyncAPI 3.1 Document Type Definitions
 *
 * Strongly-typed model for the AsyncAPI 3.1.0 specification.
 * Replaces Record<string, unknown> throughout the emitter.
 * Based on https://www.asyncapi.com/docs/reference/specification/v3.1.0
 */

import type { AsyncAPIProtocol } from "../../constants/protocols.js";

export type Ref = { $ref: string };

/** Construct a `$ref` object pointing into the AsyncAPI document. */
export function ref(pointer: string): Ref {
  return { $ref: pointer };
}

/** Construct a `$ref` into `#/components/schemas/{name}` (RFC 6901-escaped). */
export function refSchema(name: string): Ref {
  return { $ref: `#/components/schemas/${escapeRefToken(name)}` };
}

/** Construct a `$ref` into `#/components/messages/{name}` (RFC 6901-escaped). */
export function refMessage(name: string): Ref {
  return { $ref: `#/components/messages/${escapeRefToken(name)}` };
}

/** Construct a `$ref` into `#/channels/{name}` (RFC 6901-escaped). */
export function refChannel(name: string): Ref {
  return { $ref: `#/channels/${escapeRefToken(name)}` };
}

/** Escape a string for safe use as a JSON Pointer reference token (RFC 6901). */
export function escapeRefToken(token: string): string {
  return token.replaceAll("~", "~0").replaceAll("/", "~1");
}

/** AsyncAPI 3.1 operation action — the direction of message flow. */
export type OperationAction = "send" | "receive";

/** Protocol-specific binding object keyed by protocol name. */
export type ProtocolBindings = Record<string, Record<string, unknown>>;

/**
 * A single OAuth2 flow configuration.
 *
 * AsyncAPI 3.1 uses `availableScopes` (not `scopes`) — a map of
 * scope name to human-readable description.
 * @see https://www.asyncapi.com/docs/reference/specification/v3.1.0#oauthFlowObject
 */
export type OAuth2Flow = {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  availableScopes: Record<string, string>;
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

/**
 * Security Requirement Object — maps a security scheme name (defined in
 * `components.securitySchemes`) to the list of scopes required.
 * @see https://www.asyncapi.com/docs/reference/specification/v3.1.0#securityRequirementObject
 */
export type SecurityRequirement = Record<string, string[]>;

export type ServerObject = {
  host: string;
  protocol: AsyncAPIProtocol;
  protocolVersion?: string;
  pathname?: string;
  description?: string;
  title?: string;
  summary?: string;
  variables?: Record<string, { enum?: string[]; default?: string; description?: string }>;
  security?: SecurityRequirement[];
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
  action: OperationAction;
  channel: Ref;
  title?: string;
  summary?: string;
  description?: string;
  security?: SecurityRequirement[];
  tags?: Tag[];
  bindings?: ProtocolBindings;
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
  "apiKey",
  "asymmetricEncryption",
  "gssapi",
  "http",
  "httpApiKey",
  "oauth2",
  "openIdConnect",
  "plain",
  "scramSha256",
  "scramSha512",
  "symmetricEncryption",
  "userPassword",
  "X509",
] as const;

export type SecuritySchemeType = (typeof SECURITY_SCHEME_TYPES)[number];

export const VALID_SCHEME_TYPES: ReadonlySet<SecuritySchemeType> = new Set(SECURITY_SCHEME_TYPES);

export function isValidSchemeType(value: string): value is SecuritySchemeType {
  return VALID_SCHEME_TYPES.has(value as SecuritySchemeType);
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
  asyncapi: "3.1.0";
  info: InfoObject;
  id?: string;
  servers?: Record<string, ServerObject>;
  defaultContentType?: string;
  channels: Record<string, ChannelObject>;
  operations?: Record<string, OperationObject>;
  components?: ComponentsObject;
};
