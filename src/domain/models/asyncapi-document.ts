/**
 * AsyncAPI 3.1 Document Type Definitions
 *
 * Strongly-typed model for the AsyncAPI 3.1.0 specification.
 * Replaces Record<string, unknown> throughout the emitter.
 * Based on https://www.asyncapi.com/docs/reference/specification/v3.1.0
 */

import type { AsyncAPIProtocol } from "../../constants/protocols.js";
export type { AsyncAPIEmitterOptions } from "../../infrastructure/configuration/asyncAPIEmitterOptions.js";

export interface Ref {
  $ref: string;
}

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

/** Construct a `$ref` into `#/components/operationTraits/{name}` (RFC 6901-escaped). */
export function refOperationTrait(name: string): Ref {
  return { $ref: `#/components/operationTraits/${escapeRefToken(name)}` };
}

/** Construct a `$ref` into `#/components/messageTraits/{name}` (RFC 6901-escaped). */
export function refMessageTrait(name: string): Ref {
  return { $ref: `#/components/messageTraits/${escapeRefToken(name)}` };
}

/** Construct a `$ref` into `#/components/parameters/{name}` (RFC 6901-escaped). */
export function refParameter(name: string): Ref {
  return { $ref: `#/components/parameters/${escapeRefToken(name)}` };
}

/** Construct a `$ref` into `#/components/correlationIds/{name}` (RFC 6901-escaped). */
export function refCorrelationId(name: string): Ref {
  return { $ref: `#/components/correlationIds/${escapeRefToken(name)}` };
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
export interface OAuth2Flow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  availableScopes: Record<string, string>;
}

/** OAuth2 flow configurations keyed by flow type. */
export interface OAuth2Flows {
  implicit?: OAuth2Flow;
  password?: OAuth2Flow;
  clientCredentials?: OAuth2Flow;
  authorizationCode?: OAuth2Flow;
}

export interface InfoObject {
  title: string;
  version: string;
  description?: string;
  contact?: ContactObject;
  license?: LicenseObject;
  termsOfService?: string;
  externalDocs?: ExternalDocumentationObject;
  tags?: Tag[];
}

export interface ContactObject {
  name?: string;
  email?: string;
  url?: string;
}

export interface LicenseObject {
  name: string;
  url?: string;
}

export interface ExternalDocumentationObject {
  url: string;
  description?: string;
}

/**
 * Security Requirement Object — maps a security scheme name (defined in
 * `components.securitySchemes`) to the list of scopes required.
 * @see https://www.asyncapi.com/docs/reference/specification/v3.1.0#securityRequirementObject
 */
export type SecurityRequirement = Record<string, string[]>;

/**
 * Common metadata fields that AsyncAPI 3.1 spec mandates or permits on
 * Server, Channel, Operation, and Message objects. Extracted as a shared
 * interface to eliminate structural duplication across these object types.
 *
 * @see https://www.asyncapi.com/docs/reference/specification/v3.1.0
 */
export interface CommonMetadata {
  title?: string;
  summary?: string;
  description?: string;
  tags?: Tag[];
  bindings?: ProtocolBindings | Ref;
}

export interface ServerObject extends CommonMetadata {
  host: string;
  protocol: AsyncAPIProtocol;
  protocolVersion?: string;
  pathname?: string;
  variables?: Record<
    string,
    { enum?: string[]; default?: string; description?: string }
  >;
  security?: SecurityRequirement[];
}

export interface ChannelObject extends CommonMetadata {
  address: string | null;
  messages?: Record<string, Ref>;
  servers?: Ref[];
  parameters?: Record<string, ParameterObject | Ref>;
}

export interface OperationObject extends CommonMetadata {
  action: OperationAction;
  channel: Ref;
  security?: SecurityRequirement[];
  traits?: Ref[];
  messages?: Ref[];
  reply?: OperationReply;
}

export interface OperationReply {
  address?: { location: string; description?: string } | Ref;
  channel?: Ref;
  messages?: Ref[];
}

export interface MessageObject extends CommonMetadata {
  headers?: JsonSchema | Ref;
  payload?: JsonSchema | Ref;
  correlationId?: CorrelationIdObject | Ref;
  contentType?: string;
  name?: string;
  traits?: Ref[];
  schemaFormat?: string;
  examples?: {
    headers?: unknown;
    payload?: unknown;
    name?: string;
    summary?: string;
  }[];
}

/**
 * A JSON Schema object following draft-07 / OpenAPI 3.x conventions.
 *
 * Structurally compatible with AsyncAPI Schema Object and OpenAPI Schema Object.
 * The index signature allows specification extensions (`x-*` keys).
 */
