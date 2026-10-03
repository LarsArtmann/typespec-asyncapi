/**
 * Operation Discovery
 *
 * Scans TypeSpec decorator state and bare namespace operations to discover
 * all AsyncAPI operations, their channels, and message types.
 */

import {
  isStdNamespace,
  type Namespace,
  type Operation,
  type Program,
  type Type,
} from "@typespec/compiler";
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
  type AsyncAPIConsolidatedState,
  getSummary,
  type BuilderFn,
  nameOfType,
  type DocumentBuildContext,
} from "./_imports.js";
import { schemaNameForType } from "../schema-ref.js";
import { findEnclosingServiceNamespace } from "./cross-emitter-validation.js";
import {
  type HttpRouteFacts,
  isHttpLibraryLoaded,
} from "./http-route-facts.js";
import {
  type ProgramDiagnostic,
  reportProgramDiagnostic,
} from "../decorator-helpers.js";

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
  type: Type,
  state: AsyncAPIConsolidatedState,
  fallbackName: string,
): { messageNames: string[]; messageSchemaNames: string[] } {
  const models = returnModelTypes(type);
  if (models.length === 0) {
    return {
      messageNames: [fallbackName],
      messageSchemaNames: [fallbackName],
    };
  }
  return {
    messageNames: models.map((m) => resolveMessageKey(m, state.messages)),
    messageSchemaNames: models.map(
      (m) => schemaNameForType(m) ?? nameOfType(m) ?? fallbackName,
    ),
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
    const channelTags = state.tags.get(type);
    if (channelTags && channelTags.length > 0) {
      ctx.channelTags.set(data.path, channelTags);
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
  type: Type,
  fallback: string,
): string {
  return state.operationIds.get(type) ?? fallback;
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
  // In mixed REST + events programs, bare operations under a @service namespace are REST operations.
  // Keep them out of the AsyncAPI document because @typespec/http routes them as REST endpoints.
  // The "decorated ops exist" guard keeps pure minimal specs (no @publish/@subscribe/@channel) unchanged.
  const restOpsAreInPlay =
    isHttpLibraryLoaded(ctx.program) &&
    (state.operations.size > 0 || state.channels.size > 0);
  // Ownership decision uses the resolved HTTP route table when readable.
  // Service containment is the fallback. A routed operation belongs to the
  // REST contract, never to the event document.
  const { httpRouteFacts } = ctx;
  const isHttpOwned = (op: Operation): boolean =>
    httpRouteFacts
      ? httpRouteFacts.isRouted(op)
      : findEnclosingServiceNamespace(ctx.program, op) !== undefined;
  let warnedAboutInference = false;
  const globalNs = ctx.program.getGlobalNamespaceType();
  const namespaces = collectNonStdNamespaces(globalNs);
  for (const ns of namespaces) {
    for (const [opName, op] of ns.operations) {
      if (allKnownOps.has(opName)) {
        continue;
      }
      if (restOpsAreInPlay && isHttpOwned(op)) {
        reportSkippedBareOp(ctx, op, opName, httpRouteFacts);
        if (httpRouteFacts === undefined && !warnedAboutInference) {
          warnedAboutInference = true;
          reportBareOpServiceDiagnostic(
            ctx.program,
            "bare-op-inference-deprecated",
            op,
            opName,
          );
        }
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

/** Every namespace in the subtree, with stdlib namespaces pruned. */
function collectNonStdNamespaces(root: Namespace): Namespace[] {
  const result: Namespace[] = [];
  const visit = (ns: Namespace): void => {
    if (ns.name && isStdNamespace(ns)) {
      return;
    }
    result.push(ns);
    for (const child of ns.namespaces.values()) {
      visit(child);
    }
  };
  visit(root);
  return result;
}

/** Signal the ownership decision for a bare operation claimed by http. */
function reportSkippedBareOp(
  ctx: DocumentBuildContext,
  op: Operation,
  opName: string,
  httpRouteFacts: HttpRouteFacts | undefined,
): void {
  const route = httpRouteFacts?.routeOf(op);
  if (route) {
    reportProgramDiagnostic(ctx.program, {
      code: "bare-op-assumed-rest",
      target: op,
      format: {
        operationName: opName,
        path: route.path,
        verb: route.verb.toUpperCase(),
      },
    });
    return;
  }
  reportBareOpServiceDiagnostic(
    ctx.program,
    "bare-op-assumed-rest",
    op,
    opName,
    "assumed",
  );
}

/** Report a bare-op diagnostic with operationName/serviceName interpolation. */
function reportBareOpServiceDiagnostic(
  program: Program,
  code: ProgramDiagnostic["code"],
  op: Operation,
  opName: string,
  messageId?: string,
): void {
  const service = findEnclosingServiceNamespace(program, op);
  reportProgramDiagnostic(program, {
    code,
    target: op,
    format: { operationName: opName, serviceName: service?.name ?? "" },
    messageId,
  });
}
