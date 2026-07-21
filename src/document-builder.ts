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
import { isStdNamespace } from "@typespec/compiler";
import type { AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import { normalizeProtocol } from "./constants/protocols.js";
import type { AsyncAPIConsolidatedState } from "./state.js";
import type {
  AsyncAPIDocument,
  ChannelObject,
  ComponentsObject,
  MessageObject,
  OperationObject,
  ParameterObject,
  SchemaObject,
  SecurityScheme,
  ServerObject,
} from "./domain/models/asyncapi-document.js";

export const ASYNCAPI_SPEC_VERSION = "3.1.0";

/** Escape a string for safe use as a JSON Pointer reference token (RFC 6901). */
function escapeRefToken(token: string): string {
  return token.replaceAll("~", "~0").replaceAll("/", "~1");
}

function inferActionFromName(name: string): "send" | "receive" {
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

  function getReturnModelName(type: unknown): string | undefined {
    const t = type as {
      returnType?: { name?: string; model?: { name?: string }; kind?: string } | undefined;
    };
    const rt = t?.returnType;
    if (!rt) return undefined;
    if (rt.name && rt.kind !== "Operation") return rt.name;
    return rt.model?.name;
  }

  type DiscoveredOp = {
    opName: string;
    channelKey: string;
    action: "send" | "receive";
    messageName: string;
  };

  const discoveredOps: DiscoveredOp[] = [];

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
        payload: { $ref: `#/components/schemas/${escapeRefToken(messageName)}` },
      };
    }
    const channel = ensureChannel(channelKey);
    const channelMsgs = channel.messages ?? {};
    channelMsgs[messageName] = { $ref: `#/components/messages/${escapeRefToken(messageName)}` };
    channel.messages = channelMsgs;
  }

  // 1a. Operations from @publish/@subscribe + @channel decorators
  const opToChannel = new Map<string, string>();
  for (const [type, data] of state.channels) {
    const channelData = data as { path?: string };
    const typeWithName = type as { name: string };
    const channelPath = channelData.path ?? typeWithName.name;
    opToChannel.set(typeWithName.name, channelPath);
  }

  for (const [type, data] of state.operations) {
    const opData = data as {
      type: string;
      messageType?: string;
    };
    const typeWithName = type as { name: string };
    const channelKey = opToChannel.get(typeWithName.name) ?? typeWithName.name;
    const messageName = opData.messageType ?? getReturnModelName(type) ?? typeWithName.name;

    discoveredOps.push({
      opName: typeWithName.name,
      channelKey,
      action: opData.type === "publish" ? "send" : "receive",
      messageName,
    });
  }

  // 1b. Channels with @channel but no @publish/@subscribe
  const opsWithType = new Set(
    [...state.operations.keys()].map((t) => (t as { name: string }).name),
  );
  for (const [type, data] of state.channels) {
    const typeWithName = type as { name: string };
    if (opsWithType.has(typeWithName.name)) continue;
    const channelData = data as { path?: string };
    const channelKey = channelData.path ?? typeWithName.name;
    const messageName = getReturnModelName(type) ?? typeWithName.name;
    discoveredOps.push({
      opName: typeWithName.name,
      channelKey,
      action: inferActionFromName(typeWithName.name),
      messageName,
    });
  }

  // 1c. Bare operations (no decorators at all)
  const allKnownOps = new Set(
    [...state.operations.keys(), ...state.channels.keys()].map(
      (t) => (t as Type & { name: string }).name,
    ),
  );
  const globalNs = program.getGlobalNamespaceType();
  const namespaces = [globalNs, ...globalNs.namespaces.values()];
  for (const ns of namespaces) {
    if (ns.name && isStdNamespace(ns)) continue;
    for (const [opName, op] of ns.operations) {
      if (allKnownOps.has(opName)) continue;
      const returnType = op.returnType as { model?: { name?: string } } | undefined;
      const messageName = returnType?.model?.name ?? opName;
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
      channel: { $ref: `#/channels/${escapeRefToken(op.channelKey)}` },
      messages: [
        {
          $ref: `#/channels/${escapeRefToken(op.channelKey)}/messages/${escapeRefToken(op.messageName)}`,
        },
      ],
    };

    const opType = [...state.operations.keys(), ...state.channels.keys()].find(
      (t) => (t as { name: string }).name === op.opName,
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
    const typeWithName = type as { name: string };
    const msgKey = msgData.messageId ?? typeWithName.name;
    const msgObj: MessageObject = {
      name: msgData.title ?? typeWithName.name,
      contentType: msgData.contentType ?? "application/json",
      ...(msgData.description ? { summary: msgData.description } : {}),
      payload: { $ref: `#/components/schemas/${escapeRefToken(typeWithName.name)}` },
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
    const typeName = (type as { name?: string }).name;
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
    const typeWithName = type as { name: string };
    const channelKey = opToChannel.get(typeWithName.name) ?? typeWithName.name;
    if (data.protocol && channels[channelKey]) {
      const channel = channels[channelKey];
      const canonicalProtocol = normalizeProtocol(data.protocol);
      channel.bindings = {
        [canonicalProtocol]: data.binding ?? {},
      };
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
    const secData = data;
    securitySchemes[secData.name] = secData.scheme;
  }

  const components: ComponentsObject = {};
  if (Object.keys(messages).length > 0) components.messages = messages;
  if (Object.keys(schemas).length > 0) components.schemas = schemas;
  if (Object.keys(securitySchemes).length > 0) components.securitySchemes = securitySchemes;

  const document: AsyncAPIDocument = {
    asyncapi: ASYNCAPI_SPEC_VERSION,
    info: {
      title: options?.title ?? "Generated API",
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
