/**
 * Operation Discovery
 *
 * Scans TypeSpec decorator state and bare namespace operations to discover
 * all AsyncAPI operations, their channels, and message types.
 */

import { isStdNamespace } from "@typespec/compiler";
import {
  inferActionFromName,
  iterNamedTypes,
  namesOfTypes,
  operationAction,
  resolveMessageKey,
  returnModelTypes,
} from "./shared-utils.js";
import {
  getDoc,
  getSummary,
  nameOfType,
  type AsyncAPIConsolidatedState,
  type BuilderFn,
  type DocumentBuildContext,
} from "./_imports.js";

/**
 * Discover all operations from three sources:
 * 1a. @publish/@subscribe + @channel decorated operations
 * 1b. @channel-decorated operations without @publish/@subscribe
 * 1c. Bare operations (no decorators at all)
 *
 * Populates context.discoveredOps, context.opToChannel, context.channelDocs,
 * and context.opDocs.
 */
export const discoverOperations: BuilderFn = (state, ctx) => {
  discoverDecoratedOps(state, ctx);
  discoverChannelOnlyOps(state, ctx);
  discoverBareOps(state, ctx);
};

/** Resolve message names and schema names from an operation's return type. */
function resolveMessageInfo(
  type: { kind: string },
  state: AsyncAPIConsolidatedState,
  fallbackName: string,
): { messageNames: string[]; messageSchemaNames: string[] } {
  const models = returnModelTypes(type as never);
  if (models.length === 0) {
    return {
      messageNames: [fallbackName],
      messageSchemaNames: [fallbackName],
    };
  }
  return {
    messageNames: models.map((m) => resolveMessageKey(m, state.messages)),
    messageSchemaNames: models.map((m) => nameOfType(m) ?? fallbackName),
  };
}

/** 1a. Operations from @publish/@subscribe + @channel decorators. */
function discoverDecoratedOps(
  state: AsyncAPIConsolidatedState,
  ctx: DocumentBuildContext,
): void {
  for (const { type, name, data } of iterNamedTypes(state.channels)) {
    ctx.opToChannel.set(name, data.path);
    const doc = getDoc(ctx.program, type);
    if (doc) {
      ctx.channelDocs.set(data.path, doc);
    }
    const channelSummary = getSummary(ctx.program, type);
    if (channelSummary !== undefined) {
      ctx.channelSummaries.set(data.path, channelSummary);
    }
  }

  for (const { type, name, data } of iterNamedTypes(state.operations)) {
    const opId = state.operationIds.get(type);
    const opName = opId ?? name;
    const channelKey = ctx.opToChannel.get(name) ?? name;

    let { messageNames, messageSchemaNames } = resolveMessageInfo(
      type,
      state,
      opName,
    );
    if (data.messageType) {
      messageNames = [data.messageType];
      messageSchemaNames = [data.messageType];
    }

    const doc = getDoc(ctx.program, type);
    if (doc) {
      ctx.opDocs.set(opName, doc);
    }

    ctx.discoveredOps.push({
      action: operationAction(data.type),
      channelKey,
      messageNames,
      messageSchemaNames,
      opName,
    });
  }
}

/** Resolve the operation name from `@operationId` if present, else fall back to the type name. */
function resolveOpName(
  state: AsyncAPIConsolidatedState,
  type: unknown,
  fallback: string,
): string {
  return state.operationIds.get(type as never) ?? fallback;
}

/** 1b. Channels with @channel but no @publish/@subscribe. */
const discoverChannelOnlyOps: BuilderFn = (state, ctx) => {
  const opsWithType = namesOfTypes(state.operations);
  for (const { type, name, data } of iterNamedTypes(state.channels)) {
    if (opsWithType.has(name)) {
      continue;
    }
    const opName = resolveOpName(state, type, name);
    const channelKey = data.path;
    const info = resolveMessageInfo(type, state, opName);
    ctx.discoveredOps.push({
      action: inferActionFromName(name),
      channelKey,
      messageNames: info.messageNames,
      messageSchemaNames: info.messageSchemaNames,
      opName,
    });
  }
};

/** 1c. Bare operations (no decorators at all). */
const discoverBareOps: BuilderFn = (state, ctx) => {
  const allKnownOps = new Set([
    ...namesOfTypes(state.operations),
    ...namesOfTypes(state.channels),
  ]);
  const globalNs = ctx.program.getGlobalNamespaceType();
  const namespaces = [globalNs, ...globalNs.namespaces.values()];
  for (const ns of namespaces) {
    if (ns.name && isStdNamespace(ns)) {
      continue;
    }
    for (const [opName, op] of ns.operations) {
      if (allKnownOps.has(opName)) {
        continue;
      }
      const effectiveName = resolveOpName(state, op, opName);
      const info = resolveMessageInfo(op, state, effectiveName);
      const bareDoc = getDoc(ctx.program, op);
      if (bareDoc) {
        ctx.opDocs.set(effectiveName, bareDoc);
      }
      ctx.discoveredOps.push({
        action: inferActionFromName(opName),
        channelKey: opName,
        messageNames: info.messageNames,
        messageSchemaNames: info.messageSchemaNames,
        opName: effectiveName,
      });
    }
  }
};
