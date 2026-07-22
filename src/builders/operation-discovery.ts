/**
 * Operation Discovery
 *
 * Scans TypeSpec decorator state and bare namespace operations to discover
 * all AsyncAPI operations, their channels, and message types.
 */

import { getDoc, isStdNamespace } from "@typespec/compiler";
import type { AsyncAPIConsolidatedState } from "../state.js";
import type { DocumentBuildContext } from "./types.js";
import { nameOfType } from "./types.js";
import { inferActionFromName, operationAction, returnModelNames } from "./shared-utils.js";

/**
 * Discover all operations from three sources:
 * 1a. @publish/@subscribe + @channel decorated operations
 * 1b. @channel-decorated operations without @publish/@subscribe
 * 1c. Bare operations (no decorators at all)
 *
 * Populates context.discoveredOps, context.opToChannel, context.channelDocs,
 * and context.opDocs.
 */
export function discoverOperations(
  state: AsyncAPIConsolidatedState,
  ctx: DocumentBuildContext,
): void {
  discoverDecoratedOps(state, ctx);
  discoverChannelOnlyOps(state, ctx);
  discoverBareOps(state, ctx);
}

/** 1a. Operations from @publish/@subscribe + @channel decorators. */
function discoverDecoratedOps(
  state: AsyncAPIConsolidatedState,
  ctx: DocumentBuildContext,
): void {
  for (const [type, data] of state.channels) {
    const name = nameOfType(type);
    if (!name) {
      continue;
    }
    ctx.opToChannel.set(name, data.path);
    const doc = getDoc(ctx.program, type);
    if (doc) {
      ctx.channelDocs.set(data.path, doc);
    }
  }

  for (const [type, data] of state.operations) {
    const name = nameOfType(type);
    if (!name) {
      continue;
    }
    const channelKey = ctx.opToChannel.get(name) ?? name;
    const returnNames = returnModelNames(type);
    const messageNames = data.messageType
      ? [data.messageType]
      : returnNames.length > 0
        ? returnNames
        : [name];

    const doc = getDoc(ctx.program, type);
    if (doc) {
      ctx.opDocs.set(name, doc);
    }

    ctx.discoveredOps.push({
      action: operationAction(data.type),
      channelKey,
      messageNames,
      opName: name,
    });
  }
}

/** 1b. Channels with @channel but no @publish/@subscribe. */
function discoverChannelOnlyOps(
  state: AsyncAPIConsolidatedState,
  ctx: DocumentBuildContext,
): void {
  const opsWithType = new Set(
    [...state.operations.keys()].map((t) => nameOfType(t)),
  );
  for (const [type, data] of state.channels) {
    const name = nameOfType(type);
    if (!name || opsWithType.has(name)) {
      continue;
    }
    const channelKey = data.path;
    const returnNames = returnModelNames(type);
    const messageNames = returnNames.length > 0 ? returnNames : [name];
    ctx.discoveredOps.push({
      action: inferActionFromName(name),
      channelKey,
      messageNames,
      opName: name,
    });
  }
}

/** 1c. Bare operations (no decorators at all). */
function discoverBareOps(
  state: AsyncAPIConsolidatedState,
  ctx: DocumentBuildContext,
): void {
  const allKnownOps = new Set(
    [...state.operations.keys(), ...state.channels.keys()].map((t) =>
      nameOfType(t),
    ),
  );
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
      const returnNames = returnModelNames(op);
      const messageNames = returnNames.length > 0 ? returnNames : [opName];
      const bareDoc = getDoc(ctx.program, op);
      if (bareDoc) {
        ctx.opDocs.set(opName, bareDoc);
      }
      ctx.discoveredOps.push({
        action: inferActionFromName(opName),
        channelKey: opName,
        messageNames,
        opName,
      });
    }
  }
}
