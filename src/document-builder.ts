/**
 * AsyncAPI 3.1 Document Builder
 *
 * Assembles the final AsyncAPI document from decorator state
 * and generated JSON schemas. Handles channel discovery, message
 * registration, operation mapping, and the $ref chain.
 *
 * AsyncAPI 3.1 $ref chain:
 *   operations.{opId}.messages[] -> #/channels/{channelId}/messages/{messageId}
 *   channels.{channelId}.messages.{messageId} -> #/components/messages/{messageId}
 *   components.messages.{messageId}.payload -> #/components/schemas/{schemaName}
 */

import type { Program, Type } from "@typespec/compiler";
import { isStdNamespace, listServices } from "@typespec/compiler";
import type { AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import { normalizeProtocol } from "./constants/protocols.js";
import {
  getLatestBindingVersion,
  hasProtocolBindings,
  normalizeBindingProtocol,
} from "./constants/binding-versions.js";
import type { AsyncAPIConsolidatedState, OperationTypeData, ProtocolConfigData } from "./state.js";
import type {
  AsyncAPIDocument,
  ChannelObject,
  ComponentsObject,
  MessageObject,
  OperationObject,
  OperationAction,
  ParameterObject,
  ProtocolBindings,
  SchemaObject,
  SecurityScheme,
  ServerObject,
} from "./domain/models/asyncapi-document.js";
import {
  ref,
  refSchema,
  refMessage,
  refChannel,
  escapeRefToken,
} from "./domain/models/asyncapi-document.js";

export const ASYNCAPI_SPEC_VERSION = "3.1.0";

const OAUTH2_FLOW_KEYS = [
  "implicit",
  "password",
  "clientCredentials",
  "authorizationCode",
] as const;

/**
 * Normalize OAuth2 flows: AsyncAPI 3.1 uses `availableScopes` (not `scopes`).
 * Accept both as input; always output `availableScopes`.
 */
function normalizeOAuth2Scopes(scheme: SecurityScheme): SecurityScheme {
  if (!scheme.flows) return scheme;
  const flows = { ...scheme.flows };
  for (const key of OAUTH2_FLOW_KEYS) {
    const flow = flows[key];
    if (!flow) continue;
    const raw = flow as Record<string, unknown>;
    if ("scopes" in raw && !("availableScopes" in raw)) {
      const { scopes, ...rest } = raw;
      flows[key] = { ...rest, availableScopes: scopes } as typeof flow;
    }
  }
  return { ...scheme, flows };
}

function inferActionFromName(name: string): OperationAction {
  const lower = name.toLowerCase();
  if (
    lower.startsWith("publish") ||
    lower.startsWith("send") ||
    lower.startsWith("emit") ||
    lower.startsWith("produce")
  ) {
    return "send";
  }
  return "receive";
}

/** Map a decorator-declared operation type to an AsyncAPI OperationAction. */
function operationAction(type: OperationTypeData["type"]): OperationAction {
  return type === "publish" ? "send" : "receive";
}

/** Extract the name from a TypeSpec Type, if it has one. */
function nameOfType(type: Type): string | undefined {
  if ("name" in type && typeof type.name === "string") return type.name;
  return undefined;
}

/** Extract the return model name from an Operation type, if any. */
function returnModelName(type: Type): string | undefined {
  if (type.kind !== "Operation") return undefined;
  const rt = type.returnType;
  if ("name" in rt && typeof rt.name === "string" && rt.name && rt.kind !== "Operation") {
    return rt.name;
  }
  return undefined;
}

/** Extract channel path parameters from an address string. */
function extractChannelParameters(address: string): Record<string, ParameterObject> | undefined {
  const matches = address.match(/\{([^}]+)\}/g);
  if (!matches || matches.length === 0) return undefined;
  const params: Record<string, ParameterObject> = {};
  for (const match of matches) {
    const paramName = match.slice(1, -1);
    params[paramName] = { description: `Channel parameter: ${paramName}` };
  }
  return params;
}

/** Build protocol-specific channel bindings from a ProtocolConfigData entry. */
function buildProtocolBinding(data: ProtocolConfigData): ProtocolBindings {
  const bindingKey = normalizeBindingProtocol(data.protocol);
  const bindingData: Record<string, unknown> = { ...data.binding };
  if (hasProtocolBindings(bindingKey) && bindingData.bindingVersion === undefined) {
    bindingData.bindingVersion = getLatestBindingVersion(bindingKey);
  }
  return { [bindingKey]: bindingData };
}

