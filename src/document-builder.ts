/**
 * AsyncAPI 3.1 Document Builder
 *
 * Thin orchestrator that delegates to focused builder modules.
 * Each builder is responsible for one concern: channels, operations,
 * messages, servers, and security schemes.
 *
 * AsyncAPI 3.1 $ref chain:
 *   operations.{opId}.messages[] -> #/channels/{channelId}/messages/{messageId}
 *   channels.{channelId}.messages.{messageId} -> #/components/messages/{messageId}
 *   components.messages.{messageId}.payload -> #/components/schemas/{schemaName}
 */

import { listServices } from "@typespec/compiler";
import type { Program } from "@typespec/compiler";
import type { AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import type { AsyncAPIConsolidatedState } from "./state.js";
import type {
  AsyncAPIDocument,
  ComponentsObject,
  JsonSchema,
} from "./domain/models/asyncapi-document.js";
import type { DocumentBuildContext } from "./builders/types.js";
import { discoverOperations } from "./builders/operation-discovery.js";
import {
  applyChannelDocs,
  attachChannelBindings,
} from "./builders/channel-builder.js";
import { buildOperations } from "./builders/operation-builder.js";
import { mergeExplicitMessages } from "./builders/message-builder.js";
import { buildServers } from "./builders/server-builder.js";
import { buildSecuritySchemes } from "./builders/security-builder.js";

export const ASYNCAPI_SPEC_VERSION = "3.1.0";

export function buildAsyncAPIDocument(
  state: AsyncAPIConsolidatedState,
  schemas: Record<string, JsonSchema>,
  options: AsyncAPIEmitterOptions,
  program: Program,
): AsyncAPIDocument {
  const ctx: DocumentBuildContext = {
    channels: {},
    discoveredOps: [],
    messages: {},
    operations: {},
    opDocs: new Map(),
    opToChannel: new Map(),
    channelDocs: new Map(),
    program,
    schemas,
    securitySchemes: {},
    servers: {},
  };

  discoverOperations(state, ctx);
  buildOperations(state, ctx);
  applyChannelDocs(ctx);
  mergeExplicitMessages(state, ctx);
  attachChannelBindings(state, ctx);
  buildServers(state, ctx);
  buildSecuritySchemes(state, ctx);

  const defaultContentType = getDefaultContentType(state);
  const apiVersion = getApiVersion(state);

  return assembleDocument(ctx, options, defaultContentType, apiVersion);
}

function getDefaultContentType(
  state: AsyncAPIConsolidatedState,
): string | undefined {
  for (const [, data] of state.defaultContentType) {
    return data.contentType;
  }
  return undefined;
}

function getApiVersion(state: AsyncAPIConsolidatedState): string | undefined {
  if (state.apiVersion.size > 0) {
    return [...state.apiVersion.values()][0];
  }
  return undefined;
}

function assembleDocument(
  ctx: DocumentBuildContext,
  options: AsyncAPIEmitterOptions,
  defaultContentType?: string,
  apiVersion?: string,
): AsyncAPIDocument {
  const components: ComponentsObject = {};
  if (Object.keys(ctx.messages).length > 0) {
    components.messages = ctx.messages;
  }
  if (Object.keys(ctx.schemas).length > 0) {
    components.schemas = ctx.schemas;
  }
  if (Object.keys(ctx.securitySchemes).length > 0) {
    components.securitySchemes = ctx.securitySchemes;
  }

  const services = listServices(ctx.program);
  const serviceTitle = services.length > 0 ? services[0]?.title : undefined;

  const stateApiVersion = apiVersion;

  return {
    asyncapi: ASYNCAPI_SPEC_VERSION,
    info: {
      description: options?.description,
      title: options?.title ?? serviceTitle ?? "Generated API",
      version: options?.version ?? stateApiVersion ?? "1.0.0",
    },
    ...(defaultContentType ? { defaultContentType } : {}),
    ...(Object.keys(ctx.servers).length > 0 ? { servers: ctx.servers } : {}),
    channels: ctx.channels,
    operations:
      Object.keys(ctx.operations).length > 0 ? ctx.operations : undefined,
    components: Object.keys(components).length > 0 ? components : undefined,
  };
}