export interface JsonSchema {
  type?: string;
  format?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  description?: string;
  items?: JsonSchema | JsonSchema[];
  enum?: unknown[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  not?: JsonSchema;
  additionalProperties?: boolean | JsonSchema;
  const?: unknown;
  $ref?: string;
  title?: string;
  default?: unknown;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  uniqueItems?: boolean;
  example?: unknown;
  examples?: unknown[];
  discriminator?: string;
  externalDocs?: { url: string; description?: string };
  [key: string]: unknown;
}

export interface CorrelationIdObject {
  location: string;
  description?: string;
}

export interface ParameterObject {
  location?: string;
  description?: string;
  enum?: string[];
  default?: string;
  examples?: string[];
}

export interface Tag {
  name: string;
  description?: string;
  externalDocs?: ExternalDocumentationObject;
}

/** Shared metadata fields available on both trait types and their parent objects. */
type TraitMetadata = Pick<
  CommonMetadata,
  "title" | "summary" | "description" | "tags" | "bindings"
>;

/**
 * Operation Trait Object — fields shared across operations.
 * @see https://www.asyncapi.com/docs/reference/specification/v3.1.0#operationTraitObject
 */
export type OperationTraitObject = TraitMetadata & {
  security?: SecurityRequirement[];
};

/**
 * Message Trait Object — fields shared across messages.
 * @see https://www.asyncapi.com/docs/reference/specification/v3.1.0#messageTraitObject
 */
export type MessageTraitObject = TraitMetadata &
  Pick<MessageObject, "headers" | "correlationId" | "contentType" | "name">;

/** Security Requirement Object — defined later, forward-declared here. */

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

export const VALID_SCHEME_TYPES: ReadonlySet<SecuritySchemeType> = new Set(
  SECURITY_SCHEME_TYPES,
);

export function isValidSchemeType(value: string): value is SecuritySchemeType {
  return VALID_SCHEME_TYPES.has(value as SecuritySchemeType);
}

export const SCHEME_TYPE_LIST: readonly SecuritySchemeType[] =
  SECURITY_SCHEME_TYPES;

export interface SecurityScheme {
  type: SecuritySchemeType;
  description?: string;
  name?: string;
  in?: "query" | "header" | "cookie";
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuth2Flows;
  openIdConnectUrl?: string;
}

export interface ComponentsObject {
  schemas?: Record<string, JsonSchema>;
  servers?: Record<string, ServerObject | Ref>;
  channels?: Record<string, ChannelObject | Ref>;
  operations?: Record<string, OperationObject | Ref>;
  messages?: Record<string, MessageObject | Ref>;
  securitySchemes?: Record<string, SecurityScheme | Ref>;
  parameters?: Record<string, ParameterObject | Ref>;
  correlationIds?: Record<string, CorrelationIdObject | Ref>;
  operationTraits?: Record<string, OperationTraitObject | Ref>;
  messageTraits?: Record<string, MessageTraitObject | Ref>;
  serverBindings?: Record<string, ProtocolBindings>;
  channelBindings?: Record<string, ProtocolBindings>;
  operationBindings?: Record<string, ProtocolBindings>;
  messageBindings?: Record<string, ProtocolBindings>;
  tags?: Record<string, Tag | Ref>;
}

export interface AsyncAPIDocument extends DocumentBody {
  asyncapi: "3.1.0";
  channels: Record<string, ChannelObject>;
}

/**
 * Shared body fields of an AsyncAPI document (everything except the
 * `asyncapi` version literal and the required `channels` map).
 *
 * Both `AsyncAPIDocument` and `ParsedAsyncAPIDocument` extend this so the
 * field set stays in sync.
 */
interface DocumentBody {
  info: InfoObject;
  id?: string;
  servers?: Record<string, ServerObject>;
  defaultContentType?: string;
  operations?: Record<string, OperationObject>;
  components?: ComponentsObject;
}

/**
 * Parsed AsyncAPI 3.1 document from YAML/JSON output.
 *
 * Relaxed version of `AsyncAPIDocument` for use with deserialized output
 * where literal types are widened (e.g. `asyncapi` is `string`, not `"3.1.0"`)
 * and `channels` is optional (deserialized output may be missing it).
 * Eliminates `as any` casts in test assertions.
 */
export interface ParsedAsyncAPIDocument extends DocumentBody {
  asyncapi: "3.1.0";
  channels?: Record<string, ChannelObject>;
}
