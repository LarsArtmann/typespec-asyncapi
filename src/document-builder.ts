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
import type { Program, Type } from "@typespec/compiler";
import { getVersion } from "@typespec/versioning";
import type { AsyncAPIEmitterOptions } from "./infrastructure/configuration/asyncAPIEmitterOptions.js";
import type { AsyncAPIConsolidatedState } from "./state.js";
import type {
  AsyncAPIDocument,
  ComponentsObject,
  JsonSchema,
  Tag,
} from "./domain/models/asyncapi-document.js";
import type { DocumentBuildContext } from "./builders/types.js";
import { discoverOperations } from "./builders/operation-discovery.js";
import { reportProgramDiagnostic } from "./decorator-helpers.js";
import { applyChannelDocs,
  attachChannelBindings,
  attachChannelServerRefs,
} from "./builders/channel-builder.js";
import { buildOperations } from "./builders/operation-builder.js";
import { mergeExplicitMessages } from "./builders/message-builder.js";
import { buildServers } from "./builders/server-builder.js";
import { buildSecuritySchemes } from "./builders/security-builder.js";
import { buildTags } from "./builders/tag-builder.js";
import {
  applyReusableRefs,
  buildReusableComponents,
} from "./builders/components-builder.js";

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
    channelSummaries: new Map(),
    channelTags: new Map(),
    program,
    schemas,
    securitySchemes: {},
    servers: {},
    tags: {},
    operationTraits: {},
    messageTraits: {},
    reusableParameters: {},
    reusableCorrelationIds: {},
    operationBindings: {},
    messageBindings: {},
    serverBindings: {},
    channelBindings: {},
  };

  discoverOperations(state, ctx);
  buildOperations(state, ctx);
  applyChannelDocs(ctx);
  mergeExplicitMessages(state, ctx);
  buildServers(state, ctx);
  attachChannelBindings(state, ctx);
  attachChannelServerRefs(state, ctx);
  buildSecuritySchemes(state, ctx);
  buildTags(state, ctx);
  buildReusableComponents(state, ctx);
  applyReusableRefs(state, ctx);

  const defaultContentType = getFirstWithConflictWarning(
    program,
    state.defaultContentType,
    (data) => data.contentType,
    "conflicting-default-content-type",
    (first, current) => ({ contentType: first, ignoredContentType: current }),
  );
  const apiVersion = getFirstWithConflictWarning(
    program,
    state.apiVersion,
    (data) => data,
    "conflicting-api-version",
    (first, current) => ({ version: first, ignoredVersion: current }),
  );
  const versionedVersion = getVersionedApiVersion(program);

  const document = assembleDocument(
    ctx,
    options,
    defaultContentType,
    apiVersion ?? versionedVersion,
  );

  const rootExtensions: Record<string, unknown> = {};
  for (const [type, extensions] of state.objectExtensions) {
    if ((type as { kind?: string }).kind === "Namespace") {
      Object.assign(rootExtensions, extensions);
    }
  }
  return Object.keys(rootExtensions).length > 0
    ? { ...document, ...rootExtensions }
    : document;
}

function getFirstWithConflictWarning<T, V>(
  program: Program,
  map: Map<Type, T>,
  getValue: (data: T) => V,
  code: "conflicting-default-content-type" | "conflicting-api-version",
  buildFormat: (firstValue: V, currentValue: V) => Record<string, unknown>,
): V | undefined {
  let firstValue: V | undefined;
  for (const [type, data] of map) {
    const value = getValue(data);
    if (firstValue === undefined) {
      firstValue = value;
      continue;
    }
    if (value !== firstValue) {
      reportProgramDiagnostic(program, {
        code,
        target: type,
        format: buildFormat(firstValue, value),
      });
      break;
    }
  }
  return firstValue;
}

function getVersionedApiVersion(program: Program): string | undefined {
  const globalNs = program.getGlobalNamespaceType();
  for (const ns of globalNs.namespaces.values()) {
    const versionMap = getVersion(program, ns);
    if (versionMap && versionMap.size > 0) {
      const versions = versionMap.getVersions();
      const latest = versions.at(-1);
      return latest?.value;
    }
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
  if (Object.keys(ctx.tags).length > 0) {
    components.tags = ctx.tags;
  }
  if (Object.keys(ctx.operationTraits).length > 0) {
    components.operationTraits = ctx.operationTraits;
  }
  if (Object.keys(ctx.messageTraits).length > 0) {
    components.messageTraits = ctx.messageTraits;
  }
  if (Object.keys(ctx.reusableParameters).length > 0) {
    components.parameters = ctx.reusableParameters;
  }
  if (Object.keys(ctx.reusableCorrelationIds).length > 0) {
    components.correlationIds = ctx.reusableCorrelationIds;
  }
  if (Object.keys(ctx.operationBindings).length > 0) {
    components.operationBindings = ctx.operationBindings;
  }
  if (Object.keys(ctx.messageBindings).length > 0) {
    components.messageBindings = ctx.messageBindings;
  }
  if (Object.keys(ctx.serverBindings).length > 0) {
    components.serverBindings = ctx.serverBindings;
  }
  if (Object.keys(ctx.channelBindings).length > 0) {
    components.channelBindings = ctx.channelBindings;
  }

  const services = listServices(ctx.program);
  const serviceTitle = services.length > 0 ? services[0]?.title : undefined;

  const infoTags: Tag[] | undefined =
    Object.keys(ctx.tags).length > 0 ? Object.values(ctx.tags) : undefined;

  return {
    asyncapi: ASYNCAPI_SPEC_VERSION,
    ...(options["asyncapi-id"] ? { id: options["asyncapi-id"] } : {}),
    info: {
      description: options.description,
      title: options.title ?? serviceTitle ?? "Generated API",
      version: options.version ?? apiVersion ?? "1.0.0",
      ...(options.contact ? { contact: options.contact } : {}),
      ...(options.license ? { license: options.license } : {}),
      ...(options.termsOfService
        ? { termsOfService: options.termsOfService }
        : {}),
      ...(options.externalDocs ? { externalDocs: options.externalDocs } : {}),
      ...(infoTags ? { tags: infoTags } : {}),
    },
    ...(defaultContentType ? { defaultContentType } : {}),
    ...(Object.keys(ctx.servers).length > 0 ? { servers: ctx.servers } : {}),
    channels: ctx.channels,
    operations:
      Object.keys(ctx.operations).length > 0 ? ctx.operations : undefined,
    components: Object.keys(components).length > 0 ? components : undefined,
  };
}