export function buildAsyncAPIDocument(
  state: AsyncAPIConsolidatedState,
  schemas: Record<string, SchemaObject>,
  options: AsyncAPIEmitterOptions,
  program: Program,
): AsyncAPIDocument {
  const channels: Record<string, ChannelObject> = {};
  const operations: Record<string, OperationObject> = {};
  const servers: Record<string, ServerObject> = {};
  const messages: Record<string, MessageObject> = {};
  const securitySchemes: Record<string, SecurityScheme> = {};

  type DiscoveredOp = {
    opName: string;
    channelKey: string;
    action: OperationAction;
    messageName: string;
  };

  const discoveredOps: DiscoveredOp[] = [];

  function ensureChannel(channelKey: string): ChannelObject {
    if (!channels[channelKey]) {
      const params = extractChannelParameters(channelKey);
      channels[channelKey] = {
        address: channelKey,
        messages: {},
        ...(params ? { parameters: params } : {}),
      };
    }
    return channels[channelKey];
  }

  function registerMessage(
    messageName: string,
    channelKey: string,
    msgData?: { title?: string; description?: string; contentType?: string },
  ): void {
    if (!messages[messageName]) {
      messages[messageName] = {
        name: msgData?.title ?? messageName,
        contentType: msgData?.contentType ?? "application/json",
        ...(msgData?.description ? { summary: msgData.description } : {}),
        payload: refSchema(messageName),
      };
    }
    const channel = ensureChannel(channelKey);
    const channelMsgs = channel.messages ?? {};
    channelMsgs[messageName] = refMessage(messageName);
    channel.messages = channelMsgs;
  }

  // 1a. Operations from @publish/@subscribe + @channel decorators
  const opToChannel = new Map<string, string>();
  for (const [type, data] of state.channels) {
    const name = nameOfType(type);
    if (!name) continue;
    opToChannel.set(name, data.path);
  }

  for (const [type, data] of state.operations) {
    const name = nameOfType(type);
    if (!name) continue;
    const channelKey = opToChannel.get(name) ?? name;
    const messageName = data.messageType ?? returnModelName(type) ?? name;

    discoveredOps.push({
      opName: name,
      channelKey,
      action: operationAction(data.type),
      messageName,
    });
  }

  // 1b. Channels with @channel but no @publish/@subscribe
  const opsWithType = new Set([...state.operations.keys()].map((t) => nameOfType(t)));
  for (const [type, data] of state.channels) {
    const name = nameOfType(type);
    if (!name) continue;
    if (opsWithType.has(name)) continue;
    const channelKey = data.path;
    const messageName = returnModelName(type) ?? name;
    discoveredOps.push({
      opName: name,
      channelKey,
      action: inferActionFromName(name),
      messageName,
    });
  }

  // 1c. Bare operations (no decorators at all)
  const allKnownOps = new Set(
    [...state.operations.keys(), ...state.channels.keys()].map((t) => nameOfType(t)),
  );
  const globalNs = program.getGlobalNamespaceType();
  const namespaces = [globalNs, ...globalNs.namespaces.values()];
  for (const ns of namespaces) {
    if (ns.name && isStdNamespace(ns)) continue;
    for (const [opName, op] of ns.operations) {
      if (allKnownOps.has(opName)) continue;
      const messageName = returnModelName(op) ?? opName;
      discoveredOps.push({
        opName,
        channelKey: opName,
        action: inferActionFromName(opName),
        messageName,
      });
    }
  }

  // === Step 2: Build channels, operations, and messages ===

  for (const op of discoveredOps) {
    registerMessage(op.messageName, op.channelKey);

    const operationObj: OperationObject = {
      action: op.action,
      channel: refChannel(op.channelKey),
      messages: [
        ref(
          `#/channels/${escapeRefToken(op.channelKey)}/messages/${escapeRefToken(op.messageName)}`,
        ),
      ],
    };

    const opType = [...state.operations.keys(), ...state.channels.keys()].find(
      (t) => nameOfType(t) === op.opName,
    );
    if (opType) {
      const tags = state.tags.get(opType);
      if (tags && tags.length > 0) {
        operationObj.tags = tags;
      }

      const bindings = state.protocolBindings.get(opType);
      if (bindings && Object.keys(bindings).length > 0) {
        operationObj.bindings = bindings;
      }
    }

    operations[op.opName] = operationObj;
  }

  // 2b. Merge in explicit @message decorator data
  for (const [type, data] of state.messages) {
    const msgData = data;
    const name = nameOfType(type);
    if (!name) continue;
    const msgKey = msgData.messageId ?? name;
    const msgObj: MessageObject = {
      name: msgData.title ?? name,
      contentType: msgData.contentType ?? "application/json",
      ...(msgData.description ? { summary: msgData.description } : {}),
      payload: refSchema(name),
    };

    const correlation = state.correlationIds.get(type);
    if (correlation) {
      msgObj.correlationId = { location: correlation.location };
    }

    const headers = state.messageHeaders.get(type);
    if (headers && headers.length > 0) {
      const headerProps: Record<string, SchemaObject> = {};
      for (const h of headers) {
        headerProps[h.name] = {
          type: h.type ?? "string",
          ...(h.description ? { description: h.description } : {}),
        };
      }
      msgObj.headers = {
        type: "object",
        properties: headerProps,
      };
    }

    const msgBindings = state.protocolBindings.get(type);
    if (msgBindings && Object.keys(msgBindings).length > 0) {
      msgObj.bindings = msgBindings;
    }

    messages[msgKey] = msgObj;
  }

  // 2c. Apply decorators to auto-registered messages
  for (const [type] of [
    ...state.correlationIds,
    ...state.messageHeaders,
    ...state.protocolBindings,
    ...state.tags,
  ]) {
    const typeName = nameOfType(type);
    if (!typeName || !messages[typeName]) continue;

    const msg = messages[typeName];

    const correlation = state.correlationIds.get(type);
    if (correlation && !msg.correlationId) {
      msg.correlationId = { location: correlation.location };
    }

    const headers = state.messageHeaders.get(type);
    if (headers && headers.length > 0 && !msg.headers) {
      const headerProps: Record<string, SchemaObject> = {};
      for (const h of headers) {
        headerProps[h.name] = {
          type: h.type ?? "string",
          ...(h.description ? { description: h.description } : {}),
        };
      }
      msg.headers = { type: "object", properties: headerProps };
    }

    const msgBindings = state.protocolBindings.get(type);
    if (msgBindings && Object.keys(msgBindings).length > 0 && !msg.bindings) {
      msg.bindings = msgBindings;
    }

    const msgTags = state.tags.get(type);
    if (msgTags && msgTags.length > 0 && !msg.tags) {
      msg.tags = msgTags;
    }
  }

  // 2d. Attach protocol bindings to channels
  for (const [type, data] of state.protocolConfigs) {
    const name = nameOfType(type);
    if (!name) continue;
    const channelKey = opToChannel.get(name) ?? name;
    if (data.protocol && channels[channelKey]) {
      channels[channelKey].bindings = buildProtocolBinding(data);
    }
  }

  // Build servers from state
  for (const [_type, data] of state.servers) {
    const serverEntries = Array.isArray(data) ? data : [data];
    for (const entry of serverEntries) {
      const serverData = entry;
      const server: ServerObject = {
        host: serverData.url,
        protocol: normalizeProtocol(serverData.protocol),
        description: serverData.description,
      };

      const varMatches = serverData.url?.match(/\{([^}]+)\}/g);
      if (varMatches && varMatches.length > 0) {
        const vars: Record<string, { default?: string; description?: string }> = {};
        for (const match of varMatches) {
          const varName = match.slice(1, -1);
          vars[varName] = { description: `Server variable: ${varName}` };
        }
        server.variables = vars;
      }

      servers[serverData.name] = server;
    }
  }

  // Build security schemes from state
  for (const [_type, data] of state.securityConfigs) {
    const entries = Array.isArray(data) ? data : [data];
    for (const secData of entries) {
      securitySchemes[secData.name] = normalizeOAuth2Scopes(secData.scheme);
    }
  }

  const components: ComponentsObject = {};
  if (Object.keys(messages).length > 0) components.messages = messages;
  if (Object.keys(schemas).length > 0) components.schemas = schemas;
  if (Object.keys(securitySchemes).length > 0) components.securitySchemes = securitySchemes;

  // Read @service title from TypeSpec core state (OpenAPI/HTTP migration compat)
  const services = listServices(program);
  const serviceTitle = services.length > 0 ? services[0]?.title : undefined;

  const document: AsyncAPIDocument = {
    asyncapi: ASYNCAPI_SPEC_VERSION,
    info: {
      title: options?.title ?? serviceTitle ?? "Generated API",
      version: options?.version ?? "1.0.0",
      description: options?.description,
    },
    ...(Object.keys(servers).length > 0 ? { servers } : {}),
    channels,
    operations: Object.keys(operations).length > 0 ? operations : undefined,
    components: Object.keys(components).length > 0 ? components : undefined,
  };

  return document;
}
